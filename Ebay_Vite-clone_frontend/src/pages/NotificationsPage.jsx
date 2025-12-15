import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, socket } from '../context/AuthContext';
import Header from '../components/Header';
import { BsCheck2All, BsCircleFill } from 'react-icons/bs';
import { toast } from 'react-toastify';

const NotificationsPage = () => {
    const { isAuthenticated, user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 1. Hàm tải thông báo từ Server (Lấy cả cũ lẫn mới)
    const fetchNotifications = useCallback(async () => {
        if (isAuthenticated && user?.userId) {
            try {
                // API này backend trả về 20 thông báo mới nhất (cả đã đọc và chưa đọc)
                const res = await axios.get('/api/notifications');
                setNotifications(res.data);
            } catch (err) {
                console.error('Lỗi tải thông báo:', err);
                toast.error("Không thể tải danh sách thông báo.");
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    // 2. Gọi hàm tải khi vào trang
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchNotifications();
    }, [isAuthenticated, navigate, fetchNotifications]);

    // 3. Lắng nghe Socket để cập nhật Realtime
    useEffect(() => {
        if (!isAuthenticated) return;

        const handleNewNotification = (newNotification) => {
            console.log("[NotificationsPage] New notification received:", newNotification);
            // Thêm tin mới vào đầu danh sách
            setNotifications(prev => [newNotification, ...prev]);
        };

        socket.on('newNotification', handleNewNotification);

        return () => {
            socket.off('newNotification', handleNewNotification);
        };
    }, [isAuthenticated]);

    // 4. Xử lý đánh dấu 1 tin là đã đọc
    const handleMarkAsRead = async (id) => {
        // Tìm thông báo trong state
        const noti = notifications.find(n => n._id === id);
        // Nếu không tìm thấy hoặc đã đọc rồi thì không làm gì cả
        if (!noti || noti.isRead) return;

        try {
            await axios.put(`/api/notifications/${id}/read`);
            
            // Cập nhật State: Đổi isRead thành true (KHÔNG xóa khỏi mảng)
            setNotifications(prev => 
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.error('Lỗi đánh dấu đã đọc:', err);
        }
    };

    const extractOrderId = (link) => {
        if (!link) return null;
        const parts = link.split('/');
        return parts[parts.length - 1]; // Assumes ID is the last part
    };

    const handleViewOrder = (noti) => {
        handleMarkAsRead(noti._id);
        const orderId = extractOrderId(noti.link);
        if (orderId) {
            navigate(`/my-ebay/purchase-history?orderId=${orderId}`);
        } else {
            navigate('/my-ebay/purchase-history');
        }
    };

    // 5. Xử lý đánh dấu tất cả
    const handleMarkAllAsRead = async () => {
        const hasUnread = notifications.some(n => !n.isRead);
        if (!hasUnread) return;

        try {
            await axios.put('/api/notifications/mark-all-read'); // Cần đảm bảo backend có route này
            // Cập nhật toàn bộ danh sách thành đã đọc
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success("Đã đánh dấu tất cả là đã đọc");
        } catch (err) {
            console.error('Lỗi đánh dấu tất cả:', err);
        }
    };

    // Render loading
    if (loading) {
        return (
            <div className="font-sans text-gray-800 bg-white min-h-screen">
                <Header />
                <div className="max-w-[1000px] mx-auto px-4 py-10 text-center">
                    Loading notifications...
                </div>
            </div>
        );
    }

    return (
        <div className="font-sans text-[#191919] bg-[#f7f7f7] min-h-screen">
            <Header />

            <div className="max-w-[1000px] mx-auto px-4 py-8">
                {/* Tiêu đề & Nút thao tác */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold">Notifications</h1>
                    
                    {notifications.some(n => !n.isRead) && (
                        <button 
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-2 text-blue-700 hover:underline font-medium text-sm"
                        >
                            <BsCheck2All size={18} /> Mark all as read
                        </button>
                    )}
                </div>

                {/* Danh sách thông báo */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {notifications.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            You have no notifications at this time.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((noti) => (
                                <div 
                                    key={noti._id} 
                                    className={`p-5 flex gap-4 transition-colors hover:bg-gray-50 ${noti.isRead ? 'bg-white' : 'bg-blue-50/50'}`}
                                >
                                    {/* Icon trạng thái (Chấm xanh nếu chưa đọc) */}
                                    <div className="mt-1.5 flex-shrink-0 w-4">
                                        {!noti.isRead && (
                                            <BsCircleFill className="text-blue-600 text-[10px]" title="Unread" />
                                        )}
                                    </div>

                                    {/* Nội dung */}
                                    <div className="flex-1">
                                        <p className={`text-base mb-1 ${!noti.isRead ? 'font-bold text-black' : 'text-gray-700'}`}>
                                            {noti.message}
                                        </p>
                                        <div className="text-xs text-gray-500">
                                            {new Date(noti.createdAt).toLocaleString('en-US', {
                                                month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                                            })}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col items-end gap-2 pl-4">
                                        {noti.link && (
                                            <button 
                                                onClick={() => handleViewOrder(noti)}
                                                className="px-5 py-1.5 bg-white border border-blue-600 text-blue-600 rounded-full text-sm font-bold hover:bg-blue-700 hover:text-white transition-colors whitespace-nowrap"
                                            >
                                                View
                                            </button>
                                        )}
                                        
                                        {!noti.isRead && (
                                            <button 
                                                onClick={() => handleMarkAsRead(noti._id)}
                                                className="text-xs text-gray-500 hover:text-blue-700 hover:underline"
                                            >
                                                Mark read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Footer */}
            <footer className="border-t border-gray-200 mt-12 bg-white text-xs text-gray-500 py-10 text-center">
                Copyright © 1995-2025 eBay Inc. All Rights Reserved.
            </footer>
        </div>
    );
};

export default NotificationsPage;