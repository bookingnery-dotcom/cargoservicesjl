const https = require('https');
const { URL } = require('url');
// Netlify function config — increase timeout
exports.config = { timeout: 26 };
const ENDPOINTS = {
  token:        { url: 'https://miws.zoom.red/api/crearToken', method: 'POST' },
  guia:         { url: 'https://serviciosbd.zoom.red/api/guiaelectronica/createShipmentInternacional', method: 'POST' },
  etiqueta:     { url: 'https://wsgeneric.zoom.red/api/etiquetaTermica', method: 'POST' },
  imprimirGuia: { url: 'https://appenvios.zoom.red/guiaelectronica/imprimirGuia', method: 'GET' },
  ciudades:     { url: 'https://api.zoom.red/canguroazul/getCiudades', method: 'GET' },
  sucursales:   { url: 'https://api.zoom.red/canguroazul/getSucursales', method: 'GET' },
  oficinas:     { url: 'https://sandbox.zoom.red/baaszoom/public/canguroazul/getOficinasGE', method: 'GET' },
  todasOficinas:{ url: 'https://sandbox.zoom.red/baaszoom/public/canguroazul/getOficinas', method: 'GET' },
  ciudadesOfi:  { url: 'https://sandbox.zoom.red/baaszoom/public/canguroazul/getCiudadesOfi', method: 'GET' },
  tracking:     { url: 'https://api.zoom.red/canguroazul/getInfoTracking', method: 'GET' },
  trackingApi:  { url: 'https://api.zoom.red/canguroazul/getInfoTracking', method: 'GET' },
};
function makeRequest(urlStr, method, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: { ...headers, 'Host': u.hostname }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body && method !== 'GET') req.write(body);
    req.end();
  });
}
exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const endpoint = body.endpoint;
    const cfg = ENDPOINTS[endpoint];
    if (!cfg) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Endpoint inválido: ' + endpoint }) };
    }
    const payload = { ...body };
    delete payload.endpoint;
    // Inyectar credenciales desde variables de entorno
    if (endpoint === 'token' || endpoint === 'guia' || endpoint === 'etiqueta') {
      payload.login = process.env.ZOOM_LOGIN;
      payload.clave = process.env.ZOOM_CLAVE;
      payload.frase_privada = process.env.ZOOM_FRASE;
      payload.certificado = process.env.ZOOM_FRASE;
    }
    let targetUrl = cfg.url;
    let bodyStr = null;
    const reqHeaders = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (cfg.method === 'GET') {
      const params = new URLSearchParams();
      Object.entries(payload).forEach(([k, v]) => { if(v !== undefined && v !== null) params.append(k, v); });
      const qs = params.toString();
      if (qs) targetUrl += '?' + qs;
    } else {
      bodyStr = JSON.stringify(payload);
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    if (event.headers?.authorization) {
      reqHeaders['Authorization'] = event.headers.authorization;
    }
    const resp = await makeRequest(targetUrl, cfg.method, reqHeaders, bodyStr);
    console.log(`ZOOM [${endpoint}] → ${resp.status}: ${resp.body.substring(0,300)}`);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: resp.body || '{}'
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: e.message })
    };
  }
};
