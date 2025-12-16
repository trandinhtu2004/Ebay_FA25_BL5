// src/pages/MyEbay/PurchaseHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BsSearch, BsChevronDown, BsCheckCircleFill, BsInfoCircleFill, BsHeart, BsBoxes, BsExclamationCircleFill } from 'react-icons/bs';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';
import Pagination from '../../components/Pagination';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api';

const PurchaseHistory = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [openMoreActions, setOpenMoreActions] = useState({});
  // State quản lý việc hiển thị modal địa chỉ của từng order (key: orderId)
  const [openAddressModal, setOpenAddressModal] = useState({});

  // State cho modal Review
  const [reviewModal, setReviewModal] = useState({
    open: false,
    orderId: null,
    productId: null,
    itemTitle: ''
  });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(60);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const [ordersRes, returnsRes] = await Promise.all([
            axios.get('http://localhost:5001/api/orders/myorders', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get('http://localhost:5001/api/returns/myrequests', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setAllOrders(ordersRes.data);
        setReturnRequests(returnsRes.data);
        setCurrentPage(1); 
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        setError("Không thể tải lịch sử đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  const checkReturnStatus = (orderId, productId = null) => {
     const orderReturn = returnRequests.find(req => 
        req.order._id === orderId && !req.product
     );
     if (orderReturn) return true; 

     if (productId) {
        const productReturn = returnRequests.find(req => 
            req.order._id === orderId && req.product?._id === productId
        );
        return !!productReturn;
     }
     return false;
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const orderIdParam = searchParams.get('orderId');

    if (orderIdParam) {
      setSearchTerm(orderIdParam);
      setDateFilter(0);
    }
  }, [location.search]);

  useEffect(() => {
    let filtered = [...allOrders];

    if (dateFilter > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dateFilter);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= cutoffDate;
      });
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => {
        if (order._id.toLowerCase().includes(searchLower)) return true;
        
        const hasMatchingProduct = order.orderItems.some(item => 
          item.title.toLowerCase().includes(searchLower)
        );
        if (hasMatchingProduct) return true;

        const hasMatchingSeller = order.orderItems.some(item => 
          item.product?.seller?.username?.toLowerCase().includes(searchLower)
        );
        if (hasMatchingSeller) return true;

        if (order.shippingAddress?.fullName?.toLowerCase().includes(searchLower)) return true;

        return false;
      });
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [allOrders, searchTerm, dateFilter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.more-actions-container')) {
        setOpenMoreActions({});
      }
      if (!event.target.closest('.date-filter-container')) {
        setShowDateDropdown(false);
      }
      // Đóng modal địa chỉ khi click ra ngoài
      if (!event.target.closest('.address-modal-container')) {
        setOpenAddressModal({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClickMoreAction = (orderId, itemIndex) => {
    const key = `${orderId}-${itemIndex}`;
    setOpenMoreActions(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Toggle modal địa chỉ cho từng order
  const handleToggleAddressModal = (orderId) => {
    setOpenAddressModal(prev => ({
        ...prev,
        [orderId]: !prev[orderId]
    }));
  }

  const handleReturnOrder = async (orderId, productId, itemIndex) => {
    try {
      if (!orderId) {
        toast.error("Thông tin đơn hàng không hợp lệ!");
        return;
      }
      if (!isAuthenticated) {
        toast.info("Vui lòng đăng nhập!");
        navigate('/login');
        return;
      }

      const reason = window.prompt("Vui lòng nhập lý do hoàn trả:");
      if (!reason || reason.trim() === '') return;

      const returnData = { orderId, reason: reason.trim() };
      if (productId) {
        returnData.productId = productId;
      }
      
      const res = await axios.post(`http://localhost:5001/api/returns`, returnData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReturnRequests(prev => [...prev, res.data.returnRequest]);
      setAllOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId
            ? { ...order, status: 'waiting for cancelling approval' }
            : order
        )
      );

      toast.success("Đã gửi yêu cầu hoàn trả thành công! Vui lòng đợi duyệt.");
      
      const key = `${orderId}-${itemIndex}`;
      setOpenMoreActions(prev => ({ ...prev, [key]: false }));

    } catch (error) {
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra!";
      toast.error(errorMessage);
    }
  }

  const handleAddToCart = async (productId) => {
      try {
        if(!productId) return;
        if(!isAuthenticated) {
            toast.info("Vui lòng đăng nhập lại");
            navigate('/login');
            return;
        }
        await addToCart(productId, 1);
        toast.success("Đã thêm vào giỏ hàng!");
      } catch (e) { toast.error("Lỗi thêm giỏ hàng"); }
  }
  
  const handleAddToFavorites = async (productId) => {
      // Logic thêm yêu thích
      toast.success("Đã thêm vào yêu thích!");
  }

  // Mở modal Review cho 1 item
  const handleOpenReviewModal = (orderId, productId, title, moreActionKey) => {
    setReviewModal({
      open: true,
      orderId,
      productId,
      itemTitle: title || ''
    });
    setReviewRating(5);
    setReviewComment('');

    if (moreActionKey) {
      setOpenMoreActions(prev => ({ ...prev, [moreActionKey]: false }));
    }
  };

  const handleCloseReviewModal = () => {
    setReviewModal({
      open: false,
      orderId: null,
      productId: null,
      itemTitle: ''
    });
    setReviewComment('');
    setReviewRating(5);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModal.orderId || !reviewModal.productId) {
      toast.error('Thông tin đơn hàng/sản phẩm không hợp lệ.');
      return;
    }
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để đánh giá.');
      navigate('/login');
      return;
    }
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      toast.error('Vui lòng chọn số sao từ 1 đến 5.');
      return;
    }

    try {
      setSubmittingReview(true);
      await axios.post(
        `${API_URL}/api/reviews`,
        {
          productId: reviewModal.productId,
          orderId: reviewModal.orderId,
          rating: reviewRating,
          comment: reviewComment
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Gửi đánh giá thành công!');
      handleCloseReviewModal();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể gửi đánh giá.';
      toast.error(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const getDateFilterText = (days) => (days === 0 ? 'All' : `Last ${days} Days`);
  const handlePageChange = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Orders</h2>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <input 
                    type="text" 
                    placeholder="Search your orders" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-8 py-2 border border-gray-300 rounded-full text-sm w-full focus:outline-none focus:border-blue-500"
                />
                <BsSearch className="absolute left-3 top-2.5 text-gray-500" />
                {searchTerm && (
                  <button onClick={() => { setSearchTerm(''); setDateFilter(60); navigate('/my-ebay/purchase-history', { replace: true }); }} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">×</button>
                )}
            </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm mb-4 border-b border-gray-100 pb-2">
         <div className="flex gap-1 text-gray-500">
             <span>Show:</span>
             <button className="text-blue-700 font-bold flex items-center gap-1 hover:underline">Not hidden <BsChevronDown size={10}/></button>
         </div>
         <div className="flex gap-4 items-center">
             <span className="text-gray-500 hidden sm:inline">See orders from:</span>
             <div className="relative date-filter-container">
                 <button onClick={() => setShowDateDropdown(!showDateDropdown)} className="border border-gray-300 px-3 py-1 rounded font-bold flex items-center gap-2 hover:bg-gray-50 bg-white text-gray-700">
                     {getDateFilterText(dateFilter)} <BsChevronDown size={10} className={`transition-transform ${showDateDropdown ? 'rotate-180' : ''}`}/>
                 </button>
                 {showDateDropdown && (
                   <div className="absolute right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[150px] overflow-hidden">
                     {[0, 7, 30, 60, 90].map((days) => (
                       <button key={days} onClick={() => { setDateFilter(days); setShowDateDropdown(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${dateFilter === days ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700'}`}>
                         {getDateFilterText(days)}
                       </button>
                     ))}
                   </div>
                 )}
             </div>
         </div>
      </div>

      <div className="flex flex-col gap-6">
        {allOrders.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded border border-gray-200">
                <p>You have no orders yet.</p>
                <Link to="/" className="text-blue-700 underline font-bold">Start shopping</Link>
            </div>
        ) : filteredOrders.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded border border-gray-200">
                <p>No orders found matching your search criteria.</p>
                <button onClick={() => { setSearchTerm(''); setDateFilter(60); }} className="text-blue-700 underline font-bold mt-2">Clear filters</button>
            </div>
        ) : (
            <>
            {currentOrders.map((order,index) => {
                const isFullOrderReturned = checkReturnStatus(order._id);
                const isOrderCancelledOrWaiting = order.status === 'cancelled' || order.status === 'waiting for cancelling approval';
                
                return (
                <div key={order._id} className="border border-gray-300 rounded-lg overflow-visible bg-white shadow-sm">
                    
                    {/* --- Order Header (Gray Bar) --- */}
                    <div className="bg-gray-100 px-4 py-3 flex flex-wrap justify-between text-xs text-gray-600 border-b border-gray-300">
                        <div className="flex gap-8 items-start">
                            <div>
                                <div className="uppercase text-[10px] mb-0.5 font-bold text-gray-500">ORDER PLACED</div>
                                <div className="text-black font-medium">
                                    {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                            <div>
                                <div className="uppercase text-[10px] mb-0.5 font-bold text-gray-500">TOTAL</div>
                                <div className="text-black font-medium">US ${order.totalPrice.toLocaleString()}</div>
                            </div>
                            
                            {/* --- Ship To Modal --- */}
                            <div className="relative address-modal-container hidden sm:block">
                                <div className="uppercase text-[10px] mb-0.5 font-bold text-gray-500">SHIP TO</div>
                                <button 
                                    onClick={() => handleToggleAddressModal(order._id)}
                                    className="text-blue-700 font-medium hover:underline cursor-pointer flex items-center gap-1 focus:outline-none"
                                >
                                    {order.shippingAddress?.fullName} <BsChevronDown size={8}/>
                                </button>
                                
                                {openAddressModal[order._id] && (
                                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded shadow-lg z-50 w-64 p-4 text-sm text-gray-800">
                                        <div className="font-bold mb-1">{order.shippingAddress?.fullName}</div>
                                        <div>{order.shippingAddress?.street}</div>
                                        <div>{order.shippingAddress?.city}, {order.shippingAddress?.country}</div>
                                        <div className="mt-1 text-gray-500">Phone: {order.shippingAddress?.phone}</div>
                                    </div>
                                )}
                            </div>

                            {/* --- Payment Info --- */}
                            <div>
                                <div className="uppercase text-[10px] mb-0.5 font-bold text-gray-500">PAYMENT</div>
                                <div className="text-black font-medium capitalize">{order.paymentMethod}</div>
                                {order.paymentResult && (
                                    <div className="text-[10px] text-gray-500">
                                        Status: <span className={(order.paymentResult.status === 'paid' ? 'text-green-600 font-bold' : '') || 
                                          (order.paymentResult.status === 'failed' ? 'text-red-600 font-bold' : '') ||
                                          (order.paymentResult.status === 'pending' ? 'text-yellow-600 font-bold' : '')
                                        }
                                                >{order.paymentResult.status}</span>
                                        <br/>
                                        Updated: {new Date(order.paymentResult.update_time || order.updatedAt).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-2 sm:mt-0 flex flex-col items-end">
                            <div className="uppercase text-[10px] mb-0.5 font-bold text-gray-500 text-right">ORDER # {order._id.substring(0, 8).toUpperCase()}</div>
                            
                            {!isOrderCancelledOrWaiting && !isFullOrderReturned && (
                                <div 
                                    onClick={() => handleReturnOrder(order._id, null, index)} 
                                    className="text-blue-700 font-medium hover:underline cursor-pointer text-right"
                                >
                                    {/* Logic hiển thị text nút: Nếu chưa ship -> Cancel, Đã ship -> Return */}
                                    {(order.status === 'pending' || order.status === 'processing' || order.status === 'pending_confirmation') 
                                        ? "Cancel order" 
                                        : "Return order"
                                    }
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4 overflow-visible">
                        {order.orderItems.map((item, itemIdx) => {
                            const isItemReturned = checkReturnStatus(order._id, item.product?._id || item.product);
                            const disableItemReturn = isOrderCancelledOrWaiting || isFullOrderReturned || isItemReturned;

                            // Text hiển thị trên nút dựa vào trạng thái vận chuyển
                            const returnButtonText = (order.status === 'pending' || order.status === 'processing' || order.status === 'pending_confirmation') 
                                ? "Cancel This Item" 
                                : "Return This Item";

                            return (
                            <div key={itemIdx} className="flex flex-col md:flex-row gap-4 mb-4 last:mb-0 overflow-visible">
                                <div className="w-32 h-32 bg-gray-100 shrink-0 border border-gray-200 rounded-sm overflow-hidden">
                                    <img 
                                        src={item.image || 'https://placehold.co/150x150?text=No+Image'} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>

                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 mb-1">
                                        SOLD BY: <span className="text-blue-700 font-bold hover:underline cursor-pointer">
                                            {item.product?.seller?.username || 'Unknown Seller'}
                                        </span>
                                    </div>
                                    <Link to={`/product/${item.product?._id}`} className="text-blue-700 font-medium hover:underline cursor-pointer text-base line-clamp-2 mb-1">
                                        {item.title}
                                    </Link>
                                    
                                    {/* Status Message Logic */}
                                    <div className="mt-3">
                                        {order.status === 'cancelled' && (
                                            <><div className="font-bold text-base text-red-600 flex items-center gap-2"><BsInfoCircleFill className="text-red-600" /> Cancelled</div><div className="text-xs text-gray-500 ml-6">Order cancelled.</div></>
                                        )}
                                        {order.status === 'waiting for cancelling approval' && (
                                            <><div className="font-bold text-base text-orange-600 flex items-center gap-2"><BsExclamationCircleFill className="text-orange-600" /> Return Pending</div><div className="text-xs text-gray-500 ml-6">Waiting for approval.</div></>
                                        )}
                                        {order.status === 'shipped' && (
                                            <><div className="font-bold text-base text-[#191919] flex items-center gap-2"><BsInfoCircleFill className="text-blue-600" /> Shipped</div><div className="text-xs text-gray-500 ml-6">Item shipped.</div></>
                                        )}
                                        {order.status === 'delivered' && (
                                            <><div className="font-bold text-base text-[#191919] flex items-center gap-2"><BsCheckCircleFill className="text-green-600" /> Delivered {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : ''}</div><div className="text-xs text-gray-500 ml-6">Package delivered.</div></>
                                        )}
                                        {['pending', 'processing', 'pending_confirmation'].includes(order.status) && (
                                            <><div className="font-bold text-base text-[#191919] flex items-center gap-2"><BsInfoCircleFill className="text-blue-600" /> {order.status.replace('_', ' ')}</div><div className="text-xs text-gray-500 ml-6">Processing order.</div></>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full md:w-48 flex flex-col gap-2 relative">
                                    {!disableItemReturn ? (
                                        <button 
                                            onClick={() => handleReturnOrder(order._id, item.product?._id || item.product, index)} 
                                            className="w-full bg-[#3665f3] hover:bg-[#2b50c4] text-white font-bold py-1.5 rounded-full text-sm transition"
                                        >
                                            {returnButtonText}
                                        </button>
                                    ) : (
                                        <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-1.5 rounded-full text-sm cursor-not-allowed">
                                            Request Sent
                                        </button>
                                    )}

                                    <button onClick={() => handleAddToCart(item.product?._id || item.product)} className="w-full border border-gray-300 text-blue-700 font-bold py-1.5 rounded-full text-sm hover:bg-gray-50 transition">Add To Cart</button>
                                    
                                    <div className="relative more-actions-container">
                                        <button onClick={() => handleClickMoreAction(order._id, itemIdx)} className="w-full border border-gray-300 text-blue-700 font-bold py-1.5 rounded-full text-sm hover:bg-gray-50 transition flex items-center justify-center gap-1">
                                            More actions <BsChevronDown size={10} className={`inline transition-transform ${openMoreActions[`${order._id}-${itemIdx}`] ? 'rotate-180' : ''}`}/>
                                        </button>
                                        {openMoreActions[`${order._id}-${itemIdx}`] && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden">
                                                <button onClick={() => handleAddToFavorites(item.product?._id || item.product)} className="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-gray-50 transition flex items-center gap-2">
                                                    <BsHeart className="inline" /> Favorite Product
                                                </button>
                                                {!disableItemReturn && (
                                                    <button
                                                      onClick={() =>
                                                        handleOpenReviewModal(
                                                          order._id,
                                                          item.product?._id || item.product,
                                                          item.title,
                                                          `${order._id}-${itemIdx}`
                                                        )
                                                      }
                                                      className="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-gray-50 transition flex items-center gap-2 border-t border-gray-200"
                                                    >
                                                        <BsBoxes className="inline" /> Review
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            )})}
            
            {filteredOrders.length > itemsPerPage && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} itemsPerPage={itemsPerPage} totalItems={filteredOrders.length} showInfo={true} />
            )}
            </>
        )}
      </div>

      {/* Modal Review */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="border-b px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold text-lg">Review item</h3>
              <button
                onClick={handleCloseReviewModal}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitReview} className="px-4 py-4 space-y-4">
              {reviewModal.itemTitle && (
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Item: </span>
                  <span>{reviewModal.itemTitle}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Rating (1 - 5)
                </label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((v) => (
                    <option key={v} value={v}>
                      {v} star{v > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Comment
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
                  placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseReviewModal}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-full bg-[#3665f3] text-white font-bold hover:bg-[#2b50c4] disabled:opacity-60"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Submit review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory;