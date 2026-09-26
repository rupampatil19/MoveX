import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  Send,
  Plus,
  Menu,
  X,
  Trash2,
  RefreshCw,
  MessageSquare,
  MoreVertical,
  Pencil,
} from 'lucide-react';
import {
  listConversations,
  createConversation,
  getConversation,
  sendMessage,
  deleteConversation,
  renameConversation,
} from '../services/aiCoachApi';

const QUICK_PROMPTS = [
  { label: 'Daily Plan', text: 'What is my daily plan for today?' },
  { label: 'Improve Performance', text: 'How can I improve my performance?' },
  { label: 'My Goals', text: 'What are my goals and how am I doing?' },
  { label: 'Weekly Review', text: 'Give me a weekly review of my activity.' },
  { label: 'Recovery', text: 'What should I do for recovery?' },
];

function groupConversations(list) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const groups = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] };
  for (const c of list) {
    const d = new Date(c.updatedAt || c.createdAt);
    if (d >= todayStart) groups.Today.push(c);
    else if (d >= yesterdayStart) groups.Yesterday.push(c);
    else if (d >= weekStart) groups['Previous 7 Days'].push(c);
    else groups.Older.push(c);
  }
  return groups;
}

const AICoachPage = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingConv, setLoadingConv] = useState(false);
  const [sending, setSending] = useState(false);
  const [failedText, setFailedText] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const firstName = user?.name?.split(' ')[0] || 'Athlete';

  useEffect(() => {
    (async () => {
      try {
        const list = await listConversations();
        setConversations(list);
        const firstReal = list.find((c) => c.title && c.title !== 'New Chat');
        if (firstReal) {
          await openConversation(firstReal._id);
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending, failedText]);

  const openConversation = async (id) => {
    setLoadingConv(true);
    setFailedText(null);
    try {
      const conv = await getConversation(id);
      setActiveConvId(id);
      setMessages(conv.messages || []);
      setDrawerOpen(false);
    } catch (err) {
      console.error('Failed to load conversation', err);
    } finally {
      setLoadingConv(false);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setFailedText(null);
    setInput('');
    setMenuOpenId(null);
    setDrawerOpen(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const ensureConversation = async () => {
    if (activeConvId) return activeConvId;
    const conv = await createConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(conv._id);
    return conv._id;
  };

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;

    let convId;
    try {
      convId = await ensureConversation();
    } catch (err) {
      console.error('Failed to create conversation', err);
      return;
    }

    const optimisticUser = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput('');
    setSending(true);
    setFailedText(null);

    try {
      const res = await sendMessage(convId, text);
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => !m._optimistic);
        return [...withoutOptimistic, res.userMessage, res.assistantMessage];
      });
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c._id === convId
            ? { ...c, title: res.title, updatedAt: new Date().toISOString() }
            : c
        );
        return [...updated].sort(
          (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        );
      });
    } catch (err) {
      console.error('Send failed', err);
      const errData = err.response?.data;
      if (errData?.userMessage) {
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((m) => !m._optimistic);
          return [...withoutOptimistic, errData.userMessage];
        });
      }
      setFailedText(text);
    } finally {
      setSending(false);
    }
  };

  const handleRetry = () => {
    if (!failedText) return;
    const text = failedText;
    setFailedText(null);
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === 'user' && last.content === text) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    handleSend(text);
  };

  const openRename = (conv) => {
    setMenuOpenId(null);
    setRenameTarget(conv._id);
    setRenameValue(conv.title || '');
  };

  const handleRenameSave = async () => {
    if (!renameTarget) return;
    const title = renameValue.trim();
    if (!title) {
      setRenameTarget(null);
      return;
    }
    try {
      const updated = await renameConversation(renameTarget, title);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === renameTarget ? { ...c, title: updated.title } : c
        )
      );
    } catch (err) {
      console.error('Rename failed', err);
    } finally {
      setRenameTarget(null);
      setRenameValue('');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteConversation(deleteTarget);
      const remaining = conversations.filter((c) => c._id !== deleteTarget);
      setConversations(remaining);
      if (activeConvId === deleteTarget) {
        if (remaining.length > 0) {
          await openConversation(remaining[0]._id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const grouped = useMemo(() => groupConversations(conversations), [conversations]);
  const showWelcome = !loadingConv && messages.length === 0;

  const ConversationItem = ({ conv, onDelete, onRename }) => {
    const isActive = conv._id === activeConvId;
    const menuOpen = menuOpenId === conv._id;

    return (
      <div className="relative">
        <div
          className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
            isActive
              ? 'bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/20'
              : 'text-gray-700 hover:bg-white/50 border border-transparent'
          }`}
          onClick={() => openConversation(conv._id)}
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <span className="flex-1 text-xs font-medium truncate">
            {conv.title || 'New Chat'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpenId(menuOpen ? null : conv._id);
            }}
            className={`p-1 rounded hover:bg-white/60 transition-opacity ${
              isActive || menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            aria-label="More options"
          >
            <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(null);
              }}
            />
            <div
              className="absolute right-1 top-9 z-30 glass-strong rounded-lg py-1 min-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onRename(conv)}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-white/50 flex items-center gap-2"
              >
                <Pencil className="w-3 h-3" /> Rename
              </button>
              <button
                onClick={() => {
                  setMenuOpenId(null);
                  onDelete();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50/60 flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const ConversationListContent = () => (
    <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
      {conversations.length === 0 && (
        <div className="text-center text-xs text-gray-400 py-8 px-3">
          No conversations yet.
          <br />
          Start your first chat below.
        </div>
      )}
      {Object.entries(grouped).map(([label, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={label}>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2.5 mb-1.5">
              {label}
            </p>
            <div className="space-y-0.5">
              {items.map((c) => (
                <ConversationItem
                  key={c._id}
                  conv={c}
                  onDelete={() => setDeleteTarget(c._id)}
                  onRename={openRename}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const Welcome = () => (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] shadow-lg shadow-[#2563EB]/30 flex items-center justify-center mb-4">
        <Bot className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        Hello {firstName}!
      </h2>
      <p className="text-sm text-gray-600 max-w-sm mb-5">
        I'm your MoveX AI Coach. Ask me about your workouts, goals, progress,
        recovery or MoveX journey.
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => handleSend(p.text)}
            className="px-3.5 py-2 rounded-full glass-subtle hover:bg-white/70 hover:text-[#2563EB] text-gray-700 text-xs font-medium transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );

  const MessageBubble = ({ msg }) => {
    const isUser = msg.role === 'user';
    if (isUser) {
      return (
        <div className="flex justify-end">
          <div className="max-w-[85%] sm:max-w-[75%] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm whitespace-pre-wrap break-words shadow-lg shadow-[#2563EB]/25">
            {msg.content}
          </div>
        </div>
      );
    }
    return (
      <div className="flex gap-2.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="max-w-[85%] sm:max-w-[75%] glass rounded-2xl rounded-tl-md px-4 py-2.5 text-sm break-words">
          <div className="text-sm leading-relaxed text-gray-800 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1 [&_strong]:font-semibold [&_code]:bg-white/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  const TypingBubble = () => (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="glass px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"
            style={{
              animation: 'ai-pulse 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );

  const RetryBanner = () => (
    <div className="flex justify-center">
      <div className="glass rounded-lg px-3 py-2 flex items-center gap-2 text-red-700 text-xs border border-red-200/50">
        <span>Your MoveX Coach couldn't respond right now.</span>
        <button
          onClick={handleRetry}
          className="flex items-center gap-1 font-semibold hover:underline"
        >
          <RefreshCw className="w-3 h-3" /> Try Again
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Loading AI Coach...
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <style>{`@keyframes ai-pulse { 0%, 100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-2px); } }`}</style>

      <div className="flex h-[calc(100dvh-200px)] md:h-[calc(100vh-140px)] glass rounded-3xl overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex md:w-64 flex-col border-r border-white/40 bg-white/20">
          <div className="p-3 border-b border-white/40">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1e40af] text-white rounded-xl py-2.5 text-sm font-medium transition-all shadow-lg shadow-[#2563EB]/25"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          <ConversationListContent />
        </aside>

        {/* MAIN CHAT PANEL */}
        <main className="flex-1 flex flex-col min-w-0 bg-white/10">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/40">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-1 -ml-1 text-gray-600 hover:text-gray-900"
              aria-label="Open conversations"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-800 truncate">
                AI Coach
              </h1>
              <p className="text-[11px] text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Ready
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3">
            {loadingConv ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                Loading conversation...
              </div>
            ) : showWelcome ? (
              <Welcome />
            ) : (
              messages.map((msg, idx) => (
                <MessageBubble key={msg._id || `${msg.role}-${idx}`} msg={msg} />
              ))
            )}
            {sending && <TypingBubble />}
            {failedText && <RetryBanner />}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/40 p-3 sm:p-4 bg-white/20 backdrop-blur-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask your MoveX Coach..."
                rows={1}
                className="flex-1 resize-none glass-input rounded-2xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-500 transition-all"
                style={{ maxHeight: '120px' }}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1e40af] disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-all shadow-lg shadow-[#2563EB]/30 shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>

        {/* MOBILE DRAWER */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                key="drawer"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] glass-strong z-50 md:hidden flex flex-col shadow-2xl"
              >
                <div className="p-3 border-b border-white/40 flex items-center gap-2">
                  <button
                    onClick={handleNewChat}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white rounded-xl py-2.5 text-sm font-medium transition-all shadow-lg shadow-[#2563EB]/25"
                  >
                    <Plus className="w-4 h-4" />
                    New Chat
                  </button>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/40 text-gray-500"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <ConversationListContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* RENAME MODAL */}
      <AnimatePresence>
        {renameTarget && (
          <motion.div
            key="rename-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setRenameTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="glass-strong rounded-2xl p-5 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Rename conversation
              </h3>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSave();
                  if (e.key === 'Escape') setRenameTarget(null);
                }}
                maxLength={60}
                autoFocus
                className="w-full glass-input rounded-lg px-3 py-2 text-sm text-gray-800"
              />
              <p className="text-[11px] text-gray-500 mt-1 mb-4">
                {renameValue.length}/60 characters
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setRenameTarget(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameSave}
                  disabled={!renameValue.trim()}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1e40af] disabled:opacity-40 text-white rounded-lg transition-all shadow-md shadow-[#2563EB]/25"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            key="delete-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="glass-strong rounded-2xl p-5 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                Delete this conversation?
              </h3>
              <p className="text-sm text-gray-600 mb-5">
                This action cannot be undone. All messages in this
                conversation will be permanently removed.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all shadow-md shadow-red-500/25"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AICoachPage;