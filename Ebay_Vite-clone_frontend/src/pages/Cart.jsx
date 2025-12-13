// src/pages/Cart.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import { BsTrash, BsInfoCircle, BsShieldCheck } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { cart, updateQuantity, removeItem, loadingCart, cartTotal, cartItemCount } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State lưu giá trị input tạm thời để tránh giật khi gõ phím
  const [tempQuantities, setTempQuantities] = useState({});

  // Đồng bộ state tạm thời với dữ liệu giỏ hàng khi cart thay đổi
  useEffect(() => {
    if (cart && cart.items) {
      const newTemp = {};
      cart.items.forEach(item => {
        newTemp[item.product._id] = item.quantity;
      });
      setTempQuantities(newTemp);
    }
  }, [cart]);

  // Hàm gọi API cập nhật số lượng (được dùng chung)
  const handleUpdateApi = (productId, newQuantity) => {
    // Validate số lượng
    const productInCart = cart.items.find(item => item.product._id === productId);
    const maxStock = productInCart?.product.stock || 10;
    
    let validQuantity = newQuantity;
    if (validQuantity < 1) validQuantity = 1;
    if (validQuantity > maxStock) validQuantity = maxStock;

    // Cập nhật state tạm ngay lập tức để UI phản hồi nhanh
    setTempQuantities(prev => ({ ...prev, [productId]: validQuantity }));

    // Gọi API cập nhật
    updateQuantity(productId, validQuantity);
  };

  // Xử lý khi gõ vào ô input (Chỉ cập nhật state tạm, KHÔNG gọi API)
  const handleInputChange = (productId, value) => {
    // Chỉ cho phép nhập số
    if (!/^\d*$/.test(value)) return;
    setTempQuantities(prev => ({ ...prev, [productId]: value }));
  };

  // Xử lý khi blur ra ngoài hoặc nhấn Enter (Mới gọi API)
  const handleInputCommit = (productId, value) => {
    let numVal = parseInt(value);
    if (isNaN(numVal) || numVal < 1) numVal = 1;
    handleUpdateApi(productId, numVal);
  };

  const handleKeyDown = (e, productId, value) => {
    if (e.key === 'Enter') {
      handleInputCommit(productId, value);
      e.target.blur(); // Bỏ focus sau khi enter
    }
  };

  if (loadingCart) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <Header />
        <div className="max-w-[1280px] mx-auto px-4 py-10 text-center">
          <div className="text-xl">Loading your cart...</div>
        </div>
      </div>
    );
  }
  
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] font-sans text-[#191919]">
        <Header />
        <div className="max-w-[1280px] mx-auto px-4 py-10 text-center">
          <h1 className="text-3xl font-bold mb-4">Your shopping cart is empty</h1>
          <p className="mb-6">You don't have any items in your cart yet.</p>
          <Link 
            to="/" 
            className="bg-[#3665f3] text-white px-6 py-3 rounded-full font-bold hover:bg-[#2b50c4] transition"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] font-sans text-[#191919]">
      <Header />
      
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shopping cart</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- LEFT COLUMN: CART ITEMS --- */}
          <div className="flex-1">
            
            {/* Thông báo */}
            { !user && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6 flex gap-3 text-sm text-gray-800">
               <BsInfoCircle className="text-blue-700 text-lg flex-shrink-0 mt-0.5" />
               <div>
                  <span className="font-bold">You've signed out right now.</span> To save these items or see your previously saved items, <Link to="/login" className="text-blue-700 underline">sign in</Link>.
               </div>
            </div>
            )}

            {/* Danh sách sản phẩm */}
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
              
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                 <div className="font-bold text-gray-700 text-sm">
                    Seller: <span className="font-normal text-black">various_sellers</span>
                 </div>
                 <div className="text-xs text-gray-500 flex gap-4">
                    <span className="cursor-pointer hover:underline">Pay only this seller</span>
                    <span className="cursor-pointer hover:underline flex items-center gap-1">
                        Request combined shipping <BsInfoCircle/>
                    </span>
                 </div>
              </div>

              {/* Loop Items */}
              <div className="divide-y divide-gray-200">
                {cart.items.map((item) => {
                  const maxStock = item.product.stock || 10;
                  const currentQty = tempQuantities[item.product._id] !== undefined 
                                     ? tempQuantities[item.product._id] 
                                     : item.quantity;
                  
                  // Chuyển sang số để check disable button
                  const numQty = parseInt(currentQty) || 0;
                  const isMin = numQty <= 1;
                  const isMax = numQty >= maxStock;

                  return (
                    <div key={item.product._id} className="p-6 flex flex-col sm:flex-row gap-4">
                      
                      <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded border border-gray-200 overflow-hidden">
                        <img 
                          src={item.product.images?.[0] || 'https://placehold.co/200x200?text=No+Image'} 
                          alt={item.product.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <div className="pr-4">
                              <Link 
                                  to={`/product/${item.product._id}`} 
                                  className="text-blue-700 hover:underline font-medium text-base line-clamp-2 mb-1"
                              >
                                  {item.product.title}
                              </Link>
                              <p className="text-xs text-gray-500 mb-1">New</p>
                           </div>
                           <div className="text-right">
                              <div className="font-bold text-lg">US ${item.product.price.toLocaleString()}</div>
                           </div>
                        </div>

                        <div className="mt-4 flex justify-between items-end">
                           <div className="flex items-center gap-4 text-xs text-gray-500">
                               
                               {/* Nút tăng giảm số lượng (+ -) */}
                               <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                     <label className="text-gray-700 font-medium">Qty</label>
                                     <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                                         <button 
                                           onClick={() => handleUpdateApi(item.product._id, item.quantity - 1)}
                                           disabled={item.quantity <= 1}
                                           className={`w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border-r border-gray-300 text-base font-bold ${item.quantity <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'}`}
                                         >
                                           -
                                         </button>
                                         
                                         <input 
                                           type="text" 
                                           value={currentQty} 
                                           onChange={(e) => handleInputChange(item.product._id, e.target.value)}
                                           onBlur={(e) => handleInputCommit(item.product._id, e.target.value)}
                                           onKeyDown={(e) => handleKeyDown(e, item.product._id, e.target.value)}
                                           className="w-12 h-8 text-center text-sm font-medium outline-none bg-white"
                                         />
                                         
                                         <button 
                                           onClick={() => handleUpdateApi(item.product._id, item.quantity + 1)}
                                           disabled={item.quantity >= maxStock}
                                           className={`w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border-l border-gray-300 text-base font-bold ${item.quantity >= maxStock ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'}`}
                                         >
                                           +
                                         </button>
                                     </div>
                                  </div>
                                  {/* Thông báo lỗi nếu vượt quá stock (dựa trên số lượng thực tế) */}
                                  {item.quantity >= maxStock && <span className="text-red-500 text-[10px] mt-1 ml-8">Max stock reached</span>}
                               </div>

                               <button 
                                  onClick={() => removeItem(item.product._id)}
                                  className="hover:text-blue-700 hover:underline flex items-center gap-1 ml-2"
                               >
                                  <BsTrash/> Remove
                               </button>
                               <button className="hover:text-blue-700 hover:underline">Save for later</button>
                           </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                           Free shipping
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN: CHECKOUT SUMMARY --- */}
          <div className="w-full lg:w-[350px]">
            <div className="bg-white rounded shadow-sm border border-gray-200 p-6 sticky top-24">
                <div className="flex justify-between items-center mb-4 text-sm">
                    <span className="text-gray-700">Items ({cartItemCount})</span>
                    <span>US ${cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-sm">
                    <span className="text-gray-700">Shipping</span>
                    <span>Free</span>
                </div>
                
                <div className="border-t border-gray-200 my-4"></div>

                <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-bold text-gray-700">Subtotal</span>
                    <span className="text-xl font-bold text-black">US ${cartTotal.toLocaleString()}</span>
                </div>

                <button 
                    onClick={() => alert("Chức năng thanh toán đang phát triển")}
                    className="w-full bg-[#3665f3] hover:bg-[#2b50c4] text-white font-bold py-3 rounded-full transition mb-4"
                >
                    Go to checkout
                </button>
                
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <BsShieldCheck className="text-lg text-blue-700" />
                    <span>Purchase protected by <b>eBay Money Back Guarantee</b></span>
                </div>
            </div>
          </div>

        </div>
      </div>

      <footer className="border-t border-gray-200 mt-12 bg-white text-xs text-gray-500 py-10 text-center">
         Copyright © 1995-2025 eBay Inc. All Rights Reserved.
      </footer>
    </div>
  );
};

export default Cart;