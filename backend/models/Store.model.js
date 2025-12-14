// models/Store.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StoreSchema = new Schema({
    // [cite: 203-204]
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Mỗi seller chỉ có 1 store
    },
    // [cite: 205-206]
    storeName: {
        type: String,
        required: [true, 'Tên cửa hàng là bắt buộc'],
        trim: true,
        unique: true // Tên cửa hàng không được trùng
    },
    // [cite: 207-208]
    description: {
        type: String,
        default: ''
    },
    // [cite: 209-210]
    bannerImageURL: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Store', StoreSchema);