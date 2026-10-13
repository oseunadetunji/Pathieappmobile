import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { GOOGLE_PLACES_API_KEY } from '../config.local';

// Geocoding that works on web AND native.
// - Native: expo-location (device geocoder).
// - Web: typed-location search uses Google Places API (New) text search (same
//   key as Find Providers). Reverse lookup (one call per "Use current location"
//   click) uses OpenStreetMap Nominatim, which allows light interactive use.

const NOMINATIM = 'https://nominatim.openstreetmap.org';

function fromNominatim(item) {
  const a = item.address || {};
  const city = a.city || a.town || a.village || a.hamlet || a.municipality || a.suburb || a.county || '';
  const region = a.state || a.province || a.region || '';
  const country = a.country || '';
  return {
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    city,
    region,
    country,
    postalCode: a.postcode || '',
    displayName: [city, region, country].filter(Boolean).join(', ') || item.display_name || '',
  };
}

function fromExpoAddress(coords, addr) {
  const city = addr?.city || addr?.subregion || '';
  const region = addr?.region || '';
  const country = addr?.country || '';
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    city,
    region,
    country,
    postalCode: addr?.postalCode || '',
    displayName: [city, region, country].filter(Boolean).join(', '),
  };
}

// Google Places (New) result -> our place shape
function fromGooglePlace(p) {
  const comps = p.addressComponents || [];
  const pick = (type) => {
    const c = comps.find((x) => (x.types || []).includes(type));
    return c ? c.longText : '';
  };
  const city = pick('locality') || pick('postal_town') || pick('sublocality') || pick('administrative_area_level_2');
  const region = pick('administrative_area_level_1');
  const country = pick('country');
  return {
    latitude: p.location.latitude,
    longitude: p.location.longitude,
    city,
    region,
    country,
    postalCode: pick('postal_code'),
    displayName: [city, region, country].filter(Boolean).join(', ') || p.formattedAddress || '',
  };
}

async function googleSearch(q, limit) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.location,places.addressComponents,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: q, maxResultCount: Math.min(limit * 2, 10) }),
  });
  if (!res.ok) throw new Error(`Location search failed (${res.status})`);
  const data = await res.json();
  const seen = new Set();
  return (data.places || [])
    .filter((p) => p.location)
    .map(fromGooglePlace)
    .filter((p) => {
      if (!p.city || seen.has(p.displayName)) return false;
      seen.add(p.displayName);
      return true;
    })
    .slice(0, limit);
}

// Text -> list of places (best first).
export async function geocodeSearch(text, limit = 5) {
  const q = (text || '').trim();
  if (!q) return [];

  if (Platform.OS === 'web') {
    return googleSearch(q, limit);
  }

  const results = await Location.geocodeAsync(q);
  const out = [];
  for (const r of (results || []).slice(0, limit)) {
    try {
      const addr = await Location.reverseGeocodeAsync({ latitude: r.latitude, longitude: r.longitude });
      out.push(fromExpoAddress(r, addr && addr[0]));
    } catch (e) {
      // skip unresolved result
    }
  }
  return out;
}

// Coordinates -> place (or null).
export async function reverseLookup(latitude, longitude) {
  if (Platform.OS === 'web') {
    const url = `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Reverse geocoding failed (${res.status})`);
    const data = await res.json();
    return data && data.address ? fromNominatim(data) : null;
  }
  const addr = await Location.reverseGeocodeAsync({ latitude, longitude });
  return addr && addr.length ? fromExpoAddress({ latitude, longitude }, addr[0]) : null;
}

// Device position. Throws an Error whose .code is 'denied' | 'unavailable' | 'timeout'.
export async function getDeviceCoords() {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const e = new Error('Geolocation not supported'); e.code = 'unavailable'; throw e;
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => {
          const e = new Error(err.message || 'Could not get position');
          e.code = err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable';
          reject(e);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    });
  }
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    const e = new Error('Permission denied'); e.code = 'denied'; throw e;
  }
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
}
