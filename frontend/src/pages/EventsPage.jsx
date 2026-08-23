import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { Zap, Trophy, Users, Clock, ChevronRight, Check, CalendarDays, MapPin } from 'lucide-react';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events');
      setEvents(res.data);
      const featured = res.data.find(e => e.featured) || res.data[0];
      setFeaturedEvent(featured || null);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load events');
      setLoading(false);
    }
  };

  const handleJoin = async (eventId) => {
    try {
      await API.post(`/events/${eventId}/join`);
      alert('Successfully joined event!');
      fetchEvents();
      if (selectedEvent) setSelectedEvent(null);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to join event');
    }
  };

  const handleViewEvent = async (eventId) => {
    try {
      const res = await API.get(`/events/${eventId}`);
      setSelectedEvent(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-6 text-gray-700">Loading events...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Hero Section */}
      {featuredEvent && (
        <div className="bg-blue-700 text-white rounded-3xl p-6 md:p-8 shadow-sm">
          <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-sm mb-3">
            {featuredEvent.type} • Season {featuredEvent.season}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold">{featuredEvent.title}</h1>
          <p className="text-blue-100 mt-2">{featuredEvent.description}</p>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-blue-50">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatCountdown(featuredEvent.endTime)}</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {featuredEvent.participants || 0} participants</span>
            <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-300" /> {featuredEvent.rewardPool?.toLocaleString()} reward pool</span>
          </div>
          <button
            onClick={() => handleJoin(featuredEvent._id)}
            className="mt-4 bg-white text-blue-800 font-semibold px-6 py-2 rounded-full hover:bg-blue-50 transition"
          >
            Join Battle
          </button>
        </div>
      )}

      {/* Events List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Active & Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map(event => (
            <div key={event._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-blue-700 uppercase">{event.type}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  event.status === 'LIVE' ? 'bg-blue-50 text-blue-700' :
                  event.status === 'ENDING_SOON' ? 'bg-orange-50 text-orange-600' :
                  event.status === 'UPCOMING' ? 'bg-blue-50 text-blue-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {event.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{event.description}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatCountdown(event.endTime)}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {event.participants || 0} participants</span>
                <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-500" /> {event.rewardPool?.toLocaleString()}</span>
              </div>
              <button
                onClick={() => handleViewEvent(event._id)}
                className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                View Event <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800">{selectedEvent.title}</h2>
            <p className="text-gray-500 mt-2">{selectedEvent.description}</p>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Start</p>
                <p className="text-gray-800">{new Date(selectedEvent.startTime).toLocaleDateString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">End</p>
                <p className="text-gray-800">{new Date(selectedEvent.endTime).toLocaleDateString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Participants</p>
                <p className="text-gray-800">{selectedEvent.participants}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Reward Pool</p>
                <p className="text-yellow-600">{selectedEvent.rewardPool?.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-gray-700 mt-4"><strong>Rules:</strong> {selectedEvent.rules || 'Not specified'}</p>
            {selectedEvent.userParticipant ? (
              <div className="mt-4 bg-blue-50 text-blue-700 p-3 rounded-lg">
                ✓ You are participating
              </div>
            ) : (
              <button
                onClick={() => handleJoin(selectedEvent._id)}
                className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
              >
                Join Event
              </button>
            )}
            <button
              onClick={() => setSelectedEvent(null)}
              className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

function formatCountdown(endTime) {
  const diff = new Date(endTime) - Date.now();
  if (diff <= 0) return 'Completed';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}d ${hours}h ${mins}m`;
}

export default EventsPage;