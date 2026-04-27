export interface VehicleModel {
  name: string;
  popularInMongolia?: boolean;
}

export interface VehicleBrand {
  name: string;
  country: string;
  popularInMongolia?: boolean;
  models: string[];
}

// ── Brand → Models ─────────────────────────────────────────────
export const VEHICLE_CATALOG: VehicleBrand[] = [
  {
    name: 'Toyota',
    country: 'Япон',
    popularInMongolia: true,
    models: [
      'Land Cruiser', 'Land Cruiser Prado', 'Alphard', 'Vellfire',
      'Camry', 'Crown', 'Avalon', 'Prius', 'Aqua',
      'RAV4', 'Fortuner', 'Hilux Surf', 'Rush',
      'Corolla', 'Corolla Cross', 'Yaris', 'Vios',
      'HiAce', 'HiLux', 'Wish', 'Estima', 'Noah',
      'Kluger', '4Runner', 'Sequoia', 'Tundra',
    ],
  },
  {
    name: 'Lexus',
    country: 'Япон',
    popularInMongolia: true,
    models: [
      'LX 570', 'LX 600', 'GX 460', 'GX 470',
      'RX 350', 'RX 450h', 'RX 500h',
      'NX 200', 'NX 350', 'UX 200',
      'ES 250', 'ES 300h', 'ES 350',
      'IS 250', 'IS 350', 'LS 460', 'LS 500',
    ],
  },
  {
    name: 'Nissan',
    country: 'Япон',
    popularInMongolia: true,
    models: [
      'Patrol', 'Patrol Safari', 'X-Trail', 'Murano',
      'Qashqai', 'Juke', 'Terra',
      'Teana', 'Altima', 'Maxima',
      'Note', 'Tiida', 'Sentra', 'Sunny',
      'Navara', 'Elgrand', 'Serena',
      'Skyline', 'GT-R',
    ],
  },
  {
    name: 'Honda',
    country: 'Япон',
    popularInMongolia: true,
    models: [
      // ✅ FIX: 'Passport' давхар байсныг нэг болгов
      'CR-V', 'HR-V', 'Pilot', 'Passport',
      'Accord', 'Civic', 'City', 'Jazz / Fit',
      'Odyssey', 'Step Wagon', 'Freed', 'Stream',
      'Vezel', 'ZR-V', 'WR-V',
      'Ridgeline',
    ],
  },
  {
    name: 'Hyundai',
    country: 'Солонгос',
    popularInMongolia: true,
    models: [
      'Santa Fe', 'Tucson', 'Creta', 'Palisade', 'Venue',
      'Sonata', 'Elantra', 'Azera / Grandeur',
      'Starex / H-1', 'County',
      'Ioniq 5', 'Ioniq 6', 'Kona',
      'Porter', 'Mighty',
    ],
  },
  {
    name: 'Kia',
    country: 'Солонгос',
    popularInMongolia: true,
    models: [
      'Sorento', 'Sportage', 'Mohave', 'Carnival',
      'Telluride', 'Seltos', 'Stonic', 'Niro',
      'K5 (Optima)', 'K7 (Cadenza)', 'K8', 'K9 (Quoris)',
      'Stinger', 'EV6',
      'Bongo 3',
    ],
  },
  {
    name: 'Subaru',
    country: 'Япон',
    popularInMongolia: true,
    models: [
      'Forester', 'Outback', 'XV / Crosstrek',
      'Legacy', 'Impreza', 'WRX / STI',
      'Levorg', 'Exiga',
      'BRZ', 'Solterra',
    ],
  },
  {
    name: 'Mitsubishi',
    country: 'Япон',
    popularInMongolia: true,
    models: [
      'Pajero', 'Pajero Sport', 'Pajero Mini',
      'Outlander', 'Eclipse Cross', 'ASX',
      'Galant', 'Lancer', 'Colt',
      'Delica', 'L200 (Triton)',
      'Carisma', 'Sigma',
    ],
  },
  {
    name: 'BMW',
    country: 'Герман',
    models: [
      'X5', 'X6', 'X7', 'X3', 'X4', 'X1', 'X2',
      '7 Series', '5 Series', '3 Series', '1 Series',
      '6 Series', '4 Series', '2 Series',
      'iX', 'i7', 'i4', 'i3',
      'M3', 'M5', 'M8',
    ],
  },
  {
    name: 'Mercedes-Benz',
    country: 'Герман',
    models: [
      'GLS', 'GLE', 'GLC', 'GLB', 'GLA', 'G-Class',
      'S-Class', 'E-Class', 'C-Class', 'A-Class', 'B-Class',
      'CLA', 'CLS',
      'EQS', 'EQE', 'EQC', 'EQB',
      'AMG GT', 'SL', 'SLC',
      'Sprinter', 'Viano / Vito',
    ],
  },
  {
    name: 'Audi',
    country: 'Герман',
    models: [
      'Q7', 'Q8', 'Q5', 'Q3', 'Q2', 'e-tron',
      'A8', 'A7', 'A6', 'A5', 'A4', 'A3',
      'RS6', 'RS7', 'RS Q8',
      'TT', 'R8',
    ],
  },
  {
    name: 'Volkswagen',
    country: 'Герман',
    models: [
      'Touareg', 'Tiguan', 'T-Roc', 'ID.4',
      'Passat', 'Arteon',
      'Golf', 'Jetta', 'Polo', 'T-Cross',
      'Transporter', 'Multivan',
    ],
  },
  {
    name: 'Land Rover',
    country: 'Британи',
    models: [
      'Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque',
      'Discovery', 'Discovery Sport',
      'Defender 90', 'Defender 110', 'Defender 130',
    ],
  },
  {
    name: 'Ford',
    country: 'АНУ',
    models: [
      'Explorer', 'Expedition', 'Bronco', 'Edge', 'Escape / Kuga',
      'F-150', 'F-250', 'Ranger', 'Maverick',
      'Everest', 'Territory',
      'Mondeo', 'Fusion', 'Focus', 'Fiesta',
      'Mustang', 'Mustang Mach-E',
    ],
  },
  {
    name: 'Mazda',
    country: 'Япон',
    models: [
      'CX-90', 'CX-60', 'CX-5', 'CX-30', 'CX-3',
      'Mazda6 / Atenza', 'Mazda3 / Axela',
      'MX-5 Miata', 'MX-30',
      'BT-50',
    ],
  },
  {
    name: 'UAZ',
    country: 'Орос',
    popularInMongolia: true,
    models: [
      'Patriot', 'Hunter', 'Буханка (452)', '469 / 3151',
      'Pickup 2360', 'Cargo',
    ],
  },
  {
    name: 'Lada (ВАЗ)',
    country: 'Орос',
    popularInMongolia: true,
    models: [
      'Niva 4x4', 'Niva Travel', 'Niva Legend',
      'Granta', 'Vesta', 'XRAY',
      '2107', '2106', '2105',
    ],
  },
  {
    name: 'Jeep',
    country: 'АНУ',
    models: [
      'Grand Cherokee', 'Grand Wagoneer', 'Wrangler',
      'Commander', 'Compass', 'Renegade',
      'Gladiator',
    ],
  },
  {
    name: 'Chevrolet',
    country: 'АНУ',
    models: [
      'Tahoe', 'Suburban', 'Traverse', 'Equinox', 'Trailblazer',
      'Silverado', 'Colorado',
      'Malibu', 'Cruze', 'Spark',
      'Camaro', 'Corvette',
    ],
  },
  {
    name: 'Porsche',
    country: 'Герман',
    models: [
      'Cayenne', 'Macan', 'Cayenne Coupe',
      '911', '718', 'Panamera',
      'Taycan', 'Taycan Cross Turismo',
    ],
  },
  {
    name: 'Volvo',
    country: 'Швед',
    models: [
      'XC90', 'XC60', 'XC40', 'C40',
      'S90', 'V90', 'S60', 'V60',
    ],
  },
  {
    name: 'Peugeot',
    country: 'Франц',
    models: ['3008', '5008', '508', '408', '208', '2008'],
  },
  {
    name: 'BYD',
    country: 'Хятад',
    models: ['Atto 3', 'Han', 'Tang', 'Song Plus', 'Seal', 'Dolphin', 'Seal U'],
  },
  {
    name: 'Great Wall / Haval',
    country: 'Хятад',
    popularInMongolia: true,
    models: [
      'H9', 'H6', 'H5', 'H2', 'Jolion',
      'Poer (Pickup)', 'Cannon', 'WEY VV7',
    ],
  },
  {
    name: 'Chery',
    country: 'Хятад',
    models: ['Tiggo 8 Pro', 'Tiggo 7 Pro', 'Tiggo 4 Pro', 'Arrizo 8', 'Arrizo 6'],
  },
  {
    name: 'Geely',
    country: 'Хятад',
    models: ['Coolray', 'Atlas', 'Emgrand', 'Tugella', 'Monjaro'],
  },
];

