import { APIManager } from '../systems/APIManager.js';

import { Sanitizer } from '../utils/Sanitizer.js';

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

        // 🌟 Elementos de Accesibilidad
        this.btnTxtMinus = document.getElementById('btn-txt-minus');
        this.btnTxtPlus = document.getElementById('btn-txt-plus');
        this.sliderTxtSize = document.getElementById('slider-txt-size');

        this.isThinking = false;
        this.conversationHistory = [];
        this.currentAttachment = null; 

        // 🌟 Cargar preferencias del usuario al iniciar
        this.fontSize = parseInt(localStorage.getItem('cozy_chat_font_size')) || 10;
        this.updateFontSize(this.fontSize);

        this.setupEvents();
    }

    setupEvents() {
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.inputField.value.trim() !== '' && !this.isThinking) {
                this.handleUserMessage(this.inputField.value.trim());
            }
        });

        this.btnAttach.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) this.processFile(e.target.files[0]);
        });
        this.btnRemoveAttachment.addEventListener('click', () => this.clearAttachment());

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
        const loadingId = this.appendMessage('ai', '🐾...'); 

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