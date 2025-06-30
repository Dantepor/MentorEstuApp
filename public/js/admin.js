// Cambia la sección activa
function mostrarSeccion(id) {
    const secciones = document.querySelectorAll('.section');
    const botones = document.querySelectorAll('.menu-item');

    secciones.forEach(seccion => seccion.classList.remove('active'));
    botones.forEach(btn => btn.classList.remove('active'));

    document.getElementById(id).classList.add('active');

    // Activar botón actual
    const botonActual = Array.from(botones).find(btn => btn.textContent.toLowerCase().includes(id));
    if (botonActual) botonActual.classList.add('active');

    // Cargar datos según la sección
    if (id === 'usuarios') {
        cargarUsuarios();
    } else if (id === 'cursos') {
        cargarCursos();
    } else if (id === 'sesiones') {
        cargarSesiones();
    } else if (id === 'estudiantes') {
        cargarEstudiantes();
    } else if (id === 'mentores') {
        cargarMentores();
    } else if (id === 'solicitudes') {
        cargarSolicitudesAdmin(); // ✅ esta función debe cargar las solicitudes desde el backend
    }
}


// Cargar los datos desde el backend Para la Sección de Usuarios del Admin
let usuariosGlobal = [];

function cargarUsuarios() {
    fetch('/api/totalusuarios')
        .then(res => res.json())
        .then(data => {
            usuariosGlobal = data;
            renderizarUsuarios(data);
            poblarFiltros(data);
        })
        .catch(err => console.error('Error al cargar usuarios:', err));
}

function renderizarUsuarios(data) {
    const tbody = document.querySelector('#tabla-usuarios tbody');
    tbody.innerHTML = '';

    data.forEach(usuario => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.nombre_completo}</td>
            <td>${usuario.correo}</td>
            <td>${usuario.rol}</td>
            <td>${new Date(usuario.fecha_registro).toLocaleDateString()}</td>
            <td>
                <img src="/img/${usuario.imagen}" width="40" height="40" style="border-radius: 50%;">
            </td>
            <td>
                <button onclick="editarUsuario(${usuario.id})">Editar</button>
                <button onclick="eliminarUsuario(${usuario.id})" style="background:rgb(239, 73, 36); color: white;">Eliminar</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function poblarFiltros(data) {
    const roles = new Set();
    const correos = new Set();
    const fechas = new Set();

    data.forEach(u => {
        roles.add(u.rol);
        correos.add(u.correo);
        fechas.add(new Date(u.fecha_registro).toLocaleDateString());
    });

    poblarSelect('filtro-rol', Array.from(roles).sort());
    poblarSelect('filtro-correo', Array.from(correos).sort());
    poblarSelect('filtro-fecha', Array.from(fechas).sort());
}

function poblarSelect(id, valores) {
    const select = document.getElementById(id);
    select.innerHTML = `<option value="">${select.options[0].text}</option>`;
    valores.forEach(valor => {
        const opt = document.createElement('option');
        opt.value = valor;
        opt.textContent = valor;
        select.appendChild(opt);
    });
}

function aplicarFiltrosUsuarios() {
    const texto = document.getElementById('busqueda-usuarios').value.toLowerCase();
    const rol = document.getElementById('filtro-rol').value;
    const correo = document.getElementById('filtro-correo').value;
    const fecha = document.getElementById('filtro-fecha').value;

    const filtrados = usuariosGlobal.filter(u =>
        u.nombre_completo.toLowerCase().includes(texto) &&
        (rol === '' || u.rol === rol) &&
        (correo === '' || u.correo === correo) &&
        (fecha === '' || new Date(u.fecha_registro).toLocaleDateString() === fecha)
    );

    renderizarUsuarios(filtrados);
}

document.addEventListener('DOMContentLoaded', () => {
    const inputBusqueda = document.getElementById('busqueda-usuarios');
    inputBusqueda.value = ''; // Limpia cualquier valor previo
    inputBusqueda.removeAttribute('readonly'); // Permite escribir luego del DOM listo

    cargarUsuarios(); // Tu función ya existente
    inputBusqueda.addEventListener('input', aplicarFiltrosUsuarios);
    document.getElementById('filtro-rol').addEventListener('change', aplicarFiltrosUsuarios);
    document.getElementById('filtro-correo').addEventListener('change', aplicarFiltrosUsuarios);
    document.getElementById('filtro-fecha').addEventListener('change', aplicarFiltrosUsuarios);
});


// Acciones de botones
function editarUsuario(id) {
    alert(`Editar usuario ID: ${id}`);
    // Aquí puedes abrir un modal con los datos del usuario
}

function eliminarUsuario(id) {
    if (confirm(`¿Seguro que deseas eliminar el usuario con ID ${id}?`)) {
        fetch(`/api/eliminarusuario/${id}`, {
            method: 'DELETE'
        })
            .then(res => {
                if (res.ok) {
                    alert('Usuario eliminado correctamente');
                    cargarUsuarios(); // Recargar tabla
                } else {
                    alert('Error al eliminar usuario');
                }
            });
    }
}


function editarUsuario(id) {
    Promise.all([
        fetch('/api/totalusuarios').then(res => res.json()),
        fetch('/api/roles').then(res => res.json())
    ])
        .then(([usuarios, roles]) => {
            const usuario = usuarios.find(u => u.id === id);
            if (!usuario) return alert('Usuario no encontrado');

            document.getElementById('edit-id').value = usuario.id;
            document.getElementById('edit-nombre').value = usuario.nombre_completo;
            document.getElementById('edit-correo').value = usuario.correo;
            document.getElementById('edit-imagen-preview').src = `/img/${usuario.imagen}`;

            // Cargar roles
            const selectRol = document.getElementById('edit-rol');
            selectRol.innerHTML = '';
            roles
                .filter(rol => rol.id !== 4) // ⛔️ excluir rol con ID 4
                .forEach(rol => {
                    const option = document.createElement('option');
                    option.value = rol.id;
                    option.textContent = rol.nombre;
                    if (rol.id === usuario.rol_id) option.selected = true;
                    selectRol.appendChild(option);
                });

            document.getElementById('modal-editar').style.display = 'block';
        });
}



function cerrarModalEditar() {
    document.getElementById('modal-editar').style.display = 'none';
}

function guardarCambios() {
    const id = document.getElementById('edit-id').value;
    const nombre = document.getElementById('edit-nombre').value;
    const correo = document.getElementById('edit-correo').value;
    const rol = document.getElementById('edit-rol').value;
    const imagenFile = document.getElementById('edit-imagen-file').files[0];
    const password = document.getElementById('edit-password').value;

    const formData = new FormData();
    formData.append('nombre_completo', nombre);
    formData.append('correo', correo);
    formData.append('rol_id', rol);
    if (imagenFile) {
        formData.append('imagen', imagenFile);
    }
    if (password.trim() !== '') {
        formData.append('password', password);
    }

    fetch(`/api/editarusuario/${id}`, {
        method: 'PUT',
        body: formData
    })
        .then(res => {
            if (res.ok) {
                alert('Usuario actualizado correctamente');
                cerrarModalEditar();
                cargarUsuarios();
            } else {
                alert('Error al actualizar usuario');
            }
        });
}

document.getElementById('edit-imagen-file').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('edit-imagen-preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('add-imagen-file').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('add-imagen-preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        // Si se elimina el archivo, volver a mostrar la imagen por defecto
        document.getElementById('add-imagen-preview').src = '/img/basicperfil.png';
    }
});

