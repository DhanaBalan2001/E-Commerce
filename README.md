# 🎆 Crackers E-Commerce Platform

A full-stack e-commerce platform for crackers and fireworks with modern web technologies, featuring real-time updates, secure payments, and comprehensive admin management.

![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.7-purple?logo=bootstrap)

## 🚀 Features

### 🛒 Customer Features
- **Product Catalog**: Browse extensive collection of crackers with advanced filtering
- **Smart Search**: Real-time search with category and price filters
- **Shopping Cart**: Add/remove items with quantity management
- **Secure Checkout**: Razorpay payment integration
- **Order Tracking**: Real-time order status updates
- **User Authentication**: JWT-based secure login/registration
- **Address Management**: Multiple delivery addresses
- **Product Reviews**: Rating and review system
- **Responsive Design**: Mobile-first approach with Bootstrap

### 👨‍💼 Admin Features
- **Dashboard Analytics**: Sales, orders, and user statistics
- **Product Management**: CRUD operations with image upload
- **Category Management**: Hierarchical category structure
- **Order Management**: Process and track orders
- **User Management**: Customer account oversight
- **Inventory Control**: Stock management and alerts
- **Content Management**: Dynamic content updates

### 🔧 Technical Features
- **Real-time Updates**: Socket.IO for live notifications
- **Image Upload**: Multer-based file handling
- **Email Notifications**: Nodemailer integration
- **SMS Alerts**: Twilio integration
- **Rate Limiting**: API protection and security
- **Data Validation**: Express-validator middleware
- **Error Handling**: Comprehensive error management
- **Security**: Helmet.js, CORS, and JWT protection

## 🛠️ Tech Stack

### Frontend
- **React 19.1.0** - Modern UI library with hooks
- **React Router DOM** - Client-side routing
- **Bootstrap 5.3.7** - Responsive CSS framework
- **React Bootstrap** - Bootstrap components for React
- **Axios** - HTTP client for API calls
- **React Icons** - Icon library
- **AOS** - Animate On Scroll library
- **React Toastify** - Toast notifications
- **Socket.IO Client** - Real-time communication
- **Vite** - Fast build tool and dev server

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt.js** - Password hashing
- **Multer** - File upload handling
- **Socket.IO** - Real-time bidirectional communication
- **Nodemailer** - Email sending
- **Twilio** - SMS notifications
- **Razorpay** - Payment gateway integration

### Security & Middleware
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - API rate limiting
- **Express Validator** - Input validation
- **Morgan** - HTTP request logger
- **Dotenv** - Environment variable management

## 📁 Project Structure

```
Crackers/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # React context providers
│   │   ├── services/      # API service functions
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
│
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   ├── uploads/          # File upload directory
│   └── package.json      # Backend dependencies
│
└── README.md             # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Crackers
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

4. **Environment Setup**

Create `.env` files in both client and server directories:

**Server `.env`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/crackers
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

**Client `.env`:**
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

5. **Start the application**

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## 🔑 Key Implementation Details

### Authentication System
- JWT-based authentication with refresh tokens
- Password hashing using bcrypt
- Protected routes with middleware
- Role-based access control (Admin/User)

### Payment Integration
- Razorpay payment gateway
- Secure payment processing
- Order confirmation and receipt generation
- Payment failure handling

### Real-time Features
- Socket.IO for live order updates
- Real-time inventory updates
- Live chat support (if implemented)
- Push notifications

### File Upload System
- Multer middleware for image uploads
- File type validation
- Image optimization and resizing
- Secure file storage

### Database Design
- MongoDB with Mongoose ODM
- Relational data modeling
- Indexing for performance
- Data validation schemas

## 📱 Mobile Responsiveness

- Mobile-first design approach
- Bootstrap responsive grid system
- Touch-friendly UI elements
- Optimized mobile navigation
- Responsive image handling

## 🔒 Security Features

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Secure headers with Helmet.js
- Environment variable protection

## 🚀 Deployment

### Production Build
```bash
# Build client
cd client
npm run build

# Start server in production
cd ../server
npm start
```

### Environment Variables
Ensure all production environment variables are properly configured for:
- Database connection
- Payment gateway credentials
- Email service credentials
- JWT secrets
- API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

---

**Built with ❤️ using modern web technologies**