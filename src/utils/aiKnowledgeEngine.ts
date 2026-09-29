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

  // If the query is an inquiry, question, comparison or troubleshooting, DO NOT trigger booking!
  const isQuestion = /\b(kaise|kya|kyu|kyun|kis|kitna|kitne|how|why|what|when|where|which|difference|process|step|steps|tarika|guideline|jankari|explain|problem|issue|kharab|reason|wajah|fault|code|guide|tips|solve|repair kaise|sahi kaise)\b/i.test(q) ||
                     q.includes('?') || q.includes('कैसे') || q.includes('क्या') || q.includes('क्यों') || q.includes('कितना') || q.includes('तरीका');
  if (isQuestion) return null;

  // Explicit booking trigger phrases (English, Hinglish & Devanagari Hindi)
  const isServiceKeyword = 
    /\b(service|repair|install|technician|mistri|plumber|electrician|painter|painting|cleaner|cleaning|safai|carpenter|fitting|wiring|plumbing|paint)\b/i.test(q) ||
    q.includes('सर्विस') || q.includes('काम') || q.includes('मिस्त्री') || q.includes('प्लंबर') || q.includes('इलेक्ट्रीशियन') || q.includes('पेंटर') || q.includes('सफाई') || q.includes('सफ़ाई') || q.includes('वायरिंग') || q.includes('पंखा') || q.includes('एसी');

  const isBookingAction = 
    /\b(book|booking|schedule|appointment|order|reserve)\b/i.test(q) ||
    /\b(chahiye|kar do|karna hai|bhejo|aao|lagwana|karwana|karwa|bhej)\b/i.test(q) ||
    q.includes('बुक') || q.includes('बुकिंग') || q.includes('चाहिए') || q.includes('कर दो') || q.includes('करना है') || q.includes('भेजो') || q.includes('करवाना') || q.includes('लगाना');

  const hasBookingPhrase = 
    /\b(book|booking|schedule|appointment|technician bhejo|service book|order book|reserve)\b/i.test(q) ||
    q.includes('बुक') || q.includes('बुकिंग') ||
    (isServiceKeyword && isBookingAction) ||
    /\b(yeh|ye|is|iss)\s*(service|bhi|wala)?\s*(book|karna|kar do)\b/i.test(q);
  if (!hasBookingPhrase) return null;

  // Extract appointment date/time
  let appointmentDate = 'Tomorrow';
  if (q.includes('today') || q.includes('aaj') || q.includes('आज')) {
    appointmentDate = 'Today';
  } else if (q.includes('tomorrow') || q.includes('kal') || q.includes('कल')) {
    appointmentDate = 'Tomorrow';
  } else if (q.includes('day after tomorrow') || q.includes('parso') || q.includes('parson') || q.includes('परसों')) {
    appointmentDate = 'Day After Tomorrow';
  }

  let appointmentTime = '10:00 AM';
  if (q.includes('morning') || q.includes('subah') || q.includes('सुबह')) appointmentTime = '09:00 AM';
  if (q.includes('afternoon') || q.includes('dopahar') || q.includes('दोपहर')) appointmentTime = '02:00 PM';
  if (q.includes('evening') || q.includes('shaam') || q.includes('sham') || q.includes('शाम')) appointmentTime = '05:00 PM';
  if (q.includes('night') || q.includes('raat') || q.includes('रात')) appointmentTime = '07:00 PM';

  // 1. Identify matched service based on keywords (Multilingual Hindi/English)
  let matchedService: any = null;

  // Electrical
  if (/\b(electric|electrician|bijli|wire|wiring|mcb|board|switch|socket|light|fan|pankha|inverter|ups|chandelier)\b/i.test(q) ||
      q.includes('बिजली') || q.includes('इलेक्ट्रीशियन') || q.includes('वायरिंग') || q.includes('पंखा') || q.includes('लाइट')) {
    matchedService = CORE_SERVICES.find(s => s.id === 'electrical');
  }
  // Plumbing
  else if (/\b(plumb|plumber|nal|pipe|leak|tap|toti|water tank|drain|drainage|tanki|motor)\b/i.test(q) ||
      q.includes('प्लंबर') || q.includes('नल') || q.includes('पाइप') || q.includes('लीक') || q.includes('टंकी')) {
    matchedService = CORE_SERVICES.find(s => s.id === 'plumbing');
  }
  // Civil / Construction
  else if (/\b(civil|construction|mason|mistri|brick|eet|chunai|jodai|plaster|dhalaai|slab|cement|balu|ret|waterproof|waterproofing)\b/i.test(q) ||
      q.includes('सिविल') || q.includes('मिस्त्री') || q.includes('ईंट') || q.includes('चुनाई') || q.includes('प्लास्टर') || q.includes('ढलाई')) {
    matchedService = CORE_SERVICES.find(s => s.id === 'construction');
  }
  // Painting
  else if (/\b(paint|painter|painting|rang|putty|primer|distemper|emulsion|texture)\b/i.test(q) ||
      q.includes('पेंट') || q.includes('पेंटर') || q.includes('पुट्टी') || q.includes('रंग')) {
    matchedService = CORE_SERVICES.find(s => s.id === 'painting');
  }
  // Deep Cleaning
  else if (/\b(clean|cleaning|safai|deep clean|jhadu|pocha|sofa|wash|sanitization)\b/i.test(q) ||
      q.includes('सफाई') || q.includes('सफ़ाई') || q.includes('झाड़ू') || q.includes('पोछा') || q.includes('धुलाई')) {
    matchedService = CORE_SERVICES.find(s => s.id === 'deep-cleaning');
  }
  // False Ceiling
  else if (/\b(ceiling|false ceiling|pop|gypsum|pvc ceiling|cove)\b/i.test(q) ||
      q.includes('सीलिंग') || q.includes('फॉल्स सीलिंग') || q.includes('पीओपी')) {
    matchedService = CORE_SERVICES.find(s => s.id === 'false-ceiling');
  }
  // Carpentry
  else if (/\b(carpenter|carpentry|wood|lakdi|furniture|wardrobe|kitchen|cupboard|sunmica)\b/i.test(q) ||
      q.includes('बढ़ई') || q.includes('लकड़ी') || q.includes('फर्नीचर') || q.includes('अलमारी') || q.includes('किचन')) {
    matchedService = CORE_SERVICES.find(s => s.id === 'carpentry');
  }
  // Tiles & Marble
  else if (/\b(tile|tiles|marble|granite|flooring|polish)\b/i.test(q) ||
      q.includes('टाइल्स') || q.includes('मार्बल') || q.includes('ग्रेनाइट')) {
    matchedService = CORE_SERVICES.find(s => s.id === 'tiles-marble');
  }
  // Doors & Windows
  else if (/\b(door|darwaza|window|khidki|aluminium|glass|lock)\b/i.test(q) ||
      q.includes('दरवाजा') || q.includes('खिड़की') || q.includes('एल्युमिनियम') || q.includes('ताला')) {
    matchedService = CORE_SERVICES.find(s => s.id === 'doors-windows');
  }
  // Home Planning
  else if (/\b(map|naksha|plan|planning|2d|3d|elevation|vastu)\b/i.test(q) ||
      q.includes('नक्शा') || q.includes('प्लान') || q.includes('वास्तु')) {
    matchedService = CORE_SERVICES.find(s => s.id === 'home-planning');
  }
  // HVAC / AC
  else if (/\b(ac|hvac|cooler|cooling|air conditioner|compressor|gas charging|split ac|window ac)\b/i.test(q) ||
      q.includes('एसी') || q.includes('कूलिंग') || q.includes('गैस')) {
    matchedService = CORE_SERVICES.find(s => s.id === 'hvac');
  }

  // If general "यह सर्विस बुक कर दो" or not specified, default to first service (slider enables easy switching!)
  if (!matchedService) {
    matchedService = CORE_SERVICES[0];
  }

  // Find matching sub-service if mentioned in text
  let matchedSub = null;
  for (const sub of matchedService.subCategories) {
    const subWords = sub.name.toLowerCase().split(' ');
    if (subWords.some((w: string) => w.length > 3 && q.includes(w))) {
      matchedSub = sub;
      break;
    }
  }

  if (!matchedSub) {
    matchedSub = matchedService.subCategories[0];
  }

  return {
    isBooking: true,
    serviceName: matchedService.name,
    subCategory: matchedSub.name,
    category: matchedService.category,
    price: matchedSub.minPrice,
    staffCategory: matchedService.staffCategory,
    appointmentDate,
    appointmentTime
  };
}

