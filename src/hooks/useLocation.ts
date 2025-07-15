import { useState, useEffect, useCallback } from 'react';

interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationError {
  code: number;
  message: string;
}

interface UseLocationReturn {
  location: LocationCoordinates | null;
  error: LocationError | null;
  loading: boolean;
  requestLocation: () => void;
  hasPermission: boolean | null;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser'
      });
      return;
    }

    setLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setHasPermission(true);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError({
          code: err.code,
          message: getLocationErrorMessage(err.code)
        });
        setHasPermission(false);
        setLoading(false);
      },
      options
    );
  }, []);

  // Check permission status on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setHasPermission(result.state === 'granted');
        
        if (result.state === 'granted') {
          requestLocation();
        }
      });
    }
  }, [requestLocation]);

  return {
    location,
    error,
    loading,
    requestLocation,
    hasPermission
  };
}

function getLocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Location access denied by user';
    case 2:
      return 'Location information unavailable';
    case 3:
      return 'Location request timed out';
    default:
      return 'An unknown location error occurred';
  }
}

// Utility function to calculate distance between two points
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return 'Very close';
  } else if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km away`;
  } else {
    return `${Math.round(distanceKm)}km away`;
  }
}