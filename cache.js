// cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 99999 }); // TTL de 300 segundos (5 minutos)



module.exports = cache;