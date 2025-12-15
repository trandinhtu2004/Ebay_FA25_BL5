import React from 'react';
import { toast } from 'react-toastify';

const DiscountSection = ({ discountCode, setDiscountCode, setIsCodeApplied }) => {
    
    const handleApplyDiscount = () => {
        if (discountCode.toUpperCase() === 'SALE50') {
            setIsCodeApplied(true);
            toast.success('Mã giảm giá áp dụng thành công!');
        } else {
            setIsCodeApplied(false);
            toast.error('Mã giảm giá không hợp lệ.');
        }
    };

    return (
        <section className="section-box discount-section">
            <h2 className="section-title">2. Mã Giảm giá</h2>
            <div className="discount-input">
                <input 
                    type="text" 
                    id="discountCode" 
                    placeholder="Nhập mã giảm giá (nếu có)"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                />
                <button 
                    className="secondary-button apply-button"
                    onClick={handleApplyDiscount}
                >
                    Áp dụng
                </button>
            </div>
        </section>
    );
};

export default DiscountSection;