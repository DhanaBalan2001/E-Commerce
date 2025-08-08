import User from '../models/User.js';
import Product from '../models/Product.js';

export const getCart = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('cart.product', 'name price images stock');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Filter out products that no longer exist
        const validCartItems = user.cart.filter(item => item.product);

        if (validCartItems.length !== user.cart.length) {
            user.cart = validCartItems;
            await user.save();
        }

        const cartTotal = validCartItems.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);

        res.status(200).json({
            cart: validCartItems,
            cartTotal,
            itemCount: validCartItems.length
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
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

        if (!product.isActive) {
            return res.status(400).json({ message: 'Product is not available' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ 
                message: 'Insufficient stock',
                availableStock: product.stock
            });
        }

        // Get user and check cart
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const existingCartItem = user.cart.find(
            item => item.product.toString() === productId
        );

        if (existingCartItem) {
            const newQuantity = existingCartItem.quantity + quantity;
            if (newQuantity > product.stock) {
                return res.status(400).json({ 
                    message: 'Insufficient stock',
                    availableStock: product.stock,
                    currentInCart: existingCartItem.quantity
                });
            }
            existingCartItem.quantity = newQuantity;
            existingCartItem.addedAt = new Date();
        } else {
            user.cart.push({ 
                product: productId, 
                quantity,
                addedAt: new Date()
            });
        }

        await user.save();

        res.status(200).json({
            message: 'Product added to cart successfully',
            cartItemCount: user.cart.length,
            addedQuantity: quantity,
            totalQuantityInCart: existingCartItem ? existingCartItem.quantity : quantity,
            note: 'Stock will be reserved only when order is placed'
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

        const cartItem = user.cart.find(
            item => item.product.toString() === productId
        );

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
        user.cart = user.cart.filter(
            item => item.product.toString() !== productId
        );

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
