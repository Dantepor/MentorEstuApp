const AuthService = require('../services/authService');

const authController = {
    register: async (req, res) => {
        const { nombre_completo, correo, password } = req.body;

        if (!nombre_completo || !correo || !password) {
            return res.status(400).send('Todos los campos son obligatorios');
        }

        try {
            // Registrar con rol_id = 4 para marcar "nuevo usuario"
            await AuthService.registerUser(nombre_completo, correo, password, 4);
            res.redirect('/login.html');
        } catch (err) {
            console.error('Error en registro:', err);
            res.status(500).send('Error al registrar usuario');
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send('Correo y contraseña son obligatorios');
        }

        try {
            const user = await AuthService.loginUser(email, password);

            if (!user) {
                return res.status(401).send('Correo o contraseña incorrectos');
            }

            // Guardar ID en sesión
            req.session.userId = user.id;

            // Determinar URL de redirección según rol
            let redirectUrl = '';

            if (user.rol_id === 1) {
                redirectUrl = '/inicio2.html';
            } else if (user.rol_id === 2) {
                redirectUrl = '/inicio.html';
            } else if (user.rol_id === 3) {
                redirectUrl = '/admin.html';
            } else if (user.rol_id === 4) {
                redirectUrl = '/primerol.html';
            } else {
                return res.status(403).send('Rol no reconocido');
            }

            // Enviar ID, rol y URL al frontend
            res.json({ userId: user.id, rolId: user.rol_id, redirectUrl });

        } catch (err) {
            console.error('Error en login:', err);
            res.status(500).send('Error en el servidor');
        }
    },

    seleccionarRol: async (req, res) => {
        const { rol_id } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        if (![1, 2].includes(rol_id)) {
            return res.status(400).json({ message: 'Rol inválido' });
        }

        try {
            await AuthService.actualizarRol(userId, rol_id);
            // Redirigir según rol
            const redirectTo = rol_id === 1 ? '/inicio2.html' : '/inicio.html';
            res.json({ redirectTo });
        } catch (err) {
            console.error('Error al actualizar rol:', err);
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }
};

module.exports = authController;