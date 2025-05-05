# Microservicio - Evaluación Tecnologías Web II

https://docs.google.com/document/d/1o7-U2wm-yWZA5dKs7gnNC1p0YLv7ut-RcFxRg4t5zFI/edit?usp=sharing

LINK PARA LAS CAPTURAS DE PANTALLA

Este es un microservicio independiente desarrollado como parte de la evaluación de Tecnologías Web II. Su objetivo principal es consumir un endpoint específico del "Proyecto Integrador" (el backend de gestión de documentos de un amigo), procesar la información obtenida (documentos) y almacenarla localmente en una base de datos SQLite, exponiendo a su vez un endpoint propio para desencadenar este proceso.

## 1. Análisis del Proyecto Integrador (Según requerimiento de evaluación)

* **Endpoint Consumido:** Obtiene una lista de documentos del backend de gestión.
    * URL: `http://localhost:5000/api/` *(Nota: La URL exacta puede variar si el backend amigo usa un puerto diferente o una ruta base distinta para sus documentos)*
    * Método HTTP: `GET`
    * Formato de Datos: `JSON`
* **Endpoint de Autenticación Consumido:** Endpoint de login del backend de gestión.
    * URL: `http://localhost:5000/api/auth/login` *(Nota: La URL exacta puede variar)*
    * Método HTTP: `POST`
    * Formato de Datos (Petición): `JSON` (espera `{ "correo": "...", "contraseña": "..." }`)
    * Formato de Datos (Respuesta): `JSON` (devuelve `{ "mensaje": "...", "token": "..." }`)
* **Justificación de la Elección:** Se eligió consumir el endpoint que provee la lista de documentos ya que cumple con el requisito de interactuar con un endpoint del "Proyecto Integrador" (el backend disponible). La información de documentos es relevante y permite demostrar el proceso de obtención, procesamiento y almacenamiento. El endpoint de login se consume ya que el endpoint de documentos requiere autenticación vía JWT.
* **Descripción Técnica del Endpoint de Documentos:** Este endpoint `GET` devuelve un arreglo de objetos JSON, donde cada objeto representa un documento. La estructura de un documento es aproximadamente (basado en el `DocumentSchema` del backend amigo):
    ```json
    [
      {
        "_id": "...", // ID único del documento en MongoDB (string)
        "titulo": "...", // Título del documento (string)
        "autor": "...", // Autor (string)
        "fecha": "...", // Fecha (string o fecha ISO)
        "tipo": "...", // Tipo ('PDF', 'TIFF', etc.) (string)
        "categoria": "...", // Categoría (string)
        "etiquetas": [], // Arreglo de strings
        "archivo_url": "...", // URL del archivo (string)
        "descripcion": "...", // Descripción (string)
        "fecha_subida": "...", // Fecha de subida (string o fecha ISO)
        "usuario_responsable": "...", // ID del usuario responsable (string)
        "comentarios": [], // Arreglo de objetos comentario
        "versiones": [], // Arreglo de objetos versión
        "__v": 0
      },
      // ... más objetos documento
    ]
    ```
    El endpoint requiere autenticación válida con un token JWT en el header `Authorization: Bearer [token]`.

## 2. Diseño del Microservicio (Según requerimiento de evaluación)

* **Objetivo del Microservicio:** Obtener periódicamente (o bajo demanda vía su endpoint expuesto) la lista de documentos del backend de gestión, almacenar una copia local de los datos relevantes de estos documentos en una base de datos SQLite y gestionar automáticamente la autenticación necesaria (login y uso de token JWT) para acceder al backend externo.
* **Tecnología de Comunicación Elegida:** REST (para consumir los endpoints del backend amigo) con autenticación JWT gestionada vía HTTP Headers. Se utiliza la librería `axios` para realizar las peticiones HTTP.
* **Justificación de la Elección de la Tecnología:** La tecnología REST fue elegida y justificada porque es el estilo arquitectónico que expone el backend del "Proyecto Integrador". Se utiliza `axios` por ser una librería muy común y eficiente para realizar peticiones HTTP en Node.js. La autenticación JWT es una imposición del backend externo y se maneja incluyéndola en los headers de las peticiones salientes.
* **Diagrama del Flujo de Integración:**

    ```mermaid
    graph LR
        A[Cliente/Usuario (Postman)] -- Petición POST /api/v1/process-documents --> B(Tu Microservicio TW2);
        B -- 1. Token expirado? --> C{Backend Amigo};
        C -- 2a. Petición POST /api/auth/login<br>con credenciales --> C;
        C -- 2b. Responde Token JWT --> B;
        B -- 3. Petición GET /api/<br>con Authorization: Bearer [token] --> C;
        C -- 4. Responde Lista de Documentos --> B;
        B -- 5. Procesa Datos<br>y Guarda/Actualiza --> D(Tu Base de Datos SQLite);
        D -- 6. Confirma Operación --> B;
        B -- 7. Envía Respuesta 200 OK --> A;
    ```
    *(Nota: Este diagrama usa Mermaid. Puedes usar otra herramienta como Draw.io y poner la imagen en tu PDF.)*

