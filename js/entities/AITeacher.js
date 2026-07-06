import { APIManager } from '../systems/APIManager.js';

import { Sanitizer } from '../utils/Sanitizer.js';
import { UIDialog } from '../systems/UIDialog.js';

export class AITeacher {
    constructor() {
        this.api = new APIManager();
        this.chatHistory = document.getElementById('chatHistory');
        this.inputField = document.getElementById('aiInput');
        
        // 🌟 Elementos Multimodales
        this.btnAttach = document.getElementById('btn-attach');
        this.fileInput = document.getElementById('aiAttachment');
        this.attachmentPreview = document.getElementById('attachment-preview');
        this.attachmentName = document.getElementById('attachment-name');
        this.btnRemoveAttachment = document.getElementById('btn-remove-attachment');

        // 🌟 Modo Quiz (opción múltiple) — opcional: si el botón no existe en el HTML,
        // el resto del chat sigue funcionando igual (no rompe la inicialización).
        this.btnQuiz = document.getElementById('btn-quiz');

        // 🌟 Elementos de Accesibilidad
        this.btnTxtMinus = document.getElementById('btn-txt-minus');
        this.btnTxtPlus = document.getElementById('btn-txt-plus');
        this.sliderTxtSize = document.getElementById('slider-txt-size');

        this.isThinking = false;
        this.conversationHistory = [];
        this.currentAttachment = null; 
        this.MAX_ATTACHMENT_MB = 5; // 🌟 límite de tamaño para adjuntos del chat IA

        // 🌟 Cargar preferencias del usuario al iniciar
        this.fontSize = parseInt(localStorage.getItem('cozy_chat_font_size')) || 10;
        this.updateFontSize(this.fontSize);

        this.setupEvents();
        this.cargarHistorial();
    }

    // 🌟 Memoria: trae los últimos mensajes guardados en MySQL, los pinta en
    // el chat y los precarga en conversationHistory para que Gemini tenga
    // contexto real desde el primer mensaje de esta sesión.
    async cargarHistorial() {
        if (!window.SESION_PHP?.activa) return;

        try {
            const respuesta = await fetch('listar_chat.php', { credentials: 'same-origin' });
            if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

            const mensajes = await respuesta.json();
            if (!Array.isArray(mensajes) || mensajes.length === 0) return;

            mensajes.forEach(msg => {
                this.appendMessage(msg.rol === 'user' ? 'user' : 'ai', msg.mensaje);
                this.conversationHistory.push({
                    role: msg.rol,
                    parts: [{ text: msg.mensaje }]
                });
            });
        } catch (error) {
            console.error("No se pudo cargar el historial de chat guardado:", error);
        }
    }

