// testSocket.js
const { io } = require("socket.io-client");

const socket = io("http://192.168.30.60:3000", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("Conectado con ID:", socket.id);
  // Al conectarnos, pedimos el estado de las cámaras
  socket.emit("getCameraStatus");
});

socket.on("cameraStatus", (data) => {
  console.log("Estado de cámaras recibido:", data);
  // Aquí podrías hacer algo con la data
});

socket.on("disconnect", (reason) => {
  console.log("Desconectado:", reason);
});
