const adminvalid = function(req, res, next) {
    if (req.user.role !== "admin")
        return res.status(401).json({
            "message": 'Not Authorised to access this endpoint'
        });
    next();
}


const userValid = function(req, res, next) {
    if (req.user.role !== "user")
        return res.status(401).json({
            "message": 'Not Authorised to access this endpoint'
        });
    next();
}


module.exports = {
    validate,
    adminvalid,
    userValid
};