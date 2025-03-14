// socketControllers.js
const { loadCamerasFromJSON, processCamera } = require("../cronjob/cameraChecker");

// Función genérica para cargar la DB y filtrar un dispositivo
async function findDeviceByPoste(poste, tipoArray) {
  // tipoArray es un array de TIPO(s) permitidos (por ejemplo, ["I","II","III"])
  const devices = await loadCamerasFromJSON("DB_610.json");
  const device = devices.find(
    (item) => item.POSTE.toString() === poste.toString() && tipoArray.includes(item.TIPO)
  );
  return device;
}

// 1) Para Cámaras (TIPO I, II, III)
async function checkCameraByPoste(poste) {
  // Cargamos la lista de cámaras y filtramos solo I, II, III
  const camera = await findDeviceByPoste(poste, ["I", "II", "III"]);
  if (!camera) {
    throw new Error(`No se encontró la cámara con POSTE: ${poste}`);
  }
  // Procesamos la cámara (realizamos ping, ISAPI, RTSP, etc.)
  const result = await processCamera(camera);
  return result;
}

// 2) Para Megáfonos (TIPO IV)
async function checkMegaphoneByPoste(poste) {
  const megaphone = await findDeviceByPoste(poste, ["IV"]);
  if (!megaphone) {
    throw new Error(`No se encontró el megáfono con POSTE: ${poste}`);
  }
  // Procesar el megáfono. Si tu "processCamera" sirve también para megáfonos, úsalo.
  //   O si tienes otra función especial, llámala. Por ejemplo:
  const result = await processCamera(megaphone);
  return result;
}

// 3) Para Botón de Pánico (TIPO V)
async function checkPanicByPoste(poste) {
  const panic = await findDeviceByPoste(poste, ["V"]);
  if (!panic) {
    throw new Error(`No se encontró el botón de pánico con POSTE: ${poste}`);
  }
  // Procesar el botón de pánico (ping, etc.) igual que cámara si la lógica es similar
  const result = await processCamera(panic);
  return result;
}

module.exports = {
  checkCameraByPoste,
  checkMegaphoneByPoste,
  checkPanicByPoste,
};
