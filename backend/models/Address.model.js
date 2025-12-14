// models/Address.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AddressSchema = new Schema({
    // [cite: 2]
    user: { // Đổi 'userId' thành 'user' để khớp với các model khác
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    street: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Hook: Đảm bảo chỉ có 1 địa chỉ mặc định
AddressSchema.pre('save', async function (next) {
    // Nếu địa chỉ này được set là mặc định (isDefault = true)
    if (this.isModified('isDefault') && this.isDefault) {
        // Tìm và cập nhật tất cả các địa chỉ khác của user này
        // để set isDefault = false
        await this.constructor.updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

module.exports = mongoose.model('Address', AddressSchema);