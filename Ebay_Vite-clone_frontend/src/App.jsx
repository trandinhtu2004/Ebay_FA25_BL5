// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/index';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/Profile';
import FilterProduct from './pages/FilterProduct'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductDetail from './pages/ProductDetail';
import ProtectedRoute from './routes/ProtectedRoute';
import Cart from './pages/Cart';
import CheckoutPage from './pages/checkout/CheckoutPage';
import Firm from './pages/checkout/Firm';
import MyEbayLayout from './Layouts/MyEbayLayout';
import Summary from './pages/MyEbay/Summary';
import PurchaseHistory from './pages/MyEbay/PurchaseHistory';
import NotificationsPage from './pages/NotificationsPage';
function App() {
  return (
    <BrowserRouter>
      {/* ToastContainer để hiển thị thông báo lỗi/thành công */}
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Routes>
        <Route path="/" element={<Index />} />
        
        {/* Truyền prop initialMode để xác định tab mặc định */}
        <Route path="/login" element={<LoginPage initialMode="login" />} />
        <Route path="/register" element={<LoginPage initialMode="register" />} />
        <Route path ="/all-products" element={<FilterProduct/>}/>
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/detail/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/checkout/success" element={<ProtectedRoute><Firm /></ProtectedRoute>} />
        {/* Redirect trang lạ về home */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/cart" element={<ProtectedRoute><Cart/></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />


        <Route path="/my-ebay" element={<ProtectedRoute><MyEbayLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="summary" replace />} />
              <Route path="summary" element={<ProtectedRoute><Summary /></ProtectedRoute>} />
              <Route path="purchase-history" element={<ProtectedRoute><PurchaseHistory /></ProtectedRoute>} />
              
              {/* Fallback cho các link chưa làm */}
              <Route path="*" element={<div className="p-10 text-center">Page under construction</div>} />
            </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;