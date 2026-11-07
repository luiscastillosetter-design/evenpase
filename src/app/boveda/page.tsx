// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import SeatMap from '@/components/SeatMap';
import {
  SEDES_G12,
  ZONAS_EVENTO,
  INITIAL_OCCUPIED_SEATS,
  INITIAL_PAYMENTS,
} from '@/lib/evenpaseData';

export default function BovedaOrganizerPortal() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [selectedSedeFilter, setSelectedSedeFilter] = useState('TODAS');
  const [password, setPassword] = useState('admin123');
  const [subTab, setSubTab] = useState<'pagos' | 'mapa' | 'sedes'>('pagos');

  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  const [occupiedSeats, setOccupiedSeats] = useState(INITIAL_OCCUPIED_SEATS);
  const [selectedZoneMap, setSelectedZoneMap] = useState(ZONAS_EVENTO[0]);
  const [inspectedSeatInfo, setInspectedSeatInfo] = useState<string | null>(null);
  const [receiptModal, setReceiptModal] = useState<string | null>(null);

  useEffect(() => {
    const savedPay = localStorage.getItem('evenpase_payments');
    if (savedPay) setPayments(JSON.parse(savedPay));
    const savedSeats = localStorage.getItem('evenpase_seats');
    if (savedSeats) setOccupiedSeats(JSON.parse(savedSeats));
  }, [loggedIn, subTab]);

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center">
              BV
            </div>
            <div>
              <h1 className="font-black text-lg">Bóveda & Panel Organizador</h1>
              <p className="text-xs text-slate-400">Administración Multi-Sede G12 (200 Iglesias)</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Alcance de Sede</label>
              <select
                value={selectedSedeFilter}
                onChange={(e) => setSelectedSedeFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white"
              >
                <option value="TODAS">🌎 Consolidado Nacional (Todas las Sedes G12)</option>
                {SEDES_G12.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Clave de Directiva / Tesorería</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white font-mono"
              />
            </div>

            <button
              onClick={() => setLoggedIn(true)}
              className="w-full py-4 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              Abrir Bóveda y Control de Evento →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredPayments =
    selectedSedeFilter === 'TODAS'
      ? payments
      : payments.filter((p) => p.sede === selectedSedeFilter);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 pb-16">
      {receiptModal && (
        <div
          onClick={() => setReceiptModal(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full space-y-4"
          >
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm">Captura de Pago</h4>
              <button
                onClick={() => setReceiptModal(null)}
                className="text-xs bg-slate-800 px-3 py-1 rounded-lg"
              >
                Cerrar ✕
              </button>
            </div>
            <img
              src={receiptModal}
              alt="Comprobante"
              className="w-full max-h-96 object-contain rounded-2xl bg-slate-950"
            />
          </div>
        </div>
      )}

      <header className="border-b border-slate-800 bg-[#070B14]/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center">
              BV
            </div>
            <div>
              <h1 className="font-black text-base text-white">BÓVEDA EVENPASE</h1>
              <p className="text-xs text-slate-400">Panel Exclusivo del Organizador</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSedeFilter}
              onChange={(e) => setSelectedSedeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-300"
            >
              <option value="TODAS">🌎 Todas las Sedes G12 (200 Iglesias)</option>
              {SEDES_G12.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setLoggedIn(false)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-2.5 flex gap-2">
          <button
            onClick={() => setSubTab('pagos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              subTab === 'pagos' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            💰 Pagos y Capturas
          </button>
          <button
            onClick={() => setSubTab('mapa')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              subTab === 'mapa' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            🪑 Mapa de Sillas y Zonas
          </button>
          <button
            onClick={() => setSubTab('sedes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              subTab === 'sedes' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            🏛️ Red de 200 Iglesias G12
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {subTab === 'pagos' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400">Recaudación Verificada</span>
                <p className="text-3xl font-black text-emerald-400 mt-1">$14,850.42</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400">Sillas Asignadas</span>
                <p className="text-3xl font-black text-white mt-1">842</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400">Pagos Fraccionados</span>
                <p className="text-3xl font-black text-amber-400 mt-1">318</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400">Iglesias G12 Conectadas</span>
                <p className="text-3xl font-black text-teal-400 mt-1">200 Sedes</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-black text-white">Bóveda de Pagos y Sillas Asignadas</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-3 px-2">Sede</th>
                      <th className="py-3 px-2">Comprador</th>
                      <th className="py-3 px-2">Zona y Silla</th>
                      <th className="py-3 px-2">Método / Ref</th>
                      <th className="py-3 px-2">Monto</th>
                      <th className="py-3 px-2">Captura</th>
                      <th className="py-3 px-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPayments.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-3 px-2 text-xs text-slate-300 font-semibold">{tx.sede}</td>
                        <td className="py-3 px-2">
                          <strong className="text-white block">{tx.buyer}</strong>
                          <span className="text-xs text-slate-400">{tx.whatsapp}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-emerald-400 font-bold block">{tx.zone}</span>
                          <span className="text-xs text-amber-300 font-semibold">{tx.seat}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-white block">{tx.method}</span>
                          <span className="font-mono text-xs text-slate-400">
                            Ref: #{tx.reference} ({tx.conceptCode})
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <strong className="text-emerald-400">${tx.uniqueAmount.toFixed(2)}</strong>
                          <span className="block text-[11px] text-slate-400">{tx.bsAmount}</span>
                        </td>
                        <td className="py-3 px-2">
                          {tx.receiptUrl ? (
                            <button
                              onClick={() => setReceiptModal(tx.receiptUrl)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 font-bold text-xs cursor-pointer"
                            >
                              🖼️ Ver Captura
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">Automático</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[11px]">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {subTab === 'mapa' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white">
                  Mapa de Ocupación del Auditorio por Zona y Silla
                </h3>
                <p className="text-xs text-slate-400">
                  Haz clic en cualquier silla ocupada (roja) para ver el nombre del asistente sentado allí.
                </p>
              </div>
              <div className="flex gap-2">
                {ZONAS_EVENTO.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setSelectedZoneMap(z)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      selectedZoneMap.id === z.id
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {z.name}
                  </button>
                ))}
              </div>
            </div>

            {inspectedSeatInfo && (
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 text-xs text-amber-300 font-bold">
                🪑 {inspectedSeatInfo}
              </div>
            )}

            <SeatMap
              zone={selectedZoneMap}
              occupiedSeats={occupiedSeats}
              selectedSeatKey={null}
              readOnly={true}
              onSelectSeat={(key, label, holder) => {
                setInspectedSeatInfo(
                  holder
                    ? `${label} (${selectedZoneMap.name}) — Asignada a: ${holder}`
                    : `${label} (${selectedZoneMap.name}) — Silla Libre`
                );
              }}
            />
          </div>
        )}

        {subTab === 'sedes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SEDES_G12.map((s) => (
              <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                  Sede Activa • {s.city}
                </span>
                <h4 className="font-bold text-white text-base">{s.name}</h4>
                <p className="text-xs text-slate-400">Capacidad Auditorio: {s.capacity} sillas numeradas</p>
                <button
                  onClick={() => {
                    setSelectedSedeFilter(s.name);
                    setSubTab('pagos');
                  }}
                  className="text-xs text-amber-400 font-bold hover:underline pt-2 block cursor-pointer"
                >
                  Ver Bóveda de esta Sede →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}