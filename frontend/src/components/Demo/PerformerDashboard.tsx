import React, { useState } from 'react';
import ArtistProfiles from '../ArtistProfiles';
import '../../styles/PerformerDashboard.css';
import '../../styles/FeatureDemo.css';
import { CrossNavigation } from '../Navigation/CrossNavigation';
import { Modal } from '../common/Modal';
import PerformerGrid from './PerformerGrid';
import ArtistProfileModal from './ArtistProfileModal';

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

interface PerformerDashboardProps {
  featureType: 'connection' | 'bounty' | 'tokenization' | 'influence' | 'reputation' | 'demo';
  onClose: () => void;
}

// Feature-specific demo data showcasing unique backend implementations
const SAMPLE_PERFORMERS: Record<string, Performer[]> = {
  connection: [
    {
      id: 'connection-demo-1',
      name: 'Dr. Sarah Kim',
      avatar: '/images/boom.jpg',
      genre: 'Blockchain Conference',
      isLive: true,
      currentSong: 'Zero-Knowledge Proofs in Practice',
      tipCount: 234,
      reputation: 4.9,
      bio: 'Lead researcher at Ethereum Foundation, speaking about ZK-rollups and privacy',
      socialLinks: {
        twitter: 'https://twitter.com/drsarahkim',
        youtube: 'https://youtube.com/drsarahkim'
      }
    },
    {
      id: 'connection-demo-2',
      name: 'Marcus Rivera',
      avatar: '/images/boom.jpg',
      genre: 'Comedy Show',
      isLive: true,
      currentSong: 'Crypto Jokes & Web3 Humor',
      tipCount: 89,
      reputation: 4.7,
      bio: 'Stand-up comedian specializing in tech humor, currently at The Laugh Track',
      socialLinks: {
        instagram: 'https://instagram.com/marcuscomedy',
        twitter: 'https://twitter.com/marcuscomedy'
      }
    },
    {
      id: 'connection-demo-3',
      name: 'Elena Vasquez',
      avatar: '/images/boom.jpg',
      genre: 'Jazz Performance',
      isLive: false,
      currentSong: 'Next: Blue Moon Variations',
      tipCount: 156,
      reputation: 4.8,
      bio: 'Grammy-nominated jazz pianist, performing at Blue Note tonight at 9 PM',
      socialLinks: {
        spotify: 'https://spotify.com/elenavasquez',
        instagram: 'https://instagram.com/elenavasquez'
      }
    }
  ],
  bounty: [
    {
      id: 'bounty-demo-1',
      name: 'Jake "The Beatboxer" Thompson',
      avatar: '/images/boom.jpg',
      genre: 'Street Performance',
      isLive: true,
      currentSong: 'Taking Bounty Requests',
      tipCount: 312,
      reputation: 4.8,
      bio: 'Viral beatboxer who creates custom beats for bounty requests. Active bounties: 50 USDC for "Mantle Network beat"',
      socialLinks: {
        tiktok: 'https://tiktok.com/@jakebeatbox',
        instagram: 'https://instagram.com/jakebeatbox'
      }
    },
    {
      id: 'bounty-demo-2',
      name: 'Professor Maria Santos',
      avatar: '/images/boom.jpg',
      genre: 'Educational Content',
      isLive: false,
      currentSong: 'Next: Bounty Topic TBD',
      tipCount: 89,
      reputation: 4.9,
      bio: 'Computer science professor who explains complex topics for bounty requests. Current bounty: 75 USDC for "DeFi in 5 minutes"',
      socialLinks: {
        youtube: 'https://youtube.com/profmaria',
        twitter: 'https://twitter.com/profmaria'
      }
    }
  ],
  tokenization: [
    {
      id: 'tokenization-demo-1',
      name: 'Luna Chang',
      avatar: '/images/boom.jpg',
      genre: 'Performance Artist',
      isLive: true,
      currentSong: 'Interactive Light Show',
      tipCount: 445,
      reputation: 4.9,
      bio: 'Digital artist whose performances auto-mint as NFTs. 12 clips in content pool, 3 went viral this week, earning $234 for contributors',
      socialLinks: {
        opensea: 'https://opensea.io/lunachang',
        instagram: 'https://instagram.com/lunachang'
      }
    },
    {
      id: 'tokenization-demo-2',
      name: 'The Moment Collective',
      avatar: '/images/boom.jpg',
      genre: 'Collaborative Art',
      isLive: true,
      currentSong: 'Multi-Angle Performance',
      tipCount: 567,
      reputation: 4.8,
      bio: 'Group creating multi-perspective content. 5 angles of same moment = 5 NFTs. Revenue shared among all contributors',
      socialLinks: {
        website: 'https://momentcollective.art',
        twitter: 'https://twitter.com/momentcollective'
      }
    }
  ],
  influence: [
    {
      id: 'influence-demo-1',
      name: 'DJ Nexus',
      avatar: '/images/boom.jpg',
      genre: 'Interactive Electronic',
      isLive: true,
      currentSong: 'Audience-Driven Mix',
      tipCount: 1234,
      reputation: 4.9,
      bio: 'Pioneer of tip-to-influence DJing. Real-time: $50 tips = genre change, $100 = song request, $200 = live remix. Analytics show 89% audience satisfaction',
      socialLinks: {
        twitch: 'https://twitch.tv/djnexus',
        spotify: 'https://spotify.com/djnexus'
      }
    },
    {
      id: 'influence-demo-2',
      name: 'Chef Roberto Live',
      avatar: '/images/boom.jpg',
      genre: 'Cooking Show',
      isLive: true,
      currentSong: 'Interactive Cooking',
      tipCount: 678,
      reputation: 4.7,
      bio: 'Celebrity chef streaming live cooking influenced by tips. Venue analytics: 94% engagement rate, 23 ingredients changed by audience tonight',
      socialLinks: {
        youtube: 'https://youtube.com/chefroberto',
        instagram: 'https://instagram.com/chefroberto'
      }
    }
  ],
  reputation: [
    {
      id: 'reputation-demo-1',
      name: 'Alex "The Tastemaker" Johnson',
      avatar: '/images/boom.jpg',
      genre: 'Cultural Curator',
      isLive: false,
      tipCount: 2341,
      reputation: 4.95,
      bio: 'Diamond-tier curator with 47 proof-of-presence NFTs. 89% prediction accuracy on viral content. Cross-event reputation: 2,341 points across 23 venues',
      socialLinks: {
        foundation: 'https://foundation.app/tastemaker',
        twitter: 'https://twitter.com/tastemaker'
      }
    },
    {
      id: 'reputation-demo-2',
      name: 'Community Champion Sarah',
      avatar: '/images/boom.jpg',
      genre: 'Event Networker',
      isLive: true,
      currentSong: 'Networking Hour',
      tipCount: 1567,
      reputation: 4.87,
      bio: 'Platinum-tier reputation across 156 events. Expertise in crypto, music, and art. Leaderboard: #3 globally, #1 in NYC region',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/sarahnetworker',
        twitter: 'https://twitter.com/sarahnetworker'
      }
    }
  ],
  demo: [
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
  ]
};

