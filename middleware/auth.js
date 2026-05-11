function isValidSession(req) {
    return !!req.session.user;
}

function isAdmin(req) {
    return req.session.user?.user_type === "admin";
}

function sessionValidation(req, res, next) {
    if (isValidSession(req)) return next();
    res.redirect("/login");
}

function adminAuthorization(req, res, next) {
    if (!isAdmin(req)) {
        return res.status(403).render("errorMessage", {
            title: "Access Denied",
            error: "Not Authorized",
            currentPage: "error",
            cssFiles: ["error.css"]
        });
    }
    next();
}

module.exports = {
    isValidSession,
    isAdmin,
    sessionValidation,
    adminAuthorization
};