function abrirModalAgregar() {
    // Limpiar el formulario
    document.getElementById('form-agregar-usuario').reset();

    // Imagen por defecto
    document.getElementById('add-imagen-preview').src = '/img/basicperfil.png';

    document.getElementById('modal-agregar').style.display = 'flex';

    // Cargar roles
    fetch('/api/roles')
        .then(res => res.json())
        .then(roles => {
            const select = document.getElementById('agregar-rol');
            select.innerHTML = '<option value="">Seleccione un rol</option>';
            roles
                .filter(r => r.id !== 4)
                .forEach(rol => {
                    const opt = document.createElement('option');
                    opt.value = rol.id;
                    opt.textContent = rol.nombre;
                    select.appendChild(opt);
                });
        });
}


function cerrarModalAgregar() {
    document.getElementById('modal-agregar').style.display = 'none';
}

document.getElementById('form-agregar-usuario').addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(this);

    fetch('/api/agregarusuario', {
        method: 'POST',
        body: formData
    })
        .then(res => {
            if (res.ok) {
                alert('Usuario agregado correctamente');
                cerrarModalAgregar();
                cargarUsuarios();
            } else {
                alert('Error al agregar usuario');
            }
        });
});












// Cargar los datos desde el backend Para la Sección de Cursos/Especialidades del Admin

// === Cargar cursos ===
let cursosGlobal = [];

function cargarCursos() {
    fetch('/api/totalcursos')
        .then(res => res.json())
        .then(data => {
            cursosGlobal = data;
            renderizarCursos(data);
            poblarFiltroCursos(data);
        })
        .catch(err => {
            console.error('Error al cargar cursos:', err);
        });
}

