export class SaveSystem {
    constructor() {
        this.saveKey = 'cozy_study_save_v2'; 
        
        this.defaultState = {
            uuid: this.generateUUID(),
            avatar: {
                base: 'copo', 
                clothing: 'none',
                accessory: 'none'
            },
            stats: { level: 1, exp: 0, coins: 0 },
            settings: { musicVolume: 0.5, sfxVolume: 0.8 },
            missions: [] // 🌟 NUEVO: Arreglo vacío para guardar las tareas
        };
    }

    async loadData() {
        return new Promise((resolve) => {
            try {
                const savedData = localStorage.getItem(this.saveKey);
                if (savedData) {
                    resolve(JSON.parse(savedData));
                } else {
                    this.saveData(this.defaultState);
                    resolve(this.defaultState);
                }
            } catch (error) {
                console.error("Error leyendo datos:", error);
                resolve(this.defaultState); 
            }
        });
    }

    async saveData(data) {
        return new Promise((resolve) => {
            try {
                localStorage.setItem(this.saveKey, JSON.stringify(data));
                resolve(true);
            } catch (error) {
                console.error("Error guardando datos:", error);
                resolve(false);
            }
        });
    }

    generateUUID() {
        return Math.random().toString(36).substring(2, 15);
    }
}