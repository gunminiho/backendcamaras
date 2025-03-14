// cameraChecker.js

const fs = require('fs');
const ping = require('ping');
const axios = require('axios');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

// Credenciales globales para las cámaras
const user = 'admin';
const pass = 'MD$JL2024';

// ====================
// Función para formatear tiempo (ms) a HH:MM:SS
// ====================
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ====================
// Función: Carga las cámaras desde un archivo JSON local
// Filtra las cámaras de tipo I, II o III
// ====================
async function loadCamerasFromJSON(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) return reject(err);
      try {
        const cameras = JSON.parse(data);
        // Filtrar solo las cámaras de tipo I, II o III
        const filtered = cameras.filter(cam => {
          const t = cam.TIPO ? cam.TIPO.trim() : "";
          return (t === "I" || t === "II" || t === "III");
        });
        resolve(filtered);
      } catch (e) {
        reject(e);
      }
    });
  });
}

// ====================
// Función: Comprobación de Ping Avanzado
// Realiza hasta 50 pings o se detiene al 4to packet loss.
// Se considera exitoso si se pierden menos de 4 paquetes.
// ====================
async function checkPingAdvanced(ip) {
  const maxAttempts = 50;
  const maxAllowedLoss = 4;
  let attempts = 0;
  let lostPackets = 0;
  let times = [];

  while (attempts < maxAttempts && lostPackets < maxAllowedLoss) {
    try {
      const res = await ping.promise.probe(ip, { timeout: 3 }); // Timeout de 3s
      attempts++;
      if (!res.alive) {
        lostPackets++;
        if (lostPackets === maxAllowedLoss) break;
      } else {
        const t = parseFloat(res.time);
        if (!isNaN(t)) times.push(t);
      }
    } catch (error) {
      lostPackets++;
      attempts++;
      if (lostPackets === maxAllowedLoss) break;
    }
  }

  const min = times.length ? Math.min(...times) : 0;
  const max = times.length ? Math.max(...times) : 0;
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const packetLossPercent = attempts ? ((lostPackets / attempts) * 100).toFixed(2) : '0.00';
  const passed = lostPackets < maxAllowedLoss;

  return {
    attempts,
    lostPackets,
    min: min.toFixed(2),
    max: max.toFixed(2),
    avg: avg.toFixed(2),
    packetLossPercent: `${packetLossPercent} %`,
    passed,
  };
}

