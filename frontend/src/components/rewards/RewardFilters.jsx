const ORDER = ['all', 'COSMETIC', 'BOOST', 'PARTNER', 'CLAN', 'EXPERIENCE'];

const RewardFilters = ({ active, onChange, labels, sort, onSortChange }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {ORDER.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${
            active === c
              ? 'bg-[#2563EB] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {labels[c]}
        </button>
      ))}
    </div>
    <select
      value={sort}
      onChange={e => onSortChange(e.target.value)}
      className="text-sm border rounded-lg px-3 py-2 bg-white"
    >
      <option value="recommended">Recommended</option>
      <option value="cost_asc">Cost: Low → High</option>
      <option value="cost_desc">Cost: High → Low</option>
      <option value="newest">Newest</option>
    </select>
  </div>
);

export default RewardFilters;