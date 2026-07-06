export class AudioManager {
    constructor(savedSettings) {
        this.bgmVolume = savedSettings?.musicVolume ?? 0.3; 
        this.sfxVolume = savedSettings?.sfxVolume ?? 0.6;
        this.birdsVolume = 0.6; 
        this.typingVolume = 0.6; 

        this.bgm = new Audio('assets/audio/lofi_sunset.mp3');
        this.bgm.loop = true;
        this.bgm.volume = this.bgmVolume;
        this.isMusicPlaying = false;

        this.sfx = {
            step: new Audio('assets/audio/step.mp3'),
            click: new Audio('assets/audio/click.mp3'),
            birds: new Audio('assets/audio/birds.mp3'), 
            typing: new Audio('assets/audio/typing.mp3'),
            write: new Audio('assets/audio/write.mp3'),
            chime: new Audio('assets/audio/chime.mp3'),
            logro: new Audio('assets/audio/logro.mp3')
        };
        
        if (this.sfx.birds) {
            this.sfx.birds.loop = true;
            this.sfx.birds.volume = this.birdsVolume;
        }
        if (this.sfx.typing) {
            this.sfx.typing.loop = true;
            this.sfx.typing.volume = this.typingVolume;
        }
        
        this.setMasterSFXVolume(this.sfxVolume);
    }

    toggleMusic() {
        if (this.isMusicPlaying) {
            this.bgm.pause();
            this.isMusicPlaying = false;
        } else {
            this.bgm.play().catch(e => console.warn("Autoplay bloqueado:", e));
            this.isMusicPlaying = true;
        }
        return this.isMusicPlaying;
    }

    toggleBirds() {
        if (this.sfx.birds.paused) {
            this.sfx.birds.play();
            return true;
        } else {
            this.sfx.birds.pause();
            return false;
        }
    }

    toggleTyping() {
        if (this.sfx.typing.paused) {
            this.sfx.typing.play();
            return true;
        } else {
            this.sfx.typing.pause();
            return false;
        }
    }

    playSFX(soundName) {
        if (this.sfx[soundName]) {
            const soundClone = this.sfx[soundName].cloneNode();

            // 🌟 El sonido de logro suena más fuerte que el resto de los SFX,
            // para que se note bien al completar una sesión de estudio.
            const boost = soundName === 'logro' ? 1.6 : 1;
            soundClone.volume = Math.min(1, this.sfxVolume * boost);
            soundClone.play().catch(() => {});
        }
    }

// --- NUEVA FUNCIÓN PARA CAMBIAR CANCIONES (PREPARANDO EL FUTURO) ---
    cambiarMusica(nuevaRuta) {
        // Solo cambia la canción si la ruta es diferente, para evitar que se reinicie si ya es la misma
        if (!this.bgm.src.includes(nuevaRuta)) {
            const estabaSonando = this.isMusicPlaying;
            this.bgm.src = nuevaRuta;
            if (estabaSonando) {
                this.bgm.play().catch(e => console.warn(e));
            }
        }
    }

    // --- FUNCIONES DE SLIDERS CORREGIDAS (Con parseFloat) ---
    setMusicVolume(val) {
        const volume = parseFloat(val);
        this.bgmVolume = volume;
        this.bgm.volume = volume;
    }

    setBirdsVolume(val) {
        const volume = parseFloat(val);
        this.birdsVolume = volume;
        if (this.sfx.birds) this.sfx.birds.volume = volume;
    }

    setTypingVolume(val) {
        const volume = parseFloat(val);
        this.typingVolume = volume;
        if (this.sfx.typing) this.sfx.typing.volume = volume;
    }

    setMasterSFXVolume(val) {
        const volume = parseFloat(val);
        this.sfxVolume = volume;
        if (this.sfx.step) this.sfx.step.volume = volume;
        if (this.sfx.click) this.sfx.click.volume = volume;
        if (this.sfx.write) this.sfx.write.volume = volume;
        if (this.sfx.chime) this.sfx.chime.volume = volume;
        if (this.sfx.logro) this.sfx.logro.volume = volume;
    }
}