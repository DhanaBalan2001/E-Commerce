import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Bundle from '../models/Bundle.js';
import GiftBox from '../models/GiftBox.js';
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendOrderConfirmationEmail, sendAdminOrderNotification, sendLowStockAlert } from '../utils/email.js';

export const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;
        const userId = req.user.id;

        // Get user details for notifications
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate products and calculate total
        let subtotal = 0;
        const orderItems = [];

        // Check stock availability for all items first (atomic check)
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.product} not found` });
            }
            
            if (!product.isActive) {
                return res.status(400).json({ message: `Product ${product.name} is not available` });
            }
            
            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
                });
            }

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price,
                name: product.name,
                image: product.images[0]?.data || null
            });
        }

        // Calculate pricing
        const tax = subtotal * 0.18; // 18% GST
        const shipping = subtotal > 1000 ? 0 : 50; // Free shipping above ₹1000
        const total = subtotal + tax + shipping;

        // Create order
        const order = new Order({
            user: userId,
            items: orderItems,
            shippingAddress,
            paymentInfo: {
                method: paymentMethod,
                status: paymentMethod === 'cod' ? 'pending' : 'pending'
            },
            pricing: {
                subtotal,
                tax,
                shipping,
                total
            }
        });

        await order.save();

        // For bank transfer, set status to verification pending
        if (paymentMethod === 'bank_transfer') {
            order.paymentInfo.status = 'verification_pending';
            order.status = 'pending';
            await order.save();
        }

        // For COD orders, deduct stock after order confirmation
        if (paymentMethod === 'cod') {
            order.status = 'confirmed';
            await order.save();
            
            // Deduct stock only after order is confirmed
            for (const item of orderItems) {
                const product = await Product.findById(item.product).populate('category', 'name');
                if (product && product.stock >= item.quantity) {
                    const updatedProduct = await Product.findByIdAndUpdate(item.product, {
                        $inc: { stock: -item.quantity }
                    }, { new: true }).populate('category', 'name');
                    
                    // Check for low stock (less than 10 units)
                    if (updatedProduct.stock <= 10 && updatedProduct.stock > 0) {
                        await sendLowStockAlert(updatedProduct);
                    }
                }
            }
        }

        // Send order confirmation email to user
        const orderDetails = {
            items: orderItems,
            pricing: { subtotal, tax, shipping, total }
        };

        await sendOrderConfirmationEmail(
            user.email, 
            order.orderNumber, 
            orderDetails, 
            user.name
        );

        // Send order notification to admins
        await sendAdminOrderNotification(order, user, orderDetails);

        // Clear user's cart
        user.cart = [];
        await user.save();

        res.status(201).json({
            message: 'Order created successfully',
            order,
            notifications: {
                email: 'sent'
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Configure multer for payment screenshot uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/payment-screenshots';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

export const createManualPaymentOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderData = JSON.parse(req.body.orderData);
        const screenshot = req.file;

        if (!screenshot) {
            return res.status(400).json({ 
                success: false, 
                message: 'Payment screenshot is required' 
            });
        }

        const { items, shippingAddress } = orderData;

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Validate items and calculate total
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            if (item.type === 'bundle' && item.bundleId) {
                // Handle bundle
                const bundle = await Bundle.findById(item.bundleId);
                if (!bundle) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Bundle not found` 
                    });
                }

                subtotal += bundle.price * item.quantity;
                orderItems.push({
                    bundleId: bundle._id,
                    quantity: item.quantity,
                    price: bundle.price,
                    name: bundle.name,
                    type: 'bundle',
                    image: null
                });
            } else if (item.type === 'giftbox' && item.giftBoxId) {
                // Handle gift box
                const giftBox = await GiftBox.findById(item.giftBoxId);
                if (!giftBox) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Gift box not found` 
                    });
                }

                subtotal += giftBox.price * item.quantity;
                orderItems.push({
                    giftBoxId: giftBox._id,
                    quantity: item.quantity,
                    price: giftBox.price,
                    name: giftBox.name,
                    type: 'giftbox',
                    image: null
                });
            } else if (item.type === 'product' && item.product) {
                // Handle regular product
                const product = await Product.findById(item.product);
                if (!product || !product.isActive || product.stock < item.quantity) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Product ${product?.name || 'unknown'} is not available` 
                    });
                }

                subtotal += product.price * item.quantity;
                orderItems.push({
                    product: product._id,
                    quantity: item.quantity,
                    price: product.price,
                    name: product.name,
                    type: 'product',
                    image: product.images[0]?.url || null
                });
            } else {
                return res.status(400).json({ 
                    success: false, 
                    message: `Invalid item type or missing item data` 
                });
            }
        }

        const tax = 0;
        const shipping = 0;
        const total = subtotal;

        // Create order with payment screenshot
        const order = new Order({
            user: userId,
            items: orderItems,
            shippingAddress,
            paymentInfo: {
                method: 'bank_transfer',
                status: 'verification_pending',
                paymentScreenshot: {
                    filename: screenshot.filename,
                    path: screenshot.path,
                    originalName: screenshot.originalname,
                    size: screenshot.size,
                    uploadedAt: new Date()
                }
            },
            pricing: { subtotal, tax, shipping, total },
            status: 'pending'
        });

        await order.save();

        // Clear user's cart
        user.cart = [];
        await user.save();

        // Populate order with user data for email
        await order.populate('user', 'name email phone phoneNumber');

        // Send admin payment verification notification with screenshot
        const orderDetails = {
            items: orderItems,
            pricing: { subtotal, tax, shipping, total }
        };
        order._isPaymentVerification = true;
        await sendAdminOrderNotification(order, order.user, orderDetails, screenshot.path);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully. Payment verification pending.',
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                paymentStatus: order.paymentInfo.status
            }
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
};

