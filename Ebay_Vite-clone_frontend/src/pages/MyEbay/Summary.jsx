// src/pages/MyEbay/Summary.jsx
import React, { useState, useEffect} from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {Link} from 'react-router-dom';
const Summary = () => {
  const { user } = useAuth();
  const [uniqueProducts, setUniqueProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth(); // Lấy token để gọi API

  useEffect(() => {
    const fetchLastPurchasedOrders = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/orders/myorders', {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Lấy 3 sản phẩm mới nhất được purchase (không được trùng nhau và không được lặp lại)
        const allOrderItems = response.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .flatMap(order => 
            order.orderItems.map(item => ({
              ...item,
              orderDate: order.createdAt,
              orderId: order._id
            }))
          )
          .filter(item => item.product); // Filter out items without product reference
        
        // Lọc các sản phẩm unique dựa trên product ID
        const seenProductIds = new Set();
        const uniqueItems = [];
        
        for (const item of allOrderItems) {
          const productId = item.product?._id || item.product;
          if (productId && !seenProductIds.has(productId.toString())) {
            seenProductIds.add(productId.toString());
            uniqueItems.push(item);
            if (uniqueItems.length >= 3) break; // Chỉ lấy 3 sản phẩm đầu tiên
          }
        }
        
        setUniqueProducts(uniqueItems);
      } catch (err) {
        console.error("Lỗi tải đơn hàng:", err);
        setError("Không thể tải lịch sử đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
        fetchLastPurchasedOrders();
    }
  }, [token]);

  

  const renderProductCard = (item, index) => {
    // Use order item's own data (title, price, image) instead of product
    // Only use product._id for the link
    const productId = item.product?._id || item.product;
    if (!productId) return null; // Skip if no product ID
    
    // Tạo key duy nhất bằng cách kết hợp orderId và productId
    const uniqueKey = `${item.orderId || 'order'}-${productId}-${index}`;
    
    return (
      <div key={uniqueKey} className="group cursor-pointer shrink-0">
        <div className="relative w-60 h-60 aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 border border-gray-200">
          <Link to={`/product/${productId}`} className="group cursor-pointer">
            <img 
              src={item.image || 'https://placehold.co/200x200?text=No+Image'} 
              alt={item.title || 'Product'} 
              className="w-60 h-60 object-cover group-hover:scale-105 transition duration-300 "
            />
          </Link>
        </div>
        <Link to={`/product/${productId}`} className="group cursor-pointer">
          <h3 className="text-sm hover:underline hover:text-blue-700 line-clamp-2 h-10 mb-1 leading-snug text-gray-800">
            {item.title || 'Untitled Product'}
          </h3>
        </Link>
        <div className="font-bold text-lg text-gray-900">
          ${(item.price || 0).toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">Free shipping</div> 
      </div>
    );
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Summary</h2>
      <div className="p-6 bg-white rounded border border-gray-200 shadow-sm">
        <p className="text-lg">Welcome back, <b>{user?.username}</b>!</p>
        <p className="text-gray-500 mt-2">Check your "Purchase history" to see your orders.</p>
      </div>
      <div className="p-6 bg-white rounded border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Recently Purchased Products</h3>
      {
        uniqueProducts.length > 0 ? (
          <div className="ProductCard flex flex-wrap gap-4">
            {uniqueProducts.map((item, index) => renderProductCard(item, index))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded border border-gray-200">
            <p>You haven't purchased any products yet</p>
            <Link to="/" className="text-blue-700 underline font-bold">Start Shopping Now</Link>
          </div>
        )
      }
      </div>
      <div className="p-6 bg-white rounded border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Recently Activity</h3>
        

      </div>
    </div>
  );
};

export default Summary;