const FEATURE_TITLES = {
  connection: '🎯 Shazam for Live Events',
  bounty: '💰 Incentivize Any Content',
  tokenization: '🎬 Own Viral Moments',
  influence: '⚡ Shape Reality Live',
  reputation: '🏆 Prove Your Expertise',
  demo: '🎭 Meet The Artists'
};

const FEATURE_DESCRIPTIONS = {
  connection: 'Walk into any venue and instantly know who\'s performing, what\'s happening, and who else is there. Zero friction discovery.',
  bounty: 'Create bounties for specific content - "50 USDC for funniest crypto joke" - and watch creators compete to fulfill them.',
  tokenization: 'Contribute clips to content pools, earn when they\'re used, and watch viral moments become tradeable NFT assets.',
  influence: 'Your tips and reactions shape what happens on stage in real-time. Analytics dashboards show your impact.',
  reputation: 'Build cross-event reputation with proof-of-presence NFTs. Diamond-tier curators get exclusive access and rewards.',
  demo: 'Interactive artist profiles showcasing Papa, Anatu & Andrew with full social integration and tipping'
};

// --- Main PerformerDashboard ---
export const PerformerDashboard: React.FC<PerformerDashboardProps> = ({ featureType, onClose }) => {
  const [selectedPerformer, setSelectedPerformer] = useState<string | null>(null);
  const [showArtistProfile, setShowArtistProfile] = useState(false);
  const performers = SAMPLE_PERFORMERS[featureType] || SAMPLE_PERFORMERS.demo;

  const handlePerformerSelect = (performer: Performer) => {
    setSelectedPerformer(performer.name);
    setShowArtistProfile(true);
  };
  const handleBackToDashboard = () => {
    setShowArtistProfile(false);
    setSelectedPerformer(null);
  };

  return (
    <>
      <PerformerGrid performers={performers} onSelect={handlePerformerSelect} />
      {selectedPerformer && (
        <ArtistProfileModal
          isOpen={showArtistProfile}
          featureType={featureType}
          selectedPerformer={selectedPerformer}
          onClose={onClose}
          onBack={handleBackToDashboard}
        />
      )}
      <CrossNavigation currentPage="dashboard" />
    </>
  );
};
