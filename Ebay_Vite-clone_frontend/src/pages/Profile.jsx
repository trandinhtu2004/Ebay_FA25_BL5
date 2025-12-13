// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import FloatingInput from '../components/FloatingInput'; // Tận dụng component cũ
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5001/api/users';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info'); // info | password | address
  const [loading, setLoading] = useState(false);

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

  // State giả lập danh sách địa chỉ (Vì chưa có API)
  const [addresses, setAddresses] = useState([
    { id: 1, name: 'Home', address: '123 Nguyen Trai, Ha Noi', phone: '0987654321', isDefault: true }
  ]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: '', address: '', phone: '' });

  // Kiểm tra authentication
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

  // --- XỬ LÝ CẬP NHẬT PROFILE ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Lỗi cập nhật');

      // Cập nhật user trong AuthContext
      updateUser(data); // data là user mới từ backend
      toast.success('Cập nhật hồ sơ thành công!'); 

    } catch (error) {
      toast.error(error.message);
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

  // --- XỬ LÝ ĐỊA CHỈ (UI Demo) ---
  const handleSaveAddress = (e) => {
    e.preventDefault();
    const newId = addresses.length + 1;
    setAddresses([...addresses, { ...newAddress, id: newId, isDefault: false }]);
    setIsEditingAddress(false);
    setNewAddress({ name: '', address: '', phone: '' });
    toast.success('Thêm địa chỉ thành công (Local state)');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#191919]">
      {/* Header dùng lại, không cần truyền categories nếu chỉ muốn hiện trang tĩnh */}
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
                    />
                    
                    <div className="opacity-50 pointer-events-none">
                       <FloatingInput label="Email (Cannot change)" value={user.email} readOnly />
                    </div>

                    <button disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 w-max mt-2">
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
                      type="password" label="Current Password" 
                      value={passData.currentPassword}
                      onChange={(e) => setPassData({...passData, currentPassword: e.target.value})}
                    />
                    <FloatingInput 
                      type="password" label="New Password" 
                      value={passData.newPassword}
                      onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                    />
                    <FloatingInput 
                      type="password" label="Confirm New Password" 
                      value={passData.confirmPassword}
                      onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                    />
                     <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 w-max mt-2">
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
                      <button onClick={() => setIsEditingAddress(true)} className="text-blue-700 font-bold hover:underline text-sm">
                        + Add New Address
                      </button>
                    )}
                  </div>

                  {isEditingAddress ? (
                    <form onSubmit={handleSaveAddress} className="max-w-md flex flex-col gap-4 bg-gray-50 p-4 rounded mb-4">
                      <h3 className="font-bold">New Address</h3>
                      <FloatingInput label="Contact Name" value={newAddress.name} onChange={(e) => setNewAddress({...newAddress, name: e.target.value})} required />
                      <FloatingInput label="Street Address" value={newAddress.address} onChange={(e) => setNewAddress({...newAddress, address: e.target.value})} required />
                      <FloatingInput label="Phone Number" value={newAddress.phone} onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})} required />
                      <div className="flex gap-2">
                         <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">Save</button>
                         <button type="button" onClick={() => setIsEditingAddress(false)} className="bg-white border border-gray-300 px-4 py-2 rounded-full text-sm font-bold">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="border border-gray-300 rounded-lg p-4 relative hover:shadow-md">
                          {addr.isDefault && <span className="absolute top-2 right-2 text-[10px] bg-gray-200 px-2 py-1 rounded font-bold text-gray-600">DEFAULT</span>}
                          <p className="font-bold text-lg">{addr.name}</p>
                          <p className="text-gray-600">{addr.address}</p>
                          <p className="text-gray-600 mt-1">Tel: {addr.phone}</p>
                          <div className="mt-4 flex gap-4 text-sm font-bold text-blue-700">
                            <button className="hover:underline">Edit</button>
                            <button className="hover:underline">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
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