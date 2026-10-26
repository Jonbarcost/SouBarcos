/** Display helpers for the hero HUD. Pure functions, no location is stored. */
export const BRASILIA = { lat: -15.7939, lng: -47.8828 };

export function dms(value: number, positive: string, negative: string) {
  const abs = Math.abs(value);
  const total = Math.round(abs * 60);
  const [d, m] = [Math.floor(total / 60), total % 60];
  return `${value >= 0 ? positive : negative} ${d}°${String(m).padStart(2, "0")}′`;
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)));
}
