// src/components/AddressSection.js (Đã cập nhật)

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import FloatingInput from '../../../components/FloatingInput'; 
import { useAuth } from '../../../context/AuthContext'; 

const API_ADDRESS_URL = 'http://localhost:5001/api/address'; 
const initialAddressState = {
    _id: null, 
    fullName: '',
    phone: '',
    street: '',
    city: '',
    country: '',
    isDefault: false,
};

// NHẬN PROP setSelectedAddress
const AddressSection = ({ userId, isAuthenticated, setSelectedAddress }) => {
    const { token } = useAuth(); 
    const [addressData, setAddressData] = useState(initialAddressState); // Địa chỉ hiện tại trên form/địa chỉ đang được sử dụng
    const [isLoading, setIsLoading] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState([]); // Danh sách địa chỉ đã lưu

    // Hàm đồng bộ địa chỉ hiện tại với CheckoutPage
    const syncSelectedAddress = useCallback((address) => {
        const { user, ...cleanAddress } = address;
        setSelectedAddress(cleanAddress._id ? cleanAddress : null);
    }, [setSelectedAddress]);


    // --- LOGIC: Tải Địa chỉ Mặc định/Danh sách Địa chỉ ---
    const fetchAddresses = useCallback(async () => {
        if (!userId || !token) {
            setSavedAddresses([]);
            setAddressData(initialAddressState);
            syncSelectedAddress(initialAddressState);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(API_ADDRESS_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi tải địa chỉ.');
            }

            setSavedAddresses(data);
            
            // Tìm và đặt địa chỉ mặc định
            const defaultAddress = data.find(addr => addr.isDefault) || data[0] || initialAddressState;
            setAddressData(defaultAddress);
            syncSelectedAddress(defaultAddress); // GỬI ĐỊA CHỈ LÊN CHECKOUTPAGE

        } catch (error) {
            toast.error(error.message || 'Lỗi kết nối khi tải địa chỉ.');
            setSavedAddresses([]);
            setAddressData(initialAddressState);
            syncSelectedAddress(initialAddressState);
        } finally {
            setIsLoading(false);
        }
    }, [userId, token, syncSelectedAddress]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    // --- LOGIC: Cập nhật state form ---
    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setAddressData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };
    
    // --- LOGIC: Lưu Địa chỉ (POST /api/address) ---
    const handleSaveAddress = async (e) => {
        e.preventDefault();
        if (!userId || !token) {
            toast.error("Vui lòng đăng nhập để lưu địa chỉ.");
            return;
        }

        setIsLoading(true);
        try {
            const { _id, ...addressPayload } = addressData; 
            
            const response = await fetch(API_ADDRESS_URL, {
                method: 'POST', // Giả định luôn là POST để thêm mới địa chỉ checkout
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(addressPayload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi thêm địa chỉ.');
            }

            // Backend trả về danh sách địa chỉ mới (data là array)
            setSavedAddresses(data); 
            
            // Tìm địa chỉ mới nhất/mặc định mới để sử dụng
            const newDefaultAddress = data.find(addr => addr.isDefault) || data[0];
            setAddressData(newDefaultAddress);
            syncSelectedAddress(newDefaultAddress); // GỬI ĐỊA CHỈ MỚI LÊN CHECKOUTPAGE
            
            toast.success('Địa chỉ đã được lưu và sử dụng!');

        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm xử lý khi người dùng nhấn "Thay đổi"
    const handleStartNewAddress = () => {
        setAddressData(initialAddressState);
        syncSelectedAddress(initialAddressState); // Xóa địa chỉ đang chọn trên CheckoutPage
    }

    // Hàm xử lý khi người dùng chọn một địa chỉ đã lưu
    const handleSelectSavedAddress = (addr) => {
        setAddressData(addr);
        syncSelectedAddress(addr); // GỬI ĐỊA CHỈ ĐÃ CHỌN LÊN CHECKOUTPAGE
    }
    
    // ... (Phần hiển thị loading/not authenticated)
    if (isLoading) {
        return <section className="section-box address-section"><div className="text-center py-4">Đang tải địa chỉ...</div></section>;
    }

    if (!isAuthenticated) {
        return (
            <section className="section-box address-section">
                <h2 className="section-title">1. Địa chỉ Giao hàng</h2>
                <div className="text-center py-4 text-gray-500">
                    Vui lòng <span className="font-bold text-blue-600">đăng nhập</span> để xem và lưu địa chỉ giao hàng.
                </div>
            </section>
        )
    }

    return (
        <section className="section-box address-section">
            <h2 className="section-title">1. Địa chỉ Giao hàng</h2>
            
            {/* Hiển thị địa chỉ đã chọn/mặc định */}
            {addressData.fullName && addressData._id && (
                <div className="border border-green-400 bg-green-50 p-3 rounded mb-4 text-sm">
                    <p className="font-bold">{addressData.fullName} | {addressData.phone}</p>
                    <p>{addressData.street}, {addressData.city}, {addressData.country}</p>
                    <button 
                        onClick={handleStartNewAddress} 
                        className="text-blue-600 font-bold mt-2 hover:underline"
                    >
                        Thay đổi hoặc Thêm mới
                    </button>
                </div>
            )}
            
            {/* Form nhập địa chỉ mới / Chưa có địa chỉ mặc định */}
            {(!addressData.fullName || !addressData._id) && (
                <>
                    <form onSubmit={handleSaveAddress} className="address-form">
                        <div className="input-group">
                            <label htmlFor="fullName">Họ và Tên (*)</label>
                            <input type="text" id="fullName" value={addressData.fullName} onChange={handleChange} required />
                        </div>
                        {/* ... (Các trường input khác) ... */}
                        <div className="input-group">
                            <label htmlFor="phone">Số điện thoại (*)</label>
                            <input type="tel" id="phone" value={addressData.phone} onChange={handleChange} required />
                        </div>
                        <div className="input-group">
                            <label htmlFor="street">Địa chỉ (Số nhà, Tên đường) (*)</label>
                            <input type="text" id="street" value={addressData.street} onChange={handleChange} required />
                        </div>
                        <div className="input-group-row">
                            <div className="input-group">
                                <label htmlFor="city">Tỉnh/Thành phố (*)</label>
                                <input type="text" id="city" value={addressData.city} onChange={handleChange} required />
                            </div>
                            <div className="input-group">
                                <label htmlFor="country">Quốc gia (*)</label>
                                <input type="text" id="country" value={addressData.country} onChange={handleChange} required />
                            </div>
                        </div>
                        
                        <div className="checkbox-group">
                            <input 
                                type="checkbox" id="isDefault" checked={addressData.isDefault}
                                onChange={handleChange}
                            />
                            <label htmlFor="isDefault">Đặt làm địa chỉ mặc định</label>
                        </div>
                        
                        <button type="submit" className="primary-button save-button" disabled={isLoading}>
                            {isLoading ? 'Đang lưu...' : 'Lưu & Sử dụng Địa chỉ này'}
                        </button>
                    </form>

                    {/* Hiển thị các địa chỉ đã lưu khác để người dùng chọn */}
                    {savedAddresses.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <h3 className="font-bold text-sm mb-2">Hoặc chọn địa chỉ đã lưu:</h3>
                            <div className="space-y-2">
                                {savedAddresses.filter(addr => addr._id !== addressData._id).map(addr => (
                                    <div 
                                        key={addr._id} 
                                        onClick={() => handleSelectSavedAddress(addr)}
                                        className="p-3 border rounded cursor-pointer hover:bg-gray-50 text-xs"
                                    >
                                        <p className="font-bold">{addr.fullName} | {addr.phone}</p>
                                        <p className="text-gray-600">{addr.street}, {addr.city}, {addr.country}</p>
                                        {addr.isDefault && <span className="text-blue-600 font-medium"> (Mặc định)</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default AddressSection;