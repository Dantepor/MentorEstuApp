const express = require("express");
const router = express.Router();
const db = require("../models/db");

// Crear sesión
router.post("/sesiones", (req, res) => {
    const { mentor_id, aprendiz_id, fecha, hora_inicio, hora_final } = req.body;

    const query = `
        INSERT INTO sesiones (mentor_id, aprendiz_id, fecha, hora_inicio, hora_final, estado)
        VALUES (?, ?, ?, ?, ?, 'pendiente')
    `;

    db.query(query, [mentor_id, aprendiz_id, fecha, hora_inicio, hora_final], (err, result) => {
        if (err) {
            console.error("Error al guardar sesión:", err);
            return res.status(500).json({ error: "Error en el servidor" });
        }
        res.json({ message: "Sesión creada", id: result.insertId });
    });
});




router.get("/api/horarios", (req, res) => {
    db.query('SELECT id, hora_inicio, hora_fin FROM horarios', (err, rows) => {
        if (err) {
            console.error("Error al obtener horarios:", err);
            return res.status(500).json({ error: "Error en el servidor" });
        }
        res.json(rows);
    });
});








// Obtener todas las sesiones
router.get("/sesiones", (req, res) => {
    const query = `
        SELECT id, mentor_id, aprendiz_id, dia, mes, hora, estado 
        FROM sesiones
    `;

    db.query(query, (err, rows) => {
        if (err) {
            console.error("Error al obtener sesiones:", err);
            return res.status(500).json({ error: "Error al obtener sesiones" });
        }

        const sesionesConFecha = rows.map((row) => {
            const diaStr = String(row.dia).padStart(2, "0");
            const mesStr = String(row.mes).padStart(2, "0");
            const fechaCompleta = `2025-${mesStr}-${diaStr}T${row.hora}`;

            return {
                ...row,
                fecha: fechaCompleta,
                titulo: `Sesión con mentor ${row.mentor_id}`,
            };
        });

        res.json(sesionesConFecha);
    });
});


// Obtener solo las sesiones del aprendiz autenticado con nombre del mentor
router.get("/mis-clases", (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const query = `
        SELECT 
            s.id, s.mentor_id, s.aprendiz_id, s.fecha, s.hora_inicio, s.hora_final, s.estado,
            u.nombre_completo AS mentor_nombre
        FROM sesiones s
        JOIN usuarios u ON s.mentor_id = u.id
        WHERE s.aprendiz_id = ?
    `;

    db.query(query, [userId], (err, rows) => {
        if (err) {
            console.error("Error al obtener clases del usuario:", err);
            return res.status(500).json({ error: "Error al obtener clases" });
        }

        const sesionesConFormato = rows.map(row => {
            const fechaStr = row.fecha.toISOString().split('T')[0]; // YYYY-MM-DD
            const fechaInicio = `${fechaStr}T${row.hora_inicio}`;
            const fechaFin = `${fechaStr}T${row.hora_final}`;

            return {
                ...row,
                titulo: `Sesión con mentor ${row.mentor_nombre}`,
                timestamp_inicio: new Date(fechaInicio).getTime(),
                timestamp_final: new Date(fechaFin).getTime()
            };
        });

        res.json(sesionesConFormato);
    });
});




// 🔥 NUEVA RUTA: Obtener disponibilidad de un mentor
router.get("/disponibilidad-mentor/:mentorId", (req, res) => {
    const mentorId = req.params.mentorId;

    const query = `
        SELECT d.nombre_dia, h.hora_inicio, h.hora_fin
        FROM disponibilidad_mentor dm
        JOIN dias d ON dm.dia_id = d.id
        JOIN horarios h ON dm.horario_id = h.id
        WHERE dm.mentor_id = ?
    `;

    db.query(query, [mentorId], (err, results) => {
        if (err) {
            console.error("Error al obtener disponibilidad:", err);
            return res.status(500).json({ error: "Error en el servidor" });
        }

        res.json(results);
    });
});

// 🔥 NUEVA RUTA: Obtener info del mentor por ID (incluye imagen)
router.get("/mentor/:id", (req, res) => {
    const id = req.params.id;

    const query = `SELECT nombre_completo, imagen FROM usuarios WHERE id = ?`;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error("Error al obtener mentor:", err);
            return res.status(500).json({ error: "Error en el servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Mentor no encontrado" });
        }

        res.json(results[0]);
    });
});




// routes de calificación
router.get('/detalle-sesion', (req, res) => {
    const { id } = req.query;

    const sql = `
        SELECT s.id, u.nombre_completo AS mentor
        FROM sesiones s
        JOIN usuarios u ON u.id = s.mentor_id
        WHERE s.id = ?
    `;

    db.query(sql, [id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error al obtener la sesión");
        }

        if (rows.length === 0) {
            return res.status(404).send("Sesión no encontrada");
        }

        res.json({ mentor: rows[0].mentor });
    });
});



// routes/student.js
router.post('/feedback', (req, res) => {
    const { sesion_id, calificacion, comentario } = req.body;

    const insertFeedback = `
        INSERT INTO feedback (sesion_id, calificacion, comentario, fecha)
        VALUES (?, ?, ?, NOW())
    `;

    db.query(insertFeedback, [sesion_id, calificacion, comentario], (err, result) => {
        if (err) {
            console.error("Error al guardar feedback:", err);
            return res.status(500).send("Error al guardar feedback");
        }

        const updateEstado = `
            UPDATE sesiones SET estado = 'completada' WHERE id = ?
        `;

        db.query(updateEstado, [sesion_id], (err2, result2) => {
            if (err2) {
                console.error("Error al actualizar sesión:", err2);
                return res.status(500).send("Error al actualizar estado");
            }

            res.sendStatus(200);
        });
    });
});

// Obtener todas las novedades
router.get('/novedades', (req, res) => {
    db.query('SELECT * FROM novedades', (err, results) => {
        if (err) return res.status(500).send('Error al obtener novedades');
        res.json(results);
    });
});


router.get('/publicidad', (req, res) => {
    db.query('SELECT * FROM publicidad', (err, results) => {
        if (err) return res.status(500).send('Error al obtener publicidad');
        res.json(results);
    });
});


module.exports = router;