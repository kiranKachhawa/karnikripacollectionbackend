import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "./config/db.js";
import UserSchema from "./models/UserSchema.js";
import CategorySchema from "./models/CategorySchema.js";
import ProductSchema from "./models/ProductSchema.js";
import CouponSchema from "./models/CouponSchema.js";

dotenv.config();

const seed = async () => {
    try {
        await connectDB();

        const adminEmail = process.env.ADMIN_EMAIL || "admin@karnikripa.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

        let admin = await UserSchema.findOne({ email: adminEmail });
        if (!admin) {
            admin = await UserSchema.create({
                name: "Admin",
                email: adminEmail,
                password: await bcrypt.hash(adminPassword, 10),
                role: "admin",
                phone: "9999999999"
            });
            console.log(`Admin created: ${adminEmail} / ${adminPassword}`);
        } else if (admin.role !== "admin") {
            admin.role = "admin";
            await admin.save();
            console.log(`Promoted existing user to admin: ${adminEmail}`);
        } else {
            console.log(`Admin already exists: ${adminEmail}`);
        }

        // Demo user
        const demoEmail = "user@karnikripa.com";
        let demoUser = await UserSchema.findOne({ email: demoEmail });
        if (!demoUser) {
            demoUser = await UserSchema.create({
                name: "Demo User",
                email: demoEmail,
                password: await bcrypt.hash("User@123", 10),
                role: "user",
                phone: "9876543210",
                addresses: [{
                    fullName: "Demo User",
                    phone: "9876543210",
                    street: "12 Fashion Street",
                    city: "Jaipur",
                    state: "Rajasthan",
                    postalCode: "302001",
                    country: "India",
                    isDefault: true
                }]
            });
            console.log(`Demo user created: ${demoEmail} / User@123`);
        }

        // Categories
        const categoryDefs = [
            {
                name: "Ethnic Wear",
                slug: "ethnic-wear",
                image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
                description: "Traditional elegance for every occasion"
            },
            {
                name: "Western Wear",
                slug: "western-wear",
                image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
                description: "Contemporary styles for modern living"
            },
            {
                name: "Accessories",
                slug: "accessories",
                image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
                description: "Finishing touches that elevate your look"
            }
        ];

        const categories = [];
        for (const cat of categoryDefs) {
            let existing = await CategorySchema.findOne({ slug: cat.slug });
            if (!existing) {
                existing = await CategorySchema.create(cat);
                console.log(`Category created: ${cat.name}`);
            }
            categories.push(existing);
        }

        const ethnicCat = await CategorySchema.findOne({ slug: "ethnic-wear" });
        const westernCat = await CategorySchema.findOne({ slug: "western-wear" });
        const accessCat = await CategorySchema.findOne({ slug: "accessories" });

        const catalogProducts = [
            {
                name: "Navratri Spl Oxidised Jewellery Mystery Box",
                slug: "navratri-spl-oxidised-jewellery-mystery-box",
                price: 1165,
                discount: 40,
                discountPrice: 699,
                category: accessCat?._id,
                image: "https://d28arj6mdig261.cloudfront.net/1789587599438-0-213556.webp",
                images: [
                    "https://d28arj6mdig261.cloudfront.net/1789587599438-0-213556.webp",
                    "https://d28arj6mdig261.cloudfront.net/1789587599266-1-262945.webp",
                    "https://d28arj6mdig261.cloudfront.net/1789587599398-2-134558.webp"
                ],
                stock: 100,
                rating: 4.9,
                ratingsCount: 78,
                isTrending: true,
                isFeatured: true,
                isBestseller: true,
                isNewArrival: true,
                sizes: ["One Size"],
                colors: ["Antique Silver"],
                description: "In this Oxidised Jewellery Mystery Box you will get 5 guaranteed premium items + 1 freebie gift:\n\n• 2 Types of Designer Jhumkas/Earrings\n• 2 Types of Handcrafted Bracelets\n• 1 Premium Oxidised Necklace Set with Matching Earrings (Short/Long)\n\nHandcrafted with care for festive celebrations, Garba nights, and daily statement looks."
            },
            {
                name: "Handwoven Silk Saree with Zari",
                slug: "handwoven-silk-saree-zari",
                price: 8999,
                discount: 25,
                discountPrice: 6749,
                category: ethnicCat?._id,
                image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80",
                images: [
                    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80",
                    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80"
                ],
                stock: 30,
                rating: 4.8,
                ratingsCount: 46,
                description: "Luxurious pure silk handwoven saree with royal gold zari embroidery, suitable for festive and wedding celebrations.",
                isTrending: true,
                isFeatured: true,
                isNewArrival: true,
                sizes: ["Free Size"],
                colors: ["Crimson Red", "Royal Navy", "Emerald Green"]
            },
            {
                name: "Embroidered Royal Anarkali Suit",
                slug: "embroidered-royal-anarkali-suit",
                price: 5499,
                discount: 20,
                discountPrice: 4399,
                category: ethnicCat?._id,
                image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80",
                images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80"],
                stock: 25,
                rating: 4.7,
                ratingsCount: 29,
                description: "Handcrafted chanderi silk Anarkali with delicate gota patti borders and matching organza dupatta.",
                isTrending: true,
                isFeatured: true,
                isNewArrival: true,
                sizes: ["S", "M", "L", "XL", "XXL"],
                colors: ["Maroon", "Blush Pink", "Mustard Yellow"]
            },
            {
                name: "Pure Chanderi Cotton Kurta Set",
                slug: "pure-chanderi-cotton-kurta-set",
                price: 2999,
                discount: 15,
                discountPrice: 2549,
                category: ethnicCat?._id,
                image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
                images: ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80"],
                stock: 45,
                rating: 4.6,
                ratingsCount: 52,
                description: "Breathable pure chanderi cotton straight kurta paired with matching palazzo and handblock printed dupatta.",
                isTrending: false,
                isBestseller: true,
                sizes: ["S", "M", "L", "XL"],
                colors: ["Ivory", "Teal", "Pastel Peach"]
            },
            {
                name: "Tailored Linen Blazer Dress",
                slug: "tailored-linen-blazer-dress",
                price: 4299,
                discount: 20,
                discountPrice: 3439,
                category: westernCat?._id,
                image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
                images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80"],
                stock: 20,
                rating: 4.9,
                ratingsCount: 38,
                description: "Chic double-breasted linen blazer dress crafted for power workdays and sophisticated evening dinners.",
                isTrending: true,
                isFeatured: true,
                isNewArrival: true,
                sizes: ["XS", "S", "M", "L"],
                colors: ["Classic Black", "Oatmeal Beige"]
            },
            {
                name: "Modern Floral Georgette Maxi Dress",
                slug: "modern-floral-georgette-maxi-dress",
                price: 3199,
                discount: 10,
                discountPrice: 2879,
                category: westernCat?._id,
                image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
                images: ["https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80"],
                stock: 35,
                rating: 4.5,
                ratingsCount: 19,
                description: "Flowing georgette maxi dress featuring subtle pastel floral blooms and a comfortable cinched waist.",
                isTrending: false,
                isNewArrival: true,
                sizes: ["S", "M", "L", "XL"],
                colors: ["Sage Green", "Lavender Dream"]
            },
            {
                name: "Antique Gold Statement Jhumkas",
                slug: "antique-gold-statement-jhumkas",
                price: 1599,
                discount: 20,
                discountPrice: 1279,
                category: accessCat?._id,
                image: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=800&q=80",
                images: ["https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=800&q=80"],
                stock: 60,
                rating: 4.9,
                ratingsCount: 88,
                description: "Handcrafted traditional temple jewellery jhumkas with pearl drops and antique matte gold polish.",
                isTrending: true,
                isBestseller: true,
                sizes: ["One Size"],
                colors: ["Antique Gold"]
            },
            {
                name: "Pure Silver Oxidized Tribal Choker",
                slug: "pure-silver-oxidized-tribal-choker",
                price: 2499,
                discount: 15,
                discountPrice: 2124,
                category: accessCat?._id,
                image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
                images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80"],
                stock: 40,
                rating: 4.7,
                ratingsCount: 34,
                description: "Authentic 925 sterling silver plated oxidized tribal choker necklace with intricate Rajasthani filigree work.",
                isTrending: false,
                isFeatured: true,
                sizes: ["Adjustable"],
                colors: ["Oxidized Silver"]
            },
            {
                name: "Embroidered Velvet Festive Potli Bag",
                slug: "embroidered-velvet-festive-potli-bag",
                price: 1899,
                discount: 25,
                discountPrice: 1424,
                category: accessCat?._id,
                image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
                images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80"],
                stock: 50,
                rating: 4.8,
                ratingsCount: 41,
                description: "Rich velvet drawstring potli handbag adorned with pearl tassels and zari thread work.",
                isTrending: true,
                isBestseller: true,
                sizes: ["Standard"],
                colors: ["Royal Wine", "Emerald Green", "Golden Cream"]
            }
        ];

        for (const item of catalogProducts) {
            const existing = await ProductSchema.findOne({ slug: item.slug });
            if (!existing) {
                await ProductSchema.create(item);
                console.log(`Product created: ${item.name}`);
            } else {
                await ProductSchema.updateOne({ _id: existing._id }, { $set: item });
            }
        }
        console.log("Seeded catalog products complete!");

        const couponCode = "WELCOME10";
        const couponExists = await CouponSchema.findOne({ code: couponCode });
        if (!couponExists) {
            await CouponSchema.create({
                code: couponCode,
                discountType: "percentage",
                discountValue: 10,
                minOrderAmount: 999,
                maxDiscount: 500,
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                usageLimit: 1000,
                usedCount: 0,
                isActive: true
            });
            console.log(`Coupon created: ${couponCode}`);
        }

        console.log("Seed completed successfully");
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error);
        process.exit(1);
    }
};

seed();
