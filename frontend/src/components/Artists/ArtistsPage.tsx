import React, { useState } from 'react';
import { PageLayout } from '../Layout/PageLayout';

import PerformerGrid from '../Demo/PerformerGrid';
import ArtistProfileModal from '../Demo/ArtistProfileModal';
import './ArtistsPage.css';

interface Performer {
  id: string;
  name: string;
  avatar: string;
  genre: string;
  isLive: boolean;
  currentSong?: string;
  tipCount: number;
  reputation: number;
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
}

// Featured artists from the demo data
const FEATURED_ARTISTS: Performer[] = [
  {
    id: 'papa-demo',
    name: 'Papa',
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
    }
  },
  {
    id: 'anatu-demo',
    name: 'Anatu',
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
    }
  },
  {
    id: 'andrew-demo',
    name: 'Andrew',
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
    }
  }
];

export const ArtistsPage: React.FC = () => {
  const [selectedPerformer, setSelectedPerformer] = useState<string | null>(null);
  const [showArtistProfile, setShowArtistProfile] = useState(false);

  const handlePerformerSelect = (performer: Performer) => {
    setSelectedPerformer(performer.name);
    setShowArtistProfile(true);
  };

  const handleCloseProfile = () => {
    setShowArtistProfile(false);
    setSelectedPerformer(null);
  };

  const handleBackToDashboard = () => {
    setShowArtistProfile(false);
    setSelectedPerformer(null);
  };

  return (
    <PageLayout
      title="Meet The Artists"
      subtitle="Explore featured artist profiles with full social integration and tipping capabilities."
    >
      <div className="artists-content">
        <div className="artists-intro">
          <h2>🎭 Featured Artists</h2>
          <p>
            Discover Papa, Anatu & Andrew - our featured artists showcasing the full MegaVibe experience.
            Click on any artist to explore their profile, social links, and start tipping!
          </p>
        </div>

        <PerformerGrid performers={FEATURED_ARTISTS} onSelect={handlePerformerSelect} />

        {selectedPerformer && (
          <ArtistProfileModal
            isOpen={showArtistProfile}
            featureType="demo"
            selectedPerformer={selectedPerformer}
            onClose={handleCloseProfile}
            onBack={handleBackToDashboard}
          />
        )}
      </div>

    </PageLayout>
  );
};

export default ArtistsPage;
