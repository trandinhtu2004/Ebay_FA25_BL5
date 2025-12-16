import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const API_URL = 'http://localhost:5001/api/coupons';

const DiscountSection = ({ discountCode, setDiscountCode, setIsCodeApplied, setDiscountAmount, checkoutProducts = [] }) => {
    const { isAuthenticated } = useAuth();
    const [isValidating, setIsValidating] = useState(false);
    
    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) {
            toast.error('Vui lòng nhập mã giảm giá.');
            return;
        }

        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để sử dụng mã giảm giá.');
            return;
        }

        setIsValidating(true);
        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            if (!token) {
                toast.error('Vui lòng đăng nhập lại.');
                return;
            }
            
            // Tính tổng tiền từ checkout products
            const orderTotal = checkoutProducts.reduce((sum, product) => {
                return sum + (Number(product.price) || 0) * (Number(product.quantity) || 0);
            }, 0);
            
            console.log('[Coupon] Đang validate:', { code: discountCode, orderTotal, productsCount: checkoutProducts.length });
            
            const response = await axios.post(
                `${API_URL}/validate`,
                { code: discountCode, orderTotal },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data) {
                setIsCodeApplied(true);
                setDiscountAmount(response.data.discountAmount || 0);
                toast.success(response.data.message || 'Mã giảm giá áp dụng thành công!');
            }
        } catch (error) {
            setIsCodeApplied(false);
            setDiscountAmount(0);
            const errorMessage = error.response?.data?.message || 'Mã giảm giá không hợp lệ.';
            toast.error(errorMessage);
        } finally {
            setIsValidating(false);
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
                    disabled={isValidating}
                >
                    {isValidating ? 'Đang kiểm tra...' : 'Áp dụng'}
                </button>
            </div>
        </section>
    );
};

export default DiscountSection;