
/**
 * Location Service
 * Handles Geolocation detection and Reverse Geocoding
 */

// Use the keys defined in vite.config.ts or vite env
const isInvalidValue = (val: any) => {
  if (!val) return true;
  if (typeof val !== 'string') return false;
  const v = val.toLowerCase();
  return v === '' || v === 'undefined' || v === 'null' || v.includes('placeholder') || v.includes('your_');
};

const getGoogleMapsKey = (): string => {
  const key = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || 
              (process.env.VITE_GOOGLE_MAPS_API_KEY) || 
              (process.env.GOOGLE_MAPS_PLATFORM_KEY) || 
              '';
  return key;
};

export interface DetectedLocation {
  lat: number;
  lng: number;
  address?: string;
}

/**
 * Get current coordinates using Browser Geolocation API
 */
export const getCurrentCoordinates = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    // Try with high accuracy first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        // Fallback to low accuracy if high accuracy fails or times out
        console.warn('High accuracy geolocation failed, trying low accuracy...', error);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          (err2) => {
            reject(err2);
          },
          { enableHighAccuracy: false, timeout: 20000 }
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
};

/**
 * Reverse Geocode coordinates to address using Google Maps Geocoding API
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const key = getGoogleMapsKey();
  
  if (isInvalidValue(key)) {
    console.error('Google Maps API Key is missing or invalid! Reverse geocoding will not work. Please add VITE_GOOGLE_MAPS_API_KEY to environment.');
    return '';
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else {
      console.warn('Reverse Geocoding API returned status:', data.status, data.error_message || '');
      return '';
    }
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return '';
  }
};

/**
 * Detect full location (Coords + Address)
 */
export const detectFullLocation = async (): Promise<DetectedLocation> => {
  const coords = await getCurrentCoordinates();
  const address = await reverseGeocode(coords.lat, coords.lng);
  return {
    ...coords,
    address,
  };
};

/**
 * Calculate distance between two points in KM
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};
