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
import ContactUs from './pages/ContactUs';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Kids from './pages/Kids';
import Hampers from './pages/Hampers';
import HamperDetail from './pages/HamperDetail';

// Admin Pages
import AdminDashboard from './admin/AdminDashboard';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminDeals from './admin/AdminDeals';
import AdminBulk from './admin/AdminBulk';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminCustomers from './admin/AdminCustomers';
import AdminBulkOrders from './admin/AdminBulkOrders';
import AdminReturns from './admin/AdminReturns';
import AdminContactMessages from './admin/AdminContactMessages';
import AdminCategories from './admin/AdminCategories';
import AdminHamper from './admin/AdminHamper';
import AdminSubscribers from './admin/AdminSubscribers';  // ✅ imported

// Ad management
import AdminAds from './admin/AdminAds';
import AdsPopup from './components/AdsPopup';

const DashboardContent = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Welcome to Admin Dashboard</h2>
      <p>Select an option from the sidebar to manage your store.</p>
    </div>
  );
};

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
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/kids" element={<Kids />} />
            <Route path="/hampers" element={<Hampers />} />
            <Route path="/hamper/:id" element={<HamperDetail />} />
            <Route path="/shipping" element={<ShippingPolicy />} />
            <Route path="/returns" element={<ReturnPolicy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/bulk-order" element={<BulkOrderPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            

            {/* Protected Customer Routes */}
            <Route path="/cart" element={<Cart />} />
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

            {/* Admin Routes - NESTED under AdminDashboard */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardContent />} />

              <Route path="categories" element={<AdminCategories />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="hampers" element={<AdminHamper />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="returns" element={<AdminReturns />} />
              <Route path="bulk-orders" element={<AdminBulkOrders />} />
              <Route path="contact-messages" element={<AdminContactMessages />} />
              <Route path="deals" element={<AdminDeals />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="bulk" element={<AdminBulk />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="ads" element={<AdminAds />} />
              
              {/* ✅ CORRECT: Subscribers route inside /admin */}
              <Route path="subscribers" element={<AdminSubscribers />} />
            </Route>

            {/* 404 Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <CookieConsent />
        <AdsPopup />
      </div>
    </Router>
  );
}

export default App;