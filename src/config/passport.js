require('dotenv').config(); // <-- Esto es fundamental para leer .env
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../models/db');


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://mentorestuapp.onrender.com/auth/google/callback"
},
    function (accessToken, refreshToken, profile, done) {
        const email = profile.emails[0].value;

        // Asegúrate de usar el nombre correcto de la columna: "correo" en vez de "email"
        db.query('SELECT * FROM usuarios WHERE correo = ?', [email], (err, results) => {
            if (err) return done(err);

            if (results.length === 0) {
                db.query(
                    'INSERT INTO usuarios (nombre_completo, correo, rol_id, fecha_registro) VALUES (?, ?, ?, ?)',
                    [profile.displayName, email, 1, new Date()],
                    (err, result) => {
                        if (err) return done(err);
                        return done(null, { id: result.insertId, correo: email });
                    }
                );
            } else {
                return done(null, results[0]);
            }
        });
    }));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
    db.query('SELECT * FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) return done(err);
        done(null, results[0]);
    });
});