// src/middlewares/verificarAccesoPorRol.js

module.exports = function (req, res, next) {
    const { userId, rol_id } = req.session;

    if (!userId || !rol_id) {
        return res.redirect('/login.html');
    }

    const ruta = req.path;

    const rutasPermitidas = {
        1: ['/inicio2.html', '/reunion2.html'],
        2: ['/inicio.html', '/reunion.html'],
        3: ['/admin.html']
    };

    const redireccionPorRol = {
        1: '/inicio2.html',
        2: '/inicio.html',
        3: '/admin.html'
    };

    const permitidas = rutasPermitidas[rol_id] || [];

    if (permitidas.includes(ruta)) {
        return next();
    } else {
        return res.redirect(redireccionPorRol[rol_id]);
    }
};