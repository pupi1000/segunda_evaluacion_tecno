const { fetchDocuments } = require('../services/externalApiService');
const { ProcessedDocument } = require('../config/db'); // Importa el modelo ProcessedDocument de SQLite


// Controlador para obtener documentos del backend amigo, procesarlos y guardarlos en SQLite
const getAndSaveDocuments = async (req, res) => {
  // Este endpoint de tu microservicio no necesita body si fetchDocuments obtiene todo
  // const { someParam } = req.body; // <--- Elimina esto si fetchDocuments no usa parámetros


  try {
    // 1. Consumir el endpoint de documentos del backend amigo
    console.log('[Microservicio] Recibida petición para procesar documentos.');
    const documents = await fetchDocuments(); // Llama al servicio (sin parámetros si obtiene todo)

    if (!documents || documents.length === 0) {
       console.log('[Microservicio] No se encontraron documentos en el backend amigo o la lista está vacía.');
       return res.status(200).json({ message: 'No se encontraron documentos en el backend amigo', fetchedCount: 0, processedCount: 0, data: [] }); // Devuelve 200 OK con lista vacía
    }

    console.log(`[Microservicio] Encontrados ${documents.length} documentos. Procesando y guardando en SQLite...`);

    // 2. Procesar, transformar y guardar los documentos en la base de datos (SQLite de tu microservicio)
    const savedDocuments = [];
    for (const document of documents) {
      // Aquí va tu lógica específica de procesamiento/transformación por cada documento
      // Mapea los campos del documento obtenido de la API a tu modelo ProcessedDocument
      const transformedDocumentData = {
        // *** ¡ADAPTA ESTO! ***
        // Mapea document.[nombreDelCampoDeLaAPI] a los campos de tu modelo SQLite
        originalId: String(document._id), // Asumo que el ID de Mongoose se llama _id y lo convertimos a String
        titulo: document.titulo, // Usa el nombre EXACTO del campo en el JSON de la API de tu amigo
        autor: document.autor,   // Usa el nombre EXACTO del campo en el JSON de la API de tu amigo
        fechaDocumento: document.fecha, // Usa el nombre EXACTO
        tipo: document.tipo,
        categoria: document.categoria,
        archivoUrl: document.archivo_url, // Nota: nombre en camelCase en mi modelo, snake_case en su API. Mapear!
        fechaProcesado: new Date() // Fecha/hora actual de procesamiento por tu microservicio
        // ... mapea otros campos relevantes
      };
       console.log(`[Microservicio] Transformando documento: ${transformedDocumentData.titulo}`);


      // Usar upsert: si ya existe un registro con el mismo originalId, lo actualiza; si no, lo crea.
      // Esto es útil si corres el mismo proceso varias veces.
      const [processedDocument, created] = await ProcessedDocument.upsert(transformedDocumentData);

      savedDocuments.push(processedDocument); // Añade el objeto guardado/actualizado a la lista
      console.log(`[Microservicio] Documento '${processedDocument.titulo}' ${created ? 'guardado' : 'actualizado'} en SQLite.`);
    }

    // 3. Enviar la respuesta de tu microservicio
    res.status(200).json({
      message: `${documents.length} documentos encontrados y procesados.`,
      fetchedCount: documents.length,
      processedCount: savedDocuments.length,
      data: documents // Devuelve los documentos obtenidos del backend amigo en la respuesta de tu microservicio
      // data: savedDocuments // Alternativamente, puedes devolver los datos de la DB de tu microservicio
    });

  } catch (error) {
    console.error('[Microservicio] Error en el controlador getAndSaveDocuments:', error.message);
    // Los errores de login o de la API externa se propagan hasta aquí
    res.status(500).json({
      message: '[Microservicio] Error interno del servidor al procesar documentos',
      error: error.message
    });
  }
};

// Puedes añadir otros controladores si tu microservicio expone más endpoints
// Ejemplo: un endpoint para obtener solo los datos ya procesados desde la DB SQLite de tu microservicio
const listProcessedDocuments = async (req, res) => {
  try {
    console.log('[Microservicio] Recibida petición para listar documentos procesados.');
    const processedDocuments = await ProcessedDocument.findAll(); // Obtiene todos los registros de la tabla processed_documents de SQLite
    console.log(`[Microservicio] Encontrados ${processedDocuments.length} documentos procesados en SQLite.`);
    res.status(200).json(processedDocuments);
  } catch (error) {
    console.error('[Microservicio] Error al obtener datos procesados de SQLite:', error.message);
    res.status(500).json({ message: '[Microservicio] Error al obtener datos procesados de SQLite', error: error.message });
  }
};


module.exports = {
  getAndSaveDocuments,
  listProcessedDocuments // Exporta también el controlador para listar datos procesados
};