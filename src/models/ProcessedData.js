// src/models/ProcessedData.js
module.exports = (sequelize, DataTypes) => {
    const ProcessedData = sequelize.define('ProcessedData', {
      // Sequelize automáticamente agrega un campo 'id' como clave primaria autoincremental
      originalId: {
        type: DataTypes.STRING, // O el tipo de dato que use el ID de la película en la API externa
        unique: true, // Asegura que no haya duplicados basados en el ID original
        allowNull: false
      },
      title: { // Ejemplo: Título de la película
        type: DataTypes.STRING,
        allowNull: false
      },
      releaseYear: { // Ejemplo: Año de lanzamiento
        type: DataTypes.INTEGER
      },
      // Añade aquí otros campos relevantes de la película que quieras guardar
      processedNotes: { // Ejemplo: Alguna nota o campo calculado por tu microservicio
        type: DataTypes.STRING
      }
      // Sequelize añade automáticamente createdAt y updatedAt
    }, {
      // Opciones del modelo
      tableName: 'processed_data' // Nombre opcional para la tabla en la DB
    });
  
    return ProcessedData;
  };