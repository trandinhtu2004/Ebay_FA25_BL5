import React, { useState, useCallback, useEffect } from "react";
import AddressSection from "./components/AddressSection";
import PaymentSection from "./components/PaymentSection";
import DiscountSection from "./components/DiscountSection";
import OrderSummary from "./components/OrderSummary";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

import "./styles.css";
import Header from "../../components/Header";

const PRODUCT_API_URL = "http://localhost:5001/api/products";
const SHIPPING_FEE = 15.0; // Phí vận chuyển giả định

// Địa chỉ API Payment
const PAYMENT_API_URL = "/api/payment";

const CheckoutPage = () => {
  const { user, isAuthenticated } = useAuth();

  // State Loading
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // State Thanh toán: SỬA ĐỔI GIÁ TRỊ KHỞI TẠO THÀNH 'momo' (chữ thường)
  const [paymentMethod, setPaymentMethod] = useState("momo");

  const [discountCode, setDiscountCode] = useState("");
  const [isCodeApplied, setIsCodeApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [checkoutProducts, setCheckoutProducts] = useState([]);

  // State Địa chỉ
  const [selectedAddress, setSelectedAddress] = useState(null);

  // --- LOGIC: TẢI DỮ LIỆU SẢN PHẨM TỪ LOCALSTORAGE (Giữ nguyên) ---
  const fetchCheckoutProducts = useCallback(async () => {
    setLoadingProducts(true);

    const buyNowCartJson = localStorage.getItem("buyNowCart");
    const regularCartJson = localStorage.getItem("checkoutCart");

    let itemsToFetch = [];
    let sourceName = "";

    if (buyNowCartJson) {
      const buyNowData = JSON.parse(buyNowCartJson);
      itemsToFetch = buyNowData.products;
      sourceName = "Mua Ngay";
    } else if (regularCartJson) {
      const regularCartData = JSON.parse(regularCartJson);
      itemsToFetch = regularCartData.products;
      sourceName = "Giỏ Hàng";
    }

    if (!itemsToFetch || itemsToFetch.length === 0) {
      setLoadingProducts(false);
      toast.info("Không tìm thấy đơn hàng nào để thanh toán.");
      return;
    }

    try {
      const fetchedDetails = await Promise.all(
        itemsToFetch.map(async (item) => {
          const response = await fetch(`${PRODUCT_API_URL}/${item.productId}`);
          if (!response.ok) {
            console.error(`Lỗi tải sản phẩm ID: ${item.productId}`);
            return null;
          }
          const productDetails = await response.json();

          return {
            ...productDetails,
            quantity: item.quantity,
            isBuyNow: item.isBuyNow || false,
            itemValue: productDetails.price * item.quantity,
          };
        })
      );

      setCheckoutProducts(fetchedDetails.filter((p) => p !== null));
      toast.info(`Tải đơn hàng thành công từ nguồn: ${sourceName}.`);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      toast.error(error.message || "Lỗi tải thông tin đơn hàng.");
      setCheckoutProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckoutProducts();
  }, [fetchCheckoutProducts]);

  // --- LOGIC TÍNH TOÁN (Cập nhật để trừ discount) ---
  const initialProductValue = checkoutProducts.reduce(
    (sum, p) => sum + p.itemValue,
    0
  );
  const totalAmount = (initialProductValue + SHIPPING_FEE - discountAmount).toFixed(2);

  const checkoutDetails = {
    productValue: initialProductValue,
    shippingPrice: SHIPPING_FEE,
  };

  // --- LOGIC: HANDLE CHECKOUT (CHỈ GỌI MOMO VÀ SỬA PAYLOAD) ---
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để hoàn tất thanh toán.");
      return;
    }
    if (checkoutProducts.length === 0) {
      toast.error("Không có sản phẩm trong đơn hàng.");
      return;
    }
    if (!selectedAddress) {
      toast.error("Vui lòng chọn địa chỉ giao hàng.");
      return;
    }

    setIsProcessingPayment(true);

    // 1. Chuẩn bị dữ liệu Order Items cho Backend
    const orderItemsPayload = checkoutProducts.map((p) => ({
      product: p._id, // ID sản phẩm
      quantity: p.quantity,
      title: p.title,
      price: p.price,
      // KHẮC PHỤC LỖI VALIDATION: THÊM TRƯỜNG IMAGE
      image: p.images?.[0] || "https://placehold.co/60x60?text=Image", // Cần URL ảnh
    }));

    // 2. Chuẩn bị Payload cho MoMo
    const payload = {
      shippingAddress: selectedAddress, // Địa chỉ đã chọn
      orderItems: orderItemsPayload,
      couponCode: isCodeApplied ? discountCode : null,
      shippingPrice: SHIPPING_FEE,
    };

    const endpoint = `${PAYMENT_API_URL}/momo`;

    try {
      // 3. Gọi API khởi tạo thanh toán MoMo
      const response = await axios.post(endpoint, payload);
      const { payUrl, localOrderId } = response.data;

      if (payUrl) {
        sessionStorage.setItem("temp_localOrderId", localOrderId);
        console.log(
          `✅ Stored localOrderId: ${localOrderId} in sessionStorage.`
        );
        // 5. Chuyển hướng người dùng đến cổng thanh toán
        window.location.href = payUrl;
      } else {
        throw new Error("Không nhận được URL thanh toán MoMo hợp lệ.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Lỗi khi khởi tạo thanh toán.";
      toast.error(`Thanh toán thất bại: ${errorMessage}`);
      console.error("Payment init error:", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // ... (Phần hiển thị loading/empty)
  if (loadingProducts) {
    return (
      <div className="text-center py-20">Đang tải chi tiết đơn hàng...</div>
    );
  }

  if (checkoutProducts.length === 0) {
    return (
      <div className="text-center py-20">
        Không tìm thấy sản phẩm trong đơn hàng để thanh toán.
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 font-sans text-[#191919]">
        <Header />
        <div className="main-container">
          <h1 className="page-title">Thanh Toán Đơn Hàng</h1>
          <div className="checkout-grid">
            {/* Cột Trái */}
            <div className="left-column">
              <AddressSection
                userId={user?.userId}
                isAuthenticated={isAuthenticated}
                setSelectedAddress={setSelectedAddress}
              />

              {/* Chú ý: Nếu PaymentSection của bạn không tự động chọn 'momo' khi load,
                                bạn cần đảm bảo nó luôn hiển thị tùy chọn 'momo' để setPaymentMethod. */}
              <PaymentSection
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
              />

              <DiscountSection
                discountCode={discountCode}
                setDiscountCode={setDiscountCode}
                isCodeApplied={isCodeApplied}
                setIsCodeApplied={setIsCodeApplied}
                setDiscountAmount={setDiscountAmount}
                checkoutProducts={checkoutProducts}
              />
            </div>

            {/* Cột Phải */}
            <div className="right-column">
              <OrderSummary
                products={checkoutProducts}
                details={checkoutDetails}
                totalAmount={totalAmount}
                discountAmount={discountAmount}
                shippingFee={SHIPPING_FEE}
                handleCheckout={handleCheckout}
                isProcessing={isProcessingPayment}
              />
            </div>
          </div>
        </div>

        <footer className="footer">
          <p>&copy; 2025 eBay Clone - Dành cho mục đích học tập</p>
        </footer>
      </div>
    </>
  );
};

export default CheckoutPage;
