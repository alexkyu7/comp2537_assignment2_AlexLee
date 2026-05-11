const express = require("express");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const User = require("../models/User");

const saltRounds = 12;

const router = express.Router();

router.get("/", (req, res) => {
    res.render("home", {
        title: "Home",
        currentPage: "home",
        cssFiles: ["home.css"],
        user: req.session.user || null
    });
});

router.get("/login", (req, res) => {
    if (req.session.user) {
        return res.redirect("/members");
    }

    res.render("login", {
        title: "Login",
        currentPage: "login",
        cssFiles: ["login.css"],
        error: null
    });
});



router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });

    if (schema.validate({ email, password }).error) {
        return res.render("login", {
            title: "Login",
            currentPage: "login",
            cssFiles: ["login.css"],
            error: "Invalid input"
        });
    }

    const user = await User.findOne({ email });

    if (!user) return res.render("login", {
        title: "Login",
        currentPage: "login",
        cssFiles: ["login.css"],
        error: "User not found"
    });

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.render("login", {
        title: "Login",
        currentPage: "login",
        cssFiles: ["login.css"],
        error: "Wrong password"
    });

    req.session.authenticated = true;

    req.session.user = {
        _id: user._id,
        username: user.username,
        email: user.email,
        user_type: user.user_type
    };

    res.redirect("/members");
});

router.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

router.get("/signup", (req, res) => {
    if (req.session.user) {
        return res.redirect("/members");
    }
    res.render("signup", {
        title: "Sign Up",
        currentPage: "signup",
        cssFiles: ["signup.css"]
    });
});

router.post('/submitUser', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username) {
        return res.status(400).render("message", {
            title: "Error",
            message: "Please provide a username.",
            link: "/signup",
            buttonText: "Back to Sign Up",
            currentPage: "",
            cssFiles: []
        });
    }

    if (!email) {
        return res.status(400).render("message", {
            title: "Error",
            currentPage: "signup",
            message: "Please provide an email address.",
            link: "/signup",
            buttonText: "Back to Sign Up",
            cssFiles: []
        });
    }

    if (!password) {
        return res.status(400).render("message", {
            title: "Error",
            message: "Please provide a password.",
            link: "/signup",
            buttonText: "Back to Sign Up",
            cssFiles: []
        });
    }

    const schema = Joi.object({
        username: Joi.string().alphanum().max(20).required(),
        email: Joi.string().email().required(),
        password: Joi.string().max(20).required()
    });

    const validationResult = schema.validate({ username, email, password });

    if (validationResult.error) {
        return res.status(400).render("message", {
            title: "Error",
            message: "Invalid input format.",
            link: "/signup",
            buttonText: "Back to Sign Up",
            currentPage: "signup",
            cssFiles: ["signup.css"]
        });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(409).render("message", {
            title: "Error",
            message: "Email already registered.",
            link: "/signup",
            buttonText: "Back",
            currentPage: "signup",
            cssFiles: ["signup.css"]
        });
    }

    await User.create({
        username,
        email,
        password: hashedPassword
    });

    console.log("Inserted user");

    return res.render("message", {
        title: "Success",
        message: "Successfully created user",
        link: "/login",
        buttonText: "Log In"
    });
});

router.get("/members", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    res.render("members", {
        user: req.session.user,
        title: "Members Area",
        currentPage: "members",
        cssFiles: ["members.css"]
    });
});

router.get("/admin", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.user_type !== "admin") {
        return res.status(403).render("errorMessage", {
            title: "Access Denied",
            error: "Not Authorized",
            currentPage: "error",
            cssFiles: ["error.css"]
        });
    }

    const users = await User.find({});

    res.render("admin", {
        users,
        user: req.session.user,
        title: "Admin",
        currentPage: "admin",
        cssFiles: ["admin.css"]
    });
});

router.get("/admin/promote/:id", async (req, res) => {
    if (!req.session.user || req.session.user.user_type !== "admin") {
        return res.status(403).send("Not authorized");
    }

    await User.updateOne(
        { _id: req.params.id },
        { $set: { user_type: "admin" } }
    );

    res.redirect("/admin");
});

router.get("/admin/demote/:id", async (req, res) => {
    if (!req.session.user || req.session.user.user_type !== "admin") {
        return res.status(403).send("Not authorized");
    }

    await User.updateOne(
        { _id: req.params.id },
        { $set: { user_type: "user" } }
    );

    res.redirect("/admin");
});

module.exports = router;