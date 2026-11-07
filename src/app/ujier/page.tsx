// @ts-nocheck
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { SEDES_G12, playTone } from '@/lib/evenpaseData';

export default function UjierScannerPortal() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [selectedSede, setSelectedSede] = useState(SEDES_G12[0].name);
  const [pin, setPin] = useState('1234');

  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showDemoButtons, setShowDemoButtons] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const usedTicketsRef = useRef<Record<string, string>>({});
  const lastScanTimestampRef = useRef<number>(0);

  const processRawQrData = (rawText: string) => {
    const now = Date.now();
    if (now - lastScanTimestampRef.current < 3200) return;
    lastScanTimestampRef.current = now;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (!rawText || !rawText.startsWith('EVENPASE|')) {
      playTone('error');
      setScanResult({
        status: 'fake',
        title: '🚨 ¡ALERTA! QR FALSO O NO VÁLIDO',
        subtitle: 'Este código QR no pertenece a la boletería oficial de Evenpase.',
        holder: 'Desconocido',
        zone: 'Sin registro',
        seat: 'Denegado',
        time: timeStr,
      });
      return;
    }

    const parts = rawText.split('|');
    const [, ticketId, holder, zone, seat, sede, code] = parts;

    if (usedTicketsRef.current[ticketId]) {
      playTone('error');
      setScanResult({
        status: 'duplicate',
        title: '🚨 ¡ALERTA! ESTA ENTRADA YA FUE USADA',
        subtitle: `Este boleto (${ticketId}) ya ingresó a las ${usedTicketsRef.current[ticketId]}`,
        holder,
        zone,
        seat,
        time: timeStr,
      });
    } else {
      playTone('success');
      usedTicketsRef.current[ticketId] = timeStr;
      setScanResult({
        status: 'valid',
        title: '✅ ENTRADA VÁLIDA • PASE ADELANTE',
        subtitle: `Verificado al instante • Boleto ${ticketId} (${code})`,
        holder,
        zone,
        seat,
        time: timeStr,
      });
    }
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let intervalId: any = null;

    if (loggedIn && cameraActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          intervalId = setInterval(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && window.jsQR) {
              canvas.width = 320;
              canvas.height = 320;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(video, 0, 0, 320, 320);
                const imgData = ctx.getImageData(0, 0, 320, 320);
                const qr = window.jsQR(imgData.data, imgData.width, imgData.height);
                if (qr && qr.data) {
                  processRawQrData(qr.data);
                }
              }
            }
          }, 220);
        })
        .catch(() => {});
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [loggedIn, cameraActive]);

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center">
              UJ
            </div>
            <div>
              <h1 className="font-black text-lg">Portal Exclusivo de Ujieres</h1>
              <p className="text-xs text-slate-400">Verificación óptica de entradas por Sede</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Selecciona tu Iglesia / Sede G12</label>
              <select
                value={selectedSede}
                onChange={(e) => setSelectedSede(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white"
              >
                {SEDES_G12.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">PIN de Puerta / Ujier</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white font-mono"
              />
            </div>

            <button
              onClick={() => {
                setLoggedIn(true);
                setCameraActive(true);
              }}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              Entrar al Escáner de Puerta →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 pb-16">
      <Script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js" strategy="afterInteractive" />
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
          <div>
            <span className="text-[10px] font-bold uppercase text-emerald-400 block">
              ESCÁNER UJIER ACTIVO
            </span>
            <strong className="text-xs sm:text-sm text-white">{selectedSede}</strong>
          </div>
          <button
            onClick={() => setLoggedIn(false)}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 cursor-pointer"
          >
            Cambiar Sede
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center space-y-4 shadow-2xl">
          <h2 className="text-xl font-black text-white">Lector QR Automático</h2>
          <p className="text-xs text-slate-400">
            Apunta la cámara al código QR del boleto. El sistema lo lee automáticamente sin tocar botones.
          </p>

          <div className="relative w-full aspect-square max-w-xs mx-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500/70 flex items-center justify-center">
            {cameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="p-6 text-xs text-slate-400">Cámara en pausa</div>
            )}
            <div className="absolute inset-8 border-2 border-emerald-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse" />
            </div>
          </div>

          <button
            onClick={() => setCameraActive(!cameraActive)}
            className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 cursor-pointer"
          >
            {cameraActive ? 'Pausar Cámara' : '📷 Activar Cámara Automática'}
          </button>

          {scanResult && (
            <div
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                scanResult.status === 'valid'
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100'
                  : 'bg-red-950/90 border-red-500 text-red-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-lg font-black">{scanResult.title}</span>
                <span className="font-mono text-xs">{scanResult.time}</span>
              </div>
              <p className="text-xs opacity-90 mt-1">{scanResult.subtitle}</p>
              <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="opacity-75 block">Asistente:</span>
                  <strong className="text-sm">{scanResult.holder}</strong>
                </div>
                <div>
                  <span className="opacity-75 block">Ubicación y Silla:</span>
                  <strong className="text-sm text-amber-300">
                    {scanResult.zone} ({scanResult.seat})
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => setShowDemoButtons(!showDemoButtons)}
              className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
            >
              {showDemoButtons ? '▲ Ocultar botones de prueba manual' : '▼ Mostrar botones de demostración rápida'}
            </button>

            {showDemoButtons && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                <button
                  onClick={() => {
                    lastScanTimestampRef.current = 0;
                    delete usedTicketsRef.current['EVN-8842'];
                    processRawQrData(
                      `EVENPASE|EVN-8842|Luis Castillo|Zona VIP Ministerial|Fila B - Silla 4|${selectedSede}|EP-842`
                    );
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer"
                >
                  ✅ Simular QR Válido
                </button>
                <button
                  onClick={() => {
                    lastScanTimestampRef.current = 0;
                    usedTicketsRef.current['EVN-8842'] = '18:30:15';
                    processRawQrData(
                      `EVENPASE|EVN-8842|Luis Castillo|Zona VIP Ministerial|Fila B - Silla 4|${selectedSede}|EP-842`
                    );
                  }}
                  className="py-2.5 px-3 rounded-xl bg-red-500 text-white font-black text-xs cursor-pointer"
                >
                  🚨 Simular QR Repetido
                </button>
                <button
                  onClick={() => {
                    lastScanTimestampRef.current = 0;
                    processRawQrData('QR_FALSO_EXTERNO_999');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
                >
                  ⚠️ Simular QR Falso
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}