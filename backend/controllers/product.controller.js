// backend/controllers/product.controller.js
const Product = require('../models/Product.model');
const Category = require('../models/Category.model');
// KHÔNG require 'xlsx'

// === HÀM MỚI (Admin) ===
// @desc    Lấy TẤT CẢ sản phẩm (Admin)
// @route   GET /api/products/admin/all
// @access  Private/Admin
exports.getAllProductsAdmin = async (req, res) => { // <<<<----- ĐẢM BẢO HÀM NÀY TỒN TẠI VÀ ĐƯỢC EXPORT
    try {
        // Lấy hết, không lọc theo isActive
        const products = await Product.find({})
            .populate('seller', 'username')
            .populate('category', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        console.error("Lỗi lấy SP admin:", error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// --- Hàm getProducts (Không đổi) ---
// @desc    Lấy tất cả sản phẩm (cho Nhóm 1)
// @route   GET /api/products
// @access  Public (Ai cũng xem được)
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({})
            // .populate('seller', 'username') // <-- XÓA DÒNG POPULATE CŨ
            // .populate('category', 'name'); // <-- XÓA DÒNG POPULATE CŨ

            // --- THAY BẰNG POPULATE LỒNG NHAU (DEEP POPULATE) ---
            .populate('category', 'name') // Lấy thông tin Category
            .populate({
                path: 'seller', // 1. Populate 'seller' (User) từ Product
                select: 'username', // 2. Chỉ lấy 'username' từ User
                populate: {
                    path: 'store', // 3. Populate 'store' từ User (mà chúng ta vừa thêm)
                    select: 'storeName description' // 4. Lấy các trường này từ Store
                }
            }).$where('this.isActive === true'); // Chỉ lấy SP đang active
            
        res.status(200).json(products);
    } catch (error) {
        console.error('Lỗi khi lấy sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy sản phẩm.' });
    }
};
// --- Hàm createProduct (Không đổi) ---
exports.createProduct = async (req, res) => {
    try {
        const { title, description, price, images, category, stock } = req.body;
        const sellerId = req.user._id;
        if (!title || !description || !price || !category || !stock) {
            return res.status(400).json({ message: 'Vui lòng điền tất cả các trường bắt buộc.' });
        }
        const productImages = images && images.length > 0 ? images : ['url_anh_mac_dinh.jpg'];
        const product = new Product({
            title, description, price: Number(price), images: productImages,
            category, seller: sellerId, stock: Number(stock)
        });
        const createdProduct = await product.save();
        console.log(`[Product Created] ID: ${createdProduct._id}, Seller: ${sellerId}`);
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error('Lỗi khi tạo sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo sản phẩm.' });
    }
};

