import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Home, Compass, BookOpen, MessageCircle, Users, User,
  LogOut, Search, MoreHorizontal, Pin,
  Image, Paperclip, Smile, Send, ChevronLeft,
  CheckCheck, Check, X, Menu
} from 'lucide-react';
import { authService } from '../../services/authService.js';
import { messageService } from '../../services/messageService.js';
import './MessagesPage.css';

// ─── Navigation helper ────────────────────────────────────────────────────────
function navigate(hash) {
  window.location.hash = hash;
  window.dispatchEvent(new Event('navigated'));
}

// ─── Avatar with image fallback ────────────────────────────────────────────────
function ConvAvatar({ src, name, size = 46, online = false }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="mp-conv-avatar-wrap">
      <div className="mp-conv-avatar" style={{ width: size, height: size, minWidth: size, minHeight: size }}>
        {src && !imgErr ? (
          <img src={src} alt={name} onError={() => setImgErr(true)} />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {online && <span className="mp-online-dot" />}
    </div>
  );
}

// ─── Nav Rail ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'home', Icon: Home, label: 'Home', hash: '/home' },
  { id: 'discover', Icon: Compass, label: 'Discover', hash: '/discover' },
  { id: 'learning', Icon: BookOpen, label: 'Learning', hash: '/learning' },
  { id: 'messages', Icon: MessageCircle, label: 'Messages', hash: '/messages' },
  { id: 'community', Icon: Users, label: 'Community', hash: '/connections' },
];

function NavRail({ user }) {
  const handleLogout = async () => {
    await authService.logout();
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new Event('navigated'));
  };

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <nav className="mp-nav-rail" aria-label="Main navigation">
      <button className="mp-nav-logo" onClick={() => navigate('/home')} aria-label="EVOLV Home">
        <span>ev</span>
      </button>

      <div className="mp-nav-items">
        {NAV_ITEMS.map(({ id, Icon, label, hash }) => (
          <button
            key={id}
            className={`mp-nav-btn${id === 'messages' ? ' active' : ''}`}
            onClick={() => navigate(hash)}
            aria-label={label}
            aria-current={id === 'messages' ? 'page' : undefined}
          >
            <Icon size={20} />
            <span className="mp-nav-tooltip">{label}</span>
          </button>
        ))}

        <div className="mp-nav-divider" />

        <button className="mp-nav-btn" onClick={() => navigate('/profile')} aria-label="Profile">
          <User size={20} />
          <span className="mp-nav-tooltip">Profile</span>
        </button>
      </div>

      <div className="mp-nav-bottom">
        <button
          className="mp-nav-btn"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={18} />
          <span className="mp-nav-tooltip">Log out</span>
        </button>
        <button className="mp-nav-avatar-btn" aria-label="Your profile">
          {initials}
        </button>
      </div>
    </nav>
  );
}

