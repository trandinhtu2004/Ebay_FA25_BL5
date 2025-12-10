// src/App.js
// 1. Import thêm 'Navigate'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/index.jsx';
// Layouts & Pages
// import Header from './components/Layout/Header';
// import HomePage from './pages/HomePage';
// import AuthPage from './pages/AuthPage';
// import DashboardPage from './pages/DashboardPage'; // Đây sẽ là layout
// import CreateProductPage from './pages/CreateProductPage'; // Trang form đăng SP
// import EditProductPage from './pages/EditProductPage'; // <-- 1. IMPORT TRANG EDIT
// import CartPage from './pages/CartPage';
// import CheckoutPage from './pages/CheckoutPage';
// import OrderSuccessPage from './pages/OrderSuccessPage';
// import OrderFailedPage from './pages/OrderFailedPage';
// import OrderHistoryPage from './pages/OrderHistoryPage';
// import OrderDetailPage from './pages/OrderDetailPage';

// Store Management Pages
import LoginPage from './pages/LoginPage.jsx';


// ... (Các import component)
// import StoreProfile from './components/Store/StoreProfile';
// import ProductImport from './components/Store/ProductImport';
// import ProductManagementList from './components/Store/ProductManagementList'; // <-- 2. IMPORT LIST

// Routes
// import ProtectedRoute from './routes/ProtectedRoute';
// import SellerRoute from './routes/SellerRoute';

function App() {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* <Route path="/auth" element={<AuthPage />} />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />
          <Route path="/order-failed" element={<OrderFailedPage />} /> */}
          {/* --- Buyer Protected Routes --- */}
          {/* <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-history" element={<OrderHistoryPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} /> */}
            {/* (ví dụ: /order-history) */}
          {/* </Route> */}

          {/* Trang Login & Register dùng chung giao diện Login.jsx */}
        <Route path="/login" element={<LoginPage initialMode="login" />} />

        <Route path="/register" element={<LoginPage initialMode="register" />} />

          {/* --- Seller Protected Routes (ĐÃ CẤU TRÚC LẠI) --- */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default App;