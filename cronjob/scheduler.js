// scheduler.js
const cron = require('node-cron');
const { loadCamerasFromJSON, processAllCameras } = require('./cameraChecker');
const cache = require('../cache'); // Asegúrate de que la ruta es correcta

async function updateCameraStatus() {
  console.log('Iniciando actualización de cámaras...');
  try {
    // Cargamos las cámaras desde el archivo DB_610.json
    const cameras = await loadCamerasFromJSON('DB_610.json');
    if (!cameras || cameras.length === 0) {
      console.error('No se encontraron cámaras en el JSON.');
      return [];
    }
    // Procesamos en batches (por ejemplo, 10 a la vez)
    const batchSize = 10;
    const report = await processAllCameras(cameras, batchSize);
    // Guardamos el reporte en la caché
    cache.set('cameraStatus', report);
    console.log('Actualización de cámaras completada.');
    return report;
  } catch (error) {
    console.error('Error actualizando cámaras:', error);
    return [];
  }
}

function startCronJob(io) {
  // Programa el cron job para que se ejecute cada 5 minutos
  cron.schedule('*/20 * * * *', async () => {
    console.log('Cron job iniciado...');
    const data = await updateCameraStatus();
    // Emitir el nuevo estado a todos los clientes conectados
    io.emit('cameraStatus', data);
    console.log('Cron job completado. Se emitió "cameraStatus" a todos los sockets.');
  });
}

module.exports = {
  startCronJob,
  updateCameraStatus,
};
