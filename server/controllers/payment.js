// Payment controller - Razorpay removed, using manual bank transfer only

export const createPaymentOrder = async (req, res) => {
    res.status(400).json({ 
        success: false, 
        message: 'Online payment not available. Please use bank transfer.' 
    });
};

export const verifyPayment = async (req, res) => {
    res.status(400).json({ 
        success: false, 
        message: 'Online payment verification not available.' 
    });
};

export const handlePaymentFailure = async (req, res) => {
    res.status(400).json({ 
        success: false, 
        message: 'Online payment not available.' 
    });
};