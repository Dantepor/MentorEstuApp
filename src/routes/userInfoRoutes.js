const express = require('express');
const router = express.Router();
const db = require('../models/db');
const multer = require('multer');
const path = require('path');

// Configuración de multer para subir imágenes al directorio /public/img
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/img');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext); // Nombre único para evitar conflictos
    }
});
const upload = multer({ storage });

// Ruta para obtener datos del usuario basado en sesión
router.get('/user', (req, res) => {
    const userId = req.session?.userId;

    if (!userId) {
        return res.status(401).json({ error: 'No hay sesión iniciada' });
    }

    const query = `
        SELECT u.id, u.nombre_completo, u.correo, u.rol_id, r.nombre AS rol_nombre, 
        u.fecha_registro, u.imagen
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        WHERE u.id = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener datos del usuario:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(results[0]);
    });
});


router.post('/editar-perfil', upload.single('imagen'), (req, res) => {
    const userId = req.session.userId;
    const { nombre_completo, correo } = req.body;
    const nuevaImagen = req.file ? req.file.filename : null;

    if (!userId) return res.status(401).json({ success: false, error: 'No autorizado' });

    let query = 'UPDATE usuarios SET nombre_completo = ?, correo = ?';
    const values = [nombre_completo, correo];

    if (nuevaImagen) {
        query += ', imagen = ?';
        values.push(nuevaImagen);
    }

    query += ' WHERE id = ?';
    values.push(userId);

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al actualizar perfil:', err);
            return res.status(500).json({ success: false, error: 'Error del servidor' });
        }
        res.json({ success: true });
    });
});


// Agregar especialidad al mentor logueado
router.post('/agregar-especialidad', (req, res) => {
    const mentorId = req.session.userId;
    const { especialidad_id } = req.body;

    if (!mentorId || !especialidad_id) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    const query = 'INSERT INTO mentor_especialidad (mentor_id, especialidad_id) VALUES (?, ?)';

    db.query(query, [mentorId, especialidad_id], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, message: 'Especialidad ya asignada' });
            }
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error al agregar especialidad' });
        }

        res.json({ success: true });
    });
});



router.delete('/eliminar-especialidad/:especialidadId', (req, res) => {
    const mentorId = req.session.userId;
    const especialidadId = req.params.especialidadId;

    const query = 'DELETE FROM mentor_especialidad WHERE mentor_id = ? AND especialidad_id = ?';

    db.query(query, [mentorId, especialidadId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error al eliminar especialidad' });
        }

        res.json({ success: true });
    });
});


// Obtener especialidades asignadas al mentor logueado
router.get('/mentor-especialidades', (req, res) => {
    const mentorId = req.session.userId;

    if (!mentorId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const query = `
        SELECT e.id, e.nombre 
        FROM mentor_especialidad me
        JOIN especialidades e ON me.especialidad_id = e.id
        WHERE me.mentor_id = ?
    `;

    db.query(query, [mentorId], (err, results) => {
        if (err) {
            console.error('Error al obtener especialidades del mentor:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        res.json(results);
    });
});


// GET: Nombre e imagen del mentor por ID de sesión
router.get("/nombre-mentor", (req, res) => {
    const sesionId = req.query.idSesion;

    if (!sesionId) {
        return res.status(400).json({ error: "ID de sesión requerido" });
    }

    const query = `
        SELECT u.nombre_completo, u.imagen
        FROM sesiones s
        JOIN usuarios u ON s.mentor_id = u.id
        WHERE s.id = ?
    `;

    db.query(query, [sesionId], (err, results) => {
        if (err) {
            console.error("Error al obtener el nombre del mentor:", err);
            return res.status(500).json({ error: "Error al consultar datos" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Sesión no encontrada" });
        }

        const mentor = results[0];
        const imageUrl = mentor.imagen ? `/img/${mentor.imagen}` : null;

        res.json({
            nombre: mentor.nombre_completo,
            imagen: imageUrl
        });
    });
});







// GET: Nombre e imagen del aprendiz por ID de sesión
router.get("/nombre-aprendiz", (req, res) => {
    const sesionId = req.query.idSesion;

    if (!sesionId) {
        return res.status(400).json({ error: "ID de sesión requerido" });
    }

    const query = `
        SELECT u.nombre_completo, u.imagen
        FROM sesiones s
        JOIN usuarios u ON s.aprendiz_id = u.id
        WHERE s.id = ?
    `;

    db.query(query, [sesionId], (err, results) => {
        if (err) {
            console.error("Error al obtener el nombre del aprendiz:", err);
            return res.status(500).json({ error: "Error al consultar datos" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Sesión no encontrada" });
        }

        const aprendiz = results[0];
        const imageUrl = aprendiz.imagen ? `/img/${aprendiz.imagen}` : null;

        res.json({
            nombre: aprendiz.nombre_completo,
            imagen: imageUrl
        });
    });
});



module.exports = router;
