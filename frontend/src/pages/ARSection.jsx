import { motion } from 'framer-motion';

const ARSection = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">AR Fitness Experience</h1>
      <p className="text-gray-500 mb-6">This section will host the AR model for interactive workouts.</p>
      <div className="bg-gray-100 rounded-2xl h-96 flex items-center justify-center">
        <p className="text-2xl text-gray-400">🚀 AR Model Coming Soon</p>
      </div>
      <button className="mt-6 bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition">Launch AR (Soon)</button>
    </motion.div>
  );
};

export default ARSection;