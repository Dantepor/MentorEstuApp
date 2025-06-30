const express = require('express');
const router = express.Router();
const db = require('../models/db');
// Ojo: Ajusta las consultas según tu base y esquema

// Middleware para chequear sesión o usuario logueado (ejemplo)
function checkAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'No autorizado' });
  }
}



// GET /api/user - datos del usuario logueado
router.get('/user', checkAuth, (req, res) => {
  const userId = req.session.userId;
  const sql = 'SELECT id, nombre_completo, correo, rol_id, fecha_registro, imagen FROM usuarios WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error DB' });
    if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(results[0]);
  });
});


// GET /api/mentor-especialidades/:id - todas las especialidades del mentor// GET /api/mentor-especialidades/:id
router.get('/mentor-especialidades/:id', checkAuth, (req, res) => {
  const mentorId = req.params.id;
  const sql = `
    SELECT e.id AS especialidad_id, e.nombre AS especialidad
    FROM mentor_especialidad me
    JOIN especialidades e ON me.especialidad_id = e.id
    WHERE me.mentor_id = ?
  `;
  db.query(sql, [mentorId], (err, results) => {
    if (err) {
      console.error('Error DB al obtener especialidades del mentor:', err);
      return res.status(500).json({ error: 'Error DB' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontraron especialidades para este mentor' });
    }
    res.json(results);
  });
});


// GET /api/dias - lista de días
router.get('/dias', (req, res) => {
  const sql = 'SELECT id, nombre FROM dias_semana';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error DB' });
    res.json(results);
  });
});

// GET /api/horarios - lista de horarios
router.get('/horarios', (req, res) => {
  const sql = 'SELECT id, hora_inicio, hora_fin FROM horarios';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error DB' });
    res.json(results);
  });
});

// POST /api/agendar - guardar disponibilidad
router.post('/agendar', checkAuth, (req, res) => {
  const { mentor_id, especialidad_id, dia_id, horario_id } = req.body;
  if (!mentor_id || !especialidad_id || !dia_id || !horario_id) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  const sql = `INSERT INTO disponibilidad (mentor_id, especialidad_id, dia_id, horario_id) VALUES (?, ?, ?, ?)`;
  db.query(sql, [mentor_id, especialidad_id, dia_id, horario_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al guardar disponibilidad' });
    res.json({ message: 'Disponibilidad registrada correctamente' });
  });
});









// Obtener todos los horarios del mentor autenticado
// Obtener todos los horarios del mentor autenticado
router.get('/horarios-mentor', checkAuth, (req, res) => {
  const mentorId = req.session.userId;

  const sql = `
    SELECT dm.id, d.nombre_dia AS dia, h.hora_inicio, h.hora_fin,
           e.nombre AS especialidad,
           dm.dia_id, dm.horario_id
    FROM disponibilidad_mentor dm
    JOIN dias d ON dm.dia_id = d.id
    JOIN horarios h ON dm.horario_id = h.id
    JOIN especialidades e ON dm.especialidad_id = e.id
    WHERE dm.mentor_id = ?
  `;

  db.query(sql, [mentorId], (err, results) => {
    if (err) {
      console.error('Error al obtener horarios:', err);
      return res.status(500).json({ error: 'Error al obtener horarios' });
    }

    const datos = results.map(r => ({
      id: r.id,
      dia: r.dia,
      horario: `${r.hora_inicio} - ${r.hora_fin}`,
      especialidad: r.especialidad,
      dia_id: r.dia_id,
      horario_id: r.horario_id
    }));

    res.json(datos);
  });
});

// Actualizar un horario del mentor
router.put('/horarios-mentor/:id', checkAuth, (req, res) => {
  const horarioId = req.params.id;
  const mentorId = req.session.userId;
  const { especialidad, dia_id, horario_id } = req.body;

  if (!especialidad || !dia_id || !horario_id) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  const sqlEspecialidad = 'SELECT id FROM especialidades WHERE nombre = ?';
  db.query(sqlEspecialidad, [especialidad], (err, results) => {
    if (err) {
      console.error('Error buscando especialidad:', err);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Especialidad no encontrada' });
    }

    const nuevaEspecialidadId = results[0].id;

    const sqlUpdate = `
      UPDATE disponibilidad_mentor
      SET especialidad_id = ?, dia_id = ?, horario_id = ?
      WHERE id = ? AND mentor_id = ?
    `;

    db.query(sqlUpdate, [nuevaEspecialidadId, dia_id, horario_id, horarioId, mentorId], (err, result) => {
      if (err) {
        console.error('Error actualizando horario:', err);
        return res.status(500).json({ error: 'Error actualizando horario' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Horario no encontrado o no autorizado' });
      }

      res.json({ message: 'Horario actualizado correctamente' });
    });
  });
});

// Eliminar un horario del mentor
router.delete('/horarios-mentor/:id', checkAuth, (req, res) => {
  const horarioId = req.params.id;
  const mentorId = req.session.userId;

  const sql = 'DELETE FROM disponibilidad_mentor WHERE id = ? AND mentor_id = ?';
  db.query(sql, [horarioId, mentorId], (err, result) => {
    if (err) {
      console.error('Error al eliminar horario:', err);
      return res.status(500).json({ error: 'Error al eliminar horario' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Horario no encontrado o no autorizado' });
    }

    res.json({ message: 'Horario eliminado correctamente' });
  });
});

// Obtener especialidades asociadas al mentor
router.get('/especialidades-mentor', checkAuth, (req, res) => {
  const mentorId = req.session.userId;

  const sql = `
    SELECT e.id, e.nombre
    FROM mentor_especialidad me
    JOIN especialidades e ON me.especialidad_id = e.id
    WHERE me.mentor_id = ?
  `;

  db.query(sql, [mentorId], (err, results) => {
    if (err) {
      console.error('Error obteniendo especialidades del mentor:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }

    res.json(results);
  });
});

// Cambiar el estado de una sesión (aceptar/rechazar)
router.put('/responder-sesion/:id', checkAuth, (req, res) => {
    const sesionId = req.params.id;
    const { estado } = req.body;

    if (!['confirmada', 'rechazada'].includes(estado)) {
        return res.status(400).json({ error: 'Estado no válido' });
    }

    const query = 'UPDATE sesiones SET estado = ? WHERE id = ?';

    db.query(query, [estado, sesionId], (err, result) => {
        if (err) {
            console.error('Error actualizando sesión:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }

        res.json({ mensaje: 'Estado actualizado correctamente', id: sesionId, estado });
    });
});


module.exports = router;