// src/pages/MyEbay/ReturnHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { BsBoxSeam, BsInfoCircleFill, BsCheckCircleFill, BsXCircleFill, BsClockHistory } from 'react-icons/bs';

const ReturnHistory = () => {
    const { token } = useAuth();
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReturns = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/returns/myrequests', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReturns(res.data);
            } catch (error) {
                console.error("Lỗi tải yêu cầu hoàn trả:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchReturns();
    }, [token]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="flex items-center gap-1 text-green-700 font-bold bg-green-100 px-2 py-1 rounded-full text-xs"><BsCheckCircleFill/> Approved</span>;
            case 'rejected':
                return <span className="flex items-center gap-1 text-red-700 font-bold bg-red-100 px-2 py-1 rounded-full text-xs"><BsXCircleFill/> Rejected</span>;
            case 'completed':
                return <span className="flex items-center gap-1 text-gray-700 font-bold bg-gray-200 px-2 py-1 rounded-full text-xs"><BsBoxSeam/> Completed</span>;
            default: // pending, processing
                return <span className="flex items-center gap-1 text-blue-700 font-bold bg-blue-100 px-2 py-1 rounded-full text-xs"><BsClockHistory/> Pending Approval</span>;
        }
    };

    if (loading) return <div className="p-10 text-center">Loading return requests...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Return & Cancellation History</h2>

            {returns.length === 0 ? (
                <div className="p-8 border border-gray-200 rounded-lg text-center bg-gray-50">
                    <p className="text-gray-600 mb-2">You have no active return or cancellation requests.</p>
                    <Link to="/" className="text-blue-600 font-bold hover:underline">Start shopping</Link>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {returns.map((req) => {
                        // Xác định hình ảnh và tên hiển thị (Trả 1 món hay cả đơn)
                        const isFullOrder = !req.product;
                        const displayImage = isFullOrder 
                            ? req.order?.orderItems[0]?.image 
                            : req.order?.orderItems.find(item => item.product === req.product?._id)?.image;
                        
                        const displayTitle = isFullOrder
                            ? `Entire Order #${req.order?._id.substring(0, 8).toUpperCase()}`
                            : req.product?.title;

                        return (
                            <div key={req._id} className="border border-gray-300 rounded-lg bg-white overflow-hidden shadow-sm">
                                {/* Header */}
                                <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center text-xs text-gray-600">
                                    <div className="flex gap-4">
                                        <span>REQUESTED ON: {new Date(req.createdAt).toLocaleDateString()}</span>
                                        <span>REQUEST ID: {req._id.substring(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        {getStatusBadge(req.status)}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4 flex flex-col md:flex-row gap-4">
                                    {/* Ảnh */}
                                    <div className="w-24 h-24 bg-gray-100 border border-gray-200 flex-shrink-0">
                                        <img 
                                            src={displayImage || 'https://placehold.co/150x150?text=No+Image'} 
                                            alt="Return item" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Thông tin */}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-base text-blue-700 mb-1">
                                            {isFullOrder ? <span className="text-gray-800">[Full Order Cancellation]</span> : null} {displayTitle}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            <span className="font-semibold">Reason:</span> {req.reason}
                                        </p>
                                        
                                        {/* Hiển thị phản hồi của Admin nếu có */}
                                        {req.resolutionNotes && (
                                            <div className="mt-3 bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-gray-800">
                                                <div className="font-bold flex items-center gap-2 mb-1">
                                                    <BsInfoCircleFill className="text-yellow-600"/> Resolution Note:
                                                </div>
                                                {req.resolutionNotes}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="w-full md:w-40 flex flex-col gap-2 justify-center">
                                        <Link to={`/my-ebay/purchase-history?orderId=${req.order?._id}`} className="w-full border border-gray-300 text-blue-700 font-bold py-1.5 rounded text-sm text-center hover:bg-gray-50">
                                            View Original Order
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReturnHistory;