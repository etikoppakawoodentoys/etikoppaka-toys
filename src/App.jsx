import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import BulkOrderPage from './pages/BulkOrderPage';
// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Deals from './pages/Deals';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Checkout from './pages/Checkout';
import PaymentStatus from './pages/PaymentStatus';
import ShippingPolicy from './pages/ShippingPolicy';
import ReturnPolicy from './pages/ReturnPolicy';
import FAQ from './pages/FAQ';

// Admin Pages
import AdminDashboard from './admin/AdminDashboard';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminDeals from './admin/AdminDeals';
import AdminBulk from './admin/AdminBulk';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminCustomers from './admin/AdminCustomers';
import AdminBulkOrders from './admin/AdminBulkOrders';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
           
            <Route path="/shipping" element={<ShippingPolicy />} />
            <Route path="/returns" element={<ReturnPolicy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/bulk-order" element={<BulkOrderPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            
            {/* Protected Customer Routes */}
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
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/bulk-orders" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminBulkOrders />
              </ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminProducts />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminOrders />
              </ProtectedRoute>
            } />
            <Route path="/admin/deals" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDeals />
              </ProtectedRoute>
            } />
            <Route path="/admin/bulk" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminBulk />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminCustomers />
              </ProtectedRoute>
            } />
            
            {/* 404 Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        {/* Cookie Consent - appears on all pages */}
        <CookieConsent />
      </div>
    </Router>
  );
}

export default App;