// src/pages/FilterProduct.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { BsHeart } from 'react-icons/bs';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Pagination from '../components/Pagination';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5001/api/products';

function FilterProduct() {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]); // Danh sách category lấy từ sản phẩm
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(60);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Lấy query param từ URL (ví dụ ?category=Electronics)
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlCategory = queryParams.get('category');
  const urlSearch = queryParams.get('search');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // 1. Lọc ra danh sách Category duy nhất từ dữ liệu sản phẩm
        // Backend trả về category là Object { _id, name }, ta cần lấy name
        const uniqueCats = [...new Set(data.map(item => item.category?.name || 'Other'))];
        setCategories(uniqueCats);

        setAllProducts(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Logic lọc sản phẩm khi data thay đổi hoặc user chọn filter
  // Đồng bộ selectedCategory với URL (chỉ khi URL có category param)
  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [urlCategory]);

  useEffect(() => {
    let result = allProducts;

    // Lọc theo URL hoặc lựa chọn hiện tại
    const filterCat = urlCategory || selectedCategory;

    if (filterCat && filterCat !== 'All') {
      result = result.filter(p => p.category?.name === filterCat);
    }

    // Lọc theo từ khóa tìm kiếm (nếu có)
    if (urlSearch) {
      result = result.filter(p => p.title.toLowerCase().includes(urlSearch.toLowerCase()));
    }

    // Lọc theo khoảng giá (nếu có)
    const min = minPrice !== '' ? Number(minPrice) : null;
    const max = maxPrice !== '' ? Number(maxPrice) : null;

    if (min !== null) {
      result = result.filter(p => Number(p.price) >= min);
    }

    if (max !== null) {
      result = result.filter(p => Number(p.price) <= max);
    }

    setFilteredProducts(result);
    // Mỗi khi bộ lọc thay đổi thì quay về trang 1
    setCurrentPage(1);

  }, [allProducts, selectedCategory, urlCategory, urlSearch, minPrice, maxPrice]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }

    try {
      await addToCart(product._id, 1);
      toast.success('Đã thêm vào giỏ hàng!');
    } catch (error) {
      toast.error('Lỗi khi thêm vào giỏ hàng');
    }
  };

  const handleBuyNow = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để mua hàng');
      navigate('/login');
      return;
    }

    try {
      const buyNowItem = {
        productId: product._id,
        quantity: 1,
        isBuyNow: true,
        price: product.price,
        title: product.title,
        image: product.images?.[0]
      };
      const buyNowCart = {
        products: [buyNowItem]
      };
      localStorage.setItem('buyNowCart', JSON.stringify(buyNowCart));
      toast.info('Đang chuyển đến trang thanh toán...');
      navigate('/detail/checkout');
    } catch (error) {
      toast.error('Lỗi khi chuẩn bị đơn hàng');
    }
  };

  const renderProductCard = (product) => (
    <Link 
      key={product._id} 
      to={`/product/${product._id}`}
      className="group border border-gray-200 rounded-lg p-2 hover:shadow-md transition block"
    >
      <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
        <img 
          src={product.images?.[0] || 'https://placehold.co/200x200?text=No+Image'} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <button 
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:text-ebay-red opacity-0 group-hover:opacity-100 transition z-10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <BsHeart />
        </button>
      </div>
      <h3 className="text-sm hover:underline hover:text-blue-700 line-clamp-2 h-10 mb-1 leading-snug text-gray-800">
        {product.title}
      </h3>
      <div className="font-bold text-lg text-gray-900 mb-1">${product.price.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mb-2">Free shipping</div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={(e) => handleAddToCart(e, product)}
          className="flex-1 bg-[#d6e3ff] text-[#0654ba] hover:bg-[#c3d5f5] text-xs font-semibold py-1.5 px-2 rounded transition"
        >
          Add to cart
        </button>
        <button
          onClick={(e) => handleBuyNow(e, product)}
          className="flex-1 bg-[#3665f3] hover:bg-[#2b50c4] text-white text-xs font-semibold py-1.5 px-2 rounded transition"
        >
          Buy now
        </button>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-[#191919]">
      <Header categories={categories} />

      <div className="max-w-[1280px] mx-auto px-4 py-8 flex gap-8">
        
        {/* --- LEFT SIDEBAR (FILTER) --- */}
        <div className="w-64 flex-shrink-0 hidden md:block">
          {/* Lọc theo danh mục */}
          <div className="mb-6">
            <p className="font-semibold mb-2 text-sm">Category</p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                <input 
                  type="radio" 
                  name="category" 
                  checked={selectedCategory === 'All'} 
                  onChange={() => setSelectedCategory('All')}
                  className="accent-black"
                />
                All Categories
              </label>
              {categories.map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                  <input 
                    type="radio" 
                    name="category" 
                    checked={selectedCategory === cat} 
                    onChange={() => setSelectedCategory(cat)}
                    className="accent-black"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          {/* Lọc theo giá */}
          <div>
            <p className="font-semibold mb-2 text-sm">Price range</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-10">Min</span>
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-10">Max</span>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Any"
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT CONTENT (LIST) --- */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">
            {urlSearch ? `Results for "${urlSearch}"` : 'Explore All Products'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Showing {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} 
            {minPrice || maxPrice || selectedCategory !== 'All' ? ' after filters' : ''}
          </p>

          {loading ? (
             <div>Loading...</div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedProducts.map(renderProductCard)}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={filteredProducts.length}
                showInfo
                itemsPerPageOptions={[30, 60, 120]}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemsLabel="products"
              />
            </>
          ) : (
            <div className="text-center py-10 text-gray-500">No products found based on your filter.</div>
          )}
        </div>

      </div>
    </div>
  );
}

export default FilterProduct;