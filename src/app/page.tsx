// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// GENERADOR DE SONIDOS SINTETIZADOS (Web Audio API - Cero archivos externos)
// ============================================================================
const playSound = (type: 'success' | 'error' | 'coin') => {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'coin') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch (e) {
    // Audio ignorado si el navegador aún no tiene interacción
  }
};

// ============================================================================
// COMPONENTE QR VECTORIAL DINÁMICO
// ============================================================================
const DynamicQR = ({ value }: { value: string }) => {
  const size = 21;
  const cells = [];
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  const isFinderPattern = (r: number, c: number) => {
    const topL = r < 7 && c < 7;
    const topR = r < 7 && c >= size - 7;
    const botL = r >= size - 7 && c < 7;
    return topL || topR || botL;
  };

  const getFinderPixel = (r: number, c: number) => {
    const lr = r >= size - 7 ? r - (size - 7) : r;
    const lc = c >= size - 7 ? c - (size - 7) : c;
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
    return false;
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let filled = false;
      if (isFinderPattern(r, c)) {
        filled = getFinderPixel(r, c);
      } else {
        const seed = Math.abs(Math.sin(hash + r * 31 + c * 17) * 10000);
        filled = seed - Math.floor(seed) > 0.46;
      }
      if (filled) {
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c * 10}
            y={r * 10}
            width="10"
            height="10"
            rx="1.5"
            fill="#090D16"
          />
        );
      }
    }
  }

  return (
    <svg viewBox="0 0 210 210" className="w-48 h-48 mx-auto">
      <rect width="210" height="210" fill="#FFFFFF" rx="8" />
      {cells}
    </svg>
  );
};

