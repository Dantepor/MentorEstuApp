let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let sesionesGlobal = [];

// Obtener datos del usuario logueado
fetch('/api/user')
    .then(response => {
        if (!response.ok) {
            window.location.href = '/login.html';
            throw new Error('No autorizado');
        }
        return response.json();
    })
    .then(user => {
        // Guardar en variables globales
        window.usuarioId = user.id;
        window.usuarioNombre = user.nombre_completo;

        // Mostrar en perfil pequeño
        document.getElementById('usuario').textContent = user.nombre_completo;
        document.getElementById('userNombre').textContent = user.nombre_completo;
        document.getElementById('userCorreo').textContent = user.correo;
        document.getElementById('userRol').textContent = user.rol_nombre;
        document.getElementById('userFecha').textContent = new Date(user.fecha_registro).toLocaleDateString();

        // Imagen de perfil
        const rutaImagen = user.imagen ? '/img/' + user.imagen : 'basicperfil.png';
        document.getElementById('avatarFoto').src = rutaImagen;
        document.getElementById('infoFoto').src = rutaImagen;
        document.getElementById('editFotoPreview').src = rutaImagen;

        // Prellenar campos del formulario
        document.getElementById('editNombre').value = user.nombre_completo;
        document.getElementById('editCorreo').value = user.correo;
    })
    .catch(error => {
        console.error(error);
        document.getElementById('usuario').textContent = 'Usuario';
    });

document.addEventListener('DOMContentLoaded', function () {
    const avatar = document.getElementById('avatarFoto');
    const infoBox = document.getElementById('user-info-box');
    const closeBtn = document.getElementById('close-info-button');

    // Mostrar info al hacer clic en avatar
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

    // Mostrar sección perfil
    const editBtn = document.getElementById('edit-button');
    editBtn.addEventListener('click', () => {
        document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
        document.getElementById('perfil').style.display = 'block';

        // Refrescar datos visibles en formulario
        document.getElementById('editNombre').value = document.getElementById('userNombre').textContent;
        document.getElementById('editCorreo').value = document.getElementById('userCorreo').textContent;
    });

    // Cancelar edición
    const cancelarBtn = document.getElementById('cancelarEditar');
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', () => {
            document.getElementById('perfil').style.display = 'none';
            document.getElementById('principal').style.display = 'block';
        });
    }

    // Previsualizar imagen al seleccionar archivo
    const inputImagen = document.getElementById('editImagen');
    const previewImagen = document.getElementById('editFotoPreview');

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

    // Enviar formulario de edición
    const formEditar = document.getElementById('formEditarPerfil');
    if (formEditar) {
        formEditar.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData();
            formData.append('nombre_completo', document.getElementById('editNombre').value);
            formData.append('correo', document.getElementById('editCorreo').value);

            const imagenFile = inputImagen.files[0];
            if (imagenFile) {
                formData.append('imagen', imagenFile);
            }

            fetch('/api/editar-perfil', {
                method: 'POST',
                body: formData,
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert('Perfil actualizado correctamente');
                        location.reload();
                    } else {
                        alert('Error al actualizar perfil');
                    }
                })
                .catch(err => {
                    console.error('Error al actualizar perfil:', err);
                    alert('Error del servidor');
                });
        });
    }
});




// Mostrar sección agenda con mentor seleccionado
function mostrarSeccionAgenda(id, nombre) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    const agendaSection = document.getElementById('agenda');
    agendaSection.style.display = 'block';
    document.getElementById('mentor-nombre').textContent = nombre;
    agendaSection.setAttribute('data-mentor-id', id);
}


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
            fetch('/api/mis-clases')
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

                // Ordenar por hora de inicio si es necesario
                sesionesDelDia.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

                // Mostrar solo la primera sesión en el recuadro del día
                const primera = sesionesDelDia[0];
                const horaInicio = primera.hora_inicio?.slice(0, 5) || '--:--';
                const horaFinal = primera.hora_final?.slice(0, 5) || '--:--';
                const titulo = primera.titulo || 'Clase';
                cell.innerHTML += `${horaInicio} - ${horaFinal}<br>${titulo}<br>`;

                // Tooltip con todas las sesiones
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

    const listaClases = document.getElementById('clases-container');
    const filtroSelect = document.getElementById('filtro-mentor');
    listaClases.innerHTML = '<p>Cargando clases...</p>';

    fetch('/api/mis-clases')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return response.json();
        })
        .then(clases => {
            listaClases.innerHTML = '';
            filtroSelect.innerHTML = '<option value="todos">Todos los mentores</option>';

            if (!Array.isArray(clases) || clases.length === 0) {
                listaClases.innerHTML = '<p class="claseshay" >No tienes clases agendadas.</p>';
                return;
            }

            // Obtener mentores únicos
            const mentoresUnicos = new Map();
            clases.forEach(clase => {
                if (!mentoresUnicos.has(clase.mentor_id)) {
                    mentoresUnicos.set(clase.mentor_id, clase.mentor_nombre);
                }
            });

            // Llenar select de mentores
            for (const [id, nombre] of mentoresUnicos) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = nombre;
                filtroSelect.appendChild(option);
            }

            // Mostrar todas por defecto
            renderizarClases(clases);

            // Agregar listener al select
            filtroSelect.onchange = () => {
                const seleccionado = filtroSelect.value;
                if (seleccionado === "todos") {
                    renderizarClases(clases);
                } else {
                    const filtradas = clases.filter(c => c.mentor_id == seleccionado);
                    renderizarClases(filtradas);
                }
            };
        })
        .catch(error => {
            console.error('Error al cargar clases:', error);
            listaClases.innerHTML = '<p>Error al cargar clases.</p>';
        });
}

