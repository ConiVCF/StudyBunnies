export class StudyTimer {
    constructor(displayElementId) {
        this.display = document.getElementById(displayElementId);
        this.inputStudy = document.getElementById('input-study');
        this.inputBreak = document.getElementById('input-break');
        this.modeLabel = document.getElementById('timer-mode-indicator');
        
        this.mode = 'study'; 
        this.isRunning = false;
        this.intervalId = null;
        this.timeLeft = 0;

        this.reset();
    }

    getStudyMinutes() {
        let mins = parseInt(this.inputStudy.value);
        if (isNaN(mins) || mins < 1) mins = 1;
        return mins;
    }

    getBreakMinutes() {
        let mins = parseInt(this.inputBreak.value);
        if (isNaN(mins) || mins < 1) mins = 1;
        if (mins > 15) {
            mins = 15;
            this.inputBreak.value = 15; 
        }
        return mins;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000); 
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.intervalId);
    }

    reset() {
        this.pause();
        const mins = this.mode === 'study' ? this.getStudyMinutes() : this.getBreakMinutes();
        this.timeLeft = mins * 60;
        this.updateDisplay();
        this.updateModeLabel();
    }

    switchMode(newMode) {
        this.mode = newMode;
        this.reset();
        window.dispatchEvent(new CustomEvent('timerModeChanged', { detail: { mode: this.mode } }));
    }

    updateModeLabel() {
        if (this.modeLabel) {
            this.modeLabel.innerText = this.mode === 'study' ? 'Modo: Estudio 📚' : 'Modo: Descanso ☕';
            this.modeLabel.style.color = this.mode === 'study' ? '#ffcc80' : '#8fbc8f';
        }
    }

    completeSession() {
        this.pause();
        const minutesStudied = this.mode === 'study' ? this.getStudyMinutes() : 0;

        window.dispatchEvent(new CustomEvent('pomodoroCompleted', { 
            detail: { mode: this.mode, minutes: minutesStudied } 
        }));

        if (this.mode === 'study') {
            this.switchMode('break');
        } else {
            this.switchMode('study');
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (this.display) {
            this.display.innerText = formattedTime;
        }
    }
}