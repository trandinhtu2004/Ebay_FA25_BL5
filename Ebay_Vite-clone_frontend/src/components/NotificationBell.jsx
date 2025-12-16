// src/components/Layout/NotificationBell.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth, socket } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { BsBell } from 'react-icons/bs';

function NotificationBell() {
    const { isAuthenticated, user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const notificationBellRef = useRef(null);
    const navigate = useNavigate();

    // Helper to extract Order ID from link string like "/orders/69400bff..."
    const extractOrderId = (link) => {
        if (!link) return null;
        const parts = link.split('/');
        return parts[parts.length - 1]; // Assumes ID is the last part
    };

    const fetchNotifications = useCallback(async () => {
        if (isAuthenticated && user?.userId) {
            try {
                const res = await axios.get('/api/notifications');
                if (notificationBellRef.current) { 
                    setNotifications(res.data);
                    setUnreadCount(res.data.filter(n => !n.isRead).length);
                }
            } catch (error) {
                console.error("[NotificationBell] Error fetching notifications:", error);
            }
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const onConnect = () => {
            console.log(`[NotificationBell] Socket connected.`);
            fetchNotifications(); 
        };

        const handleNewNotification = (newNotification) => {
            console.log("[NotificationBell] Received 'newNotification':", newNotification);
            setNotifications(prev => [newNotification, ...prev].slice(0, 20));
            setUnreadCount(prev => prev + 1);
        };

        socket.on('connect', onConnect);
        socket.on('newNotification', handleNewNotification);

        return () => {
            socket.off('connect', onConnect);
            socket.off('newNotification', handleNewNotification);
        };
    }, [isAuthenticated, fetchNotifications]);

    const handleMarkAllAsRead = async () => {
        const hasUnread = notifications.some(n => !n.isRead);
        if (!hasUnread) return;

        try {
            await axios.put('/api/notifications/mark-all-read'); // Cần đảm bảo backend có route này
            // Cập nhật toàn bộ danh sách thành đã đọc
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Lỗi đánh dấu tất cả:', err);
        }
    };

    const handleMarkAsRead = async (id) => {
        const notificationToUpdate = notifications.find(n => n._id === id);
        if (!notificationToUpdate || notificationToUpdate.isRead) return;

        try {
            await axios.put(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) { 
            console.error("[NotificationBell] Error marking read:", error);
        }
    };

    const handleViewOrder = (noti) => {
        handleMarkAsRead(noti._id);
        handleNavigation(noti.link);
    };

        const handleNavigation = (link) => {
        if (!link) {
             navigate('/my-ebay/summary'); // Default fallback
             return;
        }

        // Case 1: Link is like "/orders/123456..." -> Go to Purchase History with Search
        if (link.startsWith('/orders/')) {
            const parts = link.split('/');
            const orderId = parts[parts.length - 1];
            if (orderId) {
                navigate(`/my-ebay/purchase-history?orderId=${orderId}`);
                return;
            }
        }

        // Case 2: Link is "/return-history" or similar static routes -> Go directly there
        if (link === '/return-history') {
             navigate('/my-ebay/return-history'); // Assuming you have this route, or map it to Purchase History tab
             // If you don't have a separate return history page yet, maybe send to purchase history:
             // navigate('/my-ebay/purchase-history'); 
             return;
        }
        
        // Case 3: Other links (e.g. /dashboard/orders for sellers)
        navigate(link);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && notificationBellRef.current && !notificationBellRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    if (!isAuthenticated) return null;

    const displayNotifications = notifications.slice(0, 7);

    return (
        <div className="notification-bell relative" ref={notificationBellRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-600 hover:text-blue-700 transition">
                <BsBell className="text-xl"/>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full min-w-[18px]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
            
            {isOpen && (
                <div className="absolute top-full right-0 z-50 w-[360px] bg-white border border-gray-200 rounded-lg shadow-xl mt-2 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Notifications</h3>
                        <Link  onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }} className="text-xs text-blue-600 hover:underline">Mark as Read All</Link>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-center text-gray-500 py-6 text-sm">You have no notifications.</p>
                        ) : (
                            displayNotifications.map(noti => (
                                <div 
                                    key={noti._id} 
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${noti.isRead ? 'opacity-60' : 'bg-white'}`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={`text-sm leading-snug ${!noti.isRead ? 'font-semibold text-black' : 'text-gray-600'}`}>
                                            {noti.message}
                                        </p>
                                        {!noti.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1.5"></span>}
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-400">{new Date(noti.createdAt).toLocaleDateString()}</span>
                                        <div className="flex gap-3">
                                            {noti.link && (
                                                <button 
                                                    onClick={() => handleViewOrder(noti)} 
                                                    className="text-xs font-bold text-blue-600 border border-blue-600 rounded px-2 py-0.5 hover:bg-blue-700 hover:text-white transition-colors"
                                                >
                                                    View
                                                </button>
                                            )}
                                            {!noti.isRead && (
                                                <button 
                                                    className='text-xs text-gray-500 hover:text-blue-600 hover:underline' 
                                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(noti._id); }}
                                                >
                                                    Mark read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                        <Link to="/notifications" className='text-sm font-bold text-blue-600 hover:underline' onClick={() => setIsOpen(false)}>
                            See all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;