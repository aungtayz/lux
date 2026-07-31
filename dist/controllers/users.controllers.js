import User from "../models/user.models.js";
export const getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select("-password").limit(10);
        res.status(200).json(users);
    }
    catch (err) {
        next(err);
    }
};
export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (err) {
        next(err);
    }
};
export const getProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new Error("Unauthorized");
        }
        const user = await User.findOne({ email: req.user.email }).select("-password");
        console.log("User found: ", user);
        if (!user) {
            console.log("User not found with emial: ", req.user.email);
            throw new Error("User not found");
        }
        res.status(200).json({ success: true, data: { user } });
    }
    catch (err) {
        next(err);
    }
};
export const updateProfile = async (req, res, next) => {
    try {
        const { name, email } = req.body;
        if (!req.user) {
            throw new Error("Unauthorized");
        }
        const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true }).select("-password");
        res.status(200).json({ success: true, data: { user } });
    }
    catch (err) {
        next(err);
    }
};
