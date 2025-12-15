// src/pages/MyEbay/PurchaseHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BsSearch, BsChevronDown, BsCheckCircleFill, BsInfoCircleFill, BsHeart, BsArrowReturnLeft } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {toast} from 'react-toastify';
import {useNavigate} from 'react-router-dom';
import Pagination from '../../components/Pagination';
// URL Backend
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api';

const PurchaseHistory = () => {
  const [allOrders, setAllOrders] = useState([]); // Tất cả orders từ API
  const [filteredOrders, setFilteredOrders] = useState([]); // Orders sau khi filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // State để quản lý việc hiển thị More Actions cho từng item (key: "orderId-itemIndex")
  const [openMoreActions, setOpenMoreActions] = useState({});
  // State cho pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Số đơn hàng hiển thị mỗi trang
  // State cho filter
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(60); // Mặc định: Last 60 Days (0 = All)
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const { token, isAuthenticated } = useAuth(); // Lấy token để gọi API

  const navigate = useNavigate();
  const {addToCart} = useCart();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/orders/myorders', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setAllOrders(response.data);
        setCurrentPage(1); // Reset về trang 1 khi load lại orders
      } catch (err) {
        console.error("Lỗi tải đơn hàng:", err);
        setError("Không thể tải lịch sử đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
        fetchOrders();
    }
  }, [token]);

  // Filter orders dựa trên searchTerm và dateFilter
  useEffect(() => {
    let filtered = [...allOrders];

    // Filter theo số ngày
    if (dateFilter > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dateFilter);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= cutoffDate;
      });
    }

    // Filter theo search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => {
        // Tìm trong Order ID
        if (order._id.toLowerCase().includes(searchLower)) return true;
        
        // Tìm trong product titles
        const hasMatchingProduct = order.orderItems.some(item => 
          item.title.toLowerCase().includes(searchLower)
        );
        if (hasMatchingProduct) return true;

        // Tìm trong seller names
        const hasMatchingSeller = order.orderItems.some(item => 
          item.product?.seller?.username?.toLowerCase().includes(searchLower)
        );
        if (hasMatchingSeller) return true;

        // Tìm trong shipping address
        if (order.shippingAddress?.fullName?.toLowerCase().includes(searchLower)) return true;

        return false;
      });
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset về trang 1 khi filter thay đổi
  }, [allOrders, searchTerm, dateFilter]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Kiểm tra xem click có phải ở ngoài dropdown không
      if (!event.target.closest('.more-actions-container')) {
        setOpenMoreActions({});
      }
      // Đóng date filter dropdown
      if (!event.target.closest('.date-filter-container')) {
        setShowDateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClickMoreAction = (orderId, itemIndex) => {
    const key = `${orderId}-${itemIndex}`;
    setOpenMoreActions(prev => ({
      ...prev,
      [key]: !prev[key] // Toggle state
    }));
  }

  const handleAddToFavorites = async (productId) => {
    try {
      if (!productId) {
        toast.error("Không tìm thấy sản phẩm!");
        return;
      }

      if (!isAuthenticated) {
        toast.info("Vui lòng đăng nhập để thêm vào yêu thích");
        navigate('/login');
        return;
      }

      // TODO: Gọi API thêm vào favorites/watchlist
      // const response = await axios.post(`${API_URL}/favorites`, { productId }, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      
      toast.success("Đã thêm vào mục yêu thích!");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thêm vào yêu thích!");
      console.error(error);
    }
  }

  const handleReturnOrder = async (orderId, productId, itemIndex) => {
    try {
      if (!orderId || !productId) {
        toast.error("Thông tin đơn hàng không hợp lệ!");
        return;
      }

      if (!isAuthenticated) {
        toast.info("Vui lòng đăng nhập!");
        navigate('/login');
        return;
      }

      // Hiển thị prompt để nhập lý do hoàn trả
      const reason = window.prompt("Vui lòng nhập lý do hoàn trả đơn hàng:");
      if (!reason || reason.trim() === '') {
        toast.info("Bạn chưa nhập lý do hoàn trả!");
        return;
      }

      // Gọi API tạo yêu cầu hoàn trả
      await axios.post(`${API_URL}/returns`, {
        orderId,
        productId,
        reason: reason.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Đã gửi yêu cầu hoàn trả đơn hàng thành công!");
      
      // Đóng More Actions sau khi gửi yêu cầu
      const key = `${orderId}-${itemIndex}`;
      setOpenMoreActions(prev => ({
        ...prev,
        [key]: false
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu hoàn trả!";
      toast.error(errorMessage);
      console.error(error);
    }
  }
  const handleAddToCart = async (productId) => {
    try{
        if(!productId){
            toast.error("Không tìm thấy sản phẩm!");
            return;
        }
        
        if(!isAuthenticated){
            toast.info("Có lỗi xảy ra. Vui lòng đăng nhập lại");
            navigate('/login');
            return;
        }

        await addToCart(productId, 1);
        toast.success("Đã thêm vào giỏ hàng!");
    }catch(error){
        toast.error("Có lỗi xảy ra!!!");
        console.error(error);
    }
  }

  // Tính toán phân trang dựa trên filteredOrders
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Helper function để lấy text cho date filter
  const getDateFilterText = (days) => {
    if (days === 0) return 'All';
    if (days === 7) return 'Last 7 Days';
    if (days === 30) return 'Last 30 Days';
    if (days === 60) return 'Last 60 Days';
    if (days === 90) return 'Last 90 Days';
    return `Last ${days} Days`;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll lên đầu trang khi chuyển trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div>
      {/* --- Filter & Search Bar --- */}
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
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
            </div>
        </div>
      </div>

      {/* --- Filter Options --- */}
      <div className="flex justify-between items-center text-sm mb-4 border-b border-gray-100 pb-2">
         <div className="flex gap-1 text-gray-500">
             <span>Show:</span>
             <button className="text-blue-700 font-bold flex items-center gap-1 hover:underline">Not hidden <BsChevronDown size={10}/></button>
         </div>
         <div className="flex gap-4 items-center">
             <span className="text-gray-500 hidden sm:inline">See orders from:</span>
             <div className="relative date-filter-container">
                 <button 
                   onClick={() => setShowDateDropdown(!showDateDropdown)}
                   className="border border-gray-300 px-3 py-1 rounded font-bold flex items-center gap-2 hover:bg-gray-50 bg-white text-gray-700"
                 >
                     {getDateFilterText(dateFilter)} <BsChevronDown size={10} className={`transition-transform ${showDateDropdown ? 'rotate-180' : ''}`}/>
                 </button>
                 
                 {/* Date Filter Dropdown */}
                 {showDateDropdown && (
                   <div className="absolute right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[150px] overflow-hidden">
                     {[0, 7, 30, 60, 90].map((days) => (
                       <button
                         key={days}
                         onClick={() => {
                           setDateFilter(days);
                           setShowDateDropdown(false);
                         }}
                         className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${
                           dateFilter === days ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700'
                         }`}
                       >
                         {getDateFilterText(days)}
                       </button>
                     ))}
                   </div>
                 )}
             </div>
         </div>
      </div>

      {/* --- ORDER LIST --- */}
      <div className="flex flex-col gap-6">
        {allOrders.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded border border-gray-200">
                <p>You have no orders yet.</p>
                <Link to="/" className="text-blue-700 underline font-bold">Start shopping</Link>
            </div>
        ) : filteredOrders.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded border border-gray-200">
                <p>No orders found matching your search criteria.</p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setDateFilter(60);
                  }}
                  className="text-blue-700 underline font-bold mt-2"
                >
                  Clear filters
                </button>
            </div>
        ) : (
            <>
            {currentOrders.map(order => (
                <div key={order._id} className="border border-gray-300 rounded-lg overflow-visible bg-white shadow-sm">
                    
                    {/* Order Header (Gray Bar) */}
                    <div className="bg-gray-100 px-4 py-2 flex flex-wrap justify-between text-xs text-gray-600 border-b border-gray-300">
                        <div className="flex gap-6 sm:gap-10 items-center">
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
                            <div className="hidden sm:block">
                                <div className="uppercase text-[10px] mb-0.5 font-bold text-gray-500">SHIP TO</div>
                                <div className="text-blue-700 font-medium hover:underline cursor-pointer flex items-center gap-1">
                                    {order.shippingAddress?.fullName} <BsChevronDown size={8}/>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-0">
                            <div className="uppercase text-[10px] mb-0.5 font-bold text-gray-500 text-right">ORDER # {order._id.substring(0, 8).toUpperCase()}</div>
                            <div className="text-blue-700 font-medium hover:underline cursor-pointer text-right">View Order Details</div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4 overflow-visible">
                        {order.orderItems.map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 mb-4 last:mb-0 overflow-visible">
                                
                                {/* Image */}
                                <div className="w-32 h-32 bg-gray-100 shrink-0 border border-gray-200 rounded-sm overflow-hidden">
                                    <img 
                                        src={item.image || 'https://placehold.co/150x150?text=No+Image'} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 mb-1">
                                        SOLD BY: <span className="text-blue-700 font-bold hover:underline cursor-pointer">
                                            {/* Hiển thị tên người bán từ dữ liệu populate ở Backend */}
                                            {item.product?.seller?.username || 'Unknown Seller'}
                                        </span>
                                    </div>
                                    <Link to={`/product/${item.product?._id}`} className="text-blue-700 font-medium hover:underline cursor-pointer text-base line-clamp-2 mb-1">
                                        {item.title}
                                    </Link>
                                    
                                    {/* Status Message */}
                                    {order.status === 'delivered' ? (
                                        <div className="mt-3">
                                            <div className="font-bold text-base text-[#191919] flex items-center gap-2">
                                                <BsCheckCircleFill className="text-green-600" />
                                                Delivered {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : ''}
                                            </div>
                                            <div className="text-xs text-gray-500 ml-6">
                                                Package was left near the front door or porch.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-3">
                                            <div className="font-bold text-base text-[#191919] flex items-center gap-2">
                                                <BsInfoCircleFill className="text-blue-600" />
                                                {order.status === 'shipped' ? 'Shipped' : 'Paid - Preparing for shipment'}
                                            </div>
                                            <div className="text-xs text-gray-500 ml-6">
                                                {order.status === 'shipped' 
                                                    ? 'Your item is on its way.' 
                                                    : 'We will notify you when it ships.'}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Buttons (Right Side) */}
                                <div className="w-full md:w-48 flex flex-col gap-2 relative">
                                    <button className="w-full bg-[#3665f3] hover:bg-[#2b50c4] text-white font-bold py-1.5 rounded-full text-sm transition">
                                        View Order Details
                                    </button>
                                    <button 
                                        onClick={() => handleAddToCart(item.product?._id || item.product)} 
                                        className="w-full border border-gray-300 text-blue-700 font-bold py-1.5 rounded-full text-sm hover:bg-gray-50 transition"
                                    >
                                        Buy this again
                                    </button>
                                    <div className="relative more-actions-container">
                                        <button 
                                            onClick={() => handleClickMoreAction(order._id, index)}
                                            className="w-full border border-gray-300 text-blue-700 font-bold py-1.5 rounded-full text-sm hover:bg-gray-50 transition flex items-center justify-center gap-1"
                                        >
                                            More actions <BsChevronDown size={10} className={`inline transition-transform ${openMoreActions[`${order._id}-${index}`] ? 'rotate-180' : ''}`}/>
                                        </button>
                                        
                                        {/* Dropdown menu hiển thị khi click More actions */}
                                        {openMoreActions[`${order._id}-${index}`] && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden">
                                                <button
                                                    onClick={() => handleAddToFavorites(item.product?._id || item.product)}
                                                    className="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-gray-50 transition flex items-center gap-2"
                                                >
                                                    <BsHeart className="inline" />
                                                    Favorite Product
                                                </button>
                                                <button
                                                    onClick={() => handleReturnOrder(order._id, item.product?._id || item.product, index)}
                                                    className="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-gray-50 transition flex items-center gap-2 border-t border-gray-200"
                                                >
                                                    <BsArrowReturnLeft className="inline" />
                                                    Hoàn trả sản phẩm
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>

                </div>
            ))}
            
            {/* Pagination Component */}
            {filteredOrders.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={filteredOrders.length}
                showInfo={true}
              />
            )}
            </>
        )}
      </div>
    </div>
  );
};

export default PurchaseHistory;