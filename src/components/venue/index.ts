// Venue component exports - Clean, organized barrel exports
export { default as VenueFeatures } from './VenueFeatures';

// Venue utility functions
export const venueUtils = {
  generateVenueId: () => `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  getVenueIcon: (type: string) => {
    const icons: Record<string, string> = {
      'club': '🎪',
      'bar': '🍺', 
      'festival': '🎪',
      'street': '🛣️',
      'theater': '🎭',
      'cafe': '☕'
    };
    return icons[type] || '🏢';
  },
  
  formatVenueType: (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1');
  },
  
  calculateVenueCapacity: (type: string) => {
    const capacities: Record<string, number> = {
      'club': 200,
      'bar': 100,
      'festival': 1000,
      'street': 50,
      'theater': 300,
      'cafe': 30
    };
    return capacities[type] || 100;
  },
  
  getVenueFeatures: (type: string) => {
    const features: Record<string, string[]> = {
      'club': ['Sound System', 'Lighting', 'Stage', 'Bar'],
      'bar': ['Sound System', 'Bar', 'Seating'],
      'festival': ['Multiple Stages', 'Sound System', 'Food Vendors'],
      'street': ['Open Air', 'Public Space'],
      'theater': ['Stage', 'Seating', 'Sound System', 'Lighting'],
      'cafe': ['Intimate Setting', 'Seating', 'Beverages']
    };
    return features[type] || ['Basic Amenities'];
  }
};