let sesionesGlobal = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// === Cargar datos del usuario logueado ===
fetch('/api/user')
    .then(response => {
        if (!response.ok) {
            window.location.href = '/login.html';
            throw new Error('No autorizado');
        }
        return response.json();
    })
    .then(user => {
        // Mostrar datos del usuario
        document.getElementById('usuario').textContent = user.nombre_completo;
        document.getElementById('userId').textContent = user.id;
        document.getElementById('userNombre').textContent = user.nombre_completo;
        document.getElementById('userCorreo').textContent = user.correo;
        document.getElementById('userRol').textContent = user.rol_nombre;
        document.getElementById('userFecha').textContent = new Date(user.fecha_registro).toLocaleDateString();

        // Mostrar imagen en el avatar y en la caja de info
        const imagenUrl = user.imagen ? '/img/' + user.imagen : 'basicperfil.png';
        document.getElementById('avatarFoto').src = imagenUrl;
        document.getElementById('infoFoto').src = imagenUrl;
    })
    .catch(error => {
        console.error(error);
        document.getElementById('usuario').textContent = 'Usuario';
    });

document.addEventListener("DOMContentLoaded", () => {
    // === Mostrar / Ocultar Info del Usuario ===
    const avatar = document.getElementById('avatarFoto');
    const infoBox = document.getElementById('user-info-box');
    const closeBtn = document.getElementById('close-info-button');

    avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        infoBox.classList.toggle('show');
    });

    closeBtn.addEventListener('click', () => {
        infoBox.classList.remove('show');
    });

    document.addEventListener('click', (e) => {
        if (!infoBox.contains(e.target) && !avatar.contains(e.target)) {
            infoBox.classList.remove('show');
        }
    });

    // === Mostrar sección perfilMentor ===
    const editBtn = document.getElementById('edit-button');
    const cancelarBtn = document.getElementById('cancelarEditarMentor');

    editBtn.addEventListener('click', () => {
        document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
        document.getElementById('perfilMentor').style.display = 'block';

        cargarDatosPerfilMentor();
        cargarEspecialidadesDisponibles();
        cargarEspecialidadesAsignadas();
    });

    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', () => {
            document.getElementById('perfilMentor').style.display = 'none';
            document.getElementById('principal').style.display = 'block';
        });
    }

    // === Previsualizar imagen antes de subir ===
    const inputImagen = document.getElementById('editImagenMentor');
    const previewImagen = document.getElementById('editFotoPreviewMentor');

    inputImagen.addEventListener('change', function () {
        const archivo = this.files[0];
        if (archivo) {
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImagen.src = e.target.result;
            };
            reader.readAsDataURL(archivo);
        }
    });

    // === Enviar formulario de edición ===
    document.getElementById('formEditarPerfilMentor').addEventListener('submit', e => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('nombre_completo', document.getElementById('editNombreMentor').value);
        formData.append('correo', document.getElementById('editCorreoMentor').value);

        const imagenFile = inputImagen.files[0];
        if (imagenFile) {
            formData.append('imagen', imagenFile);
        }

        fetch('/api/editar-perfil', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Perfil actualizado correctamente');
                    location.reload();
                } else {
                    alert('Error al actualizar perfil');
                }
            });
    });

    // === Agregar especialidad ===
    document.getElementById('btnAgregarEspecialidad').addEventListener('click', () => {
        const especialidadId = document.getElementById('nuevaEspecialidad').value;
        fetch('/api/agregar-especialidad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ especialidad_id: especialidadId })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Especialidad agregada');
                    cargarEspecialidadesAsignadas();
                }
            });
    });
});

// === Funciones auxiliares ===

function cargarDatosPerfilMentor() {
    fetch('/api/user')
        .then(res => res.json())
        .then(user => {
            document.getElementById('editNombreMentor').value = user.nombre_completo;
            document.getElementById('editCorreoMentor').value = user.correo;
            document.getElementById('editFotoPreviewMentor').src = user.imagen ? '/img/' + user.imagen : 'basicperfil.png';
        });
}

function cargarEspecialidadesDisponibles() {
    fetch('/api/especialidades')
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('nuevaEspecialidad');
            select.innerHTML = '';
            data.forEach(esp => {
                const option = document.createElement('option');
                option.value = esp.id;
                option.textContent = esp.nombre;
                select.appendChild(option);
            });
        });
}

function cargarEspecialidadesAsignadas() {
    fetch('/api/mentor-especialidades')
        .then(res => res.json())
        .then(data => {
            const ul = document.getElementById('listaEspecialidadesMentor');
            ul.innerHTML = '';
            data.forEach(esp => {
                const li = document.createElement('li');
                li.textContent = esp.nombre;

                const btn = document.createElement('button');
                btn.textContent = '❌';
                btn.type = 'button';
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    eliminarEspecialidad(esp.id);
                });
                li.appendChild(btn);
                ul.appendChild(li);
            });
        });
}

function eliminarEspecialidad(especialidadId) {
    fetch('/api/eliminar-especialidad/' + especialidadId, {
        method: 'DELETE'
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Especialidad eliminada');
                cargarEspecialidadesAsignadas();
            }
        });
}





