function renderizarCursos(data) {
    const tbody = document.querySelector('#tabla-cursos tbody');
    tbody.innerHTML = '';

    data.forEach(curso => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${curso.id}</td>
            <td>${curso.nombre}</td>
            <td><img src="/img/${curso.imagen_espe}" width="40" height="40" style="border-radius: 8px;"></td>
            <td>
                <button onclick="editarCurso(${curso.id}, '${curso.nombre}', '${curso.imagen_espe}')">Editar</button>
<button onclick="eliminarCurso(${curso.id})" style="background:rgb(201, 50, 45); color: white;">Eliminar</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function poblarFiltroCursos(data) {
    const select = document.getElementById('filtro-cursos');
    const nombres = [...new Set(data.map(c => c.nombre))].sort();

    select.innerHTML = '<option value="">Filtrar por nombre</option>';
    nombres.forEach(nombre => {
        const opt = document.createElement('option');
        opt.value = nombre;
        opt.textContent = nombre;
        select.appendChild(opt);
    });
}

function aplicarFiltrosCursos() {
    const texto = document.getElementById('busqueda-cursos').value.toLowerCase();
    const filtroNombre = document.getElementById('filtro-cursos').value;

    const filtrados = cursosGlobal.filter(c =>
        c.nombre.toLowerCase().includes(texto) &&
        (!filtroNombre || c.nombre === filtroNombre)
    );

    renderizarCursos(filtrados);
}

document.addEventListener('DOMContentLoaded', () => {
    cargarCursos();
    document.getElementById('busqueda-cursos').addEventListener('input', aplicarFiltrosCursos);
    document.getElementById('filtro-cursos').addEventListener('change', aplicarFiltrosCursos);
});

// === Eliminar curso ===
function eliminarCurso(id) {
    if (confirm(`¿Seguro que deseas eliminar el curso con ID ${id}?`)) {
        fetch(`/api/eliminarcurso/${id}`, {
            method: 'DELETE'
        })
            .then(res => {
                if (res.ok) {
                    alert('Curso eliminado correctamente');
                    cargarCursos();
                } else {
                    alert('Error al eliminar curso');
                }
            });
    }
}

// === Abrir modal para editar curso ===
function editarCurso(id, nombreActual, imagenActual) {
    document.getElementById('curso-id').value = id;
    document.getElementById('curso-nombre').value = nombreActual;
    document.getElementById('curso-imagen-file').value = '';

    const preview = document.getElementById('preview-editar-curso');
    if (imagenActual) {
        preview.src = `/img/${imagenActual}`;
    } else {
        preview.src = '/img/basicperfil.png';
    }

    document.getElementById('modal-editar-curso').style.display = 'block';
}

// === Guardar cambios del curso ===
function guardarCambiosCurso() {
    const id = document.getElementById('curso-id').value;
    const nombre = document.getElementById('curso-nombre').value;
    const imagenInput = document.getElementById('curso-imagen-file');

    const formData = new FormData();
    formData.append('nombre', nombre);
    if (imagenInput.files[0]) {
        formData.append('imagen', imagenInput.files[0]);
    }

    fetch(`/api/editarcurso/${id}`, {
        method: 'PUT',
        body: formData
    })
        .then(res => {
            if (res.ok) {
                alert('Curso actualizado correctamente');
                cerrarModalCurso();
                cargarCursos();
            } else {
                res.text().then(text => alert('Error: ' + text));
            }
        });
}

// === Cerrar el modal ===
function cerrarModalCurso() {
    document.getElementById('modal-editar-curso').style.display = 'none';
}


function abrirModalAgregarCurso() {
    document.getElementById('nuevo-curso-nombre').value = '';
    document.getElementById('nuevo-curso-imagen-file').value = '';
    document.getElementById('preview-agregar-curso').src = '/img/basicperfil.png';
    document.getElementById('modal-agregar-curso').style.display = 'block';
}

function cerrarModalAgregarCurso() {
    document.getElementById('modal-agregar-curso').style.display = 'none';
}

// Guardar nuevo curso
function guardarNuevoCurso() {
    const nombre = document.getElementById('nuevo-curso-nombre').value.trim();
    const imagenInput = document.getElementById('nuevo-curso-imagen-file');

    if (!nombre || !imagenInput.files[0]) {
        alert('Por favor completa todos los campos');
        return;
    }

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('imagen', imagenInput.files[0]);

    fetch('/api/agregarcurso', {
        method: 'POST',
        body: formData
    })
        .then(res => {
            if (res.ok) {
                alert('Curso agregado correctamente');
                cerrarModalAgregarCurso();
                cargarCursos();
            } else {
                res.text().then(text => alert('Error: ' + text));
            }
        });
}



function previsualizarImagenCurso(inputId, previewId) {
    const fileInput = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = e => preview.src = e.target.result;
        reader.readAsDataURL(fileInput.files[0]);
    }
}



// Cargar los datos desde el backend Para la Sección de SESIONES DEL ADMIN

let sesionesGlobal = [];

function cargarSesiones() {
    fetch('/api/totalsesiones')
        .then(res => res.json())
        .then(data => {
            sesionesGlobal = data;
            renderizarSesiones(data);
            poblarFiltrosSesiones(data);
        })
        .catch(err => {
            console.error('Error al cargar sesiones:', err);
        });
}

function renderizarSesiones(data) {
    const tbody = document.querySelector('#tabla-sesiones tbody');
    tbody.innerHTML = '';

    data.forEach(s => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${s.id}</td>
            <td>${s.mentor}</td>
            <td>${s.estudiante}</td>
            <td>${new Date(s.fecha).toLocaleDateString()}</td>
            <td>${s.hora_inicio}</td>
            <td>${s.hora_final}</td>
            <td>${s.estado}</td>
        `;
        tbody.appendChild(fila);
    });
}

function poblarFiltrosSesiones(data) {
    const mentorSet = new Set();
    const estudianteSet = new Set();
    const fechaSet = new Set();
    const estadoSet = new Set();

    data.forEach(s => {
        mentorSet.add(s.mentor);
        estudianteSet.add(s.estudiante);
        fechaSet.add(new Date(s.fecha).toLocaleDateString());
        estadoSet.add(s.estado);
    });

    poblarSelect('filtro-mentor', mentorSet);
    poblarSelect('filtro-estudiante', estudianteSet);
    poblarSelect('filtro-fecha', fechaSet);
    poblarSelect('filtro-estado', estadoSet);
}

function poblarSelect(id, valores) {
    const select = document.getElementById(id);
    const label = id.split('-')[1];
    select.innerHTML = `<option value="">Filtrar por ${label}</option>`;
    Array.from(valores).sort().forEach(valor => {
        const opt = document.createElement('option');
        opt.value = valor;
        opt.textContent = valor;
        select.appendChild(opt);
    });
}

function aplicarFiltrosSesiones() {
    const texto = document.getElementById('busqueda-sesiones').value.toLowerCase();
    const filtroMentor = document.getElementById('filtro-mentor').value;
    const filtroEstudiante = document.getElementById('filtro-estudiante').value;
    const filtroFecha = document.getElementById('filtro-fecha').value;
    const filtroEstado = document.getElementById('filtro-estado').value;

    const filtradas = sesionesGlobal.filter(s => {
        const coincideTexto =
            s.mentor.toLowerCase().includes(texto) ||
            s.estudiante.toLowerCase().includes(texto);

        const coincideMentor = !filtroMentor || s.mentor === filtroMentor;
        const coincideEstudiante = !filtroEstudiante || s.estudiante === filtroEstudiante;
        const coincideFecha = !filtroFecha || new Date(s.fecha).toLocaleDateString() === filtroFecha;
        const coincideEstado = !filtroEstado || s.estado === filtroEstado;

        return coincideTexto && coincideMentor && coincideEstudiante && coincideFecha && coincideEstado;
    });

    renderizarSesiones(filtradas);
}

// Ejecutar filtros al cargar
document.addEventListener('DOMContentLoaded', () => {
    cargarSesiones();

    document.getElementById('busqueda-sesiones').addEventListener('input', aplicarFiltrosSesiones);
    document.getElementById('filtro-mentor').addEventListener('change', aplicarFiltrosSesiones);
    document.getElementById('filtro-estudiante').addEventListener('change', aplicarFiltrosSesiones);
    document.getElementById('filtro-fecha').addEventListener('change', aplicarFiltrosSesiones);
    document.getElementById('filtro-estado').addEventListener('change', aplicarFiltrosSesiones);
});


// Cargar los datos desde el backend Para la Sección de ESTUDIANTES DE ADMIN

let estudiantesGlobal = [];

function cargarEstudiantes() {
    fetch('/api/totalestudiantes')
        .then(res => res.json())
        .then(data => {
            estudiantesGlobal = data;
            renderizarTablaEstudiantes(data);
            poblarFiltrosEstudiantes(data);
        })
        .catch(err => {
            console.error('Error al cargar estudiantes:', err);
        });
}

function renderizarTablaEstudiantes(data) {
    const tbody = document.querySelector('#tabla-estudiantes tbody');
    tbody.innerHTML = '';

    data.forEach(est => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${est.id}</td>
            <td>${est.nombre_completo}</td>
            <td>${est.correo}</td>
            <td>${new Date(est.fecha_registro).toLocaleDateString()}</td>
            <td><img src="/img/${est.imagen}" width="40" height="40" style="border-radius: 50%; object-fit: cover;"></td>
        `;
        tbody.appendChild(fila);
    });
}

