const express = require('express');
const passport = require('passport');
const router = express.Router();

// Ruta para iniciar autenticación con Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback de Google
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        req.session.userId = req.user.id;

        // Redirigir según rol
        if (req.user.rol_id === 1) {
            res.redirect('/inicio2.html');
        } else if (req.user.rol_id === 2) {
            res.redirect('/inicio.html');
        } else {
            res.status(403).send('Rol no reconocido');
        }
    }
);

module.exports = router;