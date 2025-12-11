// src/pages/FilterProduct.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BsHeart } from 'react-icons/bs';
import Header from '../components/Header';

const API_URL = 'http://localhost:5001/api/products';

function FilterProduct() {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]); // Danh sách category lấy từ sản phẩm
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

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

    setFilteredProducts(result);
    
    // Cập nhật state selectedCategory nếu có URL param để UI đồng bộ
    if (urlCategory) setSelectedCategory(urlCategory);

  }, [allProducts, selectedCategory, urlCategory, urlSearch]);

  const renderProductCard = (product) => (
    <div key={product._id} className="group cursor-pointer border border-gray-200 rounded-lg p-2 hover:shadow-md transition">
      <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
        <img 
          src={product.images?.[0] || 'https://placehold.co/200x200?text=No+Image'} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <button className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:text-ebay-red opacity-0 group-hover:opacity-100 transition">
          <BsHeart />
        </button>
      </div>
      <h3 className="text-sm hover:underline hover:text-blue-700 line-clamp-2 h-10 mb-1 leading-snug text-gray-800">
        {product.title}
      </h3>
      <div className="font-bold text-lg text-gray-900">${product.price.toLocaleString()}</div>
      <div className="text-xs text-gray-500">Free shipping</div> 
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-[#191919]">
      <Header categories={categories} />

      <div className="max-w-[1280px] mx-auto px-4 py-8 flex gap-8">
        
        {/* --- LEFT SIDEBAR (FILTER) --- */}
        <div className="w-64 flex-shrink-0 hidden md:block">
          <h3 className="font-bold text-lg mb-4">Categories</h3>
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

        {/* --- RIGHT CONTENT (LIST) --- */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-6">
            {urlSearch ? `Results for "${urlSearch}"` : 'Explore All Products'}
            <span className="text-sm font-normal text-gray-500 ml-2">({filteredProducts.length} items)</span>
          </h1>

          {loading ? (
             <div>Loading...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(renderProductCard)}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">No products found based on your filter.</div>
          )}
        </div>

      </div>
    </div>
  );
}

export default FilterProduct;