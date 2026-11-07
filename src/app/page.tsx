// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// SONIDOS DEL SISTEMA (Aprobación, Moneda y Alerta)
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
  } catch (e) {}
};

// ============================================================================
// GENERADOR DE CÓDIGO QR
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
// PLATAFORMA PRINCIPAL EVENPASE
// ============================================================================
export default function EvenpasePlatform() {
  // ROL DE USUARIO: 'buyer' (Comprador público) | 'admin' (Organizador / Staff)
  const [userRole, setUserRole] = useState<'buyer' | 'admin'>('buyer');
  const [activeTab, setActiveTab] = useState<'checkout' | 'wallet' | 'scanner' | 'admin'>('checkout');
  const [sede, setSede] = useState('G12 Caracas - Convención Nacional');

  // TASA BCV EN TIEMPO REAL
  const [tasaBcv, setTasaBcv] = useState<number>(45.85);
  const [loadingBcv, setLoadingBcv] = useState<boolean>(false);
  const [bcvUpdatedTime, setBcvUpdatedTime] = useState<string>('Actualizada hoy');

  const fetchLiveBcvRate = async () => {
    setLoadingBcv(true);
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.promedio) {
          setTasaBcv(Number(data.promedio));
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setBcvUpdatedTime(`En vivo (${now})`);
        }
      }
    } catch (e) {
      // Mantiene la tasa de respaldo si no hay conexión
    } finally {
      setLoadingBcv(false);
    }
  };

  useEffect(() => {
    fetchLiveBcvRate();
  }, []);

  // ESTADO DE LA TIENDA Y COMPRA
  const [selectedTier, setSelectedTier] = useState({
    id: 'vip',
    name: 'VIP Ministerial + Kit Oficial',
    price: 25,
    zone: 'Auditorio Principal - Sector A',
  });
  const [paymentMode, setPaymentMode] = useState<'full' | 'fraccionado'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'pagomovil' | 'zelle' | 'binance'>('pagomovil');

  // Datos del comprador (Simples y directos)
  const [buyerName, setBuyerName] = useState('Luis Castillo');
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('0414-5558921');
  const [buyerCedula, setBuyerCedula] = useState('V-17450921');

  // Identificadores únicos del pago (Centavos + Código de Concepto)
  const [centimoUnico, setCentimoUnico] = useState(0.04);
  const [paymentConceptCode, setPaymentConceptCode] = useState('EP-842');
  const [copiedData, setCopiedData] = useState(false);

  // Verificación de pago por el usuario (Referencia + Captura)
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'approved'>('form');
  const [timeLeft, setTimeLeft] = useState(595);

  // ESTADO DE BILLETERA Y PAGO FRACCIONADO
  const [fraccionadoPaid, setFraccionadoPaid] = useState(15);
  const [fraccionadoTotal, setFraccionadoTotal] = useState(25);
  const [activeTicket, setActiveTicket] = useState({
    id: 'EVN-2026-8842',
    holder: 'Luis Castillo',
    whatsapp: '0414-5558921',
    event: 'G12 Caracas - Convención Nacional',
    tier: 'VIP Ministerial + Kit Oficial',
    seat: 'Fila C - Asiento 14',
    amountPaid: 25.04,
    code: 'EP-842',
    used: false,
    usedAt: null as string | null,
  });

  // ESTADO DEL ESCÁNER DE UJIER
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<null | {
    status: 'valid' | 'duplicate';
    title: string;
    subtitle: string;
    holder: string;
    seat: string;
    time: string;
  }>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ESTADO DE LA BÓVEDA (ADMINISTRADOR)
  const [selectedReceiptModal, setSelectedReceiptModal] = useState<string | null>(null);
  const [vaultTransactions, setVaultTransactions] = useState([
    {
      id: 'PAG-9941',
      sender: '0414-5558921 (Banesco)',
      method: 'Pago Móvil',
      reference: '849201',
      conceptCode: 'EP-842',
      uniqueAmount: 25.04,
      bsAmount: 'Bs. 1.148,08',
      buyer: 'Luis Castillo',
      status: 'Verificado',
      time: 'Hace 2 min',
      receiptUrl: null as string | null,
    },
    {
      id: 'PAG-9940',
      sender: 'maria.g12@gmail.com',
      method: 'Zelle',
      reference: '992014',
      conceptCode: 'EP-519',
      uniqueAmount: 50.02,
      bsAmount: '$50.02 USD',
      buyer: 'María Gabriela Pérez',
      status: 'Verificado',
      time: 'Hace 6 min',
      receiptUrl: null as string | null,
    },
    {
      id: 'PAG-9939',
      sender: '0412-8841209 (Mercantil)',
      method: 'Pago Móvil',
      reference: '330192',
      conceptCode: 'EP-204',
      uniqueAmount: 10.07,
      bsAmount: 'Bs. 461,71',
      buyer: 'Carlos Rodríguez (Abono)',
      status: 'Abono Verificado',
      time: 'Hace 12 min',
      receiptUrl: null as string | null,
    },
  ]);

  // Notificación superior
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setLiveToast(msg);
    setTimeout(() => setLiveToast(null), 4000);
  };

  // Temporizador de reserva
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 595));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cámara del Escáner Ujier
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
          triggerToast('Lector óptico activado.');
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [activeTab, cameraActive]);

  // Cálculos con la Tasa BCV en vivo
  const baseToPay = paymentMode === 'full' ? selectedTier.price : 10;
  const exactUsdToPay = (baseToPay + centimoUnico).toFixed(2);
  const exactBsToPay = ((baseToPay + centimoUnico) * tasaBcv).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Función para Copiar todos los datos de pago en un solo clic
  const handleCopyPaymentDetails = () => {
    let textToCopy = '';
    if (paymentMethod === 'pagomovil') {
      textToCopy = `DATOS DE PAGO MÓVIL - EVENPASE\nBanco: 0134 - Banesco\nTeléfono: 0414-1234567\nRIF: J-40928172-1\nMonto Exacto: Bs. ${exactBsToPay}\nConcepto / Motivo: ${paymentConceptCode}`;
    } else if (paymentMethod === 'zelle') {
      textToCopy = `DATOS ZELLE - EVENPASE\nCorreo: pagos@evenpase.com\nTitular: Evenpase Oficial\nMonto Exacto: $${exactUsdToPay} USD\nConcepto / Memo: ${paymentConceptCode}`;
    } else {
      textToCopy = `DATOS BINANCE PAY - EVENPASE\nBinance ID: 294810492\nMonto Exacto: ${exactUsdToPay} USDT\nNota / Concepto: ${paymentConceptCode}`;
    }

    navigator.clipboard?.writeText(textToCopy);
    setCopiedData(true);
    triggerToast('¡Datos de pago copiados al portapapeles!');
    setTimeout(() => setCopiedData(false), 3000);
  };

  // Subida de imagen del capture
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFileName(file.name);
      const url = URL.createObjectURL(file);
      setReceiptPreview(url);
    }
  };

  // Procesar y Verificar Pago
  const handleVerifyPayment = () => {
    if (!referenceNumber.trim()) {
      triggerToast('Por favor ingresa los números de referencia de tu pago.');
      return;
    }

    setIsVerifyingPayment(true);
    setTimeout(() => {
      setIsVerifyingPayment(false);
      playSound('coin');

      const methodLabel =
        paymentMethod === 'pagomovil'
          ? 'Pago Móvil'
          : paymentMethod === 'zelle'
          ? 'Zelle'
          : 'Binance';

      const newTx = {
        id: `PAG-${Math.floor(1000 + Math.random() * 9000)}`,
        sender: `${buyerWhatsapp} (${buyerCedula})`,
        method: methodLabel,
        reference: referenceNumber,
        conceptCode: paymentConceptCode,
        uniqueAmount: parseFloat(exactUsdToPay),
        bsAmount: paymentMethod === 'pagomovil' ? `Bs. ${exactBsToPay}` : `$${exactUsdToPay} USD`,
        buyer: buyerName,
        status: paymentMode === 'full' ? 'Verificado' : 'Abono Verificado',
        time: 'Justo ahora',
        receiptUrl: receiptPreview,
      };

      setVaultTransactions((prev) => [newTx, ...prev]);

      if (paymentMode === 'fraccionado') {
        setFraccionadoTotal(selectedTier.price);
        setFraccionadoPaid(10);
      } else {
        setFraccionadoTotal(selectedTier.price);
        setFraccionadoPaid(selectedTier.price);
      }

      setActiveTicket({
        id: `EVN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        holder: buyerName,
        whatsapp: buyerWhatsapp,
        event: sede,
        tier: selectedTier.name,
        seat: 'Sector VIP - Fila B - Asiento 08',
        amountPaid: parseFloat(exactUsdToPay),
        code: paymentConceptCode,
        used: false,
        usedAt: null,
      });

      setCheckoutStep('approved');
      triggerToast(`¡Pago verificado con éxito! Referencia #${referenceNumber} aprobada.`);
    }, 1400);
  };

  // Abonar en Pago Fraccionado
  const handleAddAbone = (amount: number) => {
    playSound('coin');
    const nextVal = Math.min(fraccionadoTotal, fraccionadoPaid + amount);
    setFraccionadoPaid(nextVal);
    if (nextVal >= fraccionadoTotal) {
      triggerToast('¡Pago completado al 100%! Tu código QR ya está activo.');
    } else {
      triggerToast(`¡Abono de $${amount} registrado! Llevas $${nextVal} de $${fraccionadoTotal}.`);
    }
  };

  // Escaneo de Entrada (Ujier)
  const handleSimulateScan = (mode: 'validTicket' | 'fraudAttempt') => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (mode === 'validTicket' && !activeTicket.used) {
      playSound('success');
      setActiveTicket((prev) => ({ ...prev, used: true, usedAt: now }));
      setScanResult({
        status: 'valid',
        title: 'ENTRADA VÁLIDA • PASE ADELANTE',
        subtitle: `Boleto verificado correctamente • Código ${activeTicket.code}`,
        holder: activeTicket.holder,
        seat: `${activeTicket.tier} (${activeTicket.seat})`,
        time: now,
      });
    } else {
      playSound('error');
      setScanResult({
        status: 'duplicate',
        title: '¡ALERTA! ESTA ENTRADA YA FUE USADA',
        subtitle: `Esta persona ya ingresó al evento a las ${activeTicket.usedAt || '18:42:10'}`,
        holder: activeTicket.holder,
        seat: `${activeTicket.tier} (${activeTicket.seat})`,
        time: now,
      });
    }
  };

  // Cambiar entre Vista Comprador y Vista Organizador
  const toggleUserRole = () => {
    if (userRole === 'buyer') {
      setUserRole('admin');
      triggerToast('Modo Organizador activado: Escáner Ujier y Bóveda habilitados.');
    } else {
      setUserRole('buyer');
      if (activeTab === 'scanner' || activeTab === 'admin') {
        setActiveTab('checkout');
      }
      triggerToast('Vista de Comprador activada: Herramientas de administrador ocultas.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black pb-20">
      {/* NOTIFICACIÓN FLOTANTE */}
      {liveToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center gap-3 border border-emerald-300">
          <span className="text-xl">✅</span>
          <p className="text-xs sm:text-sm leading-snug">{liveToast}</p>
        </div>
      )}

      {/* MODAL PARA VER CAPTURA DE PAGO EN LA BÓVEDA */}
      {selectedReceiptModal && (
        <div
          onClick={() => setSelectedReceiptModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm">Comprobante de Pago Subido</h4>
              <button
                onClick={() => setSelectedReceiptModal(null)}
                className="text-xs bg-slate-800 px-3 py-1 rounded-lg text-slate-300 hover:text-white"
              >
                Cerrar ✕
              </button>
            </div>
            <img
              src={selectedReceiptModal}
              alt="Captura de pago"
              className="w-full max-h-96 object-contain rounded-2xl bg-slate-950 border border-slate-800"
            />
          </div>
        </div>
      )}

      {/* BARRA SUPERIOR */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#070B14]/90 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
              EP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-white">EVENPASE</span>
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  Boletería Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400">Tus entradas al instante y sin recargos</p>
            </div>
          </div>

          {/* Controles Derecha: Selector de Sede (Solo Admin) + Botón de Cambio de Usuario */}
          <div className="flex items-center gap-2">
            {userRole === 'admin' && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <select
                  value={sede}
                  onChange={(e) => setSede(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="G12 Caracas - Convención Nacional" className="bg-slate-900">
                    Sede: G12 Caracas
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
                </select>
              </div>
            )}

            <button
              onClick={toggleUserRole}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                userRole === 'admin'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <span>{userRole === 'admin' ? '👑 Modo Organizador' : '🔐 Organizador'}</span>
            </button>
          </div>
        </div>

        {/* MENÚ DE NAVEGACIÓN (El Comprador solo ve Tienda y Billetera) */}
        <div className="max-w-6xl mx-auto px-4 pb-2.5 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => setActiveTab('checkout')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'checkout'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tienda
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'wallet'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Billetera
            </button>

            {/* ESTAS DOS PESTAÑAS SOLO APARECEN SI ENTRAS COMO ORGANIZADOR / ADMIN */}
            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('scanner')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'scanner'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                      : 'bg-slate-900/70 text-amber-300 hover:text-white border border-amber-500/30'
                  }`}
                >
                  Escáner Ujier
                </button>

                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                      : 'bg-slate-900/70 text-amber-300 hover:text-white border border-amber-500/30'
                  }`}
                >
                  Bóveda
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 pt-6">
        {/* ================================================================
            VISTA 1: TIENDA
        ================================================================ */}
        {activeTab === 'checkout' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Información del Evento y Selección */}
            <div className="lg:col-span-7 space-y-6">
              {/* Banner Principal */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-[#0F172A] to-emerald-950 p-6 sm:p-8 shadow-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
                  <span>🔥 INSCRIPCIONES ABIERTAS • ENTREGA INMEDIATA</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
                  {sede}
                </h1>
                <p className="text-slate-300 text-sm sm:text-base mb-6 max-w-xl">
                  Adquiere tu entrada oficial al instante o págala por partes con nuestro Pago Fraccionado, sin cargos ocultos ni demoras.
                </p>

                {/* Datos Clave + Tasa BCV en Vivo */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-400 block">Fecha</span>
                    <strong className="text-white">24-26 Nov 2026</strong>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Tasa BCV</span>
                      <button
                        onClick={fetchLiveBcvRate}
                        title="Refrescar tasa BCV"
                        className="text-emerald-400 hover:text-emerald-300 text-xs cursor-pointer"
                      >
                        {loadingBcv ? '⏳' : '🔄'}
                      </button>
                    </div>
                    <strong className="text-emerald-400">
                      Bs. {tasaBcv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                    <span className="block text-[10px] text-slate-400">{bcvUpdatedTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Aforo Disponible</span>
                    <strong className="text-amber-400">Últimos 142 cupos</strong>
                  </div>
                </div>
              </div>

              {/* Paso 1: Elegir Ubicación */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center justify-between">
                  <span>1. Elige tu Ubicación</span>
                  <span className="text-xs font-normal text-slate-400">Precios netos</span>
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
                      zone: 'Primera Fila + Acceso Especial',
                      badge: 'Exclusivo',
                    },
                  ].map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => {
                        setSelectedTier(tier);
                        setCentimoUnico(Number((Math.floor(Math.random() * 9) + 1) / 100));
                        setPaymentConceptCode(`EP-${Math.floor(100 + Math.random() * 900)}`);
                        setCheckoutStep('form');
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
                      <p className="text-[11px] text-slate-400">
                        Bs. {(tier.price * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paso 2: Modalidad de Pago y Datos */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">2. ¿Cómo deseas pagar tu entrada?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setPaymentMode('full');
                      setCheckoutStep('form');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
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
                      Recibes tu entrada QR de inmediato al verificar tu pago.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMode('fraccionado');
                      setCheckoutStep('form');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentMode === 'fraccionado'
                        ? 'bg-amber-500/10 border-amber-500'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">🐷 Pago Fraccionado</span>
                      <span className="text-xs font-bold text-amber-400">Reserva con $10</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Aparta tu cupo hoy con $10 y abona por partes. Tu QR se activa al completar el monto.
                    </p>
                  </button>
                </div>

                {/* Datos Básicos del Comprador */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nombre</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Tu nombre y apellido"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={buyerWhatsapp}
                      onChange={(e) => setBuyerWhatsapp(e.target.value)}
                      placeholder="0414-0000000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Cédula</label>
                    <input
                      type="text"
                      value={buyerCedula}
                      onChange={(e) => setBuyerCedula(e.target.value)}
                      placeholder="V-00000000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Datos de Pago, Botón Copiar y Subida de Comprobante */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl sticky top-28 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      VERIFICACIÓN RÁPIDA
                    </span>
                    <h3 className="text-xl font-black text-white">Datos para el Pago</h3>
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
                    { id: 'zelle', label: 'Zelle' },
                    { id: 'binance', label: 'Binance' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-white text-slate-950 border-white shadow'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Monto Exacto Calculado con BCV */}
                <div className="rounded-2xl bg-gradient-to-b from-emerald-950/60 to-slate-950 border-2 border-emerald-500/70 p-4 text-center">
                  <span className="text-[11px] uppercase tracking-widest font-bold text-emerald-300 block mb-1">
                    Transfiere exactamente este monto único
                  </span>
                  {paymentMethod === 'pagomovil' ? (
                    <>
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-1">
                        Bs. {exactBsToPay}
                      </div>
                      <p className="text-xs text-emerald-400 font-semibold">
                        Equivale a ${exactUsdToPay} USD (Calculado a tasa BCV Bs. {tasaBcv.toFixed(2)})
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-1">
                        ${exactUsdToPay} <span className="text-lg font-bold text-emerald-400">USD</span>
                      </div>
                      <p className="text-xs text-emerald-400 font-semibold">
                        Transfiere con los centavos exactos para identificar tu pago al instante
                      </p>
                    </>
                  )}
                </div>

                {/* Coordenadas Bancarias + Código de Concepto + Botón Copiar Datos */}
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 text-xs space-y-2.5">
                  {paymentMethod === 'pagomovil' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Banco:</span>
                        <strong className="text-white">0134 - Banesco</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Teléfono:</span>
                        <strong className="text-white">0414-1234567</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">RIF:</span>
                        <strong className="text-white">J-40928172-1</strong>
                      </div>
                    </>
                  )}
                  {paymentMethod === 'zelle' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Correo Zelle:</span>
                        <strong className="text-white">pagos@evenpase.com</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Titular:</span>
                        <strong className="text-white">Evenpase Oficial</strong>
                      </div>
                    </>
                  )}
                  {paymentMethod === 'binance' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Binance Pay ID:</span>
                        <strong className="text-white">294810492</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Moneda:</span>
                        <strong className="text-amber-400">USDT ({exactUsdToPay})</strong>
                      </div>
                    </>
                  )}

                  {/* CÓDIGO QUE LA PERSONA ESCRIBE EN EL CONCEPTO DEL PAGO */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-amber-300 font-semibold">Coloca este código en el concepto:</span>
                    <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {paymentConceptCode}
                    </span>
                  </div>

                  {/* BOTÓN PARA COPIAR TODOS LOS DATOS DE GOLPE */}
                  <button
                    onClick={handleCopyPaymentDetails}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{copiedData ? '✅ ¡Datos Copiados!' : '📋 Copiar Datos para hacer el Pago'}</span>
                  </button>
                </div>

                {/* FORMULARIO PARA SUBIR CAPTURA Y NÚMERO DE REFERENCIA */}
                {checkoutStep === 'form' && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      3. Reporta tu Comprobante de Pago
                    </h4>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Número de Referencia / Confirmación
                      </label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="Ej: Últimos 6 dígitos (849201)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Captura de Pantalla del Pago
                      </label>
                      <label className="flex flex-col items-center justify-center w-full p-3 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl bg-slate-950/60 cursor-pointer transition-all">
                        {receiptPreview ? (
                          <div className="flex items-center gap-3 w-full">
                            <img
                              src={receiptPreview}
                              alt="Capture"
                              className="w-12 h-12 object-cover rounded-xl border border-emerald-500"
                            />
                            <div className="text-left overflow-hidden">
                              <p className="text-xs font-bold text-emerald-400 truncate">
                                ✅ Captura cargada correctamente
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{receiptFileName}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <span className="text-xl block mb-1">📸</span>
                            <span className="text-xs font-bold text-slate-300">
                              Toca aquí para subir la foto del pago
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              Imagen desde tu teléfono o computadora
                            </span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <button
                      onClick={handleVerifyPayment}
                      disabled={isVerifyingPayment}
                      className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-emerald-500/20 cursor-pointer"
                    >
                      {isVerifyingPayment
                        ? '⏳ Verificando tu pago...'
                        : 'Verificar mi Pago y Obtener Entrada →'}
                    </button>
                  </div>
                )}

                {checkoutStep === 'approved' && (
                  <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500 p-4 text-center space-y-3">
                    <div className="text-2xl">🎉</div>
                    <h4 className="font-black text-emerald-400 text-base">
                      ¡PAGO VERIFICADO CON ÉXITO!
                    </h4>
                    <p className="text-xs text-slate-300">
                      Tu pago (Ref: #{referenceNumber}) fue confirmado y tu entrada ya está lista en tu Billetera.
                    </p>
                    <button
                      onClick={() => setActiveTab('wallet')}
                      className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Ir a Mi Billetera y ver mi QR →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            VISTA 2: BILLETERA
        ================================================================ */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Panel de Pago Fraccionado (Abonos) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  🐷 Pago Fraccionado
                </span>
                <span className="text-xs text-slate-400">Cupo Asegurado</span>
              </div>

              <h2 className="text-xl font-black text-white">Mis Abonos</h2>
              <p className="text-xs text-slate-400">
                Aquí puedes ver el avance de tu entrada si elegiste pagar por partes. Al llegar al 100%, tu código QR queda habilitado para entrar al evento.
              </p>

              {/* Barra de Progreso */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs text-slate-400 block">Total Abonado</span>
                    <span className="text-2xl font-black text-emerald-400">
                      ${fraccionadoPaid}.00 <span className="text-sm text-slate-500">/ ${fraccionadoTotal}.00</span>
                    </span>
                  </div>
                  <span className="text-lg font-black text-white">
                    {Math.round((fraccionadoPaid / fraccionadoTotal) * 100)}%
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, (fraccionadoPaid / fraccionadoTotal) * 100)}%` }}
                  />
                </div>

                {fraccionadoPaid < fraccionadoTotal ? (
                  <p className="text-xs text-amber-300 font-medium">
                    🔒 Te faltan ${fraccionadoTotal - fraccionadoPaid}.00 (Bs.{' '}
                    {((fraccionadoTotal - fraccionadoPaid) * tasaBcv).toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    ) para activar tu código QR.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-400 font-bold">
                    🔓 ¡Pago completado al 100%! Tu entrada QR está activa.
                  </p>
                )}
              </div>

              {/* Botones para registrar nuevo abono */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-400 block">
                  Realizar un nuevo abono a mi entrada:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddAbone(5)}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
                  >
                    + Abonar $5.00
                  </button>
                  <button
                    onClick={() => handleAddAbone(fraccionadoTotal)}
                    className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                  >
                    ⚡ Pagar el Restante
                  </button>
                </div>
                {userRole === 'admin' && (
                  <button
                    onClick={() => {
                      setFraccionadoPaid(10);
                      setFraccionadoTotal(25);
                    }}
                    className="w-full py-2 text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    [Reiniciar barra a $10 / $25 para demostración]
                  </button>
                )}
              </div>
            </div>

            {/* Boleto Digital con Código QR */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-[#0B1220] border-2 border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-slate-950 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-black/15 px-2 py-0.5 rounded">
                      ENTRADA OFICIAL
                    </span>
                    <h3 className="text-lg font-black mt-1">{activeTicket.event}</h3>
                  </div>
                  <div className="text-right font-mono text-xs font-bold">{activeTicket.id}</div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-xs border-b border-dashed border-slate-800 pb-4">
                    <div>
                      <span className="text-slate-400 block">Nombre</span>
                      <strong className="text-white text-sm">{activeTicket.holder}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Estado de la Entrada</span>
                      {activeTicket.used ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                          YA UTILIZADA ({activeTicket.usedAt})
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          ACTIVA PARA ENTRAR
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block">Ubicación</span>
                      <strong className="text-emerald-400">{activeTicket.tier}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Asiento</span>
                      <strong className="text-white">{activeTicket.seat}</strong>
                    </div>
                  </div>

                  {/* Código QR */}
                  <div className="text-center space-y-3">
                    {fraccionadoPaid < fraccionadoTotal ? (
                      <div className="py-12 px-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="text-4xl">🔒</div>
                        <h4 className="font-bold text-amber-300 text-sm">
                          Código QR Pendiente ({Math.round((fraccionadoPaid / fraccionadoTotal) * 100)}% abonado)
                        </h4>
                        <p className="text-xs text-slate-400">
                          Completa tus abonos en el panel izquierdo para desbloquear tu código QR de entrada.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-2xl inline-block shadow-xl">
                        <DynamicQR value={`${activeTicket.id}-${activeTicket.holder}-${activeTicket.code}`} />
                        <p className="text-[11px] font-mono font-bold text-slate-700 mt-2">
                          CÓDIGO: {activeTicket.code} • {activeTicket.id}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 flex items-center justify-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-300 font-medium">
                      Entrada guardada en tu teléfono (abre aunque no tengas señal)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            VISTA 3: ESCÁNER UJIER (SOLO VISIBLE PARA EL ORGANIZADOR)
        ================================================================ */}
        {activeTab === 'scanner' && userRole === 'admin' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                <span>📷 CONTROL DE PUERTA • UJIERES</span>
              </div>
              <h2 className="text-2xl font-black text-white">Escáner de Entradas</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Apunta con la cámara de cualquier teléfono al código QR del asistente para verificar su pase y evitar entradas repetidas.
              </p>

              {/* Visor de Cámara */}
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
                    <div className="text-5xl">📷</div>
                    <p className="text-xs text-slate-400">
                      Toca el botón de abajo para encender la cámara y escanear el código QR.
                    </p>
                  </div>
                )}

                <div className="absolute inset-8 border-2 border-emerald-400/50 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse" />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 cursor-pointer"
                >
                  {cameraActive ? 'Apagar Cámara' : '📷 Encender Cámara del Teléfono'}
                </button>
              </div>

              {/* Botones de Prueba de Escaneo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleSimulateScan('validTicket')}
                  className="py-4 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  ✅ Probar Entrada Válida (1ra vez)
                </button>
                <button
                  onClick={() => handleSimulateScan('fraudAttempt')}
                  className="py-4 px-4 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  🚨 Probar Entrada Repetida (2da vez)
                </button>
              </div>

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
                      Nombre: <strong>{scanResult.holder}</strong>
                    </span>
                    <span>
                      Ubicación: <strong>{scanResult.seat}</strong>
                    </span>
                  </div>
                </div>
              )}

              {activeTicket.used && (
                <button
                  onClick={() => {
                    setActiveTicket((prev) => ({ ...prev, used: false, usedAt: null }));
                    setScanResult(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Reiniciar entrada para volver a probar acceso válido
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            VISTA 4: BÓVEDA (SOLO VISIBLE PARA EL ORGANIZADOR)
        ================================================================ */}
        {activeTab === 'admin' && userRole === 'admin' && (
          <div className="space-y-6">
            {/* Resumen de Ventas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400">Total Recaudado (Hoy)</span>
                <p className="text-3xl font-black text-emerald-400 mt-1">$14,850.42</p>
                <span className="text-[11px] text-emerald-300">Pagos verificados automáticamente</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400">Tasa BCV Aplicada</span>
                <p className="text-3xl font-black text-white mt-1">Bs. {tasaBcv.toFixed(2)}</p>
                <span className="text-[11px] text-slate-400">Sincronizada con el Banco Central</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400">Pagos Fraccionados Activos</span>
                <p className="text-3xl font-black text-amber-400 mt-1">318</p>
                <span className="text-[11px] text-amber-300">Personas abonando su entrada</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400">Asistentes que ya entraron</span>
                <p className="text-3xl font-black text-teal-400 mt-1">842 / 1,000</p>
                <span className="text-[11px] text-slate-400">Escaneados en puerta</span>
              </div>
            </div>

            {/* Tabla de Pagos Recibidos */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-white">Bóveda de Pagos Recibidos</h3>
                  <p className="text-xs text-slate-400">
                    Registro de transferencias con su código de concepto, número de referencia y foto del comprobante.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-3 px-2">ID / Hora</th>
                      <th className="py-3 px-2">Comprador</th>
                      <th className="py-3 px-2">Método / Ref</th>
                      <th className="py-3 px-2">Código</th>
                      <th className="py-3 px-2">Monto Exacto</th>
                      <th className="py-3 px-2">Captura</th>
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
                          <span className="font-bold text-white block">{tx.buyer}</span>
                          <span className="text-xs text-slate-400">{tx.sender}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-bold text-slate-200 block">{tx.method}</span>
                          <span className="font-mono text-xs text-emerald-400">Ref: #{tx.reference}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
                            {tx.conceptCode}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-black text-emerald-400 text-sm">
                            ${tx.uniqueAmount.toFixed(2)}
                          </span>
                          <span className="block text-[11px] text-slate-400">{tx.bsAmount}</span>
                        </td>
                        <td className="py-3 px-2">
                          {tx.receiptUrl ? (
                            <button
                              onClick={() => setSelectedReceiptModal(tx.receiptUrl)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 cursor-pointer"
                            >
                              🖼️ Ver Foto
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">Verificado por Correo</span>
                          )}
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
    </div>
  );
}