## 3. Implementación Técnica

* **Tecnologías Usadas:** Node.js, Express (framework web), Axios (cliente HTTP), SQLite (base de datos local), Sequelize (ORM para SQLite), dotenv (variables de entorno). La gestión de JWT se implementa en el código de servicio utilizando `axios` y la lógica de expiración simple.
* **Estructura de Archivos:** El proyecto sigue una estructura modular básica:
    * `server.js`: Punto de entrada, configura Express y DB, monta rutas.
    * `.env`: Variables de entorno (puertos, URLs externas, credenciales).
    * `src/config/db.js`: Configuración y conexión a la base de datos SQLite usando Sequelize. Define y sincroniza los modelos.
    * `src/models/ProcessedDocument.js`: Define el modelo Sequelize para la tabla `processed_documents` en SQLite, basándose en los campos relevantes de los documentos externos.
    * `src/routes/dataRoutes.js`: Define los endpoints expuestos por este microservicio (`/api/v1/process-documents`, `/api/v1/processed-documents`).
    * `src/controllers/dataController.js`: Contiene la lógica para manejar las peticiones a las rutas expuestas. Llama al servicio externo, procesa y guarda los datos.
    * `src/services/externalApiService.js`: Encapsula la lógica para interactuar con el backend amigo, incluyendo la función `loginExternalApi` (maneja la autenticación y obtención del token) y `WorkspaceDocuments` (usa el token para llamar al endpoint de documentos).
* **Configuración:**
    * Clona el repositorio de este microservicio.
    * Crea un archivo `.env` en la raíz del proyecto.
    * Configura las variables `PORT`, `EXTERNAL_API_LOGIN_URL`, `EXTERNAL_API_DOCUMENTS_URL`, `EXTERNAL_API_USER`, `EXTERNAL_API_PASSWORD` con los valores correctos del backend amigo (URLs exactas y credenciales de prueba).
    * Instala las dependencias: `npm install`
* **Cómo Correr:**
    * **Prerrequisito:** Asegúrate de que el backend del amigo esté corriendo y accesible en `http://localhost:5000` (o su puerto configurado) y conectado a su base de datos MongoDB.
    * Modo Desarrollo (con nodemon): `npm run dev` (en la carpeta de este microservicio)
    * Modo Producción: `npm start` (en la carpeta de este microservicio)
* **Endpoints Expuestos por *Este* Microservicio:**
    * `POST /api/v1/process-documents`
        * **Descripción:** Desencadena el proceso de autenticación con el backend amigo, obtención de todos los documentos de su API, procesamiento mínimo (mapeo de campos) y guardado/actualización de los documentos en la base de datos SQLite local de este microservicio.
        * **Cuerpo de la Petición (JSON):** No requiere cuerpo (envía `{}`).
        * **Respuesta Exitosa (200 OK):** Devuelve un JSON indicando la cantidad de documentos encontrados y procesados, junto con la lista de documentos obtenidos del backend amigo.
            ```json
            {
              "message": "X documentos encontrados y procesados.",
              "fetchedCount": X,
              "processedCount": X,
              "data": [ { ...documento }, { ...documento }, ... ] // Documentos obtenidos del backend amigo
            }
            ```
        * **Respuesta de Error (500 Internal Server Error):** Si ocurre un error durante la autenticación, la obtención de datos del backend amigo, o el guardado en la base de datos SQLite. El cuerpo del error incluirá un mensaje más detallado.
    * `GET /api/v1/processed-documents`
        * **Descripción:** Obtiene y devuelve todos los documentos que han sido procesados y guardados previamente en la base de datos SQLite local de este microservicio. No llama al backend amigo.
        * **Cuerpo de la Petición (JSON):** No requiere cuerpo.
        * **Respuesta Exitosa (200 OK):** Devuelve un arreglo JSON con los documentos almacenados en la base de datos SQLite.
            ```json
            [
              {
                "id": 1, // ID generado por Sequelize en SQLite
                "originalId": "...", // ID del documento en MongoDB amigo
                "titulo": "...",
                "autor": "...",
                // ... otros campos guardados en SQLite
                "createdAt": "...", // Timestamps de Sequelize
                "updatedAt": "..."
              },
              // ... más objetos documento procesados
            ]
            ```
        * **Respuesta de Error (500 Internal Server Error):** Si ocurre un error al acceder a la base de datos SQLite.

