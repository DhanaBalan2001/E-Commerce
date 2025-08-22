// Bank account details configuration
// Update these with your actual bank details

export const BANK_DETAILS = {
  bankName: "State Bank of India",
  accountName: "Sindhu Crackers",
  accountNumber: "1234567890123456", // Replace with actual account number
  ifscCode: "SBIN0001234", // Replace with actual IFSC code
  branch: "Main Branch, Chennai", // Replace with actual branch
  upiId: "sindhucrackers@sbi", // Replace with actual UPI ID
  
  // Additional details
  accountType: "Current Account",
  swiftCode: "SBININBB", // If needed for international transfers
  
  // Instructions
  instructions: [
    "Transfer the exact order amount to the above account",
    "Use your order number as reference/remark",
    "Take a screenshot of the successful transaction",
    "Upload the screenshot on the payment page",
    "We will verify and confirm your order within 24 hours"
  ]
};

export default BANK_DETAILS;