function poblarFiltrosEstudiantes(data) {
    const nombreSet = new Set();
    const correoSet = new Set();
    const fechaSet = new Set();

    data.forEach(est => {
        nombreSet.add(est.nombre_completo);
        correoSet.add(est.correo);
        fechaSet.add(new Date(est.fecha_registro).toLocaleDateString());
    });

    poblarSelect('filtro-nombre', nombreSet);
    poblarSelect('filtro-correo', correoSet);
    poblarSelect('filtro-fecha', fechaSet);
}

function poblarSelect(id, values) {
    const select = document.getElementById(id);
    select.innerHTML = `<option value="">Filtrar por ${id.split('-')[1]}</option>`;
    Array.from(values).sort().forEach(v => {
        const option = document.createElement('option');
        option.value = v;
        option.textContent = v;
        select.appendChild(option);
    });
}

function aplicarFiltrosEstudiantes() {
    const texto = document.getElementById('busqueda-estudiantes').value.toLowerCase();
    const filtroNombre = document.getElementById('filtro-nombre').value;
    const filtroCorreo = document.getElementById('filtro-correo').value;
    const filtroFecha = document.getElementById('filtro-fecha').value;

    const filtrados = estudiantesGlobal.filter(est => {
        const coincideTexto =
            est.nombre_completo.toLowerCase().includes(texto) ||
            est.correo.toLowerCase().includes(texto);

        const coincideNombre = !filtroNombre || est.nombre_completo === filtroNombre;
        const coincideCorreo = !filtroCorreo || est.correo === filtroCorreo;
        const coincideFecha = !filtroFecha || new Date(est.fecha_registro).toLocaleDateString() === filtroFecha;

        return coincideTexto && coincideNombre && coincideCorreo && coincideFecha;
    });

    renderizarTablaEstudiantes(filtrados);
}

