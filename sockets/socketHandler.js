// sockets/socketHandlers.js
const socketControllers = require("./socketController");

async function handleCheckCameraByPoste(socket, poste) {
  try {
    // Validamos que poste sea un valor válido (por ejemplo, numérico)
    if (!poste || isNaN(Number(poste))) {
      socket.emit("cameraStatusSingle", { error: "El valor de 'poste' es inválido." });
      return;
    }
    // Llamamos al controlador para verificar la cámara por su número de poste
    const result = await socketControllers.checkCameraByPoste(poste);
    socket.emit("cameraStatusSingle", result);
  } catch (error) {
    socket.emit("cameraStatusSingle", { error: error.message });
  }
}

module.exports = {
  handleCheckCameraByPoste,
};
