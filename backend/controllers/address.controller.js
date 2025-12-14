// controllers/address.controller.js
const Address = require('../models/Address.model');

// @desc    Lấy tất cả địa chỉ của user
// @route   GET /api/address
// @access  Private
exports.getMyAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.user._id })
                                       .sort({ isDefault: -1, createdAt: -1 }); // Ưu tiên mặc định
        res.status(200).json(addresses);
    } catch (error) {
        console.error('Lỗi lấy địa chỉ:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// @desc    Thêm địa chỉ mới
// @route   POST /api/address
// @access  Private
exports.addAddress = async (req, res) => {
    try {
        const { fullName, phone, street, city, country, isDefault } = req.body;
        
        const newAddress = new Address({
            user: req.user._id,
            fullName,
            phone,
            street,
            city,
            country,
            isDefault
        });
        
        await newAddress.save(); // Hook 'pre-save' sẽ tự động xử lý logic 'isDefault'
        
        // Trả về tất cả địa chỉ (đã cập nhật)
        const addresses = await Address.find({ user: req.user._id })
                                       .sort({ isDefault: -1, createdAt: -1 });
        res.status(201).json(addresses);

    } catch (error) {
        console.error('Lỗi thêm địa chỉ:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// @desc    Đặt làm địa chỉ mặc định
// @route   PUT /api/address/default/:id
// @access  Private
exports.setDefaultAddress = async (req, res) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
        if (!address) {
            return res.status(404).json({ message: 'Không tìm thấy địa chỉ.' });
        }
        
        address.isDefault = true;
        await address.save(); // Hook 'pre-save' sẽ xử lý phần còn lại
        
        const addresses = await Address.find({ user: req.user._id })
                                       .sort({ isDefault: -1, createdAt: -1 });
        res.status(200).json(addresses);

    } catch (error) {
        console.error('Lỗi đặt mặc định:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// @desc    Xóa địa chỉ
// @route   DELETE /api/address/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });

        if (!address) {
            return res.status(404).json({ message: 'Không tìm thấy địa chỉ.' });
        }
        
        res.status(200).json({ message: 'Xóa địa chỉ thành công.' });
    } catch (error) {
        console.error('Lỗi xóa địa chỉ:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};