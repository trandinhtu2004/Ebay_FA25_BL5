import React, { useState } from 'react';
import { BsBell, BsCart2, BsSearch, BsHeart } from 'react-icons/bs';
import { AiOutlineDown } from 'react-icons/ai';

// Mock Data cho sản phẩm
const products = [
  { id: 1, title: 'Sony PlayStation 5 Console', price: 499.00, img: 'https://placehold.co/200x200?text=PS5', shipping: 'Free shipping' },
  { id: 2, title: 'iPhone 14 Pro Max 256GB', price: 1099.00, img: 'https://placehold.co/200x200?text=iPhone', shipping: 'Free shipping' },
  { id: 3, title: 'Nike Air Jordan 1 Retro', price: 180.00, img: 'https://placehold.co/200x200?text=Jordan', shipping: '$15.00 shipping' },
  { id: 4, title: 'Vintage Rolex Submariner', price: 12500.00, img: 'https://placehold.co/200x200?text=Rolex', shipping: 'Free shipping' },
  { id: 5, title: 'Canon EOS R5 Body', price: 3899.00, img: 'https://placehold.co/200x200?text=Canon', shipping: 'Free shipping' },
  { id: 6, title: 'MacBook Pro M2 14-inch', price: 1999.00, img: 'https://placehold.co/200x200?text=MacBook', shipping: 'Free shipping' },
];

const categories = [
  "Saved", "Motors", "Electronics", "Collectibles", "Home & Garden", "Fashion", "Toys", "Sporting Goods", "Business & Industrial", "Jewelry & Watches", "eBay Refurbished"
];

function Index() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="font-sans text-gray-800 bg-white min-h-screen">
      {/* --- TOP BAR --- */}
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

      {/* --- MAIN HEADER --- */}
      <div className="max-w-[1280px] mx-auto px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <a href="#" className="text-4xl font-bold tracking-tighter shrink-0 cursor-pointer">
            <span className="text-ebay-red">e</span>
            <span className="text-ebay-blue">b</span>
            <span className="text-ebay-yellow">a</span>
            <span className="text-ebay-green">y</span>
          </a>

          {/* Shop by category */}
          <div className="hidden md:flex items-center gap-1 text-sm text-gray-600 cursor-pointer whitespace-nowrap hover:text-blue-600">
            Shop by category <AiOutlineDown size={10} />
          </div>

          {/* Search Bar */}
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
            {/* Category Select inside Search */}
            <select className="border-l border-gray-300 text-sm px-4 bg-white hidden md:block outline-none text-gray-600 cursor-pointer max-w-[150px]">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Fashion</option>
            </select>
          </div>
          
          {/* Search Button */}
          <button className="bg-ebay-blue text-white px-8 md:px-12 h-10 md:h-12 font-semibold text-lg rounded hover:bg-blue-700 transition">
            Search
          </button>

          {/* Advanced Search Link */}
          <a href="#" className="text-xs text-gray-500 whitespace-nowrap hidden lg:block hover:underline">Advanced</a>
        </div>
      </div>

      {/* --- CATEGORY NAVIGATION --- */}
      <div className="max-w-[1280px] mx-auto px-4 py-2 border-b border-gray-100 hidden md:block">
        <ul className="flex justify-center gap-6 text-xs lg:text-sm text-gray-600">
          {categories.map((cat, index) => (
            <li key={index} className="hover:text-ebay-blue hover:underline cursor-pointer group relative">
              {cat}
              {cat === "Saved" && <span className="ml-1 text-ebay-red">♥</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* --- HERO SECTION --- */}
      <div className="max-w-[1280px] mx-auto px-4 py-6">
        <div className="bg-gray-100 rounded-lg overflow-hidden flex flex-col md:flex-row h-auto md:h-[350px] relative hover:shadow-lg transition cursor-pointer">
          {/* Text Content */}
          <div className="p-8 md:p-12 flex flex-col justify-center items-start w-full md:w-1/2 z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 leading-tight">
              Score the tech <br /> you need
            </h2>
            <p className="text-lg mb-6 text-gray-700">Save up to 50% on refurbished electronics.</p>
            <button className="bg-transparent border border-gray-900 text-gray-900 px-6 py-2 font-medium hover:bg-gray-900 hover:text-white transition">
              Shop now →
            </button>
          </div>
          {/* Image Placeholder */}
          <div className="w-full md:w-1/2 h-48 md:h-full bg-yellow-200 relative">
             <img 
               src="https://placehold.co/800x400/f5af02/333333?text=Big+Sale+Banner" 
               alt="Banner" 
               className="w-full h-full object-cover"
             />
          </div>
        </div>
      </div>

      {/* --- DAILY DEALS / PRODUCT GRID --- */}
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Daily Deals 
            <span className="text-sm font-normal text-blue-700 cursor-pointer hover:underline">See all</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                <img 
                  src={product.img} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <button className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:text-ebay-red opacity-0 group-hover:opacity-100 transition">
                  <BsHeart />
                </button>
              </div>
              <h3 className="text-sm hover:underline hover:text-blue-700 line-clamp-2 h-10 mb-1 leading-snug">
                {product.title}
              </h3>
              <div className="font-bold text-lg">${product.price.toFixed(2)}</div>
              <div className="text-xs text-gray-500">{product.shipping}</div>
            </div>
          ))}
        </div>
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