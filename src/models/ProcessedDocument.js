// src/models/ProcessedDocument.js

module.exports = (sequelize, DataTypes) => {
    const ProcessedDocument = sequelize.define('ProcessedDocument', {
      // ID original del documento del backend de tu amigo
      originalId: {
        type: DataTypes.STRING, // Usamos STRING por si acaso, aunque ObjectId de Mongoose sea hex
        unique: true, // Cada documento procesado debe tener un ID original único
        allowNull: false
      },
      // Campos relevantes del Documento de tu amigo que quieras guardar
      titulo: {
        type: DataTypes.STRING,
        allowNull: false
      },
      autor: {
        type: DataTypes.STRING
        // Puedes hacerlo allowNull: false si el autor siempre viene
      },
      fechaDocumento: { // Renombramos para no confundir con fecha de procesamiento
          type: DataTypes.DATE
      },
      tipo: { // 'PDF', 'TIFF', etc.
          type: DataTypes.STRING
      },
      categoria: {
          type: DataTypes.STRING
      },
      archivoUrl: { // Renombramos a camelCase si prefieres
          type: DataTypes.STRING
      },
      // Puedes añadir otros campos que te interesen...
      // Ejemplo: un campo de procesamiento adicional
      fechaProcesado: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW // O DataTypes.NOW
      }
      // Sequelize añadirá automáticamente createdAt y updatedAt
    }, {
      // Opciones del modelo
      tableName: 'processed_documents' // Nombre de la tabla en SQLite
    });
  
    return ProcessedDocument;
  };