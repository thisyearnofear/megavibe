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
  artist: string;
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
}

export interface AudioFeedResponse {
  snippets: AudioSnippet[];
  total: number;
  offset: number;
  limit: number;
}

export class AudioService {
  async getFeed(limit: number = 10, offset: number = 0, filter: string = 'all'): Promise<AudioFeedResponse> {
    try {
      const response = await api.get(`/audio/feed?limit=${limit}&offset=${offset}&filter=${filter}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching audio feed:', error);
      throw new Error('Failed to fetch audio feed');
    }
  }

  async uploadSnippet(recording: { blob: Blob; duration: number }, metadata: {
    title: string;
    venueId: string;
    eventId?: string;
    tags: string[];
  }): Promise<AudioSnippet> {
    try {
      const formData = new FormData();
      
      // Convert blob to file
      const file = new File([recording.blob], `snippet-${Date.now()}.webm`, {
        type: recording.blob.type || 'audio/webm',
      });
      
      formData.append('file', file);
      formData.append('title', metadata.title);
      formData.append('venueId', metadata.venueId);
      formData.append('duration', recording.duration.toString());
      formData.append('tags', JSON.stringify(metadata.tags));
      
      if (metadata.eventId) {
        formData.append('eventId', metadata.eventId);
      }

      const response = await api.post('/audio/snippets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading audio snippet:', error);
      throw new Error('Failed to upload audio snippet');
    }
  }

  async likeSnippet(snippetId: string): Promise<{ likes: number }> {
    try {
      const response = await api.post(`/audio/snippets/${snippetId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking audio snippet:', error);
      throw new Error('Failed to like audio snippet');
    }
  }

  async playSnippet(snippetId: string): Promise<{ plays: number }> {
    try {
      const response = await api.post(`/audio/snippets/${snippetId}/play`);
      return response.data;
    } catch (error) {
      console.error('Error recording play for audio snippet:', error);
      throw new Error('Failed to record play for audio snippet');
    }
  }
}

const audioService = new AudioService();
export default audioService;
