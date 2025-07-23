import { PerformerProfile } from "@/services/api/performerService";
import { TippedPerformer } from "@/contexts/ImpactContext";

// Mock data for available performers (can be expanded)
const mockAvailablePerformers: PerformerProfile[] = [
  {
    id: "performer_mock_3",
    name: "Jazz Fusion Collective",
    type: "Musician",
    description: "Improvisational jazz and fusion",
    genres: ["Jazz", "Fusion"],
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: "San Francisco Jazz Center",
      venue: "Jazz Club"
    },
    status: "offline",
    preferences: {
      acceptsTips: true,
      acceptsRequests: false,
      requestTypes: [],
      minimumTip: 5,
      minimumRequest: 0
    },
    socialLinks: {},
    stats: {
      totalEarnings: 500,
      totalTips: 100,
      totalRequests: 0,
      averageRating: 4.9,
      performanceCount: 30
    },
    avatar: "🎷",
    createdAt: Date.now(),
    lastActiveAt: Date.now()
  },
  {
    id: "performer_mock_4",
    name: "Digital Artist Duo",
    type: "Visual Artist",
    description: "Live digital painting and VJ sets",
    genres: ["Digital Art", "VJ", "Electronic"],
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: "Art Gallery, San Francisco, CA",
      venue: "Gallery Space"
    },
    status: "live",
    preferences: {
      acceptsTips: true,
      acceptsRequests: true,
      requestTypes: ["Custom Visuals"],
      minimumTip: 3,
      minimumRequest: 15
    },
    socialLinks: {},
    stats: {
      totalEarnings: 300,
      totalTips: 50,
      totalRequests: 5,
      averageRating: 4.7,
      performanceCount: 10
    },
    avatar: "🎨",
    createdAt: Date.now(),
    lastActiveAt: Date.now()
  },
  {
    id: "performer_mock_5",
    name: "Classical Guitar Virtuoso",
    type: "Musician",
    description: "Classical and flamenco guitar performances",
    genres: ["Classical", "Flamenco"],
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: "Concert Hall, San Francisco, CA",
      venue: "Concert Hall"
    },
    status: "offline",
    preferences: {
      acceptsTips: true,
      acceptsRequests: false,
      requestTypes: [],
      minimumTip: 7,
      minimumRequest: 0
    },
    socialLinks: {},
    stats: {
      totalEarnings: 700,
      totalTips: 120,
      totalRequests: 0,
      averageRating: 4.9,
      performanceCount: 40
    },
    avatar: "🎸",
    createdAt: Date.now(),
    lastActiveAt: Date.now()
  },
];

export const recommendationService = {
  getRecommendations: (tippedPerformers: TippedPerformer[]): PerformerProfile[] => {
    if (tippedPerformers.length === 0) {
      // If no tipping history, return some popular or random performers
      return mockAvailablePerformers.slice(0, 2);
    }

    const recommended: PerformerProfile[] = [];
    const seenPerformerIds = new Set(tippedPerformers.map(p => p.id));

    // Simple recommendation logic: recommend performers of similar types or genres
    tippedPerformers.forEach(tipped => {
      mockAvailablePerformers.forEach(available => {
        if (!seenPerformerIds.has(available.id) && available.id !== tipped.id) {
          if (available.type === tipped.type) {
            recommended.push(available);
            seenPerformerIds.add(available.id); // Avoid duplicates
          } else if (available.genres.some(genre => tipped.genres.includes(genre))) {
            recommended.push(available);
            seenPerformerIds.add(available.id); // Avoid duplicates
          }
        }
      });
    });

    // If not enough recommendations, fill with random ones
    if (recommended.length < 2) {
      mockAvailablePerformers.forEach(available => {
        if (!seenPerformerIds.has(available.id)) {
          recommended.push(available);
          seenPerformerIds.add(available.id);
        }
      });
    }

    return recommended.slice(0, 3); // Limit to 3 recommendations for brevity
  },
};