// ── Colors ─────────────────────────────────────────────────────
export const VEHICLE_COLORS = [
  { name: 'Цагаан',    nameEn: 'White',        hex: '#FFFFFF', darkText: false },
  { name: 'Хар',       nameEn: 'Black',        hex: '#1A1A1A', darkText: true  },
  { name: 'Мөнгөлөг',  nameEn: 'Silver',       hex: '#C0C0C0', darkText: false },
  { name: 'Саарал',    nameEn: 'Gray',          hex: '#808080', darkText: true  },
  { name: 'Цэнхэр',    nameEn: 'Blue',          hex: '#1A56DB', darkText: true  },
  { name: 'Улаан',     nameEn: 'Red',           hex: '#E02424', darkText: true  },
  { name: 'Ногоон',    nameEn: 'Green',         hex: '#0E9F6E', darkText: true  },
  { name: 'Шар',       nameEn: 'Yellow',        hex: '#F59E0B', darkText: false },
  { name: 'Хүрэн',     nameEn: 'Brown',         hex: '#78350F', darkText: true  },
  { name: 'Бор',       nameEn: 'Beige / Cream', hex: '#F5F0DC', darkText: false },
  { name: 'Улбар шар', nameEn: 'Orange',        hex: '#EA580C', darkText: true  },
  { name: 'Ягаан',     nameEn: 'Purple',        hex: '#7C3AED', darkText: true  },
  { name: 'Шампань',   nameEn: 'Champagne',     hex: '#F7E7CE', darkText: false },
  { name: 'Нил ягаан', nameEn: 'Navy',          hex: '#1E3A5F', darkText: true  },
];

// ── Year range ─────────────────────────────────────────────────
export function getYearRange(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1990; y--) {
    years.push(y);
  }
  return years;
}

// ── Helper: popular brands first ────────────────────────────────
export function getBrandsPopularFirst(): VehicleBrand[] {
  return [...VEHICLE_CATALOG].sort((a, b) => {
    if (a.popularInMongolia && !b.popularInMongolia) return -1;
    if (!a.popularInMongolia && b.popularInMongolia) return 1;
    return a.name.localeCompare(b.name);
  });
}