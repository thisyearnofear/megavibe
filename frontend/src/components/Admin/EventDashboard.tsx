import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Venue {
  _id: string;
  name: string;
  city: string;
}

interface Artist {
  _id: string;
  name: string;
}

interface Song {
  _id: string;
  title: string;
  artist: string;
  duration: number;
}

interface Event {
  _id?: string;
  title: string;
  venue: string | Venue;
  artist: string | Artist;
  startTime: Date;
  endTime: Date;
  setlist: string[];
  isLive: boolean;
}

const EventDashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    startTime: new Date(),
    endTime: new Date(Date.now() + 10800000), // Default to 3 hours from now
    isLive: false,
    setlist: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventsRes, venuesRes, artistsRes, songsRes] = await Promise.all([
          api.get('/api/events'),
          api.get('/api/venues'),
          api.get('/api/artists'),
          api.get('/api/songs'),
        ]);

        setEvents(eventsRes.data);
        setVenues(venuesRes.data);
        setArtists(artistsRes.data);
        setSongs(songsRes.data);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.venue || !newEvent.artist) {
      setError('Title, venue, and artist are required fields.');
      return;
    }

    try {
      setIsCreating(true);
      const eventData = {
        ...newEvent,
        startTime: new Date(newEvent.startTime || new Date()),
        endTime: new Date(newEvent.endTime || new Date(Date.now() + 10800000)),
      };
      const response = await api.post('/api/events', eventData);
      setEvents([...events, response.data]);
      setNewEvent({
        startTime: new Date(),
        endTime: new Date(Date.now() + 10800000),
        isLive: false,
        setlist: [],
      });
      setError(null);
    } catch (err) {
      setError('Failed to create event. Please try again.');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleLive = async (eventId: string, currentStatus: boolean) => {
    try {
      const response = await api.patch(`/api/events/${eventId}`, { isLive: !currentStatus });
      setEvents(events.map(event => 
        event._id === eventId ? { ...event, isLive: response.data.isLive } : event
      ));
    } catch (err) {
      setError('Failed to update event status.');
      console.error(err);
    }
  };

  const handleAddSongToSetlist = (songId: string) => {
    if (!newEvent.setlist?.includes(songId)) {
      setNewEvent({
        ...newEvent,
        setlist: [...(newEvent.setlist || []), songId],
      });
    }
  };

  const handleRemoveSongFromSetlist = (songId: string) => {
    setNewEvent({
      ...newEvent,
      setlist: newEvent.setlist?.filter(id => id !== songId) || [],
    });
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="event-dashboard">
      <h1>Event Management Dashboard</h1>
      
      {error && <div className="error-banner">{error}</div>}
      
      <div className="dashboard-container">
        <div className="create-event-panel">
          <h2>Create New Event</h2>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={newEvent.title || ''}
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Event title"
            />
          </div>
          <div className="form-group">
            <label>Venue</label>
            <select
              value={typeof newEvent.venue === 'string' ? newEvent.venue : newEvent.venue?._id || ''}
              onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })}
            >
              <option value="">Select a venue</option>
              {venues.map(venue => (
                <option key={venue._id} value={venue._id}>{venue.name} - {venue.city}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Artist</label>
            <select
              value={typeof newEvent.artist === 'string' ? newEvent.artist : newEvent.artist?._id || ''}
              onChange={e => setNewEvent({ ...newEvent, artist: e.target.value })}
            >
              <option value="">Select an artist</option>
              {artists.map(artist => (
                <option key={artist._id} value={artist._id}>{artist.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input
              type="datetime-local"
              value={newEvent.startTime ? new Intl.DateTimeFormat('en-CA', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
              }).format(new Date(newEvent.startTime)) : ''}
              onChange={e => setNewEvent({ ...newEvent, startTime: new Date(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input
              type="datetime-local"
              value={newEvent.endTime ? new Intl.DateTimeFormat('en-CA', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
              }).format(new Date(newEvent.endTime)) : ''}
              onChange={e => setNewEvent({ ...newEvent, endTime: new Date(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Setlist</label>
            <div className="setlist-container">
              <div className="current-setlist">
                {newEvent.setlist && newEvent.setlist.length > 0 ? (
                  newEvent.setlist.map((songId, index) => {
                    const song = songs.find(s => s._id === songId);
                    return song ? (
                      <div key={songId} className="setlist-item">
                        {index + 1}. {song.title} ({Math.floor(song.duration / 60000)}:{((song.duration % 60000) / 1000).toFixed(0).padStart(2, '0')})
                        <button onClick={() => handleRemoveSongFromSetlist(songId)}>Remove</button>
                      </div>
                    ) : null;
                  })
                ) : (
                  <p>No songs in setlist yet.</p>
                )}
              </div>
              <div className="song-selector">
                <h3>Add Songs</h3>
                {songs
                  .filter(song => newEvent.artist && (typeof newEvent.artist === 'string' ? newEvent.artist : newEvent.artist._id) === song.artist)
                  .map(song => (
                    <div key={song._id} className="song-option">
                      {song.title}
                      <button onClick={() => handleAddSongToSetlist(song._id)} disabled={newEvent.setlist?.includes(song._id)}>Add</button>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          <div className="form-group checkbox">
            <input
              type="checkbox"
              checked={newEvent.isLive || false}
              onChange={e => setNewEvent({ ...newEvent, isLive: e.target.checked })}
            />
            <label>Is Live Now</label>
          </div>
          <button
            onClick={handleCreateEvent}
            disabled={isCreating || !newEvent.title || !newEvent.venue || !newEvent.artist}
            className="create-button"
          >
            {isCreating ? 'Creating...' : 'Create Event'}
          </button>
        </div>
        
        <div className="events-list-panel">
          <h2>Current Events</h2>
          {events.length === 0 ? (
            <p>No events created yet. Use the form to create your first event.</p>
          ) : (
            <table className="events-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Venue</th>
                  <th>Artist</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event._id}>
                    <td>{event.title}</td>
                    <td>{typeof event.venue === 'string' ? event.venue : event.venue.name}</td>
                    <td>{typeof event.artist === 'string' ? event.artist : event.artist.name}</td>
                    <td>{formatDate(new Date(event.startTime))}</td>
                    <td>{formatDate(new Date(event.endTime))}</td>
                    <td>{event.isLive ? <span className="live-indicator">LIVE</span> : 'Not Live'}</td>
                    <td>
                      <button
                        onClick={() => handleToggleLive(event._id || '', event.isLive)}
                        className={event.isLive ? 'end-button' : 'start-button'}
                      >
                        {event.isLive ? 'End Live' : 'Go Live'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDashboard;
