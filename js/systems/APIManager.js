export class APIManager {
    constructor() {
        // 🌟 La API key ya NO vive acá. Ahora este manager le habla
        // a nuestro propio backend (AIController.php), que es quien
        // se comunica con Gemini usando la key guardada en el servidor.
        this.endpoint = 'backend/controllers/AIController.php';
    }

    // 🌟 VERSIÓN RESILIENTE (Exponential Backoff)
    // Recibe el historial completo de conversación y se lo pasa tal cual
    // a nuestro backend, que arma el prompt del sistema y llama a Gemini.
    async askQuestion(conversationHistory) {
        let attempt = 0;
        const maxRetries = 3; // Intentará hasta 3 veces
        let delay = 1000;     // Comienza esperando 1 segundo

        while (attempt < maxRetries) {
            try {
                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    credentials: 'same-origin', // 🌟 IMPORTANTE: manda la cookie PHPSESSID
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversationHistory: conversationHistory
                    })
                });

                if (!response.ok) {
                    // Si el servidor está saturado (503, 500, 429)
                    if (response.status >= 500 || response.status === 429 || response.status === 503) {
                        console.warn(`[API] Servidor congestionado (Error ${response.status}). Reintento ${attempt + 1}/${maxRetries} en ${delay}ms...`);
                        attempt++;
                        if (attempt >= maxRetries) break; // Si superó el límite, sale del bucle

                        await new Promise(res => setTimeout(res, delay));
                        delay *= 2; // Duplica el tiempo de espera (1s -> 2s -> 4s)
                        continue;
                    }

                    // Si es 401 (no logueado) o 400 (mal armado), no tiene sentido reintentar
                    if (response.status === 401) {
                        return "Necesitas iniciar sesión para hablar conmigo. 🐾";
                    }

                    // Si es otro error grave, cancela inmediato
                    return `Ups, Error ${response.status}: Algo falló con la estructura de la consulta. 🔧`;
                }

                const data = await response.json();
                if (data.candidates && data.candidates.length > 0) {
                    return data.candidates[0].content.parts[0].text;
                } else {
                    return "Me quedé en blanco por un momento... ¿Puedes repetirlo? 🐾";
                }

            } catch (error) {
                console.error("Error de Red en APIManager:", error);
                attempt++;
                if (attempt >= maxRetries) {
                    return "No me pude conectar a internet tras varios intentos. Revisa tu conexión. 🌧️";
                }
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            }
        }

        // Si el bucle termina y fallaron los 3 intentos:
        return "El servidor está muy congestionado en este momento (Error 503). Por favor, intenta de nuevo en unos segundos. 🐈";
    }

    // 🌟 Igual que askQuestion, pero le pide a nuestro backend el modo 'quiz':
    // Gemini devuelve un JSON estricto (pregunta, opciones, correcta, explicacion)
    // gracias al responseSchema que arma AIController.php. Devuelve el objeto
    // ya parseado, o null si algo falla (para que la UI muestre un mensaje amable).
    async askQuiz(conversationHistory) {
        let attempt = 0;
        const maxRetries = 3;
        let delay = 1000;

        while (attempt < maxRetries) {
            try {
                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversationHistory: conversationHistory,
                        modo: 'quiz'
                    })
                });

                if (!response.ok) {
                    if (response.status >= 500 || response.status === 429 || response.status === 503) {
                        attempt++;
                        if (attempt >= maxRetries) break;
                        await new Promise(res => setTimeout(res, delay));
                        delay *= 2;
                        continue;
                    }
                    return null; // 401, 400 u otro error: no tiene sentido reintentar
                }

                const data = await response.json();
                if (data.candidates && data.candidates.length > 0) {
                    const rawText = data.candidates[0].content.parts[0].text;
                    try {
                        return JSON.parse(rawText);
                    } catch (parseError) {
                        console.error("[API] El quiz no vino en JSON válido:", parseError, rawText);
                        return null;
                    }
                }
                return null;

            } catch (error) {
                console.error("Error de Red pidiendo el quiz:", error);
                attempt++;
                if (attempt >= maxRetries) return null;
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            }
        }

        return null;
    }
}
