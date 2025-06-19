import { useMemo, useState } from 'react';

export type BountyStatus = 'all' | 'active' | 'claimed' | 'expired';
export type BountySort = 'newest' | 'highest' | 'ending-soon' | 'most-popular';

export function useBountyFilter(
  bounties: any[],
  initialStatus: BountyStatus = 'active',
  initialSort: BountySort = 'newest'
) {
  const [status, setStatus] = useState<BountyStatus>(initialStatus);
  const [sort, setSort] = useState<BountySort>(initialSort);
  const [speakerId, setSpeakerId] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  const filtered = useMemo(() => {
    let result = bounties;
    if (status !== 'all') {
      result = result.filter(b => b.status === status);
    }
    if (speakerId) {
      result = result.filter(b => b.speaker.username === speakerId);
    }
    result = result.filter(b => b.rewardAmount >= priceRange[0] && b.rewardAmount <= priceRange[1]);
    if (sort === 'highest') {
      result = [...result].sort((a, b) => b.rewardAmount - a.rewardAmount);
    } else if (sort === 'ending-soon') {
      result = [...result].sort((a, b) => a.timeRemaining - b.timeRemaining);
    } else if (sort === 'most-popular') {
      result = [...result].sort((a, b) => b.rewardAmount - a.rewardAmount); // Placeholder for engagement
    } else {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [bounties, status, sort, speakerId, priceRange]);

  return {
    status, setStatus,
    sort, setSort,
    speakerId, setSpeakerId,
    priceRange, setPriceRange,
    filtered
  };
}
