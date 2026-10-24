import UserSchema from "../../models/UserSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../utils/email.js";

export const signup = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
                massage: "Name, email and password are required"
            });
        }

        // check if user already exists
        const userExist = await UserSchema.findOne({ email });
        if (userExist) {
            return res.status(400).json({
                message: "User already exists",
                massage: "user already exist"
            });
        }

        // hash password
        const hashPassword = await bcrypt.hash(password, 10);

        // create user — role is always "user" (admins are seeded/promoted only)
        const user = await UserSchema.create({
            name,
            email,
            password: hashPassword,
            role: "user",
            phone: phone || "",
            addresses: []
        });

        // token create
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const sanitizedUser = user.toObject();
        delete sanitizedUser.password;

        res.status(201).json({
            message: "User created successfully",
            massage: "user created successfully",
            token: token,
            user: sanitizedUser
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            massage: "internal server error",
            error: error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // check user
        const user = await UserSchema.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                massage: "user not found"
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                message: "Your account is deactivated. Please contact support.",
                massage: "Your account is deactivated"
            });
        }

        // compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid credentials",
                massage: "invalid credentials"
            });
        }

        // create token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const sanitizedUser = user.toObject();
        delete sanitizedUser.password;

        return res.status(200).json({
            message: "Login successfully",
            massage: " login successfully",
            token: token,
            user: sanitizedUser
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            massage: "internal server error",
            error: error.message
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await UserSchema.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;

        const user = await UserSchema.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true }
        ).select("-password");

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Both old and new passwords are required" });
        }

        const user = await UserSchema.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect current password" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Address Management
export const addAddress = async (req, res) => {
    try {
        const { fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;
        const user = await UserSchema.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // If this address is set as default, unset others
        if (isDefault || user.addresses.length === 0) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push({
            fullName,
            phone,
            street,
            city,
            state,
            postalCode,
            country: country || "India",
            isDefault: isDefault || user.addresses.length === 0
        });

        await user.save();
        res.status(200).json({
            success: true,
            message: "Address added successfully",
            addresses: user.addresses
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;

        const user = await UserSchema.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        if (fullName) address.fullName = fullName;
        if (phone) address.phone = phone;
        if (street) address.street = street;
        if (city) address.city = city;
        if (state) address.state = state;
        if (postalCode) address.postalCode = postalCode;
        if (country) address.country = country;
        if (isDefault !== undefined) address.isDefault = isDefault;

        await user.save();
        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            addresses: user.addresses
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const user = await UserSchema.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
        // If no default address remains and addresses exist, make the first one default
        if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        res.status(200).json({
            success: true,
            message: "Address removed successfully",
            addresses: user.addresses
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Password Recovery
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserSchema.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User with this email not found" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        let emailSent = false;
        try {
            const result = await sendPasswordResetEmail({
                to: user.email,
                resetToken,
                resetUrl
            });
            emailSent = Boolean(result?.sent);
        } catch (mailErr) {
            console.warn("Password reset email failed:", mailErr.message);
        }

        const response = {
            success: true,
            message: emailSent
                ? "Password reset link sent to your email"
                : "Password reset token generated. Check the response for the reset link (email not configured).",
            emailSent
        };

        // Only expose token when SMTP is not configured (local/dev)
        if (!emailSent) {
            response.resetToken = resetToken;
            response.resetUrl = resetUrl;
        }

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }

        const user = await UserSchema.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now login."
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const adminRegister = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, phone } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password, and confirm password are required"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and Confirm Password do not match"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user or admin already exists with this email
        const existingUser = await UserSchema.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new Admin
        const newAdmin = await UserSchema.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "admin",
            isActive: true,
            phone: phone || "",
            addresses: []
        });

        const sanitizedAdmin = newAdmin.toObject();
        delete sanitizedAdmin.password;

        return res.status(201).json({
            success: true,
            message: "Admin registered successfully! You can now log in.",
            admin: sanitizedAdmin
        });
    } catch (error) {
        console.error("Admin registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during admin registration",
            error: error.message
        });
    }
};

