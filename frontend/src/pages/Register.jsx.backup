import { useState } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { User, Users } from 'lucide-react';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    region: 'Kothrud',
    accountType: 'BEGINNER'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/auth/register', form);
      setSuccess(true);
    } catch (err) {
      console.error('Register error:', err);
      if (err.response) {
        setError(err.response.data?.msg || `Server error ${err.response.status}`);
      } else if (err.request) {
        setError('Network error: Unable to reach server. Check backend connection.');
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071426] to-[#0D2138] p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-[#2563EB] mb-4">Registration Successful!</h2>
          <Link to="/login" className="text-[#2563EB]">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071426] to-[#0D2138] p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo light={true} size="lg" />
        </div>
        {error && <p className="text-red-500 mb-2 text-sm">{error}</p>}

        <input type="text" placeholder="Name" className="w-full p-3 mb-4 border border-gray-200 rounded-lg" onChange={(e) => setForm({...form, name: e.target.value})} required />
        <input type="email" placeholder="Email" className="w-full p-3 mb-4 border border-gray-200 rounded-lg" onChange={(e) => setForm({...form, email: e.target.value})} required />
        <input type="password" placeholder="Password" className="w-full p-3 mb-4 border border-gray-200 rounded-lg" onChange={(e) => setForm({...form, password: e.target.value})} required />
        <select className="w-full p-3 mb-4 border border-gray-200 rounded-lg" value={form.region} onChange={(e) => setForm({...form, region: e.target.value})}>
          <option value="Kothrud">Kothrud</option>
          <option value="Hinjewadi">Hinjewadi</option>
          <option value="Baner">Baner</option>
          <option value="Viman Nagar">Viman Nagar</option>
          <option value="Hadapsar">Hadapsar</option>
          <option value="Shivaji Nagar">Shivaji Nagar</option>
          <option value="Pimpri">Pimpri</option>
        </select>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Choose Your Flow</label>
          <div className="grid grid-cols-2 gap-3">
            {/* Beginner Flow Card */}
            <div
              className={`border-2 rounded-xl p-3 cursor-pointer transition ${
                form.accountType === 'BEGINNER' ? 'border-[#2563EB] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setForm({...form, accountType: 'BEGINNER'})}
            >
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-[#2563EB]" />
                <span className="font-semibold text-sm">Beginner Flow</span>
              </div>
              <p className="text-xs text-gray-500">Personal fitness journey</p>
              <div className="mt-2 inline-block bg-[#2563EB] text-white text-xs font-bold px-2 py-1 rounded-full">
                ₹0
              </div>
            </div>

            {/* Pro Athlete Flow Card */}
            <div
              className={`border-2 rounded-xl p-3 cursor-pointer transition ${
                form.accountType === 'PRO' ? 'border-[#2563EB] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setForm({...form, accountType: 'PRO'})}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-[#2563EB]" />
                <span className="font-semibold text-sm">Pro Athlete Flow</span>
              </div>
              <p className="text-xs text-gray-500">Community & competition</p>
              <div className="mt-2 inline-block bg-[#2563EB] text-white text-xs font-bold px-2 py-1 rounded-full">
                ₹299
              </div>
            </div>
          </div>
        </div>

        <button className="w-full bg-[#2563EB] text-white p-3 rounded-lg hover:bg-[#1D4ED8] transition">Register</button>
        <p className="mt-4 text-center text-sm text-gray-600">Already have an account? <Link to="/login" className="text-[#2563EB]">Login</Link></p>
      </form>
    </motion.div>
  );
};

export default Register;