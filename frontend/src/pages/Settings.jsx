import { useState } from 'react';
import { motion } from 'framer-motion';

const Settings = ({ user }) => {
  const [region, setRegion] = useState(user.region);
  const [name, setName] = useState(user.name);
  const [message, setMessage] = useState('');

  const handleUpdate = (e) => {
    e.preventDefault();
    setMessage('Settings updated (demo)');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
      <form onSubmit={handleUpdate} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-md">
        {message && <p className="mb-4 text-blue-700">{message}</p>}
        <label className="block mb-2 text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-200 rounded-lg"
        />
        <label className="block mb-2 text-gray-700">Region</label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-200 rounded-lg"
        >
          <option value="Kothrud">Kothrud</option>
          <option value="Hinjewadi">Hinjewadi</option>
          <option value="Baner">Baner</option>
          <option value="Viman Nagar">Viman Nagar</option>
          <option value="Hadapsar">Hadapsar</option>
          <option value="Shivaji Nagar">Shivaji Nagar</option>
          <option value="Pimpri">Pimpri</option>
        </select>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          Update Settings
        </button>
      </form>
    </motion.div>
  );
};

export default Settings;