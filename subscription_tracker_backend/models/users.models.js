import {mongoose} from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],   
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }});

const User = mongoose.model("User", userSchema);

export default User;