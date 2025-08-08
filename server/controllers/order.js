import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../utils/razorpay.js';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '../utils/email.js';

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

        // If Razorpay payment, create Razorpay order
        if (paymentMethod === 'razorpay') {
            const razorpayResult = await createRazorpayOrder(total);
            if (!razorpayResult.success) {
                return res.status(500).json({ 
                    message: 'Failed to create payment order',
                    error: razorpayResult.error 
                });
            }

            order.paymentInfo.razorpayOrderId = razorpayResult.order.id;
            await order.save();

            return res.status(201).json({
                message: 'Order created successfully',
                order,
                razorpayOrder: razorpayResult.order,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID
            });
        }

        // For COD orders, deduct stock after order confirmation
        if (paymentMethod === 'cod') {
            order.status = 'confirmed';
            await order.save();
            
            // Deduct stock only after order is confirmed
            for (const item of orderItems) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: -item.quantity }
                });
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
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { 
            razorpayOrderId, 
            razorpayPaymentId, 
            razorpaySignature,
            orderId 
        } = req.body;

        // Verify signature
        const isValidSignature = verifyRazorpaySignature(
            razorpayOrderId, 
            razorpayPaymentId, 
            razorpaySignature
        );

        if (!isValidSignature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Update order
        const order = await Order.findById(orderId).populate('user');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.paymentInfo.razorpayPaymentId = razorpayPaymentId;
        order.paymentInfo.razorpaySignature = razorpaySignature;
        order.paymentInfo.status = 'completed';
        order.paymentInfo.paidAt = new Date();
        order.status = 'confirmed';

        await order.save();

        // Update product stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        // Send payment confirmation email to user
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

        // Send order notification to admins
        await sendAdminOrderNotification(order, order.user, orderDetails);

        // Clear user's cart
        await User.findByIdAndUpdate(order.user._id, { cart: [] });

        res.status(200).json({
            message: 'Payment verified successfully',
            order,
            notifications: {
                email: 'sent'
            }
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

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

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('user', 'name email')
            .select('orderNumber status createdAt pricing.total user items.name items.quantity paymentInfo.method');

        const total = await Order.countDocuments(query);

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
    
    console.log('Fetching order with ID:', id);

    const order = await Order.findById(id)
      .populate('user', 'name email phone phoneNumber')
      .populate({
        path: 'items.product',
        select: 'name price images category',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

    if (!order) {
      console.log('Order not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Order found:', order);

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get admin order by ID error:', error);
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
    console.error('Export orders error:', error);
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
        console.error('Track order error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};