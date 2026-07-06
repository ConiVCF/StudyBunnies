// js/systems/UIDialog.js
// 🌟 Reemplazo temático de alert()/confirm() nativos del navegador.
// Los diálogos nativos son grises y rompen la estética pixel-art cozy
// justo en los momentos más visibles (subir de nivel, borrar una misión,
// cerrar sesión). Este módulo reutiliza las MISMAS clases que ya usan
// el resto de los modales del proyecto (modal-overlay, pixel-border,
// modal-header, modal-footer, btn-pixel), así queda 100% consistente
// con la interfaz existente sin inventar un estilo nuevo.
//
// Uso:
//   await UIDialog.alert("¡Mensaje!");
//   const ok = await UIDialog.confirm("¿Estás seguro?");
//   if (!ok) return;

export class UIDialog {
    static _overlay = null;

    static _build() {
        if (UIDialog._overlay) return UIDialog._overlay;

        const overlay = document.createElement('div');
        overlay.id = 'ui-dialog-overlay';
        overlay.className = 'modal-overlay hidden';
        overlay.innerHTML = `
            <div class="modal-content pixel-border ui-dialog-box">
                <header class="modal-header">
                    <h2 id="ui-dialog-icon">🐰</h2>
                </header>
                <div class="modal-body">
                    <p id="ui-dialog-message" class="ui-dialog-message"></p>
                </div>
                <footer class="modal-footer ui-dialog-actions">
                    <button id="ui-dialog-btn-cancel" class="btn-pixel-small hidden">No</button>
                    <button id="ui-dialog-btn-ok" class="btn-pixel">Aceptar</button>
                </footer>
            </div>
        `;
        document.body.appendChild(overlay);
        UIDialog._overlay = overlay;
        return overlay;
    }

    static _open({ message, icon, okText, cancelText, showCancel }) {
        return new Promise((resolve) => {
            const overlay = UIDialog._build();

            overlay.querySelector('#ui-dialog-icon').textContent = icon;
            overlay.querySelector('#ui-dialog-message').textContent = message;

            const btnOk = overlay.querySelector('#ui-dialog-btn-ok');
            const btnCancel = overlay.querySelector('#ui-dialog-btn-cancel');

            btnOk.textContent = okText;
            btnCancel.textContent = cancelText;
            btnCancel.classList.toggle('hidden', !showCancel);

            const close = (result) => {
                overlay.classList.add('hidden');
                btnOk.removeEventListener('click', onOk);
                btnCancel.removeEventListener('click', onCancel);
                document.removeEventListener('keydown', onKeydown);
                window.dispatchEvent(new CustomEvent('playSFX', { detail: 'click' }));
                resolve(result);
            };

            const onOk = () => close(true);
            const onCancel = () => close(false);
            const onKeydown = (e) => {
                if (e.key === 'Escape') close(false);
                if (e.key === 'Enter') close(true);
            };

            btnOk.addEventListener('click', onOk);
            btnCancel.addEventListener('click', onCancel);
            document.addEventListener('keydown', onKeydown);

            overlay.classList.remove('hidden');
            btnOk.focus();
        });
    }

    // Reemplazo de alert(): solo informa, se resuelve al cerrar (no bloquea nada).
    static alert(message, icon = '🐰') {
        return UIDialog._open({ message, icon, okText: 'Entendido', cancelText: '', showCancel: false });
    }

    // Reemplazo de confirm(): resuelve true/false según lo que elija el usuario.
    static confirm(message, icon = '❓') {
        return UIDialog._open({ message, icon, okText: 'Sí', cancelText: 'No', showCancel: true });
    }
}