// Mostrar sección agenda con mentor seleccionado
function mostrarSeccionAgenda(id, nombre) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    const agendaSection = document.getElementById('agenda');
    agendaSection.style.display = 'block';
    document.getElementById('mentor-nombre').textContent = nombre;
    agendaSection.setAttribute('data-mentor-id', id);
}





// Mostrar calendario con sesiones
// Mostrar calendario con sesiones
document.addEventListener('DOMContentLoaded', () => {
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    let sesionesGlobal = [];

    function mostrarSeccionCalendario() {
        document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
        document.getElementById('calendario').style.display = 'block';

        if (sesionesGlobal.length > 0) {
            renderizarCalendario(currentYear, currentMonth);
        } else {
            fetch('/api/mis-sesiones-calendario')
                .then(response => {
                    if (!response.ok) throw new Error('Error al obtener sesiones');
                    return response.json();
                })
                .then(sesiones => {
                    console.log('✅ Sesiones recibidas:', sesiones);
                    sesionesGlobal = sesiones;
                    renderizarCalendario(currentYear, currentMonth);
                })
                .catch(err => {
                    console.error('❌ Error al cargar sesiones:', err);
                    document.getElementById('calendar').innerHTML = '<p>Error al cargar el calendario</p>';
                });
        }
    }

    function renderizarCalendario(year, month) {
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';

        const monthYearLabel = document.getElementById('calendar-month-year');
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        monthYearLabel.textContent = `${monthNames[month]} ${year}`;

        const headers = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        headers.forEach(d => {
            const cell = document.createElement('div');
            cell.className = 'day day-header';
            cell.textContent = d;
            calendar.appendChild(cell);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day';
            calendar.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'day';

            const fechaActual = new Date(year, month, day);
            const isoFecha = fechaActual.toISOString().slice(0, 10);

            const sesionesDelDia = sesionesGlobal.filter(s => {
                const fechaSesion = new Date(s.fecha).toISOString().slice(0, 10);
                return fechaSesion === isoFecha;
            });

            if (sesionesDelDia.length > 0) {
                cell.classList.add('session');
                cell.innerHTML = `<strong>${day}</strong><br>`;

                sesionesDelDia.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

                const primera = sesionesDelDia[0];
                const horaInicio = primera.hora_inicio?.slice(0, 5) || '--:--';
                const horaFinal = primera.hora_final?.slice(0, 5) || '--:--';
                const titulo = primera.titulo || 'Clase';
                cell.innerHTML += `${horaInicio} - ${horaFinal}<br>${titulo}<br>`;

                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                sesionesDelDia.forEach(sesion => {
                    const horaInicio = sesion.hora_inicio?.slice(0, 5) || '--:--';
                    const horaFinal = sesion.hora_final?.slice(0, 5) || '--:--';
                    const titulo = sesion.titulo || 'Clase';
                    tooltip.innerHTML += `${horaInicio} - ${horaFinal} • ${titulo}<br>`;
                });
                cell.appendChild(tooltip);
            } else {
                cell.textContent = day;
            }

            calendar.appendChild(cell);
        }
    }

    const calendarioMenu = document.querySelector('[data-section="calendario"]');
    if (calendarioMenu) {
        calendarioMenu.addEventListener('click', mostrarSeccionCalendario);
    }

    document.getElementById('prev-month').addEventListener('click', () => {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        renderizarCalendario(currentYear, currentMonth);
    });

    document.getElementById('next-month').addEventListener('click', () => {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        renderizarCalendario(currentYear, currentMonth);
    });
});



// Navegación entre secciones (menú lateral)
document.querySelectorAll('.menu li').forEach(item => {
    item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
        document.getElementById(section).style.display = 'block';
    });
});





// Mostrar la sección "Clases" con las sesiones del usuario logueado

