/**
 * Atomic Solutions Smart Modular AI Knowledge Engine (Tier 3 Zero-Fail Local Assistant)
 * Guaranteed 100% Lifetime Uptime even if API keys expire or server is restarted/offline.
 * Smart Focused Intent Architecture: Answers ONLY what the user asks cleanly without clutter!
 * Includes Comprehensive Installation Guidelines & Step-by-Step Processing Rules!
 */

import { CORE_SERVICES, PHONE_NUMBER, WHATSAPP_NUMBER, FOUNDER_EMAIL, DEOGHAR_AREAS } from '../constants';

export interface BookingIntent {
  isBooking: boolean;
  serviceName: string;
  subCategory: string;
  category: string;
  price: number;
  staffCategory: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

export function detectBookingIntent(userText: string): BookingIntent | null {
  const q = userText.toLowerCase().trim();

  // Explicit booking trigger words in English & Hindi/Hinglish
  const bookingTriggers = [
    'book', 'booking', 'schedule', 'appointment', 'chahiye', 'kar do', 'kar do na',
    'karo', 'reserve', 'lagao', 'order', 'fit kar do', 'service do', 'hire'
  ];

  const hasTrigger = bookingTriggers.some(t => q.includes(t));
  if (!hasTrigger) return null;

  // Extract appointment date/time
  let appointmentDate = 'Tomorrow';
  if (q.includes('today') || q.includes('aaj')) {
    appointmentDate = 'Today';
  } else if (q.includes('tomorrow') || q.includes('kal')) {
    appointmentDate = 'Tomorrow';
  } else if (q.includes('day after tomorrow') || q.includes('parso') || q.includes('parson')) {
    appointmentDate = 'Day After Tomorrow';
  }

  let appointmentTime = '10:00 AM';
  if (q.includes('morning') || q.includes('subah')) appointmentTime = '09:00 AM';
  if (q.includes('afternoon') || q.includes('dopahar')) appointmentTime = '02:00 PM';
  if (q.includes('evening') || q.includes('shaam') || q.includes('sham')) appointmentTime = '05:00 PM';
  if (q.includes('night') || q.includes('raat')) appointmentTime = '07:00 PM';

  // Match against CORE_SERVICES dynamically
  for (const s of CORE_SERVICES) {
    const sIdLower = s.id.toLowerCase();
    
    if (q.includes(sIdLower) || (sIdLower === 'hvac' && q.includes('ac'))) {
      for (const sub of s.subCategories) {
        const subLower = sub.name.toLowerCase();
        const subWords = subLower.split(' ');
        if (subWords.some(w => w.length > 3 && q.includes(w))) {
          return {
            isBooking: true,
            serviceName: s.name,
            subCategory: sub.name,
            category: s.category,
            price: sub.minPrice,
            staffCategory: s.staffCategory,
            appointmentDate,
            appointmentTime
          };
        }
      }
      const defaultSub = s.subCategories[0];
      return {
        isBooking: true,
        serviceName: s.name,
        subCategory: defaultSub.name,
        category: s.category,
        price: defaultSub.minPrice,
        staffCategory: s.staffCategory,
        appointmentDate,
        appointmentTime
      };
    }
  }

  // Generic fallback service
  return {
    isBooking: true,
    serviceName: 'General Home Maintenance',
    subCategory: 'Doorstep Technician Inspection',
    category: 'Utility',
    price: 350,
    staffCategory: 'General Maintenance',
    appointmentDate,
    appointmentTime
  };
}

/**
 * Step-by-Step Installation Guidelines & Processing Engine
 */
export function getInstallationGuidelines(userText: string): string | null {
  const q = userText.toLowerCase().trim();

  const installKeywords = [
    'install', 'installation', 'guideline', 'guidelines', 'process', 'processing',
    'kaise lagaye', 'kaise lagta', 'kaise fit', 'kaise hota', 'tarika', 'tareeka',
    'step', 'steps', 'procedure', 'fitting'
  ];

  const isAskingInstallation = installKeywords.some(k => q.includes(k));
  if (!isAskingInstallation) return null;

  // A. Split AC / HVAC Installation Guidelines
  if (q.includes('ac') || q.includes('air conditioner') || q.includes('split ac') || q.includes('cooling') || q.includes('compressor')) {
    return `🛠️ **Split AC Installation - Step-by-Step Guidelines**:\n\n` +
           `1. **Site Inspection & Wall Mounting**:\n` +
           `   - Select a solid brick/concrete wall away from direct heat sources.\n` +
           `   - Fix indoor mounting plate at **7 to 8 feet height** with a slight **1° tilt towards drain pipe** to ensure smooth water flow.\n\n` +
           `2. **Wall Core Hole Drilling**:\n` +
           `   - Drill a **65mm hole** angled slightly downwards towards the outside for copper tubes, condensate drain pipe, and power cord.\n\n` +
           `3. **Outdoor Unit (Compressor) Setup**:\n` +
           `   - Fix heavy-duty MS wall brackets with anti-vibration rubber pads. Maintain at least **15-20 cm open airflow space** behind the unit.\n\n` +
           `4. **Refrigerant Copper Piping & Insulation**:\n` +
           `   - Flare copper tube ends, insulate high-pressure suction lines with nitrile foam sleeves, and tighten flare nuts with torque wrench.\n\n` +
           `5. **Vacuuming & Leak Testing**:\n` +
           `   - Vacuum the system down to **-30 inHg (-760 mmHg)** using a two-stage vacuum pump for 15 minutes to purge all air and moisture before opening gas valves.\n\n` +
           `6. **Electrical Connections & MCB Isolator**:\n` +
           `   - Connect 4.0mm FR copper wire to a dedicated 16A/32A MCB isolator switch.\n\n` +
           `7. **Testing & Commissioning**:\n` +
           `   - Turn system ON, check delta-T cooling temperature (10°C-14°C inlet/outlet difference) and verify drain water flow.\n\n` +
           `👉 *Need a certified engineer? Type **"Book Split AC Installation"** to schedule!*`;
  }

  // B. Ceiling Fan & Electrical Fitting Guidelines
  if (q.includes('fan') || q.includes('light') || q.includes('wiring') || q.includes('switch') || q.includes('mcb') || q.includes('electric')) {
    return `🛠️ **Ceiling Fan & Electrical Fitting - Step-by-Step Guidelines**:\n\n` +
           `1. **Safety Isolation**:\n` +
           `   - Turn OFF main MCB switch at the distribution board. Test lines with a digital tester to ensure zero voltage.\n\n` +
           `2. **J-Hook & Expansion Anchor Fastening**:\n` +
           `   - Anchor high-tensile J-hook into solid ceiling concrete slab (Never attach to plaster or POP ceiling).\n\n` +
           `3. **Downrod & Safety Pin Assembly**:\n` +
           `   - Assemble downrod to motor shaft, secure with **steel bolt, castle nut, and split safety pin**.\n\n` +
           `4. **Electrical Terminal Connection**:\n` +
           `   - Connect Phase (Live), Neutral, and Earth wires to fan terminal block using 1.5mm FR copper wire.\n\n` +
           `5. **Blade Alignment & Speed Testing**:\n` +
           `   - Fix fan blades evenly with rubber washers. Restore MCB power and test smooth speed regulator control.\n\n` +
           `👉 *Need an electrician? Type **"Book Electrician"** to dispatch a certified technician!*`;
  }

  // C. Wall Putty & Painting Process
  if (q.includes('paint') || q.includes('putty') || q.includes('color') || q.includes('emulsion') || q.includes('distemper')) {
    return `🎨 **Wall Putty & Painting - Step-by-Step Guidelines**:\n\n` +
           `1. **Surface Preparation**:\n` +
           `   - Scrap off old loose paint, dirt, and fungus using wire brush & 80-grit emery sandpaper.\n\n` +
           `2. **Primer Base Coat**:\n` +
           `   - Apply 1 coat of Acrylic Waterproof Primer and allow 6-8 hours drying time.\n\n` +
           `3. **1st Coat Wall Putty**:\n` +
           `   - Apply 1st coat of Acrylic Putty with putty blade to level minor cracks and pinholes. (Drying: 4-6 hours).\n\n` +
           `4. **2nd Coat Putty & Sanding**:\n` +
           `   - Apply 2nd coat vertically. Buff wall surface with 180/220-grit waterproof sandpaper for mirror-smooth finish.\n\n` +
           `5. **Final 2 Coats Emulsion Paint**:\n` +
           `   - Apply 2 coats of Premium Interior Emulsion using microfiber roller and precision brush.\n\n` +
           `👉 *Need professional painters? Type **"Book Painting Service"** to inspect your walls!*`;
  }

  // D. Floor Tile Laying Guidelines
  if (q.includes('tile') || q.includes('tiles') || q.includes('marble') || q.includes('flooring') || q.includes('granite')) {
    return `🧱 **Vitrified Floor Tile Laying - Step-by-Step Guidelines**:\n\n` +
           `1. **Sub-Floor Levelling**:\n` +
           `   - Clean concrete base slab and mark water slope level using laser leveller.\n\n` +
           `2. **Mortar Bed Laying**:\n` +
           `   - Spread 1:4 cement-sand semi-dry mortar bed (25-35mm thickness).\n\n` +
           `3. **Tile Adhesive Application**:\n` +
           `   - Comb Polymer Modified Tile Adhesive on floor and tile back with a **6mm notched trowel**.\n\n` +
           `4. **Tile Alignment & Spacers**:\n` +
           `   - Press tile, tap gently with rubber mallet, and insert **2mm tile spacers** for perfectly straight grout lines.\n\n` +
           `5. **Epoxy Grout Filling**:\n` +
           `   - Clean spacer gaps after 24 hours and fill with stain-proof Epoxy Grout.\n\n` +
           `👉 *Need a tile specialist? Type **"Book Tile Laying"** to schedule a visit!*`;
  }

  // E. Plumbing & Pipe Fitting Guidelines
  if (q.includes('pipe') || q.includes('plumb') || q.includes('leak') || q.includes('tank') || q.includes('tap')) {
    return `🔧 **CPVC Plumbing & Pipe Fitting - Step-by-Step Guidelines**:\n\n` +
           `1. **Wall Chasing & Route Marking**:\n` +
           `   - Cut 1-inch deep grooves in wall using angle cutter for concealed CPVC lines.\n\n` +
           `2. **Solvent Jointing Process**:\n` +
           `   - Deburr pipe ends, apply CPVC Primer, then apply CPVC Solvent Cement and twist 90° into fitting.\n\n` +
           `3. **Hydrostatic Leak Testing**:\n` +
           `   - Pressurize pipeline to **100 PSI with hydraulic test pump** for 2 hours before closing wall plaster.\n\n` +
           `4. **Sanitary Fixture Fitting**:\n` +
           `   - Install diverter valves, taps, and wall-hung fixtures using Teflon thread tape.\n\n` +
           `👉 *Need a plumber? Type **"Book Plumber"** for doorstep plumbing service!*`;
  }

  // F. Brickwork & Plastering Process
  if (q.includes('brick') || q.includes('eet') || q.includes('wall') || q.includes('masonry') || q.includes('plaster')) {
    return `🧱 **Brick Masonry & Plastering - Step-by-Step Guidelines**:\n\n` +
           `1. **Water Curing Bricks**:\n` +
           `   - Soak red bricks in water for at least 2 hours before laying to prevent mortar drying.\n\n` +
           `2. **Plumb Line & String Level**:\n` +
           `   - Set corner lead bricks and align string line for straight, vertical wall alignment.\n\n` +
           `3. **Mortar Bed Application**:\n` +
           `   - Lay 10-12mm thick bed of 1:6 cement-sand mortar. Place bricks with **frog facing upward**.\n\n` +
           `4. **Water Curing & Plastering**:\n` +
           `   - Water spray brick wall for 7-10 days. Apply 1:4 cement plaster (12mm thickness) with trowel float.\n\n` +
           `👉 *Need civil work? Type **"Book Masonry Work"** to dispatch an engineer!*`;
  }

  return null;
}

/**
 * Technical Calculation & Material Estimation Engine (Focused Technical Responses Only)
 */
export function calculateCustomEstimation(userText: string): string | null {
  const q = userText.toLowerCase().trim();

  // Match dimension patterns e.g. 10x12, 10/12, 10 feet by 12 feet, 10*12, 100 sqft
  let length = 0;
  let width = 0;
  let floorArea = 0;
  let dimensionStr = "";

  const dimMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:ft|feet|foot|m|meter)?\s*(?:x|\*|by|\/|X)\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|foot|m|meter)?/i);
  if (dimMatch) {
    length = parseFloat(dimMatch[1]);
    width = parseFloat(dimMatch[2]);
    floorArea = length * width;
    dimensionStr = `${length} ft × ${width} ft`;
  } else {
    const sqftMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:sqft|sq\.\s*ft|sq\s*feet|square\s*feet)/i);
    if (sqftMatch) {
      floorArea = parseFloat(sqftMatch[1]);
      dimensionStr = `${floorArea} Sq. Ft`;
    }
  }

  if (!floorArea || floorArea <= 0) return null;

  // Identify work category requested
  const isAC = q.includes('ac') || q.includes('air conditioner') || q.includes('cooling') || q.includes('ton') || q.includes('tonnage') || q.includes('compressor');
  const isWiring = q.includes('wire') || q.includes('wiring') || q.includes('electric') || q.includes('bijli') || q.includes('fitting');
  const isPainting = q.includes('paint') || q.includes('putty') || q.includes('color') || q.includes('distemper') || q.includes('emulsion');
  const isTile = q.includes('tile') || q.includes('tiles') || q.includes('marble') || q.includes('flooring') || q.includes('granite');
  const isCeiling = q.includes('ceiling') || q.includes('pop') || q.includes('gypsum') || q.includes('pvc');
  const isBrickwork = q.includes('brick') || q.includes('eet') || q.includes('wall') || q.includes('masonry');
  const isPlaster = q.includes('plaster') || q.includes('plastering');

  if (isAC) {
    let recTon = "1.0 Ton AC";
    if (floorArea > 120 && floorArea <= 180) recTon = "1.5 Ton AC";
    else if (floorArea > 180) recTon = "2.0 Ton AC";

    let res = `❄️ **AC Tonnage Calculation Report**\n\n`;
    res += `• **Room Dimensions**: ${dimensionStr} (${floorArea} Sq. Ft.)\n`;
    res += `• 🎯 **Recommended Capacity**: **${recTon}**\n\n`;
    res += `💡 *Engineering Guide*: For normal top-floor rooms or direct afternoon sunlight, add **+0.5 Ton extra** for fast summer cooling.\n\n`;
    res += `*To book an AC technician, type: **"Book Split AC Installation"***`;
    return res;
  }

  let title = "";
  let subName = "";
  let unitName = "Sq. Ft";
  let calculationArea = floorArea;

  let minRate = 0;
  let maxRate = 0;
  let minLabour = 0;
  let maxLabour = 0;
  let minMat = 0;
  let maxMat = 0;
  let materialNote = "";

  if (isWiring) {
    title = "⚡ Electrical Concealed House Wiring";
    subName = "Concealed Wiring (Full House)";
    minRate = 180;
    maxRate = 250;
    minLabour = 60;
    maxLabour = 90;
    minMat = 120;
    maxMat = 160;
    materialNote = "Includes CPVC conduits, FR copper wires (Finolex/Havells 1.5mm/2.5mm/4mm), modular switch boxes & MCB distribution.";
  } else if (isPainting) {
    title = "🎨 Interior Wall Painting & Acrylic Putty";
    subName = "Interior Painting (Premium) + 2 Coats Putty";
    calculationArea = floorArea * 3.5;
    dimensionStr += ` (Wall Surface Area: ${calculationArea} Sq. Ft)`;
    minRate = 22;
    maxRate = 35;
    minLabour = 7;
    maxLabour = 12;
    minMat = 15;
    maxMat = 23;
    materialNote = "Includes Asian Paints / Berger Premium Emulsion, 2 coats acrylic putty & waterproof primer.";
  } else if (isTile) {
    title = "🧱 Premium Floor Tile Laying";
    subName = "Floor Tiles Laying & Grouting";
    minRate = 45;
    maxRate = 75;
    minLabour = 18;
    maxLabour = 25;
    minMat = 27;
    maxMat = 50;
    materialNote = "Includes vitrified tile laying labour, cement mortar bed & tile adhesive chemical.";
  } else if (isCeiling) {
    title = "✨ Designer Gypsum False Ceiling";
    subName = "Gypsum Board Ceiling (Saint Gobain)";
    minRate = 95;
    maxRate = 130;
    minLabour = 40;
    maxLabour = 55;
    minMat = 55;
    maxMat = 75;
    materialNote = "Includes Saint Gobain Gypsum boards, GI channels, jointing compound & cove LED framing.";
  } else if (isBrickwork) {
    title = "🧱 9-Inch Red Brick Masonry Wall";
    subName = "Brick Work (9 inch)";
    minRate = 45;
    maxRate = 65;
    minLabour = 12;
    maxLabour = 18;
    minMat = 33;
    maxMat = 47;
    const bricksCount = Math.round(calculationArea * 5);
    const cementBags = Math.ceil(calculationArea / 20);
    const sandCuFt = Math.ceil(calculationArea * 0.18);
    materialNote = `Estimated Material: **${bricksCount} Red Bricks**, **${cementBags} Cement Bags**, **${sandCuFt} Cu. Ft Sand**.`;
  } else if (isPlaster) {
    title = "🧱 Smooth Wall Plastering Work";
    subName = "Cement Plaster Work (1:4 Mix)";
    minRate = 35;
    maxRate = 50;
    minLabour = 15;
    maxLabour = 22;
    minMat = 20;
    maxMat = 28;
    materialNote = "Includes cement mortar application, line & level finishing with sand screening.";
  } else {
    title = "⚡ Electrical Concealed House Wiring";
    subName = "Concealed Wiring (Full House)";
    minRate = 180;
    maxRate = 250;
    minLabour = 60;
    maxLabour = 90;
    minMat = 120;
    maxMat = 160;
    materialNote = "Includes CPVC conduits, FR copper wires, modular boxes & MCB distribution.";
  }

  // Area calculations
  const totalMinCost = Math.round(calculationArea * minRate);
  const totalMaxCost = Math.round(calculationArea * maxRate);
  const totalMinLabour = Math.round(calculationArea * minLabour);
  const totalMaxLabour = Math.round(calculationArea * maxLabour);
  const totalMinMat = Math.round(calculationArea * minMat);
  const totalMaxMat = Math.round(calculationArea * maxMat);

  let output = `📐 **Material & Cost Estimation Report**\n\n`;
  output += `• **Input Dimensions**: ${dimensionStr}\n`;
  output += `• **Calculation Area**: **${calculationArea} ${unitName}**\n`;
  output += `• **Work Type**: **${title}**\n\n`;
  output += `---\n\n`;
  output += `📊 **Cost Breakdown**: \n\n`;
  output += `| Component | Unit Rate | Estimated Range (₹) |\n`;
  output += `| :--- | :--- | :--- |\n`;
  output += `| 👷 **Labour Cost** | ₹${minLabour} - ₹${maxLabour}/${unitName} | **₹${totalMinLabour.toLocaleString()} - ₹${totalMaxLabour.toLocaleString()}** |\n`;
  output += `| 📦 **Material Cost** | ₹${minMat} - ₹${maxMat}/${unitName} | **₹${totalMinMat.toLocaleString()} - ₹${totalMaxMat.toLocaleString()}** |\n`;
  output += `| ⚡ **Total Estimated Budget** | **₹${minRate} - ₹${maxRate}/${unitName}** | **₹${totalMinCost.toLocaleString()} - ₹${totalMaxCost.toLocaleString()}** |\n\n`;

  if (materialNote) {
    output += `💡 *Material Breakdown*: ${materialNote}\n\n`;
  }

  output += `*To schedule an on-site engineer visit, type: **"Book ${subName}"***`;

  return output;
}

