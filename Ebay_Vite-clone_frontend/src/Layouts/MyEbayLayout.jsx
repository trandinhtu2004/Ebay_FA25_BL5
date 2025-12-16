// src/layouts/MyEbayLayout.jsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';

const MyEbayLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Danh sách menu sidebar
  const menuItems = [
    { name: 'Summary', path: '/my-ebay/summary' },
    { name: 'Recently viewed', path: '/my-ebay/recently-viewed' },
    { name: 'Bids/Offers', path: '/my-ebay/bids-offers' },
    { name: 'Watchlist', path: '/my-ebay/watchlist' },
    { name: 'Purchase history', path: '/my-ebay/purchase-history' },
    { name: 'Returns & Cancellations', path: '/my-ebay/return-history' },
    { name: 'Buy Again', path: '/my-ebay/buy-again' },
    { name: 'Selling', path: '/my-ebay/selling' },
    { name: 'Saved searches', path: '/my-ebay/saved-searches' },
    { name: 'Saved sellers', path: '/my-ebay/saved-sellers' },
    { name: 'Messages', path: '/my-ebay/messages' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-[#191919]">
      <Header />
      
      <div className="max-w-[1280px] mx-auto px-4 py-6">
        
        {/* Breadcrumb & Title */}
        <div className="mb-6">
            <h1 className="text-3xl font-bold">
                My eBay: <span className="font-normal text-gray-600">
                    {menuItems.find(i => i.path === currentPath)?.name || 'Summary'}
                </span>
            </h1>
            
            {/* Top Tabs (Activity / Messages / Account) */}
            <div className="flex gap-6 mt-4 text-sm border-b border-gray-200">
                <button className="pb-2 border-b-2 border-black font-bold">Activity</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-blue-700 hover:underline text-gray-500">Messages</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-blue-700 hover:underline text-gray-500">Account</button>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* --- LEFT SIDEBAR --- */}
          <div className="w-full md:w-56 flex-shrink-0 hidden md:block">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.path}
                    className={`block px-2 py-1.5 text-sm rounded ${
                        currentPath === item.path 
                        ? 'font-bold bg-gray-100 border-l-4 border-black text-black' 
                        : 'text-gray-700 hover:bg-gray-50 hover:underline'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* --- RIGHT CONTENT (Dynamic) --- */}
          <div className="flex-1 min-h-[500px]">
             {/* Outlet là nơi render các trang con (Summary, PurchaseHistory...) */}
             <Outlet />
          </div>

        </div>
      </div>

      <footer className="border-t border-gray-200 mt-12 bg-white text-xs text-gray-500 py-10 text-center">
         Copyright © 1995-2025 eBay Inc. All Rights Reserved.
      </footer>
    </div>
  );
};

export default MyEbayLayout;