// ============================================================================
// PLATAFORMA PRINCIPAL EVENPASE (G12 TICKETS & EVENTOS SAAS)
// ============================================================================
export default function EvenpasePlatform() {
  // Navegación principal
  const [activeTab, setActiveTab] = useState<'checkout' | 'wallet' | 'scanner' | 'admin'>('checkout');
  const [sede, setSede] = useState('G12 Caracas - Convención Nacional');

  // Tasas y configuración
  const TASA_BCV = 45.20;

  // Estado del Checkout
  const [selectedTier, setSelectedTier] = useState({
    id: 'vip',
    name: 'VIP Ministerial + Kit Oficial',
    price: 25,
    zone: ' Auditorio Principal - Sector A',
  });
  const [paymentMode, setPaymentMode] = useState<'full' | 'alcancia'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'pagomovil' | 'zelle' | 'binance'>('pagomovil');
  const [buyerName, setBuyerName] = useState('Luis Castillo');
  const [buyerPhone, setBuyerPhone] = useState('0414-5558921');
  const [centimoUnico, setCentimoUnico] = useState(0.04);
  const [checkoutStep, setCheckoutStep] = useState<'select' | 'waiting' | 'approved'>('select');
  const [timeLeft, setTimeLeft] = useState(595); // 9m 55s

  // Estado de Billetera y Alcancía Digital
  const [alcanciaPaid, setAlcanciaPaid] = useState(15);
  const [alcanciaTotal, setAlcanciaTotal] = useState(25);
  const [activeTicket, setActiveTicket] = useState({
    id: 'EVN-2026-8842',
    holder: 'Luis Castillo',
    event: 'Convención G12: El Año de la Visión 2026',
    tier: 'VIP Ministerial + Kit Oficial',
    seat: 'Fila C - Asiento 14',
    amountPaid: 25.04,
    method: 'Pago Móvil (Conciliación Orgánica)',
    hash: 'hmac_sha256_9f8e7d6c5b4a3f2e1d0c',
    used: false,
    usedAt: null as string | null,
  });

  // Estado del Escáner de Ujieres
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<null | {
    status: 'valid' | 'duplicate' | 'invalid';
    title: string;
    subtitle: string;
    holder: string;
    seat: string;
    time: string;
  }>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Estado de Bóveda de Tesorería (Admin)
  const [vaultTransactions, setVaultTransactions] = useState([
    {
      id: 'TX-9941',
      sender: '0414-***8921 (Banesco)',
      method: 'PAGO MÓVIL',
      baseAmount: 25.0,
      uniqueAmount: 25.04,
      bsAmount: '1.131,81 Bs',
      buyer: 'Luis Castillo',
      status: 'CONCILIADO AUTO (0.3s)',
      time: 'Hace 1 min',
    },
    {
      id: 'TX-9940',
      sender: 'maria.g12@gmail.com',
      method: 'ZELLE (Cloudflare Worker)',
      baseAmount: 50.0,
      uniqueAmount: 50.02,
      bsAmount: '$50.02 USD',
      buyer: 'María Gabriela Pérez',
      status: 'CONCILIADO AUTO (0.4s)',
      time: 'Hace 4 min',
    },
    {
      id: 'TX-9939',
      sender: 'Binance ID #8492019',
      method: 'BINANCE PAY',
      baseAmount: 10.0,
      uniqueAmount: 10.07,
      bsAmount: '10.07 USDT',
      buyer: 'Carlos Rodríguez (Abono Alcancía)',
      status: 'ABONO APLICADO (0.2s)',
      time: 'Hace 8 min',
    },
  ]);

  // Notificación global en vivo
  const [liveToast, setLiveToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setLiveToast(msg);
    setTimeout(() => setLiveToast(null), 4500);
  };

  // Temporizador de reserva de Céntimo Único
  useEffect(() => {
    if (checkoutStep !== 'waiting') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 595));
    }, 1000);
    return () => clearInterval(timer);
  }, [checkoutStep]);

  // Control de Cámara en el Escáner
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (activeTab === 'scanner' && cameraActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          triggerToast('Modo Escáner Óptico Simulado Activo');
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [activeTab, cameraActive]);

  // Cálculos matemáticos del Céntimo Único
  const baseToPay = paymentMode === 'full' ? selectedTier.price : 10; // $10 abono inicial alcancía
  const exactUsdToPay = (baseToPay + centimoUnico).toFixed(2);
  const exactBsToPay = ((baseToPay + centimoUnico) * TASA_BCV).toFixed(2);

  // ==========================================================================
  // SIMULADOR DE CONCILIACIÓN BANCARIA EN VIVO (EL AS BAJO LA MANGA)
  // ==========================================================================
  const simulateIncomingBankWebhook = () => {
    playSound('coin');
    const methodLabel =
      paymentMethod === 'pagomovil'
        ? 'PAGO MÓVIL SMS/CORREO'
        : paymentMethod === 'zelle'
        ? 'ZELLE CLOUDFLARE WORKER'
        : 'BINANCE PAY API';

    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      sender: paymentMethod === 'pagomovil' ? buyerPhone : `${buyerName.toLowerCase().replace(' ', '.')}@mail.com`,
      method: methodLabel,
      baseAmount: baseToPay,
      uniqueAmount: parseFloat(exactUsdToPay),
      bsAmount: paymentMethod === 'pagomovil' ? `${exactBsToPay} Bs` : `$${exactUsdToPay} USD`,
      buyer: buyerName,
      status: paymentMode === 'full' ? 'CONCILIADO AUTO (0.2s)' : 'ABONO ALCANCÍA (0.2s)',
      time: 'Justo ahora',
    };

    setVaultTransactions((prev) => [newTx, ...prev]);

    if (paymentMode === 'alcancia') {
      setAlcanciaTotal(selectedTier.price);
      setAlcanciaPaid(10);
    } else {
      setAlcanciaTotal(selectedTier.price);
      setAlcanciaPaid(selectedTier.price);
    }

    setActiveTicket({
      id: `EVN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      holder: buyerName,
      event: sede,
      tier: selectedTier.name,
      seat: 'Sector VIP - Fila B - Asiento 08',
      amountPaid: parseFloat(exactUsdToPay),
      method: methodLabel,
      hash: `hmac_sha256_${Math.random().toString(36).substring(2, 15)}`,
      used: false,
      usedAt: null,
    });

    setCheckoutStep('approved');
    triggerToast(
      `¡WEBHOOK RECIBIDO! Pago exacto de $${exactUsdToPay} conciliado automáticamente por Céntimo Único.`
    );
  };

  // Abonar en la Alcancía Digital en vivo
  const handleAddAbone = (amount: number) => {
    playSound('coin');
    const nextVal = Math.min(alcanciaTotal, alcanciaPaid + amount);
    setAlcanciaPaid(nextVal);
    if (nextVal >= alcanciaTotal) {
      triggerToast('¡ALCANCÍA COMPLETADA AL 100%! Código QR Oficial Desbloqueado.');
    } else {
      triggerToast(`¡Abono de $${amount}.02 conciliado! Tu alcancía subió a $${nextVal}/${alcanciaTotal}.`);
    }
  };

  // Escaneo de Ticket en Puerta (Ujier)
  const handleSimulateScan = (mode: 'validTicket' | 'fraudAttempt') => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (mode === 'validTicket' && !activeTicket.used) {
      playSound('success');
      setActiveTicket((prev) => ({ ...prev, used: true, usedAt: now }));
      setScanResult({
        status: 'valid',
        title: 'ACCESO AUTORIZADO',
        subtitle: 'Firma HMAC-SHA256 Verificada • Cero Duplicados',
        holder: activeTicket.holder,
        seat: `${activeTicket.tier} (${activeTicket.seat})`,
        time: now,
      });
    } else {
      playSound('error');
      setScanResult({
        status: 'duplicate',
        title: '¡ALERTA DE FRAUDE! TICKET YA USADO',
        subtitle: `Esta entrada ya ingresó al auditorio a las ${activeTicket.usedAt || '18:42:10'}`,
        holder: activeTicket.holder,
        seat: `${activeTicket.tier} (${activeTicket.seat})`,
        time: now,
      });
    }
  };

  const resetTicketUsage = () => {
    setActiveTicket((prev) => ({ ...prev, used: false, usedAt: null }));
    setScanResult(null);
    triggerToast('Estado del ticket reiniciado para nueva demostración de escaneo.');
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black pb-28">
      {/* NOTIFICACIÓN FLOTANTE EN TIEMPO REAL */}
      {liveToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center gap-3 border border-emerald-300 animate-bounce">
          <span className="text-xl">⚡</span>
          <p className="text-xs sm:text-sm leading-snug">{liveToast}</p>
        </div>
      )}

      {/* BARRA SUPERIOR MULTI-SEDE (MARCA BLANCA SAAS) */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#070B14]/85 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
              EP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-white">EVENPASE</span>
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  0% Comisión
                </span>
              </div>
              <p className="text-xs text-slate-400">Motor de Conciliación Orgánica & Boletería SaaS</p>
            </div>
          </div>

          {/* Selector Multi-Tenant (Iglesias / Sedes / Clientes) */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <select
              value={sede}
              onChange={(e) => setSede(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="G12 Caracas - Convención Nacional" className="bg-slate-900">
                Sede: G12 Caracas (Principal)
              </option>
              <option value="G12 Barinas - Encuentro Regional" className="bg-slate-900">
                Sede: G12 Barinas
              </option>
              <option value="G12 Guanare - Conferencia de Jóvenes" className="bg-slate-900">
                Sede: G12 Guanare
              </option>
              <option value="G12 Maracaibo - Cumbre de Líderes" className="bg-slate-900">
                Sede: G12 Maracaibo
              </option>
              <option value="Marca Blanca SaaS - Productora Externa" className="bg-slate-900">
                Cliente SaaS: Productora VIP
              </option>
            </select>
          </div>
        </div>

        {/* NAVEGACIÓN DE LAS 4 INTERFACES PARA DEMOSTRACIÓN */}
        <div className="max-w-6xl mx-auto px-4 pb-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              onClick={() => setActiveTab('checkout')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'checkout'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>1. Tienda & Céntimo Único</span>
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'wallet'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>2. Billetera QR & Alcancía</span>
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'scanner'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>3. Escáner Ujier (iPhone/PC)</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>4. Bóveda Tesorería & SaaS</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 pt-6">
        {/* ================================================================
            VISTA 1: TIENDA PÚBLICA & CHECKOUT CON CÉNTIMO ÚNICO
        ================================================================ */}
        {activeTab === 'checkout' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Evento y Selección */}
            <div className="lg:col-span-7 space-y-6">
              {/* Banner del Evento */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-[#0F172A] to-emerald-950 p-6 sm:p-8 shadow-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
                  <span>🔥 INSCRIPCIONES ABIERTAS • CONCILIACIÓN INSTANTÁNEA</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
                  {sede}
                </h1>
                <p className="text-slate-300 text-sm sm:text-base mb-6 max-w-xl">
                  Adquiere tu entrada oficial al instante o apártala con nuestra Alcancía Digital sin cargos ocultos ni esperas de verificación manual.
                </p>
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-400 block">Fecha</span>
                    <strong className="text-white">24-26 Nov 2026</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tasa Oficial</span>
                    <strong className="text-emerald-400">Bs. {TASA_BCV.toFixed(2)} / USD</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Aforo Disponible</span>
                    <strong className="text-amber-400">Últimos 142 cupos</strong>
                  </div>
                </div>
              </div>

              {/* Selección de Categoría / Entrada */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center justify-between">
                  <span>1. Elige tu Ubicación</span>
                  <span className="text-xs font-normal text-slate-400">Precios netos (0% recargo)</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'gen',
                      name: 'Acceso General',
                      price: 15,
                      zone: 'Grada Superior Numerada',
                      badge: 'Popular',
                    },
                    {
                      id: 'vip',
                      name: 'VIP Ministerial + Kit',
                      price: 25,
                      zone: 'Auditorio Principal - Sector A',
                      badge: 'Más Vendido',
                    },
                    {
                      id: 'plat',
                      name: 'Palco Liderazgo Full',
                      price: 50,
                      zone: 'Primera Fila + Acceso Backstage',
                      badge: 'Exclusivo',
                    },
                  ].map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => {
                        setSelectedTier(tier);
                        setCentimoUnico(Number((Math.floor(Math.random() * 9) + 1) / 100));
                        setCheckoutStep('select');
                      }}
                      className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                        selectedTier.id === tier.id
                          ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                        {tier.badge}
                      </span>
                      <h3 className="font-bold text-white mt-2 text-sm">{tier.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{tier.zone}</p>
                      <p className="text-2xl font-black text-emerald-400 mt-3">${tier.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modalidad: Contado vs Alcancía Digital */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">2. ¿Cómo deseas pagar tu entrada?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setPaymentMode('full');
                      setCheckoutStep('select');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      paymentMode === 'full'
                        ? 'bg-emerald-500/10 border-emerald-500'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">⚡ Pago de Contado</span>
                      <span className="text-xs font-bold text-emerald-400">${selectedTier.price}.00</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Recibes tu código QR oficial encriptado de inmediato al conciliarse el pago.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMode('alcancia');
                      setCheckoutStep('select');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      paymentMode === 'alcancia'
                        ? 'bg-amber-500/10 border-amber-500'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">🐷 Alcancía Digital (Abonos)</span>
                      <span className="text-xs font-bold text-amber-400">Congela con $10</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Congela tu cupo hoy con $10 y abona a tu ritmo. El QR se activa al llegar al 100%.
                    </p>
                  </button>
                </div>

                {/* Datos del asistente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nombre del Asistente / Líder</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">WhatsApp / Teléfono Origen</label>
                    <input
                      type="text"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Motor de Conciliación Orgánica (Céntimo Único) */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl sticky top-28 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      CONCILIACIÓN ORGÁNICA AUTOMÁTICA
                    </span>
                    <h3 className="text-xl font-black text-white">Orden de Tesorería</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Tiempo reservado</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Selector de Método de Pago */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pagomovil', label: 'Pago Móvil' },
                    { id: 'zelle', label: 'Zelle USD' },
                    { id: 'binance', label: 'Binance Pay' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        paymentMethod === m.id
                          ? 'bg-white text-slate-950 border-white shadow'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* CAJA ESTRELLA: EL CÉNTIMO ÚNICO */}
                <div className="rounded-2xl bg-gradient-to-b from-emerald-950/60 to-slate-950 border-2 border-emerald-500/70 p-4 text-center relative overflow-hidden">
                  <span className="text-[11px] uppercase tracking-widest font-bold text-emerald-300 block mb-1">
                    Transfiere exactamente este monto único
                  </span>
                  {paymentMethod === 'pagomovil' ? (
                    <>
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-1">
                        Bs. {exactBsToPay}
                      </div>
                      <p className="text-xs text-emerald-400 font-semibold">
                        Equivalente a ${exactUsdToPay} USD (Incluye céntimo verificador +${centimoUnico.toFixed(2)})
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-1">
                        ${exactUsdToPay} <span className="text-lg font-bold text-emerald-400">USD</span>
                      </div>
                      <p className="text-xs text-emerald-400 font-semibold">
                        Incluye +${centimoUnico.toFixed(2)} de huella criptográfica para aprobación en 0.3 seg
                      </p>
                    </>
                  )}
                </div>

                {/* Coordenadas Bancarias según método */}
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 text-xs space-y-2">
                  {paymentMethod === 'pagomovil' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Banco Destino:</span>
                        <strong className="text-white">0134 - Banesco (Tesorería G12)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">RIF / Teléfono:</span>
                        <strong className="text-white">J-40928172-1 • 0414-G12PAGO</strong>
                      </div>
                    </>
                  )}
                  {paymentMethod === 'zelle' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Correo Zelle Oficial:</span>
                        <strong className="text-white">pagos@evenpase.com</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Interceptor Nube:</span>
                        <strong className="text-emerald-400">Cloudflare Email Worker Activo</strong>
                      </div>
                    </>
                  )}
                  {paymentMethod === 'binance' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Binance Pay Merchant ID:</span>
                        <strong className="text-white">294810492 (Evenpase G12)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Moneda:</span>
                        <strong className="text-amber-400">USDT (Monto exacto: {exactUsdToPay})</strong>
                      </div>
                    </>
                  )}
                </div>

                {/* Estado de la Orden */}
                {checkoutStep === 'select' && (
                  <button
                    onClick={() => setCheckoutStep('waiting')}
                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-emerald-500/20 cursor-pointer"
                  >
                    Ya realicé la transferencia exacta →
                  </button>
                )}

                {checkoutStep === 'waiting' && (
                  <div className="space-y-3 text-center py-2">
                    <div className="flex items-center justify-center gap-3 text-amber-400 font-bold text-sm">
                      <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                      <span>Escuchando bóveda bancaria por ${exactUsdToPay}...</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Apenas el banco notifique el monto exacto con el céntimo único, tu entrada se abrirá sola sin intervención humana.
                    </p>
                    <button
                      onClick={simulateIncomingBankWebhook}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
                    >
                      ⚡ [MODO DEMO] Simular Caída del Pago en el Banco Ahora
                    </button>
                  </div>
                )}

                {checkoutStep === 'approved' && (
                  <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500 p-4 text-center space-y-3">
                    <div className="text-2xl">✅</div>
                    <h4 className="font-black text-emerald-400 text-base">
                      ¡PAGO CONCILIADO EN 0.3 SEGUNDOS!
                    </h4>
                    <p className="text-xs text-slate-300">
                      El webhook verificó la firma HMAC-SHA256 y cruzó el monto exacto de ${exactUsdToPay}.
                    </p>
                    <button
                      onClick={() => setActiveTab('wallet')}
                      className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Abrir Mi Billetera QR / Alcancía →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            VISTA 2: BILLETERA DEL CREYENTE (PWA OFFLINE) & ALCANCÍA DIGITAL
        ================================================================ */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Tarjeta de Alcancía Digital Interactiva */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  🐷 Sistema de Abonos G12
                </span>
                <span className="text-xs text-slate-400">Sin intereses • Cupo Congelado</span>
              </div>

              <h2 className="text-xl font-black text-white">Mi Alcancía Digital</h2>
              <p className="text-xs text-slate-400">
                Permite a cualquier miembro de la iglesia o asistente ir abonando semana a semana desde su teléfono hasta desbloquear su entrada.
              </p>

              {/* Barra de Progreso */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs text-slate-400 block">Total Abonado</span>
                    <span className="text-2xl font-black text-emerald-400">
                      ${alcanciaPaid}.00 <span className="text-sm text-slate-500">/ ${alcanciaTotal}.00</span>
                    </span>
                  </div>
                  <span className="text-lg font-black text-white">
                    {Math.round((alcanciaPaid / alcanciaTotal) * 100)}%
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, (alcanciaPaid / alcanciaTotal) * 100)}%` }}
                  />
                </div>

                {alcanciaPaid < alcanciaTotal ? (
                  <p className="text-xs text-amber-300 font-medium">
                    🔒 Restan ${alcanciaTotal - alcanciaPaid}.00 para desbloquear el código QR de acceso.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-400 font-bold">
                    🔓 ¡Meta alcanzada al 100%! Tu Ticket QR Oficial está activo y listo para escanear.
                  </p>
                )}
              </div>

              {/* Botones para demostrar abonos en vivo durante la presentación */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-400 block">
                  Demostración en Vivo: Simular Abono Conciliado
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddAbone(5)}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
                  >
                    + Abonar $5.02
                  </button>
                  <button
                    onClick={() => handleAddAbone(alcanciaTotal)}
                    className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                  >
                    ⚡ Completar 100% Ahora
                  </button>
                </div>
                <button
                  onClick={() => {
                    setAlcanciaPaid(10);
                    setAlcanciaTotal(25);
                  }}
                  className="w-full py-2 text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  Reiniciar Alcancía a $10 / $25 para otra prueba
                </button>
              </div>
            </div>

            {/* Ticket Estilo Apple Wallet / Google Wallet Offline */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-[#0B1220] border-2 border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                {/* Cabecera del Ticket */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-slate-950 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-black/15 px-2 py-0.5 rounded">
                      PASE CRIPTOGRÁFICO OFFLINE
                    </span>
                    <h3 className="text-lg font-black mt-1">{activeTicket.event}</h3>
                  </div>
                  <div className="text-right font-mono text-xs font-bold">
                    {activeTicket.id}
                  </div>
                </div>

                {/* Cuerpo del Ticket */}
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-xs border-b border-dashed border-slate-800 pb-4">
                    <div>
                      <span className="text-slate-400 block">Asistente Titular</span>
                      <strong className="text-white text-sm">{activeTicket.holder}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Estado en Puerta</span>
                      {activeTicket.used ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                          YA INGRESÓ ({activeTicket.usedAt})
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          VÁLIDO PARA INGRESAR
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block">Categoría</span>
                      <strong className="text-emerald-400">{activeTicket.tier}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Ubicación Asignada</span>
                      <strong className="text-white">{activeTicket.seat}</strong>
                    </div>
                  </div>

                  {/* Zona del Código QR */}
                  <div className="text-center space-y-3">
                    {alcanciaPaid < alcanciaTotal ? (
                      <div className="py-12 px-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="text-4xl">🔒</div>
                        <h4 className="font-bold text-amber-300 text-sm">
                          Código QR en Custodia (Alcancía al {Math.round((alcanciaPaid / alcanciaTotal) * 100)}%)
                        </h4>
                        <p className="text-xs text-slate-400">
                          Completa el 100% de tu alcancía en el panel izquierdo para revelar tu QR oficial.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-2xl inline-block shadow-xl">
                        <DynamicQR value={`${activeTicket.id}-${activeTicket.holder}-${activeTicket.hash}`} />
                        <p className="text-[10px] font-mono text-slate-600 mt-2">
                          FIRMA: {activeTicket.hash.toUpperCase()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Indicador PWA Offline */}
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-slate-300 font-medium">
                        Guardado en Memoria Local (Funciona sin Internet)
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('scanner')}
                      className="text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Probar Escáner →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            VISTA 3: ESCÁNER DE UJIERES CON CÁMARA EN VIVO Y ANTIFRAUDE
        ================================================================ */}
        {activeTab === 'scanner' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                <span>📷 TERMINAL DE CONTROL DE ACCESO (UJIERES)</span>
              </div>
              <h2 className="text-2xl font-black text-white">Escáner Criptográfico en Puerta</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Convierte cualquier iPhone o Android del equipo de protocolo en un lector láser de alta velocidad con bloqueo inmediato de entradas duplicadas.
              </p>

              {/* Visor de Cámara Real / Mira Láser */}
              <div className="relative w-full aspect-square max-w-xs mx-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500/60 flex items-center justify-center shadow-inner">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <div className="text-5xl">📱</div>
                    <p className="text-xs text-slate-400">
                      Activa la cámara trasera de tu iPhone o usa los botones de simulación rápida abajo.
                    </p>
                  </div>
                )}

                {/* Marco y Línea Láser Animada */}
                <div className="absolute inset-8 border-2 border-emerald-400/50 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse" />
                </div>
              </div>

              {/* Botón de Encendido de Cámara Física */}
              <div className="flex justify-center">
                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 cursor-pointer"
                >
                  {cameraActive ? 'Apagar Cámara del Dispositivo' : '📷 Encender Cámara Real (iPhone / PC)'}
                </button>
              </div>

              {/* Botones de Disparo en Vivo para la Demostración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleSimulateScan('validTicket')}
                  className="py-4 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  ✅ Escanear QR (1ra Vez: Válido)
                </button>
                <button
                  onClick={() => handleSimulateScan('fraudAttempt')}
                  className="py-4 px-4 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  🚨 Intentar Re-Escanear (2da Vez: Fraude)
                </button>
              </div>

              {/* Resultado del Escaneo */}
              {scanResult && (
                <div
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    scanResult.status === 'valid'
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-100'
                      : 'bg-red-950/80 border-red-500 text-red-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black">{scanResult.title}</span>
                    <span className="font-mono text-xs opacity-80">{scanResult.time}</span>
                  </div>
                  <p className="text-xs opacity-90 mt-1">{scanResult.subtitle}</p>
                  <div className="mt-3 pt-3 border-t border-white/15 flex justify-between text-xs">
                    <span>
                      Titular: <strong>{scanResult.holder}</strong>
                    </span>
                    <span>
                      Ubicación: <strong>{scanResult.seat}</strong>
                    </span>
                  </div>
                </div>
              )}

              {activeTicket.used && (
                <button
                  onClick={resetTicketUsage}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Reiniciar estado del ticket para volver a probar acceso verde
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            VISTA 4: DASHBOARD DE TESORERÍA, BÓVEDA & MODELO DE NEGOCIO SAAS
        ================================================================ */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {/* KPIs Superiores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400">Recaudación Conciliada (Hoy)</span>
                <p className="text-3xl font-black text-emerald-400 mt-1">$14,850.42</p>
                <span className="text-[11px] text-emerald-300">100% Automático • 0 Horas Humanas</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400">Comisiones Ahorradas al Cliente</span>
                <p className="text-3xl font-black text-white mt-1">$1,485.00</p>
                <span className="text-[11px] text-slate-400">vs. 10% de boleteras tradicionales</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400">Alcancías Digitales Activas</span>
                <p className="text-3xl font-black text-amber-400 mt-1">318</p>
                <span className="text-[11px] text-amber-300">$7,950 asegurados en abonos</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400">Asistentes en Auditorio</span>
                <p className="text-3xl font-black text-teal-400 mt-1">842 / 1,000</p>
                <span className="text-[11px] text-slate-400">14 intentos de QR duplicado bloqueados</span>
              </div>
            </div>

            {/* Tabla de la Bóveda de Pagos Entrantes */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-white">
                    Bóveda de Conciliación Orgánica en Tiempo Real
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cruza pagos entrantes de Zelle, Binance Pay y Pago Móvil mediante la firma del Céntimo Único.
                  </p>
                </div>
                <button
                  onClick={simulateIncomingBankWebhook}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer"
                >
                  + Simular Nuevo Pago Entrante
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-3 px-2">ID / Hora</th>
                      <th className="py-3 px-2">Canal Interceptor</th>
                      <th className="py-3 px-2">Asistente</th>
                      <th className="py-3 px-2">Céntimo Único</th>
                      <th className="py-3 px-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {vaultTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-2 font-mono text-xs text-slate-300">
                          <strong>{tx.id}</strong>
                          <span className="block text-[10px] text-slate-500">{tx.time}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-bold text-white block">{tx.method}</span>
                          <span className="text-xs text-slate-400">{tx.sender}</span>
                        </td>
                        <td className="py-3 px-2 font-semibold text-slate-200">{tx.buyer}</td>
                        <td className="py-3 px-2">
                          <span className="font-black text-emerald-400 text-sm">
                            ${tx.uniqueAmount.toFixed(2)}
                          </span>
                          <span className="block text-[11px] text-slate-400">{tx.bsAmount}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[11px]">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BARRA INFERIOR FIJA DE CONTROL RÁPIDO PARA TU PRESENTACIÓN DE MAÑANA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              MODO DEMOSTRACIÓN EN VIVO
            </span>
            <span className="text-slate-400 hidden sm:inline">
              Usa estos controles rápidos frente al cliente para simular pagos reales al instante:
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={simulateIncomingBankWebhook}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
            >
              ⚡ Simular Pago Bancario (${exactUsdToPay})
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
            >
              📷 Abrir Escáner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}