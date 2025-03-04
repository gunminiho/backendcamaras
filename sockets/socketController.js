// sockets/socketControllers.js
const { loadCamerasFromJSON, processCamera } = require("../cronjob/cameraChecker");

async function checkCameraByPoste(poste) {
  // Cargamos la lista de cámaras desde el archivo local DB_610.json
  const cameras = await loadCamerasFromJSON("DB_610.json");
  // Buscamos la cámara que tenga el número de poste solicitado
  const camera = cameras.find(cam => cam.POSTE == poste);
  if (!camera) {
    throw new Error(`No se encontró la cámara con Poste: ${poste}`);
  }
  // Procesamos la cámara (realizando ping, ISAPI, RTSP, etc.)
  return processCamera(camera);
}

module.exports = {
  checkCameraByPoste,
};



