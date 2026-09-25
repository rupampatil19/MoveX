import { useState, useEffect, useMemo } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { User, Users } from 'lucide-react';
import { fetchGeoHierarchy } from '../data/fetchHierarchy';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    accountType: 'BEGINNER',
    countryId: 'IN',
    stateId: '',
    cityId: '',
    regionId: '',
  });

  const [hierarchy, setHierarchy] = useState(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ---- Load State → City → Region hierarchy ----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchGeoHierarchy();
        if (alive) setHierarchy(data);
      } catch (err) {
        console.error('Hierarchy load error:', err);
        if (alive) setError('Failed to load locations. Please refresh.');
      } finally {
        if (alive) setLoadingHierarchy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---- Derived dropdown lists ----
  const citiesForState = useMemo(() => {
    if (!hierarchy || !form.stateId) return [];
    return hierarchy.cities.filter((c) => c.stateId === form.stateId);
  }, [hierarchy, form.stateId]);

  const regionsForCity = useMemo(() => {
    if (!hierarchy || !form.cityId) return [];
    return hierarchy.regions[form.cityId] || [];
  }, [hierarchy, form.cityId]);

  // ---- Cascading update handlers ----
  const handleStateChange = (stateId) => {
    setForm((f) => ({
      ...f,
      stateId,
      cityId: '', // clear
      regionId: '', // clear
    }));
  };

  const handleCityChange = (cityId) => {
    setForm((f) => ({
      ...f,
      cityId,
      regionId: '', // clear
    }));
  };

  const handleRegionChange = (regionId) => {
    setForm((f) => ({ ...f, regionId }));
  };

  // ---- Submit ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation
    if (!form.stateId) return setError('Please select your state.');
    if (!form.cityId) return setError('Please select your city.');
    if (!form.regionId) return setError('Please select your region.');

    try {
      // Backend also accepts legacy `region` field — send both for safety
      await API.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        accountType: form.accountType,
        countryId: form.countryId,
        stateId: form.stateId,
        cityId: form.cityId,
        regionId: form.regionId,
        region: form.regionId, // legacy compatibility
      });
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
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center max-w-sm w-full">
          <h2 className="text-2xl font-bold text-[#2563EB] mb-4">Registration Successful!</h2>
          <Link to="/login" className="text-[#2563EB] font-medium">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071426] to-[#0D2138] p-4 py-8"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 w-full max-w-md"
      >
        <div className="mb-6 text-center">
          <Logo light={true} size="lg" />
        </div>

        {error && (
          <p className="text-red-500 mb-3 text-sm bg-red-50 border border-red-100 rounded-lg p-2">
            {error}
          </p>
        )}

        {/* ---- Credentials ---- */}
        <input
          type="text"
          placeholder="Name"
          className="w-full p-3 mb-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border border-gray-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {/* ---- Where do you move? ---- */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Where do you move?</p>

          {loadingHierarchy ? (
            <p className="text-xs text-gray-500">Loading locations…</p>
          ) : (
            <div className="space-y-3">
              {/* STATE */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  State
                </label>
                <select
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#2563EB]"
                  value={form.stateId}
                  onChange={(e) => handleStateChange(e.target.value)}
                  required
                >
                  <option value="">Select your state</option>
                  {hierarchy?.states?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CITY */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  City
                </label>
                <select
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#2563EB] disabled:bg-gray-50 disabled:text-gray-400"
                  value={form.cityId}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={!form.stateId}
                  required
                >
                  <option value="">
                    {!form.stateId ? 'Select your state first' : 'Select your city'}
                  </option>
                  {citiesForState.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* REGION */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  MoveX Region
                </label>
                <select
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#2563EB] disabled:bg-gray-50 disabled:text-gray-400"
                  value={form.regionId}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  disabled={!form.cityId}
                  required
                >
                  <option value="">
                    {!form.cityId ? 'Select your city first' : 'Select your MoveX region'}
                  </option>
                  {regionsForCity.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ---- Flow selection ---- */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Choose Your Flow
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Beginner */}
            <div
              className={`border-2 rounded-xl p-3 cursor-pointer transition ${
                form.accountType === 'BEGINNER'
                  ? 'border-[#2563EB] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setForm({ ...form, accountType: 'BEGINNER' })}
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

            {/* Pro */}
            <div
              className={`border-2 rounded-xl p-3 cursor-pointer transition ${
                form.accountType === 'PRO'
                  ? 'border-[#2563EB] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setForm({ ...form, accountType: 'PRO' })}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-[#2563EB]" />
                <span className="font-semibold text-sm">Pro Athlete Flow</span>
              </div>
              <p className="text-xs text-gray-500">Community &amp; competition</p>
              <div className="mt-2 inline-block bg-[#2563EB] text-white text-xs font-bold px-2 py-1 rounded-full">
                ₹99
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loadingHierarchy}
          className="w-full bg-[#2563EB] text-white p-3 rounded-lg hover:bg-[#1D4ED8] transition font-medium disabled:opacity-60"
        >
          Register
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2563EB]">
            Login
          </Link>
        </p>
      </form>
    </motion.div>
  );
};

export default Register;