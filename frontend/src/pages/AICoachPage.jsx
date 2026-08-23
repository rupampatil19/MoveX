import { useState, useEffect, useRef } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, Sparkles, Target, Zap, Award, Flame, TrendingUp } from 'lucide-react';

const AICoachPage = ({ user }) => {
  const [context, setContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
  try {
    const contextRes = await API.get('/ai-coach/context');

    setContext(contextRes.data);
      setMessages([{ role: 'assistant', content: `Hello ${user.name.split(' ')[0]}! I'm your MoveX AI Coach. How can I help you today?` }]);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    try {
      const res = await API.post('/ai-coach/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    }
  };

  const quickActions = [
    { label: 'Daily Plan', query: 'What is my daily plan?' },
    { label: 'My Progress', query: 'Show my progress' },
    { label: 'Improve Performance', query: 'How can I improve my performance?' },
    { label: 'My Goals', query: 'What are my goals?' },
    { label: 'Community', query: 'Community status' },
    { label: 'Rewards', query: 'What rewards can I earn?' },
  ];

  if (loading) return <div className="p-6 text-gray-700">Loading AI Coach...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold text-gray-800">AI Coach</h1>
      </div>


      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl ${msg.role === 'user' ? 'bg-green-100 text-gray-800' : 'bg-gray-50 text-gray-700'}`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {quickActions.map(action => (
            <button key={action.label} onClick={() => setInput(action.query)} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm hover:bg-gray-200">
              {action.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach..."
            className="flex-1 bg-gray-100 border border-gray-200 rounded-lg p-3 text-gray-800"
          />
          <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 rounded-lg">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {context && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <Zap className="w-6 h-6 text-yellow-500 mx-auto" />
            <p className="text-gray-800 font-bold">{context.weekly.totalEnergy}</p>
            <p className="text-gray-500 text-sm">Energy</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto" />
            <p className="text-gray-800 font-bold">{context.user.streak}</p>
            <p className="text-gray-500 text-sm">Streak</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <TrendingUp className="w-6 h-6 text-green-500 mx-auto" />
            <p className="text-gray-800 font-bold">{context.weekly.activities}</p>
            <p className="text-gray-500 text-sm">Weekly Activities</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <Award className="w-6 h-6 text-purple-500 mx-auto" />
            <p className="text-gray-800 font-bold">{context.user.trophies.length}</p>
            <p className="text-gray-500 text-sm">Trophies</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AICoachPage;