// @ts-nocheck
export const SEDES_G12 = [
  { id: 'ccs', name: 'G12 Caracas - Sede Nacional', city: 'Caracas', capacity: 1200 },
  { id: 'bar', name: 'G12 Barinas - Centro de Convenciones', city: 'Barinas', capacity: 600 },
  { id: 'gua', name: 'G12 Guanare - Auditorio Principal', city: 'Guanare', capacity: 450 },
  { id: 'mar', name: 'G12 Maracaibo - Sede Zulia', city: 'Maracaibo', capacity: 800 },
  { id: 'val', name: 'G12 Valencia - Sede Carabobo', city: 'Valencia', capacity: 700 },
  { id: 'bqm', name: 'G12 Barquisimeto - Sede Lara', city: 'Barquisimeto', capacity: 650 },
  { id: 'bog', name: 'G12 Bogotá - Sede Internacional', city: 'Bogotá', capacity: 2500 },
];

export const ZONAS_EVENTO = [
  { id: 'vip', name: 'Zona VIP Ministerial', price: 25, rows: ['A', 'B', 'C'], cols: 8, badge: 'Más Vendido' },
  { id: 'gen', name: 'Zona General Numerada', price: 15, rows: ['D', 'E', 'F', 'G'], cols: 8, badge: 'Popular' },
  { id: 'pal', name: 'Palco Liderazgo Frontal', price: 50, rows: ['P1', 'P2'], cols: 6, badge: 'Exclusivo' },
];

export const INITIAL_OCCUPIED_SEATS: Record<string, string> = {
  'vip-A-3': 'María Gabriela Pérez',
  'vip-A-4': 'Pastor Carlos Méndez',
  'vip-B-2': 'Andrea Castellanos',
  'gen-D-5': 'José Gregorio Rivas',
  'pal-P1-1': 'Directiva Nacional',
};

export const INITIAL_PAYMENTS = [
  {
    id: 'PAG-9941',
    sede: 'G12 Caracas - Sede Nacional',
    buyer: 'Luis Castillo',
    whatsapp: '0414-5558921',
    cedula: 'V-17450921',
    method: 'Pago Móvil',
    reference: '849201',
    conceptCode: 'EP-842',
    zone: 'Zona VIP Ministerial',
    seat: 'Fila B - Silla 4',
    uniqueAmount: 25.04,
    bsAmount: 'Bs. 1.148,08',
    status: 'Verificado',
    time: 'Hace 2 min',
    receiptUrl: null,
  },
  {
    id: 'PAG-9940',
    sede: 'G12 Barinas - Centro de Convenciones',
    buyer: 'María Gabriela Pérez',
    whatsapp: '0412-9920144',
    cedula: 'V-20192831',
    method: 'Zelle',
    reference: '992014',
    conceptCode: 'EP-519',
    zone: 'Zona VIP Ministerial',
    seat: 'Fila A - Silla 3',
    uniqueAmount: 25.02,
    bsAmount: '$25.02 USD',
    status: 'Verificado',
    time: 'Hace 6 min',
    receiptUrl: null,
  },
];

export const playTone = (type: 'success' | 'error' | 'coin') => {
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
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(210, ctx.currentTime);
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch (e) {}
};