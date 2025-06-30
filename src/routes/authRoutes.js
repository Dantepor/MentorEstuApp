const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

console.log('authController:', authController);  // <--- Añade esto para ver qué carga

// Ruta para registrar un nuevo usuario
router.post('/register', authController.register);

// Ruta para iniciar sesión
router.post('/login', authController.login);

router.post('/seleccionar-rol', authController.seleccionarRol);

module.exports = router;