export const verifyManualPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { approved, adminNotes } = req.body;
        const adminId = req.admin.id;

        const order = await Order.findById(orderId).populate('user', 'name email');
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        if (order.paymentInfo.status !== 'verification_pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Order payment is not pending verification' 
            });
        }

        // Update order status immediately
        if (approved) {
            order.paymentInfo.status = 'completed';
            order.paymentInfo.verifiedBy = adminId;
            order.paymentInfo.verifiedAt = new Date();
            order.paymentInfo.paidAt = new Date();
            order.status = 'confirmed';
        } else {
            order.paymentInfo.status = 'failed';
            order.status = 'cancelled';
        }

        order.paymentInfo.adminNotes = adminNotes;
        order.statusHistory.push({
            status: order.status,
            note: approved ? 'Payment verified and approved' : 'Payment rejected',
            updatedBy: req.admin.name,
            timestamp: new Date()
        });

        await order.save();

        // Send immediate response
        res.status(200).json({
            success: true,
            message: approved ? 'Payment approved successfully' : 'Payment rejected',
            order: {
                _id: order._id,
                status: order.status,
                paymentInfo: {
                    status: order.paymentInfo.status
                }
            }
        });

        // Handle background tasks asynchronously (don't wait for them)
        if (approved) {
            setImmediate(async () => {
                try {
                    // Deduct stock in background
                    for (const item of order.items) {
                        if (item.product) {
                            await Product.findByIdAndUpdate(item.product, {
                                $inc: { stock: -item.quantity }
                            });
                        }
                    }
                    
                    // Send emails in background
                    const orderDetails = {
                        items: order.items,
                        pricing: order.pricing
                    };
                    
                    await sendOrderConfirmationEmail(
                        order.user.email,
                        order.orderNumber,
                        orderDetails,
                        order.user.name
                    );
                } catch (bgError) {
                }
            });
        }

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
};

export { upload };

export const getUserOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.id;

        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('items.product', 'name images');

        const total = await Order.countDocuments({ user: userId });

        res.status(200).json({
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('items.product', 'name images');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ order });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        const order = await Order.findOne({ _id: orderId, user: userId }).populate('user');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({ message: 'Order cannot be cancelled' });
        }

        order.status = 'cancelled';
        order.cancelReason = reason;
        order.statusHistory.push({
            status: 'cancelled',
            note: reason,
            timestamp: new Date()
        });

        await order.save();

        // Restore product stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }

        res.status(200).json({
            message: 'Order cancelled successfully',
            order
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin order controllers
export const getAllOrders = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            paymentStatus,
            startDate,
            endDate 
        } = req.query;

        const query = {};
        if (status) query.status = status;
        if (paymentStatus) query['paymentInfo.status'] = paymentStatus;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate('user', 'name email')
                .select('orderNumber status createdAt pricing paymentInfo items')
                .lean(),
            Order.countDocuments(query)
        ]);

        res.status(200).json({
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note, trackingNumber, carrier } = req.body;

        const order = await Order.findById(id).populate('user');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const oldStatus = order.status;
        order.status = status;
        order.statusHistory.push({
            status,
            note,
            updatedBy: req.admin.name,
            timestamp: new Date()
        });

        if (trackingNumber) {
            order.trackingInfo.trackingNumber = trackingNumber;
            order.trackingInfo.carrier = carrier;
        }

        if (status === 'delivered') {
            order.deliveryDate = new Date();
        }

        await order.save();

        // Real-time update via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(`order-${id}`).emit('orderStatusUpdate', {
                orderId: id,
                status,
                note,
                trackingNumber,
                timestamp: new Date()
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Make sure you have this function in your order controller
export const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('user', 'name email phone phoneNumber')
      .populate('paymentInfo.verifiedBy', 'name')
      .populate({
        path: 'items.product',
        select: 'name price images category',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

    if (!order) {

      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
};

export const exportOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email phone')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    let csv = 'Order ID,Customer Name,Email,Status,Total,Created Date\n';
    
    orders.forEach(order => {
      csv += `${order.orderNumber},${order.user?.name || 'N/A'},${order.user?.email || 'N/A'},${order.status},₹${order.pricing?.total || 0},${new Date(order.createdAt).toLocaleDateString()}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export orders',
      error: error.message
    });
  }
};

// Real-time order tracking
export const getOrderTracking = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .select('orderNumber status statusHistory trackingInfo deliveryDate createdAt');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            success: true,
            tracking: {
                orderNumber: order.orderNumber,
                status: order.status,
                statusHistory: order.statusHistory,
                trackingInfo: order.trackingInfo,
                deliveryDate: order.deliveryDate,
                createdAt: order.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Track order by order number and email (public endpoint)
export const trackOrder = async (req, res) => {
    try {
        const { orderNumber, email } = req.body;

        if (!orderNumber || !email) {
            return res.status(400).json({ 
                success: false,
                message: 'Order number and email are required' 
            });
        }

        const order = await Order.findOne({ orderNumber })
            .populate('user', 'name email')
            .populate('items.product', 'name images')
            .select('-paymentInfo.razorpaySignature');

        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }

        // Verify email matches
        if (order.user.email !== email) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }

        res.json({
            success: true,
            order
        });

    } catch (error) {

        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};