## 4. Pruebas y Documentación (Según requerimiento de evaluación)

* **Evidencias Funcionales (Punto 4.1):** 
    * *Ejemplo de Evidencia:* Captura de Postman mostrando la petición `POST http://localhost:3000/api/v1/process-documents` y la respuesta `200 OK` con la lista de documentos. Captura de pantalla de "DB Browser for SQLite" mostrando la tabla `processed_documents` con los datos guardados después de ejecutar la petición.
* **Pruebas (Punto 4.2):** [Describe las pruebas manuales que realizaste para verificar el funcionamiento.]
    * *Ejemplo de Prueba Manual:* 1. Asegurarse de que ambos backends estén corriendo. 2. Enviar una petición `POST` a `/api/v1/process-documents` usando Postman. 3. Verificar en la consola del microservicio que se realizó el login (si fue necesario) y la obtención de documentos. 4. Verificar la respuesta 200 OK en Postman y el contenido retornado. 5. Abrir la base de datos `database.sqlite` y confirmar que los documentos se guardaron o actualizaron correctamente en la tabla `processed_documents`. 6. (Opcional) Enviar una petición `GET` a `/api/v1/processed-documents` para verificar que se recuperan los datos de la base de datos SQLite.
* **Documentación Adicional (Punto 4.3):** Este documento `README.md` (y el PDF final basado en él) sirve como la documentación principal del microservicio.

## 5. Presentación Final (Según requerimiento de evaluación)

* **Explicación Técnica y Demostración (Punto 5):** La explicación se basará en el contenido de este documento y el PDF final. Se demostrará el funcionamiento del microservicio ejecutando la llamada al endpoint `POST /api/v1/process-documents` desde Postman y mostrando cómo los datos se guardan en la base de datos SQLite. Se explicarán los puntos clave del análisis, diseño e implementación.

---

## Para Ponerlo en Marcha:

1.  Asegúrate de que el backend de tu amigo esté corriendo y accesible (típicamente en `http://localhost:5000`) y conectado a su base de datos MongoDB.
2.  Clona/Asegúrate de tener la carpeta de este microservicio con la estructura de archivos descrita.
3.  Asegúrate de que el contenido de tus archivos `.env`, `src/config/db.js`, `src/models/ProcessedDocument.js`, `src/services/externalApiService.js`, `src/controllers/dataController.js`, `src/routes/dataRoutes.js` y `src/server.js` coincide con el código completo proporcionado, **habiendo llenado tus URLs exactas y credenciales en el `.env`**.
4.  Abre tu terminal en la carpeta raíz de **este microservicio**.
5.  Instala las dependencias si aún no lo has hecho: `npm install`.
6.  Inicia este microservicio: `npm start` o `npm run dev`.
7.  Usa Postman para enviar la petición `POST` a `http://localhost:3000/api/v1/process-documents`.
8.  Verifica los logs en la terminal de tu microservicio y los datos en tu base de datos `database.sqlite`.

---


---

**UNIVERSIDAD CATÓLICA BOLIVIANA “SAN PABLO”**
**FACULTAD DE INGENIERÍA**
**CARRERA DE INGENIERÍA DE SISTEMAS**

**TECNOLOGÍAS WEB II - 1/2025**
**SEGUNDA EVALUACIÓN – PRIMERA OPCIÓN**

**Diseño e Implementación de Microservicio Independiente**

**Estudiante:** [Einar Guillen]
**Docente:** [Miguel Pacheco]
**Fecha:** [4/5/2025]

---

**Índice**

1.  Introducción y Objetivo del Microservicio
2.  Análisis del Proyecto Integrador (Backend Amigo)
    * Endpoint Consumido
    * Endpoint de Autenticación
    * Justificación de la Elección
    * Descripción Técnica del Endpoint de Documentos
3.  Diseño del Microservicio
    * Objetivo Específico
    * Tecnología de Comunicación Elegida y Justificación
    * Diagrama del Flujo de Integración
4.  Implementación Técnica
    * Tecnologías Utilizadas
    * Estructura del Proyecto
    * Configuración y Ejecución
    * Endpoints Expuestos por el Microservicio Propio
