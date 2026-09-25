import { motion } from 'framer-motion';

const RedemptionSuccessModal = ({ result, onViewReward, onContinue }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl"
    >
      <div className="text-5xl">🎉</div>
      <h2 className="text-2xl font-extrabold text-gray-900 mt-2">REWARD UNLOCKED!</h2>
      <p className="font-bold text-[#2563EB] mt-3 text-lg">{result.reward_name}</p>
      <p className="text-gray-600 mt-1">−{result.trophy_cost} Trophies</p>

      <div className="mt-4 border-t pt-4">
        <p className="text-sm text-gray-500">Remaining Balance</p>
        <p className="text-2xl font-bold">🏆 {result.new_balance}</p>
      </div>

      <div className="flex flex-col gap-2 mt-6">
        <button
          onClick={onViewReward}
          className="w-full py-3 bg-[#2563EB] text-white rounded-xl font-semibold hover:bg-blue-700"
        >
          View Reward
        </button>
        <button
          onClick={onContinue}
          className="w-full py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold"
        >
          Continue Shopping
        </button>
      </div>
    </motion.div>
  </div>
);

export default RedemptionSuccessModal;