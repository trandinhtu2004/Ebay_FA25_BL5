// src/context/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Đảm bảo import đúng đường dẫn

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Lấy thông tin xác thực từ AuthContext
    const { isAuthenticated, token } = useAuth(); 

    // --- EFFECT: Tải giỏ hàng khi user login ---
    useEffect(() => {
        const fetchCart = async () => {
            if (isAuthenticated && token) {
                setLoading(true);
                try {
                    // Axios đã có default header từ AuthContext, nhưng để chắc chắn ta có thể truyền thủ công nếu cần
                    const response = await axios.get('/api/cart');
                    setCart(response.data);
                } catch (error) {
                    console.error('Lỗi tải giỏ hàng:', error);
                    // Nếu lỗi 401 (Unauthorized), có thể token hết hạn, AuthContext sẽ xử lý việc logout sau
                }
                setLoading(false);
            } else {
                setCart(null); // Reset giỏ hàng khi logout
            }
        };
        fetchCart();
    }, [isAuthenticated, token]); // Chạy lại khi trạng thái auth thay đổi

    // --- Add to Cart ---
    const addToCart = async (productId, quantity = 1) => {
        if (!isAuthenticated) {
            // Có thể mở modal login hoặc redirect tại đây
            alert('Vui lòng đăng nhập để thêm vào giỏ hàng.'); 
            return;
        }

        try {
            const response = await axios.post('/api/cart', {
                productId,
                quantity
            });
            setCart(response.data);
        } catch (error) {
            console.error('Lỗi thêm vào giỏ hàng:', error);
            alert(error.response?.data?.message || 'Lỗi! Không thể thêm vào giỏ hàng.');
        }
    };

    // --- Update Quantity ---
    const updateQuantity = async (productId, quantity) => {
        try {
            const response = await axios.put('/api/cart/item', {
                productId,
                quantity
            });
            setCart(response.data);
        } catch (error) {
            console.error('Lỗi cập nhật số lượng:', error);
            alert(error.response?.data?.message || 'Lỗi! Không thể cập nhật.');
        }
    };
    
    // --- Remove Item ---
    const removeItem = async (productId) => {
        try {
            const response = await axios.delete('/api/cart/item', {
                data: { productId } 
            });
            setCart(response.data);
        } catch (error) {
            console.error('Lỗi xóa sản phẩm:', error);
            alert('Lỗi! Không thể xóa sản phẩm.');
        }
    };

    const clearCartFrontend = () => {
        setCart(null);
    };

    const value = {
        cart,
        addToCart,
        updateQuantity,
        removeItem,  
        clearCartFrontend,
        loadingCart: loading,
        cartItemCount: cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0,
        cartTotal: cart?.items?.reduce((total, item) => total + (item.product.price * item.quantity), 0) || 0
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);