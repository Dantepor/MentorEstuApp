require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Cargar configuración de Passport
require('./src/config/passport');

// Rutas
const authRoutes = require('./src/routes/authRoutes');
const googleAuthRoutes = require('./src/routes/googleAuthRoutes');
const userInfoRoutes = require('./src/routes/userInfoRoutes');
const mentoresRoutes = require('./src/routes/mentoresRoutes');
const sesionesRoutes = require('./src/routes/sesionesRoutes');
const rankingRoutes = require('./src/routes/rankingRoutes');
const mentorapiRoutes = require('./src/routes/mentorapiRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Middlewares
const verificarSesion = require('./src/middlewares/verificarSesion');
const verificarAccesoPorRol = require('./src/middlewares/verificarAccesoPorRol');

// Base de datos
const db = require('./src/models/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'clave-secreta',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 día
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Rutas públicas
app.use('/api/auth', authRoutes);
app.use('/auth', googleAuthRoutes);

// Rutas protegidas (API)
app.use('/api', verificarSesion, userInfoRoutes);
app.use('/api', verificarSesion, mentoresRoutes);
app.use('/api', verificarSesion, sesionesRoutes);
app.use('/api', verificarSesion, rankingRoutes);
app.use('/api', verificarSesion, mentorapiRoutes);
app.use('/api', verificarSesion, adminRoutes);

// Rutas protegidas a archivos HTML según rol
app.get('/inicio.html', verificarSesion, verificarAccesoPorRol, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/inicio.html'));
});
app.get('/inicio2.html', verificarSesion, verificarAccesoPorRol, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/inicio2.html'));
});
app.get('/admin.html', verificarSesion, verificarAccesoPorRol, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});
app.get('/reunion.html', verificarSesion, verificarAccesoPorRol, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/reunion.html'));
});
app.get('/reunion2.html', verificarSesion, verificarAccesoPorRol, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/reunion2.html'));
});

// Ruta pública de inicio
app.get('/', (req, res) => res.redirect('/login.html'));

// Socket.io para sesiones
io.on('connection', (socket) => {
  console.log('🟢 Usuario conectado');

  socket.on('unirse-sala', (idSesion) => {
    socket.join(idSesion);
    console.log(`Usuario unido a sala: ${idSesion}`);
  });

  socket.on('cerrar-sesion', (idSesion) => {
    console.log(`⚠️ Cerrando sala: ${idSesion}`);
    io.to(idSesion).emit('sesion-finalizada');
  });

  socket.on('disconnect', () => {
    console.log('🔴 Usuario desconectado');
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});