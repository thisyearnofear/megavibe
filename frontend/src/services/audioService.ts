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
      const response = await api.get(`/api/audio/feed?limit=${limit}&offset=${offset}&filter=${filter}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching audio feed:', error);
      throw new Error('Failed to fetch audio feed');
    }
  }

  async uploadSnippet(file: File, title: string, artist: string): Promise<AudioSnippet> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('artist', artist);

      const response = await api.post('/api/audio/snippets', formData, {
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
      const response = await api.post(`/api/audio/snippets/${snippetId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking audio snippet:', error);
      throw new Error('Failed to like audio snippet');
    }
  }

  async playSnippet(snippetId: string): Promise<{ plays: number }> {
    try {
      const response = await api.post(`/api/audio/snippets/${snippetId}/play`);
      return response.data;
    } catch (error) {
      console.error('Error recording play for audio snippet:', error);
      throw new Error('Failed to record play for audio snippet');
    }
  }
}

const audioService = new AudioService();
export default audioService;
