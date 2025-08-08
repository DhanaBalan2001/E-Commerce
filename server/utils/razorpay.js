import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay only if credentials are provided
let razorpay = null;

const initializeRazorpay = () => {
    try {
        if (!process.env.RAZORPAY_KEY_ID) {
            throw new Error('RAZORPAY_KEY_ID is not configured');
        }
        
        if (!process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('RAZORPAY_KEY_SECRET is not configured');
        }

        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        return true;
    } catch (error) {
        console.error('Razorpay initialization failed:', error.message);
        return false;
    }
};

export const createRazorpayOrder = async (amount, currency = 'INR', receipt = null) => {
    try {
        if (!razorpay) {
            const initialized = initializeRazorpay();
            if (!initialized) {
                return {
                    success: false,
                    error: 'Razorpay not configured. Please check your environment variables.'
                };
            }
        }

        if (!amount || amount <= 0) {
            return {
                success: false,
                error: 'Invalid amount. Amount must be greater than 0.'
            };
        }

        const amountInPaise = Math.round(amount * 100);

        if (amountInPaise < 100) {
            return {
                success: false,
                error: 'Amount must be at least ₹1'
            };
        }

        if (amountInPaise > 1500000000) {
            return {
                success: false,
                error: 'Amount exceeds maximum limit of ₹15,00,000'
            };
        }

        const options = {
            amount: amountInPaise,
            currency: currency,
            receipt: receipt || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            payment_capture: 1,
            notes: {
                created_at: new Date().toISOString(),
                source: 'crackers_shop_api'
            }
        };

        const order = await razorpay.orders.create(options);

        return {
            success: true,
            order: {
                id: order.id,
                entity: order.entity,
                amount: order.amount,
                amount_paid: order.amount_paid,
                amount_due: order.amount_due,
                currency: order.currency,
                receipt: order.receipt,
                status: order.status,
                created_at: order.created_at,
                notes: order.notes
            }
        };
    } catch (error) {
        let errorMessage = 'Failed to create payment order';
        
        if (error.statusCode === 400) {
            errorMessage = 'Invalid payment details provided';
        } else if (error.statusCode === 401) {
            errorMessage = 'Razorpay authentication failed. Check your API keys.';
        } else if (error.statusCode === 429) {
            errorMessage = 'Too many requests. Please try again later.';
        } else if (error.statusCode >= 500) {
            errorMessage = 'Razorpay service temporarily unavailable. Please try again.';
        }

        return {
            success: false,
            error: errorMessage,
            details: error.message,
            statusCode: error.statusCode
        };
    }
};

export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
    try {
        if (!orderId || !paymentId || !signature) {
            return false;
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return false;
        }

        const body = orderId + '|' + paymentId;
        
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isValid = crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(signature, 'hex')
        );

        return isValid;
    } catch (error) {
        return false;
    }
};

export const fetchRazorpayOrder = async (orderId) => {
    try {
        if (!razorpay) {
            const initialized = initializeRazorpay();
            if (!initialized) {
                return {
                    success: false,
                    error: 'Razorpay not configured'
                };
            }
        }

        const order = await razorpay.orders.fetch(orderId);
        
        return {
            success: true,
            order
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

export const fetchRazorpayPayment = async (paymentId) => {
    try {
        if (!razorpay) {
            const initialized = initializeRazorpay();
            if (!initialized) {
                return {
                    success: false,
                    error: 'Razorpay not configured'
                };
            }
        }

        const payment = await razorpay.payments.fetch(paymentId);
        
        return {
            success: true,
            payment
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

export const refundRazorpayPayment = async (paymentId, amount = null, notes = {}) => {
    try {
        if (!razorpay) {
            const initialized = initializeRazorpay();
            if (!initialized) {
                return {
                    success: false,
                    error: 'Razorpay not configured'
                };
            }
        }

        const refundData = {
            notes: {
                ...notes,
                refund_initiated_at: new Date().toISOString()
            }
        };

        if (amount) {
            refundData.amount = amount;
        }

        const refund = await razorpay.payments.refund(paymentId, refundData);

        return {
            success: true,
            refund
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

export const verifyRazorpayWebhook = (body, signature, secret) => {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(signature, 'hex')
        );
    } catch (error) {
        return false;
    }
};

initializeRazorpay();

export { razorpay };
