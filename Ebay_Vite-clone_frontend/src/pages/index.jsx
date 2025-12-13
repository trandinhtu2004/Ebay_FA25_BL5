import React, { useState, useEffect } from 'react';
import { BsBell, BsCart2, BsSearch, BsHeart } from 'react-icons/bs';
import { AiOutlineDown, AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';
import Header from '../components/Header';
import { Link, useNavigate } from 'react-router-dom';
// Cấu hình URL Backend (Thay đổi port nếu backend của bạn chạy port khác)
const API_URL = 'http://localhost:5001/api/products'; 

function Index() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // State quản lý dữ liệu
  const [allProducts, setAllProducts] = useState([]);
  const [dailyDeals, setDailyDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  // State phân trang cho phần "All Products"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18; // 3 hàng x 6 cột

  // Fetch dữ liệu từ Backend khi load trang
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        const uniqueCats = [...new Set(data.map(item => item.category?.name || 'Other'))];
        setCategories(uniqueCats);
        // 1. Lưu toàn bộ sản phẩm
        setAllProducts(data);

        // 2. Random 6 sản phẩm cho Daily Deals
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setDailyDeals(shuffled.slice(0, 6));

        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Không thể tải sản phẩm. Vui lòng kiểm tra Backend.");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Logic phân trang Client-side
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAllProducts = allProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(allProducts.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll xuống phần All Products khi chuyển trang
    document.getElementById('all-products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper render Product Card để tái sử dụng
  const renderProductCard = (product) => (
    <div key={product._id} className="group cursor-pointer">
      
      <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 border border-gray-200">
        {/* Lấy ảnh đầu tiên trong mảng images, nếu không có dùng placeholder */}
        <Link to={`/product/${product._id}`} key={product._id} className="group cursor-pointer">
        <img 
          src={product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/200x200?text=No+Image'} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        </Link>
        <button className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:text-ebay-red opacity-0 group-hover:opacity-100 transition">
          <BsHeart />
        </button>
      </div>
       <Link to={`/product/${product._id}`} key={product._id} className="group cursor-pointer">
      <h3 className="text-sm hover:underline hover:text-blue-700 line-clamp-2 h-10 mb-1 leading-snug text-gray-800">
        {product.title}
      </h3>
      </Link>
      <div className="font-bold text-lg text-gray-900">${product.price.toLocaleString()}</div>
      {/* Giả lập thông tin shipping vì DB chưa có trường này, bạn có thể thêm logic sau */}
      <div className="text-xs text-gray-500">Free shipping</div> 
    </div>
  );

  

  return (
    <div className="font-sans text-gray-800 bg-white min-h-screen">

      <Header categories={categories} />
      {/* --- TOP BAR ---
      <div className="border-b border-gray-200 text-xs px-4 py-1 hidden md:block">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            <span>Hi! <a href="/login" className="text-blue-700 hover:underline">Sign in</a> or <a href="/register" className="text-blue-700 hover:underline">register</a></span>
            <a href="#" className="hover:underline">Daily Deals</a>
            <a href="#" className="hover:underline">Brand Outlet</a>
            <a href="#" className="hover:underline">Help & Contact</a>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:underline">Sell</a>
            <a href="#" className="hover:underline flex items-center gap-1">Watchlist <AiOutlineDown /></a>
            <a href="#" className="hover:underline flex items-center gap-1">My eBay <AiOutlineDown /></a>
            <div className="relative">
              <BsBell className="text-lg cursor-pointer" />
            </div>
            <div className="relative">
              <BsCart2 className="text-lg cursor-pointer" />
            </div>
          </div>
        </div>
      </div> 

      <div className="max-w-[1280px] mx-auto px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <a href="/" className="text-4xl font-bold tracking-tighter shrink-0 cursor-pointer">
            <span className="text-ebay-red">e</span>
            <span className="text-ebay-blue">b</span>
            <span className="text-ebay-yellow">a</span>
            <span className="text-ebay-green">y</span>
          </a>

          <div className="hidden md:flex items-center gap-1 text-sm text-gray-600 cursor-pointer whitespace-nowrap hover:text-blue-600">
            Shop by category <AiOutlineDown size={10} />
          </div>

          <div className="flex-1 flex h-10 md:h-12 border-2 border-black rounded overflow-hidden relative">
            <div className="flex items-center px-3 gap-2 w-full">
              <BsSearch className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search for anything" 
                className="w-full outline-none text-black"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select className="border-l border-gray-300 text-sm px-4 bg-white hidden md:block outline-none text-gray-600 cursor-pointer max-w-[150px]">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Fashion</option>
            </select>
          </div>
          
          <button className="bg-ebay-blue text-white px-8 md:px-12 h-10 md:h-12 font-semibold text-lg rounded hover:bg-blue-700 transition">
            Search
          </button>

          <a href="#" className="text-xs text-gray-500 whitespace-nowrap hidden lg:block hover:underline">Advanced</a>
        </div>
      </div>
     
        */}
     
      <div className="max-w-[1280px] mx-auto px-4 py-2 border-b border-gray-100 hidden md:block overflow-x-auto">
        <ul className="flex justify-center gap-6 text-xs lg:text-sm text-gray-600 whitespace-nowrap">
          <li className="hover:text-ebay-blue hover:underline cursor-pointer group relative">
            <Link to="/all-products">Explore All</Link>
          </li>
          {categories.map((cat, index) => (
            <li key={index} className="hover:text-ebay-blue hover:underline cursor-pointer group relative">
              <Link to={`/all-products?category=${encodeURIComponent(cat)}`}>{cat}</Link>
            </li>
          ))}
        </ul>
      </div>

      {/* --- HERO SECTION --- */}
      <div className="max-w-[1280px] mx-auto px-4 py-6">
        <div className="bg-gray-100 rounded-lg overflow-hidden flex flex-col md:flex-row h-auto md:h-[350px] relative hover:shadow-lg transition cursor-pointer">
          <div className="p-8 md:p-12 flex flex-col justify-center items-start w-full md:w-1/2 z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 leading-tight">
              Score the tech <br /> you need
            </h2>
            <p className="text-lg mb-6 text-gray-700">Save up to 50% on refurbished electronics.</p>
            <button className="bg-transparent border border-gray-900 text-gray-900 px-6 py-2 font-medium hover:bg-gray-900 hover:text-white transition">
              Shop now →
            </button>
          </div>
          <div className="w-full md:w-1/2 h-48 md:h-full bg-yellow-200 relative">
             <img 
               src="https://placehold.co/800x400/f5af02/333333?text=Big+Sale+Banner" 
               alt="Banner" 
               className="w-full h-full object-cover"
             />
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        
        {loading && <div className="text-center py-10">Loading products...</div>}
        {error && <div className="text-center py-10 text-red-600">{error}</div>}

        {!loading && !error && (
          <>
            {/* 1. DAILY DEALS (RANDOM 6 ITEMS) */}
            <div className="mb-12">
              <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-2">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                  Daily Deals 
                  <span className="text-sm font-normal text-blue-700 cursor-pointer hover:underline ml-2">See all</span>
                </h2>
              </div>

              {dailyDeals.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {dailyDeals.map(product => renderProductCard(product))}
                </div>
              ) : (
                <p>No daily deals available today.</p>
              )}
            </div>

            {/* 2. ALL PRODUCTS (PAGINATION: 3 ROWS x 6 COLS) */}
            <div id="all-products-section">
              <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-2">
                <h2 className="text-2xl font-bold text-gray-900">Explore All Products</h2>
                <span className="text-sm text-gray-500">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, allProducts.length)} of {allProducts.length}
                </span>
              </div>

              {currentAllProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-8 gap-x-4">
                  {currentAllProducts.map(product => renderProductCard(product))}
                </div>
              ) : (
                 <p>No products found.</p>
              )}

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded border ${currentPage === 1 ? 'text-gray-300 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    <AiOutlineLeft />
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 rounded border text-sm font-bold transition-colors ${
                        currentPage === page 
                          ? 'bg-gray-900 text-white border-gray-900' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded border ${currentPage === totalPages ? 'text-gray-300 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    <AiOutlineRight />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* --- FOOTER SIMPLIFIED --- */}
      <footer className="border-t border-gray-200 mt-12 bg-white text-xs text-gray-500">
        <div className="max-w-[1280px] mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div>
            <h4 className="font-bold text-gray-700 mb-4">Buy</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">Registration</a></li>
              <li><a href="#" className="hover:underline">eBay Money Back Guarantee</a></li>
              <li><a href="#" className="hover:underline">Bidding & buying help</a></li>
              <li><a href="#" className="hover:underline">Stores</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-700 mb-4">Sell</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">Start selling</a></li>
              <li><a href="#" className="hover:underline">Learn to sell</a></li>
              <li><a href="#" className="hover:underline">Affiliates</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-700 mb-4">Stay connected</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">eBay's Blog</a></li>
              <li><a href="#" className="hover:underline">Facebook</a></li>
              <li><a href="#" className="hover:underline">Twitter</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-700 mb-4">About eBay</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">Company info</a></li>
              <li><a href="#" className="hover:underline">News</a></li>
              <li><a href="#" className="hover:underline">Investors</a></li>
              <li><a href="#" className="hover:underline">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-700 mb-4">Help & Contact</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">Seller Information Center</a></li>
              <li><a href="#" className="hover:underline">Contact us</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-4 py-6 border-t border-gray-100 text-center">
          <p>Copyright © 1995-2023 eBay Inc. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Index;