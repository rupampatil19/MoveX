import { motion } from 'framer-motion';

const ARSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 flex items-center justify-center min-h-[70vh]"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">AR Fitness Experience</h1>
        <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-[#2563EB]">COMING SOON</h2>
          <p className="text-gray-500 mt-2">
            An immersive AR fitness experience is currently under development.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ARSection;