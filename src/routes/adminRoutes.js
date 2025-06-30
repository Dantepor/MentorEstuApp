const express = require('express');
const router = express.Router();
const db = require('../models/db');
const bcrypt = require('bcrypt');


// --- CONFIGURACIÓN DE MULTER ---
const multer = require('multer');
const path = require('path');

// Configuración del almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/img/'); // carpeta donde se guardará la imagen
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });
// --- FIN CONFIGURACIÓN DE MULTER ---

// Nueva ruta: obtener todos los usuarios (totalusuarios)
router.get('/totalusuarios', (req, res) => {
    const sql = `
        SELECT u.id, u.nombre_completo, u.correo, r.nombre AS rol, u.rol_id, u.fecha_registro, u.imagen
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).send('Error al obtener usuarios');
        }
        res.json(results);
    });
});

// Eliminar usuario por ID
router.delete('/eliminarusuario/:id', (req, res) => {
    const id = req.params.id;

    db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar usuario:', err);
            return res.status(500).send('Error al eliminar usuario');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Usuario no encontrado');
        }

        res.sendStatus(200);
    });
});


// Actualizar usuario
router.put('/editarusuario/:id', upload.fields([{ name: 'imagen' }]), async (req, res) => {
    const id = req.params.id;
    const { nombre_completo, correo, rol_id, password } = req.body;
    const imagen = req.file ? req.file.filename : null;

    try {
        let sql = `
            UPDATE usuarios
            SET nombre_completo = ?, correo = ?, rol_id = ?, imagen = COALESCE(?, imagen)
        `;
        const valores = [nombre_completo, correo, rol_id, imagen];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            sql += `, contraseña = ?`;
            valores.push(hashedPassword);
        }

        sql += ` WHERE id = ?`;
        valores.push(id);

        db.query(sql, valores, (err, result) => {
            if (err) {
                console.error('Error al actualizar usuario:', err);
                return res.status(500).send('Error al actualizar usuario');
            }
            res.sendStatus(200);
        });

    } catch (error) {
        console.error('Error al encriptar contraseña:', error);
        res.status(500).send('Error al procesar contraseña');
    }
});


router.get('/roles', (req, res) => {
    db.query('SELECT id, nombre FROM roles', (err, results) => {
        if (err) {
            console.error('Error al obtener roles:', err);
            return res.status(500).send('Error al obtener roles');
        }
        res.json(results);
    });
});

router.post('/agregarusuario', upload.single('imagen'), async (req, res) => {
    const { nombre_completo, correo, password, rol_id } = req.body;
    const imagen = req.file ? req.file.filename : 'basicperfil.png';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO usuarios (nombre_completo, correo, contraseña, rol_id, imagen)
            VALUES (?, ?, ?, ?, ?)
        `;

        const valores = [nombre_completo, correo, hashedPassword, rol_id, imagen];

        db.query(sql, valores, (err, result) => {
            if (err) {
                console.error('Error al crear usuario:', err);
                return res.status(500).send('Error al crear usuario');
            }
            res.sendStatus(200);
        });
    } catch (error) {
        console.error('Error al encriptar contraseña:', error);
        res.status(500).send('Error en el servidor');
    }
});











// Nueva ruta: obtener todos los usuarios (totalcursos)
// Obtener todas las especialidades (cursos)
router.get('/totalcursos', (req, res) => {
    db.query('SELECT id, nombre, imagen_espe FROM especialidades', (err, results) => {
        if (err) {
            console.error('Error al obtener cursos:', err);
            return res.status(500).send('Error al obtener cursos');
        }
        res.json(results);
    });
});

// Eliminar curso por ID
router.delete('/eliminarcurso/:id', (req, res) => {
    const id = req.params.id;

    db.query('DELETE FROM especialidades WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar curso:', err);
            return res.status(500).send('Error al eliminar curso');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Curso no encontrado');
        }

        res.sendStatus(200);
    });
});

