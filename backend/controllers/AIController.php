<?php
// backend/controllers/AIController.php
// Proxy server-side hacia la API de Gemini.
// El frontend nunca ve la API key: solo manda el historial de conversación
// y este controlador arma el pedido real hacia Google.

session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/AuthGuard.php';

// Solo usuarios logueados pueden gastar cuota de la API de IA
AuthGuard::requireLoginApi();

// Leemos el body JSON que manda APIManager.js
$input = json_decode(file_get_contents('php://input'), true);
$conversationHistory = $input['conversationHistory'] ?? null;

if (!is_array($conversationHistory) || empty($conversationHistory)) {
    http_response_code(400);
    echo json_encode(['error' => 'Falta el historial de conversación.']);
    exit;
}

$nombreJugador = $_SESSION['nombre'] ?? 'Estudiante';

$systemPrompt = construirSystemPrompt($nombreJugador);
$respuesta = consultarGemini($systemPrompt, $conversationHistory);

http_response_code($respuesta['status']);
echo $respuesta['body'];

// ==========================================
//   FUNCIONES
// ==========================================

function construirSystemPrompt($nombreJugador) {
    return "Eres el Profesor Michi (un sabio, paciente y adorable gato callejero que vive en una biblioteca mágica), un tutor inteligente, universal y permanente en un entorno virtual de estudio gamificado.

Tu misión absoluta es adaptarte a cualquier estudiante, independientemente de su edad, país, nivel académico o área de conocimiento.

Tus responsabilidades principales son:
1. Resolver dudas académicas sobre CUALQUIER temática con precisión.
2. Explicar conceptos de manera personalizada, ajustándote siempre al nivel de conocimiento que demuestre el estudiante.
3. Generar resúmenes, ejemplos, ejercicios prácticos y material de refuerzo cuando sea útil.
4. Crear evaluaciones, cuestionarios y simulacros de examen si el estudiante lo solicita.
5. Actuar como mentor educativo, motivando constantemente el progreso dentro de esta experiencia gamificada.

Tu alumno/a actual se llama {$nombreJugador}. Háblale por su nombre de vez en cuando de forma motivadora, empática y cálida.

REGLAS ESTRICTAS DE FORMATO Y COMPORTAMIENTO:
- Tus explicaciones deben ser fáciles de digerir, estructuradas y concisas (1 a 4 párrafos cortos máximo), pensadas para leerse en una pequeña caja de chat de un videojuego.
- NO uses formato Markdown bajo ninguna circunstancia. CERO asteriscos (*), CERO negritas, CERO listas con viñetas complejas o bloques de código.
- Responde única y estrictamente en TEXTO PLANO PURO.
- Mantén tu personalidad felina sutilmente. Usa emojis adorables y académicos ocasionalmente (🐾, 🧶, 📚, 🌍, 💡, ✨, 🐟). Puedes hacer un sutil \"miau\" o ronroneo al saludar, felicitar o despedirte.";
}

function consultarGemini($systemPrompt, $conversationHistory) {
    $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . GEMINI_API_KEY;

    $payload = json_encode([
        'systemInstruction' => ['parts' => [['text' => $systemPrompt]]],
        'contents' => $conversationHistory,
        'generationConfig' => ['temperature' => 0.7, 'maxOutputTokens' => 800]
    ]);

    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        return [
            'status' => 502,
            'body' => json_encode(['error' => 'No se pudo conectar con el servicio de IA.'])
        ];
    }

    return [
        'status' => $httpCode ?: 500,
        'body' => $response
    ];
}