// Ejecutar eventos cuando todo cargue
document.addEventListener('DOMContentLoaded', () => {
    cargarEstudiantes();

    document.getElementById('busqueda-estudiantes').addEventListener('input', aplicarFiltrosEstudiantes);
    document.getElementById('filtro-nombre').addEventListener('change', aplicarFiltrosEstudiantes);
    document.getElementById('filtro-correo').addEventListener('change', aplicarFiltrosEstudiantes);
    document.getElementById('filtro-fecha').addEventListener('change', aplicarFiltrosEstudiantes);
});




// Cargar los datos desde el backend Para la Sección de MENTORES DE ADMIN

let mentoresGlobal = [];

function cargarMentores() {
    fetch('/api/totalmentores')
        .then(res => res.json())
        .then(data => {
            mentoresGlobal = data;
            renderizarTablaMentores(data);
            poblarFiltrosMentores(data);
        })
        .catch(err => {
            console.error('Error al cargar mentores:', err);
        });
}

function renderizarTablaMentores(data) {
    const tbody = document.querySelector('#tabla-mentores tbody');
    tbody.innerHTML = '';

    data.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.id}</td>
            <td>${u.nombre_completo}</td>
            <td>${u.correo}</td>
            <td>${new Date(u.fecha_registro).toLocaleDateString()}</td>
            <td><img src="/img/${u.imagen}" width="40" height="40" style="border-radius: 50%; object-fit: cover;"></td>
        `;
        tbody.appendChild(tr);
    });
}

function poblarFiltrosMentores(data) {
    const nombreSet = new Set();
    const correoSet = new Set();
    const fechaSet = new Set();

    data.forEach(u => {
        nombreSet.add(u.nombre_completo);
        correoSet.add(u.correo);
        fechaSet.add(new Date(u.fecha_registro).toLocaleDateString());
    });

    poblarSelect('filtro-nombre-mentor', nombreSet);
    poblarSelect('filtro-correo-mentor', correoSet);
    poblarSelect('filtro-fecha-mentor', fechaSet);
}

function poblarSelect(id, values) {
    const select = document.getElementById(id);
    select.innerHTML = `<option value="">Filtrar por ${id.split('-')[1]}</option>`;
    Array.from(values).sort().forEach(v => {
        const option = document.createElement('option');
        option.value = v;
        option.textContent = v;
        select.appendChild(option);
    });
}

function aplicarFiltrosMentores() {
    const texto = document.getElementById('busqueda-mentores').value.toLowerCase();
    const filtroNombre = document.getElementById('filtro-nombre-mentor').value;
    const filtroCorreo = document.getElementById('filtro-correo-mentor').value;
    const filtroFecha = document.getElementById('filtro-fecha-mentor').value;

    const filtrados = mentoresGlobal.filter(u => {
        const coincideTexto =
            u.nombre_completo.toLowerCase().includes(texto) ||
            u.correo.toLowerCase().includes(texto);

        const coincideNombre = !filtroNombre || u.nombre_completo === filtroNombre;
        const coincideCorreo = !filtroCorreo || u.correo === filtroCorreo;
        const coincideFecha = !filtroFecha || new Date(u.fecha_registro).toLocaleDateString() === filtroFecha;

        return coincideTexto && coincideNombre && coincideCorreo && coincideFecha;
    });

    renderizarTablaMentores(filtrados);
}

// Ejecutar eventos al cargar
document.addEventListener('DOMContentLoaded', () => {
    cargarMentores();

    document.getElementById('busqueda-mentores').addEventListener('input', aplicarFiltrosMentores);
    document.getElementById('filtro-nombre-mentor').addEventListener('change', aplicarFiltrosMentores);
    document.getElementById('filtro-correo-mentor').addEventListener('change', aplicarFiltrosMentores);
    document.getElementById('filtro-fecha-mentor').addEventListener('change', aplicarFiltrosMentores);
});






// ✅ Cargar todas las solicitudes en admin
let solicitudesGlobal = [];

function cargarSolicitudesAdmin() {
    fetch('/api/todassolicitudes')
        .then(res => res.json())
        .then(data => {
            solicitudesGlobal = data;
            renderizarSolicitudes(data);
            poblarFiltrosSolicitudes(data);
        })
        .catch(err => console.error('Error al cargar solicitudes admin:', err));
}

function renderizarSolicitudes(data) {
    const tbody = document.querySelector('#tabla-solicitudes-admin tbody');
    tbody.innerHTML = '';

    data.forEach(solicitud => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${solicitud.id}</td>
            <td>${solicitud.usuario}</td>
            <td>${solicitud.motivo}</td>
            <td>${solicitud.pedido}</td>
            <td>${solicitud.resultado}</td>
            <td>
                <button onclick="actualizarResultado(${solicitud.id}, 'aceptado')" style="background: #28a745;">✅ Aceptar</button>
                <button onclick="actualizarResultado(${solicitud.id}, 'denegado')" style="background-color: crimson;">❌ Denegar</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function poblarFiltrosSolicitudes(data) {
    const usuarios = new Set();
    const motivos = new Set();

    data.forEach(s => {
        usuarios.add(s.usuario);
        motivos.add(s.motivo);
    });

    poblarSelect('filtro-usuario', Array.from(usuarios).sort());
    poblarSelect('filtro-motivo', Array.from(motivos).sort());
}

function poblarSelect(id, valores) {
    const select = document.getElementById(id);
    const labelDefault = select.options[0].textContent;
    select.innerHTML = `<option value="">${labelDefault}</option>`;
    valores.forEach(valor => {
        const opt = document.createElement('option');
        opt.value = valor;
        opt.textContent = valor;
        select.appendChild(opt);
    });
}

function aplicarFiltrosSolicitudes() {
    const texto = document.getElementById('busqueda-solicitudes').value.toLowerCase();
    const usuario = document.getElementById('filtro-usuario').value;
    const motivo = document.getElementById('filtro-motivo').value;
    const resultado = document.getElementById('filtro-resultado').value;

    const filtradas = solicitudesGlobal.filter(s =>
        (
            s.usuario.toLowerCase().includes(texto) ||
            s.motivo.toLowerCase().includes(texto) ||
            s.pedido.toLowerCase().includes(texto)
        ) &&
        (usuario === '' || s.usuario === usuario) &&
        (motivo === '' || s.motivo === motivo) &&
        (resultado === '' || s.resultado === resultado)
    );

    renderizarSolicitudes(filtradas);
}

document.addEventListener('DOMContentLoaded', () => {
    cargarSolicitudesAdmin();

    document.getElementById('busqueda-solicitudes').addEventListener('input', aplicarFiltrosSolicitudes);
    document.getElementById('filtro-usuario').addEventListener('change', aplicarFiltrosSolicitudes);
    document.getElementById('filtro-motivo').addEventListener('change', aplicarFiltrosSolicitudes);
    document.getElementById('filtro-resultado').addEventListener('change', aplicarFiltrosSolicitudes);
});



// ✅ Actualizar estado de solicitud
function actualizarResultado(id, nuevoResultado) {
    fetch(`/api/actualizarsolicitud/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultado: nuevoResultado })
    })
        .then(res => {
            if (res.ok) {
                alert(`Solicitud ${nuevoResultado}`);
                cargarSolicitudesAdmin();
            } else {
                alert('Error al actualizar solicitud');
            }
        })
        .catch(err => console.error('Error al actualizar solicitud:', err));
}