5.  Pruebas y Documentación
    * Pruebas Funcionales Realizadas
    * Evidencias Funcionales
    * Documentación del Código
6.  Preparación para la Presentación Final

---

**1. Introducción y Objetivo del Microservicio**

El presente documento detalla el diseño e implementación de un microservicio independiente desarrollado como requisito de la Segunda Evaluación de Tecnologías Web II. El objetivo general de este microservicio es interactuar con un backend existente (identificado como el "Proyecto Integrador" en el contexto de la evaluación) para obtener datos específicos, procesarlos y almacenarlos en una base de datos propia, desacoplando así esta funcionalidad del sistema principal.

El objetivo específico de este microservicio implementado es consumir el endpoint que provee la lista de documentos del backend amigo, gestionar la autenticación JWT necesaria para acceder a dicho endpoint, y almacenar los datos relevantes de estos documentos en una base de datos SQLite local para consulta o procesamiento futuro.

**2. Análisis del Proyecto Integrador (Backend Amigo)**

El backend identificado como "Proyecto Integrador" para esta evaluación es un sistema de gestión de documentos desarrollado en Node.js con Express y MongoDB, utilizando autenticación basada en JWT.

* **Endpoint Consumido (Documentos):**
    * Propósito: Obtener la lista completa de documentos disponibles.
    * URL: `http://localhost:5000/api/` *(Verificar URL exacta si el backend amigo usa otro puerto o ruta base)*
    * Método HTTP: `GET`
    * Formato de Datos: `JSON` (retorna un arreglo de objetos documento).

* **Endpoint de Autenticación (Login):**
    * Propósito: Obtener un token JWT válido para acceder a endpoints protegidos.
    * URL: `http://localhost:5000/api/auth/login` *(Verificar URL exacta si el backend amigo usa otro puerto o ruta de login)*
    * Método HTTP: `POST`
    * Formato de Datos (Petición): `JSON`. Espera un objeto con las credenciales de usuario: `{ "correo": "[email_del_usuario]", "contraseña": "[contraseña_del_usuario]" }`.
    * Formato de Datos (Respuesta): `JSON`. En caso de éxito, devuelve un objeto que incluye el token JWT: `{ "mensaje": "Login exitoso", "token": "[valor_del_token]" }`.

* **Justificación de la Elección de los Endpoints:**
    Se seleccionaron estos endpoints porque representan una funcionalidad clara (obtener una lista de recursos) y requieren un mecanismo de autenticación (login para obtener el token y usarlo en la petición de documentos), cumpliendo así los requisitos técnicos de la evaluación de consumir un endpoint con una tecnología de comunicación específica (REST) y manejar la autenticación. El endpoint de documentos provee datos estructurados que pueden ser procesados y almacenados.

* **Descripción Técnica del Endpoint de Documentos:**
    El endpoint `GET http://localhost:5000/api/` (ajustar URL) devuelve una respuesta con estado 200 OK en caso de éxito (si la autenticación es válida). El cuerpo de la respuesta es un arreglo JSON de objetos. Cada objeto en el arreglo representa un documento con la siguiente estructura (basada en el Mongoose Schema del backend amigo):
    ```json
    [
      {
        "_id": "ID_MONGO_GENERADO",
        "titulo": "Título del Documento",
        "autor": "Nombre del Autor",
        "fecha": "YYYY-MM-DDTHH:mm:ss.sssZ", // Formato de fecha ISO
        "tipo": "PDF", // O 'TIFF', 'JPG', 'PNG'
        "categoria": "Categoría",
        "etiquetas": ["tag1", "tag2"],
        "archivo_url": "http://url/al/archivo.pdf",
        "descripcion": "Breve descripción.",
        "fecha_subida": "YYYY-MM-DDTHH:mm:ss.sssZ",
        "usuario_responsable": "ID_USUARIO_RESPONSABLE",
        "comentarios": [{/*...*/}], // Arreglo de objetos comentario
        "versiones": [{/*...*/}], // Arreglo de objetos versión
        "__v": 0 // Versión del documento en Mongoose
      },
      { /* ... otro documento ... */ }
    ]
    ```
    Para acceder a este endpoint, se debe incluir un header `Authorization` con el formato `Bearer [token_jwt_obtenido_en_el_login]`.

**3. Diseño del Microservicio**

