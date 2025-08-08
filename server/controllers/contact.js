import Admin from '../models/Admin.js';
import { sendContactNotificationEmail } from '../utils/email.js';

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Get all active admins and super admins
    const admins = await Admin.find({ 
      isActive: true, 
      role: { $in: ['admin', 'super_admin'] } 
    }).select('email name role');

    if (admins.length === 0) {
      console.log('No active admins found for contact notification');
      return res.status(200).json({
        success: true,
        message: 'Message received successfully'
      });
    }

    // Send notification to all admins
    await sendContactNotificationEmail(admins, { name, email, subject, message });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};