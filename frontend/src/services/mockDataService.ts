// mockDataService.ts - Mock data service for landing page demo

export interface MockEarningsData {
  speaker: string;
  topic: string;
  earned: number;
  timeAgo: string;
  bountyCreated: number;
  contentType: string;
}

export interface MockStats {
  activeSpeakers: number;
  liveTips: number;
  pendingBounties: number;
  totalEarned: number;
  totalPlatformValue: number;
}

interface Speaker {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  walletAddress?: string;
  currentTalk?: string;
  todayEarnings?: number;
  tipCount?: number;
  reputation?: number;
  isActive?: boolean;
}

interface Event {
  id: string;
  name: string;
  venue: string;
  date: string;
  status: 'upcoming' | 'live' | 'ended';
  speakers: Speaker[];
  totalTips: number;
  totalBounties: number;
  attendeeCount: number;
  description?: string;
}

interface Tip {
  id: string;
  eventId: string;
  speakerId: string;
  tipper: {
    username: string;
    avatar?: string;
    walletAddress: string;
  };
  recipient: {
    username: string;
    avatar?: string;
    walletAddress: string;
  };
  amount: number;
  message?: string;
  timestamp: string;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

interface BountySubmission {
  id: string;
  bountyId: string;
  creator: {
    username: string;
    avatar?: string;
    walletAddress: string;
  };
  contentUrl: string;
  description: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface Bounty {
  id: string;
  eventId: string;
  speakerId: string;
  sponsor: {
    username: string;
    avatar?: string;
    walletAddress: string;
  };
  description: string;
  reward: number;
  deadline: string;
  status: 'active' | 'claimed' | 'expired';
  submissions: BountySubmission[];
  txHash?: string;
  createdAt: string;
}

// Mock speakers data
export const MOCK_SPEAKERS: Speaker[] = [
  {
    id: 'vitalik-buterin',
    name: 'Vitalik Buterin',
    title: 'Ethereum Co-founder',
    avatar: '/api/placeholder/60/60',
    walletAddress: '0x1234567890123456789012345678901234567890',
    currentTalk: 'Ethereum Roadmap 2024',
    todayEarnings: 3200,
    tipCount: 47,
    reputation: 980,
    isActive: true
  },
  {
    id: 'hayden-adams',
    name: 'Hayden Adams',
    title: 'Uniswap Founder',
    avatar: '/api/placeholder/60/60',
    walletAddress: '0x2345678901234567890123456789012345678901',
    currentTalk: 'Uniswap v4 Deep Dive',
    todayEarnings: 1847,
    tipCount: 32,
    reputation: 895,
    isActive: true
  },
  {
    id: 'stani-kulechov',
    name: 'Stani Kulechov',
    title: 'Aave Founder',
    avatar: '/api/placeholder/60/60',
    walletAddress: '0x3456789012345678901234567890123456789012',
    currentTalk: 'DeFi Lending Evolution',
    todayEarnings: 2100,
    tipCount: 38,
    reputation: 920,
    isActive: false
  },
  {
    id: 'andrew-crypto',
    name: 'Andrew Miller',
    title: 'Crypto Educator',
    avatar: '/api/placeholder/60/60',
    walletAddress: '0x4567890123456789012345678901234567890123',
    currentTalk: 'DeFi for Beginners',
    todayEarnings: 950,
    tipCount: 28,
    reputation: 750,
    isActive: true
  },
  {
    id: 'anatu-dao',
    name: 'Anatu Florczyk',
    title: 'ZK Research Lead',
    avatar: '/api/placeholder/60/60',
    walletAddress: '0x5678901234567890123456789012345678901234',
    currentTalk: 'Zero Knowledge Proofs Explained',
    todayEarnings: 1650,
    tipCount: 35,
    reputation: 840,
    isActive: true
  },
  {
    id: 'papa-builds',
    name: 'Papa Williams',
    title: 'Full-Stack Developer',
    avatar: '/api/placeholder/60/60',
    walletAddress: '0x6789012345678901234567890123456789012345',
    currentTalk: 'Building on Mantle',
    todayEarnings: 1200,
    tipCount: 22,
    reputation: 680,
    isActive: false
  }
];

// Mock events data
export const MOCK_EVENTS: Event[] = [
  {
    id: 'devcon-7-bangkok',
    name: 'DevCon 7 Bangkok',
    venue: 'Bangkok Convention Center',
    date: new Date().toISOString(),
    status: 'live',
    speakers: MOCK_SPEAKERS,
    totalTips: 89420,
    totalBounties: 34,
    attendeeCount: 2847,
    description: 'The largest Ethereum developer conference in Asia'
  },
  {
    id: 'eth-denver-2024',
    name: 'ETH Denver 2024',
    venue: 'National Ballpark',
    date: new Date(Date.now() - 86400000).toISOString(),
    status: 'ended',
    speakers: MOCK_SPEAKERS.slice(0, 4),
    totalTips: 156000,
    totalBounties: 67,
    attendeeCount: 5200,
    description: 'The largest Web3 #BUIDLathon in the world'
  }
];

// Mock recent tips
export const MOCK_RECENT_TIPS: Tip[] = [
  {
    id: 'tip-1',
    eventId: 'devcon-7-bangkok',
    speakerId: 'vitalik-buterin',
    tipper: {
      username: 'cryptoenthusiast',
      avatar: '/api/placeholder/40/40',
      walletAddress: '0x1111111111111111111111111111111111111111'
    },
    recipient: {
      username: 'vitalik.eth',
      avatar: '/api/placeholder/40/40',
      walletAddress: '0x1234567890123456789012345678901234567890'
    },
    amount: 50,
    message: 'Amazing explanation of the roadmap! 🚀',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    txHash: '0xabc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
    status: 'confirmed'
  },
  {
    id: 'tip-2',
    eventId: 'devcon-7-bangkok',
    speakerId: 'hayden-adams',
    tipper: {
      username: 'defimaxi',
      avatar: '/api/placeholder/40/40',
      walletAddress: '0x2222222222222222222222222222222222222222'
    },
    recipient: {
      username: 'haydenzadams',
      avatar: '/api/placeholder/40/40',
      walletAddress: '0x2345678901234567890123456789012345678901'
    },
    amount: 25,
    message: 'Love the v4 improvements!',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    txHash: '0xdef456ghi789jkl012mno345pqr678stu901vwx234yz567',
    status: 'confirmed'
  },
  {
    id: 'tip-3',
    eventId: 'devcon-7-bangkok',
    speakerId: 'anatu-dao',
    tipper: {
      username: 'zklearner',
      avatar: '/api/placeholder/40/40',
      walletAddress: '0x3333333333333333333333333333333333333333'
    },
    recipient: {
      username: 'anatu',
      avatar: '/api/placeholder/40/40',
      walletAddress: '0x5678901234567890123456789012345678901234'
    },
    amount: 75,
    message: 'Finally understand ZK proofs thanks to you!',
    timestamp: new Date(Date.now() - 480000).toISOString(),
    txHash: '0xghi789jkl012mno345pqr678stu901vwx234yz567abc',
    status: 'confirmed'
  }
];

// Mock active bounties
export const MOCK_ACTIVE_BOUNTIES: Bounty[] = [
  {
    id: 'bounty-1',
    eventId: 'devcon-7-bangkok',
    speakerId: 'vitalik-buterin',
    sponsor: {
      username: 'vitalik.eth',
      avatar: '/api/placeholder/40/40',
      walletAddress: '0x1234567890123456789012345678901234567890'
    },
    description: 'Create 5-minute explainer videos for each Ethereum roadmap milestone',
    reward: 500,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    submissions: [],
    txHash: '0xbounty123456789012345678901234567890123456',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'bounty-2',
    eventId: 'devcon-7-bangkok',
    speakerId: 'hayden-adams',
    sponsor: {
      username: 'haydenzadams',
      avatar: '/api/placeholder/40/40',
      walletAddress: '0x2345678901234567890123456789012345678901'
    },
    description: 'Build interactive Uniswap v4 hook examples with documentation',
    reward: 750,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    submissions: [],
    txHash: '0xbounty234567890123456789012345678901234567',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

// Live earnings data that rotates on landing page
export const LIVE_EARNINGS_DATA: MockEarningsData[] = [
  {
    speaker: "Vitalik Buterin",
    topic: "Ethereum Roadmap 2024",
    earned: 3200,
    timeAgo: "2 hours ago",
    bountyCreated: 2800,
    contentType: "Video explainers"
  },
  {
    speaker: "Hayden Adams",
    topic: "Uniswap v4 Deep Dive",
    earned: 1847,
    timeAgo: "5 hours ago",
    bountyCreated: 1500,
    contentType: "Code tutorials"
  },
  {
    speaker: "Stani Kulechov",
    topic: "DeFi Lending Evolution",
    earned: 2100,
    timeAgo: "1 day ago",
    bountyCreated: 1800,
    contentType: "Beginner guides"
  },
  {
    speaker: "Andrew Miller",
    topic: "DeFi for Beginners",
    earned: 950,
    timeAgo: "3 hours ago",
    bountyCreated: 800,
    contentType: "Educational content"
  },
  {
    speaker: "Anatu Florczyk",
    topic: "Zero Knowledge Proofs",
    earned: 1650,
    timeAgo: "6 hours ago",
    bountyCreated: 1400,
    contentType: "Technical demos"
  }
];

// Success stories for landing page
export const SUCCESS_STORIES = [
  {
    speaker: "@VitalikButerin",
    achievement: "Earned $12,400 across 4 conferences",
    detail: "Created 23 bounties, generated 156 content pieces",
    impact: "His explanations reached 2.3M developers"
  },
  {
    speaker: "@AndrewCrypto",
    achievement: "Built $50K knowledge business",
    detail: "From conference speaker to content empire",
    impact: "Now earns $8K+ monthly from bounty commissions"
  },
  {
    speaker: "@AnatuDAO",
    achievement: "ZK expertise → $25K revenue",
    detail: "Specialized knowledge became premium content",
    impact: "Teaching ZK concepts to 10K+ students"
  },
  {
    speaker: "@PapaBuilds",
    achievement: "Mantle ecosystem expert",
    detail: "Built reputation through consistent content",
    impact: "Top educator for Mantle development"
  }
];

// Mock service class
class MockDataService {
  private stats: MockStats = {
    activeSpeakers: 47,
    liveTips: 12,
    pendingBounties: 28,
    totalEarned: 89420,
    totalPlatformValue: 127845
  };

  // Get current event data
  async getCurrentEvent(): Promise<Event> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_EVENTS[0]);
      }, 500);
    });
  }

  // Get speakers for an event
  async getSpeakers(eventId: string): Promise<Speaker[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_SPEAKERS);
      }, 300);
    });
  }

  // Get recent tips
  async getRecentTips(eventId: string): Promise<Tip[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_RECENT_TIPS);
      }, 400);
    });
  }

  // Get active bounties
  async getActiveBounties(eventId: string): Promise<Bounty[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_ACTIVE_BOUNTIES);
      }, 450);
    });
  }

  // Get live stats
  async getLiveStats(): Promise<MockStats> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate slight changes in stats
        this.stats.liveTips += Math.random() > 0.7 ? 1 : 0;
        this.stats.totalEarned += Math.floor(Math.random() * 100) + 25;
        this.stats.totalPlatformValue += Math.floor(Math.random() * 50) + 25;

        resolve({ ...this.stats });
      }, 200);
    });
  }

  // Simulate adding a new tip
  async addMockTip(speakerId: string, amount: number, message: string): Promise<Tip> {
    const newTip: Tip = {
      id: `tip-${Date.now()}`,
      eventId: 'devcon-7-bangkok',
      speakerId,
      tipper: {
        username: 'mockuser',
        avatar: '/api/placeholder/40/40',
        walletAddress: '0x9999999999999999999999999999999999999999'
      },
      recipient: {
        username: MOCK_SPEAKERS.find(s => s.id === speakerId)?.name.toLowerCase().replace(' ', '') || 'speaker',
        avatar: '/api/placeholder/40/40',
        walletAddress: MOCK_SPEAKERS.find(s => s.id === speakerId)?.walletAddress || '0x0000000000000000000000000000000000000000'
      },
      amount,
      message,
      timestamp: new Date().toISOString(),
      txHash: `0x${Math.random().toString(16).substr(2, 40)}`,
      status: 'confirmed'
    };

    // Update speaker earnings
    const speaker = MOCK_SPEAKERS.find(s => s.id === speakerId);
    if (speaker) {
      speaker.todayEarnings = (speaker.todayEarnings || 0) + amount;
      speaker.tipCount = (speaker.tipCount || 0) + 1;
    }

    // Update stats
    this.stats.totalEarned += amount;
    this.stats.liveTips += 1;

    return newTip;
  }

  // Simulate creating a bounty
  async addMockBounty(speakerId: string, description: string, reward: number, deadline: string): Promise<Bounty> {
    const speaker = MOCK_SPEAKERS.find(s => s.id === speakerId);

    const newBounty: Bounty = {
      id: `bounty-${Date.now()}`,
      eventId: 'devcon-7-bangkok',
      speakerId,
      sponsor: {
        username: speaker?.name.toLowerCase().replace(' ', '') || 'sponsor',
        avatar: speaker?.avatar || '/api/placeholder/40/40',
        walletAddress: speaker?.walletAddress || '0x0000000000000000000000000000000000000000'
      },
      description,
      reward,
      deadline,
      status: 'active',
      submissions: [],
      txHash: `0x${Math.random().toString(16).substr(2, 40)}`,
      createdAt: new Date().toISOString()
    };

    // Update stats
    this.stats.pendingBounties += 1;
    this.stats.totalPlatformValue += reward;

    return newBounty;
  }

  // Get rotating earnings data for landing page
  getRotatingEarnings(): MockEarningsData[] {
    return LIVE_EARNINGS_DATA;
  }

  // Get success stories
  getSuccessStories() {
    return SUCCESS_STORIES;
  }

  // Simulate real-time updates
  simulateRealTimeUpdate(): {
    type: 'tip' | 'bounty' | 'stats';
    data: any;
  } {
    const updateTypes = ['tip', 'bounty', 'stats'];
    const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)] as 'tip' | 'bounty' | 'stats';

    switch (randomType) {
      case 'tip':
        const randomSpeaker = MOCK_SPEAKERS[Math.floor(Math.random() * MOCK_SPEAKERS.length)];
        const randomAmount = [10, 25, 50, 100][Math.floor(Math.random() * 4)];
        return {
          type: 'tip',
          data: {
            speakerId: randomSpeaker.id,
            speakerName: randomSpeaker.name,
            amount: randomAmount,
            message: "Great talk!",
            timestamp: new Date().toISOString()
          }
        };

      case 'bounty':
        const randomBountySpeaker = MOCK_SPEAKERS[Math.floor(Math.random() * MOCK_SPEAKERS.length)];
        return {
          type: 'bounty',
          data: {
            speakerId: randomBountySpeaker.id,
            speakerName: randomBountySpeaker.name,
            reward: Math.floor(Math.random() * 500) + 100,
            description: "Create educational content",
            timestamp: new Date().toISOString()
          }
        };

      case 'stats':
        return {
          type: 'stats',
          data: {
            liveTips: this.stats.liveTips + (Math.random() > 0.5 ? 1 : 0),
            totalEarned: this.stats.totalEarned + Math.floor(Math.random() * 100) + 25,
            activeSpeakers: this.stats.activeSpeakers + (Math.random() > 0.8 ? 1 : 0)
          }
        };

      default:
        return { type: 'stats', data: this.stats };
    }
  }
}

// Export singleton instance
export const mockDataService = new MockDataService();
export default mockDataService;

// Helper functions for formatting
export const formatAmount = (amount: number): string => {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount}`;
};

export const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const generateMockActivity = () => {
  const activities = [
    {
      user: '@DevGuru',
      action: 'just earned',
      amount: '$340',
      detail: 'explaining Layer 2 scaling',
      time: '2m ago'
    },
    {
      user: '@CryptoTeacher',
      action: 'created bounty',
      amount: '$500',
      detail: 'for DeFi beginner videos',
      time: '5m ago'
    },
    {
      user: '@BlockchainBob',
      action: 'completed bounty',
      amount: '$200',
      detail: 'earned for NFT explainer',
      time: '8m ago'
    },
    {
      user: '@ZKMaster',
      action: 'received tip',
      amount: '$150',
      detail: 'for ZK proof explanation',
      time: '12m ago'
    }
  ];

  return activities[Math.floor(Math.random() * activities.length)];
};
