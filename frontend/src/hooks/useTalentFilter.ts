import { useMemo, useState } from 'react';
import { Performer } from '../data/performers';

export type TalentFilter = 'all' | 'speaker' | 'musician' | 'comedian';

export function useTalentFilter(
  performers: Performer[],
  initialFilter: TalentFilter = 'all'
) {
  const [filter, setFilter] = useState<TalentFilter>(initialFilter);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'name' | 'reputation' | 'tips'>('name');

  const filtered = useMemo(() => {
    let result = performers;
    if (filter !== 'all') {
      result = result.filter(p => p.type === filter);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(s) ||
        (p.genre?.toLowerCase().includes(s) ?? false) ||
        (p.bio?.toLowerCase().includes(s) ?? false)
      );
    }
    if (sort === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'reputation') {
      result = [...result].sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0));
    } else if (sort === 'tips') {
      result = [...result].sort((a, b) => (b.tipCount ?? 0) - (a.tipCount ?? 0));
    }
    return result;
  }, [performers, filter, search, sort]);

  return {
    filter, setFilter,
    search, setSearch,
    sort, setSort,
    filtered
  };
}