/**
 * Searches CORE_SERVICES and returns ONLY clean Markdown Rate List tables for pricing inquiries.
 */
export function getServiceRateList(userText: string): string | null {
  const q = userText.toLowerCase().trim();

  // Price query indicators
  const priceKeywords = [
    'price', 'prices', 'cost', 'costs', 'rate', 'rates', 'list', 'kitna', 'kitne',
    'charge', 'charges', 'tariff', 'daam', 'paisa', 'rupee', 'rs', '₹', 'batao',
    'kya rate', 'kitna lagega', 'kitna padega', 'rate list', 'price list', 'tariff card'
  ];

  const isAskingPrice = priceKeywords.some(k => q.includes(k));
  if (!isAskingPrice) return null;

  // Filter matched services
  const matchedServices = CORE_SERVICES.filter(s => {
    const nameLower = s.name.toLowerCase();
    const idLower = s.id.toLowerCase();
    const catLower = s.category.toLowerCase();

    if (idLower === 'hvac' && (q.includes('ac') || q.includes('air conditioner') || q.includes('cooling') || q.includes('hvac'))) return true;
    if (idLower === 'electrical' && (q.includes('electric') || q.includes('wire') || q.includes('wiring') || q.includes('mcb') || q.includes('light') || q.includes('fan') || q.includes('panel'))) return true;
    if (idLower === 'plumbing' && (q.includes('plumb') || q.includes('pipe') || q.includes('leak') || q.includes('tap') || q.includes('tank') || q.includes('drain'))) return true;
    if (idLower === 'construction' && (q.includes('civil') || q.includes('brick') || q.includes('eet') || q.includes('plaster') || q.includes('dhalaai') || q.includes('grey') || q.includes('waterproof'))) return true;
    if (idLower === 'painting' && (q.includes('paint') || q.includes('putty') || q.includes('emulsion') || q.includes('color') || q.includes('wall'))) return true;
    if (idLower === 'tiles-marble' && (q.includes('tile') || q.includes('marble') || q.includes('granite') || q.includes('floor') || q.includes('polish'))) return true;
    if (idLower === 'false-ceiling' && (q.includes('ceiling') || q.includes('pop') || q.includes('gypsum') || q.includes('pvc') || q.includes('cove'))) return true;
    if (idLower === 'carpentry' && (q.includes('wood') || q.includes('carpenter') || q.includes('kitchen') || q.includes('wardrobe') || q.includes('furniture') || q.includes('sunmica'))) return true;
    if (idLower === 'doors-windows' && (q.includes('door') || q.includes('window') || q.includes('lock') || q.includes('aluminium'))) return true;
    if (idLower === 'deep-cleaning' && (q.includes('clean') || q.includes('cleaning') || q.includes('sofa') || q.includes('wash') || q.includes('sanitization'))) return true;
    if (idLower === 'home-planning' && (q.includes('plan') || q.includes('layout') || q.includes('3d') || q.includes('elevation') || q.includes('map') || q.includes('vastu'))) return true;

    return nameLower.includes(q) || catLower.includes(q);
  });

  if (matchedServices.length > 0) {
    let resultText = `📋 **Official Service Rate List**\n\n`;
    
    for (const service of matchedServices) {
      resultText += `### 🛠️ ${service.name} (${service.category})\n`;
      resultText += `*Technician Category*: **${service.staffCategory}**\n\n`;
      resultText += `| Service / Subcategory | Rate Range (₹) | Labour Cost | Material Cost | Unit |\n`;
      resultText += `| :--- | :--- | :--- | :--- | :--- |\n`;

      for (const sub of service.subCategories) {
        const rateStr = sub.maxPrice ? `₹${sub.minPrice.toLocaleString()} - ₹${sub.maxPrice.toLocaleString()}` : `₹${sub.minPrice.toLocaleString()}`;
        const labourStr = sub.labourMin ? `₹${sub.labourMin} - ₹${sub.labourMax}` : 'Included';
        const matStr = sub.materialMin ? `₹${sub.materialMin} - ₹${sub.materialMax}` : 'Included';
        const unitStr = sub.unit || 'Job';

        resultText += `| **${sub.name}** | ${rateStr} | ${labourStr} | ${matStr} | ${unitStr} |\n`;
      }
      resultText += `\n`;
    }

    resultText += `*To book any service, type: **"Book ${matchedServices[0].subCategories[0].name}"***`;
    return resultText;
  }

  // Full Index if user asks for "all rates"
  if (q.includes('rate list') || q.includes('price list') || q.includes('all') || q.includes('sab') || q.includes('saari') || q.includes('full')) {
    let resultText = `📋 **Atomic Solutions - Master Website Rate Index**\n\n`;

    for (const s of CORE_SERVICES) {
      resultText += `• **${s.name}**: Starting from **₹${s.subCategories[0].minPrice.toLocaleString()}** (${s.subCategories.length} Sub-services)\n`;
    }

    resultText += `\n👉 *Ask about any service (e.g. "AC installation rates" or "Electrical wiring price") to view full rate breakdown!*`;
    return resultText;
  }

  return null;
}

