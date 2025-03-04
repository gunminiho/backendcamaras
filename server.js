// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { startCronJob, updateCameraStatus } = require("./cronjob/scheduler");
const cache = require("./cache");
const { sequelize } = require("./db_connection"); // Asegúrate de que esté configurado
const socketRoutes = require("./sockets/socketRoutes");

const PORT = process.env.PORT_FISCA || 3000;
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend de cámaras en tiempo real funcionando." });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Inicializamos las rutas de sockets (se encargan de manejar los eventos)
socketRoutes.initialize(io);

// Iniciar cron job para actualizar la información de las cámaras cada 5 minutos
startCronJob(io);
// Actualización inmediata al arrancar para tener datos en caché
updateCameraStatus().then(data => {
  io.emit("cameraStatus", data);
});

// Sincronizamos la base de datos (ajusta según tu configuración)
sequelize.sync({ alter: true })
  .then(() => console.log("Database connected"))
  .catch(err => console.error("Error connecting to the database:", err));

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
