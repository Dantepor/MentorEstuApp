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


// Base de datos
const db = require('./src/models/db');

const app = express();
const server = http.createServer(app); // Usamos http.Server
const io = new Server(server);         // Socket.io vinculado al servidor

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

// Rutas
app.use('/api/auth', authRoutes);
app.use('/auth', googleAuthRoutes);
app.use('/api', userInfoRoutes);
app.use('/api', mentoresRoutes);
app.use('/api', sesionesRoutes);
app.use('/api', rankingRoutes);
app.use('/api', mentorapiRoutes);
app.use('/api', adminRoutes);

// Redirección principal
app.get('/', (req, res) => res.redirect('/login.html'));

// ⚡ Socket.io para control de sesiones
io.on('connection', (socket) => {
  console.log('🟢 Usuario conectado');

  // Unirse a una sala por ID de sesión
  socket.on('unirse-sala', (idSesion) => {
    socket.join(idSesion);
    console.log(`Usuario unido a sala: ${idSesion}`);
  });

  // Cuando el mentor finaliza la sesión
  socket.on('cerrar-sesion', (idSesion) => {
    console.log(`⚠️ Cerrando sala: ${idSesion}`);
    io.to(idSesion).emit('sesion-finalizada'); // Notifica a todos los de la sala
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