function renderizarClases(clases) {
    const listaClases = document.getElementById('clases-container');
    listaClases.innerHTML = '';

    const ahora = Date.now();

    clases.forEach(clase => {
        const div = document.createElement('div');
        div.className = 'clase-card';

        const estado = clase.estado ? clase.estado.charAt(0).toUpperCase() + clase.estado.slice(1) : 'Desconocido';
        const fechaFormateada = clase.fecha ? new Date(clase.fecha).toLocaleDateString() : 'Sin fecha';
        const horaInicio = clase.hora_inicio ? clase.hora_inicio.slice(0, 5) : '--:--';
        const horaFinal = clase.hora_final ? clase.hora_final.slice(0, 5) : '--:--';

        const puedeEntrar =
            clase.estado === 'confirmada' &&
            clase.timestamp_inicio &&
            clase.timestamp_final &&
            ahora >= clase.timestamp_inicio &&
            ahora <= clase.timestamp_final;

        let contenidoBoton = '';
        if (clase.estado === 'confirmada') {
            if (puedeEntrar) {
                // CAMBIO: ahora es un enlace a reunion.html con el id de la clase
                contenidoBoton = `<button class="btn-entrar" onclick="window.open('reunion.html?id=${clase.id}', '_blank')">Entrar a la clase</button>`;
            } else {
                contenidoBoton = `<p style="color: green; font-weight: bold;">🕒 Esperar la hora indicada</p>`;
            }
        }

        div.innerHTML = `
        <h3>👨‍🏫 Sesión con mentor ${clase.mentor_nombre || 'N/D'}</h3>
        <p><strong>Fecha:</strong> ${fechaFormateada}<br>
        <strong>Hora:</strong> ${horaInicio} - ${horaFinal}<br>
        <strong>Estado:</strong> ${estado}</p>
        ${contenidoBoton}
    `;

        listaClases.appendChild(div);
    });
}





function cerrarReunion() {
    document.getElementById('reunion').style.display = 'none';
    mostrarSeccionClases();
}

document.addEventListener('DOMContentLoaded', () => {
    const clasesMenu = document.querySelector('[data-section="clases"]');
    if (clasesMenu) {
        clasesMenu.addEventListener('click', mostrarSeccionClases);
    }
});







