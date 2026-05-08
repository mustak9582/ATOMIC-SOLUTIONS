import { Service } from './types';

export const CORE_SERVICES: Service[] = [
  {
    id: 'hvac',
    name: 'HVAC (Heating, Ventilation & AC)',
    category: 'Comfort',
    images: ['https://images.unsplash.com/photo-1599839619722-39751411883e?auto=format&fit=crop&q=80&w=800'],
    youtubeId: 'M7lc1UVf-VE',
    detailedDescription: '<p>Comprehensive HVAC solutions for residential and commercial spaces.</p>',
    subCategories: [
      { id: 'hvac-split-inst', name: 'Split AC Installation', minPrice: 1500, maxPrice: 5000, labourMin: 1200, labourMax: 1500, materialMin: 3500, materialMax: 5000, unit: 'Unit' },
      { id: 'hvac-vrf-pipe', name: 'VRF Copper Piping', minPrice: 650, maxPrice: 950, labourMin: 150, labourMax: 250, materialMin: 650, materialMax: 950, unit: 'RFT' },
      { id: 'hvac-window-serv', name: 'Window AC Service & Repair', minPrice: 500, maxPrice: 2500 },
      { id: 'hvac-gas-charge', name: 'AC Gas Charging (R22, R32, R410)', minPrice: 1800, maxPrice: 4500 },
      { id: 'hvac-pcb-repair', name: 'PCB Repair & Replacement', minPrice: 1200, maxPrice: 6500 },
      { id: 'hvac-cassette', name: 'Cassette AC & Tower AC Solutions', minPrice: 5000, maxPrice: 150000 },
      { id: 'hvac-amc', name: 'Annual Maintenance Contract (AMC)', minPrice: 3500, maxPrice: 25000 },
    ]
  },
  {
    id: 'electrical',
    name: 'Electrical Solutions',
    category: 'Utility',
    images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800'],
    youtubeId: 'W1Y_E-u_0sO',
    detailedDescription: '<p>Complete electrical wiring, fittings, and troubleshooting for home and industry.</p>',
    subCategories: [
      { id: 'elec-house-wire', name: 'Concealed Wiring (Full House)', minPrice: 180, maxPrice: 250, labourMin: 60, labourMax: 90, materialMin: 180, materialMax: 250, unit: 'Sq. Ft' },
      { id: 'elec-panel', name: 'Panel Board Dressing', minPrice: 10000, maxPrice: 25000, labourMin: 2500, labourMax: 5000, materialMin: 10000, materialMax: 25000, unit: 'Job' },
      { id: 'elec-ups', name: 'Inverter & UPS Installation', minPrice: 1000, maxPrice: 5000 },
      { id: 'elec-chandelier', name: 'Chandelier & Fancy Light Fitting', minPrice: 800, maxPrice: 15000 },
      { id: 'elec-short', name: 'Short Circuit Troubleshooting', minPrice: 500, maxPrice: 5000 },
    ]
  },
  {
    id: 'construction',
    name: 'Construction (Civil & Structural)',
    category: 'Building',
    images: ['https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=800'],
    youtubeId: 'P_T7_R5vN0E',
    detailedDescription: '<p>Professional construction, renovation, and waterproofing services.</p>',
    subCategories: [
      { id: 'cons-grey', name: 'Grey Structure (Dhalaai तक)', minPrice: 1400, maxPrice: 1800, labourMin: 220, labourMax: 280, materialMin: 1400, materialMax: 1800, unit: 'Sq. Ft' },
      { id: 'cons-brick-9', name: 'Brick Work (9 inch)', minPrice: 45, maxPrice: 65, labourMin: 12, labourMax: 18, materialMin: 45, materialMax: 65, unit: 'Sq. Ft' },
      { id: 'cons-plaster', name: 'Plaster Work', minPrice: 35, maxPrice: 50, labourMin: 15, labourMax: 22, materialMin: 35, materialMax: 50, unit: 'Sq. Ft' },
      { id: 'cons-waterproof', name: 'Waterproofing (Roof & Basement)', minPrice: 5000, maxPrice: 150000 },
    ]
  },
  {
    id: 'plumbing',
    name: 'Plumbing Services',
    category: 'Utility',
    images: ['https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800'],
    youtubeId: 'lB_n59_fV8E',
    detailedDescription: '<p>Complete sanitary fitting and drainage solutions.</p>',
    subCategories: [
      { id: 'plum-internal', name: 'Bathroom Internal Piping (CPVC)', minPrice: 12000, maxPrice: 18000, labourMin: 4000, labourMax: 6000, materialMin: 12000, materialMax: 18000, unit: 'Bathroom' },
      { id: 'plum-tank-setup', name: 'Water Tank Setup (1000L)', minPrice: 7500, maxPrice: 12000, labourMin: 800, labourMax: 1200, materialMin: 7500, materialMax: 12000, unit: 'Unit' },
      { id: 'plum-leak', name: 'Leaking Pipe & Tap Repair', minPrice: 300, maxPrice: 5000 },
      { id: 'plum-block', name: 'Drainage & Blockage Clearance', minPrice: 500, maxPrice: 8000 },
    ]
  },
  {
    id: 'false-ceiling',
    name: 'False Ceiling & POP',
    category: 'Interior',
    images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800'],
    youtubeId: 'dQw4w9WgXcQ',
    detailedDescription: '<p>Designer false ceilings with lighting integration.</p>',
    subCategories: [
      { id: 'ceil-gypsum-sg', name: 'Gypsum Board (Saint Gobain)', minPrice: 95, maxPrice: 130, labourMin: 40, labourMax: 55, materialMin: 95, materialMax: 130, unit: 'Sq. Ft' },
      { id: 'ceil-pvc-water', name: 'PVC Ceiling', minPrice: 75, maxPrice: 105, labourMin: 30, labourMax: 45, materialMin: 75, materialMax: 105, unit: 'Sq. Ft' },
      { id: 'ceil-cove', name: 'Cove Lighting & LED Profile Setup', minPrice: 1500, maxPrice: 25000 },
    ]
  },
  {
    id: 'tiles-marble',
    name: 'Tiles & Marble Work',
    category: 'Interior',
    images: ['https://images.unsplash.com/photo-1523413555809-0fb1d4da238d?auto=format&fit=crop&q=80&w=800'],
    youtubeId: 'dQw4w9WgXcQ',
    detailedDescription: '<p>Premium flooring installation and marble polishing.</p>',
    subCategories: [
      { id: 'tile-floor-lay', name: 'Floor Tiles Laying', minPrice: 45, maxPrice: 75, labourMin: 18, labourMax: 25, materialMin: 45, materialMax: 75, unit: 'Sq. Ft' },
      { id: 'tile-marble-pol', name: 'Marble Polishing', minPrice: 50, maxPrice: 80, labourMin: 25, labourMax: 40, materialMin: 50, materialMax: 80, unit: 'Sq. Ft' },
      { id: 'tile-granite', name: 'Granite Kitchen Top & Staircase Fitting', minPrice: 3500, maxPrice: 25000 },
    ]
  },
  {
    id: 'painting',
    name: 'Painting & Wall Decor',
    category: 'Finish',
    images: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=800'],
    youtubeId: 'dQw4w9WgXcQ',
    detailedDescription: '<p>Interior and exterior painting with premium finish.</p>',
    subCategories: [
      { id: 'paint-putty-2', name: 'Wall Putty (2 Coats)', minPrice: 10, maxPrice: 15, labourMin: 4, labourMax: 6, materialMin: 10, materialMax: 15, unit: 'Sq. Ft' },
      { id: 'paint-int-prem', name: 'Interior Painting (Premium)', minPrice: 22, maxPrice: 35, labourMin: 7, labourMax: 12, materialMin: 22, materialMax: 35, unit: 'Sq. Ft' },
      { id: 'paint-weather', name: 'Weathercoat Exterior Painting', minPrice: 18, maxPrice: 90 },
    ]
  },
  {
    id: 'doors-windows',
    name: 'Doors & Windows',
    category: 'Finish',
    images: ['https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=800'],
    youtubeId: 'dQw4w9WgXcQ',
    detailedDescription: '<p>Custom wood and metal door/window solutions.</p>',
    subCategories: [
      { id: 'win-alum-slide', name: 'Aluminium Sliding Windows', minPrice: 350, maxPrice: 550, labourMin: 80, labourMax: 120, materialMin: 350, materialMax: 550, unit: 'Sq. Ft' },
      { id: 'wood-door-fit', name: 'Wooden Door Fitting', minPrice: 8000, maxPrice: 15000, labourMin: 1200, labourMax: 2000, materialMin: 8000, materialMax: 15000, unit: 'Door' },
      { id: 'win-lock', name: 'Door Lock & Hydraulic Closer Installation', minPrice: 500, maxPrice: 5000 },
    ]
  },
  {
    id: 'home-planning',
    name: 'Home Planning & Design',
    category: 'Planning',
    images: ['https://images.unsplash.com/photo-1503387762-592da5a525d7?auto=format&fit=crop&q=80&w=800'],
    youtubeId: 'M7lc1UVf-VE',
    detailedDescription: '<p>Professional house mapping, 2D/3D layouts, and structural blueprints according to Vastu and modern standards.</p>',
    subCategories: [
      { id: 'plan-2d-layout', name: '2D Furniture & Layout Plan', minPrice: 3, maxPrice: 5, unit: 'Sq. Ft' },
      { id: 'plan-3d-elev', name: '3D Elevation Design', minPrice: 5000, maxPrice: 15000, unit: 'Per Side' },
      { id: 'plan-struct', name: 'Structural Drawing (Working)', minPrice: 5, maxPrice: 8, unit: 'Sq. Ft' },
      { id: 'plan-vastu', name: 'Vastu Consultation & Mapping', minPrice: 2100, maxPrice: 5100, unit: 'Session' },
    ]
  },
];

export const DEFAULT_CATEGORIES = [
  { id: 'planning', name: 'Planning' },
  { id: 'building', name: 'Building' },
  { id: 'utility', name: 'Utility' },
  { id: 'comfort', name: 'Comfort' },
  { id: 'interior', name: 'Interior' },
  { id: 'finish', name: 'Finish' },
  { id: 'woodwork', name: 'Woodwork' },
];

export const FOUNDER_EMAIL = 'mustakansari9582@gmail.com';
export const WHATSAPP_NUMBER = '919582268658';
export const PHONE_NUMBER = '+91 95882268658';
export const YOUTUBE_URL = 'https://www.youtube.com/@AtomicSolutions610';
export const INSTAGRAM_URL = 'https://www.instagram.com/atomic_solutions_1';
export const FACEBOOK_URL = 'https://www.facebook.com/share/1dSMDs9QUQ/';
