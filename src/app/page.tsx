// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import SeatMap from '@/components/SeatMap';
import {
  SEDES_G12,
  ZONAS_EVENTO,
  INITIAL_OCCUPIED_SEATS,
  INITIAL_PAYMENTS,
  playTone,
} from '@/lib/evenpaseData';

export default function BuyerPortal() {
  const [activeTab, setActiveTab] = useState<'tienda' | 'billetera'>('tienda');
  const [selectedSede, setSelectedSede] = useState(SEDES_G12[0].name);

  const [tasaBcv, setTasaBcv] = useState(45.85);
  const [loadingBcv, setLoadingBcv] = useState(false);

  const fetchBcv = async () => {
    setLoadingBcv(true);
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
      const data = await res.json();
      if (data?.promedio) setTasaBcv(Number(data.promedio));
    } catch (e) {}
    setLoadingBcv(false);
  };

  useEffect(() => {
    fetchBcv();
  }, []);

  const [selectedZone, setSelectedZone] = useState(ZONAS_EVENTO[0]);
  const [occupiedSeats, setOccupiedSeats] = useState(INITIAL_OCCUPIED_SEATS);
  const [selectedSeatKey, setSelectedSeatKey] = useState('vip-B-4');
  const [selectedSeatLabel, setSelectedSeatLabel] = useState('Fila B - Silla 4');

  const [paymentMode, setPaymentMode] = useState<'full' | 'fraccionado'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'pagomovil' | 'zelle' | 'binance'>('pagomovil');
  const [buyerName, setBuyerName] = useState('Luis Castillo');
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('0414-5558921');
  const [buyerCedula, setBuyerCedula] = useState('V-17450921');

  const [centimoUnico, setCentimoUnico] = useState(0.04);
  const [conceptCode, setConceptCode] = useState('EP-842');
  const [copied, setCopied] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [paidAmount, setPaidAmount] = useState(25);
  const [totalAmount, setTotalAmount] = useState(25);
  const [ticket, setTicket] = useState({
    id: 'EVN-8842',
    holder: 'Luis Castillo',
    sede: SEDES_G12[0].name,
    zone: 'Zona VIP Ministerial',
    seat: 'Fila B - Silla 4',
    code: 'EP-842',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const savedSeats = localStorage.getItem('evenpase_seats');
    if (savedSeats) setOccupiedSeats(JSON.parse(savedSeats));
  }, []);

  const baseUsd = paymentMode === 'full' ? selectedZone.price : 10;
  const exactUsd = (baseUsd + centimoUnico).toFixed(2);
  const exactBs = ((baseUsd + centimoUnico) * tasaBcv).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleCopyDatos = () => {
    const text =
      paymentMethod === 'pagomovil'
        ? `PAGO MÓVIL EVENPASE\nBanco: 0134 Banesco\nTel: 0414-1234567\nRIF: J-40928172-1\nMonto Exacto: Bs. ${exactBs}\nConcepto: ${conceptCode}`
        : paymentMethod === 'zelle'
        ? `ZELLE EVENPASE\nCorreo: pagos@evenpase.com\nMonto Exacto: $${exactUsd} USD\nConcepto: ${conceptCode}`
        : `BINANCE PAY EVENPASE\nID: 294810492\nMonto Exacto: ${exactUsd} USDT\nConcepto: ${conceptCode}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    showToast('¡Datos bancarios copiados al portapapeles!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      const reader = new FileReader();
      reader.onload = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPurchase = () => {
    if (!referenceNumber.trim()) {
      showToast('Por favor escribe los dígitos de referencia de tu pago.');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      playTone('coin');

      const newTicketId = `EVN-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTicket = {
        id: newTicketId,
        holder: buyerName,
        sede: selectedSede,
        zone: selectedZone.name,
        seat: selectedSeatLabel,
        code: conceptCode,
      };
      setTicket(newTicket);

      if (paymentMode === 'fraccionado') {
        setTotalAmount(selectedZone.price);
        setPaidAmount(10);
      } else {
        setTotalAmount(selectedZone.price);
        setPaidAmount(selectedZone.price);
      }

      const updatedSeats = { ...occupiedSeats, [selectedSeatKey]: buyerName };
      setOccupiedSeats(updatedSeats);
      localStorage.setItem('evenpase_seats', JSON.stringify(updatedSeats));

      const existingPayments = JSON.parse(
        localStorage.getItem('evenpase_payments') || JSON.stringify(INITIAL_PAYMENTS)
      );
      const newPayment = {
        id: `PAG-${Math.floor(1000 + Math.random() * 9000)}`,
        sede: selectedSede,
        buyer: buyerName,
        whatsapp: buyerWhatsapp,
        cedula: buyerCedula,
        method: paymentMethod === 'pagomovil' ? 'Pago Móvil' : paymentMethod === 'zelle' ? 'Zelle' : 'Binance',
        reference: referenceNumber,
        conceptCode,
        zone: selectedZone.name,
        seat: selectedSeatLabel,
        uniqueAmount: parseFloat(exactUsd),
        bsAmount: paymentMethod === 'pagomovil' ? `Bs. ${exactBs}` : `$${exactUsd} USD`,
        status: paymentMode === 'full' ? 'Verificado' : 'Abono Fraccionado',
        time: 'Justo ahora',
        receiptUrl: receiptPreview,
      };
      localStorage.setItem('evenpase_payments', JSON.stringify([newPayment, ...existingPayments]));

      setCheckoutDone(true);
      showToast(`¡Pago verificado! Silla asignada: ${selectedSeatLabel}`);
    }, 1200);
  };

  const qrPayload = `EVENPASE|${ticket.id}|${ticket.holder}|${ticket.zone}|${ticket.seat}|${ticket.sede}|${ticket.code}`;
  const realQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    qrPayload
  )}`;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans pb-16">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
          <span>✅</span>
          <span className="text-xs sm:text-sm">{toast}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#070B14]/90 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-black text-slate-950 text-lg">
              EP
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg text-white block leading-none">
                EVENPASE
              </span>
              <span className="text-xs text-slate-400">Boletería Oficial de Eventos</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tienda')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'tienda'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tienda
            </button>
            <button
              onClick={() => setActiveTab('billetera')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'billetera'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Billetera
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6">
        {activeTab === 'tienda' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-[#0F172A] to-emerald-950 p-6 space-y-4 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    🔥 INSCRIPCIONES ABIERTAS
                  </span>
                  <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-1.5">
                    <span className="text-xs text-slate-400">Iglesia / Sede:</span>
                    <select
                      value={selectedSede}
                      onChange={(e) => setSelectedSede(e.target.value)}
                      className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
                    >
                      {SEDES_G12.map((s) => (
                        <option key={s.id} value={s.name} className="bg-slate-900 text-white">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white">{selectedSede}</h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Elige tu zona, selecciona tu silla exacta en el mapa del auditorio y recibe tu entrada QR al instante.
                </p>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 block">Fecha</span>
                    <strong className="text-white">24-26 Nov 2026</strong>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Tasa BCV</span>
                      <button onClick={fetchBcv} className="text-emerald-400 cursor-pointer">
                        {loadingBcv ? '⏳' : '🔄'}
                      </button>
                    </div>
                    <strong className="text-emerald-400">Bs. {tasaBcv.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tu Silla</span>
                    <strong className="text-amber-400">{selectedSeatLabel}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-white">1. Elige tu Zona</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ZONAS_EVENTO.map((z) => (
                    <div
                      key={z.id}
                      onClick={() => {
                        setSelectedZone(z);
                        const firstFreeSeat = `${z.id}-${z.rows[0]}-1`;
                        setSelectedSeatKey(firstFreeSeat);
                        setSelectedSeatLabel(`Fila ${z.rows[0]} - Silla 1`);
                        setCentimoUnico(Number((Math.floor(Math.random() * 9) + 1) / 100));
                        setConceptCode(`EP-${Math.floor(100 + Math.random() * 900)}`);
                        setCheckoutDone(false);
                      }}
                      className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                        selectedZone.id === z.id
                          ? 'bg-emerald-500/10 border-emerald-500'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                        {z.badge}
                      </span>
                      <h3 className="font-bold text-white mt-2 text-sm">{z.name}</h3>
                      <p className="text-2xl font-black text-emerald-400 mt-2">${z.price}</p>
                      <p className="text-[11px] text-slate-400">
                        Bs. {(z.price * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      2. Selecciona tu Silla en el Auditorio:
                    </span>
                    <span className="text-xs font-bold text-emerald-400">{selectedSeatLabel}</span>
                  </div>
                  <SeatMap
                    zone={selectedZone}
                    occupiedSeats={occupiedSeats}
                    selectedSeatKey={selectedSeatKey}
                    onSelectSeat={(key, label) => {
                      setSelectedSeatKey(key);
                      setSelectedSeatLabel(label);
                    }}
                  />
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  3. Modalidad de Pago y Datos Personales
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('full')}
                    className={`p-4 rounded-2xl border text-left cursor-pointer ${
                      paymentMode === 'full'
                        ? 'bg-emerald-500/10 border-emerald-500'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between font-bold text-sm">
                      <span className="text-white">⚡ Pago de Contado</span>
                      <span className="text-emerald-400">${selectedZone.price}.00</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Desbloquea tu entrada QR inmediatamente.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('fraccionado')}
                    className={`p-4 rounded-2xl border text-left cursor-pointer ${
                      paymentMode === 'fraccionado'
                        ? 'bg-amber-500/10 border-amber-500'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between font-bold text-sm">
                      <span className="text-amber-300">🐷 Pago Fraccionado</span>
                      <span className="text-amber-400">Reserva con $10</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Congela tu silla hoy con $10 y abona por partes.
                    </p>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nombre</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={buyerWhatsapp}
                      onChange={(e) => setBuyerWhatsapp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Cédula</label>
                    <input
                      type="text"
                      value={buyerCedula}
                      onChange={(e) => setBuyerCedula(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sticky top-24 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase">
                      {selectedZone.name} • {selectedSeatLabel}
                    </span>
                    <h3 className="text-lg font-black text-white">Datos para el Pago</h3>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pagomovil', label: 'Pago Móvil' },
                    { id: 'zelle', label: 'Zelle' },
                    { id: 'binance', label: 'Binance' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-white text-slate-950 border-white'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl bg-slate-950 border-2 border-emerald-500/70 p-4 text-center">
                  <span className="text-[11px] uppercase font-bold text-emerald-300 block">
                    Transfiere exactamente este monto único
                  </span>
                  {paymentMethod === 'pagomovil' ? (
                    <>
                      <div className="text-3xl font-black text-white my-1">Bs. {exactBs}</div>
                      <p className="text-xs text-emerald-400">
                        Equivale a ${exactUsd} USD (Tasa BCV Bs. {tasaBcv.toFixed(2)})
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-black text-white my-1">${exactUsd} USD</div>
                      <p className="text-xs text-emerald-400">
                        Monto exacto con centavos verificadores
                      </p>
                    </>
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                  {paymentMethod === 'pagomovil' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Banco:</span>
                        <strong className="text-white">0134 - Banesco</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Teléfono / RIF:</span>
                        <strong className="text-white">0414-1234567 • J-40928172-1</strong>
                      </div>
                    </>
                  )}
                  {paymentMethod === 'zelle' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Correo Zelle:</span>
                      <strong className="text-white">pagos@evenpase.com</strong>
                    </div>
                  )}
                  {paymentMethod === 'binance' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Binance Pay ID:</span>
                      <strong className="text-white">294810492</strong>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-amber-300 font-semibold">Código en concepto:</span>
                    <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {conceptCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyDatos}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs cursor-pointer"
                  >
                    {copied ? '✅ ¡Datos Copiados!' : '📋 Copiar Datos para hacer el Pago'}
                  </button>
                </div>

                {!checkoutDone ? (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Número de Referencia del Pago
                      </label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="Ej: 849201"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Captura de Pantalla del Pago
                      </label>
                      <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl bg-slate-950/60 cursor-pointer">
                        {receiptPreview ? (
                          <div className="flex items-center gap-3 w-full">
                            <img
                              src={receiptPreview}
                              alt="Comprobante"
                              className="w-11 h-11 object-cover rounded-lg border border-emerald-500"
                            />
                            <div className="text-left overflow-hidden">
                              <p className="text-xs font-bold text-emerald-400">✅ Captura lista</p>
                              <p className="text-[10px] text-slate-400 truncate">{receiptName}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-300 py-1">
                            📸 Toca aquí para subir la captura del pago
                          </span>
                        )}
                        <input type="file" accept="image/*" onChange={handleReceiptChange} className="hidden" />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmPurchase}
                      disabled={isVerifying}
                      className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      {isVerifying ? '⏳ Verificando Pago...' : 'Verificar Pago y Generar Boleto →'}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500 p-4 text-center space-y-3">
                    <h4 className="font-black text-emerald-400 text-base">
                      🎉 ¡BOLETO ASIGNADO CON ÉXITO!
                    </h4>
                    <p className="text-xs text-slate-300">
                      Tu silla <strong>{selectedSeatLabel}</strong> en <strong>{selectedZone.name}</strong> ya está lista en tu Billetera.
                    </p>
                    <button
                      onClick={() => setActiveTab('billetera')}
                      className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase cursor-pointer"
                    >
                      Ver Mi Boleto QR en Billetera →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billetera' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                🐷 Pago Fraccionado
              </span>
              <h2 className="text-xl font-black text-white">Estado de Mis Abonos</h2>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-black text-emerald-400">
                    ${paidAmount}.00 <span className="text-sm text-slate-500">/ ${totalAmount}.00</span>
                  </span>
                  <span className="font-black text-white">
                    {Math.round((paidAmount / totalAmount) * 100)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, (paidAmount / totalAmount) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    playTone('coin');
                    setPaidAmount((p) => Math.min(totalAmount, p + 5));
                  }}
                  className="py-3 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer"
                >
                  + Abonar $5.00
                </button>
                <button
                  onClick={() => {
                    playTone('coin');
                    setPaidAmount(totalAmount);
                  }}
                  className="py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer"
                >
                  ⚡ Completar 100%
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-md bg-slate-900 border-2 border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-slate-950 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase bg-black/15 px-2 py-0.5 rounded">
                      BOLETO OFICIAL EVENPASE
                    </span>
                    <h3 className="text-base font-black mt-1">{ticket.sede}</h3>
                  </div>
                  <span className="font-mono text-xs font-black">{ticket.id}</span>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-xs border-b border-dashed border-slate-800 pb-4">
                    <div>
                      <span className="text-slate-400 block">Asistente</span>
                      <strong className="text-white text-sm">{ticket.holder}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Código</span>
                      <strong className="text-emerald-400 font-mono text-sm">{ticket.code}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Zona</span>
                      <strong className="text-white">{ticket.zone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Silla Exacta</span>
                      <strong className="text-amber-400 text-sm">{ticket.seat}</strong>
                    </div>
                  </div>

                  <div className="text-center">
                    {paidAmount < totalAmount ? (
                      <div className="py-10 px-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="text-3xl">🔒</div>
                        <p className="text-xs text-amber-300 font-bold">
                          Completa el 100% de tu pago fraccionado para mostrar tu código QR.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-2xl inline-block shadow-xl">
                        <img
                          src={realQrUrl}
                          alt="QR Oficial"
                          className="w-52 h-52 mx-auto rounded-lg"
                        />
                        <p className="text-[11px] font-mono font-bold text-slate-800 mt-2">
                          {ticket.id} • {ticket.seat}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}