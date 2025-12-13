// src/context/AuthContext.js
import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

// Khởi tạo Socket Instance
const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001', {
    autoConnect: false
});

const AuthContext = createContext();

// Thiết lập Base URL cho Axios
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const initRef = useRef(false);

    // --- EFFECT 1: Khởi tạo Auth từ Session Storage ---
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        console.log("[Auth Init] Kiểm tra session storage...");
        const storedToken = sessionStorage.getItem('token');
        const storedUserJson = sessionStorage.getItem('user');

        if (storedToken && storedUserJson) {
            try {
                const initialUser = JSON.parse(storedUserJson);
                // Chuẩn hóa userId: ưu tiên userId từ response login, nếu không có thì dùng _id
                const userId = initialUser.userId || initialUser._id;
                
                if (userId) {
                    console.log("[Auth Init] Tìm thấy user hợp lệ:", initialUser.username);
                    
                    // Cập nhật lại object user với userId chuẩn để dùng xuyên suốt app
                    const validUser = { ...initialUser, userId }; 
                    
                    setToken(() => storedToken);
                    setUser(() => validUser);
                    
                    // Set default header cho axios
                    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                } else {
                    console.warn("[Auth Init] User thiếu ID. Xóa storage.");
                    sessionStorage.clear();
                }
            } catch (e) {
                console.error("[Auth Init] Lỗi parse user. Xóa storage.", e);
                sessionStorage.clear();
            }
        } else {
            console.log("[Auth Init] Không có phiên đăng nhập.");
            delete axios.defaults.headers.common['Authorization'];
        }
        setIsAuthLoading(false);
    }, []);

    // --- EFFECT 2: Quản lý Socket ---
    useEffect(() => {
        if (!user?.userId) {
            if (socket.connected) {
                console.log("[Socket] Ngắt kết nối do không có user.");
                socket.disconnect();
            }
            return;
        }

        const handleConnect = () => {
            console.log(`[Socket] Connected: ${socket.id}. Join room: ${user.userId}`);
            socket.emit('join', user.userId);
        };

        if (!socket.connected) {
            console.log("[Socket] Đang kết nối...");
            socket.connect();
        }

        socket.on('connect', handleConnect);

        return () => {
            socket.off('connect', handleConnect);
        };
    }, [user]);

    // --- Hàm Login ---
    const login = useCallback((newToken, userData) => {
        // Chuẩn hóa userData để đảm bảo luôn có userId
        const userId = userData.userId || userData._id;
        
        if (!userId) {
            console.error("[Login] Thất bại: Không tìm thấy ID người dùng trong response.");
            return;
        }

        const validUser = { ...userData, userId };

        console.log(`[Login] Đăng nhập thành công cho: ${validUser.username}`);

        // 1. Set Axios Header
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        // 2. Lưu vào Storage
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('user', JSON.stringify(validUser));

        // 3. Cập nhật State (sẽ trigger Effect Socket)
        setToken(newToken);
        setUser(validUser);
    }, []);

    // --- Hàm Logout ---
    const logout = useCallback(() => {
        console.log("[Logout] Đăng xuất...");
        
        // 1. Xóa Header
        delete axios.defaults.headers.common['Authorization'];
        
        // 2. Xóa Storage
        sessionStorage.clear();
        localStorage.removeItem('token'); // Xóa cả ở local nếu có dùng login cũ
        localStorage.removeItem('userInfo');
        localStorage.removeItem('loginTime');

        // 3. Reset State & Socket
        setToken(null);
        setUser(null);
        if (socket.connected) socket.disconnect();
    }, []);

    // --- Hàm Update User ---
    const updateUser = useCallback((newUserData) => {
        const updatedUser = { ...user, ...newUserData };
        setUser(updatedUser);
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }, [user]);

    const value = {
        user,
        token,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token && !!user,
        isAuthLoading,
        socket
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);