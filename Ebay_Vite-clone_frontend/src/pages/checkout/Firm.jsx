import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios"; 
import qs from "query-string"; 
// import emailjs from "emailjs-com"; // Tùy chọn nếu bạn cần gửi email
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from "@ant-design/icons";

// Giả định bạn có Header và Footer
// import Footer from "../heroComponent/Footer";
// import Header from "../heroComponent/Header"; 

const PAYMENT_API_PROCESS_RETURN = '/api/payment/momo_process_return';

// Lấy thông tin localOrderId từ sessionStorage
const getLocalOrderId = () => {
    const id = sessionStorage.getItem('temp_localOrderId');
    sessionStorage.removeItem('temp_localOrderId'); // Xóa ngay sau khi đọc
    return id;
};

function Firm() {
  const navigate = useNavigate();
  const hasRun = useRef(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("loading"); 
  const [message, setMessage] = useState("Đang xác nhận thanh toán...");
    
    // ... (getStatusStyle và renderIcon giữ nguyên)
    const getStatusStyle = () => {
        switch (status) {
          case "loading":
            return { color: "#ff9800" }; // cam
          case "success":
            return { color: "#4caf50" }; // xanh lá
          case "error":
            return { color: "#f44336" }; // đỏ
          default:
            return { color: "#333" };
        }
      };
    const renderIcon = () => {
        switch (status) {
          case "loading":
            return <LoadingOutlined spin style={{ fontSize: 48, color: "#ff9800" }} />;
          case "success":
            return <CheckCircleOutlined style={{ fontSize: 48, color: "#4caf50" }} />;
          case "error":
            return <CloseCircleOutlined style={{ fontSize: 48, color: "#f44336" }} />;
          default:
            return null;
        }
      };


    useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const confirmPayment = async () => {
      const urlQuery = window.location.search.substring(1);
      const parsedQuery = qs.parse(urlQuery);
      
            // Lấy Order ID từ sessionStorage (ưu tiên) hoặc từ MoMo URL
            const localOrderIdFromSession = getLocalOrderId(); // Đã xóa khỏi session
      const orderId = localOrderIdFromSession || parsedQuery.orderId;
      
      // 1. KIỂM TRA NGUỒN GỐC ĐƠN HÀNG (Dùng để dọn dẹp localStorage)
      const isFromCart = !!localStorage.getItem('checkoutCart');
      
      if (!orderId) {
                // Xử lý lỗi: Không có ID
        setMessage("❌ Lỗi: Không tìm thấy mã đơn hàng.");
        setStatus("error");
        setLoading(false);
                setTimeout(() => navigate("/"), 5000); // Chuyển hướng sau khi báo lỗi
        return;
      }

      // 2. CHUẨN BỊ PAYLOAD VÀ GỌI BACKEND
      const returnPayload = {
        ...parsedQuery, 
        localOrderId: orderId, // Đảm bảo ID được truyền chính xác
        isFromCart: isFromCart, 
      };

      setMessage("🔄 Đang xác nhận thanh toán với hệ thống...");
      setStatus("loading");

      try {
        const res = await axios.post(PAYMENT_API_PROCESS_RETURN, returnPayload);

        if (!res.data.success) {
          // Xử lý lỗi từ Backend (ví dụ: Order đã xử lý, không đủ kho)
          throw new Error(res.data.message || "Xử lý đơn hàng thất bại.");
        }

        // 🚀 THANH TOÁN THÀNH CÔNG VÀ XỬ LÝ ORDER THÀNH CÔNG
        const confirmedOrderId = res.data.orderId || orderId; 
                
                // Dọn dẹp localStorage chỉ khi xác nhận thành công
        if (isFromCart) {
          localStorage.removeItem('checkoutCart'); // Dọn dẹp Cart
        }
        localStorage.removeItem('buyNowCart'); // Dọn dẹp Buy Now
        
        // Gửi email xác nhận (Nếu cần, bạn bật lại đoạn code này)
                // Ví dụ: await sendEmailConfirmation(confirmedOrderId); 

        setMessage("🎉 Thanh toán hoàn tất! Bạn sẽ được chuyển hướng.");
        setStatus("success");
        setLoading(false); 

                // CHUYỂN HƯỚNG VỀ TRANG CHỦ SAU 4 GIÂY
        setTimeout(() => navigate("/"), 4000);
        
      } catch (err) {
        // ❌ XỬ LÝ LỖI (Bao gồm lỗi từ Backend và lỗi mạng)
        console.error("❌ Lỗi xử lý thanh toán/email:", err.response?.data?.message || err.message);
        setMessage(`❌ Lỗi hệ thống: ${err.response?.data?.message || 'Không thể xác nhận đơn hàng.'}`);
        setStatus("error");
                setLoading(false);
                
                // CHUYỂN HƯỚNG VỀ TRANG CHỦ SAU 5 GIÂY (sau khi báo lỗi)
                setTimeout(() => navigate("/"), 5000);
      }
    };

    confirmPayment();
  }, [navigate]);

  return (
    <div className="bp-app">
      {/* <Header /> */}
      <div
        style={{
                    minHeight: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
          textAlign: "center",
          padding: "80px 20px",
        }}
      >
        {renderIcon()}
        <p style={{ ...getStatusStyle(), fontWeight: 600 }}>{message}</p>
        {(status === "success" || status === "error") && (
          <p style={{ fontSize: "16px", color: "#666" }}>
            Bạn sẽ được chuyển về trang chủ sau ít giây...
          </p>
        )}
      </div>
      {/* <Footer /> */}
    </div>
  );
}

export default Firm;