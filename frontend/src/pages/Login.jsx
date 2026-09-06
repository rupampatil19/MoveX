import { useState } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const Login = ({ setUser }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('/auth/login', form);
      
      // Store token and user data in localStorage
      localStorage.setItem('movex_token', res.data.token);
      localStorage.setItem('movex_user', JSON.stringify(res.data.user));
      
      // Update app state with logged-in user
      setUser(res.data.user);
      
      // Redirect to dashboard
      window.location.href = '/';
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        setError(err.response.data?.msg || `Server error ${err.response.status}`);
      } else if (err.request) {
        setError('Network error: Unable to reach server. Check backend connection.');
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  const testBackend = async () => {
    setBackendStatus('Testing...');
    try {
      const res = await API.get('/health');
      setBackendStatus(`Backend Connected ✓ (${res.data.status})`);
    } catch (err) {
      setBackendStatus('Backend Unreachable ✕');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071426] to-[#0D2138] p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 w-full max-w-sm">
        <div className="mb-6 text-center">
          <Logo light={true} size="lg" />
        </div>
        {error && <p className="text-red-500 mb-2 text-sm">{error}</p>}
        <input type="email" placeholder="Email" className="w-full p-3 mb-4 border border-gray-200 rounded-lg" onChange={(e) => setForm({...form, email: e.target.value})} required />
        <input type="password" placeholder="Password" className="w-full p-3 mb-4 border border-gray-200 rounded-lg" onChange={(e) => setForm({...form, password: e.target.value})} required />
        <button className="w-full bg-[#2563EB] text-white p-3 rounded-lg hover:bg-[#1D4ED8] transition">Login</button>
        <p className="mt-4 text-center text-sm text-gray-600">No account? <Link to="/register" className="text-[#2563EB]">Register</Link></p>
        <button type="button" onClick={testBackend} className="mt-4 text-sm underline text-gray-400 w-full">
          Test Backend Connection
        </button>
        {backendStatus && <p className="text-xs mt-1 text-center">{backendStatus}</p>}
      </form>
    </motion.div>
  );
};

export default Login;