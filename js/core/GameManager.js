import { Player } from '../entities/Player.js';
import { StudyTimer } from '../systems/StudyTimer.js';
import { Physics } from '../utils/Physics.js';
import { AITeacher } from '../entities/AITeacher.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { InventoryManager } from '../systems/InventoryManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { StudyRoom } from '../scenes/StudyRoom.js';
import { MissionManager } from '../systems/MissionManager.js';
import { CalendarManager } from '../systems/CalendarManager.js';
import { UIDialog } from '../systems/UIDialog.js';
import { Sanitizer } from '../utils/Sanitizer.js';

class GameManager {
    constructor() {
        this.worldContainer = document.getElementById('world-container');
        this.lastTime = 0;
        this.zoomLevel = 1.6; 
        
        this.saveSystem = new SaveSystem();
        this.room = new StudyRoom();
        
        this.player = null;
        this.timer = null;
        this.aiTeacher = null;
        this.inventory = null;
        this.audio = null;
        
        this.init();
    }

    async init() {
        this.playerProfile = await this.saveSystem.loadData();
        this.inventory = new InventoryManager(this);
        this.audio = new AudioManager(this.playerProfile.settings);
        this.timer = new StudyTimer('timerDisplay');
        this.aiTeacher = new AITeacher();
        this.missionManager = new MissionManager(this);
        this.calendarManager = new CalendarManager(this);

        // 🌟 ARQUITECTURA DE RED (DICCIONARIO DE JUGADORES)
        this.players = {};
        const localId = window.SESION_PHP?.nombre || 'Tú';
        
        // Creamos tu jugador (isLocal = true)
        this.player = new Player(localId, 200, 100, this.playerProfile.avatar, true);
        this.players[localId] = this.player;

        // 🌟 MULTIJUGADOR REAL (heartbeat contra MySQL, no un simulador)
        this.iniciarMultijugador();

        this.updateOnlineUI();

        this.setupAuth(); 
        this.setupMenuMusic();
        this.setupAudioControls(); 
        this.setupGlobalAudioEvents(); 
        this.setupTimerControls();
        this.setupMenuControls();
        this.setupProgressionSystem();
        
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    // 🌟 NUEVO: Actualiza el cartel de la izquierda
    updateOnlineUI() {
        const countSpan = document.getElementById('online-count');
        const listUl = document.getElementById('online-list');
        
        if (countSpan && listUl) {
            const playerIds = Object.keys(this.players);
            countSpan.innerText = playerIds.length;
            
            listUl.innerHTML = '';
            playerIds.forEach(id => {
                const li = document.createElement('li');
                const nombreSeguro = Sanitizer.escapeHtml(id);
                li.innerHTML = `${id === this.player.id ? `<b>${nombreSeguro}</b>` : nombreSeguro}`;
                listUl.appendChild(li);
            });
        }
    }

    // ==========================================
    //   MULTIJUGADOR (heartbeat por polling contra MySQL)
    // ==========================================
    iniciarMultijugador() {
        // Mandamos nuestra posición seguido...
        this.intervaloEnvioPosicion = setInterval(() => this.enviarPosicion(), 400);

        // ...y consultamos a los demás jugadores un poco menos seguido.
        this.intervaloConsultaJugadores = setInterval(() => this.actualizarJugadoresRemotos(), 1000);
        this.actualizarJugadoresRemotos(); // primera consulta inmediata, sin esperar el primer intervalo

        // Al cerrar la pestaña o navegar a otra página, avisamos que nos vamos
        // (sendBeacon funciona incluso si la página se está cerrando).
        window.addEventListener('beforeunload', () => {
            navigator.sendBeacon('salir_online.php');
        });
    }

    async enviarPosicion() {
        if (!window.SESION_PHP?.activa || !this.player) return;
        if (document.getElementById('game-view').classList.contains('hidden')) return;

        const datos = new FormData();
        datos.append('x', this.player.x);
        datos.append('y', this.player.y);
        datos.append('direccion', this.player.facing);
        datos.append('estado', this.player.state);
        datos.append('avatar_base', this.player.appearance.base);
        datos.append('avatar_clothing', this.player.appearance.clothing);
        datos.append('avatar_accessory', this.player.appearance.accessory);

        try {
            await fetch('actualizar_posicion.php', {
                method: 'POST',
                credentials: 'same-origin',
                body: datos
            });
        } catch (error) {
            console.error("No se pudo enviar la posición al servidor:", error);
        }
    }

    async actualizarJugadoresRemotos() {
        if (!window.SESION_PHP?.activa) return;

        try {
            const respuesta = await fetch('listar_jugadores.php', { credentials: 'same-origin' });
            if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

            const activos = await respuesta.json();
            const idsActivos = new Set(activos.map(j => j.nombre_usuario));
            let huboCambios = false;

            // Crea o actualiza a cada jugador remoto activo
            activos.forEach(j => {
                const avatar = {
                    base: j.avatar_base,
                    clothing: j.avatar_clothing,
                    accessory: j.avatar_accessory
                };

                if (this.players[j.nombre_usuario]) {
                    this.players[j.nombre_usuario].applyRemoteState(
                        parseFloat(j.pos_x), parseFloat(j.pos_y), j.direccion, j.estado, avatar
                    );
                } else {
                    this.players[j.nombre_usuario] = new Player(
                        j.nombre_usuario, parseFloat(j.pos_x), parseFloat(j.pos_y), avatar, false
                    );
                    huboCambios = true;
                }
            });

            // Saca a los jugadores que ya no están activos (se desconectaron / cerraron la pestaña)
            Object.keys(this.players).forEach(id => {
                if (id !== this.player.id && !idsActivos.has(id)) {
                    this.players[id].destroy();
                    delete this.players[id];
                    huboCambios = true;
                }
            });

            if (huboCambios) this.updateOnlineUI();
        } catch (error) {
            console.error("No se pudieron actualizar los jugadores en línea:", error);
        }
    }

    // ==========================================
    //   MÚSICA DEL MENÚ PRINCIPAL
    // ==========================================
    setupMenuMusic() {
        const btnMusicaMenu = document.getElementById('btn-musica-menu');
        let interacted = false;

        // Reproduce música al primer click en CUALQUIER parte de la página
        const playOnFirstClick = () => {
            if (interacted) return;
            interacted = true;
            
            // Solo iniciamos si la pantalla de inicio está visible
            if (!document.getElementById('main-menu-view').classList.contains('hidden')) {
                if (!this.audio.isMusicPlaying) {
                    this.audio.toggleMusic();
                    if (btnMusicaMenu) btnMusicaMenu.style.opacity = "1";
                }
            }
            
            document.removeEventListener('click', playOnFirstClick);
        };

        document.addEventListener('click', playOnFirstClick);

        // Lógica del botón de Mute visual
        btnMusicaMenu?.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitamos conflicto con el click global
            interacted = true;   
            document.removeEventListener('click', playOnFirstClick);

            const isPlaying = this.audio.toggleMusic();
            btnMusicaMenu.style.opacity = isPlaying ? "1" : "0.5";
        });
    }

    // ==========================================
    //   SISTEMA DE AUTENTICACIÓN
    // ==========================================
    setupAuth() {
        // 🌟 La identidad real viene del backend (ver window.SESION_PHP en index.php).
        // Acá ya no se simula ningún login: el formulario postea de verdad a
        // backend/controllers/AuthController.php y PHP redirige con la sesión creada.
        this.esModoRegistro = true;
        this.usuarioActivo = window.SESION_PHP?.nombre || null;

        const loginModal = document.getElementById('login-modal');
        const btnLoginNav = document.getElementById('login-btn-nav');
        const btnLogoutNav = document.getElementById('logout-btn-nav');
        const txtUsuario = document.getElementById('btn-usuario-texto');

        const btnCloseLogin = document.getElementById('btn-close-login');
        const btnTogglePass = document.getElementById('btn-toggle-pass');
        const btnToggleLink = document.getElementById('toggle-link');

        const loginBox = document.getElementById('login-box');
        const inputEmail = document.getElementById('reg-email');
        const inputPass = document.getElementById('reg-pass');

        const actualizarUI = () => {
            if (this.usuarioActivo) {
                txtUsuario.innerText = this.usuarioActivo;
                btnLogoutNav.classList.remove('hidden');
            } else {
                txtUsuario.innerText = "Iniciar Sesión";
                btnLogoutNav.classList.add('hidden');
            }
        };

        actualizarUI();

        btnLoginNav?.addEventListener('click', () => {
            if (!this.usuarioActivo) {
                this.audio.playSFX('click');
                loginModal.classList.remove('hidden');
            }
        });

        // 🌟 El logout ahora es real: destruye la sesión de PHP de verdad.
        btnLogoutNav?.addEventListener('click', async () => {
            if (await UIDialog.confirm("¿Seguro que quieres cerrar sesión, conejito?", "🚪")) {
                window.location.href = 'backend/controllers/AuthController.php?action=logout';
            }
        });

        btnCloseLogin?.addEventListener('click', () => {
            this.audio.playSFX('click');
            loginModal.classList.add('hidden');
        });

        btnTogglePass?.addEventListener('click', () => {
            this.audio.playSFX('click');
            inputPass.type = inputPass.type === "password" ? "text" : "password";
        });

        // 🌟 Esto solo alterna la UI del formulario (registro <-> login).
        // El envío real lo maneja el <form> con su action hacia AuthController.php.
        btnToggleLink?.addEventListener('click', () => {
            this.audio.playSFX('click');
            this.esModoRegistro = !this.esModoRegistro;

            if (this.esModoRegistro) {
                loginBox.className = "login-box-img registro";
                inputEmail.style.display = "block";
                btnToggleLink.innerText = "¿Ya tienes cuenta? Entra aquí";
            } else {
                loginBox.className = "login-box-img login modo-login";
                inputEmail.style.display = "none";
                btnToggleLink.innerText = "¿Aún no tienes cuenta? Entra aquí";
            }
        });
    }

    // ==========================================
    //   LÓGICA DE RPG (Experiencia y Niveles)
    // ==========================================
    setupProgressionSystem() {
        this.updateStatsUI();

        window.addEventListener('pomodoroCompleted', (e) => {
            if (e.detail.mode === 'study') {
                const expGained = e.detail.minutes * 3;
                this.addExperience(expGained); 
            }
        });
    }

    addExperience(amount) {
        this.playerProfile.stats.exp += amount;
        const expNeeded = this.playerProfile.stats.level * 100;

        if (this.playerProfile.stats.exp >= expNeeded) {
            this.playerProfile.stats.level++;
            this.playerProfile.stats.exp -= expNeeded; 
            this.audio.playSFX('click'); 
            UIDialog.alert(`¡Felicidades! Has alcanzado el Nivel ${this.playerProfile.stats.level} 🌟`, '🎉');
        }

        this.saveSystem.saveData(this.playerProfile);
        this.updateStatsUI();
    }

    updateStatsUI() {
        const levelBadge = document.querySelector('.level-badge');
        const expFill = document.querySelector('.exp-fill');
        const expText = document.querySelector('.exp-text'); 

        if (levelBadge && expFill && expText) {
            levelBadge.innerText = `LVL ${this.playerProfile.stats.level}`;

            const expNeeded = this.playerProfile.stats.level * 100;
            const expCurrent = this.playerProfile.stats.exp;
            const percentage = (expCurrent / expNeeded) * 100;
            
            expFill.style.transition = 'width 0.5s ease-in-out';
            expFill.style.width = `${Math.min(percentage, 100)}%`;
            expText.innerText = `${expCurrent} / ${expNeeded} EXP`;
        }
    }

    // ==========================================
    //   CONTROLES Y MOTOR GENERAL
    // ==========================================
    setupMenuControls() {
        const btnStart = document.getElementById('btn-start-game');
        const menuView = document.getElementById('main-menu-view');
        const gameView = document.getElementById('game-view');
        const timerModal = document.getElementById('timer-setup-modal');

        btnStart?.addEventListener('click', () => {
            this.audio.playSFX('click');

            if (!this.usuarioActivo) {
                UIDialog.alert("¡Hola, conejito! Por favor, regístrate o inicia sesión para poder ir a estudiar.", "👋");
                document.getElementById('login-modal').classList.remove('hidden');
                return; 
            }

            menuView.classList.add('hidden');
            gameView.classList.remove('hidden');
           
            
            // 🌟 PREPARACIÓN PARA EL FUTURO:
            // Por ahora le decimos que use la misma, pero en el futuro solo cambias este texto
            // por algo como: 'assets/audio/cancion_sala.mp3'
            this.audio.cambiarMusica('assets/audio/lofi_sunset.mp3');
            
            if (!this.audio.isMusicPlaying) {
                this.audio.toggleMusic(); 
            }
            
            const btnMusic = document.getElementById('btn-music');
            if (btnMusic) btnMusic.style.backgroundColor = '#8fbc8f';
        });

        document.getElementById('btn-confirm-timer')?.addEventListener('click', () => {
            this.audio.playSFX('click');
            timerModal.classList.add('hidden'); 
            this.timer.reset(); 
            this.timer.start(); 
        });
    }

    setupTimerControls() {
        const btnSetup = document.getElementById('btn-timer-setup');
        const modalTimer = document.getElementById('timer-setup-modal');
        const btnConfirm = document.getElementById('btn-confirm-timer');
        const btnCloseTimer = document.getElementById('btn-close-timer'); // 🌟 Tu cruz roja

        // Abrir modal con el engranaje
        if (btnSetup && modalTimer) {
            btnSetup.addEventListener('click', () => {
                this.audio.playSFX('click');
                modalTimer.classList.remove('hidden');
            });
        }

        // 🌟 Cerrar modal con la cruz roja
        if (btnCloseTimer && modalTimer) {
            btnCloseTimer.addEventListener('click', () => {
                this.audio.playSFX('click');
                modalTimer.classList.add('hidden');
            });
        }

        // Confirmar e iniciar temporizador
        if (btnConfirm && modalTimer) {
            btnConfirm.addEventListener('click', () => {
                this.audio.playSFX('click');
                this.timer.reset(); 
                modalTimer.classList.add('hidden');
            });
        }

        // Controles de la barra
        const btnStart = document.getElementById('btn-start-timer');
        const btnPause = document.getElementById('btn-pause-timer');
        const btnReset = document.getElementById('btn-reset-timer');

        if (btnStart) btnStart.addEventListener('click', () => {
            this.audio.playSFX('click');
            this.timer.start();
        });
        if (btnPause) btnPause.addEventListener('click', () => {
            this.audio.playSFX('click');
            this.timer.pause();
        });
        if (btnReset) btnReset.addEventListener('click', () => {
            this.audio.playSFX('click');
            this.timer.reset();
        });
    }

    setupAudioControls() { 
        const btnToggleAudio = document.getElementById('btn-toggle-audio');
        const audioPanel = document.getElementById('audio-panel');
        
        btnToggleAudio?.addEventListener('click', () => {
            audioPanel.classList.toggle('hidden');
            this.audio.playSFX('click');
        });

        const btnMusic = document.getElementById('btn-music'); 
        const btnBirds = document.getElementById('btn-birds'); 
        const btnTyping = document.getElementById('btn-typing'); 

        btnMusic?.addEventListener('click', () => { 
            const isPlaying = this.audio.toggleMusic(); 
            btnMusic.style.backgroundColor = isPlaying ? '#8fbc8f' : ''; 
            this.audio.playSFX('click'); 
        }); 

        btnBirds?.addEventListener('click', () => { 
            const isPlaying = this.audio.toggleBirds(); 
            btnBirds.style.backgroundColor = isPlaying ? '#8fbc8f' : ''; 
            this.audio.playSFX('click'); 
        }); 

        btnTyping?.addEventListener('click', () => { 
            const isPlaying = this.audio.toggleTyping(); 
            btnTyping.style.backgroundColor = isPlaying ? '#8fbc8f' : ''; 
            this.audio.playSFX('click'); 
        }); 

        const volMusic = document.getElementById('vol-music');
        const volBirds = document.getElementById('vol-birds');
        const volTyping = document.getElementById('vol-typing');
        const volSFX = document.getElementById('vol-sfx');

        volMusic?.addEventListener('input', (e) => this.audio.setMusicVolume(e.target.value));
        volBirds?.addEventListener('input', (e) => this.audio.setBirdsVolume(e.target.value));
        volTyping?.addEventListener('input', (e) => this.audio.setTypingVolume(e.target.value));
        volSFX?.addEventListener('input', (e) => this.audio.setMasterSFXVolume(e.target.value));
    } 
    
    setupGlobalAudioEvents() { 
        window.addEventListener('playSFX', (e) => { this.audio.playSFX(e.detail); }); 
        window.addEventListener('pomodoroCompleted', () => { this.audio.playSFX('logro'); }); 

        // 🌟 Mientras el Profesor Michi piensa la respuesta, el conejo se queda atento
        window.addEventListener('aiThinkingChanged', (e) => {
            if (this.player) this.player.setAttentive(e.detail.thinking);
        });
    } 

    update(deltaTime) {
        if (!this.player) return; 
        if (document.getElementById('game-view').classList.contains('hidden')) return;

        // 🌟 La física (gravedad, colisiones) solo corre para TU jugador.
        // A los jugadores remotos los movemos con lo que llega del heartbeat (applyRemoteState).
        Object.values(this.players).forEach(p => {
            if (p.isLocal) p.update(deltaTime, this.room);
        });

        const playerHitbox = this.player.getHitbox();
        const aiChatBox = document.getElementById('aiChat');
        let nearDesk = false;

        for (let prop of this.room.props) {
            if (Physics.checkCollision(playerHitbox, prop) && prop.id === 'desk') {
                nearDesk = true;
            }
        }

        if (nearDesk) {
            if (aiChatBox && aiChatBox.classList.contains('hidden')) {
                aiChatBox.classList.remove('hidden');
            }
        } else {
            if (aiChatBox && !aiChatBox.classList.contains('hidden')) {
                aiChatBox.classList.add('hidden');
            }
        }
    }

    draw() {
        if (!this.player) return;
        if (document.getElementById('game-view').classList.contains('hidden')) return;

        // 🌟 Dibujamos a TODOS los jugadores
        Object.values(this.players).forEach(p => p.draw());

        // La cámara te sigue estrictamente a ti (this.player)
        this.zoomLevel = window.innerHeight / this.room.worldHeight;
        const viewWidth = window.innerWidth / this.zoomLevel;

        let camX = (viewWidth / 2) - this.player.x - (this.player.width / 2);
        camX = Math.min(0, Math.max(camX, viewWidth - this.room.worldWidth));
        let camY = 0;

        this.worldContainer.style.transform = `scale(${this.zoomLevel}) translate(${camX}px, ${camY}px)`;
    }
    
    gameLoop(timestamp) {
        if (this.lastTime === 0) this.lastTime = timestamp; 
        
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    async updateAvatarProperty(property, value) {
        this.playerProfile.avatar[property] = value;
        await this.saveSystem.saveData(this.playerProfile);
    }
}

window.game = new GameManager();