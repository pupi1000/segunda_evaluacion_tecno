const express = require('express');
const { getAndSaveDocuments, listProcessedDocuments } = require('../controllers/dataController'); // Importa los controladores

const router = express.Router();

// Define la ruta POST en tu microservicio para desencadenar el proceso
// Llama a este endpoint POST en tu microservicio para obtener documentos del backend amigo y guardarlos
router.post('/process-documents', getAndSaveDocuments);

// Define una ruta GET en tu microservicio para ver los documentos que ya has procesado y guardado en tu DB SQLite
router.get('/processed-documents', listProcessedDocuments);


module.exports = router;