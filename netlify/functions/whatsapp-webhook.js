exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Verificación del webhook de Meta
  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    const mode = params['hub.mode'];
    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];

    if (mode === 'subscribe' && token === 'cargoservicesjl2024') {
      return { statusCode: 200, headers: corsHeaders, body: challenge };
    }
    return { statusCode: 403, headers: corsHeaders, body: 'Forbidden' };
  }

  // Recibir notificaciones de Meta
  if (event.httpMethod === 'POST') {
    console.log('WhatsApp webhook:', event.body);
    return { statusCode: 200, headers: corsHeaders, body: 'OK' };
  }

  return { statusCode: 200, headers: corsHeaders, body: 'OK' };
};
