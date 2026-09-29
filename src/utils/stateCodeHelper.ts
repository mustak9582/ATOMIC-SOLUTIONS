export const indianStateCodes: Record<string, { code: string; name: string }> = {
  '01': { code: '01', name: 'Jammu & Kashmir' },
  '02': { code: '02', name: 'Himachal Pradesh' },
  '03': { code: '03', name: 'Punjab' },
  '04': { code: '04', name: 'Chandigarh' },
  '05': { code: '05', name: 'Uttarakhand' },
  '06': { code: '06', name: 'Haryana' },
  '07': { code: '07', name: 'Delhi' },
  '08': { code: '08', name: 'Rajasthan' },
  '09': { code: '09', name: 'Uttar Pradesh' },
  '10': { code: '10', name: 'Bihar' },
  '11': { code: '11', name: 'Sikkim' },
  '12': { code: '12', name: 'Arunachal Pradesh' },
  '13': { code: '13', name: 'Nagaland' },
  '14': { code: '14', name: 'Manipur' },
  '15': { code: '15', name: 'Mizoram' },
  '16': { code: '16', name: 'Tripura' },
  '17': { code: '17', name: 'Meghalaya' },
  '18': { code: '18', name: 'Assam' },
  '19': { code: '19', name: 'West Bengal' },
  '20': { code: '20', name: 'Jharkhand' },
  '21': { code: '21', name: 'Odisha' },
  '22': { code: '22', name: 'Chhattisgarh' },
  '23': { code: '23', name: 'Madhya Pradesh' },
  '24': { code: '24', name: 'Gujarat' },
  '26': { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  '27': { code: '27', name: 'Maharashtra' },
  '28': { code: '28', name: 'Andhra Pradesh' },
  '29': { code: '29', name: 'Karnataka' },
  '30': { code: '30', name: 'Goa' },
  '31': { code: '31', name: 'Lakshadweep' },
  '32': { code: '32', name: 'Kerala' },
  '33': { code: '33', name: 'Tamil Nadu' },
  '34': { code: '34', name: 'Puducherry' },
  '35': { code: '35', name: 'Andaman & Nicobar Islands' },
  '36': { code: '36', name: 'Telangana' },
  '37': { code: '37', name: 'Andhra Pradesh' },
  '38': { code: '38', name: 'Ladakh' }
};

export const autoDetectStateCode = (val: string): string => {
  if (!val) return '';
  const trimmed = val.trim();

  // If already formatted like "Delhi 07" or "Delhi - 07", standardize to "Delhi 07"
  if (/^[A-Za-z\s&()]+\s+[-–]?\s*\d{2}$/.test(trimmed)) {
    return trimmed.replace(/\s+[-–]\s*/, ' ');
  }

  // 1. Check if input is GSTIN (e.g. 07AAAAA1234A1Z5)
  if (/^\d{2}[A-Za-z0-9]{13}$/i.test(trimmed)) {
    const code = trimmed.substring(0, 2);
    if (indianStateCodes[code]) {
      return `${indianStateCodes[code].name} ${code}`;
    }
  }

  // 2. Check if input starts with 2 digits
  const leadingDigits = trimmed.match(/^(\d{2})\b/);
  if (leadingDigits && indianStateCodes[leadingDigits[1]]) {
    const st = indianStateCodes[leadingDigits[1]];
    return `${st.name} ${st.code}`;
  }

  // 3. Search by State Name
  const lower = trimmed.toLowerCase();

  // City / Alias quick mappings
  if (/\b(delhi|new delhi|ncr)\b/i.test(lower)) return 'Delhi 07';
  if (/\b(jharkhand|deoghar|ranchi|dhanbad|jamshedpur|bokaro)\b/i.test(lower)) return 'Jharkhand 20';
  if (/\b(bihar|patna|gaya|muzaffarpur|bhagalpur)\b/i.test(lower)) return 'Bihar 10';
  if (/\b(up|uttar pradesh|noida|ghaziabad|kanpur|lucknow|varanasi|moradabad|agra)\b/i.test(lower)) return 'Uttar Pradesh 09';
  if (/\b(west bengal|bengal|kolkata|calcutta|howrah)\b/i.test(lower)) return 'West Bengal 19';
  if (/\b(maharashtra|mumbai|pune|nagpur|thane)\b/i.test(lower)) return 'Maharashtra 27';
  if (/\b(karnataka|bangalore|bengaluru|mysore)\b/i.test(lower)) return 'Karnataka 29';
  if (/\b(tamil nadu|chennai|coimbatore)\b/i.test(lower)) return 'Tamil Nadu 33';
  if (/\b(haryana|gurgaon|gurugram|faridabad|ambala)\b/i.test(lower)) return 'Haryana 06';
  if (/\b(punjab|ludhiana|amritsar|jalandhar)\b/i.test(lower)) return 'Punjab 03';
  if (/\b(rajasthan|jaipur|udaipur|jodhpur|kota)\b/i.test(lower)) return 'Rajasthan 08';
  if (/\b(gujarat|ahmedabad|surat|vadodara)\b/i.test(lower)) return 'Gujarat 24';
  if (/\b(mp|madhya pradesh|indore|bhopal|gwalior)\b/i.test(lower)) return 'Madhya Pradesh 23';
  if (/\b(odisha|orissa|bhubaneswar|cuttack)\b/i.test(lower)) return 'Odisha 21';
  if (/\b(chhattisgarh|raipur|bilaspur)\b/i.test(lower)) return 'Chhattisgarh 22';
  if (/\b(kerala|thiruvananthapuram|kochi)\b/i.test(lower)) return 'Kerala 32';
  if (/\b(telangana|hyderabad|secunderabad)\b/i.test(lower)) return 'Telangana 36';
  if (/\b(assam|guwahati|dispur)\b/i.test(lower)) return 'Assam 18';
  if (/\b(uttarakhand|dehradun|haridwar)\b/i.test(lower)) return 'Uttarakhand 05';

  for (const st of Object.values(indianStateCodes)) {
    if (st.name.toLowerCase().includes(lower) || lower.includes(st.name.toLowerCase())) {
      return `${st.name} ${st.code}`;
    }
  }

  return trimmed;
};
