// src/components/OrderSummary.js (Đã cập nhật)
import React from 'react';

// Nhận thêm props product và quantity
const OrderSummary = ({ products, totalAmount, handleCheckout, isProcessing, discountAmount = 0, shippingFee = 15.0 }) => {
    const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const finalTotal = parseFloat(totalAmount);

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
            
            <div className="summary-breakdown">
                <div className="summary-row">
                    <span>Tạm tính:</span>
                    <span>US ${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                    <span>Phí vận chuyển:</span>
                    <span>US ${shippingFee.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                    <div className="summary-row" style={{ color: '#28a745' }}>
                        <span>Giảm giá:</span>
                        <span>- US ${discountAmount.toFixed(2)}</span>
                    </div>
                )}
            </div>
            
            <hr/>
            
            <div className="summary-total">
                <strong>Tổng Cộng:</strong>
                <strong className="total-price">US ${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
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