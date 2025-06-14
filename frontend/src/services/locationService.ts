// Location Service - Handles GPS and venue detection
import { api } from './api';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  distance?: number;
  isActive: boolean;
  currentEvent?: {
    id: string;
    name: string;
    startTime: Date;
    endTime: Date;
    artists: string[];
  };
}

class LocationService {
  private watchId: number | null = null;
  private lastKnownPosition: Coordinates | null = null;

  // Get current position
  async getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          this.lastKnownPosition = coords;
          resolve(coords);
        },
        error => {
          reject(this.handleGeolocationError(error));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    });
  }

  // Watch position changes
  watchPosition(callback: (coords: Coordinates) => void): void {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }

    this.watchId = navigator.geolocation.watchPosition(
      position => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        this.lastKnownPosition = coords;
        callback(coords);
      },
      error => {
        console.error(
          'Watch position error:',
          this.handleGeolocationError(error)
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }

  // Stop watching position
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

// Get nearby venues
  async getNearbyVenues(coordinates?: Coordinates): Promise<Venue[]> {
    try {
      const position =
        coordinates || this.lastKnownPosition || (await this.getCurrentPosition());
      const response = await api.get('/api/venues/nearby', {
        params: {
          lat: position.latitude,
          lon: position.longitude,
          radius: 5000, // 5km radius
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby venues:', error);
      throw error;
    }
  }

  // Get specific venue details
  async getVenueDetails(venueId: string): Promise<Venue> {
    try {
      const response = await api.get(`/api/venues/${venueId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching venue details:', error);
      throw error;
    }
  }

  // Search venues by query, genre, or city
  async searchVenues(query: string, genre?: string, city?: string): Promise<Venue[]> {
    try {
      const response = await api.get('/api/venues/search', {
        params: {
          q: query,
          genre,
          city
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching venues:', error);
      throw error;
    }
  }

  // Get last known position
  getLastKnownPosition(): Coordinates | null {
    return this.lastKnownPosition;
  }

  // Handle geolocation errors
  private handleGeolocationError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error(
          'Location permission denied. Please enable location access.'
        );
      case error.POSITION_UNAVAILABLE:
        return new Error('Location information is unavailable.');
      case error.TIMEOUT:
        return new Error('Location request timed out.');
      default:
        return new Error('An unknown error occurred while getting location.');
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(coords2.latitude - coords1.latitude);
    const dLon = this.toRad(coords2.longitude - coords1.longitude);
    const lat1 = this.toRad(coords1.latitude);
    const lat2 = this.toRad(coords2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}

export const locationService = new LocationService();
