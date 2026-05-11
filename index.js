require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

const app = express();

connectDB(process.env.MONGODB_URI);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.NODE_SESSION_SECRET,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
    resave: false,
    saveUninitialized: false
}));

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use("/", authRoutes);

app.listen(3000, () => {
    console.log("Server running");
});