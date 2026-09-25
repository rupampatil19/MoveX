const NextRewardProgress = ({ balance, rewards }) => {
  if (!rewards || rewards.length === 0) return null;

  const next = [...rewards]
    .filter(r => r.trophyCost > balance)
    .sort((a, b) => a.trophyCost - b.trophyCost)[0];
  if (!next) return null;

  const pct = Math.min(100, Math.round((balance / next.trophyCost) * 100));
  const remaining = next.trophyCost - balance;

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Next Reward</p>
      <p className="font-bold text-gray-900 mt-1">{next.name}</p>
      <div className="mt-3 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#2563EB] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>🏆 {balance} / {next.trophyCost}</span>
        <span>You need {remaining} more Trophies.</span>
      </div>
    </div>
  );
};

export default NextRewardProgress;