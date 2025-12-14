// controllers/store.controller.js
const Store = require('../models/Store.model');
const User = require('../models/User.model');

// @desc    Lấy hoặc Cập nhật hồ sơ cửa hàng (Nhóm 2) 
// @route   PUT /api/store/me
// @access  Private/Seller
// @desc    Lấy hoặc Cập nhật hồ sơ cửa hàng (Nhóm 2)
// @route   PUT /api/store/me
// @access  Private/Seller
exports.updateStoreProfile = async (req, res) => {
    const { storeName, description, bannerImageURL } = req.body;
    const sellerId = req.user._id; 

    try {
        let store = await Store.findOne({ seller: sellerId });

        if (store) {
            // Cập nhật cửa hàng đã có
            store.storeName = storeName || store.storeName;
            store.description = description ?? store.description; 
            store.bannerImageURL = bannerImageURL ?? store.bannerImageURL;
        } else {
            // Tạo cửa hàng mới nếu chưa có
            store = new Store({
                seller: sellerId,
                storeName,
                description,
                bannerImageURL
            });
        }
        
        const updatedStore = await store.save();

        // --- 2. THÊM LOGIC CẬP NHẬT USER ---
        // Cập nhật 'User' document để lưu ID của cửa hàng này
        await User.findByIdAndUpdate(sellerId, { store: updatedStore._id });
        // ------------------------------------
        
        res.status(200).json(updatedStore);
        
    } catch (error) {
        // ... (phần xử lý lỗi không đổi)
        console.error('Lỗi cập nhật store:', error);
        if (error.code === 11000) {
             return res.status(400).json({ message: 'Tên cửa hàng này đã được sử dụng.' });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật cửa hàng.' });
    }
};

// @desc    Lấy hồ sơ cửa hàng của tôi (Nhóm 2)
// @route   GET /api/store/me
// @access  Private/Seller
exports.getMyStore = async (req, res) => {
     try {
        const store = await Store.findOne({ seller: req.user._id });
        if (!store) {
            // Đây là seller mới, chưa tạo cửa hàng
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng. Vui lòng tạo một cửa hàng.' });
        }
        res.status(200).json(store);
     } catch (error) {
         console.error('Lỗi lấy store:', error);
         res.status(500).json({ message: 'Lỗi máy chủ.' });
     }
};