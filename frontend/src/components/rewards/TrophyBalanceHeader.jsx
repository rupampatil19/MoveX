import { Trophy } from 'lucide-react';

const TrophyBalanceHeader = ({ balance, loading }) => {
  const isKnown = balance !== null && !loading;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1e40af] text-white p-6 shadow-lg">
      <p className="text-xs uppercase tracking-widest opacity-80">Your Trophy Balance</p>
      <div className="flex items-center gap-3 mt-2">
        <Trophy size={36} className="opacity-90" />
        <span className="text-5xl font-extrabold tabular-nums">
          {isKnown ? balance : '…'}
        </span>
      </div>
      <p className="text-xs mt-2 opacity-70">
        {isKnown
          ? 'Earned from verified MoveX activities.'
          : 'Loading your balance…'}
      </p>
    </div>
  );
};

export default TrophyBalanceHeader;