function mostrarSeccionClases() {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    const clasesSection = document.getElementById('clases');
    clasesSection.style.display = 'block';

    const listaPendientes = document.getElementById('clases-pendientes-container');
    const listaConfirmadas = document.getElementById('clases-confirmadas-container');
    listaPendientes.innerHTML = '<p>Cargando solicitudes...</p>';
    listaConfirmadas.innerHTML = '<p>Cargando clases aceptadas...</p>';

    fetch('/api/solicitudes-mentor', { credentials: 'include' })
        .then(res => res.json())
        .then(clases => {
            listaPendientes.innerHTML = '';
            listaConfirmadas.innerHTML = '';

            const clasesPendientes = clases.filter(clase => clase.estado === 'pendiente');
            const clasesConfirmadas = clases.filter(clase => clase.estado === 'confirmada');

            if (clasesPendientes.length === 0 && clasesConfirmadas.length === 0) {
                listaPendientes.innerHTML = '<p class="infoclassdocente">No tienes solicitudes pendientes.</p>';
                listaConfirmadas.innerHTML = '<p class="infoclassdocente" >No tienes clases aceptadas.</p>';
                return;
            }

            // Solicitudes pendientes
            if (clasesPendientes.length === 0) {
                listaPendientes.innerHTML = '<p class="infoclassdocente">No tienes solicitudes pendientes.</p>';
            } else {
                clasesPendientes.forEach(clase => {
                    const div = document.createElement('div');
                    div.className = 'clase-card';
                    div.innerHTML = `
                        <h3>🧑‍🎓 Aprendiz: ${clase.aprendiz_nombre}</h3>
                        <p><strong>Fecha:</strong> ${new Date(clase.fecha).toLocaleDateString()}<br>
                        <strong>Hora:</strong> ${clase.hora_inicio} - ${clase.hora_final}</p>
                        <button onclick="responderClase(${clase.id}, 'confirmada')">Aceptar</button>
                        <button onclick="responderClase(${clase.id}, 'rechazada')">Rechazar</button>
                    `;
                    listaPendientes.appendChild(div);
                });
            }

            // Clases confirmadas (actualizado con validación de hora)
            if (clasesConfirmadas.length === 0) {
                listaConfirmadas.innerHTML = '<p>No tienes clases aceptadas.</p>';
            } else {
                clasesConfirmadas.forEach(clase => {
                    const ahora = Date.now();
                    const timestampInicio = clase.timestamp_inicio;
                    const timestampFinal = clase.timestamp_final;

                    const puedeEntrar = clase.estado === 'confirmada' &&
                        timestampInicio && timestampFinal &&
                        ahora >= timestampInicio &&
                        ahora <= timestampFinal;

                    const div = document.createElement('div');
                    div.className = 'clase-card';

                    const fechaFormateada = new Date(clase.fecha).toLocaleDateString();
                    const horaInicio = clase.hora_inicio?.slice(0, 5) || '--:--';
                    const horaFinal = clase.hora_final?.slice(0, 5) || '--:--';

                    let contenidoBoton = '';
                    if (puedeEntrar) {
                        contenidoBoton = `<button class="btn-entrar" onclick="window.open('reunion2.html?id=${clase.id}', '_blank')">Entrar a la clase</button>`;
                    } else {
                        contenidoBoton = `<p style="color: green; font-weight: bold;">🕒 Esperar la hora indicada</p>`;
                    }

                    div.innerHTML = `
                        <h3>🧑‍🎓 Aprendiz: ${clase.aprendiz_nombre}</h3>
                        <p><strong>Fecha:</strong> ${fechaFormateada}<br>
                        <strong>Hora:</strong> ${horaInicio} - ${horaFinal}</p>
                        <p><strong>Estado:</strong> Confirmada</p>
                        ${contenidoBoton}
                    `;

                    listaConfirmadas.appendChild(div);
                });
            }
        })
        .catch(error => {
            console.error('Error al cargar las clases:', error);
            listaPendientes.innerHTML = '<p>Error al cargar las solicitudes.</p>';
            listaConfirmadas.innerHTML = '<p>Error al cargar las clases confirmadas.</p>';
        });
}





