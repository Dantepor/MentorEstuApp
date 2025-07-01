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

        // Buscar si el usuario ya existe en la base de datos
        db.query('SELECT * FROM usuarios WHERE correo = ?', [email], (err, results) => {
            if (err) return done(err);

            if (results.length === 0) {
                // Si no existe, lo registramos con rol_id = 4 (nuevo usuario)
                db.query(
                    'INSERT INTO usuarios (nombre_completo, correo, rol_id, fecha_registro) VALUES (?, ?, ?, ?)',
                    [profile.displayName, email, 4, new Date()],
                    (err, result) => {
                        if (err) return done(err);
                        return done(null, {
                            id: result.insertId,
                            correo: email,
                            rol_id: 4 // Importante: para saber dónde redirigir
                        });
                    }
                );
            } else {
                return done(null, results[0]); // Ya existe: pasamos el usuario completo con rol incluido
            }
        });
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    db.query('SELECT * FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) return done(err);
        done(null, results[0]);
    });
});