// Editar curso por ID
router.put('/editarcurso/:id', upload.single('imagen'), (req, res) => {
    const id = req.params.id;
    const { nombre } = req.body;
    const imagen_espe = req.file ? req.file.filename : null;

    if (!nombre) return res.status(400).send('Nombre es obligatorio');

    const sql = `
        UPDATE especialidades
        SET nombre = ?, imagen_espe = COALESCE(?, imagen_espe)
        WHERE id = ?
    `;

    db.query(sql, [nombre, imagen_espe, id], (err, result) => {
        if (err) {
            console.error('Error al editar curso:', err);
            return res.status(500).send('Error al editar curso');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Curso no encontrado');
        }

        res.sendStatus(200);
    });
});

// Agregar nuevo curso
router.post('/agregarcurso', upload.single('imagen'), (req, res) => {
    const { nombre } = req.body;
    const imagen_espe = req.file ? req.file.filename : null;

    if (!nombre || !imagen_espe) {
        return res.status(400).send('Nombre e imagen son obligatorios');
    }

    db.query('INSERT INTO especialidades (nombre, imagen_espe) VALUES (?, ?)', [nombre, imagen_espe], (err, result) => {
        if (err) {
            console.error('Error al agregar curso:', err);
            return res.status(500).send('Error al agregar curso');
        }
        res.sendStatus(200);
    });
});





// RUTAS PARA LA SECCION DE SECCIONES DE ADMIN
// Obtener todas las sesiones
router.get('/totalsesiones', (req, res) => {
    const sql = `
        SELECT 
            s.id, s.fecha, s.hora_inicio, s.hora_final, s.estado,
            mentor.nombre_completo AS mentor,
            estudiante.nombre_completo AS estudiante
        FROM sesiones s
        JOIN usuarios mentor ON s.mentor_id = mentor.id
        JOIN usuarios estudiante ON s.aprendiz_id = estudiante.id
        ORDER BY s.id ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener sesiones:', err);
            return res.status(500).send('Error al obtener sesiones');
        }
        res.json(results);
    });
});



// Obtener solo estudiantes (rol_id = 2)
router.get('/totalestudiantes', (req, res) => {
    const sql = `
        SELECT id, nombre_completo, correo, rol_id, fecha_registro, imagen
        FROM usuarios
        WHERE rol_id = 2
        ORDER BY id ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener estudiantes:', err);
            return res.status(500).send('Error al obtener estudiantes');
        }
        res.json(results);
    });
});


// Obtener todos los mentores (rol_id = 1)
router.get('/totalmentores', (req, res) => {
    const sql = `
    SELECT id, nombre_completo, correo, rol_id, fecha_registro, imagen
    FROM usuarios
    WHERE rol_id = 1
    ORDER BY id ASC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener mentores:', err);
            return res.status(500).send('Error al obtener mentores');
        }
        res.json(results);
    });
});



router.get('/todassolicitudes', (req, res) => {
    const sql = `
        SELECT s.id, u.nombre_completo AS usuario, s.motivo, s.pedido, s.resultado
        FROM solicitudes s
        JOIN usuarios u ON s.usuario_id = u.id
        ORDER BY s.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener solicitudes:', err);
            return res.status(500).send('Error al obtener solicitudes');
        }
        res.json(results);
    });
});



router.put('/actualizarsolicitud/:id', (req, res) => {
    const { resultado } = req.body;
    const id = req.params.id;

    if (!['aceptado', 'denegado'].includes(resultado)) {
        return res.status(400).send('Resultado inválido');
    }

    db.query('UPDATE solicitudes SET resultado = ? WHERE id = ?', [resultado, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar solicitud:', err);
            return res.status(500).send('Error al actualizar solicitud');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Solicitud no encontrada');
        }

        res.sendStatus(200);
    });
});



// === PUBLICIDAD ===

// Obtener todas las publicidades
router.get('/publicidad', (req, res) => {
    db.query('SELECT * FROM publicidad', (err, results) => {
        if (err) return res.status(500).send('Error al obtener publicidad');
        res.json(results);
    });
});

