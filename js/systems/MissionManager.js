import { Sanitizer } from '../utils/Sanitizer.js';

export class MissionManager {
    constructor(gameManager) {
        this.game = gameManager;
        this.missions = []; // se completa en cargarMisiones()

        // Referencias del DOM
        this.modal = document.getElementById('mission-modal');
        this.btnOpen = document.getElementById('btn-missions');
        this.btnClose = document.getElementById('btn-close-missions');
        
        this.inputNew = document.getElementById('new-mission-input');
        this.btnAdd = document.getElementById('btn-add-mission');
        this.missionList = document.getElementById('mission-list');
        this.counterDisplay = document.getElementById('mission-counter');

        // 🌟 Buscador (el HTML ya existía, faltaba conectarlo)
        this.inputSearch = document.getElementById('mission-search-input');
        this.btnSearch = document.getElementById('btn-search-mission');
        this.btnClearSearch = document.getElementById('btn-clear-search-mission');

        this.setupEvents();
        this.init();
    }

    // 🌟 Carga inicial: trae las misiones reales desde MySQL y recién ahí dibuja.
    async init() {
        await this.cargarMisiones();
        this.renderMissions();
    }

    async cargarMisiones() {
        if (!window.SESION_PHP?.activa) {
            // No debería pasar dentro del juego, pero por las dudas no rompemos nada
            this.missions = this.game.playerProfile.missions || [];
            return;
        }

        try {
            const respuesta = await fetch('listar_misiones.php', {
                credentials: 'same-origin'
            });

            if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

            const filas = await respuesta.json();
            this.missions = filas.map(fila => ({
                id: fila.id_mision,
                text: fila.texto_tarea,
                completed: Number(fila.estado_completado) === 1
            }));

            // Guardamos una copia local por si se cae la conexión más adelante
            this.game.playerProfile.missions = this.missions;
            await this.game.saveSystem.saveData(this.game.playerProfile);
        } catch (error) {
            console.error("No se pudieron cargar las misiones desde la base de datos:", error);
            // Fallback: mostramos lo último que teníamos guardado localmente
            this.missions = this.game.playerProfile.missions || [];
        }
    }

