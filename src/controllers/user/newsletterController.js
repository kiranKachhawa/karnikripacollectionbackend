import NewsletterSchema from "../../models/NewsletterSchema.js";
import { sendNewsletterWelcome } from "../../utils/email.js";

export const subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Valid email is required" });
        }

        const existing = await NewsletterSchema.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(200).json({ success: true, message: "You are already subscribed" });
        }

        await NewsletterSchema.create({ email: email.toLowerCase() });

        try {
            await sendNewsletterWelcome({ to: email });
        } catch (mailErr) {
            console.warn("Newsletter welcome email skipped:", mailErr.message);
        }

        res.status(201).json({ success: true, message: "Subscribed successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