interface KnowledgeResponse {
  text: string;
  matchedTopic?: string;
  bookingIntent?: BookingIntent | null;
}

export function generateLocalAIResponse(userText: string, adminContext?: string): KnowledgeResponse {
  const query = userText.toLowerCase().trim();

  // 1. INTENT: Contact Details / Address / Phone / Email Query (SEPARATED & CLEAN)
  if (query.includes('contact') || query.includes('phone') || query.includes('call') || query.includes('number') || query.includes('address') || query.includes('location') || query.includes('deoghar') || query.includes('owner') || query.includes('mustak') || query.includes('founder') || query.includes('office')) {
    return {
      text: `🏢 **Atomic Solutions - Official Contact Details**:\n\n` +
            `• 📞 **Direct Call**: [${PHONE_NUMBER}](tel:${PHONE_NUMBER.replace(/\s+/g, '')})\n` +
            `• 💬 **WhatsApp Support**: [WhatsApp Us (${PHONE_NUMBER})](https://wa.me/${WHATSAPP_NUMBER})\n` +
            `• 📧 **Email**: ${FOUNDER_EMAIL}\n` +
            `• 📍 **Location**: Deoghar (${DEOGHAR_AREAS.slice(0, 5).join(', ')} & surrounding regions).\n` +
            `• ⏰ **Hours**: 8:00 AM - 9:00 PM (Daily)`
    };
  }

  // 2. INTENT: Step-by-Step Installation Guidelines Process (SEPARATED & CLEAN)
  const installGuideText = getInstallationGuidelines(userText);
  if (installGuideText) {
    return { text: installGuideText, matchedTopic: 'installation_guidelines' };
  }

  // 3. INTENT: Material Calculation / Dimension Estimation (SEPARATED & CLEAN)
  const customEstimateText = calculateCustomEstimation(userText);
  if (customEstimateText) {
    return { text: customEstimateText, matchedTopic: 'custom_estimation' };
  }

  // 4. INTENT: Pricing / Rate List Lookup (SEPARATED & CLEAN)
  const rateListText = getServiceRateList(userText);
  if (rateListText) {
    return { text: rateListText, matchedTopic: 'rate_list' };
  }

  // 5. INTENT: Direct Service Booking (SEPARATED & CLEAN)
  const intent = detectBookingIntent(userText);
  if (intent) {
    return {
      text: `✅ **Direct Service Booking Request**\n\n` +
            `Requesting **${intent.subCategory}** (${intent.serviceName}).\n` +
            `📅 Schedule: ${intent.appointmentDate} at ${intent.appointmentTime}\n` +
            `💰 Price: ₹${intent.price.toLocaleString()}`,
      bookingIntent: intent
    };
  }

  // 6. INTENT: Admin Stats Summary
  if (adminContext && (query.includes('stat') || query.includes('booking') || query.includes('bill') || query.includes('aaj') || query.includes('today') || query.includes('report'))) {
    return {
      text: `👑 **Admin Live Summary**\n\n` +
            `${adminContext.replace(/\[CRITICAL SYSTEM INFO:.*\]/g, '').trim()}`
    };
  }

  // 7. SPECIFIC TECHNICAL & ENGINEERING ANSWERS

  // AC Tonnage Advice
  if (query.includes('1 ton') || query.includes('1.5 ton') || query.includes('2 ton') || query.includes('tonnage') || (query.includes('ac') && (query.includes('room') || query.includes('size') || query.includes('kitne') || query.includes('bade')))) {
    return {
      text: `❄️ **AC Tonnage Guide**:\n\n` +
            `• **1.0 Ton AC**: Rooms up to **120 Sq. Ft.** (10x10 ft / 10x12 ft).\n` +
            `• **1.5 Ton AC**: Rooms **120 - 180 Sq. Ft.** (12x14 ft / 12x15 ft).\n` +
            `• **2.0 Ton AC**: Rooms **180 - 250 Sq. Ft.** (15x16 ft).\n` +
            `• ☀️ *Sun-facing / Top floor*: Add **+0.5 Ton extra** for summer cooling.`
    };
  }

  // Bricks Calculation Guide
  if (query.includes('eet') || query.includes('brick') || query.includes('cement') || query.includes('sand') || query.includes('mortar')) {
    return {
      text: `🧱 **Brickwork & Civil Material Guide**:\n\n` +
            `• **9-Inch Main Wall**: Approx **500 Red Bricks** per 100 Sq. Ft wall area.\n` +
            `• **4.5-Inch Partition Wall**: Approx **250 Red Bricks** per 100 Sq. Ft.\n` +
            `• **Cement**: 1 bag cement binds ~20 Sq. Ft wall (1:6 mortar mix).\n` +
            `• **Sand**: Approx 15-20 Cu. Ft per 100 Sq. Ft.`
    };
  }

  // Electrical Wiring Guide
  if (query.includes('wire') || query.includes('wiring') || query.includes('electric') || query.includes('load') || query.includes('mcb')) {
    return {
      text: `⚡ **Electrical Wire Gauge Standard**:\n\n` +
            `• 1.5 sq mm: Lighting & Fans\n` +
            `• 2.5 sq mm: Power Sockets (TV, Refrigerator)\n` +
            `• 4.0 sq mm: Heavy Loads (1.5T/2T AC, Geyser, Microwave)\n` +
            `• Concealed Wiring Rate: **₹180 - ₹250 / Sq. Ft**`
    };
  }

  // Plumbing Guide
  if (query.includes('plumb') || query.includes('pipe') || query.includes('leak') || query.includes('tank')) {
    return {
      text: `🔧 **Plumbing Setup Guide**:\n\n` +
            `• Water Tank: 1000L Overhead Tank recommended for 4-6 members.\n` +
            `• Piping: CPVC for internal hot/cold lines & UPVC for main line.\n` +
            `• Bathroom Internal Piping: **₹12,000 - ₹18,000** per bathroom.`
    };
  }

  // Painting Guide
  if (query.includes('paint') || query.includes('putty') || query.includes('primer') || query.includes('color')) {
    return {
      text: `🎨 **Painting & Putty Guide**:\n\n` +
            `• Wall Area Formula: Total Paintable Area ≈ Carpet Area × 3.5\n` +
            `• Coverage: Premium Emulsion covers ~120-140 Sq. Ft per Liter (2 coats).\n` +
            `• Acrylic Wall Putty: **₹10 - ₹15 / Sq. Ft** (2 coats).`
    };
  }

  // Tiles & Marble Guide
  if (query.includes('tile') || query.includes('tiles') || query.includes('marble') || query.includes('granite')) {
    return {
      text: `🧱 **Tiles & Marble Guide**:\n\n` +
            `• Vitrified Floor Tile Laying: **₹45 - ₹75 / Sq. Ft**\n` +
            `• Marble Polishing: **₹50 - ₹80 / Sq. Ft**`
    };
  }

  // False Ceiling Guide
  if (query.includes('ceiling') || query.includes('pop') || query.includes('gypsum')) {
    return {
      text: `✨ **False Ceiling Guide**:\n\n` +
            `• Gypsum Board Ceiling (Saint Gobain): **₹95 - ₹130 / Sq. Ft**\n` +
            `• PVC Waterproof Ceiling: **₹75 - ₹105 / Sq. Ft**`
    };
  }

  // Carpentry Guide
  if (query.includes('kitchen') || query.includes('wardrobe') || query.includes('furniture') || query.includes('carpenter')) {
    return {
      text: `🪵 **Woodwork Guide**:\n\n` +
            `• Modular Kitchen: **₹85,000 - ₹2,50,000**\n` +
            `• Custom Wardrobe: **₹1,200 - ₹1,800 / Sq. Ft**`
    };
  }

  // 8. General Multilingual Fallback
  const isHindi = /[\u0900-\u097F]/.test(userText) || /\b(namaste|kaise|kya|haan|kaam|batao|karo|bhai|hello|hi|rate|price|kitna)\b/i.test(userText);

  if (isHindi) {
    return {
      text: `👋 **Namaste! Main Atomic Bot hoon.**\n\n` +
            `Aap mujhse kisi bhi ek topic par pooch sakte hain:\n` +
            `• **Installation Guidelines**: Poochiye *"AC installation process kya hai?"* ya *"Fan kaise lagate hain?"*\n` +
            `• **Contact Info**: Poochiye *"Contact number kya hai?"*\n` +
            `• **AC Tonnage**: Poochiye *"10/12 room me kitna ton AC lagega?"*\n` +
            `• **Calculations**: Poochiye *"10x10 wall me kitni eet lagegi?"*\n` +
            `• **Rate List**: Poochiye *"Electrical wiring ka rate kya hai?"*\n` +
            `• **Booking**: Bolen *"Kal AC service book karo"*`
    };
  }

  return {
    text: `Hello! 👋 I'm **Atomic Bot**, your AI consultant for Atomic Solutions.\n\n` +
          `You can ask me specific questions:\n` +
          `• **Installation Guidelines**: Ask "Split AC installation steps" or "Fan installation process"\n` +
          `• **Contact Details**: Ask "Company phone number or address"\n` +
          `• **AC Tonnage**: Ask "10/12 room AC size"\n` +
          `• **Material Estimation**: Ask "Bricks for 10x10 wall"\n` +
          `• **Rate Lists**: Ask "Electrical rates"\n` +
          `• **Booking**: Say "Book AC service for tomorrow"`
  };
}
