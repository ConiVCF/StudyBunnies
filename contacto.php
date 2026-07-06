<?php
// contacto.php
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cozy Study - Contacto</title>
    <link rel="icon" type="image/png" href="assets/img/favicon.png">
    <link rel="shortcut icon" type="image/x-icon" href="assets/img/favicon.ico">
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/contacto.css">
</head>
<body>
    <div class="container">
        <div class="contacto-topbar">
            <h1>📬 Contacto</h1>
            <a class="volver-link" href="index.php">← Volver al inicio</a>
        </div>

        <?php if (isset($_GET['ok']) && $_GET['ok'] === 'exito'): ?>
            <div class="contacto-mensaje ok">¡Gracias! Tu mensaje fue enviado y guardado correctamente. 🐰</div>
        <?php endif; ?>

        <?php if (isset($_GET['error'])):
            $errores = [
                'faltan_datos'    => 'Completá todos los campos, por favor.',
                'email_invalido'  => 'El email ingresado no es válido.',
                'datos_invalidos' => 'Revisá la longitud del nombre o del mensaje.',
                'error_bd'        => 'Ocurrió un error al guardar tu mensaje. Intentá de nuevo.'
            ];
            $clave = $_GET['error'];
            $texto = $errores[$clave] ?? 'Ocurrió un error inesperado.';
        ?>
            <div class="contacto-mensaje error"><?php echo htmlspecialchars($texto, ENT_QUOTES, 'UTF-8'); ?></div>
        <?php endif; ?>

        <div class="contacto-grid">
            <section class="contacto-panel">
                <h2>Escribinos</h2>
                <form action="enviar_contacto.php" method="POST" class="form-contacto">
                    <label>
                        Nombre
                        <input type="text" name="nombre" maxlength="50" required>
                    </label>
                    <label>
                        Email
                        <input type="email" name="email" maxlength="100" required>
                    </label>
                    <label>
                        Mensaje
                        <textarea name="mensaje" rows="6" maxlength="2000" required></textarea>
                    </label>
                    <button type="submit">Enviar mensaje 🐾</button>
                </form>
            </section>

            <section class="contacto-panel">
                <h2>Dónde encontrarnos</h2>
                <div class="mapa-wrapper">
                    <iframe
                        src="https://www.google.com/maps?q=Buenos%20Aires%2C%20Argentina&output=embed"
                        width="100%" height="300" style="border:0;"
                        allowfullscreen loading="lazy">
                    </iframe>
                </div>
            </section>
        </div>
    </div>
</body>
</html>
