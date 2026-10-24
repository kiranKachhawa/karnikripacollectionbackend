import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return null;
    }

    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });

    return transporter;
};

export const sendPasswordResetEmail = async ({ to, resetToken, resetUrl }) => {
    const mailer = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@karnikripacollection.com";

    if (!mailer) {
        return { sent: false, reason: "SMTP not configured" };
    }

    await mailer.sendMail({
        from: `"Karni Kripa Collection" <${from}>`,
        to,
        subject: "Reset your password — Karni Kripa Collection",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #222;">
                <h2 style="color: #c9a96e;">Password Reset</h2>
                <p>We received a request to reset your password.</p>
                <p>Use this code:</p>
                <p style="font-size: 22px; font-weight: bold; letter-spacing: 2px; background: #f5f5f5; padding: 12px 16px; display: inline-block;">${resetToken}</p>
                <p>Or click the link below (valid for 1 hour):</p>
                <p><a href="${resetUrl}" style="color: #c9a96e;">Reset Password</a></p>
                <p style="color: #888; font-size: 12px;">If you did not request this, you can ignore this email.</p>
            </div>
        `
    });

    return { sent: true };
};

export const sendNewsletterWelcome = async ({ to }) => {
    const mailer = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@karnikripacollection.com";

    if (!mailer) {
        return { sent: false, reason: "SMTP not configured" };
    }

    await mailer.sendMail({
        from: `"Karni Kripa Collection" <${from}>`,
        to,
        subject: "Welcome to Karni Kripa Collection",
        html: `<p>Thanks for subscribing! You'll be first to know about new collections and offers.</p>`
    });

    return { sent: true };
};