function responderClase(idSesion, nuevoEstado) {
    fetch(`/api/responder-sesion/${idSesion}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ estado: nuevoEstado })
    })
        .then(response => {
            if (!response.ok) throw new Error('Error al actualizar estado de la sesión');
            return response.json();
        })
        .then(data => {
            console.log('Sesión actualizada:', data);
            mostrarSeccionClases(); // Recargar vista
        })
        .catch(err => {
            console.error('Error al responder clase:', err);
            alert('Ocurrió un error al procesar tu respuesta.');
        });
}











// Función que cierra la reunión
function cerrarReunion() {
    document.getElementById('reunion').style.display = 'none';
    mostrarSeccionClases(); // Vuelve a mostrar la sección de clases
}

// Asegurarse de que la sección se cargue al hacer clic en "Mis Clases"
document.addEventListener('DOMContentLoaded', () => {
    const clasesMenu = document.querySelector('[data-section="clases"]');
    if (clasesMenu) {
        clasesMenu.addEventListener('click', mostrarSeccionClases);
    }
});






// DESPLEGABLE DE SECCION POPULAR DE MENTORES
document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('curso-filter');
    const grid = document.getElementById('cursos-grid');
    const cursosContainer = document.querySelector('.cursos-container');
    const mentoresContainer = document.getElementById('mentores-container');
    const mentoresTitle = document.getElementById('mentores-title');
    const btnVolver = document.getElementById('btn-volver');

    let mentores = [];
    let especialidadesData = [];

    // Estado inicial
    btnVolver.style.display = 'none';
    mentoresContainer.style.display = 'none';
    mentoresTitle.style.display = 'none';

    // Cargar mentores
    fetch('/api/mentores')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            mentores = data;
        })
        .catch(error => {
            console.error('❌ Error al cargar mentores:', error);
            mentoresContainer.innerHTML = '<p>Error al cargar mentores</p>';
        });

    function mostrarMentores(listaMentores) {
        mentoresContainer.innerHTML = '';
        if (listaMentores.length === 0) {
            mentoresContainer.innerHTML = '<p>No hay mentores para esta especialidad.</p>';
            return;
        }

        listaMentores.forEach(mentor => {
            const card = document.createElement('div');
            card.className = 'mentor-card';
            card.innerHTML = `
                <img src="/img/${mentor.imagen}" alt="${mentor.nombre}" />
                <h4>${mentor.nombre}</h4>
                <p>${mentor.especialidad || 'Sin especialidad'}</p>
            `;
            card.addEventListener("click", () => {
                mostrarSeccionAgenda(mentor.id, mentor.nombre);
            });
            mentoresContainer.appendChild(card);
        });
    }

    // Cargar especialidades y crear select + cuadros
    fetch('api/especialidades')
        .then(response => response.json())
        .then(data => {
            especialidadesData = data;

            // Opciones del select
            data.forEach(especialidad => {
                const option = document.createElement('option');
                option.value = especialidad.id;
                option.textContent = especialidad.nombre;
                select.appendChild(option);
            });

            // Crear cuadros
            grid.innerHTML = '';
            data.forEach((especialidad, index) => {
                const card = document.createElement('div');
                card.classList.add('curso-card');
                card.dataset.id = especialidad.id;

                const img = document.createElement('img');
                img.classList.add('curso-img');
                img.src = `imagen/curso${(index % 6) + 1}.jpg`;
                img.alt = especialidad.nombre;

                const titulo = document.createElement('div');
                titulo.classList.add('curso-titulo');
                titulo.textContent = especialidad.nombre;

                card.appendChild(img);
                card.appendChild(titulo);

                card.addEventListener('click', () => {
                    cursosContainer.style.display = 'none';
                    mentoresTitle.style.display = 'block';
                    mentoresContainer.style.display = 'flex';
                    btnVolver.style.display = 'inline-block';

                    const mentoresFiltrados = mentores.filter(m => m.especialidad === especialidad.nombre);
                    mostrarMentores(mentoresFiltrados);
                });

                grid.appendChild(card);
            });

            // Filtrado con select
            select.addEventListener('change', () => {
                const selectedId = select.value;

                Array.from(grid.children).forEach(card => {
                    if (!selectedId || card.dataset.id === selectedId) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });

                grid.style.display = 'grid'; // ✅ Esto respeta el diseño de 3 por línea
                cursosContainer.style.display = 'block';
                mentoresContainer.style.display = 'none';
                mentoresTitle.style.display = 'none';
                btnVolver.style.display = 'none';
            });
        })
        .catch(error => console.error('Error cargando especialidades:', error));

    // Botón volver
    btnVolver.addEventListener('click', () => {
        mentoresContainer.style.display = 'none';
        mentoresTitle.style.display = 'none';
        btnVolver.style.display = 'none';

        cursosContainer.style.display = 'block';

        select.style.display = 'inline-block';
        select.disabled = false;
        select.value = '';

        // Mostrar todos los cuadros
        Array.from(grid.children).forEach(card => card.classList.remove('hidden'));
    });
});





// SECCION DE RAKING
document.addEventListener('DOMContentLoaded', () => {
    // === NAVEGACIÓN ENTRE SECCIONES ===
    const menuItems = document.querySelectorAll('li[data-section]');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-section');
            const allSections = document.querySelectorAll('section');
            allSections.forEach(sec => sec.style.display = 'none');

            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });

    // === MOSTRAR SECCIÓN RANKING POR DEFECTO ===

    const rankingSelect = document.getElementById("rankingSelect");
    const rankingCards = document.getElementById("rankingCards");
    const rankingGrid = document.getElementById("rankingGrid");

    // === CARGAR RANKING COMPLETO DESDE API (/rankingcompleto) ===
    function cargarRankingCompletoDesdeAPI() {
        fetch('/api/rankingcompleto')
            .then(response => response.json())
            .then(data => {
                rankingGrid.innerHTML = "";

                data.forEach((mentor, index) => {
                    const promedioRedondeado = Math.round(mentor.promedio || 0);
                    const estrellasLlenas = "★".repeat(promedioRedondeado);
                    const estrellasVacias = "★".repeat(5 - promedioRedondeado);

                    let colorClase = '';
                    if (index === 0) colorClase = 'oro';
                    else if (index === 1) colorClase = 'plata';
                    else if (index === 2) colorClase = 'cobre';
                    else colorClase = 'cobre';

                    const card = `
                        <div class="ranking-card">
                            <div class="card-header">
                                <img src="img/${mentor.imagen}" alt="${mentor.nombre}" class="champion-img" />
                                <div class="card-info">
                                    <h3>${mentor.nombre}</h3>
                                    <p class="especialidad">${mentor.especialidades}</p>
                                </div>
                            </div>
                            <p class="ranking-position ${colorClase}">${index + 1}° EN EL RANKING GENERAL</p>
                            <p class="rank-p">Promedio:</p>
                            <div class="stars">
                                ${estrellasLlenas.split('').map(() => '<span class="star filled">★</span>').join('')}
                                ${estrellasVacias.split('').map(() => '<span class="star">★</span>').join('')}
                            </div>
                        </div>
                    `;
                    rankingGrid.innerHTML += card;
                });
            })
            .catch(error => {
                console.error("Error al cargar el ranking (API):", error);
                rankingGrid.innerHTML = "<p>Error al cargar el ranking completo.</p>";
            });
    }

    // === CARGAR TOP 3 RANKING DESDE /api/rankings ===
    function cargarTop3DesdeAPI() {
        fetch('/api/rankings')
            .then(res => res.json())
            .then(data => {
                const rankingCards2 = document.getElementById("rankingCards2");
                rankingCards2.innerHTML = '';

                data.forEach((mentor, index) => {
                    const card = document.createElement('div');
                    card.className = 'champion-card';

                    const claseColor = index === 0 ? 'oro' : index === 1 ? 'plata' : 'cobre';

                    let colorClase = '';
                    if (index === 0) colorClase = 'chamoro';
                    else if (index === 1) colorClase = 'champlata';
                    else colorClase = 'chamcobre';


                    card.innerHTML = `
    <h3 class="champion-titulo2">${mentor.especialidades}</h3>
    <img src="img/${mentor.imagen}" alt="${mentor.nombre}" class="champion-img2 ${colorClase}" />
    <p class="champion-nombre2">${mentor.nombre}</p>
    <p class="champion-ranking2 ${claseColor}">${index + 1}° EN EL RANKING</p>
`;

                    rankingCards2.appendChild(card);
                });
            })
            .catch(err => {
                console.error('Error al cargar ranking (API):', err);
                rankingCards2.innerHTML = '<p>Error al cargar el ranking.</p>';
            });
    }

    // === EVENTO AL CAMBIAR CATEGORÍA (si aplicara) ===
    if (rankingSelect) {
        rankingSelect.addEventListener("change", function () {
            console.log("Categoría seleccionada:", this.value);
        });
    }

    // === LLAMADOS INICIALES ===
    cargarTop3DesdeAPI();            // Top 3
    cargarRankingCompletoDesdeAPI(); // Todos
});






window.addEventListener("click", (e) => {
    if (!toggleBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove("show");
    }
});

// Menú móvil - toggle sidebar, rightbar y contenido principal
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
const rightbar = document.getElementById("rightbar");
const mainContent = document.getElementById("main-content");

menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    rightbar.classList.toggle("active");

    mainContent.style.display = sidebar.classList.contains("active") ? "none" : "block";
});

// Mostrar la sección seleccionada desde el menú lateral
document.addEventListener("DOMContentLoaded", function () {
    const menuItems = document.querySelectorAll(".menu li[data-section]");
    const sections = document.querySelectorAll("#main-content .section");

    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            const sectionId = item.getAttribute("data-section");

            // Ocultar todas las secciones
            sections.forEach(section => {
                section.classList.remove("active");
            });

            // Mostrar la sección correspondiente
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add("active");
                mainContent.style.display = "block"; // Asegura que el contenedor main esté visible
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const avatar = document.getElementById("avatar");
    const userInfoBox = document.getElementById("user-info-box");
    const closeInfoButton = document.getElementById("close-info-button");

    // Mostrar u ocultar el cuadro al hacer clic en el avatar
    avatar.addEventListener("click", function () {
        if (userInfoBox.style.display === "none" || userInfoBox.classList.contains("hidden")) {
            userInfoBox.style.display = "block";
            userInfoBox.classList.remove("hidden");
        } else {
            userInfoBox.style.display = "none";
            userInfoBox.classList.add("hidden");
        }
    });

    // Botón para cerrar el cuadro manualmente
    closeInfoButton.addEventListener("click", function () {
        userInfoBox.style.display = "none";
        userInfoBox.classList.add("hidden");
    });

    // Opcional: cerrar el cuadro si se hace clic fuera de él
    document.addEventListener("click", function (event) {
        if (!userInfoBox.contains(event.target) && event.target !== avatar) {
            userInfoBox.style.display = "none";
            userInfoBox.classList.add("hidden");
        }
    });
});






// MUESTRA EL PROCEDIMIENTO DE LA SECCION MENTORES-AGENDA

function mostrarSeccionAgenda(idMentor, nombreMentor) {
    document.getElementById('agenda').style.display = 'block';
    document.getElementById('popular').style.display = 'none';
    document.getElementById('mentor-nombre').textContent = nombreMentor;

    // Obtener imagen del mentor
    fetch(`/api/mentor/${idMentor}`, { credentials: 'include' })
        .then(response => response.json())
        .then(mentor => {
            document.getElementById('mentor-imagen').src = `img/${mentor.imagen || 'por-defecto.jpg'}`;
        })
        .catch(error => {
            console.error('Error al obtener la imagen del mentor:', error);
        });

    // Obtener horarios disponibles
    fetch(`/api/disponibilidad-mentor/${idMentor}`, { credentials: 'include' })
        .then(response => response.json())
        .then(disponibilidades => {
            const horariosDiv = document.getElementById('mentor-horarios');
            horariosDiv.innerHTML = '<h3>Horarios Disponibles:</h3>';
            if (disponibilidades.length === 0) {
                horariosDiv.innerHTML += '<p>No hay horarios disponibles.</p>';
            } else {
                disponibilidades.forEach(dispo => {
                    const horario = document.createElement('p');
                    horario.textContent = `${dispo.nombre_dia}: ${dispo.hora_inicio} - ${dispo.hora_fin}`;
                    horariosDiv.appendChild(horario);
                });
            }
        })
        .catch(error => {
            console.error('Error al obtener los horarios del mentor:', error);
        });

    window.idMentorSeleccionado = idMentor;
}

document.getElementById('form-agenda').addEventListener('submit', function (e) {
    e.preventDefault();

    const dia = this.dia.value;
    const mes = this.mes.value;
    const hora = this.hora.value;

    // Usa el ID real del aprendiz desde sesión o variable global
    const aprendiz_id = window.usuarioId || 1; // Asegúrate de establecer esto correctamente

    fetch('/api/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mentor_id: window.idMentorSeleccionado,
            aprendiz_id,
            dia,
            mes,
            hora
        })
    })
        .then(res => res.json())
        .then(data => {
            alert('Sesión agendada con éxito');
            document.getElementById('agenda').style.display = 'none';
            document.getElementById('popular').style.display = 'block';
        })
        .catch(err => {
            alert('Error al agendar sesión');
            console.error(err);
        });
});








/*================== SECCIÓN DE AGENDAR DE MENTORES ==================*/
document.addEventListener("DOMContentLoaded", () => {
    const nombreInput = document.getElementById('mentor-nombre-input');
    const especialidadInput = document.getElementById('mentor-especialidad');
    const form = document.getElementById('mentor-agendar-form');

    // 1. Cargar datos del usuario logueado
    fetch('/api/user', { credentials: 'include' })
        .then(response => {
            if (!response.ok) throw new Error('No autorizado o error al obtener usuario');
            return response.json();
        })
        .then(user => {
            console.log('Usuario recibido:', user);
            nombreInput.value = user.nombre_completo || '';
            form.dataset.mentorId = user.id || '';

            // Cargar especialidad
            return fetch(`/api/mentor-especialidades/${user.id}`, { credentials: 'include' });
        })
        .then(res => {
            if (!res.ok) throw new Error('No se encontró especialidad');
            return res.json();
        })
        .then(data => {
            const select = document.getElementById('mentor-especialidad');
            select.innerHTML = '<option value="">Selecciona una especialidad</option>';

            data.forEach(esp => {
                const option = document.createElement('option');
                option.value = esp.especialidad_id;
                option.textContent = esp.especialidad;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error cargando usuario o especialidad:', error);
        });

    // 2. Cargar días disponibles
    fetch('/api/dias')
        .then(res => {
            if (!res.ok) throw new Error('Error cargando días');
            return res.json();
        })
        .then(data => {
            const diaSelect = document.getElementById('mentor-dia');
            data.forEach(dia => {
                const option = document.createElement('option');
                option.value = dia.id;
                option.textContent = dia.nombre_dia;
                diaSelect.appendChild(option);
            });
        })
        .catch(err => {
            console.error('Error cargando días:', err);
            alert('Error al cargar días disponibles.');
        });

    // 3. Cargar horarios disponibles
    fetch('/api/horarios')
        .then(res => {
            if (!res.ok) throw new Error('Error cargando horarios');
            return res.json();
        })
        .then(data => {
            const horarioSelect = document.getElementById('mentor-horario');
            data.forEach(horario => {
                const option = document.createElement('option');
                option.value = horario.id;
                option.textContent = `${horario.hora_inicio} - ${horario.hora_fin}`;
                horarioSelect.appendChild(option);
            });
        })
        .catch(err => {
            console.error('Error cargando horarios:', err);
            alert('Error al cargar horarios disponibles.');
        });

    // 4. Enviar formulario
    form.addEventListener('submit', e => {
        e.preventDefault();

        const mentor_id = form.dataset.mentorId;
        const especialidad_id = especialidadInput.value;
        const dia_id = document.getElementById('mentor-dia').value;
        const horario_id = document.getElementById('mentor-horario').value;

        if (!mentor_id || !especialidad_id) {
            alert('Faltan datos del mentor.');
            return;
        }

        fetch('/api/agendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ mentor_id, especialidad_id, dia_id, horario_id })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message || 'Disponibilidad registrada correctamente');

                // ✅ Solo reseteamos los campos que deben limpiarse
                document.getElementById('mentor-dia').value = '';
                document.getElementById('mentor-horario').value = '';
            })
            .catch(err => {
                console.error('Error al guardar disponibilidad:', err);
                alert('Error al guardar la disponibilidad.');
            });
    });





    // ================== SECCIÓN DE TOTAL HORARIOS ==================
    const cargarHorariosMentor = () => {
        fetch('/api/horarios-mentor', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const tbody = document.getElementById('tabla-horarios-body');
                tbody.innerHTML = '';

                data.forEach(h => {
                    const row = document.createElement('tr');
                    row.dataset.id = h.id;

                    row.innerHTML = `
                    <td>${h.dia}</td>
                    <td>${h.horario}</td>
                    <td>${h.especialidad}</td>
                    <td>
                        <button class="editar-btn" data-id="${h.id}">Editar</button>
                        <button class="eliminar-btn" data-id="${h.id}">Eliminar</button>
                    </td>
                `;

                    // Editar
                    row.querySelector('.editar-btn').addEventListener('click', () => {
                        document.getElementById('modal-editar-horario').classList.remove('oculto');
                        document.getElementById('editar-id').value = h.id;

                        cargarDiasYHorarios(() => {
                            document.getElementById('editar-dia').value = h.dia_id;
                            document.getElementById('editar-horario').value = h.horario_id;
                            document.getElementById('editar-especialidad').value = h.especialidad;
                        });
                    });

                    // Eliminar
                    row.querySelector('.eliminar-btn').addEventListener('click', () => {
                        if (confirm('¿Seguro que quieres eliminar este horario?')) {
                            fetch(`/api/horarios-mentor/${h.id}`, {
                                method: 'DELETE',
                                credentials: 'include'
                            })
                                .then(res => res.json())
                                .then(data => {
                                    alert(data.message || 'Horario eliminado');
                                    cargarHorariosMentor();
                                });
                        }
                    });

                    tbody.appendChild(row);
                });
            });
    };

    // ================== CARGAR DÍAS, HORARIOS Y ESPECIALIDADES ==================
    function cargarDiasYHorarios(callback) {
        const diaSelect = document.getElementById('editar-dia');
        const horarioSelect = document.getElementById('editar-horario');
        const especialidadSelect = document.getElementById('editar-especialidad');

        diaSelect.innerHTML = '';
        horarioSelect.innerHTML = '';
        especialidadSelect.innerHTML = '';

        fetch('/api/dias')
            .then(res => res.json())
            .then(dias => {
                dias.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.id;
                    opt.textContent = d.nombre_dia;
                    diaSelect.appendChild(opt);
                });

                return fetch('/api/horarios');
            })
            .then(res => res.json())
            .then(horarios => {
                horarios.forEach(h => {
                    const opt = document.createElement('option');
                    opt.value = h.id;
                    opt.textContent = `${h.hora_inicio} - ${h.hora_fin}`;
                    horarioSelect.appendChild(opt);
                });

                return fetch('/api/especialidades-mentor', { credentials: 'include' });
            })
            .then(res => res.json())
            .then(especialidades => {
                especialidades.forEach(e => {
                    const opt = document.createElement('option');
                    opt.value = e.nombre;
                    opt.textContent = e.nombre;
                    especialidadSelect.appendChild(opt);
                });

                if (callback) callback();
            })
            .catch(err => console.error('Error cargando datos:', err));
    }

    // ================== GUARDAR CAMBIOS ==================
    document.getElementById('form-editar-horario').addEventListener('submit', (e) => {
        e.preventDefault();

        const id = document.getElementById('editar-id').value;
        const especialidad = document.getElementById('editar-especialidad').value.trim();
        const dia_id = document.getElementById('editar-dia').value;
        const horario_id = document.getElementById('editar-horario').value;

        fetch(`/api/horarios-mentor/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ especialidad, dia_id, horario_id })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message || 'Horario actualizado');
                document.getElementById('modal-editar-horario').classList.add('oculto');
                cargarHorariosMentor();
            });
    });

    // ================== CERRAR MODAL ==================
    document.getElementById('cerrar-modal').addEventListener('click', () => {
        document.getElementById('modal-editar-horario').classList.add('oculto');
    });




    // ================== MANEJO DE NAVEGACIÓN ENTRE SECCIONES ==================
    const menuItems = document.querySelectorAll('.menu li');
    const secciones = document.querySelectorAll('section');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');

            secciones.forEach(seccion => {
                if (seccion.id === sectionId) {
                    seccion.classList.remove('seccion-oculta');

                    // Si entra a la sección de total horarios, cargar la tabla
                    if (sectionId === 'total-horarios') {
                        cargarHorariosMentor();
                    }

                } else {
                    seccion.classList.add('seccion-oculta');
                }
            });
        });
    });
});





