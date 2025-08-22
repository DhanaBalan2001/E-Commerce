# Manual Payment System Setup Guide

## Overview
This system replaces Razorpay with a manual bank transfer payment method where customers upload payment screenshots for admin verification.

## Changes Made

### 1. Database Changes
- Updated Order model to support bank transfer payments
- Added payment screenshot storage
- Added admin verification fields
- Removed Razorpay-specific fields

### 2. Frontend Changes
- Created BankDetails page with bank account information
- Updated Checkout to redirect to bank details
- Updated Admin Order Detail to show payment verification
- Added payment screenshot upload functionality

### 3. Backend Changes
- Added manual payment order creation endpoint
- Added payment verification endpoint for admins
- Added file upload handling for screenshots
- Removed all Razorpay integration

## Setup Instructions

### 1. Update Bank Details
Edit `client/src/pages/BankDetails/BankDetails.jsx` and update the `bankDetails` object with your actual bank information:

```javascript
const bankDetails = {
  bankName: "Your Bank Name",
  accountName: "Your Business Name",
  accountNumber: "Your Account Number",
  ifscCode: "Your IFSC Code",
  branch: "Your Branch Details",
  upiId: "your-upi-id@bank"
};
```

### 2. Environment Variables
Remove these Razorpay variables from your `.env` file:
```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### 3. Install Dependencies
Make sure you have multer installed for file uploads:
```bash
npm install multer
```

### 4. File Upload Directory
The system creates `uploads/payment-screenshots/` directory automatically.
Make sure your server has write permissions to create this directory.

### 5. Admin Verification Process
1. Customers upload payment screenshots
2. Orders appear with "verification_pending" status
3. Admins can view screenshots in order details
4. Admins can approve/reject payments
5. Approved payments confirm the order and deduct stock

## New API Endpoints

### Customer Endpoints
- `POST /api/orders/create-manual-payment` - Create order with payment screenshot

### Admin Endpoints  
- `PUT /api/orders/:orderId/verify-payment` - Approve/reject payment

## File Structure
```
server/
├── uploads/payment-screenshots/    # Payment screenshots storage
├── config/bankDetails.js          # Bank details configuration
├── templates/                     # Email templates
└── controllers/order.js           # Updated with manual payment logic

client/
├── src/pages/BankDetails/         # Bank details payment page
└── src/components/Admin/PendingPayments/  # Admin widget for pending payments
```

## Security Considerations
1. Payment screenshots are stored securely on server
2. Only admins can verify payments
3. File upload validation (size, type)
4. Authentication required for all payment operations

## Customer Flow
1. Add items to cart
2. Go to checkout
3. Fill shipping details
4. Click "Pay Now"
5. Redirected to bank details page
6. Make bank transfer
7. Upload payment screenshot
8. Wait for admin verification (24 hours)
9. Receive confirmation email once verified

## Admin Flow
1. View pending payment verifications in dashboard
2. Click on order to view details
3. Review payment screenshot
4. Approve or reject payment
5. System automatically updates order status and stock

## Email Templates
- Manual payment confirmation email template created
- Update email service to use new templates for bank transfer orders

## Testing
1. Test complete order flow with screenshot upload
2. Test admin verification process
3. Test email notifications
4. Test file upload validation
5. Test error handling

## Maintenance
- Regularly clean up old payment screenshots
- Monitor pending payments dashboard
- Update bank details as needed
- Review and approve payments promptly (within 24 hours)