    setupEvents() {
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.inputField.value.trim() !== '' && !this.isThinking) {
                this.handleUserMessage(this.inputField.value.trim());
            }
        });

        // 🌟 Pequeño feedback sonoro mientras se escribe
        this.inputField.addEventListener('input', () => {
            window.dispatchEvent(new CustomEvent('playSFX', { detail: 'write' }));
        });

        this.btnAttach.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) this.processFile(e.target.files[0]);
        });
        this.btnRemoveAttachment.addEventListener('click', () => this.clearAttachment());

        // 🌟 Botón "Ponme a prueba" (modo quiz) — opcional
        this.btnQuiz?.addEventListener('click', () => this.requestQuiz());

        // 🌟 Eventos de Ajuste de Texto
        this.btnTxtMinus.addEventListener('click', () => this.updateFontSize(this.fontSize - 1));
        this.btnTxtPlus.addEventListener('click', () => this.updateFontSize(this.fontSize + 1));
        this.sliderTxtSize.addEventListener('input', (e) => this.updateFontSize(parseInt(e.target.value)));
    }

    // 🌟 NUEVO: Lógica de Accesibilidad Visual
    updateFontSize(size) {
        // Límites de legibilidad y diseño
        if (size < 8) size = 8;
        if (size > 24) size = 24;
        
        this.fontSize = size;
        if (this.sliderTxtSize) this.sliderTxtSize.value = size;
        
        // Inyectamos la variable CSS directamente en la caja de chat
        document.getElementById('aiChat').style.setProperty('--chat-font-size', `${size}px`);
        
        // Persistencia para futuras sesiones
        localStorage.setItem('cozy_chat_font_size', size);
        this.scrollToBottom(); 
    }

    // 🌟 Transforma PDFs e Imágenes a formato legible por la IA
    processFile(file) {
        const maxBytes = this.MAX_ATTACHMENT_MB * 1024 * 1024;

        if (file.size > maxBytes) {
            const pesoMB = (file.size / (1024 * 1024)).toFixed(1);
            UIDialog.alert(
                `Ese archivo pesa ${pesoMB} MB y el límite es de ${this.MAX_ATTACHMENT_MB} MB. Probá con uno más liviano o recortá el PDF. 📎`,
                '⚠️'
            );
            this.fileInput.value = ''; // 🌟 limpiamos para que puedas volver a elegir
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result.split(',')[1]; 
            
            this.currentAttachment = {
                mimeType: file.type,
                data: base64Data
            };

            // Muestra el nombre en el cartelito UI
            const name = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name;
            this.attachmentName.innerText = `📄 ${name}`;
            this.attachmentPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    clearAttachment() {
        this.currentAttachment = null;
        this.fileInput.value = ''; 
        this.attachmentPreview.classList.add('hidden');
    }

    async handleUserMessage(message) {
        const displayMessage = this.currentAttachment ? `📎 [Archivo adjunto]\n${message}` : message;
        this.appendMessage('user', displayMessage);
        
        this.inputField.value = '';
        this.isThinking = true;
        this.inputField.disabled = true;
        this.btnAttach.disabled = true; 
        this.inputField.placeholder = "El Michi está leyendo...";
        const loadingId = this.appendTypingIndicator();

        // 🌟 Avisamos al resto del juego que el profesor está pensando,
        // para que el conejo deje de caminar y se quede atento (Player.js escucha esto).
        window.dispatchEvent(new CustomEvent('aiThinkingChanged', { detail: { thinking: true } }));

        // ==========================================
        // 🌟 OPTIMIZACIÓN DE MEMORIA (Mitigación 503)
        // ==========================================
        
        // 1. Limpiamos los archivos Base64 pesados de mensajes ANTERIORES.
        // Mantenemos solo el texto para aligerar la carga de red.
        this.conversationHistory.forEach(msg => {
            if (msg.role === "user" && msg.parts) {
                msg.parts = msg.parts.filter(part => !part.inlineData);
            }
        });

        // 2. Ventana Deslizante: Mantenemos solo los últimos 10 mensajes
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(this.conversationHistory.length - 10);
        }

        // ==========================================

        const userParts = [{ text: message }];
        
        // 3. Empaquetamos el NUEVO archivo (este sí viaja a la API)
        if (this.currentAttachment) {
            userParts.push({
                inlineData: {
                    data: this.currentAttachment.data,
                    mimeType: this.currentAttachment.mimeType
                }
            });
        }

        this.conversationHistory.push({
            role: "user",
            parts: userParts
        });

        this.clearAttachment();

        const responseText = await this.api.askQuestion(this.conversationHistory);

        this.conversationHistory.push({
            role: "model",
            parts: [{ text: responseText }]
        });

        await this.updateMessage(loadingId, responseText);
        
        this.isThinking = false;
        this.inputField.disabled = false;
        this.btnAttach.disabled = false;
        this.inputField.placeholder = "Pregunta algo al profesor...";
        this.inputField.focus();

        // 🌟 El profesor ya respondió: el conejo puede volver a moverse libremente.
        window.dispatchEvent(new CustomEvent('aiThinkingChanged', { detail: { thinking: false } }));
    }

    // 🌟 MODO QUIZ: le pide a Gemini una pregunta de opción múltiple sobre
    // lo que se venía charlando, y la muestra como una tarjeta interactiva
    // dentro del propio historial del chat.
    async requestQuiz() {
        if (this.isThinking) return;

        this.isThinking = true;
        this.inputField.disabled = true;
        this.btnAttach.disabled = true;
        if (this.btnQuiz) this.btnQuiz.disabled = true;
        this.inputField.placeholder = "El Michi está pensando una pregunta...";
        window.dispatchEvent(new CustomEvent('aiThinkingChanged', { detail: { thinking: true } }));

        const loadingId = this.appendTypingIndicator();

        const quiz = await this.api.askQuiz(this.conversationHistory);

        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        if (!quiz || !Array.isArray(quiz.opciones) || quiz.opciones.length < 2 || typeof quiz.correcta !== 'number') {
            this.appendMessage('ai', 'No pude armar una pregunta justo ahora. ¿Charlamos un poco más del tema e intentamos de nuevo? 🐾');
        } else {
            this.renderQuizCard(quiz);
            // Dejamos un resumen en el historial para que la IA recuerde que ya preguntó esto
            this.conversationHistory.push({
                role: 'model',
                parts: [{ text: `[Pregunta de repaso ya realizada]: ${quiz.pregunta}` }]
            });
        }

        this.isThinking = false;
        this.inputField.disabled = false;
        this.btnAttach.disabled = false;
        if (this.btnQuiz) this.btnQuiz.disabled = false;
        this.inputField.placeholder = "Pregunta algo al profesor...";
        this.inputField.focus();
        window.dispatchEvent(new CustomEvent('aiThinkingChanged', { detail: { thinking: false } }));
    }

    // 🌟 Arma la tarjeta de pregunta de opción múltiple dentro del chat.
    // Al elegir una opción se bloquean las demás y se muestra la explicación.
    renderQuizCard(quiz) {
        const card = document.createElement('div');
        card.className = 'quiz-card';

        const pregunta = document.createElement('p');
        pregunta.className = 'quiz-question';
        pregunta.innerText = `📝 ${quiz.pregunta}`;
        card.appendChild(pregunta);

        const optionsWrapper = document.createElement('div');
        optionsWrapper.className = 'quiz-options';

        const explicacionBox = document.createElement('p');
        explicacionBox.className = 'quiz-explanation hidden';

        quiz.opciones.forEach((textoOpcion, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'quiz-option-btn';
            btn.innerText = textoOpcion;

            btn.addEventListener('click', () => {
                const botones = optionsWrapper.querySelectorAll('.quiz-option-btn');
                botones.forEach(b => b.disabled = true);

                const esCorrecta = index === quiz.correcta;
                btn.classList.add(esCorrecta ? 'quiz-correct' : 'quiz-incorrect');

                if (!esCorrecta && botones[quiz.correcta]) {
                    botones[quiz.correcta].classList.add('quiz-correct');
                }

                explicacionBox.innerText = `${esCorrecta ? '✅' : '❌'} ${quiz.explicacion}`;
                explicacionBox.classList.remove('hidden');

                window.dispatchEvent(new CustomEvent('playSFX', { detail: esCorrecta ? 'chime' : 'click' }));
                this.scrollToBottom();
            });

            optionsWrapper.appendChild(btn);
        });

        card.appendChild(optionsWrapper);
        card.appendChild(explicacionBox);

        this.chatHistory.appendChild(card);
        this.scrollToBottom();
    }

    // 🌟 Indicador de "escribiendo" animado (3 puntitos), reemplaza al
    // antiguo texto fijo "🐾..." mientras esperamos la respuesta de Gemini.
    appendTypingIndicator() {
        const id = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const msgDiv = document.createElement('p');
        msgDiv.id = id;
        msgDiv.className = 'ai-msg typing-indicator';
        msgDiv.innerHTML = '<span></span><span></span><span></span>';
        this.chatHistory.appendChild(msgDiv);
        this.scrollToBottom();
        return id;
    }

    appendMessage(sender, text) {
        const msgDiv = document.createElement('p');
        const id = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 10000); 
        msgDiv.id = id;
        msgDiv.className = sender === 'user' ? 'user-msg' : 'ai-msg';
        msgDiv.innerText = text;
        this.chatHistory.appendChild(msgDiv);
        this.scrollToBottom();
        return id;
    }

    updateMessage(id, newText) {
        return new Promise((resolve) => {
            const msgDiv = document.getElementById(id);
            if (msgDiv) {
                msgDiv.classList.remove('typing-indicator'); // 🌟 vuelve a ser un mensaje normal
                msgDiv.innerHTML = ''; 
                this.typeWriterEffect(msgDiv, newText, 0, resolve);
            } else {
                resolve();
            }
        });
    }

    typeWriterEffect(element, text, index, resolveCallback) {
        if (index <= text.length) {
            // Escapamos primero (por si la IA devolviera algo raro) y recién
            // después convertimos los saltos de línea en <br> nosotros mismos.
            const rawSubstring = text.substring(0, index);
            const currentText = Sanitizer.escapeHtml(rawSubstring).replace(/\n/g, '<br>');
            element.innerHTML = currentText;
            this.scrollToBottom(); 
            setTimeout(() => this.typeWriterEffect(element, text, index + 1, resolveCallback), 15); 
        } else {
            resolveCallback();
        }
    }

    scrollToBottom() {
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }
}