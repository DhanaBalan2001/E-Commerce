import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';

// Import components
import Navbar from './components/Navbar/Navbar';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Import pages
import Home from './components/Home/Home.jsx';
import Products from './pages/Products/Products';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import Categories from './components/Categories/Categories';
import Orders from './pages/Orders/Orders';
import OrderDetails from './pages/OrderDetails/OrderDetails';
import Profile from './pages/Profile/Profile';
import Login from './pages/Auth/Login';
import WriteReview from './pages/Review/Review.jsx';

// Admin components
import AdminLogin from './pages/Admin/AdminLogin/AdminLogin';
import AdminLayout from './pages/Admin/AdminLayout/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard';
import AdminOrders from './pages/Admin/Orders/AdminOrders/AdminOrders';
import AdminOrderDetail from './pages/Admin/Orders/AdminOrderDetail/AdminOrderDetail';
import AdminUsers from './pages/Admin/Users/AdminUsers/AdminUsers';
import AdminSettings from './pages/Admin/Settings/AdminSettings/AdminSettings';
import AdminProfile from './pages/Admin/Profile/AdminProfile';
import AdminResetPassword from './pages/Admin/AdminResetPassword/AdminResetPassword';
import AdminCategories from './pages/Admin/Categories/AdminCategories/AdminCategories';
import AdminProducts from './pages/Admin/Products/AdminProducts/AdminProducts';
import AdminProductForm from './pages/Admin/Products/AdminProductForm/AdminProductForm';
import AdminProductDetail from './pages/Admin/Products/AdminProductDetail/AdminProductDetail';
import AdminCategoryForm from './pages/Admin/Categories/AdminCategoryForm/AdminCategoryForm';
import AdminCategoryDetail from './pages/Admin/Categories/AdminCategoryDetail/AdminCategoryDetail';



// Legal pages
import PrivacyPolicy from './pages/Legal/PrivacyPolicy';
import FAQ from './pages/Legal/FAQ';
import HelpCenter from './pages/Legal/HelpCenter';
import ShippingInfo from './pages/Legal/ShippingInfo';
import TrackOrder from './pages/Legal/TrackOrder';

// Import styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './pages/Admin/mobile-fix.css';

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Admin Routes - No regular navbar */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/reset-password" element={<AdminResetPassword />} />
              <Route path="/admin/*" element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrderDetail />} /> 
                <Route path="users" element={<AdminUsers />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="categories/new" element={<AdminCategoryForm />} />
                <Route path="categories/:id" element={<AdminCategoryDetail />} />
                <Route path="categories/:id/edit" element={<AdminCategoryForm />} />
                <Route path="products" element={<AdminProducts />} /> 
                <Route path="products/new" element={<AdminProductForm />} /> 
                <Route path="products/:id/edit" element={<AdminProductForm />} /> 
                <Route path="products/:productId" element={<AdminProductDetail />} />
                
                {/* Redirect /admin to /admin/dashboard */}
                <Route index element={<AdminDashboard />} />
              </Route>

              {/* Regular App Routes - With navbar */}
              <Route path="/*" element={
                <>
                  <Navbar />
                  <main id="main-content" className="main-content" role="main">
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/products/:id" element={<ProductDetail />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/products/:id/write-review" element={<WriteReview />} />
                    
                      {/* Legal Pages */}
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/help" element={<HelpCenter />} />
                      <Route path="/shipping" element={<ShippingInfo />} />
                      <Route path="/track-order" element={<TrackOrder />} />
                      
                      {/* Protected Routes */}
                      <Route path="/cart" element={
                        <ProtectedRoute>
                          <Cart />
                        </ProtectedRoute>
                      } />
                      <Route path="/checkout" element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      } />
                      <Route path="/orders" element={
                        <ProtectedRoute>
                          <Orders />
                        </ProtectedRoute>
                      } />
                      <Route path="/orders/:orderId" element={
                        <ProtectedRoute>
                          <OrderDetails />
                        </ProtectedRoute>
                      } />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } />

                      {/* 404 Not Found */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <ScrollToTop />
                </>
              } />
            </Routes>
            
            {/* Toast Notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              toastClassName="custom-toast"
              bodyClassName="custom-toast-body"
              progressClassName="custom-toast-progress"
            />
          </div>
        </Router>
      </ToastProvider>
    </AppProvider>
  );
}

// 404 Not Found Component
const NotFound = () => (
  <div className="container text-center py-5">
    <div className="error-container fade-in">
      <div className="error-icon bounce-in">🎆</div>
      <h1 className="text-fire mb-3">404 - Page Not Found</h1>
      <p className="text-light mb-4">
        Oops! The page you're looking for seems to have exploded into the night sky! 🌌
      </p>
      <div className="error-actions">
        <a href="/" className="btn btn-primary me-3">
          🏠 Go Home
        </a>
        <a href="/products" className="btn btn-outline">
          🛍️ Browse Products
        </a>
      </div>
    </div>
  </div>
);

export default App;
