import User from '../models/User.js';
import Product from '../models/Product.js';

export const getCart = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('cart.product', 'name price images stock');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Handle regular products, bundles, and gift boxes
        const validCartItems = [];
        const Bundle = (await import('../models/Bundle.js')).default;
        const GiftBox = (await import('../models/GiftBox.js')).default;
        
        for (const item of user.cart) {
            if (item.bundleInfo && item.bundleInfo.bundleId) {
                // Handle bundle items
                try {
                    const bundle = await Bundle.findById(item.bundleInfo.bundleId);
                    if (bundle && bundle.isActive) {
                        validCartItems.push({
                            _id: item._id,
                            quantity: item.quantity,
                            addedAt: item.addedAt,
                            bundleInfo: {
                                bundleId: bundle._id,
                                bundleName: bundle.name,
                                bundlePrice: bundle.price,
                                isBundle: true
                            }
                        });
                    }
                } catch (bundleError) {
                }
            } else if (item.giftBoxInfo && item.giftBoxInfo.giftBoxId) {
                // Handle gift box items
                try {
                    const giftBox = await GiftBox.findById(item.giftBoxInfo.giftBoxId);
                    if (giftBox && giftBox.isActive) {
                        validCartItems.push({
                            _id: item._id,
                            quantity: item.quantity,
                            addedAt: item.addedAt,
                            giftBoxInfo: {
                                giftBoxId: giftBox._id,
                                giftBoxName: giftBox.name,
                                giftBoxPrice: giftBox.price,
                                isGiftBox: true
                            }
                        });
                    }
                } catch (giftBoxError) {
                }
            } else if (item.product) {
                // Handle regular products
                validCartItems.push(item);
            }
        }

        const cartTotal = validCartItems.reduce((total, item) => {
            if (item.bundleInfo?.bundlePrice) {
                return total + (item.bundleInfo.bundlePrice * item.quantity);
            } else if (item.giftBoxInfo?.giftBoxPrice) {
                return total + (item.giftBoxInfo.giftBoxPrice * item.quantity);
            } else if (item.product) {
                return total + (item.product.price * item.quantity);
            }
            return total;
        }, 0);

        const itemCount = validCartItems.reduce((sum, item) => {
            if (item.bundleInfo?.bundleId || item.giftBoxInfo?.giftBoxId) {
                return sum + 1; // Count bundle/gift box as 1 item regardless of quantity
            }
            return sum + item.quantity; // Count regular products by quantity
        }, 0);

        res.status(200).json({
            cart: validCartItems,
            cartTotal,
            itemCount
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user.id;

        if (!productId || quantity <= 0) {
            return res.status(400).json({ message: 'Valid product ID and quantity required' });
        }

        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({ message: 'Product not found or unavailable' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (!user.cart) user.cart = [];

        // Find existing regular product (not bundle/gift box)
        const existingItem = user.cart.find(item => 
            item.product && 
            !item.bundleInfo?.bundleId && 
            !item.giftBoxInfo?.giftBoxId && 
            item.product.toString() === productId
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.stock) {
                return res.status(400).json({ 
                    message: 'Insufficient stock',
                    availableStock: product.stock,
                    currentInCart: existingItem.quantity
                });
            }
            existingItem.quantity = newQuantity;
            existingItem.addedAt = new Date();
        } else {

            if (quantity > product.stock) {
                return res.status(400).json({ 
                    message: 'Insufficient stock',
                    availableStock: product.stock
                });
            }
            user.cart.push({
                product: productId,
                quantity,
                addedAt: new Date()
            });
        }

        user.markModified('cart');
        await user.save();

        res.status(200).json({
            message: 'Product added to cart successfully',
            cartItemCount: user.cart.length,
            addedQuantity: quantity,
            totalQuantityInCart: existingItem ? existingItem.quantity : quantity
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than 0' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ 
                message: 'Insufficient stock',
                availableStock: product.stock
            });
        }

        // Update cart
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Ensure cart is initialized and clean
        if (!user.cart) {
            user.cart = [];
        }
        
        // Clean up any invalid cart items
        user.cart = user.cart.filter(item => {
            return item.product || item.bundleInfo || item.giftBoxInfo;
        });

        // Find cart item considering both product ID and bundle info
        const cartItem = user.cart.find(item => {
            // Skip bundle/gift box items for regular product updates
            if (item.bundleInfo && item.bundleInfo.isBundle) {
                return false;
            }
            if (item.giftBoxInfo && item.giftBoxInfo.isGiftBox) {
                return false;
            }
            // Skip items without product
            if (!item.product) {
                return false;
            }
            return item.product.toString() === productId;
        });

        if (!cartItem) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        cartItem.quantity = quantity;
        cartItem.addedAt = new Date();
        await user.save();

        res.status(200).json({
            message: 'Cart updated successfully',
            updatedQuantity: quantity
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const initialCartLength = user.cart.length;
        // Remove specific cart item (this should use cart item ID in the future)
        // For now, remove the first matching product
        const itemIndex = user.cart.findIndex(
            item => item.product.toString() === productId
        );
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }
        
        user.cart.splice(itemIndex, 1);

        if (user.cart.length === initialCartLength) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        await user.save();

        res.status(200).json({
            message: 'Product removed from cart successfully',
            cartItemCount: user.cart.length
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const addBundleToCart = async (req, res) => {
    try {
        const { bundleId, quantity = 1 } = req.body;
        const userId = req.user.id;

        if (!bundleId) {
            return res.status(400).json({ message: 'Bundle ID is required' });
        }

        // Verify bundle exists
        const Bundle = (await import('../models/Bundle.js')).default;
        const bundle = await Bundle.findById(bundleId);
        if (!bundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }

        if (!bundle.isActive) {
            return res.status(400).json({ message: 'Bundle is not available' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.cart) user.cart = [];

        // Check if bundle already exists in cart
        const existingBundleItem = user.cart.find(item => 
            item.bundleInfo && item.bundleInfo.bundleId && item.bundleInfo.bundleId.toString() === bundleId
        );

        if (existingBundleItem) {
            existingBundleItem.quantity += quantity;
            existingBundleItem.addedAt = new Date();
        } else {
            // Add bundle as special cart item without product ID
            user.cart.push({
                quantity,
                addedAt: new Date(),
                bundleInfo: {
                    bundleId,
                    bundleName: bundle.name,
                    bundlePrice: bundle.price,
                    isBundle: true
                }
            });
        }

        await user.save();

        res.status(200).json({
            message: 'Bundle added to cart successfully',
            cartItemCount: user.cart.length
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const addGiftBoxToCart = async (req, res) => {
    try {
        const { giftBoxId, quantity = 1 } = req.body;
        const userId = req.user.id;

        if (!giftBoxId) {
            return res.status(400).json({ message: 'Gift Box ID is required' });
        }

        // Verify gift box exists
        const GiftBox = (await import('../models/GiftBox.js')).default;
        const giftBox = await GiftBox.findById(giftBoxId);
        if (!giftBox) {
            return res.status(404).json({ message: 'Gift box not found' });
        }

        if (!giftBox.isActive) {
            return res.status(400).json({ message: 'Gift box is not available' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.cart) user.cart = [];

        // Check if gift box already exists in cart
        const existingGiftBoxItem = user.cart.find(item => 
            item.giftBoxInfo && item.giftBoxInfo.giftBoxId && item.giftBoxInfo.giftBoxId.toString() === giftBoxId
        );

        if (existingGiftBoxItem) {
            existingGiftBoxItem.quantity += quantity;
            existingGiftBoxItem.addedAt = new Date();
        } else {
            // Add gift box as special cart item without product ID
            user.cart.push({
                quantity,
                addedAt: new Date(),
                giftBoxInfo: {
                    giftBoxId,
                    giftBoxName: giftBox.name,
                    giftBoxPrice: giftBox.price,
                    isGiftBox: true
                }
            });
        }

        await user.save();

        res.status(200).json({
            message: 'Gift box added to cart successfully',
            cartItemCount: user.cart.length
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const removeBundleFromCart = async (req, res) => {
    try {
        const { bundleId } = req.params;
        const userId = req.user.id;

        if (!bundleId) {
            return res.status(400).json({ message: 'Bundle ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const initialCartLength = user.cart.length;
        // Remove bundle from cart
        user.cart = user.cart.filter(item => 
            !(item.bundleInfo && item.bundleInfo.bundleId && item.bundleInfo.bundleId.toString() === bundleId)
        );

        if (user.cart.length === initialCartLength) {
            return res.status(404).json({ message: 'Bundle not found in cart' });
        }

        await user.save();

        res.status(200).json({
            message: 'Bundle removed from cart successfully',
            cartItemCount: user.cart.length
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const removeGiftBoxFromCart = async (req, res) => {
    try {
        const { giftBoxId } = req.params;
        const userId = req.user.id;

        if (!giftBoxId) {
            return res.status(400).json({ message: 'Gift Box ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const initialCartLength = user.cart.length;
        // Remove gift box from cart
        user.cart = user.cart.filter(item => 
            !(item.giftBoxInfo && item.giftBoxInfo.giftBoxId && item.giftBoxInfo.giftBoxId.toString() === giftBoxId)
        );

        if (user.cart.length === initialCartLength) {
            return res.status(404).json({ message: 'Gift box not found in cart' });
        }

        await user.save();

        res.status(200).json({
            message: 'Gift box removed from cart successfully',
            cartItemCount: user.cart.length
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateBundleQuantity = async (req, res) => {
    try {
        const { bundleId, quantity } = req.body;
        const userId = req.user.id;

        if (!bundleId || quantity <= 0) {
            return res.status(400).json({ message: 'Bundle ID and valid quantity are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const bundleItem = user.cart.find(item => 
            item.bundleInfo && item.bundleInfo.bundleId && item.bundleInfo.bundleId.toString() === bundleId
        );

        if (!bundleItem) {
            return res.status(404).json({ message: 'Bundle not found in cart' });
        }

        bundleItem.quantity = quantity;
        bundleItem.addedAt = new Date();
        await user.save();

        res.status(200).json({
            message: 'Bundle quantity updated successfully',
            updatedQuantity: quantity
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateGiftBoxQuantity = async (req, res) => {
    try {
        const { giftBoxId, quantity } = req.body;
        const userId = req.user.id;

        if (!giftBoxId || quantity <= 0) {
            return res.status(400).json({ message: 'Gift Box ID and valid quantity are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const giftBoxItem = user.cart.find(item => 
            item.giftBoxInfo && item.giftBoxInfo.giftBoxId && item.giftBoxInfo.giftBoxId.toString() === giftBoxId
        );

        if (!giftBoxItem) {
            return res.status(404).json({ message: 'Gift box not found in cart' });
        }

        giftBoxItem.quantity = quantity;
        giftBoxItem.addedAt = new Date();
        await user.save();

        res.status(200).json({
            message: 'Gift box quantity updated successfully',
            updatedQuantity: quantity
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByIdAndUpdate(
            userId, 
            { cart: [] },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Cart cleared successfully',
            cartItemCount: 0
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