// Agregar publicidad
router.post('/publicidad', upload.single('imagen_publi'), (req, res) => {
    const { link_publi } = req.body;
    const imagen_publi = req.file ? req.file.filename : null;

    if (!imagen_publi || !link_publi) return res.status(400).send('Datos incompletos');

    const sql = 'INSERT INTO publicidad (imagen_publi, link_publi) VALUES (?, ?)';
    db.query(sql, [imagen_publi, link_publi], (err) => {
        if (err) return res.status(500).send('Error al agregar publicidad');
        res.sendStatus(200);
    });
});

// Editar publicidad
router.put('/publicidad/:id', upload.single('imagen_publi'), (req, res) => {
    const { id } = req.params;
    const { link_publi } = req.body;
    const imagen_publi = req.file ? req.file.filename : null;

    let sql = 'UPDATE publicidad SET link_publi = ?';
    const values = [link_publi];

    if (imagen_publi) {
        sql += ', imagen_publi = ?';
        values.push(imagen_publi);
    }

    sql += ' WHERE id = ?';
    values.push(id);

    db.query(sql, values, (err) => {
        if (err) return res.status(500).send('Error al actualizar publicidad');
        res.sendStatus(200);
    });
});



// Eliminar publicidad
router.delete('/publicidad/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM publicidad WHERE id = ?';

    db.query(sql, [id], (err) => {
        if (err) {
            console.error('Error al eliminar publicidad:', err);
            return res.status(500).send('Error al eliminar publicidad');
        }
        res.sendStatus(200);
    });
});



// === NOVEDADES ===

// Obtener todas las novedades
router.get('/novedades', (req, res) => {
    db.query('SELECT * FROM novedades', (err, results) => {
        if (err) return res.status(500).send('Error al obtener novedades');
        res.json(results);
    });
});



// Agregar novedad
router.post('/novedades', upload.fields([
    { name: 'imagen_autor' },
    { name: 'imagen_contenido' }
]), (req, res) => {
    const { nombre_autor, carrera_autor, titulo, descripcion } = req.body;
    const imagen_autor = req.files['imagen_autor']?.[0]?.filename;
    const imagen_contenido = req.files['imagen_contenido']?.[0]?.filename;

    if (!nombre_autor || !carrera_autor || !titulo || !descripcion || !imagen_autor || !imagen_contenido) {
        return res.status(400).send('Datos incompletos');
    }

    const sql = `INSERT INTO novedades
        (nombre_autor, carrera_autor, imagen_autor, titulo, descripcion, imagen_contenido)
        VALUES (?, ?, ?, ?, ?, ?)`;

    const values = [nombre_autor, carrera_autor, imagen_autor, titulo, descripcion, imagen_contenido];

    db.query(sql, values, (err) => {
        if (err) return res.status(500).send('Error al agregar novedad');
        res.sendStatus(200);
    });
});



// Editar novedad
router.put('/novedades/:id', upload.fields([
    { name: 'imagen_autor' },
    { name: 'imagen_contenido' }
]), (req, res) => {
    const { id } = req.params;
    const { nombre_autor, carrera_autor, titulo, descripcion } = req.body;
    const imagen_autor = req.files['imagen_autor']?.[0]?.filename;
    const imagen_contenido = req.files['imagen_contenido']?.[0]?.filename;

    let sql = `UPDATE novedades 
               SET nombre_autor = ?, carrera_autor = ?, titulo = ?, descripcion = ?`;
    const values = [nombre_autor, carrera_autor, titulo, descripcion];

    if (imagen_autor) {
        sql += `, imagen_autor = ?`;
        values.push(imagen_autor);
    }

    if (imagen_contenido) {
        sql += `, imagen_contenido = ?`;
        values.push(imagen_contenido);
    }

    sql += ` WHERE id = ?`;
    values.push(id);

    db.query(sql, values, (err) => {
        if (err) return res.status(500).send('Error al editar novedad');
        res.sendStatus(200);
    });
});

router.delete('/novedades/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM novedades WHERE id = ?';
    db.query(sql, [id], (err) => {
        if (err) return res.status(500).send('Error al eliminar novedad');
        res.sendStatus(200);
    });
});


module.exports = router;