// ======================== PUBLICIDAD ========================
let publicidadEditandoId = null;

function abrirModalAgregarPublicidad() {
    publicidadEditandoId = null;
    document.getElementById('form-publicidad').reset();
    document.getElementById('preview-publicidad').src = '/img/default-publicidad.png';
    document.getElementById('modal-publicidad').style.display = 'flex';
}

function cerrarModalPublicidad() {
    document.getElementById('modal-publicidad').style.display = 'none';
}

document.getElementById('input-publicidad-img').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => document.getElementById('preview-publicidad').src = e.target.result;
        reader.readAsDataURL(file);
    }
});

document.getElementById('form-publicidad').addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const url = publicidadEditandoId ? `/api/publicidad/${publicidadEditandoId}` : '/api/publicidad';
    const method = publicidadEditandoId ? 'PUT' : 'POST';

    fetch(url, {
        method,
        body: formData
    })
        .then(res => {
            if (res.ok) {
                alert(`Publicidad ${publicidadEditandoId ? 'actualizada' : 'agregada'} correctamente`);
                cerrarModalPublicidad();
                cargarPublicidades();
            } else {
                alert('Error al guardar publicidad');
            }
        });
});

function editarPublicidad(id, imagen, link) {
    publicidadEditandoId = id;
    document.getElementById('input-publicidad-link').value = link;
    document.getElementById('preview-publicidad').src = `/img/${imagen}`;
    document.getElementById('modal-publicidad').style.display = 'flex';
}

function eliminarPublicidad(id) {
    if (confirm('¿Deseas eliminar esta publicidad?')) {
        fetch(`/api/publicidad/${id}`, { method: 'DELETE' })
            .then(res => {
                if (res.ok) {
                    alert('Publicidad eliminada');
                    cargarPublicidades();
                } else {
                    alert('Error al eliminar');
                }
            });
    }
}

