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

  // Load conversations on mount
  useEffect(() => {
    (async () => {
      try {
        const list = await listConversations();
        setConversations(list);
        // Only auto-open a conversation that actually has content.
        // Skip abandoned empty "New Chat" rows from earlier sessions.
        const firstReal = list.find(
          (c) => c.title && c.title !== 'New Chat'
        );
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

  // Auto-scroll to newest message
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
    // Always start a fresh conversation on the client side.
    // The DB record is created lazily when the first message is sent.
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

  // ----- Render helpers -----

  const ConversationItem = ({ conv, onDelete, onRename }) => {
    const isActive = conv._id === activeConvId;
    const menuOpen = menuOpenId === conv._id;

    return (
      <div className="relative">
        <div
          className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
            isActive
              ? 'bg-[#2563EB]/10 text-[#2563EB]'
              : 'text-gray-700 hover:bg-gray-100'
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
            className={`p-1 rounded hover:bg-gray-200/70 transition-opacity ${
              isActive || menuOpen
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
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
              className="absolute right-1 top-9 z-30 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onRename(conv)}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Pencil className="w-3 h-3" /> Rename
              </button>
              <button
                onClick={() => {
                  setMenuOpenId(null);
                  onDelete();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
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
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2.5 mb-1.5">
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
      <div className="w-14 h-14 rounded-full bg-[#2563EB]/10 flex items-center justify-center mb-3">
        <Bot className="w-7 h-7 text-[#2563EB]" />
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        Hello {firstName}!
      </h2>
      <p className="text-sm text-gray-500 max-w-sm mb-5">
        I'm your MoveX AI Coach. Ask me about your workouts, goals, progress,
        recovery or MoveX journey.
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => handleSend(p.text)}
            className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-[#2563EB]/10 hover:text-[#2563EB] text-gray-600 text-xs font-medium transition-colors"
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
          <div className="max-w-[85%] sm:max-w-[75%] bg-[#2563EB] text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm whitespace-pre-wrap break-words">
            {msg.content}
          </div>
        </div>
      );
    }
    return (
      <div className="flex gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-[#2563EB]" />
        </div>
        <div className="max-w-[85%] sm:max-w-[75%] bg-gray-50 text-gray-800 px-4 py-2.5 rounded-2xl rounded-tl-md text-sm break-words">
          <div className="text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1 [&_strong]:font-semibold [&_code]:bg-gray-200/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  const TypingBubble = () => (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-[#2563EB]" />
      </div>
      <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400"
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
      <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
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

      <div className="flex h-[calc(100dvh-200px)] md:h-[calc(100vh-140px)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex md:w-64 flex-col border-r border-gray-100 bg-gray-50/40">
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          <ConversationListContent />
        </aside>

        {/* MAIN CHAT PANEL */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-1 -ml-1 text-gray-600 hover:text-gray-900"
              aria-label="Open conversations"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Bot className="w-5 h-5 text-[#2563EB] shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-800 truncate">
                AI Coach
              </h1>
              <p className="text-[11px] text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
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
          <div className="border-t border-gray-100 p-3 sm:p-4">
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
                className="flex-1 resize-none bg-gray-100 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50 transition-all"
                style={{ maxHeight: '120px' }}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-colors shrink-0"
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
                className="fixed inset-0 bg-black/40 z-40 md:hidden"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                key="drawer"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white z-50 md:hidden flex flex-col shadow-2xl"
              >
                <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                  <button
                    onClick={handleNewChat}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Chat
                  </button>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
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
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setRenameTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl"
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
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50"
              />
              <p className="text-[11px] text-gray-400 mt-1 mb-4">
                {renameValue.length}/60 characters
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setRenameTarget(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameSave}
                  disabled={!renameValue.trim()}
                  className="px-4 py-2 text-sm font-medium bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white rounded-lg transition-colors"
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
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                Delete this conversation?
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                This action cannot be undone. All messages in this
                conversation will be permanently removed.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
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