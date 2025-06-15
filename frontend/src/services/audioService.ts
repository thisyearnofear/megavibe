import { api } from './api';

// Define File type for environments where it might not be available
declare global {
  interface File extends Blob {
    readonly lastModified: number;
    readonly name: string;
  }
}

export interface AudioSnippet {
  _id: string;
  title: string;
  artist?: string;
  url: string;
  duration: number;
  createdAt: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  likes: number;
  plays: number;
  shares: number;
  hasLiked?: boolean;
  waveform?: number[];
  venue?: string;
  event?: string;
  tags?: string[];
  reactions?: Array<{
    user: string;
    reactionType: 'like' | 'love' | 'fire' | 'clap';
    createdAt: string;
  }>;
}

export interface AudioFeedResponse {
  snippets: AudioSnippet[];
  total: number;
  offset: number;
  limit: number;
}

export class AudioService {
  async getFeed(limit: number = 20, offset: number = 0, filter: string = 'all'): Promise<AudioFeedResponse> {
    try {
      console.log('Fetching audio feed from backend...');

      // Test if backend is reachable first
      const response = await api.get('/api/audio');

      console.log('Backend response received:', response.status);

      // Handle empty response gracefully
      if (!response.data || !Array.isArray(response.data)) {
        console.log('Backend returned no data or invalid format');
        return {
          snippets: [],
          total: 0,
          offset,
          limit,
        };
      }

      const rawSnippets = response.data;
      console.log(`Found ${rawSnippets.length} snippets in backend`);

      // Transform backend response to match our interface
      const allSnippets = rawSnippets.map((snippet: any) => ({
        _id: snippet._id,
        title: snippet.title || 'Untitled Recording',
        artist: snippet.artist?.username || snippet.artist?.name || undefined,
        url: snippet.audioFile?.url || snippet.fileUrl || snippet.url || '',
        duration: snippet.audioFile?.duration || snippet.duration || 0,
        createdAt: snippet.createdAt || new Date().toISOString(),
        user: {
          _id: snippet.creator?._id || snippet.uploadedBy?._id || snippet.creator || 'unknown',
          username: snippet.creator?.username || snippet.uploadedBy?.username || snippet.creator?.name || 'Anonymous',
          avatar: snippet.creator?.profilePictureUrl || snippet.creator?.avatar || snippet.uploadedBy?.avatar || undefined,
        },
        likes: snippet.stats?.likes || snippet.reactions?.filter((r: any) => r.reactionType === 'like').length || 0,
        plays: snippet.stats?.plays || snippet.playCount || snippet.plays || 0,
        shares: snippet.stats?.shares || snippet.shareCount || snippet.shares || 0,
        hasLiked: snippet.hasLiked || false,
        waveform: snippet.audioFile?.waveform || snippet.waveform || [],
        venue: snippet.venue?.name || snippet.venue || 'Unknown Venue',
        event: snippet.event?.title || snippet.event || undefined,
        tags: snippet.tags || [],
        reactions: snippet.reactions || [],
      }));

      // Apply client-side filtering and sorting since backend doesn't handle it yet
      let filteredSnippets = [...allSnippets];

      if (filter === 'recent') {
        filteredSnippets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (filter === 'popular') {
        filteredSnippets.sort((a, b) => (b.plays + b.likes) - (a.plays + a.likes));
      } else if (filter === 'following') {
        // For now, just return recent - would need user following data
        filteredSnippets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      // Apply pagination
      const startIndex = offset;
      const endIndex = startIndex + limit;
      const paginatedSnippets = filteredSnippets.slice(startIndex, endIndex);

      return {
        snippets: paginatedSnippets,
        total: filteredSnippets.length,
        offset,
        limit,
      };
    } catch (error: any) {
      console.error('Error fetching audio feed:', error);

      // Provide more specific error messages
      let errorMessage = 'Unable to connect to backend';
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Backend server is not running';
      } else if (error.response?.status === 404) {
        errorMessage = 'Audio feed endpoint not found';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Backend server error';
      }

      // Throw error with better message for UI handling
      throw new Error(errorMessage);
    }
  }

  async uploadSnippet(recording: { blob: Blob; duration: number }, metadata: {
    title: string;
    venueId: string;
    eventId?: string;
    tags: string[];
    waveform?: number[];
  }): Promise<AudioSnippet> {
    try {
      const formData = new FormData();

      // Convert blob to file with better naming
      const timestamp = Date.now();
      const fileExtension = recording.blob.type.includes('webm') ? 'webm' :
                           recording.blob.type.includes('mp4') ? 'mp4' :
                           recording.blob.type.includes('wav') ? 'wav' : 'audio';

      const file = new File([recording.blob], `recording-${timestamp}.${fileExtension}`, {
        type: recording.blob.type || 'audio/webm',
      });

      formData.append('file', file);
      formData.append('title', metadata.title);
      formData.append('description', `Recorded at venue on ${new Date().toLocaleDateString()}`);
      formData.append('venue', metadata.venueId);
      formData.append('duration', Math.floor(recording.duration / 1000).toString()); // Convert to seconds

      if (metadata.eventId) {
        formData.append('event', metadata.eventId);
      }

      if (metadata.tags && metadata.tags.length > 0) {
        formData.append('tags', JSON.stringify(metadata.tags));
      }

      if (metadata.waveform && metadata.waveform.length > 0) {
        formData.append('waveform', JSON.stringify(metadata.waveform));
      }

      const response = await api.post('/api/audio/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Transform response to match our interface
      const snippet = response.data;
      return {
        _id: snippet._id,
        title: snippet.title || metadata.title,
        artist: snippet.artist || undefined,
        url: snippet.fileUrl || snippet.url || '',
        duration: snippet.duration || Math.floor(recording.duration / 1000),
        createdAt: snippet.createdAt || new Date().toISOString(),
        user: {
          _id: snippet.uploadedBy?._id || snippet.uploadedBy || 'current-user',
          username: snippet.uploadedBy?.username || 'You',
          avatar: snippet.uploadedBy?.avatar || undefined,
        },
        likes: 0,
        plays: 0,
        shares: 0,
        hasLiked: false,
        waveform: metadata.waveform || [],
        venue: snippet.venue || metadata.venueId,
        event: snippet.event,
        tags: snippet.tags || metadata.tags,
        reactions: [],
      };
    } catch (error) {
      console.error('Error uploading audio snippet:', error);
      throw new Error('Failed to upload audio snippet');
    }
  }

  async likeSnippet(snippetId: string): Promise<{ likes: number }> {
    try {
      // Try the reactions endpoint first, fallback to a simple like endpoint
      let response;
      try {
        response = await api.post(`/api/audio/${snippetId}/reactions`, {
          reactionType: 'like',
        });
      } catch (reactionError) {
        // Fallback - just return incremented like count for now
        console.warn('Reactions endpoint not available, using fallback');
        return { likes: 1 };
      }

      // Calculate likes count from reactions
      const likes = response.data.reactions?.filter((r: any) => r.reactionType === 'like').length || 1;

      return { likes };
    } catch (error) {
      console.error('Error liking audio snippet:', error);
      // Don't throw error for likes - return current state
      return { likes: 0 };
    }
  }

  async playSnippet(snippetId: string): Promise<{ plays: number }> {
    try {
      // Track play analytics - this endpoint might not exist yet
      const response = await api.post(`/api/audio/${snippetId}/play`);
      return { plays: response.data.playCount || response.data.plays || 1 };
    } catch (error) {
      console.warn('Play tracking endpoint not available:', error);
      // Don't throw error for analytics - this shouldn't break playback
      return { plays: 1 };
    }
  }

  async shareSnippet(snippetId: string, platform?: string): Promise<{ shares: number }> {
    try {
      const response = await api.post(`/api/audio/${snippetId}/share`, {
        platform: platform || 'web',
      });
      return { shares: response.data.shareCount || response.data.shares || 0 };
    } catch (error) {
      console.error('Error recording share for audio snippet:', error);
      throw new Error('Failed to record share for audio snippet');
    }
  }

  async deleteSnippet(snippetId: string): Promise<void> {
    try {
      await api.delete(`/api/audio/${snippetId}`);
    } catch (error) {
      console.error('Error deleting audio snippet:', error);
      throw new Error('Failed to delete audio snippet');
    }
  }

  async getSnippetsByVenue(venueId: string, limit: number = 20, offset: number = 0): Promise<AudioFeedResponse> {
    try {
      const response = await api.get(`/api/venues/${venueId}/snippets?limit=${limit}&offset=${offset}`);

      const snippets = response.data.map((snippet: any) => ({
        _id: snippet._id,
        title: snippet.title || 'Untitled Recording',
        artist: snippet.artist?.username || snippet.artist?.name || undefined,
        url: snippet.audioFile?.url || snippet.fileUrl || snippet.url || '',
        duration: snippet.audioFile?.duration || snippet.duration || 0,
        createdAt: snippet.createdAt,
        user: {
          _id: snippet.creator?._id || snippet.uploadedBy?._id || snippet.creator || 'unknown',
          username: snippet.creator?.username || snippet.uploadedBy?.username || snippet.creator?.name || 'Anonymous',
          avatar: snippet.creator?.profilePictureUrl || snippet.creator?.avatar || snippet.uploadedBy?.avatar || undefined,
        },
        likes: snippet.stats?.likes || snippet.reactions?.filter((r: any) => r.reactionType === 'like').length || 0,
        plays: snippet.stats?.plays || snippet.playCount || snippet.plays || 0,
        shares: snippet.stats?.shares || snippet.shareCount || snippet.shares || 0,
        hasLiked: snippet.hasLiked || false,
        waveform: snippet.audioFile?.waveform || snippet.waveform || [],
        venue: snippet.venue,
        event: snippet.event,
        tags: snippet.tags || [],
        reactions: snippet.reactions || [],
      }));

      return {
        snippets,
        total: snippets.length,
        offset,
        limit,
      };
    } catch (error) {
      console.error('Error fetching venue snippets:', error);
      throw new Error('Failed to fetch venue snippets');
    }
  }
}

const audioService = new AudioService();
export default audioService;