// --- HÀM IMPORT MỚI (Thay thế importProducts) ---
// @desc    Import sản phẩm từ Text (Copy-Paste)
// @route   POST /api/products/import-text
// @access  Private/Seller
exports.importFromText = async (req, res) => {
    const { textData } = req.body; // Chỉ nhận dữ liệu text từ JSON body

    if (!textData) {
        return res.status(400).json({ message: 'Không có dữ liệu văn bản.' });
    }

    const sellerId = req.user._id;
    try {
        // Tải danh mục về để tra cứu
        const categories = await Category.find({});
        const categoryMap = new Map();
        categories.forEach(cat => {
            categoryMap.set(cat.name.toLowerCase(), cat._id);
        });

        const productsToCreate = [];
        const errors = [];
        
        // Tách dữ liệu bằng ký tự xuống dòng
        const rows = textData.trim().split('\n');
        
        // Bỏ qua hàng tiêu đề (hàng đầu tiên)
        // Bắt đầu lặp từ i = 1
        for (let i = 1; i < rows.length; i++) { 
            // Tách các cột bằng ký tự Tab (Excel khi copy sẽ dùng Tab)
            const cols = rows[i].split('\t'); 
            
            // Yêu cầu tối thiểu 5 cột
            if (cols.length < 5) {
                 errors.push(`Hàng ${i + 1}: Hàng không đủ cột. Yêu cầu 5 cột (Title, Desc, Price, Category, Stock).`);
                 continue;
            }
            
            // 1.Title, 2.Desc, 3.Price, 4.Category, 5.Stock, 6.Images (tùy chọn)
            const title = cols[0];
            const description = cols[1];
            const price = cols[2];
            const category = cols[3];
            const stock = cols[4];
            const images = cols[5] || ''; // Cột 6 (tùy chọn)

            if (!title || !price || !category || !stock) {
                 errors.push(`Hàng ${i + 1}: Thiếu thông tin bắt buộc (Title, Price, Category, Stock).`);
                 continue;
            }

            const categoryId = categoryMap.get(String(category).toLowerCase());
            if (!categoryId) {
                errors.push(`Hàng ${i + 1}: Không tìm thấy danh mục '${category}'.`);
                continue;
            }
            
            const imageArray = images ? String(images).split(',').map(url => url.trim()).filter(url => url) : ['url_anh_mac_dinh.jpg'];

            productsToCreate.push({
                title,
                description: description || '',
                price: Number(price),
                category: categoryId,
                stock: Number(stock),
                images: imageArray,
                seller: sellerId,
            });
        }
        
        if (productsToCreate.length > 0) {
            await Product.insertMany(productsToCreate);
        }
        
        res.status(201).json({
            message: `Import hoàn tất!`,
            successCount: productsToCreate.length,
            errorCount: errors.length,
            errors: errors, 
        });

    } catch (error) {
        console.error('Lỗi khi import text:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

// === HÀM MỚI 1 ===
// @desc    Lấy sản phẩm của seller đang đăng nhập (Nhóm 2)
// @route   GET /api/products/myproducts
// @access  Private/Seller
exports.getMyProducts = async (req, res) => {
    try {
        // req.user._id được lấy từ middleware 'protect'
        const products = await Product.find({ seller: req.user._id })
            .populate('category', 'name') // Lấy tên danh mục
            .sort({ createdAt: -1 }); // Sắp xếp mới nhất lên đầu
            
        res.status(200).json(products);
    } catch (error) {
        console.error('Lỗi khi lấy sản phẩm của tôi:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// === HÀM MỚI 2 ===
// @desc    Lấy chi tiết 1 sản phẩm (cho việc edit)
// @route   GET /api/products/:id
// @access  Public (Ai cũng xem được, nhưng chỉ seller mới Sửa được)
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name').
        populate(
            'seller'
        );
        
        if (product) {
            res.status(200).json(product);
        } else {
            // 🐞 Gỡ lỗi: Phân biệt lỗi client/server
            res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// === HÀM CẬP NHẬT 2: CẬP NHẬT SẢN PHẨM (Seller/Admin) ===
// @desc    Cập nhật sản phẩm (Nhóm 2)
// @route   PUT /api/products/:id
// @access  Private/Seller (Chủ sở hữu)
exports.updateProduct = async (req, res) => {
    try {
        const { title, description, price, category, stock, images } = req.body;
        const productId = req.params.id;
        
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }

        // --- KIỂM TRA QUYỀN SỞ HỮU --- (Admin không dùng API này để sửa)
        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa sản phẩm này.' });
        }
        
        // --- LOGIC MỚI: Xử lý khi Seller sửa SP bị Admin ẩn ---
        let needsReview = false;
        if (!product.isActive && product.violationReason) {
             // Nếu SP đang bị admin ẩn VÀ seller sửa nó
             product.violationReason = ''; // Xóa lý do vi phạm
             needsReview = true; // Đánh dấu cần admin xem lại (trạng thái vẫn là isActive: false)
             console.log(`[Product Update] Product ${productId} edited by seller, violation reason cleared, pending review.`);
        }
        // ---------------------------------------------------
        
        // Cập nhật các trường
        product.title = title || product.title;
        product.description = description || product.description;
        product.price = price || product.price;
        product.category = category || product.category;
        product.stock = stock || product.stock;
        
        const imageArray = images ? String(images).split(',').map(url => url.trim()).filter(url => url) : product.images;
        product.images = imageArray.length > 0 ? imageArray : ['url_anh_mac_dinh.jpg'];
        
        const updatedProduct = await product.save();
        
        console.log(`[Product Updated] ID: ${updatedProduct._id}, Seller: ${req.user._id}`);
        
        // Trả về thông tin cập nhật và trạng thái cần review
        res.status(200).json({
            ...updatedProduct.toObject(), // Chuyển document thành object thường
            needsReview: needsReview,
            message: needsReview ? 'Cập nhật thành công. Sản phẩm đang chờ Admin duyệt lại.' : 'Cập nhật thành công.'
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật.' });
    }
};

exports.deleteProduct = async (req, res) => {
     try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });

        // KIỂM TRA QUYỀN: Hoặc là chủ SP, hoặc là Admin
        if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền xóa.' });
        }
            
        product.isActive = false; // Đánh dấu là không hoạt động
        await product.save();
        res.status(200).json({ message: 'Sản phẩm đã được ẩn.' });
    } catch (error) {
        console.error("Lỗi ẩn SP:", error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// === SỬA HÀM toggleProductActive (Xử lý ẩn/hiện và lý do) ===
// @desc    Bật/tắt sản phẩm (Seller hoặc Admin), Admin có thể thêm lý do khi ẩn
// @route   PUT /api/products/:id/toggle
// @access  Private/SellerOrAdmin
exports.toggleProductActive = async (req, res) => {
    // 1. Lấy reason một cách an toàn
    // Nếu req.body tồn tại thì lấy reason, nếu không thì reason là undefined
    const reason = req.body?.reason;
    const productId = req.params.id;

    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });

        const isOwner = product.seller.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Không có quyền.' });
        }

        const newActiveState = !product.isActive;
        let newViolationReason = product.violationReason;

        if (isAdmin) {
            // Chỉ cập nhật reason nếu là Admin và đang ẩn sản phẩm
            if (newActiveState === false && reason) {
                newViolationReason = reason;
            } else if (newActiveState === true) { // Khi Admin bật lại
                newViolationReason = '';
            }
        } else if (isOwner) { // Seller tự bật/tắt
             // Luôn xóa reason nếu seller tự thao tác, bất kể bật hay tắt
            newViolationReason = '';
        }

        product.isActive = newActiveState;
        product.violationReason = newViolationReason;
        await product.save();

        res.status(200).json({
            message: `Sản phẩm đã được ${newActiveState ? 'hiển thị' : 'ẩn'}.`,
            isActive: product.isActive,
            violationReason: product.violationReason
        });
    } catch (error) {
        console.error("Lỗi toggle SP:", error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
}