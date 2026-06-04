const https = require('https');

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    // Parsear el form-data del body
    const body = event.body;
    const isBase64 = event.isBase64Encoded;
    const bodyBuffer = isBase64 ? Buffer.from(body, 'base64') : Buffer.from(body);
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';

    // Reenviar a ZOOM como form-data
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'wsgeneric.zoom.red',
        path: '/api/etiquetaTermica',
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'Content-Length': bodyBuffer.length,
          'Host': 'wsgeneric.zoom.red'
        }
      };

      const req = https.request(options, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const responseBuffer = Buffer.concat(chunks);
          const respContentType = res.headers['content-type'] || 'application/octet-stream';
          
          resolve({
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': respContentType,
            },
            body: responseBuffer.toString('base64'),
            isBase64Encoded: true
          });
        });
      });

      req.on('error', (e) => {
        resolve({
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: e.message })
        });
      });

      req.write(bodyBuffer);
      req.end();
    });
  } catch(e) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: e.message })
    };
  }
};
