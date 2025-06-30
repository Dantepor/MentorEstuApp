const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Ruta para obtener el top 3 mentores por calificación promedio
router.get('/rankings', (req, res) => {
    console.log('Solicitando ranking...');
    const query = `
        SELECT 
            u.id,
            u.nombre_completo AS nombre,
            u.imagen,
            IFNULL(GROUP_CONCAT(DISTINCT e.nombre SEPARATOR ', '), '') AS especialidades,
            ROUND(AVG(f.calificacion), 1) AS promedio
        FROM usuarios u
        JOIN sesiones s ON s.mentor_id = u.id
        JOIN feedback f ON f.sesion_id = s.id
        LEFT JOIN mentor_especialidad me ON me.mentor_id = u.id
        LEFT JOIN especialidades e ON e.id = me.especialidad_id
        WHERE u.rol_id = 1
        GROUP BY u.id
        ORDER BY promedio DESC
        LIMIT 3;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener ranking de mentores:', err);
            return res.status(500).json({ error: 'Error al obtener ranking' });
        }

        console.log('Resultados del ranking:', results);
        res.json(results);
    });
});


// Ruta para obtener TODOS los mentores con sesiones y sus promedios
router.get('/rankingcompleto', (req, res) => {
    console.log('Solicitando ranking completo...');
    const query = `
        SELECT 
            u.id,
            u.nombre_completo AS nombre,
            u.imagen,
            IFNULL(GROUP_CONCAT(DISTINCT e.nombre SEPARATOR ', '), '') AS especialidades,
            ROUND(AVG(f.calificacion), 1) AS promedio
        FROM usuarios u
        JOIN sesiones s ON s.mentor_id = u.id
        JOIN feedback f ON f.sesion_id = s.id
        LEFT JOIN mentor_especialidad me ON me.mentor_id = u.id
        LEFT JOIN especialidades e ON e.id = me.especialidad_id
        WHERE u.rol_id = 1
        GROUP BY u.id
        ORDER BY promedio DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener ranking completo:', err);
            return res.status(500).json({ error: 'Error al obtener ranking completo' });
        }

        console.log('Ranking completo:', results);
        res.json(results);
    });
});




module.exports = router;