* **Objetivo Específico del Microservicio Propio:** El microservicio tiene como objetivo obtener de forma programática la lista completa de documentos del backend amigo, mapear los campos relevantes de cada documento y persistirlos en una base de datos SQLite local para mantener una copia desacoplada de esta información.
* **Tecnología de Comunicación Elegida y Justificación:**
    * Se utiliza **REST** como estilo arquitectónico para la comunicación con el backend amigo, ya que sus endpoints están implementados bajo este paradigma.
    * Se usa la librería **Axios** en Node.js como cliente HTTP para realizar las peticiones `POST` al endpoint de login y `GET` al endpoint de documentos. Axios es una biblioteca madura, basada en promesas, fácil de usar y ampliamente adoptada en el ecosistema Node.js para realizar peticiones HTTP.
    * La autenticación **JWT (JSON Web Tokens)** es el mecanismo de seguridad implementado en el backend amigo. El microservicio gestiona esto obteniendo el token vía el endpoint de login y enviándolo en el header `Authorization: Bearer [token]` en las peticiones subsiguientes.
* **Diagrama del Flujo de Integración:**
    Se adjunta un diagrama que ilustra la interacción entre los componentes involucrados: el cliente que activa el microservicio (ej: Postman), el microservicio propio, el backend amigo (Proyecto Integrador) y la base de datos local del microservicio (SQLite).

    ```mermaid
    graph LR
        A[Cliente/Usuario (Postman)] -- Petición POST /api/v1/process-documents --> B(Tu Microservicio<br>en Puerto 3000);
        B -- Verifica Token JWT --> C{Backend Amigo<br>en Puerto 5000};
        C -- Si Token Expirado:<br>Petición POST /api/auth/login --> C;
        C -- Responde Token JWT --> B;
        B -- Petición GET /api/<br>con Authorization: Bearer [token] --> C;
        C -- Responde Lista de Documentos<br>(JSON) --> B;
        B -- Procesa Datos<br>(Mapeo y Transformación) --> D(Lógica del Microservicio);
        D -- Guarda/Actualiza<br>Documentos --> E(Tu Base de Datos SQLite<br>archivo database.sqlite);
        E -- Confirma Operación --> D;
        D -- Envía Respuesta 200 OK --> B;
        B -- Respuesta JSON --> A;
    ```
    

**4. Implementación Técnica**

* **Tecnologías Utilizadas:**
    * **Backend:** Node.js
    * **Framework Web:** Express.js
    * **Cliente HTTP:** Axios
    * **Base de Datos Local:** SQLite
    * **ORM:** Sequelize
    * **Configuración:** dotenv (para variables de entorno)
* **Estructura del Proyecto:**
    ```
    your-microservice-name/
    ├── .env               # Variables de entorno (URLs externas, credenciales, etc.)
    ├── package.json       # Dependencias y scripts
    ├── src/
    │   ├── config/
    │   │   └── db.js      # Configuración de conexión a SQLite y sincronización de modelos
    │   ├── models/
    │   │   └── ProcessedDocument.js # Modelo Sequelize para documentos procesados en SQLite
    │   ├── routes/
    │   │   └── dataRoutes.js # Rutas de la API expuesta por este microservicio
    │   ├── controllers/
    │   │   └── dataController.js # Lógica para manejar las peticiones, llamar servicio, procesar y guardar
    │   ├── services/
    │   │   └── externalApiService.js # Lógica para interactuar con el backend amigo (login, fetch)
    │   └── server.js      # Punto de entrada, inicia Express, DB y escucha puerto
    └── README.md          # Documentación inicial del proyecto
    ```
* **Configuración y Ejecución:**
    1.  **Prerrequisito:** Asegurarse de que el backend amigo (Proyecto Integrador) esté corriendo y accesible (típicamente en `http://localhost:5000`) y conectado a su base de datos MongoDB.
    2.  Clonar el repositorio de este microservicio.
    3.  Crear el archivo `.env` en la raíz del proyecto de este microservicio y configurarlo con las URLs exactas de los endpoints del backend amigo y las credenciales de un usuario de prueba válido.
    4.  Abrir una terminal en la carpeta raíz de **este microservicio**.
    5.  Instalar las dependencias definidas en `package.json`: `npm install`.
    6.  Iniciar el microservicio: `npm start` o `npm run dev` (si se instaló `nodemon`).
    7.  El microservicio se conectará a la base de datos SQLite (creando el archivo `database.sqlite` si no existe) y sincronizará los modelos (creando la tabla `processed_documents` si no existe).

