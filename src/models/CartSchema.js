import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
    },
    size: {
        type: String,
        default: "M",
    },
    color: {
        type: String,
        default: "Default",
    },
    price: {
        type: Number,
        required: true,
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        unique: true,
    },
    items: [cartItemSchema],
    coupon: {
        code: { type: String, default: "" },
        discountPercent: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
    }
}, { timestamps: true });

export default mongoose.model("cart", cartSchema);
