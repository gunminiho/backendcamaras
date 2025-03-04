// sockets/socketRoutes.js
const socketHandlers = require("./socketHandler");
const data = require("../cache");

function initialize(io) {
    io.on("connection", (socket) => {
        console.log(`Cliente conectado: ${socket.id}`);

        // Evento para obtener el estado general (cache)
        socket.on("getCameraStatus", () => {
            const response = data.get("cameraStatus") || [];
            socket.emit("cameraStatus", response);
        });

        // Evento on-demand para verificar una cámara por su número de poste
        socket.on("checkCameraByPoste", async (poste) => {
            await socketHandlers.handleCheckCameraByPoste(socket, poste);
        });

        socket.on("disconnect", () => {
            console.log(`Cliente desconectado: ${socket.id}`);
        });
    });
}

module.exports = { initialize };
