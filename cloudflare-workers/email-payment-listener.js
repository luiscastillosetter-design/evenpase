export default {
  async email(message, env, ctx) {
    try {
      // 1. Leer el correo en crudo y extraer cabeceras
      const rawEmail = await new Response(message.raw).text();
      const fromAddress = message.from.toLowerCase();
      const subject = message.headers.get("subject") || "";

      let plataforma = 'DESCONOCIDA';
      let monto = 0;
      let referencia = '';
      let remitente = '';
      const fecha_banco = new Date().toISOString();

      // 2. Lógica y RegEx para ZELLE (BofA, Wells Fargo, Chase, Zelle Oficial)
      if (
        fromAddress.includes('zellepay.com') || 
        fromAddress.includes('bankofamerica.com') || 
        fromAddress.includes('chase.com') || 
        fromAddress.includes('wellsfargo.com')
      ) {
        plataforma = 'ZELLE';
        
        // Extraer Monto (ej: $1,500.00 o $50.50)
        const amountMatch = rawEmail.match(/\$\s*([0-9,]+\.[0-9]{2})/);
        if (amountMatch) monto = parseFloat(amountMatch[1].replace(/,/g, ''));

        // Extraer Referencia/Confirmación
        const refMatch = rawEmail.match(/(?:Confirmation Number|Reference Number|Confirmation Code)[\s:#*-]*([A-Z0-9]{8,15})/i);
        if (refMatch) referencia = refMatch[1];

        // Extraer Remitente
        const senderMatch = rawEmail.match(/([a-zA-Z\s]+)\s+sent you/i) || subject.match(/([a-zA-Z\s]+)\s+sent you/i);
        if (senderMatch) remitente = senderMatch[1].trim();
      } 
      
      // 3. Lógica y RegEx para BINANCE PAY
      else if (fromAddress.includes('binance.com')) {
        plataforma = 'BINANCE_PAY';
        
        // Extraer Monto (ej: 15.50 USDT)
        const amountMatch = rawEmail.match(/([0-9,]+\.[0-9]+)\s*(USDT|BUSD|USD)/i);
        if (amountMatch) monto = parseFloat(amountMatch[1].replace(/,/g, ''));

        // Extraer Order ID o Pay ID
        const refMatch = rawEmail.match(/(?:Order ID|Pay ID)[\s:#*-]*([0-9]{10,20})/i);
        if (refMatch) referencia = refMatch[1];
      }

      // 4. Filtro de seguridad: Si no es un pago válido o no extrajo lo mínimo, abortar silenciosamente
      if (plataforma === 'DESCONOCIDA' || monto === 0 || !referencia) {
        console.log("Correo ignorado: No coincide con patrones de pago válidos.");
        return;
      }

      // 5. Construir el Payload
      const payloadString = JSON.stringify({
        plataforma,
        banco_origen: fromAddress,
        monto: monto.toString(),
        referencia_sufijo: referencia,
        remitente: remitente || fromAddress,
        fecha_banco,
        raw_data: { subject, from: fromAddress }
      });

      // 6. Firma Criptográfica HMAC-SHA256 (Web Crypto API Nativa)
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(env.WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadString));
      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // 7. Disparar al Endpoint de Next.js
      const response = await fetch(env.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': signatureHex
        },
        body: payloadString
      });

      if (!response.ok) {
        throw new Error(`El Webhook en Vercel respondió con error HTTP: ${response.status}`);
      }

      console.log(`Pago de ${plataforma} por ${monto} procesado exitosamente.`);

    } catch (error) {
      console.error("Error Crítico procesando Email Worker:", error.message);
    }
  }
};