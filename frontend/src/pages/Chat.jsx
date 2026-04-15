import React, { useState, useEffect, useRef } from 'react';
import { useAuth }        from '../context/AuthContext';
import { useTheme }       from '../context/ThemeContext';
import EmployeeLayout     from '../components/EmployeeLayout';
import Layout             from '../components/Layout';
import API                from '../api/axios';
import { Send, Bot, User } from 'lucide-react';

const STORAGE_KEY = 'rag_chat_history';

export default function Chat() {
  const { user }   = useAuth();
  const { theme }  = useTheme();
  const isDark     = theme === 'dark';
  const isEmployee = user?.role === 'member';
  const bottomRef  = useRef();

  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [chats,    setChats]    = useState(() => {

    try {
      const saved = localStorage.getItem(
        `${STORAGE_KEY}_${user?.tenant_id}`
      );
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeId, setActiveId] = useState(null);

  const suggestions = [
    'What is the leave policy?',
    'How do I apply for reimbursement?',
    'What is the notice period?',
    'What are the work from home rules?',
  ];

  // Save chats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}_${user?.tenant_id}`,
        JSON.stringify(chats)
      );
    } catch(e) { console.error('Storage error', e); }
  }, [chats, user?.tenant_id]);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    const userMsg  = {
      role:    'user',
      content: question,
      time:    new Date().toISOString(),
    };

    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const res = await API.post('/chat/ask', {
        question,
        chat_history: history,
      });

      const botMsg = {
        role:    'assistant',
        content: res.data.answer,
        time:    new Date().toISOString(),
      };

      const finalMsgs = [...updatedMsgs, botMsg];
      setMessages(finalMsgs);

      if (!activeId) {
        // New chat 
        const newChat = {
          id:       Date.now().toString(),
          title:    question.slice(0, 45),
          messages: finalMsgs,
          time:     new Date().toISOString(),
        };
        const updatedChats = [newChat, ...chats];
        setChats(updatedChats);
        setActiveId(newChat.id);
      } else {
        // Update existing chat
        setChats(prev => prev.map(c =>
          c.id === activeId
            ? { ...c, messages: finalMsgs }
            : c
        ));
      }

    } catch(e) {
      const errMsg = {
        role:    'assistant',
        content: 'Sorry, I had trouble responding. Please try again.',
        time:    new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setActiveId(null);
  };

  const handleSelectChat = id => {
    const chat = chats.find(c => c.id === id);
    if (chat) {
      setMessages(chat.messages || []);
      setActiveId(id);
    }
  };

  const handleDeleteChat = id => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeId === id) handleNewChat();
  };

  // Chat UI
  const chatContent = (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      height: isEmployee ? '100vh' : 'calc(100vh - 60px)',
      background: isDark ? '#0f1117' : '#ffffff',
    }}>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', textAlign: 'center', padding: 24,
          }}>
            <div style={{
              width: 64, height: 64,
              background: 'rgba(37,99,235,0.1)',
              borderRadius: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 28, marginBottom: 16,
            }}>🤖</div>
            <h2 style={{
              fontSize: 20, fontWeight: 700, margin: '0 0 8px',
              color: isDark ? '#f0f2f8' : '#0f172a',
            }}>
              How can I help you today?
            </h2>
            <p style={{
              fontSize: 14,
              color: isDark ? '#9ca3af' : '#64748b',
              margin: '0 0 28px', maxWidth: 400, lineHeight: 1.6,
            }}>
              Ask me anything about your organization's
              policies and documents.
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 8, maxWidth: 480, width: '100%',
            }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)}
                  style={{
                    padding: '12px 14px', borderRadius: 10,
                    textAlign: 'left',
                    border: `1px solid ${isDark ? '#2a2d3a' : '#e5e7eb'}`,
                    background: isDark ? '#1a1d27' : '#f8fafc',
                    color: isDark ? '#9ca3af' : '#64748b',
                    cursor: 'pointer', fontSize: 13,
                    fontFamily: 'inherit',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, marginBottom: 20,
                flexDirection: msg.role === 'user'
                  ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  flexShrink: 0,
                  background: msg.role === 'user'
                    ? '#2563eb'
                    : isDark ? '#1f2230' : '#f1f5f9',
                  border: msg.role === 'assistant'
                    ? `1px solid ${isDark ? '#2a2d3a' : '#e5e7eb'}`
                    : 'none',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {msg.role === 'user'
                    ? <User size={15} color="#fff"/>
                    : <Bot  size={15} color="#3b82f6"/>
                  }
                </div>
                <div style={{
                  maxWidth: '80%', padding: '12px 16px',
                  borderRadius: msg.role === 'user'
                    ? '14px 14px 4px 14px'
                    : '14px 14px 14px 4px',
                  fontSize: 14, lineHeight: 1.7,
                  background: msg.role === 'user'
                    ? '#2563eb'
                    : isDark ? '#1a1d27' : '#f8fafc',
                  color: msg.role === 'user'
                    ? '#fff'
                    : isDark ? '#e8eaf0' : '#0f172a',
                  border: msg.role === 'assistant'
                    ? `1px solid ${isDark ? '#2a2d3a' : '#e5e7eb'}`
                    : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{
                display: 'flex', gap: 12, marginBottom: 20,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isDark ? '#1f2230' : '#f1f5f9',
                  border: `1px solid ${isDark ? '#2a2d3a' : '#e5e7eb'}`,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Bot size={15} color="#3b82f6"/>
                </div>
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '14px 14px 14px 4px',
                  background: isDark ? '#1a1d27' : '#f8fafc',
                  border: `1px solid ${isDark ? '#2a2d3a' : '#e5e7eb'}`,
                  display: 'flex', gap: 5, alignItems: 'center',
                }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: '#3b82f6',
                      animation: `bounce 1s infinite ${i*0.15}s`,
                    }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
        )}
      </div>

      <div style={{
        padding: '14px 20px',
        borderTop: `1px solid ${isDark ? '#1f2230' : '#f1f5f9'}`,
        background: isDark ? '#0f1117' : '#ffffff',
      }}>
        <div style={{
          maxWidth: 700, margin: '0 auto',
          display: 'flex', gap: 8, alignItems: 'flex-end',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message your assistant..."
            rows={1}
            disabled={loading}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 12,
              border: `1.5px solid ${isDark ? '#2a2d3a' : '#e5e7eb'}`,
              background: isDark ? '#1a1d27' : '#f8fafc',
              color: isDark ? '#f0f2f8' : '#0f172a',
              fontSize: 14, outline: 'none', resize: 'none',
              fontFamily: 'inherit', maxHeight: 120,
              overflowY: 'auto',
            }}
          />
          <button onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              width: 42, height: 42, borderRadius: 10,
              border: 'none', flexShrink: 0,
              background: input.trim() && !loading
                ? '#2563eb'
                : isDark ? '#2a2d3a' : '#e5e7eb',
              color: input.trim() && !loading
                ? '#fff'
                : isDark ? '#6b7280' : '#94a3b8',
              cursor: input.trim() && !loading
                ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Send size={16}/>
          </button>
        </div>
        <p style={{
          textAlign: 'center', fontSize: 11,
          color: isDark ? '#4b5563' : '#94a3b8',
          margin: '8px 0 0',
        }}>
          Answers are based on your organization's documents
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%,60%,100%{transform:translateY(0)}
          30%{transform:translateY(-6px)}
        }
      `}</style>
    </div>
  );

  if (isEmployee) {
    return (
      <EmployeeLayout
        chats={chats}
        activeChatId={activeId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      >
        {chatContent}
      </EmployeeLayout>
    );
  }

  return (
    <Layout>
      <div style={{
        margin: '-28px -32px',
        height: 'calc(100vh - 60px)',
        display: 'flex', flexDirection: 'column',
      }}>
        {chatContent}
      </div>
    </Layout>
  );
}