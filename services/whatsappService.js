/**
 * Servicio de mensajería con la API Cloud de WhatsApp (Meta)
 * Documentación oficial: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v20.0';

/**
 * Envía un mensaje de texto simple a un número de WhatsApp
 * @param {string} to - Número de teléfono del destinatario con código de país (ej: "59170012345")
 * @param {string} text - Contenido del mensaje (soporta formato Markdown de WhatsApp: *negrita*, _cursiva_, etc.)
 */
async function sendTextMessage(to, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[WhatsApp Simulado] Para: ${to} | Mensaje:\n${text}`);
    return { simulated: true, success: true };
  }

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace(/\D/g, ''), // Solo dígitos
        type: 'text',
        text: {
          preview_url: true,
          body: text
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[WhatsApp API Error]:', data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[WhatsApp Network Error]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envía una imagen con descripción a un número de WhatsApp
 * @param {string} to - Número de teléfono
 * @param {string} imageUrl - URL pública de la imagen
 * @param {string} caption - Descripción de la imagen
 */
async function sendImageMessage(to, imageUrl, caption = '') {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[WhatsApp Simulado Imagen] Para: ${to} | Imagen: ${imageUrl} | Caption: ${caption}`);
    return { simulated: true, success: true };
  }

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace(/\D/g, ''),
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption
        }
      })
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error('[WhatsApp Image Error]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envía un menú interactivo con botones rápidos (hasta 3 botones)
 * @param {string} to - Número de teléfono
 * @param {string} bodyText - Texto principal
 * @param {Array<{id: string, title: string}>} buttons - Lista de botones
 */
async function sendInteractiveButtons(to, bodyText, buttons = []) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[WhatsApp Simulado Botones] Para: ${to} | ${bodyText} | Botones:`, buttons);
    return { simulated: true, success: true };
  }

  try {
    const formattedButtons = buttons.slice(0, 3).map((btn) => ({
      type: 'reply',
      reply: {
        id: btn.id,
        title: btn.title.substring(0, 20) // Límite de 20 caracteres por WhatsApp
      }
    }));

    const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace(/\D/g, ''),
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: { buttons: formattedButtons }
        }
      })
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error('[WhatsApp Buttons Error]:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendTextMessage,
  sendImageMessage,
  sendInteractiveButtons
};
