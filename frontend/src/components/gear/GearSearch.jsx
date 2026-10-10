/**
 * GearSearch - live gear price comparison via TinyFish Agent API.
 * Drop into any page: import GearSearch from '../components/gear/GearSearch';
 */
import { useState } from 'react';
import { Search, ExternalLink, Loader2 } from 'lucide-react';
import API from '../../api';
import MoveXCard from '../ui/MoveXCard';
import Button from '../ui/Button';

export default function GearSearch() {
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params = { q: query.trim() };
      if (maxPrice) params.maxPrice = maxPrice;
      const res = await API.get('/gear/search', { params: params });
      setResults(res.data.results || []);
    } catch (err) {
      setError(err.response && err.response.data && err.response.data.msg || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search gear (e.g. running shoes)"
          className="flex-1 px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
        />
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max price (optional)"
          className="w-full sm:w-40 px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
        />
        <Button variant="primary" onClick={handleSearch} loading={loading} icon={loading ? Loader2 : Search}>
          {loading ? 'Searching' : 'Search'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-sm text-ink-500">
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#2563EB] mb-2" />
          TinyFish agent is browsing retailers...
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div className="text-center py-8 text-sm text-ink-500">
          No results found. Try a broader query.
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((item, i) => (
            <MoveXCard key={i} variant="bento" padded={false} className="p-3 flex flex-col gap-2">
              {item.image && (
                <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded-lg" />
              )}
              <p className="text-sm font-semibold text-ink-900 line-clamp-2">{item.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#2563EB] tabular-nums">
                  {'\u20B9'}{Number(item.price).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-ink-500">
                  {item.source}
                </span>
              </div>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#2563EB] font-medium hover:underline"
                >
                  View deal <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </MoveXCard>
          ))}
        </div>
      )}
    </div>
  );
}
