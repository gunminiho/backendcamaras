// sockets/socketHandlers.js
const socketControllers = require("./socketController");

async function handleCheckCameraByPoste(socket, poste) {
  try {
    // Validamos que poste sea un valor válido (por ejemplo, numérico)
    if (!poste) {
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

async function handleCheckMegaphoneByPoste(socket, poste) {
  try {
    // Validamos que poste sea un valor válido (por ejemplo, numérico)
    if (!poste) {
      socket.emit("megaphoneStatusSingle", { error: "El valor de 'poste' es inválido." });
      return;
    }
    // Llamamos al controlador para verificar la cámara por su número de poste
    const result = await socketControllers.checkMegaphoneByPoste(poste);
    socket.emit("megaphoneStatusSingle", result);
  } catch (error) {
    socket.emit("megaphoneStatusSingle", { error: error.message });
  }
}

async function handleCheckPanicByPoste(socket, poste) {
  try {
    // Validamos que poste sea un valor válido (por ejemplo, numérico)
    if (!poste) {
      socket.emit("panicStatusSingle", { error: "El valor de 'poste' es inválido." });
      return;
    }
    // Llamamos al controlador para verificar la cámara por su número de poste
    const result = await socketControllers.checkPanicByPoste(poste);
    socket.emit("panicStatusSingle", result);
  } catch (error) {
    socket.emit("panicStatusSingle", { error: error.message });
  }
}

module.exports = {
  handleCheckCameraByPoste,
  handleCheckMegaphoneByPoste,
  handleCheckPanicByPoste
};
