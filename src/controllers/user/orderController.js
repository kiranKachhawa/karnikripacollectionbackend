import OrderSchema from "../../models/OrderSchema.js";
import CartSchema from "../../models/CartSchema.js";
import ProductSchema from "../../models/ProductSchema.js";
import CouponSchema from "../../models/CouponSchema.js";

// Create order
export const createOrder = async (req, res) => {
    try {
        const {
            shippingAddress,
            paymentMethod = "COD",
            paymentDetails = {},
            items: customItems
        } = req.body;

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
            return res.status(400).json({ success: false, message: "Complete shipping address is required" });
        }

        let orderItems = [];
        let couponData = { code: "", discountAmount: 0 };

        // If customItems passed (e.g. direct buy now), use them; otherwise use Cart
        if (customItems && customItems.length > 0) {
            for (const item of customItems) {
                const product = await ProductSchema.findById(item.product);
                if (!product) {
                    return res.status(404).json({ success: false, message: `Product not found` });
                }
                if (product.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Not enough stock for ${product.name}. Available: ${product.stock}`
                    });
                }
                const price = product.discountPrice !== undefined ? product.discountPrice : product.price;
                orderItems.push({
                    product: product._id,
                    name: product.name,
                    image: product.image,
                    price,
                    size: item.size || "M",
                    color: item.color || "Default",
                    quantity: item.quantity
                });
            }
        } else {
            const cart = await CartSchema.findOne({ user: req.user.id }).populate("items.product");
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ success: false, message: "Your cart is empty" });
            }

            for (const item of cart.items) {
                if (!item.product) continue;
                if (item.product.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Not enough stock for ${item.product.name}. Available: ${item.product.stock}`
                    });
                }
                const price = item.product.discountPrice !== undefined ? item.product.discountPrice : item.product.price;
                orderItems.push({
                    product: item.product._id,
                    name: item.product.name,
                    image: item.product.image,
                    price,
                    size: item.size || "M",
                    color: item.color || "Default",
                    quantity: item.quantity
                });
            }

            if (cart.coupon && cart.coupon.code) {
                couponData = {
                    code: cart.coupon.code,
                    discountAmount: cart.coupon.discountAmount || 0
                };
            }
        }

        if (orderItems.length === 0) {
            return res.status(400).json({ success: false, message: "No valid items in order" });
        }

        // Calculate totals
        const itemsPrice = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const discountAmount = couponData.discountAmount || 0;
        const shippingCharge = itemsPrice > 999 ? 0 : 99;
        const totalAmount = Math.max(0, itemsPrice - discountAmount + shippingCharge);

        // Deduct stock for each product
        for (const item of orderItems) {
            await ProductSchema.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        // Increment coupon count if coupon was applied
        if (couponData.code) {
            await CouponSchema.findOneAndUpdate(
                { code: couponData.code },
                { $inc: { usedCount: 1 } }
            );
        }

        const isOnline = paymentMethod === "Online" || paymentMethod === "Razorpay";

        // Create order
        const order = new OrderSchema({
            user: req.user.id,
            items: orderItems,
            shippingAddress,
            coupon: couponData,
            itemsPrice,
            discountAmount,
            shippingCharge,
            totalAmount,
            paymentMethod,
            paymentStatus: isOnline ? (paymentDetails.paymentId ? "Paid" : "Pending") : "Pending",
            paymentDetails,
            orderStatus: "Confirmed"
        });

        await order.save();

        // Clear user cart
        await CartSchema.findOneAndUpdate(
            { user: req.user.id },
            { $set: { items: [], coupon: { code: "", discountPercent: 0, discountAmount: 0 } } }
        );

        res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            order
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Get logged-in user's orders
export const getMyOrders = async (req, res) => {
    try {
        const orders = await OrderSchema.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate("items.product");

        res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Get single order details
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await OrderSchema.findById(id).populate("items.product").populate("user", "name email phone");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Only order owner or admin can view
        if (order.user._id.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Cancel order (by user)
export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await OrderSchema.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.user.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        if (order.orderStatus === "Delivered" || order.orderStatus === "Cancelled") {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled as it is already ${order.orderStatus}`
            });
        }

        // Restore product stock
        for (const item of order.items) {
            await ProductSchema.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }

        order.orderStatus = "Cancelled";
        order.cancelledAt = new Date();
        await order.save();

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
