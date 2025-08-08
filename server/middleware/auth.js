import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

export const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT);
        
        if (decoded.type !== 'user') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        const user = await User.findById(decoded.id).select('-otp');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is deactivated' });
        }

        // Check if token is close to expiry and refresh if needed
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp - now;
        
        if (timeUntilExpiry < 3600) { // Less than 1 hour remaining
            const newToken = jwt.sign(
                { id: user._id, type: 'user' },
                process.env.JWT,
                { expiresIn: '24h' }
            );
            res.setHeader('X-New-Token', newToken);
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired', expired: true });
        }
        res.status(401).json({ message: 'Invalid token' });
    }
};

export const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT);
        
        if (decoded.type !== 'admin') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) {
            return res.status(401).json({ message: 'Admin not found' });
        }

        if (!admin.isActive) {
            return res.status(401).json({ message: 'Admin account is deactivated' });
        }

        // Check if token is close to expiry and refresh if needed
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp - now;
        
        if (timeUntilExpiry < 3600) { // Less than 1 hour remaining
            const newToken = jwt.sign(
                { id: admin._id, type: 'admin' },
                process.env.JWT,
                { expiresIn: '24h' }
            );
            res.setHeader('X-New-Token', newToken);
        }

        req.admin = admin;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired', expired: true });
        }
        res.status(401).json({ message: 'Invalid token' });
    }
};

export const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ message: 'Admin authentication required' });
        }

        if (req.admin.role === 'super_admin') {
            return next(); // Super admin has all permissions
        }

        if (!req.admin.permissions.includes(permission)) {
            return res.status(403).json({ 
                message: `Access denied. Required permission: ${permission}` 
            });
        }

        next();
    };
};
