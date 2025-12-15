// src/pages/Profile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../components/Header';
import FloatingInput from '../components/FloatingInput';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api';
const USER_API = `${API_URL}/users`;
const ADDRESS_API = `${API_URL}/address`;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info'); // info | password | address
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // State cho thông tin cá nhân
  const [profileData, setProfileData] = useState({
    username: '',
    avatarURL: ''
  });

  // State cho đổi mật khẩu
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State cho địa chỉ
  const [addresses, setAddresses] = useState([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    country: '',
    isDefault: false
  });

  // Kiểm tra authentication và load dữ liệu
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user) {
      setProfileData({
        username: user.username || '',
        avatarURL: user.avatarURL || ''
      });
    }
  }, [isAuthenticated, user, navigate]);

  

  // --- FETCH ADDRESSES ---
  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    setAddressLoading(true);
    try {
      const response = await axios.get("http://localhost:5001/api/address", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(response.data);
    } catch (error) {
      console.error('Lỗi tải địa chỉ:', error);
      toast.error('Không thể tải danh sách địa chỉ');
    } finally {
      setAddressLoading(false);
    }
  }, [token]);

  // Load địa chỉ khi vào tab address
  useEffect(() => {
    if (activeTab === 'address' && token) {
      fetchAddresses();
    }
  }, [activeTab, token, fetchAddresses]);

  // --- XỬ LÝ CẬP NHẬT PROFILE ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(`http://localhost:5001/api/address/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Cập nhật user trong AuthContext
      updateUser(response.data);
      toast.success('Cập nhật hồ sơ thành công!');

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi cập nhật';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- XỬ LÝ ĐỔI MẬT KHẨU (UI Demo) ---
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    // TODO: Gọi API PUT /api/users/change-password (Cần làm thêm ở backend)
    toast.info('Chức năng đang phát triển (Cần API Backend)');
    setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // --- XỬ LÝ ĐỊA CHỈ ---
  const resetAddressForm = () => {
    setAddressForm({
      fullName: '',
      phone: '',
      street: '',
      city: '',
      country: '',
      isDefault: false
    });
    setIsEditingAddress(false);
    setEditingAddressId(null);
  };

  const handleEditAddress = (address) => {
    setAddressForm({
      fullName: address.fullName || '',
      phone: address.phone || '',
      street: address.street || '',
      city: address.city || '',
      country: address.country || '',
      isDefault: address.isDefault || false
    });
    setEditingAddressId(address._id);
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressLoading(true);

    try {
      if (editingAddressId) {
        // TODO: Backend chưa có API update address, cần thêm
        toast.info('Chức năng sửa địa chỉ đang phát triển');
        resetAddressForm();
        return;
      }

      // Thêm địa chỉ mới
      await axios.post("http://localhost:5001/api/address", addressForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Thêm địa chỉ thành công!');
      resetAddressForm();
      fetchAddresses(); // Reload danh sách

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi lưu địa chỉ';
      toast.error(errorMessage);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      return;
    }

    setAddressLoading(true);
    try {
      await axios.delete(`http://localhost:5001/api/address/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Xóa địa chỉ thành công!');
      fetchAddresses(); // Reload danh sách

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi xóa địa chỉ';
      toast.error(errorMessage);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    setAddressLoading(true);
    try {
      await axios.put(`http://localhost:5001/api/address/default/${addressId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Đã đặt làm địa chỉ mặc định!');
      fetchAddresses(); // Reload danh sách

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi đặt địa chỉ mặc định';
      toast.error(errorMessage);
    } finally {
      setAddressLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#191919]">
      <Header />

      <div className="max-w-[1000px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Hello, {user.username}</h1>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* --- LEFT SIDEBAR --- */}
          <div className="w-full md:w-1/4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <button 
                onClick={() => setActiveTab('info')}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 font-medium ${activeTab === 'info' ? 'text-blue-700 bg-blue-50 border-l-4 border-l-blue-700' : ''}`}
              >
                Personal Info
              </button>
              <button 
                onClick={() => setActiveTab('password')}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 font-medium ${activeTab === 'password' ? 'text-blue-700 bg-blue-50 border-l-4 border-l-blue-700' : ''}`}
              >
                Sign in & Security
              </button>
              <button 
                onClick={() => setActiveTab('address')}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 font-medium ${activeTab === 'address' ? 'text-blue-700 bg-blue-50 border-l-4 border-l-blue-700' : ''}`}
              >
                Addresses
              </button>
            </div>
          </div>

          {/* --- RIGHT CONTENT --- */}
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              
              {/* TAB 1: PERSONAL INFO */}
              {activeTab === 'info' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b">Personal Information</h2>
                  <form onSubmit={handleUpdateProfile} className="max-w-md flex flex-col gap-4">
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={profileData.avatarURL || "https://placehold.co/100x100?text=Avatar"} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover border"
                      />
                      <div className="flex-1">
                        <FloatingInput 
                          label="Avatar URL (Link ảnh)" 
                          value={profileData.avatarURL}
                          onChange={(e) => setProfileData({...profileData, avatarURL: e.target.value})}
                        />
                      </div>
                    </div>

                    <FloatingInput 
                      label="Username" 
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      required
                    />
                    
                    <div className="opacity-50 pointer-events-none">
                       <FloatingInput label="Email (Cannot change)" value={user.email} readOnly />
                    </div>

                    <button 
                      disabled={loading} 
                      className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 w-max mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Updating...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: PASSWORD */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b">Change Password</h2>
                  <form onSubmit={handleChangePassword} className="max-w-md flex flex-col gap-4">
                    <FloatingInput 
                      type="password" 
                      label="Current Password" 
                      value={passData.currentPassword}
                      onChange={(e) => setPassData({...passData, currentPassword: e.target.value})}
                      required
                    />
                    <FloatingInput 
                      type="password" 
                      label="New Password" 
                      value={passData.newPassword}
                      onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                      required
                    />
                    <FloatingInput 
                      type="password" 
                      label="Confirm New Password" 
                      value={passData.confirmPassword}
                      onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                      required
                    />
                     <button 
                       type="submit"
                       className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 w-max mt-2"
                     >
                      Update Password
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: ADDRESSES */}
              {activeTab === 'address' && (
                <div>
                  <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h2 className="text-xl font-bold">Address Book</h2>
                    {!isEditingAddress && (
                      <button 
                        onClick={() => setIsEditingAddress(true)} 
                        className="text-blue-700 font-bold hover:underline text-sm"
                      >
                        + Add New Address
                      </button>
                    )}
                  </div>

                  {isEditingAddress ? (
                    <form onSubmit={handleSaveAddress} className="max-w-md flex flex-col gap-4 bg-gray-50 p-4 rounded mb-4">
                      <h3 className="font-bold">{editingAddressId ? 'Edit Address' : 'New Address'}</h3>
                      
                      <FloatingInput 
                        label="Full Name" 
                        value={addressForm.fullName} 
                        onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})} 
                        required 
                      />
                      
                      <FloatingInput 
                        label="Phone Number" 
                        value={addressForm.phone} 
                        onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})} 
                        required 
                      />
                      
                      <FloatingInput 
                        label="Street Address" 
                        value={addressForm.street} 
                        onChange={(e) => setAddressForm({...addressForm, street: e.target.value})} 
                        required 
                      />
                      
                      <FloatingInput 
                        label="City" 
                        value={addressForm.city} 
                        onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} 
                        required 
                      />
                      
                      <FloatingInput 
                        label="Country" 
                        value={addressForm.country} 
                        onChange={(e) => setAddressForm({...addressForm, country: e.target.value})} 
                        required 
                      />
                      
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="isDefault"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                          Set as default address
                        </label>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          type="submit"
                          disabled={addressLoading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addressLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button 
                          type="button" 
                          onClick={resetAddressForm} 
                          className="bg-white border border-gray-300 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {addressLoading ? (
                        <div className="text-center py-8">Loading addresses...</div>
                      ) : addresses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>Bạn chưa có địa chỉ nào.</p>
                          <p className="text-sm mt-2">Nhấn "+ Add New Address" để thêm địa chỉ mới.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {addresses.map((addr) => (
                            <div key={addr._id} className="border border-gray-300 rounded-lg p-4 relative hover:shadow-md transition">
                              {addr.isDefault && (
                                <span className="absolute top-2 right-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                                  DEFAULT
                                </span>
                              )}
                              <p className="font-bold text-lg mb-1">{addr.fullName}</p>
                              <p className="text-gray-600 text-sm mb-1">Tel: {addr.phone}</p>
                              <p className="text-gray-600 text-sm">{addr.street}</p>
                              <p className="text-gray-600 text-sm">{addr.city}, {addr.country}</p>
                              <div className="mt-4 flex gap-4 text-sm font-bold text-blue-700">
                                {!addr.isDefault && (
                                  <button 
                                    onClick={() => handleSetDefaultAddress(addr._id)}
                                    className="hover:underline"
                                  >
                                    Set Default
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleEditAddress(addr)}
                                  className="hover:underline"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteAddress(addr._id)}
                                  className="hover:underline text-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
