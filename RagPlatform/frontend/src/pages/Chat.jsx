import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth }        from '../context/AuthContext';
import { useTheme }       from '../context/ThemeContext';
import EmployeeLayout     from '../components/EmployeeLayout';
import Layout             from '../components/Layout';
import { Send, Bot, User, StopCircle } from 'lucide-react';
import { FaBrain, FaRobot } from 'react-icons/fa';

const STORAGE_KEY = 'rag_chat_history';
const WS_URL      = 'ws://localhost:8000/chat/ws';

export default function Chat() {
  const { user }   = useAuth();
  const { theme }  = useTheme();
  const isDark     = theme === 'dark';
  const isEmployee = user?.role === 'member';
  const bottomRef  = useRef();
  const wsRef      = useRef(null);

  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [streaming,  setStreaming]  = useState(false);
  const [streamText, setStreamText] = useState('');
  const [chats,      setChats]      = useState(() => {
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
    } catch(e) {}
  }, [chats]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, streamText]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // ── Connect WebSocket ──────────────────────────
  const connectWS = useCallback(() => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(
        `${WS_URL}/${user?.tenant_id}`
      );

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        resolve(ws);
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        reject(e);
      };

      wsRef.current = ws;
    });
  }, [user?.tenant_id]);

  // ── Send message via WebSocket ─────────────────
  const handleSend = async () => {
    if (!input.trim() || loading || streaming) return;

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
    setStreamText('');

    // Build history
    const history = messages.map(m => ({
      role:    m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    try {
      // Connect WebSocket
      const ws = await connectWS();
      setLoading(false);
      setStreaming(true);

      let fullAnswer = '';

      // Send question
      ws.send(JSON.stringify({
        question,
        token:        localStorage.getItem('token') || '',
        chat_history: history,
      }));

      // Handle incoming messages
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'start') {
          console.log(`Bot: ${data.chatbot_name}`);
        }

        else if (data.type === 'chunk') {
          fullAnswer += data.chunk;
          setStreamText(prev => prev + data.chunk);
        }

        else if (data.type === 'done') {
          setStreaming(false);
          setStreamText('');

          const botMsg = {
            role:    'assistant',
            content: fullAnswer,
            time:    new Date().toISOString(),
          };

          const finalMsgs = [...updatedMsgs, botMsg];
          setMessages(finalMsgs);

          // Save to chat history
          if (!activeId) {
            const newChat = {
              id:       Date.now().toString(),
              title:    question.slice(0, 45),
              messages: finalMsgs,
              time:     new Date().toISOString(),
            };
            setChats(prev => [newChat, ...prev]);
            setActiveId(newChat.id);
          } else {
            setChats(prev => prev.map(c =>
              c.id === activeId
                ? { ...c, messages: finalMsgs }
                : c
            ));
          }

          ws.close();
        }

        else if (data.type === 'error') {
          setStreaming(false);
          setStreamText('');
          setMessages(prev => [...prev, {
            role:    'assistant',
            content: data.message || 'Something went wrong.',
            time:    new Date().toISOString(),
          }]);
          ws.close();
        }
      };

      ws.onclose = () => {
        setLoading(false);
        setStreaming(false);
      };

      ws.onerror = () => {
        setLoading(false);
        setStreaming(false);
        setStreamText('');
        setMessages(prev => [...prev, {
          role:    'assistant',
          content: 'Connection error. Please try again.',
          time:    new Date().toISOString(),
        }]);
      };

    } catch(e) {
      // Fallback to HTTP if WebSocket fails
      console.log('WebSocket failed, using HTTP fallback');
      setLoading(false);
      setStreaming(false);

      try {
        const API = (await import('../api/axios')).default;
        const res = await API.post('/chat/ask', {
          question,
          chat_history: history.map(m => ({
            role:    m.role,
            content: m.content,
          })),
        });

        const botMsg = {
          role:    'assistant',
          content: res.data.answer,
          time:    new Date().toISOString(),
        };
        const finalMsgs = [...updatedMsgs, botMsg];
        setMessages(finalMsgs);

        if (!activeId) {
          const newChat = {
            id:       Date.now().toString(),
            title:    question.slice(0, 45),
            messages: finalMsgs,
            time:     new Date().toISOString(),
          };
          setChats(prev => [newChat, ...prev]);
          setActiveId(newChat.id);
        }

      } catch(httpErr) {
        setMessages(prev => [...prev, {
          role:    'assistant',
          content: 'Failed to get response. Please try again.',
          time:    new Date().toISOString(),
        }]);
      }
    }
  };

  // ── Stop streaming ─────────────────────────────
  const handleStop = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (streamText) {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: streamText,
        time:    new Date().toISOString(),
      }]);
    }
    setStreaming(false);
    setStreamText('');
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    if (wsRef.current) wsRef.current.close();
    setMessages([]);
    setInput('');
    setActiveId(null);
    setStreamText('');
    setStreaming(false);
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

  // ── Chat UI ────────────────────────────────────
  const chatContent = (
    <div style={{
      flex:1, display:'flex', flexDirection:'column',
      height: isEmployee ? '100vh' : 'calc(100vh - 60px)',
      background: isDark ? '#0f1117' : '#ffffff',
    }}>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 0' }}>
        {messages.length === 0 && !streaming ? (
          <div style={{
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            height:'100%', textAlign:'center', padding:24,
          }}>
            <div style={{
              width:64, height:64,
              background:'rgba(37,99,235,0.1)',
              borderRadius:16, display:'flex',
              alignItems:'center', justifyContent:'center',
              fontSize:28, marginBottom:16,
            }}><FaBrain/></div>
            <h2 style={{ fontSize:20, fontWeight:700,
                         margin:'0 0 8px',
                         color: isDark?'#f0f2f8':'#0f172a' }}>
              How can I help you today?
            </h2>
            <p style={{ fontSize:14,
                        color: isDark?'#9ca3af':'#64748b',
                        margin:'0 0 28px', maxWidth:400,
                        lineHeight:1.6 }}>
              Ask anything about your organization's
              policies and documents.
            </p>
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr',
              gap:8, maxWidth:480, width:'100%',
            }}>
              {suggestions.map((s,i) => (
                <button key={i} onClick={() => setInput(s)}
                  style={{
                    padding:'12px 14px', borderRadius:10,
                    textAlign:'left',
                    border:`1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
                    background: isDark?'#1a1d27':'#f8fafc',
                    color: isDark?'#9ca3af':'#64748b',
                    cursor:'pointer', fontSize:13,
                    fontFamily:'inherit',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth:700, margin:'0 auto',
                        padding:'0 16px' }}>

            {/* Existing messages */}
            {messages.map((msg, i) => (
              <div key={i} style={{
                display:'flex', gap:12, marginBottom:20,
                flexDirection: msg.role==='user'
                  ? 'row-reverse' : 'row',
                alignItems:'flex-start',
              }}>
                <div style={{
                  width:32, height:32, borderRadius:'50%',
                  flexShrink:0,
                  background: msg.role==='user'
                    ? '#2563eb'
                    : isDark?'#1f2230':'#f1f5f9',
                  border: msg.role==='assistant'
                    ? `1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`
                    : 'none',
                  display:'flex', alignItems:'center',
                  justifyContent:'center',
                }}>
                  {msg.role==='user'
                    ? <User size={15} color="#fff"/>
                    : <Bot  size={15} color="#3b82f6"/>
                  }
                </div>
                <div style={{
                  maxWidth:'80%',
                  padding:'12px 16px',
                  borderRadius: msg.role==='user'
                    ? '14px 14px 4px 14px'
                    : '14px 14px 14px 4px',
                  fontSize:14, lineHeight:1.7,
                  background: msg.role==='user'
                    ? '#2563eb'
                    : isDark?'#1a1d27':'#f8fafc',
                  color: msg.role==='user'
                    ? '#fff'
                    : isDark?'#e8eaf0':'#0f172a',
                  border: msg.role==='assistant'
                    ? `1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`
                    : 'none',
                  whiteSpace:'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streaming && (
              <div style={{
                display:'flex', gap:12, marginBottom:20,
                alignItems:'flex-start',
              }}>
                <div style={{
                  width:32, height:32, borderRadius:'50%',
                  flexShrink:0,
                  background: isDark?'#1f2230':'#f1f5f9',
                  border:`1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
                  display:'flex', alignItems:'center',
                  justifyContent:'center',
                }}>
                  <Bot size={15} color="#3b82f6"/>
                </div>
                <div style={{
                  maxWidth:'80%',
                  padding:'12px 16px',
                  borderRadius:'14px 14px 14px 4px',
                  fontSize:14, lineHeight:1.7,
                  background: isDark?'#1a1d27':'#f8fafc',
                  color: isDark?'#e8eaf0':'#0f172a',
                  border:`1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
                  whiteSpace:'pre-wrap',
                }}>
                  {streamText || (
                    <span style={{ display:'flex', gap:4 }}>
                      {[0,1,2].map(i => (
                        <span key={i} style={{
                          width:7, height:7,
                          borderRadius:'50%',
                          background:'#3b82f6',
                          display:'inline-block',
                          animation:`bounce 1s infinite ${i*0.15}s`,
                        }}/>
                      ))}
                    </span>
                  )}
                  {/* Blinking cursor */}
                  {streamText && (
                    <span style={{
                      display:'inline-block',
                      width:2, height:16,
                      background:'#3b82f6',
                      marginLeft:2,
                      animation:'blink 1s infinite',
                      verticalAlign:'middle',
                    }}/>
                  )}
                </div>
              </div>
            )}

            {/* Loading dots (connecting) */}
            {loading && !streaming && (
              <div style={{
                display:'flex', gap:12, marginBottom:20,
              }}>
                <div style={{
                  width:32, height:32, borderRadius:'50%',
                  background: isDark?'#1f2230':'#f1f5f9',
                  border:`1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
                  display:'flex', alignItems:'center',
                  justifyContent:'center',
                }}>
                  <Bot size={15} color="#3b82f6"/>
                </div>
                <div style={{
                  padding:'14px 18px',
                  borderRadius:'14px 14px 14px 4px',
                  background: isDark?'#1a1d27':'#f8fafc',
                  border:`1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
                  display:'flex', gap:5, alignItems:'center',
                }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width:7, height:7,
                      borderRadius:'50%',
                      background:'#3b82f6',
                      animation:`bounce 1s infinite ${i*0.15}s`,
                    }}/>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef}/>
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{
        padding:'14px 20px',
        borderTop:`1px solid ${isDark?'#1f2230':'#f1f5f9'}`,
        background: isDark?'#0f1117':'#ffffff',
      }}>
        <div style={{
          maxWidth:700, margin:'0 auto',
          display:'flex', gap:8, alignItems:'flex-end',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message your assistant..."
            rows={1}
            disabled={loading}
            style={{
              flex:1, padding:'12px 16px',
              borderRadius:12,
              border:`1.5px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
              background: isDark?'#1a1d27':'#f8fafc',
              color: isDark?'#f0f2f8':'#0f172a',
              fontSize:14, outline:'none', resize:'none',
              fontFamily:'inherit', maxHeight:120,
              overflowY:'auto',
            }}
            onFocus={e =>
              e.target.style.borderColor='#3b82f6'}
            onBlur={e =>
              e.target.style.borderColor=
                isDark?'#2a2d3a':'#e5e7eb'}
          />

          {/* Stop button while streaming */}
          {streaming ? (
            <button onClick={handleStop} style={{
              width:42, height:42, borderRadius:10,
              border:'none', background:'#ef4444',
              color:'#fff', cursor:'pointer',
              display:'flex', alignItems:'center',
              justifyContent:'center', flexShrink:0,
            }} title="Stop generating">
              <StopCircle size={18}/>
            </button>
          ) : (
            <button onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width:42, height:42, borderRadius:10,
                border:'none', flexShrink:0,
                background: input.trim() && !loading
                  ? '#2563eb'
                  : isDark?'#2a2d3a':'#e5e7eb',
                color: input.trim() && !loading
                  ? '#fff'
                  : isDark?'#6b7280':'#94a3b8',
                cursor: input.trim() && !loading
                  ? 'pointer' : 'not-allowed',
                display:'flex', alignItems:'center',
                justifyContent:'center',
              }}>
              <Send size={16}/>
            </button>
          )}
        </div>

        <p style={{
          textAlign:'center', fontSize:11,
          color: isDark?'#4b5563':'#94a3b8',
          margin:'8px 0 0',
        }}>
          {streaming
            ? '⚡ Generating response...'
            : 'Answers based on your organization\'s documents'
          }
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%,60%,100%{transform:translateY(0)}
          30%{transform:translateY(-6px)}
        }
        @keyframes blink {
          0%,100%{opacity:1}
          50%{opacity:0}
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
        margin:'-28px -32px',
        height:'calc(100vh - 60px)',
        display:'flex', flexDirection:'column',
      }}>
        {chatContent}
      </div>
    </Layout>
  );
}