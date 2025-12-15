// src/components/OrderSummary.js (Đã cập nhật)
import React from 'react';

// Nhận thêm props product và quantity
const OrderSummary = ({ products, totalAmount, handleCheckout, isProcessing }) => {
    

    return (
        <div className="order-summary-box">
            <h3 className="summary-title">Tóm Tắt Đơn Hàng</h3>
            
            {/* VỊ TRÍ NÀY LÀ NƠI CHẠY MAP ĐỂ HIỂN THỊ DANH SÁCH SẢN PHẨM */}
            {products.map((p) => (
                <div key={p._id} className="summary-item product-info">
                    <img 
                        src={p.images?.[0] || 'https://placehold.co/60x60?text=No+Image'} 
                        alt={p.title} 
                        className="product-thumb"
                    />
                    <div className="product-details">
                        <p className="product-name">{p.title}</p>
                        <p className="product-qty">Số lượng: {p.quantity}</p>
                        <p className="product-price">US ${p.price.toLocaleString()}</p>
                    </div>
                </div>
            ))}
            
            <hr/>
            
            <div className="summary-total">
                <strong>Tổng Cộng:</strong>
                <strong className="total-price">US ${totalAmount}</strong>
            </div>

           <button 
                className="primary-button buy-now-button"
                onClick={handleCheckout}
                disabled={isProcessing} 
            >
                {isProcessing ? 'Đang xử lý...' : 'Hoàn Tất Thanh Toán'}
            </button>
            
            <div className="secure-info">
                <i className="fas fa-lock"></i>
                <span>Thanh toán an toàn</span>
            </div>
        </div>
    );
};

export default OrderSummary;