/**
 * Step-by-Step Installation Guidelines & Processing Engine
 */
export function getInstallationGuidelines(userText: string): string | null {
  const q = userText.toLowerCase().trim();

  // B. Ceiling Fan & Electrical Fitting Guidelines (Matches: fan kaise lagaen, pankha kaise fit karein, etc.)
  if ((q.includes('fan') || q.includes('pankha')) && (q.includes('laga') || q.includes('fit') || q.includes('install') || q.includes('step') || q.includes('tarika') || q.includes('tareeka') || q.includes('kaise') || q.includes('taar') || q.includes('connection'))) {
    return `🛠️ **सीलिंग फैन (Ceiling Fan) लगाने का सही तरीका & स्टेप्स**:\n\n` +
           `1. **बिजली बंद करें (Safety First)**:\n` +
           `   - सबसे पहले मेन MCB स्विच बंद करें। टेस्टर से लाइन चेक करके 100% सुनिश्चित करें कि तार में कोई करंट नहीं है।\n\n` +
           `2. **J-Hook व रबर बुश माउंटिंग**:\n` +
           `   - छत में लगे पंखे के मजबूत लोहे के हुक (J-Hook) में रबर बुश लगाएं और हैंगर क्लैंप को स्टील नट-बोल्ट से मजबूती से कसें।\n\n` +
           `3. **डाउनरोड & सेफ्टी पिन (सबसे महत्वपूर्ण)**:\n` +
           `   - पाइप (Downrod) को मोटर के शाफ्ट में फिट करें, नट टाइट करें और **सेफ्टी स्प्लिट पिन (Safety Pin)** ज़रूर लगाएं ताकि भविष्य में पंखा कभी ढीला होकर न गिरे।\n\n` +
           `4. **वायरिंग कनेक्शन (Wiring Connection)**:\n` +
           `   - **Phase (लाल तार)**: रेगुलेटर/स्विच लाइन से जोड़ें।\n` +
           `   - **Neutral (काला तार)**: न्यूट्रल पॉइंट से जोड़ें।\n` +
           `   - **Earth (हरा तार)**: मोटर बॉडी के अर्थिंग स्क्रू पर लगाएं।\n\n` +
           `5. **ब्लेड्स फिटिंग (Blades Alignment)**:\n` +
           `   - पंखे की तीनों पंखुड़ियों को रबर वॉशर के साथ बराबर कसें ताकि पंखा डगमगाए (Wobble) नहीं और भरपूर हवा दे।\n\n` +
           `6. **टेस्टिंग**: MCB ऑन करें और रेगुलेटर की स्पीड चेक करें।\n\n` +
           `👉 *अगर इलेक्ट्रीशियन घर बुलाना है, तो लिखें: **"Book Electrician"***`;
  }

  // A. Split AC / HVAC Installation Guidelines
  if ((q.includes('ac') || q.includes('air conditioner') || q.includes('split ac')) && (q.includes('laga') || q.includes('fit') || q.includes('install') || q.includes('step') || q.includes('tarika') || q.includes('tareeka') || q.includes('kaise'))) {
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

  // F. Brickwork & Plastering Process (Explicit wall construction steps only)
  if (((q.includes('brick') || q.includes('eet') || q.includes('masonry')) && (q.includes('chunai') || q.includes('jodai') || q.includes('process') || q.includes('tarika'))) ||
      (q.includes('plaster') && (q.includes('kaise karein') || q.includes('kaise hota') || q.includes('tarika') || q.includes('steps')) && !q.includes('ret') && !q.includes('balu') && !q.includes('sand') && !q.includes('moti') && !q.includes('patli'))) {
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

  // Explicitly ignore duration or measurement queries (e.g. kitne din, kitne ghante, kitne ton)
  if (q.includes('kitne din') || q.includes('kitne ghante') || q.includes('kitne time') || q.includes('kitne ton') || q.includes('kitne inch') || q.includes('kitne mm')) {
    return null;
  }

  // Price query indicators
  const priceKeywords = [
    'price', 'prices', 'cost', 'costs', 'rate', 'rates', 'charge', 'charges',
    'tariff', 'daam', 'paisa', 'rupee', 'rs', '₹', 'kya rate', 'kitna lagega',
    'kitna padega', 'kitna kharcha', 'rate list', 'price list', 'tariff card'
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
        const hasLabour = Boolean((sub.labourMin && sub.labourMin > 0) || (sub.labourMax && sub.labourMax > 0));
        const labourStr = hasLabour 
          ? (sub.labourMin && sub.labourMax && sub.labourMin !== sub.labourMax 
              ? `₹${sub.labourMin.toLocaleString()} - ₹${sub.labourMax.toLocaleString()}` 
              : `₹${(sub.labourMin || sub.labourMax)?.toLocaleString()}`)
          : '—';

        const hasMaterial = Boolean((sub.materialMin && sub.materialMin > 0) || (sub.materialMax && sub.materialMax > 0));
        const matStr = hasMaterial 
          ? (sub.materialMin && sub.materialMax && sub.materialMin !== sub.materialMax 
              ? `₹${sub.materialMin.toLocaleString()} - ₹${sub.materialMax.toLocaleString()}` 
              : `₹${(sub.materialMin || sub.materialMax)?.toLocaleString()}`)
          : '—';

        const hasGeneral = Boolean(sub.minPrice && sub.minPrice > 0);
        const rateStr = hasGeneral 
          ? (sub.maxPrice && sub.maxPrice !== sub.minPrice 
              ? `₹${sub.minPrice.toLocaleString()} - ₹${sub.maxPrice.toLocaleString()}` 
              : `₹${sub.minPrice.toLocaleString()}`)
          : (hasLabour ? labourStr : hasMaterial ? matStr : '—');

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

export interface KnowledgeResponse {
  text: string;
  matchedTopic?: string;
  bookingIntent?: BookingIntent | null;
  isSpecificMatch: boolean;
}

export function generateLocalAIResponse(userText: string, adminContext?: string): KnowledgeResponse {
  const query = userText.toLowerCase().trim();

  // 0. NATURAL CONVERSATIONAL GREETINGS (Conversational AI Response)
  if (query.includes('aap kaise') || query.includes('tum kaise') || query.includes('kaise ho') || query.includes('kaise hai') || query.includes('kya haal') || query.includes('how are you') ||
      query.includes('कैसे हो') || query.includes('कैसे हैं') || query.includes('कैसी हैं') || query.includes('क्या हाल') || query.includes('आप कैसे')) {
    return {
      text: `मैं बिल्कुल ठीक हूँ, पूछने के लिए बहुत-बहुत धन्यवाद! 😊\n\nआप कैसे हैं? आज मैं आपकी किस प्रकार सहायता कर सकता हूँ?`,
      isSpecificMatch: true
    };
  }

  if (query === 'hi' || query === 'hello' || query === 'namaste' || query === 'namaskar' || query === 'hey' || query === 'pranam' || 
      query.includes('नमस्ते') || query.includes('नमस्कार') || query.includes('प्रणाम') || query.includes('हेलो') || query.includes('हाय')) {
    return {
      text: `नमस्ते! 🙏 मैं **Atomic AI** हूँ, Atomic Solutions का AI सलाहकार।\n\nमैं आपकी क्या मदद कर सकता हूँ? आप होम सर्विसेज (AC, इलेक्ट्रिकल, प्लंबिंग, सिविल निर्माण, सफ़ाई), रेट्स, बिलिंग या किसी भी अन्य सवाल के बारे में पूछ सकते हैं!`,
      isSpecificMatch: true
    };
  }

  if (query.includes('thank') || query.includes('shukriya') || query.includes('dhanyawad') || query.includes('dhanyavad') ||
      query.includes('धन्यवाद') || query.includes('शुक्रिया') || query.includes('थैंक यू')) {
    return {
      text: `आपका बहुत-बहुत स्वागत है! 😊 यदि आपको कोई अन्य जानकारी या सेवा चाहिए, तो बेझिझक बताएं।`,
      isSpecificMatch: true
    };
  }

  if (query.includes('tum kaun') || query.includes('aap kaun') || query.includes('who are you') || query.includes('kya ho') ||
      query.includes('कौन हो') || query.includes('कौन हैं') || query.includes('क्या हो')) {
    return {
      text: `मैं **Atomic AI** हूँ—Atomic Solutions (देवघर एवं झारखंड) का ऑफिशियल AI असिस्टेंट।\n\nमैं होम मेंटेनेंस, AC रिपेयर, सिविल कंस्ट्रक्शन, बिजली वायरिंग, प्लंबिंग, डीप क्लीनिंग, रेट लिस्ट और बिलिंग से जुड़े किसी भी सवाल का सटीक उत्तर दे सकता हूँ।`,
      isSpecificMatch: true
    };
  }

  // 1. INTENT: Contact Details / Address / Phone / Email Query (SEPARATED & CLEAN)
  if (query.includes('contact') || query.includes('phone') || query.includes('call') || query.includes('number') || query.includes('address') || query.includes('location') || query.includes('deoghar') || query.includes('owner') || query.includes('mustak') || query.includes('founder') || query.includes('office')) {
    return {
      text: `🏢 **Atomic Solutions - Official Contact Details**:\n\n` +
            `• 📞 **Direct Call**: [${PHONE_NUMBER}](tel:${PHONE_NUMBER.replace(/\s+/g, '')})\n` +
            `• 💬 **WhatsApp Support**: [WhatsApp Us (${PHONE_NUMBER})](https://wa.me/${WHATSAPP_NUMBER})\n` +
            `• 📧 **Email**: ${FOUNDER_EMAIL}\n` +
            `• 📍 **Location**: Deoghar (${DEOGHAR_AREAS.slice(0, 5).join(', ')} & surrounding regions).\n` +
            `• ⏰ **Hours**: 8:00 AM - 9:00 PM (Daily)`,
      isSpecificMatch: true
    };
  }

  // 2. INTENT: Step-by-Step Installation Guidelines Process (SEPARATED & CLEAN)
  const installGuideText = getInstallationGuidelines(userText);
  if (installGuideText) {
    return { text: installGuideText, matchedTopic: 'installation_guidelines', isSpecificMatch: true };
  }

  // 3. INTENT: Material Calculation / Dimension Estimation (SEPARATED & CLEAN)
  const customEstimateText = calculateCustomEstimation(userText);
  if (customEstimateText) {
    return { text: customEstimateText, matchedTopic: 'custom_estimation', isSpecificMatch: true };
  }

  // 4. INTENT: Pricing / Rate List Lookup (SEPARATED & CLEAN)
  const rateListText = getServiceRateList(userText);
  if (rateListText) {
    return { text: rateListText, matchedTopic: 'rate_list', isSpecificMatch: true };
  }

  // 5. INTENT: Direct Service Booking (SEPARATED & CLEAN)
  const intent = detectBookingIntent(userText);
  if (intent) {
    return {
      text: `✅ **Direct Service Booking Request**\n\n` +
            `Requesting **${intent.subCategory}** (${intent.serviceName}).\n` +
            `📅 Schedule: ${intent.appointmentDate} at ${intent.appointmentTime}\n` +
            `💰 Price: ₹${intent.price.toLocaleString()}`,
      bookingIntent: intent,
      isSpecificMatch: true
    };
  }

  // 6. INTENT: Admin Stats Summary
  if (adminContext && (query.includes('stat') || query.includes('booking') || query.includes('bill') || query.includes('aaj') || query.includes('today') || query.includes('report'))) {
    return {
      text: `👑 **Admin Live Summary**\n\n` +
            `${adminContext.replace(/\[CRITICAL SYSTEM INFO:.*\]/g, '').trim()}`,
      isSpecificMatch: true
    };
  }

  // GST, Taxation & HSN/SAC Guidelines Intent
  if (query.includes('gst') || query.includes('tax') || query.includes('cgst') || query.includes('sgst') || query.includes('igst') || query.includes('hsn') || query.includes('sac') || query.includes('billing')) {
    return {
      text: `🧾 **GST & Tax Guidelines (Atomic Solutions)**:\n\n` +
            `1. **AC & Refrigeration Services/Installation**:\n` +
            `   - **GST Rate**: **18% GST** (9% CGST + 9% SGST for same state, or 18% IGST for inter-state).\n` +
            `   - **SAC Code**: \`998719\` (AC Repair & Servicing) or \`995461\` (Installation & Assembly).\n\n` +
            `2. **Spare Parts & Materials**:\n` +
            `   - **GST Rate**: **18% to 28% GST** depending on material category.\n` +
            `   - **HSN Codes**: Copper Pipe (\`7411\`), Refrigerant Gas (\`3824\`), Compressor (\`8414\`), Air Conditioners (\`8415\`).\n\n` +
            `3. **Electrical & Plumbing Services**:\n` +
            `   - **GST Rate**: **18% GST** (SAC Code \`9987\`).\n\n` +
            `4. **Invoice & Proforma Options**:\n` +
            `   - Our Billing Center supports **0% (Exempt), 5%, 12%, 18%, and 28% GST** options with CGST+SGST or IGST toggles.`,
      isSpecificMatch: true
    };
  }

  // Civil Construction & Home Maintenance Specific Q&A
  if (query.includes('eet') || query.includes('brick') || (query.includes('paani') && query.includes('lagane'))) {
    if (query.includes('din') || query.includes('rahe') || query.includes('jyada') || query.includes('zyada') || query.includes('agar')) {
      return {
        text: `🧱 **ईंट को 1 दिन या अधिक पानी में रखने पर क्या होता है?**\n\n` +
              `• **सामर्थ्य (Strength)**: 24 घंटे तक पानी में भिगोने से लाल ईंट पानी को पूरी तरह सोख लेती है। 1 दिन भिगोने से ईंट की मजबूती पर नकारात्मक प्रभाव नहीं पड़ता, लेकिन ईंट बहुत भारी हो जाती है और सूखने में ज्यादा समय लेती है।\n` +
              `• **मसाले के साथ बॉन्ड**: अत्यधिक गीली ईंट से सीमेंट-मसाला बह सकता है, इसलिए चुनाई से 2 घंटे पहले ईंट को पानी से निकालकर हल्का सतह सुखा लेना चाहिए (Surface Dry State)।\n` +
              `• **सुझाव**: दीवार चुनाई के लिए **2 से 4 घंटे** भिगोना ही सबसे आदर्श माना जाता है।`,
        isSpecificMatch: true
      };
    }
    return {
      text: `🧱 **ईंट (Bricks) को पानी में भिगोने की सही गाइड**:\n\n` +
            `• **समय (Duration)**: ईंटों को चुनाई/दीवार बनाने से पहले **कम से कम 2 से 4 घंटे** (या रात भर) पानी के हौज़ में पूरी तरह डुबोकर रखना चाहिए।\n` +
            `• **कारण (Why Necessary?)**:\n` +
            `  1. सूखी ईंट सीमेंट-मसाले (Mortar) का पानी तेज़ी से सोख लेती है जिससे मसाला जल्दी सूख जाता है और चिपकने की ताकत खत्म हो जाती है।\n` +
            `  2. भीगी ईंट सीमेंट के साथ मजबूत केमिकल बॉन्ड (Strong Bond) बनाती है और दीवार में भविष्य में दरारें (Cracks) नहीं आतीं।`,
      isSpecificMatch: true
    };
  }

  if (query.includes('plaster') || query.includes('ret') || query.includes('balu') || query.includes('sand')) {
    if (query.includes('moti') || query.includes('patli') || query.includes('kaun') || query.includes('konsi') || query.includes('which')) {
      return {
        text: `🧱 **प्लास्टर के लिए बालू का चुनाव (मोटी vs बारीक)**:\n\n` +
              `• **उत्तम चुनाव**: प्लास्टर के लिए **मध्यम से बारीक साफ छनी बालू (1.5mm - 2.0mm)** ही इस्तेमाल करें।\n` +
              `• **मोटी रेत क्यों नहीं?**: मोटी रेत से प्लास्टर की सतह खुरदरी हो जाती है, पुट्टी ज्यादा लगती है और फिनिशिंग खराब आती है।\n` +
              `• **बहुत पतली/मिट्टी वाली क्यों नहीं?**: इसमें धूल (silt) ज्यादा होती है जिससे सूखने पर प्लास्टर में दरारें (Hairline Cracks) आ जाती हैं।`,
        isSpecificMatch: true
      };
    }
    return {
      text: `🧱 **प्लास्टर (Plastering) के लिए सही रेत/बालू का चुनाव**:\n\n` +
            `• **सही बालू (Best Sand)**: प्लास्टर के लिए **मध्यम से बारीक साफ छनी हुई बालू (Medium-Fine Screened Sand - 1.5mm से 2.0mm)** सबसे उत्तम होती है।\n` +
            `• **बहुत मोटी रेत (Coarse Sand)**: केवल दीवार की जोड़ाई (Masonry) और छत की ढलाई (Slab) के लिए सही है; प्लास्टर में मोटी रेत से सतह खुरदरी और झड़ती है।\n` +
            `• **बहुत बारीक/मिट्टी वाली बालू (Dust/Silt Sand)**: प्लास्टर सूखने पर बाल जैसी दरारें (Hairline Cracks) पैदा करती है।\n` +
            `• **सही अनुपात (Mix Ratio)**: 1 बोरी सीमेंट + 4 बोरी साफ छनी बालू (1:4 का मसाला)।`,
      isSpecificMatch: true
    };
  }

  if (query.includes('jhadu') || query.includes('jharu') || query.includes('pocha') || query.includes('safai') || query.includes('clean') || query.includes('broom') || query.includes('sweep') || query.includes('mop') || (query.includes('ghar') && (query.includes('saaf') || query.includes('tarika')))) {
    if (query.includes('jhadu') || query.includes('jharu') || query.includes('broom') || query.includes('sweep')) {
      return {
        text: `🧹 **घर में झाड़ू लगाने का सही तरीका (Step-by-Step Sweeping Guide)**:\n\n` +
              `1. **ऊपर से नीचे नियम**: पहले पंखे, अलमारी की ऊपरी सतह और जाले साफ कर लें, ताकि गिरी हुई धूल बाद में झाड़ू में आ जाए।\n` +
              `2. **अंदर से बाहर की दिशा**: हमेशा कमरे के सबसे भीतरी कोने से शुरू करें और दरवाजे की तरफ कूड़ा लाएं।\n` +
              `3. **सही झाड़ू का चुनाव**:\n` +
              `   - **फूल झाड़ू (Soft Grass Broom)**: कमरे के टाइल्स, मार्बल और बारीक धूल के लिए सबसे अच्छी होती है।\n` +
              `   - **सींक झाड़ू (Coconut Broom)**: खुरदरे फर्श, बालकनी, छत और आँगन की सफाई के लिए।\n` +
              `4. **झाड़ू लगाने की तकनीक**: झाड़ू को हल्के हाथों से फर्श पर सटाकर एक ही दिशा में लंबे स्ट्रोक लगाएं, जोर से न फटकारें ताकि धूल हवा में न उड़े।\n` +
              `5. **डस्टपैन का उपयोग**: सारा कचरा एक जगह इकट्ठा करके तुरंत डस्टपैन से उठाकर ढक्कन वाले डस्टबिन में डालें।\n` +
              `6. **पोछा (Mopping)**: झाड़ू लगाने के बाद पानी में फिनाइल या लाइज़ोल डालकर पोंछा लगाएं।`,
        isSpecificMatch: true
      };
    }
    return {
      text: `🧹 **घर की गहरी सफ़ाई (Deep Cleaning) की सलाह**:\n\n` +
            `1. **Top-to-Bottom नियम**: हमेशा ऊपर से शुरू करें (पंखे, जाले) और अंत में फर्श झाड़ें।\n` +
            `2. **Microfiber Cloth**: धूल झाड़ने के लिए सूखे माइक्रोफ़ाइबर कपड़े का उपयोग करें।\n` +
            `3. **Disinfected Mopping**: गुनगुने पानी में लाइज़ोल/फिनाइल मिलाकर पोछा लगाएं।\n` +
            `4. **Kitchen/Bathroom**: बेकिंग सोडा और सिरका (Vinegar) से सिंक व टाइल्स की चिकनाई साफ़ करें।`,
      isSpecificMatch: true
    };
  }

  // 7. SPECIFIC TECHNICAL & ENGINEERING ANSWERS

  // AC Cooling Troubleshooting
  if (query.includes('cooling') || query.includes('cool') || query.includes('thanda') || (query.includes('ac') && (query.includes('problem') || query.includes('kharab') || query.includes('garam hawa') || query.includes('warm')))) {
    return {
      text: `❄️ **AC Not Cooling? Top 5 Reasons & Fixes**:\n\n` +
            `1. **Dirty Air Filters**: Check indoor unit mesh filters. Dhool jamne se airflow ruk jata hai. Har 15 din me dhoyen.\n` +
            `2. **Thermostat / Mode Setting**: Remote par check karein ki Mode **'COOL'** (Snowflake ❄️ icon) par ho aur temperature **24°C** set ho.\n` +
            `3. **Refrigerant Gas Leak**: Agar cooling coil ya copper pipe par barf (ice) jam rahi hai, to gas leak ho sakti hai. Gas top-up/repair required.\n` +
            `4. **Dirty Outdoor Unit**: Outdoor unit ki condenser coil dhool-mitti se block hone par compressor heat nahi nikal pata. Water jet wash karwayen.\n` +
            `5. **Faulty Capacitor / Compressor**: Fan chal raha hai lekin compressor start nahi ho raha to run capacitor check karwayen.`,
      isSpecificMatch: true
    };
  }

  // AC Water Leakage Troubleshooting
  if ((query.includes('ac') && (query.includes('leak') || query.includes('water') || query.includes('paani') || query.includes('tapak') || query.includes('chuna')))) {
    return {
      text: `💧 **AC Se Paani Tapakne (Water Leakage) Ki Wajah & Solution**:\n\n` +
            `1. **Choked Drain Pipe**: Indoor unit ki drain pipe me algae/kachra jam jata hai. Pipe ko blow karke flush karein.\n` +
            `2. **Improper Unit Slope (Leveling)**: Indoor unit drain pipe ki taraf halki jhuki honi chahiye. Agar level galat hai to water overflow karega.\n` +
            `3. **Evaporator Coil Par Barf Pighalna**: Low gas ya dirty filter ki wajah se coil freeze hoti hai, aur band karne par ek sath paani overflow hota hai.\n` +
            `4. **Broken Drain Tray**: Plastic drain pan me crack hone par technician se replacement karwayen.`,
      isSpecificMatch: true
    };
  }

  // Inverter vs Non-Inverter AC
  if (query.includes('inverter') && (query.includes('non') || query.includes('difference') || query.includes('fark') || query.includes('vs') || query.includes('kya hai'))) {
    return {
      text: `⚡ **Inverter AC vs Non-Inverter AC (Comparison)**:\n\n` +
            `• **Compressor**: Inverter AC ka compressor variable speed par chalta hai (band nahi hota, slow/fast hota hai). Non-inverter ON/OFF hota rehta hai.\n` +
            `• **Bijli Ki Bachat**: Inverter AC **30% se 40% bijli bachata hai**.\n` +
            `• **Cooling**: Inverter AC room temperature ko constant maintain rakhta hai, room temperature up-down nahi hota.\n` +
            `• **Awaaz (Noise)**: Inverter AC bohot quiet hota hai.\n` +
            `• **Recommendation**: Agar AC din me 6-8 ghante se zyada chalana hai to **Inverter AC best choice hai**.`,
      isSpecificMatch: true
    };
  }

  // Copper vs Aluminium Coil
  if (query.includes('copper') && (query.includes('aluminium') || query.includes('aluminum') || query.includes('coil') || query.includes('pipe') || query.includes('vs'))) {
    return {
      text: `🔧 **Copper Coil vs Aluminium Coil (Which is Better?)**:\n\n` +
            `• **Copper Coil (100% Recommended)**:\n` +
            `  - Heat transfer bohot tez hota hai, fast cooling deta hai.\n` +
            `  - Corrosion resistant hai aur leak hone par **welding/brazing se repair ho jata hai**.\n` +
            `  - Lifespan 10-15 saal hoti hai.\n` +
            `• **Aluminium Coil**:\n` +
            `  - Sasti hoti hai lekin jaldi corrode hoti hai aur repair karna lagbhag impossible hota hai (puri coil badalni padti hai).\n` +
            `• *Atomic Solutions Advice*: Hamesha **100% Copper Condenser & Evaporator Coil** wala AC hi chunein.`,
      isSpecificMatch: true
    };
  }

  // Fan Running Slow / Troubleshooting
  if ((query.includes('fan') || query.includes('pankha')) && (query.includes('slow') || query.includes('speed') || query.includes('dheema') || query.includes('capacitor'))) {
    return {
      text: `🌀 **Ceiling Fan Dheema Chal Raha Hai? Solutions**:\n\n` +
            `1. **Weak Capacitor (Sabse Common)**: 90% cases me **2.5 µF / 3.15 µF** ka capacitor weak ho jata hai. Naya capacitor (₹30-₹50) lagayein, speed wapas normal ho jayegi.\n` +
            `2. **Bearing Jam / Dryness**: Fan ghumane par jam lag raha hai ya awaaz kar raha hai to bearing me grease/oil dalein ya bearing badle.\n` +
            `3. **Low Voltage**: Low voltage check karein.\n` +
            `4. **Winding Issue**: Agar capacitor badalne ke baad bhi slow hai to auxiliary winding weak ho sakti hai.`,
      isSpecificMatch: true
    };
  }

  // MCB Tripping Troubleshooting
  if (query.includes('mcb') && (query.includes('trip') || query.includes('gir') || query.includes('problem') || query.includes('kyu'))) {
    return {
      text: `⚡ **MCB Bar-Bar Trip Hone Ki Wajah**:\n\n` +
            `1. **Circuit Overload**: Ek hi line par AC, Geyser, Heater ek sath chalane se load capacity se zyada ho jata hai.\n` +
            `2. **Short Circuit**: Kisi appliance me ya wire me Neutral aur Phase aapas me touch ho rahe hain.\n` +
            `3. **Earth Leakage**: Geyser element ya cooler pump me current leak hone par ELCB/RCCB trip hoti hai.\n` +
            `4. **Faulty MCB**: Purani ya weak MCB heat hokar normal load par bhi trip hone lagti hai.\n` +
            `• *Safety Tip*: MCB ko zabardasti daba kar na chalayein; pehle fault find karein.`,
      isSpecificMatch: true
    };
  }

  // Earthing Importance
  if (query.includes('earthing') || query.includes('earth') || query.includes('current lagta') || query.includes('shock')) {
    return {
      text: `🛡️ **Ghar Me Proper Earthing Kyu Zaroori Hai?**:\n\n` +
            `• **Shock Protection**: Fridge, Washing Machine, Geyser ki metallic body me current aane par earthing use safe ground kar deti hai.\n` +
            `• **Appliance Safety**: Lightning (aasmani bijli) aur voltage surges se PCB boards jalne se bachte hain.\n` +
            `• **Neutral-Earth Voltage**: Healthy earthing me Neutral aur Earth ke beech voltage **2 Volt se kam** honi chahiye.`,
      isSpecificMatch: true
    };
  }

  // Geyser Not Heating
  if (query.includes('geyser') && (query.includes('garam') || query.includes('heat') || query.includes('problem') || query.includes('pani'))) {
    return {
      text: `🚿 **Geyser Paani Garam Nahi Kar Raha? Quick Check**:\n\n` +
            `1. **Thermostat Trip Button**: Geyser ke bottom panel me ek chhota red/black reset button hota hai. Agar high heat par trip hua ho to press karein.\n` +
            `2. **Heating Element Burnout**: Hard water ki wajah se element par scale jam kar coil jal jati hai (Replacement: ₹400-₹800).\n` +
            `3. **Power Socket**: 16A ka power plug socket jal gaya ho to check karein.`,
      isSpecificMatch: true
    };
  }

  // Refrigerator Not Cooling
  if ((query.includes('fridge') || query.includes('refrigerator')) && (query.includes('cool') || query.includes('thanda') || query.includes('ice') || query.includes('barf'))) {
    return {
      text: `🧊 **Fridge Cooling Problem & Solution**:\n\n` +
            `1. **Back Condenser Coils**: Fridge ke peeche ki jaali/coils par dhool jamne se heat transfer nahi hota. Safai karein.\n` +
            `2. **Door Gasket (Rubber)**: Door rubber loose hone par bahar ki garam hawa andar aati rehti hai.\n` +
            `3. **Defrost Timer / Bi-metal (Frost Free)**: Freezer me barf jam gayi hai lekin neeche cooling nahi ho rahi to defrost system check karwayen.\n` +
            `4. **Relay / Gas Leakage**: Compressor sound nahi kar raha to relay badle; continuous chal raha hai fir bhi thanda nahi to gas leak hai.`,
      isSpecificMatch: true
    };
  }

  // AC Tonnage Advice
  if (query.includes('1 ton') || query.includes('1.5 ton') || query.includes('2 ton') || query.includes('tonnage') || (query.includes('ac') && (query.includes('room') || query.includes('size') || query.includes('kitne') || query.includes('bade')))) {
    return {
      text: `❄️ **AC Tonnage Guide**:\n\n` +
            `• **1.0 Ton AC**: Rooms up to **120 Sq. Ft.** (10x10 ft / 10x12 ft).\n` +
            `• **1.5 Ton AC**: Rooms **120 - 180 Sq. Ft.** (12x14 ft / 12x15 ft).\n` +
            `• **2.0 Ton AC**: Rooms **180 - 250 Sq. Ft.** (15x16 ft).\n` +
            `• ☀️ *Sun-facing / Top floor*: Add **+0.5 Ton extra** for summer cooling.`,
      isSpecificMatch: true
    };
  }

  // Bricks Calculation Guide
  if (query.includes('eet') || query.includes('brick') || query.includes('cement') || query.includes('sand') || query.includes('mortar')) {
    return {
      text: `🧱 **Brickwork & Civil Material Guide**:\n\n` +
            `• **9-Inch Main Wall**: Approx **500 Red Bricks** per 100 Sq. Ft wall area.\n` +
            `• **4.5-Inch Partition Wall**: Approx **250 Red Bricks** per 100 Sq. Ft.\n` +
            `• **Cement**: 1 bag cement binds ~20 Sq. Ft wall (1:6 mortar mix).\n` +
            `• **Sand**: Approx 15-20 Cu. Ft per 100 Sq. Ft.`,
      isSpecificMatch: true
    };
  }

  // Electrical Wiring Guide
  if (query.includes('wire') || query.includes('wiring') || query.includes('electric') || query.includes('load') || query.includes('gauge')) {
    return {
      text: `⚡ **Electrical Wire Gauge Standard**:\n\n` +
            `• **1.5 sq mm**: Lighting & Fans\n` +
            `• **2.5 sq mm**: Power Sockets (TV, Refrigerator)\n` +
            `• **4.0 sq mm**: Heavy Loads (1.5T/2T AC, Geyser, Microwave)\n` +
            `• **6.0 sq mm**: Main Line from Meter to MCB DB\n` +
            `• Concealed Wiring Rate: **₹180 - ₹250 / Sq. Ft**`,
      isSpecificMatch: true
    };
  }

  // Plumbing Guide
  if (query.includes('plumb') || query.includes('pipe') || query.includes('leak') || query.includes('tank')) {
    return {
      text: `🔧 **Plumbing Setup Guide**:\n\n` +
            `• Water Tank: 1000L Overhead Tank recommended for 4-6 members.\n` +
            `• Piping: CPVC for internal hot/cold lines & UPVC for main line.\n` +
            `• Bathroom Internal Piping: **₹12,000 - ₹18,000** per bathroom.`,
      isSpecificMatch: true
    };
  }

  // Painting Guide
  if (query.includes('paint') || query.includes('putty') || query.includes('primer') || query.includes('color')) {
    return {
      text: `🎨 **Painting & Putty Guide**:\n\n` +
            `• Wall Area Formula: Total Paintable Area ≈ Carpet Area × 3.5\n` +
            `• Coverage: Premium Emulsion covers ~120-140 Sq. Ft per Liter (2 coats).\n` +
            `• Acrylic Wall Putty: **₹10 - ₹15 / Sq. Ft** (2 coats).`,
      isSpecificMatch: true
    };
  }

  // Tiles & Marble Guide
  if (query.includes('tile') || query.includes('tiles') || query.includes('marble') || query.includes('granite')) {
    return {
      text: `🧱 **Tiles & Marble Guide**:\n\n` +
            `• Vitrified Floor Tile Laying: **₹45 - ₹75 / Sq. Ft**\n` +
            `• Marble Polishing: **₹50 - ₹80 / Sq. Ft**`,
      isSpecificMatch: true
    };
  }

  // False Ceiling Guide
  if (query.includes('ceiling') || query.includes('pop') || query.includes('gypsum')) {
    return {
      text: `✨ **False Ceiling Guide**:\n\n` +
            `• Gypsum Board Ceiling (Saint Gobain): **₹95 - ₹130 / Sq. Ft**\n` +
            `• PVC Waterproof Ceiling: **₹75 - ₹105 / Sq. Ft**`,
      isSpecificMatch: true
    };
  }

  // Carpentry Guide
  if (query.includes('kitchen') || query.includes('wardrobe') || query.includes('furniture') || query.includes('carpenter')) {
    return {
      text: `🪵 **Woodwork Guide**:\n\n` +
            `• Modular Kitchen: **₹85,000 - ₹2,50,000**\n` +
            `• Custom Wardrobe: **₹1,200 - ₹1,800 / Sq. Ft**`,
      isSpecificMatch: true
    };
  }

  // 8. General Multilingual Knowledge Fallback
  const isHindi = /[\u0900-\u097F]/.test(userText) || /\b(namaste|kaise|kya|haan|kaam|batao|karo|bhai|hello|hi|rate|price|kitna|kyu|kyun)\b/i.test(userText);

  if (isHindi) {
    return {
      text: `मैं Atomic Solutions का AI असिस्टेंट हूँ। आप मुझसे किसी भी काम (जैसे AC, वायरिंग, पंखा, प्लंबिंग, टाइल्स, सफ़ाई, ईंट, प्लास्टर, रेट लिस्ट व बिलिंग) या किसी भी अन्य सवाल के बारे में पूछ सकते हैं—मैं आपकी पूरी सहायता करूँगा!`,
      isSpecificMatch: false
    };
  }

  return {
    text: `I am the AI assistant for Atomic Solutions. Feel free to ask about any topic including AC service, wiring, plumbing, cleaning, construction, rate cards, or any general query!`,
    isSpecificMatch: false
  };
}

/**
 * Real-time Web Knowledge Search Engine
 * Fetches accurate, encyclopedic answers from DuckDuckGo & Wikipedia instantly
 */
export async function searchWebKnowledge(query: string): Promise<{ text: string; source: string } | null> {
  const cleanQ = query.replace(/[?.,!]/g, '').trim();
  if (!cleanQ || cleanQ.length < 3) return null;

  // 1. Try DuckDuckGo Instant Answer API
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQ)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(ddgUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.AbstractText && data.AbstractText.length > 30) {
        return { text: data.AbstractText, source: data.AbstractSource || 'Web Knowledge' };
      }
      if (data.Answer && String(data.Answer).length > 5) {
        return { text: String(data.Answer), source: 'Instant Answer' };
      }
      if (data.RelatedTopics && data.RelatedTopics.length > 0 && data.RelatedTopics[0].Text) {
        return { text: data.RelatedTopics[0].Text, source: 'Web Summary' };
      }
    }
  } catch (e) {}

  // 2. Try Wikipedia Search & Summary API
  try {
    const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQ)}&limit=1&format=json&origin=*`;
    const searchRes = await fetch(wikiSearchUrl);
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const title = searchData[1]?.[0];
      if (title) {
        const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if (summaryRes.ok) {
          const summary = await summaryRes.json();
          if (summary.extract && summary.extract.length > 30) {
            return { text: summary.extract, source: `Wikipedia (${title})` };
          }
        }
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Unified Smart AI Response Generator
 * Combines in-house HVAC/Engineering knowledge with live web search
 */
export async function generateSmartAIResponse(userText: string, adminContext?: string): Promise<{ text: string; source?: string }> {
  // 1. Check local knowledge engine
  const localResult = generateLocalAIResponse(userText, adminContext);

  // If local result matched a specific topic (not generic fallback), return immediately
  if (localResult.isSpecificMatch) {
    return { text: localResult.text, source: 'Atomic Knowledge' };
  }

  // 2. If it's a general question, search live web knowledge
  try {
    const webResult = await searchWebKnowledge(userText);
    if (webResult && webResult.text) {
      const formatted = `💡 **Instant Answer** (${webResult.source}):\n\n${webResult.text}\n\n---\n*Aap is baare me ya Atomic Solutions ki services ke baare me kuch aur poochna chahte hain?*`;
      return { text: formatted, source: webResult.source };
    }
  } catch (e) {}

  // 3. Fallback to local guide
  return { text: localResult.text };
}