// DESPLEGABLE DE SECCION POPULAR DE MENTORES
// DESPLEGABLE DE SECCION POPULAR DE MENTORES
document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('curso-filter');
    const grid = document.getElementById('cursos-grid');
    const cursosContainer = document.querySelector('.cursos-container');
    const mentoresContainer = document.getElementById('mentores-container');
    const mentoresTitle = document.getElementById('mentores-title');
    const btnVolver = document.getElementById('btn-volver');
    const btnRetroceder = document.getElementById('btn-retroceder'); // nuevo
    const seccionPopular = document.querySelector('.section-clasespopular'); // nuevo
    const seccionAgenda = document.getElementById('agenda'); // nuevo

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
                img.src = `/img/${especialidad.imagen_espe}`;
                img.alt = especialidad.nombre;

                const titulo = document.createElement('div');
                titulo.classList.add('curso-titulo');
                titulo.textContent = especialidad.nombre;

                card.appendChild(img);
                card.appendChild(titulo);

                card.addEventListener('click', () => {
                    cursosContainer.style.display = 'none';
                    mentoresTitle.style.display = 'block';
                    mentoresContainer.style.display = 'grid';
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

                grid.style.display = 'grid';
                cursosContainer.style.display = 'block';
                mentoresContainer.style.display = 'none';
                mentoresTitle.style.display = 'none';
                btnVolver.style.display = 'none';
            });
        })
        .catch(error => console.error('Error cargando especialidades:', error));

    // Botón volver (de mentores a especialidades)
    btnVolver.addEventListener('click', () => {
        cursosContainer.style.display = 'block';
        mentoresContainer.style.display = 'none';
        mentoresTitle.style.display = 'none';
        btnVolver.style.display = 'none';
        select.style.display = 'inline-block';
        select.disabled = false;
        select.value = '';
        Array.from(grid.children).forEach(card => card.classList.remove('hidden'));
    });

    // NUEVO: Botón ← Volver desde agenda a sección popular
    btnRetroceder.addEventListener('click', () => {
        seccionAgenda.style.display = 'none';
        seccionPopular.style.display = 'block';
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





// Cargar los horarios disponibles desde la base de datos
function cargarHorariosDisponibles() {
    fetch('/api/horarios')
        .then(res => res.json())
        .then(horarios => {
            const select = document.getElementById('horario');
            select.innerHTML = '<option value="">Selecciona un horario</option>';
            horarios.forEach(h => {
                const option = document.createElement('option');
                option.value = `${h.hora_inicio}|${h.hora_fin}`;
                option.textContent = `${h.hora_inicio} - ${h.hora_fin}`;
                select.appendChild(option);
            });
        })
        .catch(err => console.error('Error cargando horarios:', err));
}





// Enviar los datos del formulario para agendar sesión
document.getElementById('form-agenda').addEventListener('submit', function (e) {
    e.preventDefault();

    const fecha = this.fecha.value;
    const [hora_inicio, hora_final] = this.horario.value.split('|');

    // Obtener el ID del usuario logueado desde window.usuarioId
    const aprendiz_id = window.usuarioId;

    if (!aprendiz_id) {
        alert('Error: no se pudo obtener el ID del usuario logueado.');
        return;
    }

    fetch('/api/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mentor_id: window.idMentorSeleccionado,
            aprendiz_id,
            fecha,
            hora_inicio,
            hora_final
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

// Llamar a la función para cargar horarios
cargarHorariosDisponibles();








window.addEventListener("message", async (event) => {
    if (event.data && event.data.tipo === "sesion-finalizada") {
        const sesionId = event.data.sesionId;
        console.log("📩 Recibido mensaje de sesión finalizada:", sesionId);

        try {
            const res = await fetch(`/api/detalle-sesion?id=${sesionId}`, { credentials: 'include' });
            const data = await res.json();

            document.getElementById('titulo-sesion-feedback').textContent =
                `¿Qué te pareció la sesión con ${data.mentor}? ¡Califícanos!`;

            renderizarEstrellas();
            document.getElementById('modal-feedback').dataset.sesionId = sesionId;
            document.getElementById('modal-feedback').style.display = 'block';
        } catch (err) {
            console.error("❌ Error al cargar datos de la sesión:", err);
        }
    }
});


function renderizarEstrellas() {
    const contenedor = document.getElementById("estrellas");
    contenedor.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
        const estrella = document.createElement("span");
        estrella.textContent = "★";
        estrella.style.fontSize = "30px";
        estrella.style.cursor = "pointer";
        estrella.style.color = "#ccc";
        estrella.dataset.valor = i;

        estrella.addEventListener('mouseover', () => {
            pintarEstrellas(i);
        });
        estrella.addEventListener('click', () => {
            contenedor.dataset.valorSeleccionado = i;
        });

        contenedor.appendChild(estrella);
    }
}

function pintarEstrellas(valor) {
    const estrellas = document.querySelectorAll("#estrellas span");
    estrellas.forEach((el, i) => {
        el.style.color = i < valor ? "#f39c12" : "#ccc";
    });
}

function enviarFeedback() {
    const estrellas = document.getElementById("estrellas").dataset.valorSeleccionado;
    const comentario = document.getElementById("comentario").value;
    const sesionId = document.getElementById("modal-feedback").dataset.sesionId;

    if (!estrellas) {
        alert("Selecciona una calificación.");
        return;
    }

    fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            sesion_id: sesionId,
            calificacion: estrellas,
            comentario
        })
    })
        .then(res => {
            if (res.ok) {
                alert("¡Gracias por tu opinión!");
                document.getElementById("modal-feedback").style.display = 'none';
            } else {
                alert("Error al guardar la calificación.");
            }
        });
}




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
                    console.log('🔍 Datos enviados:', {
                        usuario_id: usuarioId,
                        motivo,
                        pedido
                    });

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


// Mostrar/ocultar panel
function toggleNotificaciones() {
    const panel = document.getElementById('panel-notificaciones');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}


function cargarNotificacionesHoy() {
    fetch('/api/mis-clases-hoy')
        .then(res => res.json())
        .then(clases => {
            const contenedor = document.getElementById('lista-notificaciones');
            const contador = document.getElementById('contador-clases');

            if (clases.length > 0) {
                contador.textContent = clases.length;
                contador.style.display = 'inline';
                contenedor.innerHTML = '';

                clases.forEach(clase => {
                    const div = document.createElement('div');
                    div.classList.add('notificacion-item');

                    // Formato limpio de hora y fecha
                    const horaInicio = clase.hora_inicio.slice(0, 5); // "HH:MM"
                    const horaFinal = clase.hora_final.slice(0, 5);
                    const fecha = clase.fecha.split('T')[0]; // "YYYY-MM-DD"

                    div.innerHTML = `
                        📌 No olvides tu clase con <strong>${clase.mentor_nombre}</strong><br>
                        🕒 ${horaInicio} - ${horaFinal}<br>
                        📅 ${fecha}
                        <button onclick="irAClases()">Entrar a la reunión</button>
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

function irAClases() {
    const clasesBtn = document.querySelector('[data-section="clases"]');
    if (clasesBtn) clasesBtn.click();
    toggleNotificaciones();
}

window.addEventListener('DOMContentLoaded', cargarNotificacionesHoy);