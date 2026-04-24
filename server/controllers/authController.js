import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import generateToken from "../utils/generateToken.js";

export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please enter all fields (Name, Email, Password)" });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User Exists' });

        const hashed = await bcrypt.hash(password, 10);

        let profilePicUrl = "https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png";

        if (req.file) {
            profilePicUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        const user = await User.create({
            name,
            email,
            password: hashed,
            profilePic: profilePicUrl
        });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePic: user.profilePic,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server Error during registration" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid Credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error during login" });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Name cannot be empty" });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name: name.trim() },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Update failed", error: error.message });
    }
};