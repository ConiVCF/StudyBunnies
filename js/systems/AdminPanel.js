// js/systems/AdminPanel.js
// Lógica del panel de Administrador. Es una página propia (no forma parte
// del motor del juego), por eso es un script normal y no un módulo ES6.

document.addEventListener('DOMContentLoaded', () => {
    const selectUsuario = document.getElementById('admin-select-usuario');
    const inputTarea = document.getElementById('admin-input-tarea');
    const btnCrear = document.getElementById('admin-btn-crear');
    const cuerpoTabla = document.getElementById('admin-tabla-body');
    const mensaje = document.getElementById('admin-mensaje');

    const inputSearch = document.getElementById('admin-search-input');
    const btnSearch = document.getElementById('admin-btn-search');
    const btnClearSearch = document.getElementById('admin-btn-clear-search');

    function mostrarMensaje(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = tipo; // 'ok' o 'error'
        setTimeout(() => {
            mensaje.textContent = '';
            mensaje.className = '';
        }, 4000);
    }

    // 🌟 Reemplazo de confirm() nativo por un modal propio con la misma
    // paleta "cozy" del resto del sitio (ver estilos en admin.css).
    // AdminPanel.js es un script clásico (no módulo ES6) por eso no
    // reutiliza UIDialog.js del juego; es un mini-equivalente autocontenido.
    let confirmOverlay = null;
    function confirmarAccion(texto) {
        if (!confirmOverlay) {
            confirmOverlay = document.createElement('div');
            confirmOverlay.className = 'admin-confirm-overlay hidden';
            confirmOverlay.innerHTML = `
                <div class="admin-confirm-box">
                    <p id="admin-confirm-texto"></p>
                    <div class="admin-confirm-actions">
                        <button type="button" id="admin-confirm-no">No</button>
                        <button type="button" id="admin-confirm-si">Sí</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmOverlay);
        }

        return new Promise((resolve) => {
            confirmOverlay.querySelector('#admin-confirm-texto').textContent = texto;
            const btnSi = confirmOverlay.querySelector('#admin-confirm-si');
            const btnNo = confirmOverlay.querySelector('#admin-confirm-no');

            const cerrar = (resultado) => {
                confirmOverlay.classList.add('hidden');
                btnSi.removeEventListener('click', onSi);
                btnNo.removeEventListener('click', onNo);
                resolve(resultado);
            };
            const onSi = () => cerrar(true);
            const onNo = () => cerrar(false);

            btnSi.addEventListener('click', onSi);
            btnNo.addEventListener('click', onNo);
            confirmOverlay.classList.remove('hidden');
            btnSi.focus();
        });
    }

    async function cargarUsuarios() {
        try {
            const res = await fetch('admin_ajax.php?accion=listar_usuarios', { credentials: 'same-origin' });
            const usuarios = await res.json();

            selectUsuario.innerHTML = '';
            usuarios.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id_usuario;
                opt.textContent = u.nombre_usuario;
                selectUsuario.appendChild(opt);
            });
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        }
    }

    async function cargarMisiones() {
        try {
            const res = await fetch('admin_ajax.php?accion=listar_misiones', { credentials: 'same-origin' });
            const misiones = await res.json();
            renderTabla(misiones);
        } catch (error) {
            console.error('Error cargando misiones:', error);
        }
    }

    function renderTabla(misiones) {
        cuerpoTabla.innerHTML = '';

        misiones.forEach(m => {
            const completada = Number(m.estado_completado) === 1;

            const tr = document.createElement('tr');
            tr.className = completada ? 'completada' : '';

            const tdUsuario = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = 'badge-usuario';
            badge.textContent = m.nombre_usuario;
            tdUsuario.appendChild(badge);

            const tdTarea = document.createElement('td');
            tdTarea.textContent = m.texto_tarea;

            const tdEstado = document.createElement('td');
            tdEstado.textContent = completada ? 'Completada' : 'Pendiente';

            const tdAcciones = document.createElement('td');
            tdAcciones.className = 'acciones-fila';

            const btnToggle = document.createElement('button');
            btnToggle.textContent = completada ? '↩️' : '✅';
            btnToggle.title = 'Cambiar estado';
            btnToggle.addEventListener('click', () => actualizarEstado(m.id_mision, !completada));

            const btnBorrar = document.createElement('button');
            btnBorrar.textContent = '🗑️';
            btnBorrar.className = 'btn-borrar';
            btnBorrar.title = 'Eliminar';
            btnBorrar.addEventListener('click', () => eliminarMision(m.id_mision));

            tdAcciones.appendChild(btnToggle);
            tdAcciones.appendChild(btnBorrar);

            tr.appendChild(tdUsuario);
            tr.appendChild(tdTarea);
            tr.appendChild(tdEstado);
            tr.appendChild(tdAcciones);

            cuerpoTabla.appendChild(tr);
        });
    }

    async function crearMision() {
        const idUsuario = selectUsuario.value;
        const texto = inputTarea.value.trim();

        if (!idUsuario) {
            mostrarMensaje('Elegí a qué usuario asignarle la tarea.', 'error');
            return;
        }
        if (!texto) {
            mostrarMensaje('La tarea no puede estar vacía.', 'error');
            return;
        }

        const datos = new FormData();
        datos.append('accion', 'crear_mision');
        datos.append('id_usuario', idUsuario);
        datos.append('tarea', texto);

        try {
            const res = await fetch('admin_ajax.php', {
                method: 'POST',
                credentials: 'same-origin',
                body: datos
            });
            const data = await res.json();

            if (data.ok) {
                inputTarea.value = '';
                mostrarMensaje('Misión creada correctamente.', 'ok');
                await cargarMisiones();
            } else {
                mostrarMensaje(data.error || 'No se pudo crear la misión.', 'error');
            }
        } catch (error) {
            console.error(error);
            mostrarMensaje('Error de conexión.', 'error');
        }
    }

    async function actualizarEstado(idMision, nuevoEstado) {
        const datos = new FormData();
        datos.append('accion', 'actualizar_estado');
        datos.append('id_mision', idMision);
        datos.append('completado', nuevoEstado ? '1' : '0');

        try {
            const res = await fetch('admin_ajax.php', {
                method: 'POST',
                credentials: 'same-origin',
                body: datos
            });
            const data = await res.json();

            if (data.ok) {
                await cargarMisiones();
            } else {
                mostrarMensaje('No se pudo actualizar la misión.', 'error');
            }
        } catch (error) {
            console.error(error);
            mostrarMensaje('Error de conexión.', 'error');
        }
    }

    async function eliminarMision(idMision) {
        if (!(await confirmarAccion('¿Eliminar esta misión?'))) return;

        const datos = new FormData();
        datos.append('accion', 'eliminar_mision');
        datos.append('id_mision', idMision);

        try {
            const res = await fetch('admin_ajax.php', {
                method: 'POST',
                credentials: 'same-origin',
                body: datos
            });
            const data = await res.json();

            if (data.ok) {
                mostrarMensaje('Misión eliminada.', 'ok');
                await cargarMisiones();
            } else {
                mostrarMensaje('No se pudo eliminar la misión.', 'error');
            }
        } catch (error) {
            console.error(error);
            mostrarMensaje('Error de conexión.', 'error');
        }
    }

    async function buscarMisiones() {
        const termino = inputSearch.value.trim();

        if (!termino) {
            await cargarMisiones();
            return;
        }

        try {
            const res = await fetch(`admin_ajax.php?accion=buscar_misiones&q=${encodeURIComponent(termino)}`, {
                credentials: 'same-origin'
            });
            const misiones = await res.json();
            renderTabla(misiones);
        } catch (error) {
            console.error('Error buscando misiones:', error);
            mostrarMensaje('Error de conexión al buscar.', 'error');
        }
    }

    btnCrear.addEventListener('click', crearMision);
    btnSearch.addEventListener('click', buscarMisiones);
    inputSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarMisiones();
    });
    btnClearSearch.addEventListener('click', () => {
        inputSearch.value = '';
        cargarMisiones();
    });

    cargarUsuarios();
    cargarMisiones();
});
