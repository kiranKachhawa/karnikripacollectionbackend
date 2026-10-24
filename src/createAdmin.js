import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import UserSchema from "./models/UserSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const run = async () => {
    try {
        await connectDB();

        const args = process.argv.slice(2);
        const email = (args[0] || process.env.ADMIN_EMAIL || "admin@karnikripa.com").trim().toLowerCase();
        const password = args[1] || process.env.ADMIN_PASSWORD || "Admin@123";
        const name = args[2] || "Admin";

        const hashedPassword = await bcrypt.hash(password, 10);

        let user = await UserSchema.findOne({ email });
        if (user) {
            user.password = hashedPassword;
            user.role = "admin";
            user.isActive = true;
            if (name && !user.name) user.name = name;
            await user.save();
            console.log(`Successfully updated existing user to Admin!`);
        } else {
            user = await UserSchema.create({
                name,
                email,
                password: hashedPassword,
                role: "admin",
                isActive: true,
                phone: "9999999999"
            });
            console.log(`Successfully created new Admin user!`);
        }

        // Also ensure admin123@gmail.com is usable if it exists
        const admin2 = await UserSchema.findOne({ email: "admin123@gmail.com" });
        if (admin2) {
            admin2.password = hashedPassword;
            admin2.role = "admin";
            admin2.isActive = true;
            await admin2.save();
            console.log(`Also synchronized password for admin123@gmail.com`);
        }

        console.log(`-----------------------------------------------`);
        console.log(`Admin Email:    ${email}`);
        console.log(`Admin Password: ${password}`);
        console.log(`Admin Role:     admin`);
        console.log(`-----------------------------------------------`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("Error creating admin:", err);
        process.exit(1);
    }
};

run();
