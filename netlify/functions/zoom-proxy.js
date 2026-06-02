const https = require('https');
const http = require('http');
const { URL } = require('url');

const ENDPOINTS = {
  token:      'https://miws-qa.zoom.red/api/crearToken',
  guia:       'https://qa.zoom.red/api/guiaelectronica/createShipmentInternacional',
  etiqueta:   'https://test-wsgeneric.zoom.red/api/etiquetaTermica',
  ciudades:   'https://sandbox.zoom.red/baaszoom/public/canguroazul/getCiudades',
  sucursales: 'https://sandbox.zoom.red/baaszoom/public/canguroazul/getSucursales',
  tracking:   'https://sandbox.zoom.red/baaszoom/public/canguroazul/getInfoTracking',
};

function makeRequest(urlStr, method, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = urlStr.startsWith('https') ? https : http;
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: { ...headers, 'Host': u.hostname }
    };
    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
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
    const endpoint = body.endpoint || event.queryStringParameters?.endpoint;
    const targetUrl = ENDPOINTS[endpoint];

    if (!targetUrl) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Endpoint inválido: ' + endpoint }) };
    }

    const payload = { ...body };
    delete payload.endpoint;

    const reqHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (event.headers?.authorization) {
      reqHeaders['Authorization'] = event.headers.authorization;
    }

    const bodyStr = JSON.stringify(payload);
    reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);

    const resp = await makeRequest(targetUrl, 'POST', reqHeaders, bodyStr);

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
