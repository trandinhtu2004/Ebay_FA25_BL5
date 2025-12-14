// controllers/cart.controller.js
const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');

// @desc    Lấy giỏ hàng của user
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
    try {
        // Tìm giỏ hàng của user và populate thông tin chi tiết của sản phẩm
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'title price images stock'); // Chỉ lấy các trường cần thiết

        if (!cart) {
            // Nếu user chưa có giỏ hàng, tạo một giỏ hàng rỗng
            const newCart = await Cart.create({ user: req.user._id, items: [] });
            return res.status(200).json(newCart);
        }
        
        res.status(200).json(cart);
    } catch (error) {
        console.error('Lỗi khi lấy giỏ hàng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// @desc    Thêm/Cập nhật sản phẩm trong giỏ hàng
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({ message: 'Thiếu productId hoặc số lượng không hợp lệ.' });
    }

    try {
        // 1. Kiểm tra xem sản phẩm có tồn tại và còn hàng không
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Sản phẩm không đủ tồn kho.' });
        }

        // 2. Tìm giỏ hàng của user (hoặc tạo mới nếu chưa có)
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // 3. Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Cập nhật số lượng
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Thêm sản phẩm mới
            cart.items.push({ product: productId, quantity: quantity });
        }

        // 4. Lưu giỏ hàng
        await cart.save();
        
        // 5. Trả về giỏ hàng đã cập nhật (populate để frontend hiển thị)
        const updatedCart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'title price images stock');
            
        res.status(200).json(updatedCart);

    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};
// === HÀM MỚI 1 ===
// @desc    Cập nhật số lượng sản phẩm
// @route   PUT /api/cart/item
// @access  Private
exports.updateCartItemQuantity = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({ message: 'Thiếu productId hoặc số lượng không hợp lệ.' });
    }

    try {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Không tìm thấy giỏ hàng.' });
        }
        
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng.' });
        }
        
        // Kiểm tra tồn kho trước khi cập nhật
        const product = await Product.findById(productId);
        if (product.stock < quantity) {
             return res.status(400).json({ message: 'Sản phẩm không đủ tồn kho.' });
        }

        // Cập nhật số lượng
        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        
        // Trả về giỏ hàng đã populate
        const updatedCart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'title price images stock');
        res.status(200).json(updatedCart);

    } catch (error) {
        console.error('Lỗi cập nhật số lượng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// === HÀM MỚI 2 ===
// @desc    Xóa sản phẩm khỏi giỏ hàng
// @route   DELETE /api/cart/item
// @access  Private
exports.removeCartItem = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) {
        return res.status(400).json({ message: 'Thiếu productId.' });
    }

    try {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Không tìm thấy giỏ hàng.' });
        }

        // Lọc ra các sản phẩm không bị xóa
        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        
        await cart.save();
        
        // Trả về giỏ hàng đã populate
        const updatedCart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'title price images stock');
        res.status(200).json(updatedCart);

    } catch (error) {
        console.error('Lỗi xóa sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};