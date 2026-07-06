<?php
session_start();
$isLoggedIn = isset($_SESSION['id_usuario']);
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cozy Study - Bunny World</title>
    <link rel="icon" type="image/png" href="assets/img/favicon.png">
    <link rel="shortcut icon" type="image/x-icon" href="assets/img/favicon.ico">
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/game.css">
    <link rel="stylesheet" href="css/ui.css">
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
</head>
<body>

    <?php if(isset($_GET['msg']) && $_GET['msg'] == 'registro_exitoso'): ?>
        <div style="position:absolute; z-index:9999; top:20px; left:50%; transform:translateX(-50%); background:#8fbc8f; padding:15px; border:4px solid #2c1a16; font-family:'Press Start 2P'; font-size:10px; color:#2c1a16;">¡REGISTRO EXITOSO! INICIA SESIÓN.</div>
    <?php endif; ?>
    
    <?php
        $erroresConocidos = [
            'credenciales_invalidas' => 'ERROR: DATOS INCORRECTOS.',
            'sesion_requerida'       => 'DEBÉS INICIAR SESIÓN PARA CONTINUAR.',
            'acceso_denegado'        => 'NO TENÉS PERMISOS PARA ACCEDER A ESA PÁGINA.',
        ];
        if (isset($_GET['error']) && isset($erroresConocidos[$_GET['error']])):
    ?>
        <div style="position:absolute; z-index:9999; top:20px; left:50%; transform:translateX(-50%); background:#e57373; padding:15px; border:4px solid #2c1a16; font-family:'Press Start 2P'; font-size:10px; color:#2c1a16;"><?php echo $erroresConocidos[$_GET['error']]; ?></div>
    <?php endif; ?>

    <div id="main-menu-view" class="screen-home <?php echo $isLoggedIn ? 'hidden' : ''; ?>">
        <nav class="main-nav">
            <a href="index.php">🏠 Inicio</a>
            <a href="contacto.php">📬 Contacto</a>
        </nav>

        <div class="top-left-nav">
            <img src="assets/img/boton-sonido.png" id="btn-musica-menu" class="btn-sonido-img" alt="Música" title="Música del menú">
        </div>

        <div class="top-right-nav">
            <div id="login-btn-nav" class="login-nav-container">
                <img src="assets/img/boton-inicio-sesion.png" class="btn-login-img">
                <span id="btn-usuario-texto">Iniciar Sesión</span> 
            </div>
            <div id="logout-btn-nav" class="login-nav-container hidden">
                <img src="assets/img/boton-inicio-sesion.png" class="btn-login-img">
                <span>Cerrar Sesión</span> 
            </div>
        </div>

        <img src="assets/img/Titulo.gif" alt="Study's Bunnies" class="titulo-animado">

        <p class="project-description">
            Cozy Study - Bunny World es tu compañero de estudio gamificado: armá tu conejito,
            organizá tus tareas académicas en la pizarra de misiones, usá el temporizador Pomodoro
            y pedile una mano al Profesor Michi, tu tutor con IA, cuando te trabes con algo.
            Registrate para guardar tu progreso, o iniciá sesión si ya tenés una cuenta.
        </p>

        <div class="home-content">
            <img src="assets/img/IrAEstudiar.png" alt="Ir a Estudiar" id="btn-start-game" class="btn-start-img">
        </div>

        <div id="login-modal" class="modal-overlay hidden">
            <div class="login-wrapper" style="text-align: center; position: relative;">
                <button id="btn-close-login" class="close-btn" style="position: absolute; top: -10px; right: -40px; z-index: 20;">X</button>
                
                <form action="backend/controllers/AuthController.php" method="POST" id="login-box" class="login-box-img registro">
                    
                    <input type="hidden" name="auth_action" id="auth_action" value="register">
                    
                    <input type="text" name="usuario_reg" id="reg-user" placeholder="Usuario" class="input-overlay user-pos" autocomplete="off" required>
                    
                    <input type="email" name="email_reg" id="reg-email" placeholder="Email" class="input-overlay email-pos" autocomplete="off" required>
                    
                    <input type="password" name="password_reg" id="reg-pass" placeholder="Contraseña" class="input-overlay pass-pos" autocomplete="off" required>
                    
                    <button type="button" class="btn-eye-hitbox" id="btn-toggle-pass"></button>
                    
                    <button type="submit" class="btn-hitbox" id="btn-submit-auth"></button>
                </form>
                <button id="toggle-link" class="btn-link">¿Ya tienes cuenta? Entra aquí</button>
            </div>
        </div>

    </div>

        <div id="game-view" class="<?php echo $isLoggedIn ? '' : 'hidden'; ?>">
            <a href="backend/controllers/AuthController.php?action=logout" style="position: absolute; top: 30px; left: 20px; z-index: 2000; font-family: 'Press Start 2P'; font-size: 8px; background: #e57373; padding: 10px; text-decoration: none; color: #2c1a16; border: 2px solid #000;">SALIR</a>
            <?php if ($isLoggedIn && (int)($_SESSION['rol'] ?? 0) === 1): ?>
            <a href="admin.php" style="position: absolute; top: 30px; left: 130px; z-index: 2000; font-family: 'Press Start 2P'; font-size: 8px; background: #d08770; padding: 10px; text-decoration: none; color: #2c1a16; border: 2px solid #000;">🐾 ADMIN</a>
            <?php endif; ?>
            
                
        <div id="game-container">
            <div id="world-container">
                <img id="bg-room" src="assets/maps/Untitled_05-06-2026_04-48-51.gif" alt="Fondo">
                
                <img id="profesor-gatito" src="assets/sprites/Proffesor/gatito.gif" alt="Profesor Gatito">
                
                
            </div>
            <div id="lighting-overlay"></div>
        </div>

        <main id="ui-layer">
            <header class="top-bar">
                <div class="user-stats">
                    <div class="level-badge">LVL 1</div>
                    <div class="exp-bar-container">
                        <div class="exp-bar"><div class="exp-fill" style="width: 0%;"></div></div>
                        <div class="exp-text">0 / 100 EXP</div>
                    </div>
                </div>
                
                <div class="timer-container">
                    <div id="timer-mode-indicator" class="mode-label">Modo: Estudio 📚</div>
                    <div class="pomodoro-widget" id="timerDisplay">25:00</div>
                    <div class="timer-controls">
                        <button id="btn-timer-setup" class="btn-pixel" title="Configurar">⚙️</button>
                        <button id="btn-start-timer" class="btn-pixel" title="Iniciar">▶</button>
                        <button id="btn-pause-timer" class="btn-pixel" title="Pausar">⏸</button>
                        <button id="btn-reset-timer" class="btn-pixel" title="Reiniciar">↻</button>
                    </div>
                </div>
            </header>

            <div id="multiplayer-panel" class="online-users-widget">
                <div class="online-header">🟢 Sala de Estudio (<span id="online-count">1</span>)</div>
                <ul id="online-list" class="online-list"></ul>
            </div>

            <div class="action-menu">
                <button id="btn-inventory" class="btn-pixel btn-action">🎒 Ropero</button>
                <button id="btn-missions" class="btn-pixel btn-action">📋 Pizarra</button>
                <button id="btn-calendar" class="btn-pixel btn-action">📅 Agenda</button>
            </div>

            <div id="timer-setup-modal" class="modal-overlay hidden">
                <div class="modal-content pixel-border setup-modal">
                    
                    <header class="modal-header" style="position: relative;">
                        <button id="btn-close-timer" 
                            class="close-btn" style="
                                color: #ff4c4c; 
                                position: absolute; 
                                right: 15px; 
                                top: 8px;
                                text-shadow: 1px 1px 0px #555;">X</button>
                        <h2>Planifica tu Sesión</h2>
                    </header>
                    <div class="modal-body timer-setup-body">
                        <p class="setup-text">¿Cuánto tiempo te concentrarás hoy?</p>
                        <div class="timer-settings-large">
                            <label>Estudio: <input type="number" id="input-study" min="1" max="120" value="25"> min</label>
                            <label>Descanso: <input type="number" id="input-break" min="1" max="15" value="5"> min</label>
                        </div>
                    </div>
                    <footer class="modal-footer">
                        <button id="btn-confirm-timer" class="btn-pixel save-btn">✅ ¡Comenzar Misión!</button>
                    </footer>
                </div>
            </div>

            <div id="inventory-modal" class="modal-overlay hidden">
                <div class="modal-content pixel-border modal-large">
                    <header class="modal-header">
                        <h2>Personaliza tu Avatar</h2>
                        <button id="btn-close-inventory" class="close-btn">X</button>
                    </header>
                    <div class="modal-body with-preview">
                        <div class="preview-panel">
                            <div class="preview-container">
                                <img id="preview-base" src="assets/sprites/bases/copo_idle.gif" alt="Conejo">
                                <img id="preview-clothing" src="" alt="Ropa" class="hidden">
                                <img id="preview-accessory" src="" alt="Accesorio" class="hidden">
                            </div>
                        </div>
                        <div class="options-panel">
                            <div class="customization-section">
                                <h3>Color del Conejo</h3>
                                <div class="color-options" id="color-picker">
                                    <button class="color-btn" data-base="copo" style="background-color: #FFFFFF;" title="Copo"></button>
                                    <button class="color-btn" data-base="mochi" style="background-color: #333333;" title="Mochi"></button> 
                                    <button class="color-btn" data-base="canela" style="background-color: #A0522D;" title="Canela"></button> 
                                </div>
                            </div>
                            <div class="customization-section">
                                <h3>Ropa</h3>
                                <div class="item-grid" id="clothing-picker">
                                    <button class="item-btn" data-item="none">Nada</button>
                                    <button class="item-btn" data-item="conjunto1">Camisa Roja</button>
                                    <button class="item-btn" data-item="cozy_sweater">Suéter Rojo</button>
                                </div>
                            </div>
                            <div class="customization-section">
                                <h3>Accesorios</h3>
                                <div class="item-grid" id="accessory-picker">
                                    <button class="item-btn" data-item="none">Nada</button>
                                    <button class="item-btn" data-item="round_glasses">Lentes Redondos</button>
                                    <button class="item-btn" data-item="sombrero">Sombrero</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <footer class="modal-footer">
                        <button id="btn-save-inventory" class="btn-pixel save-btn">💾 Guardar Cambios</button>
                    </footer>
                </div>
            </div>

            <div id="mission-modal" class="modal-overlay hidden">
                <div class="modal-content pixel-border corkboard-modal">
                    <header class="modal-header wood-header">
                        <h2>📌 Pizarra de Misiones</h2>
                        <button id="btn-close-missions" class="close-btn">X</button>
                    </header>
                    <div class="modal-body">
                        <div class="add-mission-wrapper">
                            <input type="text" id="new-mission-input" placeholder="Añadir nueva tarea académica..." autocomplete="off">
                            <button id="btn-add-mission" class="btn-pixel-small">Agregar</button>
                        </div>

                        <div class="add-mission-wrapper">
                            <input type="text" id="mission-search-input" placeholder="🔍 Buscar en mis misiones..." autocomplete="off">
                            <button id="btn-search-mission" class="btn-pixel-small">Buscar</button>
                            <button id="btn-clear-search-mission" class="btn-pixel-small">Ver todas</button>
                        </div>

                        <div class="mission-stats">
                            <span id="mission-counter">0/0 Completadas</span>
                        </div>

                        <ul id="mission-list" class="mission-list"></ul>
                    </div>
                </div>
            </div>

            <div id="calendar-modal" class="modal-overlay hidden">
                <div class="modal-content pixel-border agenda-modal">
                    <header class="modal-header wood-header">
                        <h2>📅 Agenda Académica</h2>
                        <button id="btn-close-calendar" class="close-btn">X</button>
                    </header>
                    <div class="modal-body with-preview">
                        <div class="agenda-form-panel">
                            <h3>Nuevo Evento</h3>
                            <input type="text" id="event-title" placeholder="Ej: Parcial Probabilidad y Estadística" class="agenda-input">
                            
                            <div class="agenda-row">
                                <select id="event-type" class="agenda-input">
                                    <option value="Examen">📝 Examen / Parcial</option>
                                    <option value="Final">🎓 Final</option>
                                    <option value="TP">📁 Entrega de TP</option>
                                    <option value="Proyecto">🚀 Proyecto</option>
                                    <option value="Personal">🎯 Objetivo Personal</option>
                                </select>
                                <input type="date" id="event-date" class="agenda-input">
                            </div>

                            <div class="reminders-config">
                                <span>Recordatorios por Email:</span>
                                <div class="checkbox-grid">
                                    <label><input type="checkbox" value="30"> 30 días</label>
                                    <label><input type="checkbox" value="15"> 15 días</label>
                                    <label><input type="checkbox" value="7" checked> 7 días</label>
                                    <label><input type="checkbox" value="3" checked> 3 días</label>
                                    <label><input type="checkbox" value="1" checked> 24 hs</label>
                                    <label><input type="checkbox" value="0" checked> Mismo día</label>
                                </div>
                            </div>
                            <button id="btn-add-event" class="btn-pixel save-btn" style="width: 100%; margin-top: 10px;">Guardar Fecha</button>
                        </div>
                        
                        <div class="agenda-list-panel">
                            <h3>Próximos Eventos</h3>
                            <ul id="event-list" class="event-list"></ul>
                        </div>
                    </div>
                </div>
            </div>

            <aside class="ai-chat-box hidden" id="aiChat">
                <div class="chat-header">
                    <span>Profesor Michi 🐾</span>
                    <div class="text-size-controls">
                        <button id="btn-txt-minus" class="txt-btn" title="Achicar letra">A-</button>
                        <input type="range" id="slider-txt-size" min="8" max="24" value="10" step="1" title="Tamaño de letra">
                        <button id="btn-txt-plus" class="txt-btn" title="Agrandar letra">A+</button>
                    </div>
                </div>
                <div class="chat-history" id="chatHistory"><p class="ai-msg">¡Miau! ¿Qué tema vamos a estudiar en esta sesión?</p></div>
                <div id="attachment-preview" class="hidden"><span id="attachment-name">archivo.pdf</span><button id="btn-remove-attachment" title="Quitar archivo">X</button></div>
                <div class="chat-input-wrapper">
                    <button id="btn-attach" class="btn-pixel-small" title="Subir archivo (PDF, JPG, PNG)">📎</button>
                    <button id="btn-quiz" class="btn-pixel-small" title="Ponme a prueba con una pregunta">📝</button>
                    <input type="file" id="aiAttachment" accept="image/png, image/jpeg, application/pdf" class="hidden">
                    <input type="text" id="aiInput" placeholder="Pregunta algo al profesor..." autocomplete="off">
                </div>
            </aside>

            <div class="audio-widget">
                <div id="audio-panel" class="environment-controls hidden">
                    <div class="control-group"><button id="btn-music">🎵 Lofi</button><input type="range" id="vol-music" min="0" max="1" step="0.01" value="0.3" title="Volumen Lofi"></div>
                    <div class="control-group"><button id="btn-birds">🐦 Aves</button><input type="range" id="vol-birds" min="0" max="1" step="0.01" value="0.6" title="Volumen Aves"></div>
                    <div class="control-group"><button id="btn-typing">✍️ Escribiendo</button><input type="range" id="vol-typing" min="0" max="1" step="0.01" value="0.6" title="Volumen Escritura"></div>
                    <div class="control-group"><span class="control-label">🔊 Efectos</span><input type="range" id="vol-sfx" min="0" max="1" step="0.01" value="0.6" title="Volumen Pasos"></div>
                </div>
                <button id="btn-toggle-audio" class="btn-pixel">🔊 Ambiente</button>
            </div>

        </main>
    </div>

    <script>
        // 🌟 Puente entre la sesión real de PHP y el juego en JS.
        // Reemplaza al viejo localStorage['sesionActiva'] (simulado).
        window.SESION_PHP = {
            activa: <?php echo $isLoggedIn ? 'true' : 'false'; ?>,
            nombre: <?php echo json_encode($_SESSION['nombre'] ?? null); ?>,
            rol: <?php echo json_encode($_SESSION['rol'] ?? null); ?>,
            idUsuario: <?php echo json_encode($_SESSION['id_usuario'] ?? null); ?>
        };
    </script>
    <script type="module" src="js/core/GameManager.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const toggleLink = document.getElementById('toggle-link');
            const authAction = document.getElementById('auth_action');
            const emailInput = document.getElementById('reg-email');

            if (toggleLink) {
                toggleLink.addEventListener('click', (e) => {
                    e.preventDefault(); // Evita que el botón recargue la página

                    if (authAction.value === 'register') {
                        // CAMBIAR A MODO LOGIN
                        authAction.value = 'login';
                        emailInput.removeAttribute('required'); // Ya no es obligatorio el email
                        emailInput.style.opacity = '0'; // Lo ocultamos visualmente sin romper tu CSS
                        emailInput.style.pointerEvents = 'none'; // Evitamos que le hagan clic por error
                        toggleLink.innerText = '¿No tienes cuenta? Regístrate aquí';
                    } else {
                        // VOLVER A MODO REGISTRO
                        authAction.value = 'register';
                        emailInput.setAttribute('required', 'required'); // El email vuelve a ser obligatorio
                        emailInput.style.opacity = '1'; // Lo mostramos de nuevo
                        emailInput.style.pointerEvents = 'auto'; 
                        toggleLink.innerText = '¿Ya tienes cuenta? Entra aquí';
                    }
                });
            }
        });
    </script>


</body>
</html>