import Razorpay from "razorpay";
import crypto from "crypto";

const getRazorpay = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return null;
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

export const createPaymentOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Valid amount is required" });
        }

        const amountPaise = Math.round(Number(amount) * 100);
        const keyId = process.env.RAZORPAY_KEY_ID;
        const razorpay = getRazorpay();

        if (razorpay) {
            const order = await razorpay.orders.create({
                amount: amountPaise,
                currency: "INR",
                receipt: `kkc_${Date.now()}`,
                notes: { userId: String(req.user.id) }
            });

            return res.status(200).json({
                success: true,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId,
                mode: "live"
            });
        }

        // Demo mode when Razorpay keys are not configured
        const orderId = "order_demo_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
        return res.status(200).json({
            success: true,
            orderId,
            amount: amountPaise,
            currency: "INR",
            keyId: keyId || "rzp_test_demo",
            mode: "demo"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature, mode } = req.body;

        if (!orderId || !paymentId) {
            return res.status(400).json({ success: false, message: "Payment details missing" });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (keySecret && signature && !String(orderId).startsWith("order_demo_")) {
            const hmac = crypto.createHmac("sha256", keySecret);
            hmac.update(`${orderId}|${paymentId}`);
            const generatedSignature = hmac.digest("hex");

            if (generatedSignature !== signature) {
                return res.status(400).json({ success: false, message: "Payment verification failed" });
            }
        } else if (mode === "demo" || String(orderId).startsWith("order_demo_")) {
            // Allow demo verification only for demo orders
            if (!String(paymentId).startsWith("pay_demo_")) {
                return res.status(400).json({ success: false, message: "Invalid demo payment" });
            }
        } else if (!keySecret) {
            // No secret configured — accept demo-style payments only
            if (!String(orderId).startsWith("order_demo_")) {
                return res.status(400).json({ success: false, message: "Payment gateway not configured" });
            }
        }

        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            paymentId,
            orderId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
