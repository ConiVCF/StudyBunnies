// js/utils/Sanitizer.js
// Utilidad simple para evitar XSS al insertar texto de usuario con innerHTML.
// Cualquier dato que venga de la base de datos o de un input (misiones,
// eventos del calendario, etc.) debe pasar por acá antes de mostrarse.

export class Sanitizer {
    static escapeHtml(texto) {
        if (texto === null || texto === undefined) return '';

        const div = document.createElement('div');
        div.textContent = String(texto);
        return div.innerHTML;
    }
}
