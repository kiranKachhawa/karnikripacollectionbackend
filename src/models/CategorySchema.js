import mongoose from "mongoose";


const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    image: {
        type: String,
        default: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80",
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    },
    products: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products"
    },
}, { timestamps: true })

export default mongoose.model("category", categorySchema);