// ====================
// Función: Verificación ISAPI
// Devuelve true si responde 200 o 401
// ====================
async function checkISAPI(ip) {
  const url = `http://${ip}/ISAPI/System/status`;
  try {
    const response = await axios.get(url, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    if (error.response && error.response.status === 401) return true;
    return false;
  }
}

// ====================
// Función: Handshake RTSP con ffprobe (timeout 5s)
// ====================
async function checkRTSPHandshake(rtspUrl) {
  return new Promise((resolve) => {
    const args = [
      '-v', 'error',
      '-rtsp_transport', 'tcp',
      '-show_streams',
      '-show_format',
      rtspUrl,
    ];
    const probe = spawn(ffprobePath, args);
    const timer = setTimeout(() => {
      probe.kill('SIGKILL');
      resolve(false);
    }, 5000);
    probe.on('close', (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
    probe.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

// ====================
// Función: Decodificar 2s de video con ffmpeg (timeout 5s)
// Se usa si el handshake con ffprobe falla
// ====================
async function decodeRTSPStream(rtspUrl) {
  return new Promise((resolve) => {
    const args = [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-t', '3',
      '-f', 'null', '-'
    ];
    const ffmpeg = spawn(ffmpegPath, args);
    const timer = setTimeout(() => {
      ffmpeg.kill('SIGKILL');
      resolve(false);
    }, 5000);
    ffmpeg.stderr.on('data', () => { });
    ffmpeg.on('close', (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
    ffmpeg.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

// ====================
// Función: Procesa una cámara individualmente
// ====================
async function processCamera(camera) {
  const fechaHora = new Date().toLocaleString();
  const result = {
    IP: camera.IP,
    TIPO: camera.TIPO,
    DISPOSITIVO: camera.DISPOSITIVO,
    POSTE: camera.POSTE,
    Fecha_Hora: fechaHora,
  };

  // Ping
  const pingResult = await checkPingAdvanced(camera.IP);
  result.Ping_Resultado = pingResult.passed ? '✔' : '✖';
  result.Ping_Intentos = pingResult.attempts;
  result.Ping_PaquetesPerdidos = pingResult.lostPackets;
  result.Ping_PorcentajePerdida = pingResult.packetLossPercent;
  result.Ping_Minimo = pingResult.min;
  result.Ping_Maximo = pingResult.max;
  result.Ping_Promedio = pingResult.avg;

  if (pingResult.passed) {
    // ISAPI
    const isapiResult = await checkISAPI(camera.IP);
    result.ISAPI = isapiResult ? '✔' : '✖';

    // RTSP
    const rtspUrl = `rtsp://${user}:${pass}@${camera.IP}:554/Streaming/Channels/101`;
    let rtspResult = await checkRTSPHandshake(rtspUrl);
    if (!rtspResult) {
      rtspResult = await decodeRTSPStream(rtspUrl);
    }
    result.RTSP = rtspResult ? '✔' : '✖';
    // Según la nueva lógica, si RTSP es exitoso => activa
    result.Status = rtspResult ? 'activa' : 'inactiva';
  } else {
    result.ISAPI = '✖';
    result.RTSP = '✖';
    result.Status = 'inactiva';
  }

  return result;
}

// ====================
// Función: Divide un array en batches
// ====================
function splitIntoBatches(arr, batchSize) {
  const batches = [];
  for (let i = 0; i < arr.length; i += batchSize) {
    batches.push(arr.slice(i, i + batchSize));
  }
  return batches;
}

// ====================
// Función: Procesar TODAS las cámaras en batches y devolver un reporte
// ====================
async function processAllCameras(cameras, batchSize) {
  const startTime = Date.now();
  const state = { total: cameras.length, completed: 0 };
  const batches = splitIntoBatches(cameras, batchSize);
  let report = [];

  for (const batch of batches) {
    const promises = batch.map(camera =>
      processCamera(camera).then(result => {
        state.completed++;
        const elapsed = Date.now() - startTime;
        const percent = ((state.completed / state.total) * 100).toFixed(2);
        const avgTime = elapsed / state.completed;
        const remaining = avgTime * (state.total - state.completed);
        // process.stdout.write(
        //   `Progreso: ${percent}% | Transcurrido: ${formatTime(elapsed)} | Estimado restante: ${formatTime(remaining)}\r`
        // );
        return result;
      })
    );
    const batchResults = await Promise.all(promises);
    report.push(...batchResults);
  }

  return report;
}

// Busca la información de una cámara en el JSON según su IP
async function getCameraByIP(poste) {
  const cameras = await loadCamerasFromJSON('DB_610.json');
  const camera = cameras.find(cam => cam.POSTE == poste);
  console.log(camera);
  //return cameras.find(cam => cam.POSTE === poste);
  return camera;
}

// ====================
// Función: checkSingleCamera
// Recibe la IP, busca la cámara en el JSON y, si existe, llama a processCamera.
// Si no se encuentra, lanza un error.
// ====================
async function checkSingleCamera(poste) {
  const camera = await getCameraByIP(poste);
  if (!camera) {
    console.error(`No se encontró la cámara con poste: ${poste}`);
  }
  return processCamera(camera);
}


// Exportamos las funciones necesarias
module.exports = {
  formatTime,
  loadCamerasFromJSON,
  checkPingAdvanced,
  checkISAPI,
  checkRTSPHandshake,
  decodeRTSPStream,
  processCamera,
  processAllCameras,
  checkSingleCamera
};
