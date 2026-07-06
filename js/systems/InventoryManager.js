export class InventoryManager {
    constructor(gameManager) {
        this.game = gameManager; 
        
        this.modal = document.getElementById('inventory-modal');
        this.openBtn = document.getElementById('btn-inventory');
        this.closeBtn = document.getElementById('btn-close-inventory');
        this.saveBtn = document.getElementById('btn-save-inventory'); // Nuevo botón

        // Imágenes de la vista previa
        this.previewBase = document.getElementById('preview-base');
        this.previewClothing = document.getElementById('preview-clothing');
        this.previewAccessory = document.getElementById('preview-accessory');

        // 🌟 Memoria temporal: Aquí guardamos los cambios mientras estás en el menú
        this.tempAppearance = { base: 'copo', clothing: 'none', accessory: 'none' };
        
        this.setupEvents();
    }

    openModal() {
        // 1. Al abrir el menú, copiamos la apariencia actual del jugador
        this.tempAppearance = { ...this.game.player.appearance };
        this.updatePreview();
        this.modal.classList.remove('hidden');
        this.game.audio.playSFX('click');
    }

    updatePreview() {
        // 2. Actualizamos SOLO la cajita de vista previa usando las animaciones "idle" (quietas)
        this.previewBase.src = `assets/sprites/bases/${this.tempAppearance.base}_idle.gif`;
        
        if (this.tempAppearance.clothing !== 'none') {
            this.previewClothing.src = `assets/sprites/clothing/${this.tempAppearance.clothing}_idle.gif`;
            this.previewClothing.classList.remove('hidden');
        } else {
            this.previewClothing.classList.add('hidden');
        }

        if (this.tempAppearance.accessory !== 'none') {
            this.previewAccessory.src = `assets/sprites/accessories/${this.tempAppearance.accessory}_idle.gif`;
            this.previewAccessory.classList.remove('hidden');
        } else {
            this.previewAccessory.classList.add('hidden');
        }
    }

    async saveChanges() {
        this.game.audio.playSFX('click');
        
        // 3. Guardar en el disco duro (SaveSystem)
        await this.game.updateAvatarProperty('base', this.tempAppearance.base);
        await this.game.updateAvatarProperty('clothing', this.tempAppearance.clothing);
        await this.game.updateAvatarProperty('accessory', this.tempAppearance.accessory);
        
        // 4. Aplicar los cambios al jugador real que está caminando por la sala
        this.game.player.setAppearance('base', this.tempAppearance.base);
        this.game.player.setAppearance('clothing', this.tempAppearance.clothing);
        this.game.player.setAppearance('accessory', this.tempAppearance.accessory);

        // 5. Cerrar el menú
        this.modal.classList.add('hidden');
    }

    setupEvents() {
        // Botones de Abrir, Cerrar y Guardar
        this.openBtn?.addEventListener('click', () => this.openModal());
        this.closeBtn?.addEventListener('click', () => {
            this.modal.classList.add('hidden');
            this.game.audio.playSFX('click'); // Si cierras con la X, no se guarda nada
        });
        this.saveBtn?.addEventListener('click', () => this.saveChanges());

        // Botones de Color de Conejo
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.tempAppearance.base = e.target.dataset.base;
                this.updatePreview();
                this.game.audio.playSFX('click');
            });
        });

        // Botones de Ropa
        document.querySelectorAll('#clothing-picker .item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.tempAppearance.clothing = e.target.dataset.item;
                this.updatePreview();
                this.game.audio.playSFX('click');
            });
        });

        // Botones de Accesorios
        document.querySelectorAll('#accessory-picker .item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.tempAppearance.accessory = e.target.dataset.item;
                this.updatePreview();
                this.game.audio.playSFX('click');
            });
        });
    }
}