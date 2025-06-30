const bcrypt = require('bcryptjs');
const db = require('../models/db');

const AuthService = {
    registerUser: async (nombre_completo, correo, password, rol_id = 4) => {
        return new Promise(async (resolve, reject) => {
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                const fecha = new Date();
                const imagenNombre = '';

                db.query(
                    'INSERT INTO usuarios (nombre_completo, correo, contraseña, rol_id, fecha_registro, imagen) VALUES (?, ?, ?, ?, ?, ?)',
                    [nombre_completo, correo, hashedPassword, rol_id, fecha, imagenNombre],
                    (err, result) => {
                        if (err) return reject(err);
                        resolve();
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    },

    loginUser: async (email, password) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM usuarios WHERE correo = ?', [email], async (err, results) => {
                if (err) return reject(err);
                if (results.length === 0) return resolve(null);

                const user = results[0];
                const isMatch = await bcrypt.compare(password, user.contraseña);

                if (isMatch) {
                    resolve(user);
                } else {
                    resolve(null);
                }
            });
        });
    },

    actualizarRol: async (userId, rol_id) => {
        return new Promise((resolve, reject) => {
            db.query('UPDATE usuarios SET rol_id = ? WHERE id = ?', [rol_id, userId], (err, result) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
};

module.exports = AuthService;