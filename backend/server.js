// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require("socket.io");
const notificationEmitter = require('./utils/notificationEmitter'); // Import Emitter

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// --- Biến Toàn cục Lưu Trạng thái User Online ---
// **QUAN TRỌNG**: Biến này là nguồn dữ liệu duy nhất
let onlineUsers = {}; // { userId: socketId }

// --- Logic Lắng nghe Socket.IO ---
io.on('connection', (socket) => {
    console.log(`[Socket.IO] > User connected: ${socket.id}`);

    // Handler cho sự kiện 'join'
    socket.on('join', (userId) => {
        console.log(`[Socket.IO] > Event 'join' received from ${socket.id} with userId: ${userId}`);
        if (userId && typeof userId === 'string' && userId.trim() !== '') {
            const trimmedUserId = userId.trim();
            // Cập nhật trực tiếp vào biến chung 'onlineUsers'
            onlineUsers[trimmedUserId] = socket.id;
            console.log(`[Socket.IO] > User ${trimmedUserId} mapped to socket ${socket.id}.`);
            console.log(`[Socket.IO] > *** onlineUsers map AFTER 'join' update for ${trimmedUserId} ***: ${JSON.stringify(onlineUsers)}`);
        } else {
            console.warn(`[Socket.IO] > 'join' event from ${socket.id} lacked a valid userId.`);
        }
    });

    // Handler cho sự kiện 'disconnect'
    socket.on('disconnect', () => {
        console.log(`[Socket.IO] > User disconnected: ${socket.id}`);
        let deletedUserId = null;
        // Log bản đồ TRƯỚC khi xóa để đảm bảo nó không rỗng một cách vô lý
        console.log(`[Socket.IO] > onlineUsers map BEFORE delete for ${socket.id}: ${JSON.stringify(onlineUsers)}`);
        for (const userIdKey in onlineUsers) {
            if (onlineUsers[userIdKey] === socket.id) {
                deletedUserId = userIdKey;
                delete onlineUsers[userIdKey]; // Xóa khỏi biến chung
                console.log(`[Socket.IO] > User ${deletedUserId} (socket ${socket.id}) removed.`);
                break;
            }
        }
        // Log bản đồ SAU khi xóa
        console.log(`[Socket.IO] > onlineUsers map AFTER delete for ${socket.id}: ${JSON.stringify(onlineUsers)}`);
        
        // ... (optional emit) ...
        if (deletedUserId) {
            socket.broadcast.emit('userOffline', { userId: deletedUserId });
        }

    });

    // Handler lỗi socket
    socket.on('error', (error) => {
        console.error(`[Socket.IO] > Socket Error (${socket.id}):`, error);
    });

}); // Kết thúc io.on('connection')

// --- Logic Lắng nghe Event Emitter NỘI BỘ ---
// Di chuyển listener này ra khỏi io.on('connection') nếu nó đang nằm trong đó
// Đảm bảo nó được định nghĩa ở scope cao nhất của server.js
notificationEmitter.on('newNotification', ({ userId, notificationData }) => {
    // Log NGAY KHI sự kiện được nhận
    console.log(`[Emitter Listener] Received internal event 'newNotification' for user ${userId}.`);

    // **TRUY CẬP TRỰC TIẾP biến 'onlineUsers' toàn cục**
    // Log trạng thái của biến toàn cục TẠI THỜI ĐIỂM NÀY
    console.log(`[Emitter Listener] Checking GLOBAL onlineUsers map at emit time: ${JSON.stringify(onlineUsers)}.`);

    const recipientSocketId = onlineUsers[userId.toString()]; // Lấy từ biến toàn cục

    if (recipientSocketId) {
        // Gửi socket đi
        io.to(recipientSocketId).emit('newNotification', notificationData);
        console.log(`[Socket Emit SUCCESS] Sent 'newNotification' to user ${userId} via socket ${recipientSocketId}`);
    } else {
        // Log thông tin nếu không tìm thấy
        console.log(`[Socket Emit INFO] User ${userId} not found in GLOBAL map. Map content: ${JSON.stringify(onlineUsers)}. Notification saved only.`);
    }
});
// ---------------------------------------------

// --- Kết nối MongoDB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('[DB] Kết nối MongoDB thành công!'))
    .catch(err => console.error('[DB] Lỗi kết nối MongoDB:', err));

// --- API Routes ---
// Các controller KHÔNG cần truy cập io hay onlineUsers nữa
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/products', require('./routes/product.routes.js'));
app.use('/api/store', require('./routes/store.routes.js'));
app.use('/api/categories', require('./routes/category.routes.js'));
app.use('/api/cart', require('./routes/cart.routes.js'));
app.use('/api/address', require('./routes/address.routes.js'));
app.use('/api/orders', require('./routes/order.routes.js'));
app.use('/api/payment', require('./routes/payment.routes.js'));
app.use('/api/reviews', require('./routes/review.routes.js'));
app.use('/api/returns', require('./routes/return.routes.js'));
app.use('/api/coupons', require('./routes/coupon.routes.js'));
app.use('/api/notifications', require('./routes/notification.routes.js')); // Controller chỉ xử lý GET/PUT
app.use('/api/admin', require('./routes/admin.routes.js'));

// --- Middleware Xử lý Lỗi Toàn cục ---
app.use((err, req, res, next) => {
  console.error("[Global Error Handler]", err.stack);
  res.status(500).send('Đã có lỗi xảy ra!');
});


// --- Khởi chạy HTTP Server ---
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`[Server] Server đang chạy trên cổng ${PORT}`);
});