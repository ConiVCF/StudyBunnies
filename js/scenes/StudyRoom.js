export class StudyRoom {
    constructor() {
        // 🌟 VERSIÓN RESTAURADA: Medidas gigantes para el DOM Rendering
        this.worldWidth = 1500; 
        this.worldHeight = 415; 
        this.floorY = 405; 

        this.props = [
            { 
                id: 'desk', 
                type: 'solid', 
                x: 1050, 
                y: 280, 
                width: 330, 
                height: 130 // Colisión estirada hasta el piso
            }
        ];
        
        this.isLoaded = true; 
    }

    draw() {
        // En DOM Rendering el navegador dibuja solo
    }
}