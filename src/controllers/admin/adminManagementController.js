import ProductSchema from "../../models/ProductSchema.js";
import UserSchema from "../../models/UserSchema.js";
import OrderSchema from "../../models/OrderSchema.js";
import CouponSchema from "../../models/CouponSchema.js";
import ReviewSchema from "../../models/ReviewSchema.js";

// 1. DASHBOARD STATS
export const getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await ProductSchema.countDocuments();
        const totalUsers = await UserSchema.countDocuments();
        const totalOrders = await OrderSchema.countDocuments();

        const pendingOrders = await OrderSchema.countDocuments({ orderStatus: "Pending" });
        const confirmedOrders = await OrderSchema.countDocuments({ orderStatus: "Confirmed" });
        const deliveredOrders = await OrderSchema.countDocuments({ orderStatus: "Delivered" });
        const cancelledOrders = await OrderSchema.countDocuments({ orderStatus: "Cancelled" });

        // Total revenue (from Delivered or Paid orders)
        const revenueData = await OrderSchema.aggregate([
            {
                $match: {
                    $or: [
                        { orderStatus: "Delivered" },
                        { paymentStatus: "Paid" }
                    ],
                    orderStatus: { $ne: "Cancelled" }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" }
                }
            }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        // Low stock products (<= 5)
        const lowStockProducts = await ProductSchema.find({ stock: { $lte: 5 } }).select("name slug image stock price discountPrice");

        // Recent 5 orders
        const recentOrders = await OrderSchema.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("user", "name email");

        // Recent 5 users
        const recentUsers = await UserSchema.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("-password");

        res.status(200).json({
            success: true,
            stats: {
                totalProducts,
                totalUsers,
                totalOrders,
                totalRevenue,
                pendingOrders: pendingOrders + confirmedOrders,
                deliveredOrders,
                cancelledOrders,
                lowStockCount: lowStockProducts.length,
                lowStockProducts,
                recentOrders,
                recentUsers
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// 2. ORDER MANAGEMENT
export const getAllOrders = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status && status !== "all") {
            query.orderStatus = status;
        }

        let orders = await OrderSchema.find(query)
            .sort({ createdAt: -1 })
            .populate("user", "name email phone");

        if (search && search.trim() !== "") {
            const term = search.trim().toLowerCase();
            orders = orders.filter(
                (o) =>
                    o._id.toString().includes(term) ||
                    (o.user?.name && o.user.name.toLowerCase().includes(term)) ||
                    (o.user?.email && o.user.email.toLowerCase().includes(term)) ||
                    (o.trackingNumber && o.trackingNumber.toLowerCase().includes(term))
            );
        }

        res.status(200).json({
            success: true,
            total: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus, trackingNumber, paymentStatus } = req.body;

        const updateData = {};
        if (orderStatus) {
            updateData.orderStatus = orderStatus;
            if (orderStatus === "Delivered") updateData.deliveredAt = new Date();
            if (orderStatus === "Cancelled") updateData.cancelledAt = new Date();
        }
        if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;

        const order = await OrderSchema.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).populate("user", "name email phone");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({
            success: true,
            message: "Order updated successfully",
            order
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// 3. USER MANAGEMENT
export const getAllUsers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search && search.trim() !== "") {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [{ name: regex }, { email: regex }];
        }

        const users = await UserSchema.find(query).select("-password").sort({ createdAt: -1 });

        // Augment with order count
        const usersWithOrders = await Promise.all(
            users.map(async (u) => {
                const orderCount = await OrderSchema.countDocuments({ user: u._id });
                return {
                    ...u.toObject(),
                    orderCount
                };
            })
        );

        res.status(200).json({
            success: true,
            users: usersWithOrders
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive, role } = req.body;

        const updateData = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (role) updateData.role = role;

        const user = await UserSchema.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// 4. COUPON MANAGEMENT
export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await CouponSchema.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const createCoupon = async (req, res) => {
    try {
        const {
            code,
            discountType = "percentage",
            discountValue,
            minOrderAmount = 0,
            maxDiscount = 0,
            expiryDate,
            usageLimit = 100,
            isActive = true
        } = req.body;

        if (!code || !discountValue || !expiryDate) {
            return res.status(400).json({
                success: false,
                message: "Code, discount value, and expiry date are required"
            });
        }

        const existing = await CouponSchema.findOne({ code: code.trim().toUpperCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: "Coupon code already exists" });
        }

        const coupon = await CouponSchema.create({
            code: code.trim().toUpperCase(),
            discountType,
            discountValue: Number(discountValue),
            minOrderAmount: Number(minOrderAmount),
            maxDiscount: Number(maxDiscount),
            expiryDate: new Date(expiryDate),
            usageLimit: Number(usageLimit),
            isActive
        });

        res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            coupon
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await CouponSchema.findByIdAndUpdate(id, { $set: req.body }, { new: true });
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }
        res.status(200).json({ success: true, message: "Coupon updated successfully", coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await CouponSchema.findByIdAndDelete(id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }
        res.status(200).json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// 5. REVIEW MODERATION
export const getAllReviews = async (req, res) => {
    try {
        const reviews = await ReviewSchema.find()
            .sort({ createdAt: -1 })
            .populate("product", "name image price")
            .populate("user", "name email");

        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await ReviewSchema.findByIdAndDelete(id);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Recalculate product rating
        const remaining = await ReviewSchema.find({ product: review.product });
        const product = await ProductSchema.findById(review.product);
        if (product) {
            if (remaining.length > 0) {
                const avg = remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length;
                product.rating = Number(avg.toFixed(1));
                product.ratingsCount = remaining.length;
            } else {
                product.rating = 4.5;
                product.ratingsCount = 0;
            }
            await product.save();
        }

        res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
