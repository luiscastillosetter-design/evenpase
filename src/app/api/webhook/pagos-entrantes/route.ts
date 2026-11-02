import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        // 1. Extraer firma de seguridad de los headers
        const signature = request.headers.get('x-webhook-signature');
        if (!signature) {
            return NextResponse.json({ error: 'Acceso Denegado: Firma requerida' }, { status: 401 });
        }

        const rawBody = await request.text();
        
        // 2. Validar firma HMAC-SHA256 con el secreto del .env
        const secret = process.env.WEBHOOK_SECRET;
        if (!secret) {
            throw new Error('WEBHOOK_SECRET no está configurado en el servidor');
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        if (signature !== expectedSignature) {
            return NextResponse.json({ error: 'Acceso Denegado: Firma inválida' }, { status: 403 });
        }

        // 3. Parsear el payload validado
        const payload = JSON.parse(rawBody);
        const { plataforma, banco_origen, monto, referencia_sufijo, remitente, fecha_banco, raw_data } = payload;

        // 4. Conectar con Supabase como Admin (Service Role)
        const supabase = await createAdminClient();

        // 5. Insertar en la bóveda (el Trigger en SQL hará el auto-match si la orden ya está verificando)
        const { data, error } = await supabase
            .from('boveda_pagos_entrantes')
            .insert({
                plataforma,
                banco_origen,
                monto: parseFloat(monto),
                referencia_sufijo,
                remitente,
                fecha_banco,
                raw_data,
                estado: 'DISPONIBLE'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, pago: data });
        
    } catch (error: any) {
        console.error('Error Crítico en Webhook:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}