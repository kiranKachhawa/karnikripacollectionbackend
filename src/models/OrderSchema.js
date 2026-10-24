import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    size: { type: String, default: "M" },
    color: { type: String, default: "Default" },
    quantity: { type: Number, required: true, min: 1 }
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    items: [orderItemSchema],
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, default: "India" }
    },
    coupon: {
        code: { type: String, default: "" },
        discountAmount: { type: Number, default: 0 }
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: {
        type: String,
        enum: ["COD", "Online", "Razorpay"],
        default: "COD"
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending"
    },
    paymentDetails: {
        paymentId: { type: String, default: "" },
        orderId: { type: String, default: "" },
        signature: { type: String, default: "" }
    },
    orderStatus: {
        type: String,
        enum: [
            "Pending",
            "Confirmed",
            "Processing",
            "Shipped",
            "Out for Delivery",
            "Delivered",
            "Cancelled",
            "Returned",
            "Refunded"
        ],
        default: "Pending"
    },
    trackingNumber: {
        type: String,
        default: ""
    },
    deliveredAt: Date,
    cancelledAt: Date
}, { timestamps: true });

export default mongoose.model("order", orderSchema);
