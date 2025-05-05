require('dotenv').config(); // Carga las variables de entorno desde .env
const express = require('express');
const { connectDB } = require('./config/db'); // Importa la función de conexión a SQLite
const dataRoutes = require('./routes/dataRoutes'); // Importa las rutas de tu microservicio

const app = express();

// Conectar a la base de datos SQLite de tu microservicio
connectDB();

// Middleware para parsear JSON en las peticiones entrantes a tu microservicio
app.use(express.json());

// Rutas de tu microservicio
app.use('/api/v1', dataRoutes); // Ejemplo: prefijo /api/v1 para tus rutas


// Ruta básica de ejemplo para verificar que tu microservicio está corriendo
app.get('/', (req, res) => {
  res.send('Microservicio de Tecnologías Web II corriendo y conectado a SQLite');
});


const PORT = process.env.PORT || 5000; // Usa el puerto de .env o 5000 por defecto

app.listen(PORT, () => {
  console.log(`Microservicio corriendo en http://localhost:${PORT}`);
  // console.log(`Conectado a la Base de Datos: ${process.env.MONGODB_URI}`); // Esto era para MongoDB, con SQLite no aplica
});