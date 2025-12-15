import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import FloatingInput from './FloatingInput'; // Tận dụng component input

const API_ADDRESS_URL = '/api/address';

const AddressForm = ({ currentAddress, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        country: '',
        isDefault: false,
    });
    const [loading, setLoading] = useState(false);
    const isEditMode = !!currentAddress;

    // Load dữ liệu khi ở chế độ chỉnh sửa
    useEffect(() => {
        if (isEditMode) {
            setFormData({
                fullName: currentAddress.fullName || '',
                phone: currentAddress.phone || '',
                street: currentAddress.street || '',
                city: currentAddress.city || '',
                country: currentAddress.country || '',
                isDefault: currentAddress.isDefault || false,
            });
        } else {
            // Reset form cho chế độ thêm mới
            setFormData({
                fullName: '',
                phone: '',
                street: '',
                city: '',
                country: '',
                isDefault: false,
            });
        }
    }, [currentAddress, isEditMode]);

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // API POST (Thêm mới) hoặc PUT (Cập nhật)
        try {
            let response;
            const payload = formData;
            
            if (isEditMode) {
                // Thêm _id vào payload để backend biết địa chỉ nào cần sửa
                response = await axios.put(`${API_ADDRESS_URL}/${currentAddress._id}`, payload);
            } else {
                // POST: Controller sẽ tự động thêm user._id
                response = await axios.post(API_ADDRESS_URL, payload);
            }

            // Backend trả về danh sách địa chỉ đã được sắp xếp
            onSave(response.data); 

        } catch (error) {
            const message = error.response?.data?.message || 'Lỗi khi lưu địa chỉ.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-xl flex flex-col gap-4 bg-gray-50 p-4 rounded mb-8 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg">{isEditMode ? 'Chỉnh sửa Địa chỉ' : 'Thêm Địa chỉ Mới'}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput 
                    label="Họ và Tên" id="fullName" value={formData.fullName} 
                    onChange={handleChange} required 
                />
                <FloatingInput 
                    label="Số điện thoại" id="phone" value={formData.phone} 
                    onChange={handleChange} required 
                />
            </div>

            <FloatingInput 
                label="Địa chỉ (Số nhà, Tên đường)" id="street" value={formData.street} 
                onChange={handleChange} required 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput 
                    label="Tỉnh/Thành phố" id="city" value={formData.city} 
                    onChange={handleChange} required 
                />
                <FloatingInput 
                    label="Quốc gia" id="country" value={formData.country} 
                    onChange={handleChange} required 
                />
            </div>
            
            <div className="flex items-center mt-2">
                <input 
                    type="checkbox" id="isDefault" 
                    checked={formData.isDefault} 
                    onChange={handleChange} 
                    className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">Đặt làm địa chỉ mặc định</label>
            </div>

            <div className="flex gap-3 mt-4">
                <button disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-blue-700 disabled:bg-gray-400">
                    {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
                <button type="button" onClick={onCancel} className="bg-white border border-gray-300 px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-100">
                    Hủy
                </button>
            </div>
        </form>
    );
};

export default AddressForm;