/*SECCION DE SOLICITUDES*/
/*SECCION DE SOLICITUDES*/
document.addEventListener('DOMContentLoaded', function () {

    // Función para mostrar la sección activa
    function mostrarSeccion(id) {
        const secciones = document.querySelectorAll('.section');
        const botones = document.querySelectorAll('.menu li');

        secciones.forEach(seccion => seccion.style.display = 'none');
        botones.forEach(btn => btn.classList.remove('active'));

        const seccionActiva = document.getElementById(id);
        if (seccionActiva) {
            seccionActiva.style.display = 'block';
        }

        const botonActual = Array.from(botones).find(btn => btn.dataset.section === id);
        if (botonActual) botonActual.classList.add('active');
    }

    // SECCION DE SOLICITUDES

    const solicitudBtn = document.querySelector('li[data-section="solicitudes"]');
    const formSolicitud = document.getElementById('form-solicitud');

    if (solicitudBtn && formSolicitud) {

        solicitudBtn.addEventListener('click', () => {
            mostrarSeccion('solicitudes');
            const usuarioId = document.getElementById('userId').textContent;
            cargarSolicitudes(usuarioId); // ✅ Carga solicitudes del usuario actual
        });

        formSolicitud.addEventListener('submit', (e) => {
            e.preventDefault();

            const motivo = document.getElementById('motivo').value;
            const pedido = document.getElementById('pedido').value;
            const usuarioId = document.getElementById('userId').textContent;

            fetch('/api/enviarsolicitud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id: usuarioId,
                    motivo,
                    pedido
                })
            })
                .then(res => {
                    if (res.ok) {
                        alert('Solicitud enviada correctamente');
                        formSolicitud.reset();
                        cargarSolicitudes(usuarioId); // ✅ Refresca tabla
                    } else {
                        alert('Error al enviar la solicitud');
                    }
                })
                .catch(err => console.error('Error:', err));
        });

        function cargarSolicitudes(usuarioId) {
            fetch(`/api/solicitudes/${usuarioId}`)
                .then(res => res.json())
                .then(data => {
                    const tbody = document.querySelector('#tabla-solicitudes tbody');
                    tbody.innerHTML = '';

                    if (data.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="4">No hay solicitudes registradas.</td></tr>';
                        return;
                    }

                    data.forEach(solicitud => {
                        const fila = document.createElement('tr');
                        fila.innerHTML = `
                            <td>${solicitud.id}</td>
                            <td>${solicitud.motivo}</td>
                            <td>${solicitud.pedido}</td>
                            <td>${solicitud.resultado}</td>
                        `;
                        tbody.appendChild(fila);
                    });
                })
                .catch(err => console.error('Error al cargar solicitudes:', err));
        }
    }
});




