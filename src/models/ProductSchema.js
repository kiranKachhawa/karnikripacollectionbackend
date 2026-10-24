import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    image: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        required: true
    },
    discountPrice: {
        type: Number,
        required: true
    },
    rating: {
        type: Number,
        default: 4.5
    },
    review: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        required: true,
    },
    isTrending: {
        type: Boolean,
        default: false
    },
    images: {
        type: [String],
        default: []
    },
    sizes: {
        type: [String],
        default: ["S", "M", "L", "XL"]
    },
    colors: {
        type: [String],
        default: ["Default"]
    },
    sku: {
        type: String,
        default: ""
    },
    subcategory: {
        type: String,
        default: ""
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isBestseller: {
        type: Boolean,
        default: false
    },
    isNewArrival: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    ratingsCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true })
export default mongoose.model("product", productSchema)