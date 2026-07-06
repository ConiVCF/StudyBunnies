<?php
// backend/controllers/AIController.php
// Proxy server-side hacia la API de Gemini.
// El frontend nunca ve la API key: solo manda el historial de conversación
// y este controlador arma el pedido real hacia Google.

session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/AuthGuard.php';
require_once __DIR__ . '/../models/ChatMensaje.php';

// Solo usuarios logueados pueden gastar cuota de la API de IA
AuthGuard::requireLoginApi();

// Leemos el body JSON que manda APIManager.js
$input = json_decode(file_get_contents('php://input'), true);
$conversationHistory = $input['conversationHistory'] ?? null;
$modo = $input['modo'] ?? 'chat'; // 🌟 'chat' (normal) o 'quiz' (opción múltiple)

if (!is_array($conversationHistory) || empty($conversationHistory)) {
    http_response_code(400);
    echo json_encode(['error' => 'Falta el historial de conversación.']);
    exit;
}

$nombreJugador = $_SESSION['nombre'] ?? 'Estudiante';

$systemPrompt = $modo === 'quiz'
    ? construirSystemPromptQuiz($nombreJugador)
    : construirSystemPrompt($nombreJugador);

$respuesta = consultarGemini($systemPrompt, $conversationHistory, $modo);

// 🌟 Memoria: guardamos el intercambio (solo en modo chat normal, no en quiz)
if ($modo === 'chat' && $respuesta['status'] === 200) {
    guardarIntercambioEnMemoria((int) $_SESSION['id_usuario'], $conversationHistory, $respuesta['body']);
}

http_response_code($respuesta['status']);
echo $respuesta['body'];

// ==========================================
//   FUNCIONES
// ==========================================

// Guarda en MySQL el último mensaje del alumno y la respuesta del profesor,
// para que la próxima vez que entre, el chat siga donde había quedado.
function guardarIntercambioEnMemoria($idUsuario, $conversationHistory, $bodyRespuestaGemini) {
    $ultimoMensajeUsuario = end($conversationHistory);
    if (!$ultimoMensajeUsuario || ($ultimoMensajeUsuario['role'] ?? '') !== 'user') {
        return;
    }

    $textoUsuario = '';
    foreach ($ultimoMensajeUsuario['parts'] ?? [] as $parte) {
        if (isset($parte['text'])) {
            $textoUsuario .= $parte['text'];
        }
    }
    if ($textoUsuario === '') return;

    $data = json_decode($bodyRespuestaGemini, true);
    $textoRespuesta = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
    if ($textoRespuesta === null) return;

    $chatModel = new ChatMensaje();
    $chatModel->guardar($idUsuario, 'user', $textoUsuario);
    $chatModel->guardar($idUsuario, 'model', $textoRespuesta);
}

function construirSystemPrompt($nombreJugador) {
    return "Eres el Profesor Michi (un gato callejero sabio y paciente que vive en una biblioteca mágica), tutor académico dentro de un entorno de estudio gamificado. Tu prioridad es enseñar bien, no solo responder.

Tu alumno/a se llama {$nombreJugador}.

MÉTODO DE ENSEÑANZA (seguilo en este orden, adaptándolo a cada consulta):
1. Si la pregunta es ambigua o te falta contexto sobre qué tanto sabe el estudiante del tema, preguntá primero antes de largar una explicación larga.
2. Explicá la idea central con tus propias palabras, de la forma más simple posible sin perder precisión.
3. Dá un ejemplo concreto o una analogía que conecte con algo cotidiano.
4. Cerrá con una pregunta corta para chequear que se haya entendido, o invitá a seguir profundizando si el alumno quiere.
5. Si no estás seguro de un dato o es un tema muy específico/actual, decilo con honestidad en vez de inventar una respuesta.

Otras responsabilidades: generar resúmenes, ejercicios prácticos y evaluaciones cuando te lo pidan, y recordar (usás el historial de la conversación) lo que ya se habló antes para no repetirte y para construir sobre lo ya explicado.

REGLAS ESTRICTAS DE FORMATO:
- Respuestas cortas y concisas (1 a 4 párrafos breves), pensadas para una cajita de chat de videojuego.
- NO uses formato Markdown (cero asteriscos, cero negritas, cero listas complejas). Texto plano puro.
- Mantené tu personalidad felina de forma sutil, sin que le reste seriedad a la explicación: algún emoji ocasional (🐾, 📚, 💡) y un \"miau\" o ronroneo breve al saludar o despedirte, nada más.";
}

// 🌟 Prompt para el modo Quiz: le pedimos a Gemini una única pregunta de
// opción múltiple sobre lo último que se conversó, en JSON estricto
// (el formato exacto lo garantiza el responseSchema de consultarGemini).
function construirSystemPromptQuiz($nombreJugador) {
    return "Eres el Profesor Michi, un tutor con IA dentro de un juego de estudio gamificado.

Tu alumno/a se llama {$nombreJugador}. Basándote en el tema que estuvo consultando en la conversación previa, generá UNA sola pregunta de opción múltiple para repasar ese contenido. Si todavía no quedó claro ningún tema en la conversación, elegí una pregunta general de cultura académica y avisalo con humor dentro de la propia pregunta.

Reglas estrictas:
- Exactamente 4 opciones, una sola correcta.
- 'correcta' es el índice (0, 1, 2 o 3) de la opción correcta dentro de 'opciones'.
- 'explicacion' debe justificar en 1 o 2 frases cortas, cálidas y motivadoras, por qué esa opción es la correcta (y de paso por qué las otras no), sin markdown, pensada para una cajita de chat de videojuego.
- No repitas la misma pregunta si ya se hizo una similar antes en la conversación.
- Devolvé ÚNICAMENTE los campos pedidos, sin texto adicional fuera del JSON.";
}

function consultarGemini($systemPrompt, $conversationHistory, $modo = 'chat') {
    $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . GEMINI_API_KEY;

    $generationConfig = ['temperature' => 0.7, 'maxOutputTokens' => 800];

    // 🌟 En modo quiz le exigimos a Gemini un JSON con esta forma exacta,
    // así el frontend no tiene que "adivinar" ni parsear texto libre.
    if ($modo === 'quiz') {
        $generationConfig['responseMimeType'] = 'application/json';
        $generationConfig['responseSchema'] = [
            'type' => 'OBJECT',
            'properties' => [
                'pregunta'    => ['type' => 'STRING'],
                'opciones'    => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
                'correcta'    => ['type' => 'INTEGER'],
                'explicacion' => ['type' => 'STRING']
            ],
            'required' => ['pregunta', 'opciones', 'correcta', 'explicacion']
        ];
    }

    $payload = json_encode([
        'systemInstruction' => ['parts' => [['text' => $systemPrompt]]],
        'contents' => $conversationHistory,
        'generationConfig' => $generationConfig
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
