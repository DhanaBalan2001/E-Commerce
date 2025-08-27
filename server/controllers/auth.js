import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { generateToken } from '../utils/jwt.js';
import { generateOTP, generateOTPExpiry } from '../utils/otp.js';
import { sendOTPEmail, sendWelcomeEmail, sendAdminPasswordResetOTP } from '../utils/email.js';

export const sendOTPController = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ 
                message: 'Email is required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Please enter a valid email address'
            });
        }

        const otp = generateOTP();
        const otpExpiry = generateOTPExpiry();
        // Find or create user
        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            user = new User({ 
                email: email.toLowerCase(),
                name: `User_${Date.now()}` // Temporary name
            });
        }

        // Rate limiting check
        if (user.otp && user.otp.lastSentAt) {
            const timeSinceLastOTP = Date.now() - user.otp.lastSentAt.getTime();
            if (timeSinceLastOTP < 60000) { // 1 minute cooldown
                return res.status(429).json({
                    message: 'Please wait 1 minute before requesting another OTP',
                    retryAfter: Math.ceil((60000 - timeSinceLastOTP) / 1000)
                });
            }
        }

        user.otp = {
            code: otp,
            expiresAt: otpExpiry,
            attempts: 0,
            lastSentAt: new Date()
        };
        await user.save();
        // Send OTP via Email
        const emailResult = await sendOTPEmail(email, otp, user.name);
        res.status(200).json({
            message: 'OTP sent successfully',
            expiresIn: 600,
            success: true,
            provider: emailResult.provider,
            // For development, include OTP in response
            ...(process.env.NODE_ENV === 'development' && { otp })
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
};

export const verifyOTPController = async (req, res) => {
    try {
        const { email, otp, name } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found. Please request OTP first.' });
        }
        if (!user.otp || !user.otp.code) {
            return res.status(400).json({ message: 'No OTP found. Please request a new OTP.' });
        }

        if (user.otp.attempts >= 5) {
            return res.status(429).json({ 
                message: 'Too many failed attempts. Please request a new OTP.'
            });
        }

        if (user.otp.expiresAt < new Date()) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
        }

        if (user.otp.code !== otp) {
            user.otp.attempts += 1;
            await user.save();
            return res.status(400).json({ 
                message: 'Invalid OTP',
                attemptsLeft: 5 - user.otp.attempts
            });
        }

        // OTP verified successfully
        const isNewUser = !user.isVerified;
        
        user.isVerified = true;
        user.lastLogin = new Date();
        
        if (name && name.trim()) {
            user.name = name.trim();
        }
        
        user.otp = undefined;
        await user.save();
        // Send welcome email for new users
        if (isNewUser) {
            await sendWelcomeEmail(user.email, user.name);
        }

        const token = generateToken({ 
            id: user._id, 
            email: user.email,
            type: 'user'
        });
        const responseData = {
            message: 'OTP verified successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phoneNumber: user.phoneNumber,
                isVerified: user.isVerified
            },
            isNewUser
        };
        res.status(200).json(responseData);

    } catch (error) {
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-otp');
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { name, phoneNumber } = req.body;
        
        const user = await User.findById(req.user.id);
        if (name) user.name = name;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        
        await user.save();
        
        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createFirstAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            return res.status(400).json({ 
                message: 'Admin already exists. Use admin login to create more admins.',
                existingAdminsCount: adminCount
            });
        }

        if (!name || !email || !password) {
            return res.status(400).json({ 
                message: 'Name, email, and password are required' 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Please provide a valid email address' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters long' 
            });
        }

        const admin = new Admin({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: 'super_admin',
            permissions: [
                'manage_products',
                'manage_orders',
                'manage_users',
                'manage_categories',
                'manage_admins',
                'view_analytics',
                'manage_settings'
            ],
            isActive: true
        });

        await admin.save();

        const token = generateToken({ 
            id: admin._id, 
            email: admin.email, 
            role: admin.role,
            type: 'admin'
        });

        res.status(201).json({
            message: 'First admin created successfully! You are now logged in.',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions,
                createdAt: admin.createdAt
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Email already exists' 
            });
        }
        
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
};

export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email and password are required' 
            });
        }

        // Find admin with optimized query
        const admin = await Admin.findOne({ 
            email: email.toLowerCase().trim() 
        }).select('+password').lean();
        
        if (!admin) {
            return res.status(401).json({ 
                message: 'Invalid credentials'
            });
        }

        if (!admin.isActive) {
            return res.status(401).json({ 
                message: 'Account is deactivated. Contact system administrator.' 
            });
        }

        // Use the Admin model to compare password
        const adminDoc = await Admin.findById(admin._id);
        const isPasswordValid = await adminDoc.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Invalid credentials'
            });
        }

        // Update last login asynchronously
        Admin.findByIdAndUpdate(admin._id, { lastLogin: new Date() }).exec();

        const token = generateToken({ 
            id: admin._id, 
            email: admin.email, 
            role: admin.role,
            type: 'admin'
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
                permissions: admin.permissions,
                lastLogin: new Date()
            }
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Login failed. Please try again.'
        });
    }
};

export const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        res.status(200).json({ admin });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateAdminProfile = async (req, res) => {
    try {
        const { name, email, phone, department } = req.body;
        
        const admin = await Admin.findById(req.admin.id);
        
        // Check if email is being updated and if it already exists
        if (email && email.toLowerCase().trim() !== admin.email) {
            const existingAdmin = await Admin.findOne({ 
                email: email.toLowerCase().trim(),
                _id: { $ne: admin._id }
            });
            if (existingAdmin) {
                return res.status(400).json({ 
                    message: 'Email already exists' 
                });
            }
            admin.email = email.toLowerCase().trim();
        }
        
        if (name) admin.name = name.trim();
        if (phone !== undefined) admin.phone = phone.trim();
        if (department !== undefined) admin.department = department.trim();
        
        await admin.save();
        
        res.status(200).json({
            message: 'Profile updated successfully',
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                department: admin.department,
                role: admin.role
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Email already exists' 
            });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const changeAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: 'New password must be at least 6 characters long' 
            });
        }

        const admin = await Admin.findById(req.admin.id);
        
        const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ 
                message: 'Current password is incorrect' 
            });
        }

        admin.password = newPassword;
        await admin.save();
        
        res.status(200).json({
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
export const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Generate reset token
    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 600000); // 10 minutes

    admin.resetPasswordToken = resetOTP;
    admin.resetPasswordExpires = resetExpires;
    await admin.save();

    // In production, send email with reset link
    // For now, just return success
    res.json({ 
      message: 'Password reset OTP sent to your email',
      success: true,
      emailSent: (await sendAdminPasswordResetOTP(email, resetOTP, admin.name)).success,
      provider: (await sendAdminPasswordResetOTP(email, resetOTP, admin.name)).provider
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const adminResetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;

    const admin = await Admin.findOne({
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    admin.password = newPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};