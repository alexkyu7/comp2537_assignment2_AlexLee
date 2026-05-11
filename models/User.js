const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    user_type: {
        type: String,
        default: "user"
    }
});

module.exports = mongoose.model("User", userSchema);