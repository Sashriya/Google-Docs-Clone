import express from "express";
import cors from 'cors';
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import jwt from 'jsonwebtoken';
import { OAuth2Client } from "google-auth-library";

import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import User from "./models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("✅ uploads/ created at:", uploadsDir);
}

app.use("/uploads", express.static(uploadsDir));

app.use(cors());
app.use(express.json());

const client = new OAuth2Client("189319772768-3pg8t9sikhl8vipd2nh9meo0e8s3jkgf.apps.googleusercontent.com");

app.post("/api/auth/google-login", async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: "189319772768-3pg8t9sikhl8vipd2nh9meo0e8s3jkgf.apps.googleusercontent.com",
        });
        const { name, email, picture } = ticket.getPayload();

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                name, email,
                profilePic: picture,
                password: Math.random().toString(36).slice(-8),
            });
            await user.save();
        }

        const appToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({
            token: appToken,
            user: { id: user._id, name: user.name, email: user.email, picture: user.profilePic },
        });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(400).json({ message: "Invalid Google Token" });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/docs', documentRoutes);

export default app;