// @ts-nocheck
'use client';
import React from 'react';

export default function SeatMap({
  zone,
  occupiedSeats,
  selectedSeatKey,
  onSelectSeat,
  readOnly = false,
}) {
  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-4">
      <div className="w-full py-2 rounded-xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 text-center">
        <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
          🎤 ESCENARIO / TARIMA PRINCIPAL ({zone.name})
        </span>
      </div>

      <div className="space-y-2.5 overflow-x-auto py-2">
        {zone.rows.map((row) => (
          <div key={row} className="flex items-center justify-center gap-1.5 min-w-max">
            <span className="w-8 text-xs font-mono font-bold text-slate-400 text-right pr-2">
              {row}
            </span>
            {Array.from({ length: zone.cols }).map((_, idx) => {
              const seatNum = idx + 1;
              const seatKey = `${zone.id}-${row}-${seatNum}`;
              const occupiedBy = occupiedSeats[seatKey];
              const isSelected = selectedSeatKey === seatKey;

              return (
                <button
                  key={seatKey}
                  type="button"
                  disabled={!readOnly && Boolean(occupiedBy)}
                  onClick={() => onSelectSeat && onSelectSeat(seatKey, `Fila ${row} - Silla ${seatNum}`, occupiedBy)}
                  title={occupiedBy ? `Ocupada por: ${occupiedBy}` : `Fila ${row} - Silla ${seatNum}`}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center border ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/30 scale-105 cursor-pointer'
                      : occupiedBy
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 cursor-not-allowed'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-emerald-400 hover:text-white cursor-pointer'
                  }`}
                >
                  {seatNum}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-900 border border-slate-700 inline-block" />
          <span className="text-slate-400">Libre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
          <span className="text-emerald-400 font-bold">Tu Silla Elegida</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50 inline-block" />
          <span className="text-red-400">Ocupada</span>
        </div>
      </div>
    </div>
  );
}