// ─── Conversation Item ─────────────────────────────────────────────────────────
function ConversationItem({ conv, isActive, onClick }) {
  return (
    <div
      className={`mp-conv-item${isActive ? ' active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Conversation with ${conv.user}`}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <ConvAvatar src={conv.avatar} name={conv.user} size={46} online={conv.online} />
      <div className="mp-conv-body">
        <div className="mp-conv-top">
          <span className="mp-conv-name">{conv.user}</span>
          <span className="mp-conv-time">{conv.timestamp}</span>
        </div>
        <div className="mp-conv-bottom">
          <span className={`mp-conv-preview${conv.unreadCount > 0 ? ' unread' : ''}`}>
            {conv.lastMessage}
          </span>
          {conv.unreadCount > 0 && (
            <span className="mp-unread-badge">{conv.unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Learning Goal Card (rich message) ────────────────────────────────────────
function LearningGoalCard({ card }) {
  const skills = Array.isArray(card?.skills) ? card.skills : [];
  const progress = card?.progress ?? 0;

  return (
    <div className="mp-learning-card">
      <div className="mp-lc-label">Learning Goal</div>
      <div className="mp-lc-title">{card?.title}</div>
      <div className="mp-lc-progress-wrap">
        <div className="mp-lc-progress-top">
          <span className="mp-lc-progress-label">Progress</span>
          <span className="mp-lc-progress-pct">{progress}%</span>
        </div>
        <div className="mp-lc-bar">
          <div className="mp-lc-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="mp-lc-skills">
        {skills.map(skill => (
          <span key={skill} className="mp-lc-skill-tag">{skill}</span>
        ))}
      </div>
      <button className="mp-lc-btn">
        View Learning Goal
      </button>
    </div>
  );
}

// ─── Single message bubble ────────────────────────────────────────────────────
function MessageBubble({ msg, conv }) {
  const isMe = msg.sender === 'me';

  // Tick icon: faded while sending, faded when delivered, solid when read
  const renderStatus = () => {
    if (!isMe) return null;
    if (msg.status === 'sending') {
      return <Check size={13} className="mp-msg-status" style={{ opacity: 0.25 }} />;
    }
    if (msg.status === 'delivered') {
      return <Check size={13} className="mp-msg-status" style={{ opacity: 0.5 }} />;
    }
    if (msg.status === 'read') {
      return <CheckCheck size={13} className="mp-msg-status" />;
    }
    return null;
  };

  return (
    <div className={`mp-msg-row ${msg.sender}`} aria-label={isMe ? 'Sent message' : `Message from ${conv?.user}`}>
      {!isMe ? (
        <div className="mp-msg-avatar">
          {conv?.avatar ? (
            <img src={conv.avatar} alt={conv.user} onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            (conv?.user || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          )}
        </div>
      ) : (
        <div className="mp-msg-avatar-spacer" />
      )}

      <div className="mp-msg-content">
        {msg.type === 'learning-card' ? (
          <LearningGoalCard card={msg.card} />
        ) : (
          <div className="mp-bubble">{msg.text}</div>
        )}
        <div className="mp-msg-meta">
          <span className="mp-msg-time">{msg.timestamp}</span>
          {renderStatus()}
        </div>
      </div>

      <div className="mp-msg-avatar-spacer" />
    </div>
  );
}

// ─── Message Composer ─────────────────────────────────────────────────────────
function MessageComposer({ onSend }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="mp-composer">
      <div className="mp-composer-inner">
        <div className="mp-composer-actions">
          <button className="mp-composer-icon-btn" aria-label="Attach file">
            <Paperclip size={17} />
          </button>
          <button className="mp-composer-icon-btn" aria-label="Send image">
            <Image size={17} />
          </button>
          <button className="mp-composer-icon-btn" aria-label="Emoji">
            <Smile size={17} />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="mp-composer-textarea"
          placeholder="Write a message..."
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Message input"
        />

        <button
          className="mp-send-btn"
          onClick={handleSend}
          disabled={!text.trim()}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Chat Window ──────────────────────────────────────────────────────────────
function ChatWindow({ conv, messages, onSend, onBack, chatOpen, onMenu, loading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conv) {
    return (
      <div className={`mp-chat${chatOpen ? ' chat-open' : ''}`}>
        <div className="mp-empty-chat">
          <div className="mp-empty-chat-icon">
            <MessageCircle size={28} />
          </div>
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mp-chat${chatOpen ? ' chat-open' : ''}`}>
      {/* Header */}
      <header className="mp-chat-header">
        <button
          type="button"
          className="mp-back-btn"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          className="mp-mobile-menu-btn"
          onClick={onMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        <ConvAvatar src={conv.avatar} name={conv.user} size={40} online={conv.online} />

        <div className="mp-chat-header-info">
          <div className="mp-chat-header-name">{conv.user}</div>
          <div className={`mp-chat-header-status${!conv.online ? ' offline' : ''}`}>
            <span className="mp-chat-header-status-dot" />
            {conv.online ? 'Online' : 'Offline'}
          </div>
        </div>

        <div className="mp-chat-header-actions">
          <button className="mp-header-action-btn" aria-label="Search messages"><Search size={18} /></button>
          <button className="mp-header-action-btn" aria-label="Pin conversation"><Pin size={18} /></button>
          <button className="mp-header-action-btn" aria-label="Media"><Image size={18} /></button>
          <button className="mp-header-action-btn" aria-label="More options"><MoreHorizontal size={18} /></button>
        </div>
      </header>

      {/* Messages */}
      <div className="mp-messages-area" role="log" aria-live="polite" aria-label="Messages">
        <div className="mp-date-sep">
          <span className="mp-date-sep-label">Today</span>
        </div>

        {loading && messages.length === 0 && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(9,3,15,0.4)' }}>
            Loading messages…
          </p>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} conv={conv} />
        ))}

        <div ref={endRef} />
      </div>

      {/* Composer */}
      <MessageComposer onSend={onSend} />
    </div>
  );
}

// ─── Messages Page (root) ─────────────────────────────────────────────────────
export default function MessagesPage() {
  const user = authService.getCurrentUser();
  const myId = user?.id ?? user?.userId ?? user?._id ?? null;

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [allMessages, setAllMessages] = useState({});
  const [convLoading, setConvLoading] = useState(true);
  const [convError, setConvError] = useState('');
  const [msgLoading, setMsgLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeId) ?? null;
  const activeMessages = (activeId && allMessages[activeId]) || [];

  // Load conversations on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setConvLoading(true);
        setConvError('');
        const list = await messageService.getConversations();
        if (!cancelled) setConversations(list);
      } catch (err) {
        if (!cancelled) setConvError('Could not load conversations.');
        console.error('[MessagesPage]', err);
      } finally {
        if (!cancelled) setConvLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Filter conversations by search
  const q = searchQuery.toLowerCase();
  const filteredConversations = conversations.filter((c) =>
    (c.user || '').toLowerCase().includes(q) ||
    (c.lastMessage || '').toLowerCase().includes(q)
  );

  const handleSelectConversation = async (conv) => {
    setActiveId(conv.id);
    setChatOpen(true);

    // clear unread badge locally
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
    if (conv.unreadCount > 0) messageService.markRead(conv.id).catch(() => { });

    // fetch only once per conversation
    if (allMessages[conv.id]) return;
    try {
      setMsgLoading(true);
      const msgs = await messageService.getMessages(conv.id, myId);
      setAllMessages((prev) => ({ ...prev, [conv.id]: msgs }));
    } catch (err) {
      console.error('[MessagesPage] load messages failed:', err);
      setAllMessages((prev) => ({ ...prev, [conv.id]: [] }));
    } finally {
      setMsgLoading(false);
    }
  };

  const handleSend = useCallback(async (text) => {
    if (!activeId) return;
    const convId = activeId;
    const tempId = `local-${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const tempMsg = { id: tempId, sender: 'me', text, timestamp: timeStr, status: 'sending', type: 'text' };

    setAllMessages((prev) => ({ ...prev, [convId]: [...(prev[convId] || []), tempMsg] }));
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, lastMessage: text, timestamp: timeStr } : c))
    );

    try {
      const saved = await messageService.sendMessage(convId, text, myId);
      setAllMessages((prev) => ({
        ...prev,
        [convId]: (prev[convId] || []).map((m) => (m.id === tempId ? saved : m)),
      }));
    } catch (err) {
      console.error('[MessagesPage] send failed:', err);
      setAllMessages((prev) => ({
        ...prev,
        [convId]: (prev[convId] || []).filter((m) => m.id !== tempId),
      }));
    }
  }, [activeId, myId]);

  return (
    <div className="mp-layout">
      {/* Left navigation rail */}
      <NavRail user={user} />

      {mobileMenuOpen && (
        <div className="mp-mobile-nav-layer">
          <button
            type="button"
            className="mp-mobile-nav-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          />

          <aside className="mp-mobile-nav-drawer" aria-label="Main navigation">
            <div className="mp-mobile-nav-header">
              <div className="mp-nav-logo">
                <span>ev</span>
              </div>

              <button
                type="button"
                className="mp-mobile-menu-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={22} />
              </button>
            </div>

            {NAV_ITEMS.map(({ id, Icon, label, hash }) => (
              <button
                key={id}
                type="button"
                className={`mp-mobile-nav-item ${id === 'messages' ? 'active' : ''}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (id !== 'messages') navigate(hash);
                }}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}

            <div className="mp-mobile-nav-divider" />

            <button
              type="button"
              className="mp-mobile-nav-item"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/profile');
              }}
            >
              <User size={20} />
              <span>Profile</span>
            </button>

            <button
              type="button"
              className="mp-mobile-nav-item"
              onClick={async () => {
                setMobileMenuOpen(false);
                await authService.logout();
                window.history.pushState({}, '', '/login');
                window.dispatchEvent(new Event('navigated'));
              }}
            >
              <LogOut size={20} />
              <span>Log out</span>
            </button>
          </aside>
        </div>
      )}

      {/* Conversation sidebar */}
      <aside className={`mp-sidebar${chatOpen ? ' chat-open' : ''}`} aria-label="Conversations">
        <div className="mp-sidebar-header">
          <div className="mp-search-wrap">
            <Search size={15} />
            <input
              className="mp-search-input"
              type="search"
              placeholder="Search conversations"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search conversations"
            />
          </div>
          <h1 className="mp-sidebar-title">Messages</h1>
          <button
            type="button"
            className="mp-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={22} />
          </button>
        </div>

        <div className="mp-conv-list" role="list" aria-label="Conversation list">
          {convLoading ? (
            <div style={{ padding: '24px 20px', fontSize: 14, color: 'rgba(9,3,15,0.4)' }}>
              Loading conversations…
            </div>
          ) : convError ? (
            <div style={{ padding: '24px 20px', fontSize: 14, color: '#c41c4a' }}>{convError}</div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '24px 20px', fontSize: 14, color: 'rgba(9,3,15,0.35)' }}>
              {conversations.length === 0 ? 'No conversations yet' : 'No conversations found'}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeId}
                onClick={() => handleSelectConversation(conv)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Chat window */}
      <ChatWindow
        conv={activeConv}
        messages={activeMessages}
        onSend={handleSend}
        onBack={() => setChatOpen(false)}
        chatOpen={chatOpen}
        loading={msgLoading}
        onMenu={() => setMobileMenuOpen(true)}
      />
    </div>
  );
}