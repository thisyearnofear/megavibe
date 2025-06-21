export interface Performer {
  id: string;
  name: string;
  type: 'speaker' | 'musician' | 'comedian';
  avatar: string;
  genre?: string;
  isLive?: boolean;
  currentSong?: string;
  tipCount?: number;
  reputation?: number;
  bio: string;
  socialLinks: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    opensea?: string;
    website?: string;
    twitch?: string;
    foundation?: string;
    linkedin?: string;
  };
  wallet?: string;
  events?: string[];
}

export const PERFORMERS: Performer[] = [
  {
    id: 'vitalik-buterin',
    name: 'Vitalik Buterin',
    type: 'speaker',
    avatar: '/images/vitalik.jpg',
    bio: 'Ethereum co-founder and blockchain visionary.',
    socialLinks: {
      twitter: 'https://twitter.com/VitalikButerin',
    },
    wallet: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    events: ['devcon-7', 'ethcc-2025']
  },
  {
    id: 'papa-demo',
    name: 'Papa',
    type: 'musician',
    avatar: '/images/boom.jpg',
    genre: 'Indie Rock',
    isLive: true,
    currentSong: 'Chupacabra',
    tipCount: 23,
    reputation: 4.8,
    bio: 'Live Experience App creator and indie rock performer',
    socialLinks: {
      spotify: 'https://spoti.fi/3FEOjci',
      instagram: 'https://bit.ly/3FLPDKk',
      twitter: 'https://bit.ly/3FHRTT5',
      youtube: 'https://youtube.com/c/papajams'
    },
    wallet: '0x55A5705453Ee82c742274154136Fce8149597058',
    events: ['demo-venue']
  },
  {
    id: 'anatu-demo',
    name: 'Anatu',
    type: 'musician',
    avatar: '/images/boom.jpg',
    genre: 'Afrobeat/Electronic',
    isLive: false,
    currentSong: 'Lagos Nights',
    tipCount: 156,
    reputation: 4.9,
    bio: 'Nigerian-born electronic artist blending traditional Afrobeat with modern production',
    socialLinks: {
      spotify: 'https://open.spotify.com/artist/anatu',
      instagram: 'https://instagram.com/anatumusic',
      twitter: 'https://twitter.com/anatumusic',
      youtube: 'https://youtube.com/c/anatumusic'
    },
    wallet: '0x49a2c363347935451343a53b7f82b5d1482f8a5c',
    events: ['demo-venue']
  },
  {
    id: 'andrew-demo',
    name: 'Andrew',
    type: 'musician',
    avatar: '/images/boom.jpg',
    genre: 'Acoustic/Singer-Songwriter',
    isLive: true,
    currentSong: 'City Stories',
    tipCount: 89,
    reputation: 4.7,
    bio: 'Storytelling singer-songwriter with a passion for connecting through music',
    socialLinks: {
      spotify: 'https://open.spotify.com/artist/andrewmusic',
      instagram: 'https://instagram.com/andrewsongs',
      twitter: 'https://twitter.com/andrewsongs',
      youtube: 'https://youtube.com/c/andrewsongs'
    },
    wallet: '0x45556447e159BA214A462549E034E5737552903A',
    events: ['demo-venue']
  }
  // Add more performers as needed
];
