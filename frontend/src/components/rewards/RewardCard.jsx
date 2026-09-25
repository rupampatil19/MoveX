import { useState } from 'react';

const CATEGORY_FALLBACK_ICON = {
  COSMETIC: '🎨',
  BOOST: '⚡',
  PARTNER: '🎟️',
  CLAN: '🚩',
  EXPERIENCE: '🏁',
};

const RewardCard = ({ reward, balance, onRedeem, busy }) => {
  const [localBusy, setLocalBusy] = useState(false);
  const canAfford = balance >= reward.trophyCost;
  const short = reward.trophyCost - balance;
  const expired = reward.availableUntil && new Date(reward.availableUntil) < new Date();
  const outOfStock =
    reward.stock !== null && reward.stock !== undefined && reward.stock <= 0;
  const disabled = localBusy || busy || !canAfford || expired || outOfStock;

  const handle = async () => {
    if (disabled) return;
    setLocalBusy(true);
    try {
      await onRedeem(reward);
    } finally {
      setLocalBusy(false);
    }
  };

  return (
    <div
      className="
        bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md
        transition p-3 sm:p-4 md:p-5 flex flex-col h-full
      "
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="text-2xl sm:text-3xl md:text-4xl">
          {reward.iconEmoji ||
            reward.icon ||
            CATEGORY_FALLBACK_ICON[reward.category] ||
            '🎁'}
        </div>
        <div className="flex-1 min-w-0">
          <span className="inline-block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
            {reward.category}
          </span>
        </div>
      </div>

      <h3 className="font-bold text-gray-900 mt-2 leading-tight text-sm sm:text-base">
        {reward.name}
      </h3>

      <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2 flex-1">
        {reward.description}
      </p>

      <div className="mt-2 flex items-center gap-1 sm:gap-2 text-gray-900 font-bold text-sm">
        <span>🏆</span>
        <span>{reward.trophyCost}</span>
        <span className="text-xs sm:text-sm font-medium text-gray-600">Trophies</span>
      </div>

      {reward.availableUntil && !expired && (
        <p className="text-[10px] sm:text-xs text-amber-600 mt-1">
          ⏳ Until {new Date(reward.availableUntil).toLocaleDateString()}
        </p>
      )}
      {reward.stock !== null && reward.stock !== undefined && (
        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
          {reward.stock} left
        </p>
      )}

      <div className="mt-3">
        <button
          onClick={handle}
          disabled={disabled}
          className={`w-full py-2 sm:py-2.5 rounded-xl font-semibold transition text-xs sm:text-sm leading-tight ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#2563EB] text-white hover:bg-blue-700 active:scale-[0.99]'
          }`}
        >
          {localBusy
            ? 'Redeeming…'
            : expired
            ? 'Expired'
            : outOfStock
            ? 'Out of Stock'
            : canAfford
            ? `Redeem · ${reward.trophyCost}`
            : `Need ${short} More`}
        </button>
      </div>
    </div>
  );
};

export default RewardCard;