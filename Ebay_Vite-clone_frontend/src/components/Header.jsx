// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BsBell, BsCart2, BsSearch } from 'react-icons/bs';
import { AiOutlineDown } from 'react-icons/ai';
import {toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Cart from './../pages/Cart';
const Header = ({ categories = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { cartItemCount, hasNewNotification, clearNotification } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
 
 
  const handleSearch = () => {
    // Chuyển hướng sang trang filter với từ khóa tìm kiếm
    navigate(`/all-products?search=${encodeURIComponent(searchTerm)}`);
  };

  

  return (
    <div className="bg-white shadow-sm sticky top-0 z-50">
      {/* --- TOP BAR --- */}
      <div className="border-b border-gray-200 text-xs px-4 py-1 hidden md:block bg-white">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center">
          <div className="flex gap-4">
           {user ? (
              <div className="flex gap-2 items-center">
                {/* HIỂN THỊ AVATAR NHỎ NẾU CÓ */}
                Hi! {user.avatarURL && (
                   <img src={user.avatarURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200"/>
                )}
                {/* BIẾN TÊN THÀNH LINK */}
                 <Link to="/profile" className="font-bold text-[#191919] hover:underline hover:text-blue-700">
                  {user.username}
                </Link>
                <span className="text-gray-300">|</span>
                <button onClick={() => { logout(); navigate('/'); toast.success('Logout successful!'); }} className="text-blue-700 hover:underline cursor-pointer">
                  Sign out
                </button>
              </div>
            ) : (
               <span>
                Hi! <Link to="/login" className="text-blue-700 hover:underline">Sign in</Link> or <Link to="/register" className="text-blue-700 hover:underline">register</Link>
              </span>
            )}
            <a href="#" className="hover:underline">Daily Deals</a>
            <a href="#" className="hover:underline">Help & Contact</a>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:underline">Sell</a>
            <a href="#" className="hover:underline flex items-center gap-1">Watchlist <AiOutlineDown /></a>
            <a href="#" className="hover:underline flex items-center gap-1">My eBay <AiOutlineDown /></a>
            <div className="relative group">
              <BsBell 
                className="text-lg cursor-pointer hover:text-blue-700 transition" 
                onClick={clearNotification} // Click vào để tắt chấm đỏ
              />
              
              {/* CHẤM ĐỎ: Chỉ hiện khi có thông báo mới */}
              {hasNewNotification && (
                <span className="absolute -top-1 -right-0.5 h-2.5 w-2.5 bg-red-600 rounded-full border-2 border-white"></span>
              )}
            </div>
            <div className="relative">
              <Link to="/cart">
              <BsCart2 className="text-lg cursor-pointer" />
              </Link>
              {/* CHẤM ĐỎ: Chỉ hiện khi có sản phẩm trong giỏ */}
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-0.5 h-2.5 w-2.5 bg-red-600 rounded-full border-2 border-white"></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN HEADER --- */}
      <div className="max-w-[1280px] mx-auto px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-4xl font-bold tracking-tighter shrink-0 cursor-pointer">
            <span className="text-ebay-red">e</span><span className="text-ebay-blue">b</span><span className="text-ebay-yellow">a</span><span className="text-ebay-green">y</span>
          </Link>

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
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <select className="border-l border-gray-300 text-sm px-4 bg-white hidden md:block outline-none text-gray-600 cursor-pointer max-w-[150px]">
              <option value="">All Categories</option>
              {categories.map((cat, index) => (
                <option key={index} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <button onClick={handleSearch} className="bg-ebay-blue text-white px-8 md:px-12 h-10 md:h-12 font-semibold text-lg rounded hover:bg-blue-700 transition">
            Search
          </button>
          <a href="#" className="text-xs text-gray-500 whitespace-nowrap hidden lg:block hover:underline">Advanced</a>
        </div>
      </div>

      {/* --- CATEGORY NAVIGATION --- */}
      {/* <div className="max-w-[1280px] mx-auto px-4 py-2 border-b border-gray-100 hidden md:block overflow-x-auto">
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
      </div> */}
    </div>
  );
};

export default Header;