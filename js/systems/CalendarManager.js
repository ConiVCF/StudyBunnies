import { Sanitizer } from '../utils/Sanitizer.js';

export class CalendarManager {
    constructor(gameManager) {
        this.game = gameManager;
        this.events = this.game.playerProfile.events || [];

        // Referencias DOM
        this.modal = document.getElementById('calendar-modal');
        this.btnOpen = document.getElementById('btn-calendar');
        this.btnClose = document.getElementById('btn-close-calendar');
        
        this.inputTitle = document.getElementById('event-title');
        this.inputType = document.getElementById('event-type');
        this.inputDate = document.getElementById('event-date');
        this.btnAdd = document.getElementById('btn-add-event');
        this.eventList = document.getElementById('event-list');

        this.setupEvents();
        this.renderEvents();
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

        this.btnAdd?.addEventListener('click', () => this.addEvent());
    }

    // 🌟 ARQUITECTURA PREPARADA PARA EL BACKEND DE FRANCO
    async saveEvents() {
        this.game.playerProfile.events = this.events;
        await this.game.saveSystem.saveData(this.game.playerProfile);
        // FUTURO: fetch('api/guardar_evento.php', { method: 'POST', body: JSON.stringify(newEvent) })
    }

    async addEvent() {
        const title = this.inputTitle.value.trim();
        const date = this.inputDate.value;
        const type = this.inputType.value;

        if (!title || !date) {
            alert("¡Faltan datos para agendar el evento!");
            return;
        }

        // Recolectar configuraciones de correo electrónico
        const checkboxes = document.querySelectorAll('.checkbox-grid input[type="checkbox"]:checked');
        const reminders = Array.from(checkboxes).map(cb => parseInt(cb.value));

        const newEvent = {
            id: Date.now().toString(),
            title: title,
            type: type,
            date: date,
            reminders: reminders // Ej: [7, 3, 1, 0]
        };

        this.events.push(newEvent);
        this.game.audio.playSFX('typing'); 
        
        // Limpiar formulario
        this.inputTitle.value = '';
        this.inputDate.value = '';
        
        await this.saveEvents();
        this.renderEvents();
    }

    async deleteEvent(id) {
        if (confirm("¿Estás segura de eliminar este evento de la agenda?")) {
            this.events = this.events.filter(e => e.id !== id);
            this.game.audio.playSFX('click');
            await this.saveEvents();
            this.renderEvents();
        }
    }

    renderEvents() {
        this.eventList.innerHTML = '';
        
        // Ordenar eventos por fecha más próxima
        const sortedEvents = [...this.events].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedEvents.forEach(event => {
            // Formatear la fecha para que se lea lindo (ej: 15 Jun)
            const dateObj = new Date(event.date + 'T00:00:00'); // Evita desfases de zona horaria
            const day = String(dateObj.getDate()).padStart(2, '0');
            const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const month = monthNames[dateObj.getMonth()];

            const li = document.createElement('li');
            li.className = `event-item type-${event.type}`;
            
            li.innerHTML = `
                <div class="event-info">
                    <h4>${Sanitizer.escapeHtml(event.title)}</h4>
                    <p>📌 ${Sanitizer.escapeHtml(event.type)} | 🔔 ${event.reminders.length} alertas act.</p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div class="event-date-badge">${day}<br>${month}</div>
                    <button class="btn-icon delete-btn" title="Eliminar">❌</button>
                </div>
            `;

            li.querySelector('.delete-btn').addEventListener('click', () => this.deleteEvent(event.id));
            this.eventList.appendChild(li);
        });
    }
}