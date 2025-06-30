const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Ruta para obtener los mentores con rol_id = 2 y su especialidad
router.get('/mentores', (req, res) => {
    const query = `
        SELECT u.id, u.nombre_completo AS nombre, u.imagen, e.nombre AS especialidad
        FROM usuarios u
        JOIN mentor_especialidad me ON u.id = me.mentor_id
        JOIN especialidades e ON me.especialidad_id = e.id
        WHERE u.rol_id = 1
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener mentores:', err);
            return res.status(500).json({ error: 'Error al obtener mentores' });
        }

        res.json(results);
    });
});




router.get('/especialidades', (req, res) => {
    const query = 'SELECT id, nombre, imagen_espe FROM especialidades';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener especialidades:', err);
            return res.status(500).json({ error: 'Error al obtener especialidades' });
        }
        res.json(results);
    });
});





// Ruta para obtener el ranking de los 3 mejores mentores
router.get('/ranking', (req, res) => {
    const query = `
        SELECT 
            u.id,
            u.nombre_completo AS nombre,
            u.imagen,
            ROUND(AVG(f.calificacion), 1) AS promedio
        FROM 
            usuarios u
        JOIN 
            sesiones s ON s.mentor_id = u.id
        JOIN 
            feedback f ON f.sesion_id = s.id
        WHERE 
            u.rol_id = 1
        GROUP BY 
            u.id
        ORDER BY 
            promedio DESC
        LIMIT 3
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener ranking de mentores:', err);
            return res.status(500).json({ error: 'Error al obtener ranking' });
        }

        res.json(results);
    });
});



// Ruta para obtener nombre y especialidad del mentor logueado
router.get('/mentor-especialidad/:mentorId', (req, res) => {
    const mentorId = req.params.mentorId;

    const query = `
        SELECT 
            me.mentor_id,
            e.id AS especialidad_id,
            e.nombre AS especialidad
        FROM mentor_especialidad me
        INNER JOIN especialidades e ON me.especialidad_id = e.id
        WHERE me.mentor_id = ?
        LIMIT 1
    `;

    db.query(query, [mentorId], (err, results) => {
        if (err) {
            console.error('Error al obtener especialidad del mentor:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'Especialidad no encontrada' });
        }

        res.json(results[0]);
    });
});




// Obtener días
router.get('/dias', (req, res) => {
    db.query('SELECT * FROM dias', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener días' });
        res.json(results);
    });
});

// Obtener horarios
router.get('/horarios', (req, res) => {
    db.query('SELECT * FROM horarios', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener horarios' });
        res.json(results);
    });
});

// Guardar disponibilidad
router.post('/agendar', (req, res) => {
    const { mentor_id, especialidad_id, dia_id, horario_id } = req.body;

    const query = `
        INSERT INTO disponibilidad_mentor (mentor_id, especialidad_id, dia_id, horario_id)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [mentor_id, especialidad_id, dia_id, horario_id], (err) => {
        if (err) {
            console.error('Error al insertar disponibilidad:', err);
            return res.status(500).json({ error: 'Error al guardar disponibilidad' });
        }
        res.json({ message: 'Disponibilidad registrada correctamente' });
    });
});






router.get("/solicitudes-mentor", (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const query = `
        SELECT 
            s.id, 
            s.mentor_id, 
            s.aprendiz_id, 
            u.nombre_completo AS aprendiz_nombre,
            s.fecha, 
            s.hora_inicio, 
            s.hora_final, 
            s.estado 
        FROM sesiones s
        JOIN usuarios u ON s.aprendiz_id = u.id
        WHERE s.mentor_id = ?
        ORDER BY s.fecha, s.hora_inicio
    `;

    db.query(query, [userId], (err, rows) => {
        if (err) {
            console.error("Error al obtener clases del mentor:", err);
            return res.status(500).json({ error: "Error al obtener solicitudes de clases" });
        }

        const clases = rows.map(row => {
            const fecha = row.fecha.toISOString().split("T")[0]; // yyyy-mm-dd
            const horaInicio = row.hora_inicio?.substring(0, 5); // HH:MM
            const horaFinal = row.hora_final?.substring(0, 5);   // HH:MM

            // Construir timestamps en milisegundos
            const timestamp_inicio = Date.parse(`${fecha}T${horaInicio}:00`);
            const timestamp_final = Date.parse(`${fecha}T${horaFinal}:00`);

            return {
                ...row,
                fecha: `${fecha}T${horaInicio}`, // también puedes dejar solo la fecha si prefieres
                hora_inicio: horaInicio,
                hora_final: horaFinal,
                timestamp_inicio: timestamp_inicio,
                timestamp_final: timestamp_final,
            };
        });

        res.json(clases);
    });
});



// routes/mentor.js
router.put('/solicitudes-mentor/:id', (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar que el estado sea uno de los valores permitidos
    if (!['confirmada', 'rechazada'].includes(estado)) {
        return res.status(400).json({ error: 'Estado no válido' });
    }

    const query = 'UPDATE sesiones SET estado = ? WHERE id = ?';
    db.query(query, [estado, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar estado de la clase:', err);
            return res.status(500).json({ error: 'Error al actualizar estado' });
        }
        res.json({ message: `Estado ${estado} actualizado correctamente` });
    });
});



// Ruta para obtener las sesiones del calendario del mentor autenticado
router.get('/mis-sesiones-calendario', (req, res) => {
    const mentorId = req.session.userId;

    if (!mentorId) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    const query = `
        SELECT 
            sesiones.id,
            sesiones.fecha,
            sesiones.hora_inicio,
            sesiones.hora_final,
            sesiones.estado,
            usuarios.nombre_completo AS aprendiz_nombre
        FROM sesiones
        JOIN usuarios ON sesiones.aprendiz_id = usuarios.id
        WHERE sesiones.mentor_id = ?
        ORDER BY sesiones.fecha ASC, sesiones.hora_inicio ASC
    `;

    db.query(query, [mentorId], (err, results) => {
        if (err) {
            console.error('Error al obtener sesiones del calendario:', err);
            return res.status(500).json({ error: 'Error al obtener sesiones' });
        }

        const sesiones = results.map(row => ({
            id: row.id,
            fecha: row.fecha,
            hora_inicio: row.hora_inicio,
            hora_final: row.hora_final,
            estado: row.estado,
            titulo: row.aprendiz_nombre || 'Clase'
        }));

        res.json(sesiones);
    });
});




router.post('/enviarsolicitud', (req, res) => {
    const { usuario_id, motivo, pedido } = req.body;

    if (!usuario_id || !motivo || !pedido) {
        return res.status(400).send('Todos los campos son requeridos');
    }

    const sql = `INSERT INTO solicitudes (usuario_id, motivo, pedido, resultado) VALUES (?, ?, ?, 'esperando')`;
    db.query(sql, [usuario_id, motivo, pedido], (err, result) => {
        if (err) {
            console.error('Error al guardar solicitud:', err);
            return res.status(500).send('Error al guardar solicitud');
        }

        res.sendStatus(200);
    });
});



// Obtener solicitudes por usuario
router.get('/solicitudes/:usuario_id', (req, res) => {
    const { usuario_id } = req.params;

    db.query(
        'SELECT id, motivo, pedido, resultado FROM solicitudes WHERE usuario_id = ? ORDER BY id DESC',
        [usuario_id],
        (err, results) => {
            if (err) {
                console.error('Error al obtener solicitudes:', err);
                return res.status(500).send('Error al obtener solicitudes');
            }

            res.json(results);
        }
    );
});






module.exports = router;
