require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function promoteAdmin() {
    await mongoose.connect(process.env.MONGODB_URI);

    await User.updateOne(
        { email: "admin@email.com" },
        { $set: { user_type: "admin" } }
    );

    console.log("User promoted to admin");

    mongoose.connection.close();
}

promoteAdmin();