    setupEvents() {
        this.btnOpen?.addEventListener('click', () => {
            this.game.audio.playSFX('click');
            this.modal.classList.remove('hidden');
        });

        this.btnClose?.addEventListener('click', () => {
            this.game.audio.playSFX('click');
            this.modal.classList.add('hidden');
        });

        this.btnAdd?.addEventListener('click', () => this.addMission());
        
        this.inputNew?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addMission();
        });

        // 🌟 Buscador
        this.btnSearch?.addEventListener('click', () => this.buscarMisiones());

        this.inputSearch?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.buscarMisiones();
        });

        this.btnClearSearch?.addEventListener('click', () => {
            this.inputSearch.value = '';
            this.renderMissions();
        });
    }

    // Busca en las misiones del usuario logueado, contra MySQL (no en memoria).
    async buscarMisiones() {
        const termino = this.inputSearch.value.trim();

        if (!termino) {
            this.renderMissions();
            return;
        }

        try {
            const respuesta = await fetch(`buscar_misiones.php?q=${encodeURIComponent(termino)}`, {
                credentials: 'same-origin'
            });

            if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

            const filas = await respuesta.json();
            const resultados = filas.map(fila => ({
                id: fila.id_mision,
                text: fila.texto_tarea,
                completed: Number(fila.estado_completado) === 1
            }));

            this.renderMissions(resultados);
        } catch (error) {
            console.error("Error buscando misiones:", error);
        }
    }

    // 🌟 ARQUITECTURA PREPARADA PARA BACKEND
    async saveMissions() {
        this.game.playerProfile.missions = this.missions;
        await this.game.saveSystem.saveData(this.game.playerProfile);
        // NOTA PARA EL FUTURO: Aquí Franco podrá inyectar un fetch('api/save_missions.php')
    }

    // 🌟 AQUÍ ESTÁ LA NUEVA CONEXIÓN AL PHP
    async addMission() {
        const text = this.inputNew.value.trim();
        if (!text) return;

        const usuarioActual = window.SESION_PHP?.nombre;

        // Verificamos que haya una sesión real de PHP activa
        if (!window.SESION_PHP?.activa || !usuarioActual) {
            alert("¡Debes iniciar sesión para guardar misiones en la base de datos!");
            return;
        }

        // Preparamos el "paquete" de datos para enviarle a PHP
        const datos = new FormData();
        datos.append('usuario', usuarioActual);
        datos.append('tarea', text);

        try {
            // Enviamos los datos por debajo de la mesa a guardar_mision.php
            const respuesta = await fetch('guardar_mision.php', {
                method: 'POST',
                credentials: 'same-origin', // 🌟 manda la cookie PHPSESSID
                body: datos
            });
            
            const resultado = await respuesta.text();

            // Si PHP nos confirma que el INSERT funcionó...
            if (resultado.startsWith("Exito")) {
                console.log("¡Misión guardada en MySQL!");

                // El id real viene del servidor: "Exito|14"
                const idReal = resultado.split('|')[1];

                const newMission = {
                    id: idReal ? Number(idReal) : Date.now(),
                    text: text,
                    completed: false
                };

                this.missions.push(newMission);
                this.inputNew.value = '';
                this.game.audio.playSFX('typing'); 
                
                await this.saveMissions();
                this.renderMissions();
            } else {
                console.error("Error del servidor:", resultado);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        }
    }

    async toggleMission(id) {
        const mission = this.missions.find(m => m.id === id);
        if (!mission) return;

        const nuevoEstado = !mission.completed;

        try {
            const datos = new FormData();
            datos.append('id_mision', id);
            datos.append('completado', nuevoEstado ? '1' : '0');

            const respuesta = await fetch('actualizar_mision.php', {
                method: 'POST',
                credentials: 'same-origin',
                body: datos
            });

            const resultado = await respuesta.text();

            if (!resultado.startsWith("Exito")) {
                console.error("No se pudo actualizar la misión en la base de datos:", resultado);
                return; // no tocamos la pantalla si el servidor no confirmó el cambio
            }

            mission.completed = nuevoEstado;

            // Recompensa en EXP si se completó (¡TU LÓGICA INTACTA!)
            if (mission.completed) {
                this.game.audio.playSFX('step'); // Sonido de recompensa
                this.game.addExperience(15); // ¡Ganamos 15 de EXP por tarea real!
            } else {
                this.game.audio.playSFX('click');
            }

            await this.saveMissions();
            this.renderMissions();
        } catch (error) {
            console.error("Error de conexión al actualizar la misión:", error);
        }
    }

    async deleteMission(id) {
        if (!confirm("¿Eliminar este post-it?")) return;

        try {
            const datos = new FormData();
            datos.append('id_mision', id);

            const respuesta = await fetch('eliminar_mision.php', {
                method: 'POST',
                credentials: 'same-origin',
                body: datos
            });

            const resultado = await respuesta.text();

            if (!resultado.startsWith("Exito")) {
                console.error("No se pudo eliminar la misión en la base de datos:", resultado);
                return;
            }

            this.missions = this.missions.filter(m => m.id !== id);
            this.game.audio.playSFX('click');
            await this.saveMissions();
            this.renderMissions();
        } catch (error) {
            console.error("Error de conexión al eliminar la misión:", error);
        }
    }

    renderMissions(listaOverride = null) {
        const lista = listaOverride ?? this.missions;
        this.missionList.innerHTML = '';

        // Ordenamos: pendientes arriba, completadas abajo
        const sortedMissions = [...lista].sort((a, b) => a.completed - b.completed);

        sortedMissions.forEach(mission => {
            const li = document.createElement('li');
            li.className = `mission-item ${mission.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <span class="mission-text">${Sanitizer.escapeHtml(mission.text)}</span>
                <div class="mission-actions">
                    <button class="btn-icon check-btn" title="Marcar como lista">${mission.completed ? '↩️' : '✅'}</button>
                    <button class="btn-icon delete-btn" title="Tirar a la basura">🗑️</button>
                </div>
            `;

            // Eventos de los botones individuales
            li.querySelector('.check-btn').addEventListener('click', () => this.toggleMission(mission.id));
            li.querySelector('.delete-btn').addEventListener('click', () => this.deleteMission(mission.id));

            this.missionList.appendChild(li);
        });

        // El contador siempre muestra el total real, no la cantidad de resultados filtrados
        const totalCompletadas = this.missions.filter(m => m.completed).length;
        this.counterDisplay.innerText = `${totalCompletadas}/${this.missions.length} Tareas Logradas`;
    }
}