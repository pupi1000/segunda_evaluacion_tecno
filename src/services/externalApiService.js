const axios = require('axios');

const EXTERNAL_API_LOGIN_URL = process.env.EXTERNAL_API_LOGIN_URL;
const EXTERNAL_API_DOCUMENTS_URL = process.env.EXTERNAL_API_DOCUMENTS_URL;

const EXTERNAL_API_USER = process.env.EXTERNAL_API_USER; // Asumo que es el correo
const EXTERNAL_API_PASSWORD = process.env.EXTERNAL_API_PASSWORD;

// Variables para almacenar el token y su expiración en memoria
let apiToken = null;
let tokenExpiry = 0; // Timestamp (milisegundos) cuando el token expira

// Función para iniciar sesión en el backend de tu amigo
const loginExternalApi = async () => {
  console.log(`[Microservicio] Intentando iniciar sesión en el backend de tu amigo en ${EXTERNAL_API_LOGIN_URL}...`);
  try {
    // *** ¡ADAPTA ESTE CUERPO DE PETICIÓN EXACTAMENTE A LO QUE ESPERA EL LOGIN DE TU AMIGO! ***
    // Basado en el userControllers.js que pasaste, espera correo y contraseña
    const response = await axios.post(EXTERNAL_API_LOGIN_URL, {
      correo: EXTERNAL_API_USER, // Usa 'correo' si eso espera su backend
      contraseña: EXTERNAL_API_PASSWORD, // Usa 'contraseña' si eso espera su backend
      // Si espera otros campos, añádelos aquí
    });

    // *** ¡ADAPTA ESTO! ***
    // Extrae el token. Basado en el userControllers.js, devuelve response.data.token
    const token = response.data.token; // <-- ¡CAMBIA ESTO si el campo se llama diferente!

    // El backend de tu amigo usa expiresIn: '1h' en jwt.sign.
    // La respuesta de login no devuelve la expiración directamente,
    // así que asumimos que el token dura 1 hora y calculamos la expiración.
    const expiresInSeconds = 3600; // 1 hora = 3600 segundos (basado en jwt.sign de tu amigo)

    if (!token) {
         throw new Error('No se recibió un token en la respuesta de login del backend amigo.');
    }

    apiToken = token;
    // Calcula el timestamp de expiración: ahora + tiempo de vida en milisegundos, restamos un pequeño margen (ej: 60 seg)
    tokenExpiry = Date.now() + (expiresInSeconds * 1000) - 60000; // 60000 ms = 1 minuto de margen

    console.log('[Microservicio] Login exitoso con backend amigo. Token obtenido. Expirará en:', new Date(tokenExpiry).toLocaleString());
    return apiToken;

  } catch (error) {
    console.error('[Microservicio] Error en el login del backend amigo:', error.message);
    // Loguear más detalles del error si es necesario: error.response?.data, error.response?.status
    apiToken = null; // Asegurarse de que el token se resetee si falla el login
    tokenExpiry = 0;
    throw new Error(`[Microservicio] Fallo al iniciar sesión en el backend amigo: ${error.message}. Verifica URL (${EXTERNAL_API_LOGIN_URL}) y credenciales.`);
  }
};

// Función para obtener el token, iniciando sesión si es necesario
const getAuthToken = async () => {
  // Verifica si tenemos un token y si aún es válido (con el margen)
  if (!apiToken || Date.now() >= tokenExpiry) {
    console.log('[Microservicio] Token no disponible o expirado. Iniciando sesión con backend amigo...');
    await loginExternalApi(); // Intenta obtener un nuevo token
  }
  // En este punto, apiToken debería contener un token válido o el loginExternalApi lanzó un error
  return apiToken;
};


// Función para obtener Documentos del backend de tu amigo (Endpoint REST GET)
// Basado en el controller, este endpoint obtiene *todos* los documentos y no recibe parámetros para filtrar.
const fetchDocuments = async () => { // No recibe parámetros si el endpoint GET obtiene todo
  try {
    // 1. Obtener un token de autenticación válido
    const token = await getAuthToken(); // Llama a la función que maneja el login/expiración

    // Verifica que tenemos un token antes de continuar
    if (!token) {
         throw new Error('[Microservicio] No se pudo obtener un token de autenticación para backend amigo.');
    }

    console.log(`[Microservicio] Obteniendo documentos del backend amigo en ${EXTERNAL_API_DOCUMENTS_URL}...`);

    // 2. Realiza la petición GET incluyendo el token de autenticación
    // Asumimos que el endpoint GET /documents requiere autenticación JWT Bearer
    const response = await axios.get(EXTERNAL_API_DOCUMENTS_URL, {
      headers: { // Incluye el token en el header de autorización
        'Authorization': `Bearer ${token}`, // Asumimos esquema Bearer
        // 'Content-Type': 'application/json' // GETs usualmente no necesitan Content-Type en request
      }
    });

    // 3. Manejar la respuesta
    // Asumo que el backend de tu amigo devuelve la lista de documentos directamente en response.data
    // Basado en obtenerDocumentos de tu amigo: res.status(200).json(documentos);
    const documents = response.data; // <-- La lista de documentos debería estar aquí

    if (!documents || !Array.isArray(documents)) {
        console.warn("[Microservicio] La respuesta del backend amigo no parece ser una lista de documentos:", documents);
        // Decide si lanzar un error o devolver una lista vacía
        // throw new Error("La API externa no devolvió una lista de documentos válida.");
        return []; // Devuelve lista vacía si la respuesta no es un array
    }


    console.log(`[Microservicio] Obtenidos ${documents.length} documentos del backend amigo.`);
    return documents; // Retorna la lista de documentos

  } catch (error) {
    console.error('[Microservicio] Error al consumir el endpoint de documentos del backend amigo:', error.message);
    // Loguear más detalles: error.response?.data, error.response?.status
    // Si el error es 401 (Unauthorized), puede indicar un problema con el token.
    if (error.response?.status === 401) {
         console.error("[Microservicio] Posible problema de autenticación con backend amigo (401 Unauthorized). Token inválido o expirado, o el endpoint requiere auth.");
         // Invalidar el token actual para forzar un nuevo login en el próximo intento
         apiToken = null;
         tokenExpiry = 0;
    } else if (error.response?.status === 404) {
         console.error(`[Microservicio] Endpoint de documentos no encontrado (404 Not Found) en: ${EXTERNAL_API_DOCUMENTS_URL}`);
    }
    throw new Error(`[Microservicio] Fallo al obtener documentos del backend amigo: ${error.message}`);
  }
};

module.exports = {
  fetchDocuments, // Cambiamos el nombre a algo específico para documentos
};