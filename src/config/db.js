// src/config/db.js - VERIFICA QUE TU ARCHIVO TENGA ESTE CONTENIDO EXACTO

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', '..', 'database.sqlite'),
  logging: false
});

// --- Define tus modelos aquí o impórtalos ---
// La forma recomendada por Sequelize es importar funciones que definen los modelos:
const ProcessedData = require('../models/ProcessedData')(sequelize, DataTypes);
// Si tuvieras más modelos:
// const OtroModelo = require('../models/OtroModelo')(sequelize, DataTypes);
// --- Fin de definición/importación de modelos ---


// --- Define la función de conexión ---
const connectDB = async () => { // <-- ASEGÚRATE DE QUE ESTA FUNCIÓN ESTÁ DEFINIDA ASÍ
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos SQLite establecida exitosamente.');

    // Sincroniza modelos (crea tablas si no existen)
    await sequelize.sync();
    console.log('Modelos de base de datos sincronizados.');

  } catch (error) {
    console.error('Error al conectar o sincronizar la base de datos:', error);
    process.exit(1);
  }
};
// --- Fin de la función de conexión ---


// --- Exporta los elementos necesarios ---
module.exports = {
  sequelize, // Exporta la instancia de sequelize
  connectDB, // <-- ASEGÚRATE DE QUE connectDB ESTÁ INCLUIDA AQUÍ EN LA EXPORTACIÓN
  ProcessedData // Exporta los modelos
  // Exporta otros modelos si los tienes: OtroModelo
};
// --- Fin de la exportación ---