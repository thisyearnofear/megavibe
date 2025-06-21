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
    // Corrected property name from rewardAmount to amount
    result = result.filter(b => parseFloat(b.amount) >= priceRange[0] && parseFloat(b.amount) <= priceRange[1]);
    if (sort === 'highest') {
      result = [...result].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    } else if (sort === 'ending-soon') {
      result = [...result].sort((a, b) => a.deadline - b.deadline);
    } else if (sort === 'most-popular') {
      // Placeholder for engagement sorting
      result = [...result].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    } else {
      result = [...result].sort((a, b) => b.deadline - a.deadline);
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
