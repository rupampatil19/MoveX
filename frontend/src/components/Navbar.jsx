import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = ({ user, logout }) => {
  return (
    <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} className="bg-indigo-600 text-white p-4 flex justify-between items-center shadow-lg">
      <Link to="/" className="text-2xl font-bold">MoveX</Link>
      <div className="flex gap-4 items-center">
        <Link to="/" className="hover:text-yellow-300">Dashboard</Link>
        <Link to="/leaderboard" className="hover:text-yellow-300">Leaderboard</Link>
        <Link to="/profile" className="hover:text-yellow-300">Profile</Link>
        <Link to="/settings" className="hover:text-yellow-300">Settings</Link>
        <Link to="/ar" className="hover:text-yellow-300 bg-yellow-500 px-3 py-1 rounded-full text-black font-semibold">AR</Link>
        <button onClick={logout} className="bg-red-500 px-3 py-1 rounded-full">Logout</button>
      </div>
    </motion.nav>
  );
};

export default Navbar;