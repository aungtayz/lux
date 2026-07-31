import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        maxlength: [20, "Name must be less than 20 characters"],
        minlength: [3, "Name must be at least 3 characters"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        match: [/\S+@\S+\.\S+/, "Email is invalid"],
    }
});
const User = mongoose.model('User', userSchema, 'users');
export default User;