function cargarPublicidades() {
    fetch('/api/publicidad')
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector('#tabla-publicidad tbody');
            tbody.innerHTML = '';
            data.forEach(p => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
          <td>${p.id}</td>
          <td><img src="/img/${p.imagen_publi}" width="80"></td>
          <td><a href="${p.link_publi}" target="_blank">${p.link_publi}</a></td>
          <td>
            <button onclick="editarPublicidad(${p.id}, '${p.imagen_publi}', '${p.link_publi}')">Editar</button>
            <button onclick="eliminarPublicidad(${p.id})"  style="background:rgb(201, 50, 45); color: white;" >Eliminar</button>
          </td>
        `;
                tbody.appendChild(fila);
            });
        });
}


document.addEventListener('DOMContentLoaded', () => {
    cargarPublicidades();
});




// ======================== NOVEDADES ========================
document.addEventListener('DOMContentLoaded', () => {
    let novedadEditandoId = null;
    let todasLasNovedades = [];
    let filtroTexto = "";
    let filtroAutor = "";
    let filtroCarrera = "";

    cargarNovedades();

    document.getElementById('filtro-novedades-general').addEventListener('input', function () {
        filtroTexto = this.value.toLowerCase();
        aplicarFiltrosNovedades();
    });

    document.getElementById('filtro-autor').addEventListener('change', function () {
        filtroAutor = this.value;
        aplicarFiltrosNovedades();
    });

    document.getElementById('filtro-carrera').addEventListener('change', function () {
        filtroCarrera = this.value;
        aplicarFiltrosNovedades();
    });

    document.getElementById('form-novedad').addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const url = novedadEditandoId ? `/api/novedades/${novedadEditandoId}` : '/api/novedades';
        const method = novedadEditandoId ? 'PUT' : 'POST';

        fetch(url, {
            method,
            body: formData
        })
            .then(res => {
                if (res.ok) {
                    alert(`Novedad ${novedadEditandoId ? 'actualizada' : 'agregada'} correctamente`);
                    cerrarModalNovedad();
                    cargarNovedades();
                } else {
                    alert('Error al guardar novedad');
                }
            });
    });

    document.getElementById('input-novedad-img-autor').addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => document.getElementById('preview-novedad-autor').src = e.target.result;
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('input-novedad-img').addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => document.getElementById('preview-novedad-img').src = e.target.result;
            reader.readAsDataURL(file);
        }
    });

    function cargarNovedades() {
        fetch('/api/novedades')
            .then(res => res.json())
            .then(data => {
                todasLasNovedades = data;
                poblarFiltrosDesplegables(data);
                aplicarFiltrosNovedades();
            });
    }

    function poblarFiltrosDesplegables(data) {
        const autores = [...new Set(data.map(n => n.nombre_autor))];
        const carreras = [...new Set(data.map(n => n.carrera_autor))];

        const selectAutor = document.getElementById('filtro-autor');
        const selectCarrera = document.getElementById('filtro-carrera');

        selectAutor.innerHTML = '<option value="">Filtrar por autor</option>';
        selectCarrera.innerHTML = '<option value="">Filtrar por carrera</option>';

        autores.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a;
            opt.textContent = a;
            selectAutor.appendChild(opt);
        });

        carreras.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            selectCarrera.appendChild(opt);
        });
    }

    function aplicarFiltrosNovedades() {
        const filtrado = todasLasNovedades.filter(n =>
            (filtroTexto === "" ||
                (n.nombre_autor || "").toLowerCase().includes(filtroTexto) ||
                (n.carrera_autor || "").toLowerCase().includes(filtroTexto) ||
                (n.titulo || "").toLowerCase().includes(filtroTexto))
            &&
            (filtroAutor === "" || n.nombre_autor === filtroAutor)
            &&
            (filtroCarrera === "" || n.carrera_autor === filtroCarrera)
        );

        renderizarFilasNovedades(filtrado);
    }

    function renderizarFilasNovedades(data) {
        const tbody = document.querySelector('#tabla-novedades tbody');
        tbody.innerHTML = '';

        data.forEach(n => {
            const fila = document.createElement('tr');
            const id = n.id || '';
            const nombre = encodeURIComponent(n.nombre_autor || '');
            const carrera = encodeURIComponent(n.carrera_autor || '');
            const titulo = encodeURIComponent(n.titulo || '');
            const descripcion = encodeURIComponent(n.descripcion || '');
            const imgAutor = n.imagen_autor || 'default-novedad.png';
            const imgContenido = n.imagen_contenido || 'default-novedad.png';

            fila.innerHTML = `
                <td>${id}</td>
                <td>${decodeURIComponent(nombre)}</td>
                <td>${decodeURIComponent(carrera)}</td>
                <td><img src="/img/${imgAutor}" width="60"></td>
                <td>${decodeURIComponent(titulo)}</td>
                <td>${decodeURIComponent(descripcion)}</td>
                <td><img src="/img/${imgContenido}" width="60"></td>
                <td>
                    <button class="btn-editar"
                        data-id="${id}"
                        data-nombre="${nombre}"
                        data-carrera="${carrera}"
                        data-titulo="${titulo}"
                        data-descripcion="${descripcion}"
                        data-imgautor="${imgAutor}"
                        data-imgcontenido="${imgContenido}"
                    >Editar</button>
                    <button class="btn-eliminar" data-id="${id}" style="background:rgb(201, 50, 45); color: white;">Eliminar</button>
                </td>
            `;
            tbody.appendChild(fila);
        });

        tbody.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => {
                editarNovedad({
                    id: parseInt(btn.dataset.id),
                    nombre_autor: decodeURIComponent(btn.dataset.nombre),
                    carrera_autor: decodeURIComponent(btn.dataset.carrera),
                    titulo: decodeURIComponent(btn.dataset.titulo),
                    descripcion: decodeURIComponent(btn.dataset.descripcion),
                    imagen_autor: btn.dataset.imgautor,
                    imagen_contenido: btn.dataset.imgcontenido
                });
            });
        });

        tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('¿Deseas eliminar esta novedad?')) {
                    fetch(`/api/novedades/${id}`, { method: 'DELETE' })
                        .then(res => {
                            if (res.ok) {
                                alert('Novedad eliminada');
                                cargarNovedades();
                            } else {
                                alert('Error al eliminar');
                            }
                        });
                }
            });
        });
    }

    function editarNovedad(n) {
        novedadEditandoId = n.id;
        document.getElementById('input-nombre-novedad').value = n.nombre_autor;
        document.getElementById('input-carrera-novedad').value = n.carrera_autor;
        document.getElementById('input-titulo-novedad').value = n.titulo;
        document.getElementById('input-descripcion-novedad').value = n.descripcion;
        document.getElementById('preview-novedad-autor').src = `/img/${n.imagen_autor}`;
        document.getElementById('preview-novedad-img').src = `/img/${n.imagen_contenido}`;
        document.getElementById('modal-novedad').style.display = 'flex';
    }

    window.abrirModalAgregarNovedad = function () {
        novedadEditandoId = null;
        document.getElementById('form-novedad').reset();
        document.getElementById('preview-novedad-autor').src = '/img/default-novedad.png';
        document.getElementById('preview-novedad-img').src = '/img/default-novedad.png';
        document.getElementById('modal-novedad').style.display = 'flex';
    };

    window.cerrarModalNovedad = function () {
        document.getElementById('modal-novedad').style.display = 'none';
    };
});












// PUBLICIDAD
document.getElementById('publi-file').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('publi-preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});


// NOVEDADES - Imagen Autor
document.getElementById('nove-autor-file').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('nove-autor-preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// NOVEDADES - Imagen Contenido
document.getElementById('nove-contenido-file').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('nove-contenido-preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});


function abrirModalAgregarNovedad() {
    novedadEditandoId = null;
    document.getElementById('form-novedad').reset();
    document.getElementById('preview-novedad-autor').src = '/img/default-novedad.png';
    document.getElementById('preview-novedad-img').src = '/img/default-novedad.png';
    document.getElementById('modal-novedad').style.display = 'flex';
    document.querySelector('#modal-novedad h3').textContent = 'Agregar Novedad'; // cambia título
}

function editarNovedad(n) {
    novedadEditandoId = n.id;
    document.getElementById('input-nombre-novedad').value = n.nombre;
    document.getElementById('input-carrera-novedad').value = n.carrera;
    document.getElementById('input-titulo-novedad').value = n.titulo;
    document.getElementById('input-descripcion-novedad').value = n.descripcion;
    document.getElementById('preview-novedad-autor').src = `/img/${n.imagen_autor}`;
    document.getElementById('preview-novedad-img').src = `/img/${n.imagen_contenido}`;
    document.getElementById('modal-novedad').style.display = 'flex';
    document.querySelector('#modal-novedad h3').textContent = 'Editar Novedad'; // cambia título
}

function abrirModalAgregarPublicidad() {
    publicidadEditandoId = null;
    document.getElementById('form-publicidad').reset();
    document.getElementById('preview-publicidad').src = '/img/default-publicidad.png';
    document.getElementById('modal-publicidad').style.display = 'flex';
    document.querySelector('#modal-publicidad h3').textContent = 'Agregar Publicidad';
}

function editarPublicidad(id, imagen, link) {
    publicidadEditandoId = id;
    document.getElementById('input-publicidad-link').value = link;
    document.getElementById('preview-publicidad').src = `/img/${imagen}`;
    document.getElementById('modal-publicidad').style.display = 'flex';
    document.querySelector('#modal-publicidad h3').textContent = 'Editar Publicidad';
}




// Ejecutar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    cargarUsuarios();
});