document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/novedades')
        .then(res => res.json())
        .then(novedades => {
            const contenedor = document.getElementById('principal');
            contenedor.innerHTML = ''; // Limpia contenido anterior

            novedades.forEach(n => {
                const card = document.createElement('div');
                card.className = 'principal-card';

                card.innerHTML = `
                    <div class="principal-header">
                        <img src="/img/${n.imagen_autor}" alt="Mentor" class="profile-pic">
                        <span class="principal-name">${n.nombre_autor}</span>
                        <span class="dash">-</span>
                        <span class="principal-career">${n.carrera_autor}</span>
                        <button class="btn-unirse">Unirse</button>
                        <img src="img/puntos.png" alt="Icono" class="side-icon">
                    </div>
                    <div class="principal-description">
                        <p><strong>${n.titulo}</strong></p>
                        <p>${n.descripcion}</p>
                    </div>
                    <div class="principal-image">
                        <img src="/img/${n.imagen_contenido}" alt="Curso relacionado">
                    </div>
                `;

                contenedor.appendChild(card);
            });
        })
        .catch(err => {
            console.error('Error al cargar novedades:', err);
        });
});


document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/publicidad')
        .then(res => res.json())
        .then(publicidades => {
            const contenedor = document.getElementById('contenedor-publicidad');
            contenedor.innerHTML = '';

            publicidades.forEach(p => {
                const enlace = document.createElement('a');
                enlace.href = p.link_publi;
                enlace.target = '_blank';
                enlace.style.display = 'block';
                enlace.style.marginBottom = '10px';

                const img = document.createElement('img');
                img.src = `/img/${p.imagen_publi}`;
                img.alt = 'Publicidad';
                img.style.width = '100%';      // ajusta al ancho del aside
                img.style.height = 'auto';     // mantiene proporción

                enlace.appendChild(img);
                contenedor.appendChild(enlace);
            });
        })
        .catch(err => {
            console.error('Error cargando publicidad:', err);
        });
});


