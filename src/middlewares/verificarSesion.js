// middlewares/verificarSesion.js
module.exports = function verificarSesion(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.redirect('/login.html');
    }
};