* **Endpoints Expuestos por *Este* Microservicio Propio:**
    * **`POST /api/v1/process-documents`**: Ejecuta la lógica principal: autenticación con backend amigo -> obtención de documentos -> procesamiento -> guardado en SQLite. No requiere cuerpo en la petición.
    * **`GET /api/v1/processed-documents`**: Devuelve los documentos que han sido guardados previamente en la base de datos SQLite local. No requiere cuerpo en la petición.

* **Explicación de Componentes Clave del Código:**
    * `src/services/externalApiService.js`: Contiene las funciones `loginExternalApi` y `WorkspaceDocuments`. `loginExternalApi` realiza la petición `POST` al endpoint de login del backend amigo con las credenciales del `.env` y extrae el token JWT de la respuesta. `WorkspaceDocuments` usa `getAuthToken` para asegurar un token válido (re-autenticando si es necesario) y luego realiza la petición `GET` al endpoint de documentos del backend amigo, incluyendo el token en el header `Authorization: Bearer ...`.
    * `src/controllers/dataController.js`: La función `getAndSaveDocuments` maneja la petición `POST /api/v1/process-documents`. Llama a `WorkspaceDocuments` para obtener los datos. Itera sobre la lista de documentos recibidos, mapea los campos relevantes al formato del modelo `ProcessedDocument`, y usa `ProcessedDocument.upsert()` (de Sequelize) para guardar o actualizar el documento en la base de datos SQLite. La función `listProcessedDocuments` maneja la petición `GET /api/v1/processed-documents` obteniendo simplemente los datos de la tabla `processed_documents` en SQLite.
    * `src/models/ProcessedDocument.js`: Define la estructura de la tabla `processed_documents` en la base de datos SQLite. Incluye campos como `originalId` (el `_id` del documento en MongoDB amigo), `titulo`, `autor`, `fechaDocumento`, etc., junto con campos de timestamps de Sequelize.
    * `src/config/db.js`: Configura la conexión a la base de datos SQLite, especifica la ruta del archivo `database.sqlite` y utiliza `sequelize.sync()` para crear las tablas necesarias automáticamente al iniciar el microservicio.

**5. Pruebas y Documentación**

* **Pruebas Funcionales Realizadas (Punto 4.2):**
    Se realizaron pruebas manuales utilizando Postman para verificar el correcto funcionamiento del microservicio y su integración con el backend amigo.
    1.  Verificar que ambos backends (amigo y propio) estén corriendo.
    2.  Enviar una petición `POST` al endpoint principal del microservicio: `http://localhost:3000/api/v1/process-documents`. Se espera un estado 200 OK y un cuerpo de respuesta JSON con los documentos obtenidos del backend amigo y un resumen del procesamiento. Se verifica en la consola del microservicio que la secuencia de login (si fue necesario), obtención de datos y guardado se ejecutó correctamente.
    3.  Abrir la base de datos `database.sqlite` utilizando "DB Browser for SQLite" y confirmar que los documentos correspondientes se guardaron o actualizaron en la tabla `processed_documents`, verificando que los campos se mapearon correctamente.
    4.  (Opcional) Enviar una petición `GET` al endpoint `http://localhost:3000/api/v1/processed-documents` para verificar que se recuperan los datos almacenados localmente en SQLite.
* **Evidencias Funcionales (Punto 4.1):**
    A continuación, se adjuntan las capturas de pantalla que evidencian la ejecución exitosa de las pruebas funcionales.

    


* **Documentación del Código (Punto 4.3):**
    La documentación del código fuente se encuentra en los comentarios dentro de los archivos `.js` del proyecto y en el archivo `README.md`. Este documento PDF complementa esa documentación detallando el análisis, diseño y resultados de las pruebas.

**6. Preparación para la Presentación Final**

* **Explicación y Demostración (Punto 5):** La presentación se realizará basándose en el contenido de este documento PDF. Se explicará el objetivo del microservicio, el análisis del endpoint externo consumido, las decisiones de diseño (tecnologías, flujo de integración), y se realizará una demostración en vivo del microservicio funcionando. La demostración incluirá:
    1.  Verificar que el backend amigo esté corriendo.
    2.  Iniciar el microservicio propio.
    3.  Utilizar Postman para llamar al endpoint `POST /api/v1/process-documents`.
    4.  Mostrar la respuesta exitosa en Postman.
    5.  Mostrar en una herramienta de base de datos (DB Browser for SQLite) que los datos se guardaron correctamente en la base de datos local `database.sqlite`.
    Se responderán preguntas técnicas sobre la implementación, autenticación, base de datos, etc.

---