function confirmarCierreSesion() {
    const confirmacion = confirm("¿Desea salir de esta cuenta?");
    if (confirmacion) {
        // Cierra sesión y redirige al login
        window.location.href = "/login.html";
    }
}





function toggleNotificacionesMentor() {
    const panel = document.getElementById('panel-notificaciones-mentor');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function irAClasesMentor() {
    const clasesBtn = document.querySelector('[data-section="clases"]');
    if (clasesBtn) clasesBtn.click();
    toggleNotificacionesMentor();
}

function cargarNotificacionesHoyMentor() {
    fetch('/api/mis-clases-hoy-mentor')
        .then(res => res.json())
        .then(clases => {
            const contenedor = document.getElementById('lista-notificaciones-mentor');
            const contador = document.getElementById('contador-clases-mentor');

            if (clases.length > 0) {
                contador.textContent = clases.length;
                contador.style.display = 'inline';
                contenedor.innerHTML = '';

                clases.forEach(clase => {
                    const div = document.createElement('div');
                    div.classList.add('notificacion-item');

                    const horaInicio = clase.hora_inicio.slice(0, 5);
                    const horaFinal = clase.hora_final.slice(0, 5);
                    const fecha = clase.fecha.split('T')[0];

                    div.innerHTML = `
                        📌 Clase con <strong>${clase.aprendiz_nombre}</strong><br>
                        🕒 ${horaInicio} - ${horaFinal}<br>
                        📅 ${fecha}
                        <button onclick="irAClasesMentor()">Entrar a la reunión</button>
                    `;
                    contenedor.appendChild(div);
                });
            } else {
                contador.style.display = 'none';
                contenedor.innerHTML = `<p>Hoy no tienes clases programadas.</p>`;
            }
        })
        .catch(err => {
            console.error('Error al obtener notificaciones:', err);
        });
}

window.addEventListener('DOMContentLoaded', cargarNotificacionesHoyMentor);