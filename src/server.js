
import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();



const PORT = process.env.PORT || 8000;
console.log("MONGO_URI:", process.env.MONGO_URI);

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`server is runing on port ${PORT}`)
    })
})



