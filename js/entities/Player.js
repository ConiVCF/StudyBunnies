export class Player {
    // 🌟 NUEVO: Recibimos un ID/Nombre y una bandera isLocal
    constructor(id, x, y, savedAvatarData, isLocal = true) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.isLocal = isLocal;
        
        this.width = 105; 
        this.height = 105;
        this.speed = 200; 
        this.velocityY = 0;
        this.gravity = 800; 
        this.facing = 'right'; 
        this.state = 'idle'; 
        this.stepTimer = 0;
        this.stepInterval = 550; 
        this.isAttentive = false; // 🌟 true mientras el Profesor Michi está pensando

        this.appearance = savedAvatarData || { base: 'copo', clothing: 'none', accessory: 'none' };
        
        // 🌟 CREACIÓN DINÁMICA DEL DOM
        this.createDOMStructure();

        // 🌟 Solo leemos el teclado si es TU jugador
        this.keys = { a: false, d: false };
        if (this.isLocal) {
            this.setupInputs();
        }
        
        this.updateLayers();
    }

    createDOMStructure() {
        // Creamos el contenedor principal
        this.playerContainer = document.createElement('div');
        this.playerContainer.className = 'player-entity';
        this.playerContainer.id = `player-${this.id}`;

        // Creamos las capas de ropa
        this.baseLayer = document.createElement('img');
        this.clothingLayer = document.createElement('img');
        this.clothingLayer.className = 'hidden';
        this.accessoryLayer = document.createElement('img');
        this.accessoryLayer.className = 'hidden';

        // Creamos el letrero con el nombre
        const nameTag = document.createElement('div');
        nameTag.className = 'player-nametag';
        nameTag.innerText = this.id;

        // Ensamblamos el muñeco
        this.playerContainer.appendChild(this.baseLayer);
        this.playerContainer.appendChild(this.clothingLayer);
        this.playerContainer.appendChild(this.accessoryLayer);
        this.playerContainer.appendChild(nameTag);

        // Lo inyectamos en el mundo físico
        document.getElementById('world-container').appendChild(this.playerContainer);
    }

    setAppearance(type, value) {
        this.appearance[type] = value;
        this.updateLayers(); 
    }

    updateLayers() {
        const stateName = this.state === 'walking' ? 'walk' : 'idle';
        
        this.baseLayer.src = `assets/sprites/bases/${this.appearance.base}_${stateName}.gif`;
        
        if (this.appearance.clothing !== 'none') {
            this.clothingLayer.src = `assets/sprites/clothing/${this.appearance.clothing}_${stateName}.gif`;
            this.clothingLayer.classList.remove('hidden');
        } else {
            this.clothingLayer.classList.add('hidden');
        }

        if (this.appearance.accessory !== 'none') {
            this.accessoryLayer.src = `assets/sprites/accessories/${this.appearance.accessory}_${stateName}.gif`;
            this.accessoryLayer.classList.remove('hidden');
        } else {
            this.accessoryLayer.classList.add('hidden');
        }
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => {
            if (this.isAttentive) return; // 🌟 quieto mientras espera la respuesta del profesor
            if (this.isTypingInField()) return; // 🌟 quieto mientras se escribe en cualquier input/textarea
            const key = e.key.toLowerCase();
            if (key === 'a') { this.keys.a = true; this.facing = 'left'; }
            if (key === 'd') { this.keys.d = true; this.facing = 'right'; }
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'a') this.keys.a = false;
            if (key === 'd') this.keys.d = false;
        });
    }

    // 🌟 Detecta si el foco está en un campo de texto (chat IA, misiones,
    // agenda, login, etc.) para no interpretar esas teclas como movimiento.
    isTypingInField() {
        const el = document.activeElement;
        return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    }

    // 🌟 Activa/desactiva el estado "atento": el conejo deja de caminar,
    // queda parado mirando hacia el cartel del chat y muestra un pequeño
    // indicador visual mientras el Profesor Michi piensa la respuesta.
    setAttentive(active) {
        if (!this.isLocal) return; // solo aplica al jugador que vos controlás
        this.isAttentive = active;

        if (active) {
            this.keys.a = false;
            this.keys.d = false;

            if (this.state !== 'idle') {
                this.state = 'idle';
                this.updateLayers();
            }

            this.facing = 'right'; // el chat está anclado abajo a la derecha
            this.playerContainer.classList.add('attentive');
        } else {
            this.playerContainer.classList.remove('attentive');
        }
    }

    getHitbox() {
        return { x: this.x + 20, y: this.y + this.height - 10, width: 40, height: 10 };
    }

    update(deltaTime, room) {
        const dt = deltaTime / 1000; 
        let moveX = 0;
        let stateChanged = false;

        // 🌟 Por si ya estabas caminando y hiciste clic en un input sin soltar la tecla
        if (this.isLocal && this.isTypingInField()) {
            this.keys.a = false;
            this.keys.d = false;
        }
        
        if (this.keys.a) moveX -= this.speed * dt;
        if (this.keys.d) moveX += this.speed * dt;
        this.x += moveX;

        if (moveX !== 0) {
            if (this.state !== 'walking') {
                this.state = 'walking';
                stateChanged = true;
            }
            // Los pasos solo suenan si eres el jugador local para no saturar el audio
            if (this.isLocal) {
                this.stepTimer += deltaTime;
                if (this.stepTimer >= this.stepInterval) {
                    window.dispatchEvent(new CustomEvent('playSFX', { detail: 'step' }));
                    this.stepTimer = 0;
                }
            }
        } else {
            if (this.state !== 'idle') {
                this.state = 'idle';
                stateChanged = true;
            }
            this.stepTimer = this.stepInterval; 
        }

        if (stateChanged) this.updateLayers();

        this.velocityY += this.gravity * dt;
        this.y += this.velocityY * dt;

        if (this.y + this.height >= room.floorY) {
            this.y = room.floorY - this.height;
            this.velocityY = 0;
        }

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > room.worldWidth) this.x = room.worldWidth - this.width;
    }

    draw() {
        const scaleX = this.facing === 'left' ? -1 : 1;
        this.playerContainer.style.transform = `translate(${this.x}px, ${this.y}px) scaleX(${scaleX})`;
        
        // Solucion al problema de que si giraba el conejo, giraba el nombre
        const nameTag = this.playerContainer.querySelector('.player-nametag');
        if (nameTag) {
            nameTag.style.transform = `translateX(-50%) scaleX(${scaleX})`;
        }
    }

    // 🌟 Aplica la posición/estado que llega del servidor (heartbeat de otro jugador).
    // Solo se usa en jugadores remotos: no corremos física local para ellos,
    // simplemente reflejamos lo que mandó su propio cliente.
    applyRemoteState(x, y, facing, state, avatar) {
        this.x = x;
        this.y = y;
        this.facing = facing;

        const cambioApariencia = avatar && (
            avatar.base !== this.appearance.base ||
            avatar.clothing !== this.appearance.clothing ||
            avatar.accessory !== this.appearance.accessory
        );

        if (cambioApariencia) {
            this.appearance = avatar;
        }

        if (cambioApariencia || state !== this.state) {
            this.state = state;
            this.updateLayers();
        }
    }

    // 🌟 Saca del DOM a un jugador remoto que se desconectó.
    destroy() {
        if (this.playerContainer && this.playerContainer.parentNode) {
            this.playerContainer.parentNode.removeChild(this.playerContainer);
        }
    }
}