import React, { useState, useEffect } from 'react';
import {
  locationService,
  Venue,
} from '../../services/locationService';

interface VenuePickerProps {
  onVenueSelect: (venue: Venue) => void;
  onClose?: () => void;
}

export const VenuePicker: React.FC<VenuePickerProps> = ({
  onVenueSelect,
  onClose,
}) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    'pending' | 'granted' | 'denied'
  >('pending');
  const [manualSearch, setManualSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    // Initial load will show location prompt, no immediate API call needed
    setLoading(false);
  }, []);

  const detectNearbyVenues = async () => {
    setLoading(true);
    setError(null);
    setShowLocationPrompt(false);

    try {
      const coords = await locationService.getCurrentPosition();
      setLocationPermission('granted');

      const nearbyVenues = await locationService.getNearbyVenues(coords);

      if (nearbyVenues.length === 0) {
        setError('No active venues found nearby.');
        setVenues([]);
      } else {
        setVenues(nearbyVenues);
        const activeVenue = Array.isArray(nearbyVenues) ? nearbyVenues.find(v => v.isActive) : undefined;
        if (activeVenue) {
          setSelectedVenue(activeVenue);
        }
      }
    } catch (error) {
      setLocationPermission('denied');
      setError(error instanceof Error ? error.message : 'Failed to get location');
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualSearch.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const searchResults = await locationService.searchVenues(manualSearch);

      if (searchResults.length === 0) {
        setError('No venues found matching your search');
        setVenues([]);
      } else {
        setVenues(searchResults);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search failed');
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    onVenueSelect(venue);
    if (onClose) onClose();
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal venue-picker-modal" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div className="card-header text-center">
          <div className="mb-md">
            <h2 className="font-display text-3xl text-primary mb-sm">Find Venues</h2>
            <p className="text-gray-600">Discover live music near you</p>
          </div>
          {onClose && (
            <button
              className="btn btn-ghost p-sm rounded-full absolute top-4 right-4"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        <div className="card-body">
          {/* Location Prompt */}
          {showLocationPrompt && locationPermission === 'pending' && (
            <div className="card mb-xl mx-auto" style={{ background: 'linear-gradient(135deg, #fff8f3 0%, #fff0e6 100%)', border: '2px solid var(--accent)', maxWidth: '500px' }}>
              <div className="card-body text-center py-2xl">
                <div className="text-6xl mb-lg">🌍</div>
                <h3 className="font-display text-2xl text-primary mb-md">Find Venues Near You</h3>
                <p className="text-gray-600 mb-xl leading-relaxed">
                  Allow location access to discover live music venues in your area,
                  or browse our featured venues below.
                </p>
                <div className="flex gap-md justify-center flex-wrap">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={detectNearbyVenues}
                  >
                    📍 Use My Location
                  </button>
                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={() => setShowLocationPrompt(false)}
                  >
                    Browse Venues
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-xl max-w-md mx-auto">
            <div className={`flex gap-sm transition ${searchFocused ? 'shadow-glow' : ''}`}>
              <div className="flex-1 relative">
                <input
                  type="text"
                  className="input w-full text-center"
                  placeholder="Search by venue name or address..."
                  value={manualSearch}
                  onChange={e => setManualSearch(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleManualSearch()}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleManualSearch}
                disabled={!manualSearch.trim()}
              >
                Search
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-container text-center py-4xl">
              <div className="loading-spinner mx-auto mb-lg"></div>
              <p className="text-gray-600 text-lg">Finding venues...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-container mb-xl">
              <div className="flex items-center gap-sm">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-medium">{error}</p>
                  {locationPermission === 'denied' && (
                    <p className="text-sm mt-xs text-gray-600">
                      Enable location access in your browser settings for automatic venue detection.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Venues List */}
          {!loading && venues.length > 0 && (
            <div className="space-y-md">
              <h3 className="font-display text-lg text-primary mb-md">
                {locationPermission === 'granted' ? 'Nearby Venues' : 'Featured Venues'}
              </h3>

              <div className="space-y-sm max-h-96 overflow-y-auto">
                {venues.map(venue => (
                  <div
                    key={venue.id}
                    className={`card cursor-pointer transition group ${
                      selectedVenue?.id === venue.id
                        ? 'border-accent shadow-glow'
                        : 'hover:shadow-lg hover:border-accent'
                    }`}
                    onClick={() => handleVenueSelect(venue)}
                  >
                    <div className="card-body">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-sm mb-sm">
                            <h4 className="font-display text-lg text-primary group-hover:text-accent transition">
                              {venue.name}
                            </h4>
                            {venue.isActive && (
                              <div className="status-indicator status-live">
                                <span>LIVE</span>
                              </div>
                            )}
                          </div>

                          <p className="text-gray-600 text-sm mb-sm flex items-center gap-xs">
                            📍 {venue.address}
                          </p>

                          {venue.distance && (
                            <p className="text-gray-500 text-xs">
                              {formatDistance(venue.distance)}
                            </p>
                          )}

                          {venue.isActive && venue.currentEvent && (
                            <div className="mt-md p-md bg-light rounded-lg">
                              <div className="flex items-center gap-sm mb-xs">
                                <span className="text-lg">🎵</span>
                                <h5 className="font-medium text-primary">
                                  {venue.currentEvent.name}
                                </h5>
                              </div>
                              <p className="text-sm text-gray-600">
                                🎤 {venue.currentEvent.artists.join(' • ')}
                              </p>
                            </div>
                          )}

                          {!venue.isActive && (
                            <div className="mt-sm">
                              <span className="text-xs text-gray-500 bg-gray-100 px-md py-xs rounded-full">
                                No live events
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="ml-md flex-shrink-0">
                          {selectedVenue?.id === venue.id ? (
                            <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full group-hover:border-accent transition"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && venues.length === 0 && !error && (
            <div className="empty-state text-center py-4xl">
              <div className="text-6xl mb-lg">🎵</div>
              <h3 className="font-display text-2xl text-primary mb-md">No Venues Found</h3>
              <p className="text-gray-600 mb-xl max-w-md mx-auto">
                Try adjusting your search or check back later for new venues.
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={detectNearbyVenues}
              >
                Find Nearby Venues
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between items-center mt-xl pt-lg border-t border-gray-100">
            <div className="flex items-center gap-sm text-sm text-gray-500">
              {locationPermission === 'granted' && (
                <>
                  <span className="text-success">📍</span>
                  <span>Using your location</span>
                </>
              )}
            </div>

            <div className="flex gap-sm">
              <button
                className="btn btn-ghost btn-sm"
                onClick={detectNearbyVenues}
                disabled={loading}
              >
                🔄 Refresh
              </button>
              {selectedVenue && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleVenueSelect(selectedVenue)}
                >
                  Select {selectedVenue.name}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
