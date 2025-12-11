import { ref } from 'vue';
import { isServer } from '@/services/helpersRuntime';

const lat = ref<number | null>(null);
const lon = ref<number | null>(null);
const supported = typeof navigator !== 'undefined' && !!navigator.geolocation;

// PUBLIC_INTERFACE
export function useGeo() {
  /** PUBLIC_INTERFACE: Simple runtime coordinate store with request method. */
  async function request(): Promise<{ lat: number; lon: number } | null> {
    if (isServer() || !supported) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          lat.value = pos.coords.latitude;
          lon.value = pos.coords.longitude;
          resolve({ lat: lat.value!, lon: lon.value! });
        },
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    });
  }

  return {
    supported,
    lat,
    lon,
    request,
  };
}
