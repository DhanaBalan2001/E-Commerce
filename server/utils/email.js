import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

const initializeEmailService = () => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('📧 Email credentials not configured - Email will use mock mode');
            return false;
        }

        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        return true;
    } catch (error) {
        console.error('❌ Email service initialization failed:', error.message);
        return false;
    }
};

export const sendOTPEmail = async (email, otp, userName = 'User') => {
    try {
        if (!transporter) {
            const initialized = initializeEmailService();
            if (!initialized) {
                return sendOTPMockEmail(email, otp);
            }
        }

        const mailOptions = {
            from: {
                name: 'Sindhu Crackers',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Your OTP for Sindhu Crackers Shop Login',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>OTP Verification</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
                        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎆 Sindhu Crackers Shop</h1>
                            <p>Your OTP Verification Code</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${userName}!</h2>
                            <p>You requested to login to your Sindhu Crackers Shop account. Please use the OTP below to complete your login:</p>
                            
                            <div class="otp-box">
                                <div class="otp-code">${otp}</div>
                                <p><strong>Valid for 10 minutes</strong></p>
                            </div>
                            
                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong>
                                <ul>
                                    <li>Never share this OTP with anyone</li>
                                    <li>Sindhu Crackers Shop will never ask for your OTP over phone or email</li>
                                    <li>This OTP is valid for 10 minutes only</li>
                                </ul>
                            </div>
                            
                            <p>If you didn't request this OTP, please ignore this email or contact our support team.</p>
                        </div>
                        <div class="footer">
                            <p>© 2024 Sindhu Crackers Shop. All rights reserved.</p>
                            <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        return {
            success: true,
            messageId: info.messageId,
            message: 'OTP sent successfully',
            provider: 'gmail'
        };

    } catch (error) {
        console.error('❌ Email sending error:', error);
        return sendOTPMockEmail(email, otp);
    }
};

export const sendWelcomeEmail = async (email, userName) => {
    try {
        if (!transporter) {
            const initialized = initializeEmailService();
            if (!initialized) {
                return sendWelcomeMockEmail(email, userName);
            }
        }

        const mailOptions = {
            from: {
                name: 'Sindhu Crackers Shop',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Welcome to Sindhu Crackers Shop! 🎆',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to Sindhu Crackers Shop</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .welcome-box { background: #fff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; border: 2px solid #ff6b6b; }
                        .features { background: #fff; padding: 20px; border-radius: 10px; margin: 20px 0; }
                        .feature-item { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎆 Welcome to Sindhu Crackers Shop!</h1>
                            <p>Your account has been created successfully</p>
                        </div>
                        <div class="content">
                            <div class="welcome-box">
                                <h2>Hello ${userName}! 👋</h2>
                                <p>Thank you for joining Sindhu Crackers Shop - your one-stop destination for premium quality crackers and fireworks!</p>
                            </div>
                            
                            <div class="features">
                                <h3>🎯 What you can do now:</h3>
                                <div class="feature-item">
                                    <strong>🛍️ Browse Products:</strong> Explore our wide range of crackers, sparklers, and fireworks
                                </div>
                                <div class="feature-item">
                                    <strong>🛒 Easy Shopping:</strong> Add items to cart and checkout securely
                                </div>
                                <div class="feature-item">
                                    <strong>📦 Track Orders:</strong> Monitor your order status in real-time
                                </div>
                                <div class="feature-item">
                                    <strong>📍 Manage Addresses:</strong> Save multiple delivery addresses
                                </div>
                                <div class="feature-item">
                                    <strong>⭐ Reviews:</strong> Rate and review products
                                </div>
                            </div>
                            
                            <p><strong>🎉 Special Welcome Offer:</strong> Get free shipping on your first order above ₹1000!</p>
                            
                            <p>If you have any questions or need assistance, feel free to contact our support team.</p>
                        </div>
                        <div class="footer">
                            <p>© 2024 Sindhu Crackers Shop. All rights reserved.</p>
                            <p>Happy Shopping! 🎆</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        return {
            success: true,
            messageId: info.messageId,
            message: 'Welcome email sent successfully',
            provider: 'gmail'
        };

    } catch (error) {
        console.error('❌ Welcome email sending error:', error);
        return sendWelcomeMockEmail(email, userName);
    }
};

export const sendOrderConfirmationEmail = async (email, orderNumber, orderDetails, userName) => {
    try {
        if (!transporter) {
            const initialized = initializeEmailService();
            if (!initialized) {
                return sendOrderConfirmationMockEmail(email, orderNumber);
            }
        }

        const itemsHtml = orderDetails.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: {
                name: 'Sindhu Crackers Shop',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: `Order Confirmed - ${orderNumber} 🎉`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Order Confirmation</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .order-box { background: #fff; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #28a745; }
                        .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #fff; }
                        .order-table th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
                        .total-row { background: #f8f9fa; font-weight: bold; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                        .status-badge { background: #28a745; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Order Confirmed!</h1>
                            <p>Thank you for your order</p>
                        </div>
                        <div class="content">
                            <div class="order-box">
                                <h2>Hello ${userName}!</h2>
                                <p>Your order has been confirmed and is being processed. Here are your order details:</p>
                                
                                <p><strong>Order Number:</strong> <span class="status-badge">${orderNumber}</span></p>
                                <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                                <p><strong>Status:</strong> <span style="color: #28a745;">Confirmed</span></p>
                            </div>
                            
                            <table class="order-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th style="text-align: center;">Qty</th>
                                        <th style="text-align: right;">Price</th>
                                        <th style="text-align: right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                    <tr class="total-row" style="font-size: 18px;">
                                        <td colspan="3" style="padding: 15px; text-align: right;">Total Amount:</td>
                                        <td style="padding: 15px; text-align: right; color: #28a745;">₹${orderDetails.pricing.total.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <h3 style="color: #28a745; margin-top: 0;">📦 What's Next?</h3>
                                <ul style="margin: 0; padding-left: 20px;">
                                    <li>We'll process your order within 24 hours</li>
                                    <li>You'll receive a shipping confirmation email with tracking details</li>
                                    <li>Expected delivery: 3-5 business days</li>
                                    <li>You can track your order status in your account</li>
                                </ul>
                            </div>
                            
                            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <strong>🔥 Safety Reminder:</strong>
                                <p style="margin: 5px 0;">Please handle all fireworks with care and follow safety instructions. Keep away from children and use in open areas only.</p>
                            </div>
                            
                            <p>If you have any questions about your order, feel free to contact our support team.</p>
                        </div>
                        <div class="footer">
                            <p>© 2024 Sindhu Crackers Shop. All rights reserved.</p>
                            <p>Order Number: ${orderNumber}</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        return {
            success: true,
            messageId: info.messageId,
            message: 'Order confirmation email sent successfully',
            provider: 'gmail'
        };

    } catch (error) {
        console.error('❌ Order confirmation email sending error:', error);
        return sendOrderConfirmationMockEmail(email, orderNumber);
    }
};

// Mock email functions for development/fallback
export const sendOTPMockEmail = async (email, otp) => {
    console.log('\n' + '='.repeat(60));
    console.log('📧 MOCK EMAIL SERVICE (Gmail Not Configured)');
    console.log('='.repeat(60));
    console.log(`📧 To: ${email}`);
    console.log(`🔐 OTP: ${otp}`);
    console.log(`⏰ Valid for: 10 minutes`);
    console.log(`💡 Note: Configure EMAIL_USER and EMAIL_PASS for real emails`);
    console.log('='.repeat(60) + '\n');
    
    return {
        success: true,
        messageId: 'mock_otp_' + Date.now(),
        message: 'OTP email sent successfully (Mock Mode)',
        provider: 'mock'
    };
};

export const sendWelcomeMockEmail = async (email, userName) => {
    console.log('\n' + '='.repeat(60));
    console.log('📧 MOCK WELCOME EMAIL');
    console.log('='.repeat(60));
    console.log(`📧 To: ${email}`);
    console.log(`👤 User: ${userName}`);
    console.log(`🎉 Subject: Welcome to Sindhu Crackers Shop!`);
    console.log('='.repeat(60) + '\n');
    
    return {
        success: true,
        messageId: 'mock_welcome_' + Date.now(),
        message: 'Welcome email sent successfully (Mock Mode)',
        provider: 'mock'
    };
};

export const sendOrderConfirmationMockEmail = (email, orderNumber) => {
    console.log('\n' + '='.repeat(60));
    console.log('📧 MOCK ORDER CONFIRMATION EMAIL');
    console.log('='.repeat(60));
    console.log(`📧 To: ${email}`);
    console.log(`📦 Order: ${orderNumber}`);
    console.log(`🎉 Subject: Order Confirmed!`);
    console.log('='.repeat(60) + '\n');
    
    return {
        success: true,
        messageId: 'mock_order_' + Date.now(),
        message: 'Order confirmation email sent successfully (Mock Mode)',
        provider: 'mock'
    };
};

export const sendAdminPasswordResetOTP = async (email, otp, adminName) => {
    try {
        if (!transporter) {
            const initialized = initializeEmailService();
            if (!initialized) {
                return sendAdminPasswordResetMockEmail(email, otp);
            }
        }

        const mailOptions = {
            from: {
                name: 'Sindhu Crackers Shop Admin',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Admin Password Reset OTP - Sindhu Crackers Shop',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Admin Password Reset OTP</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: #fff; border: 2px dashed #dc3545; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px; }
                        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Admin Password Reset</h1>
                            <p>Sindhu Crackers Shop Admin Panel</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${adminName}!</h2>
                            <p>You requested to reset your admin password. Use the OTP below to reset your password:</p>
                            
                            <div class="otp-box">
                                <div class="otp-code">${otp}</div>
                                <p><strong>Valid for 10 minutes</strong></p>
                            </div>
                            
                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong>
                                <ul>
                                    <li>This OTP is valid for 10 minutes only</li>
                                    <li>Never share this OTP with anyone</li>
                                    <li>If you didn't request this reset, please ignore this email</li>
                                </ul>
                            </div>
                        </div>
                        <div class="footer">
                            <p>© 2024 Sindhu Crackers Shop Admin. All rights reserved.</p>
                            <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        return {
            success: true,
            messageId: info.messageId,
            message: 'Password reset OTP sent successfully',
            provider: 'gmail'
        };

    } catch (error) {
        console.error('❌ Admin password reset OTP sending error:', error);
        return sendAdminPasswordResetMockEmail(email, otp);
    }
};

export const sendAdminPasswordResetMockEmail = async (email, otp) => {
    console.log('\n' + '='.repeat(60));
    console.log('📧 MOCK ADMIN PASSWORD RESET OTP');
    console.log('='.repeat(60));
    console.log(`📧 To: ${email}`);
    console.log(`🔐 Reset OTP: ${otp}`);
    console.log(`⏰ Valid for: 10 minutes`);
    console.log(`💡 Note: Configure EMAIL_USER and EMAIL_PASS for real emails`);
    console.log('='.repeat(60) + '\n');
    
    return {
        success: true,
        messageId: 'mock_admin_reset_' + Date.now(),
        message: 'Admin password reset OTP sent successfully (Mock Mode)',
        provider: 'mock'
    };
};

export const sendAdminOrderNotification = async (order, user, orderDetails, screenshotPath = null) => {
    try {
        // Get all admins, super admins, and moderators
        const Admin = (await import('../models/Admin.js')).default;
        const admins = await Admin.find({ 
            isActive: true, 
            role: { $in: ['admin', 'super_admin', 'moderator'] } 
        }).select('email name role');

        if (admins.length === 0) {
            console.log('⚠️ No active admins found for order notification');
            return { success: false, message: 'No active admins found' };
        }

        console.log(`📧 Sending order notification to ${admins.length} admin(s): ${admins.map(a => `${a.name} (${a.role})`).join(', ')}`);

        if (!transporter) {
            const initialized = initializeEmailService();
            if (!initialized) {
                console.log('📧 MOCK ADMIN ORDER NOTIFICATION');
                console.log(`📦 New Order: ${order.orderNumber}`);
                console.log(`👤 Customer: ${user.name} (${user.email})`);
                console.log(`💰 Total: ₹${orderDetails.pricing.total}`);
                console.log(`📧 Would notify ${admins.length} admin(s)`);
                return;
            }
        }

        const itemsHtml = orderDetails.items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        // Send notification to all admins
        const emailPromises = admins.map(admin => {
            const mailOptions = {
                from: {
                    name: 'Sindhu Crackers Shop System',
                    address: process.env.EMAIL_USER
                },
                to: admin.email,
                subject: order._isPaymentVerification ? `🔔 Payment Verification Required - ${order.orderNumber}` : `🚨 New Order Alert - ${order.orderNumber}`,
                attachments: order._isPaymentVerification && screenshotPath ? [{
                    filename: 'payment-screenshot.jpg',
                    path: screenshotPath,
                    contentType: 'image/jpeg'
                }] : [],
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>New Order Alert</title>
                        <style>
                            body { font-family: Arial, sans-serif; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
                            .alert-box { background: #fff; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; }
                            .order-table { width: 100%; border-collapse: collapse; background: #fff; margin: 15px 0; }
                            .order-table th { background: #e9ecef; padding: 10px; text-align: left; }
                            .total { background: #dc3545; color: white; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>${order._isPaymentVerification ? '🔔 Payment Verification Required' : '🚨 New Order Alert'}</h1>
                                <p>${order._isPaymentVerification ? 'Payment screenshot submitted for verification' : 'Order requires your attention'}</p>
                            </div>
                            <div class="content">
                                <div class="alert-box">
                                    <h3>Hello ${admin.name} (${admin.role.toUpperCase()}),</h3>
                                    <p>${order._isPaymentVerification ? 'A customer has submitted payment proof. Please verify the payment screenshot in the admin panel.' : 'A new order has been confirmed and is ready for processing:'}</p>
                                </div>
                                
                                <h3>📦 Order Details:</h3>
                                <p><strong>Order Number:</strong> ${order.orderNumber || 'Generating...'}</p>
                                <p><strong>Customer:</strong> ${user.name || 'N/A'}</p>
                                <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                                <p><strong>Phone:</strong> ${user.phone || user.phoneNumber || 'Not provided'}</p>
                                <p><strong>Payment Method:</strong> ${order.paymentInfo?.method === 'bank_transfer' ? 'BANK TRANSFER' : (order.paymentInfo?.method?.toUpperCase() || 'COD')}</p>
                                <p><strong>Order Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
                                ${order._isPaymentVerification ? '<p><strong>Payment Screenshot:</strong> Attached to this email</p>' : ''}
                                
                                <h3>🛍️ Items Ordered:</h3>
                                <table class="order-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th style="text-align: center;">Qty</th>
                                            <th style="text-align: right;">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                        <tr class="total">
                                            <td colspan="2" style="padding: 12px; text-align: right;">Grand Total:</td>
                                            <td style="padding: 12px; text-align: right;">₹${orderDetails.pricing.total.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                
                                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                                    <strong>⚡ Action Required:</strong>
                                    <p>${order._isPaymentVerification ? 'Log in to admin panel → Orders → View order details → Review screenshot → Approve/Reject payment' : 'Please log in to the admin panel to process this confirmed order and update its status.'}</p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };
            
            return transporter.sendMail(mailOptions);
        });

        await Promise.all(emailPromises);
        console.log(`📧 Order notification sent to ${admins.length} admin(s)`);
        
        return {
            success: true,
            message: `Admin notifications sent to ${admins.length} admin(s)`,
            adminCount: admins.length
        };

    } catch (error) {
        console.error('❌ Admin order notification error:', error);
        return {
            success: false,
            message: 'Failed to send admin notifications',
            error: error.message
        };
    }
};

export const sendContactNotificationEmail = async (admins, contactData) => {
  try {
    if (!transporter) {
      const initialized = initializeEmailService();
      if (!initialized) {
        console.log('📧 MOCK CONTACT NOTIFICATION');
        console.log(`📩 From: ${contactData.name} (${contactData.email})`);
        console.log(`📝 Subject: ${contactData.subject}`);
        console.log(`💬 Message: ${contactData.message}`);
        console.log(`📧 Would notify ${admins.length} admin(s)`);
        return;
      }
    }

    const emailPromises = admins.map(admin => {
      const mailOptions = {
        from: {
          name: 'Sindhu Crackers Shop',
          address: process.env.EMAIL_USER
        },
        to: admin.email,
        subject: `📩 Subject : ${contactData.subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Sindhu Crackers Shop</title>
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
              .message-box { background: #fff; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Someone has sent a message through the contact form</h1>
              </div>
              <div class="content">
                <h3>Hello ${admin.name} (${admin.role.toUpperCase()}),</h3>
                <p>You have received a new contact message:</p>
                
                <div class="message-box">
                  <p><strong>From:</strong> ${contactData.name}</p>
                  <p><strong>Email:</strong> ${contactData.email}</p>
                  <p><strong>Subject:</strong> ${contactData.subject}</p>
                  <p><strong>Message:</strong></p>
                  <p>${contactData.message}</p>
                </div>
                
                <p><strong>Received:</strong> ${new Date().toLocaleString('en-IN')}</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);
    console.log(`📧 Contact notification sent to ${admins.length} admin(s)`);
    
    return {
      success: true,
      message: `Contact notifications sent to ${admins.length} admin(s)`,
      adminCount: admins.length
    };

  } catch (error) {
    console.error('❌ Contact notification error:', error);
    return {
      success: false,
      message: 'Failed to send contact notifications',
      error: error.message
    };
  }
};

export const sendLowStockAlert = async (product) => {
    try {
        const Admin = (await import('../models/Admin.js')).default;
        const admins = await Admin.find({ 
            isActive: true, 
            role: { $in: ['admin', 'super_admin'] } 
        }).select('email name role');

        if (admins.length === 0) {
            return { success: false, message: 'No active admins found' };
        }

        if (!transporter) {
            const initialized = initializeEmailService();
            if (!initialized) {
                return { success: false, message: 'Email service not available' };
            }
        }

        const emailPromises = admins.map(admin => {
            const mailOptions = {
                from: {
                    name: 'Sindhu Crackers Shop System',
                    address: process.env.EMAIL_USER
                },
                to: admin.email,
                subject: `⚠️ Low Stock Alert - ${product.name}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Low Stock Alert</title>
                        <style>
                            body { font-family: Arial, sans-serif; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #ffc107; color: #212529; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
                            .alert-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>⚠️ Low Stock Alert</h1>
                                <p>Immediate attention required</p>
                            </div>
                            <div class="content">
                                <h3>Hello ${admin.name},</h3>
                                <div class="alert-box">
                                    <p><strong>Product:</strong> ${product.name}</p>
                                    <p><strong>Current Stock:</strong> ${product.stock} units</p>
                                    <p><strong>Category:</strong> ${product.category?.name || 'Uncategorized'}</p>
                                    <p><strong>Price:</strong> ₹${product.price}</p>
                                </div>
                                <p>This product is running low on stock. Please restock soon to avoid stockouts.</p>
                                <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };
            
            return transporter.sendMail(mailOptions);
        });

        await Promise.all(emailPromises);
        
        return {
            success: true,
            message: `Low stock alert sent to ${admins.length} admin(s)`,
            adminCount: admins.length
        };

    } catch (error) {
        return {
            success: false,
            message: 'Failed to send low stock alert',
            error: error.message
        };
    }
};

// Initialize email service on module load
initializeEmailService();
