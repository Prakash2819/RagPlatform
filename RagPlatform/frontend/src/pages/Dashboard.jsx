import React, { useState, useEffect } from 'react';
import { useNavigate }   from 'react-router-dom';
import Layout            from '../components/Layout';
import { useAuth }       from '../context/AuthContext';
import { useTheme }      from '../context/ThemeContext';
import API               from '../api/axios';
import { FaFile, FaCheckCircle,FaComments, FaFlask, FaBolt } from 'react-icons/fa';
export default function Dashboard() {
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const { theme }     = useTheme();
  const isDark        = theme === 'dark';

  const [docs,      setDocs]      = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [docsRes, analyticsRes] = await Promise.all([
        API.get('/documents/list'),
        API.get('/tenant/analytics'),
      ]);
      setDocs(docsRes.data.documents || []);
      setAnalytics(analyticsRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatTime = d => {
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return new Date(d).toLocaleDateString();
  };

  const stats = [
    { icon:<FaFile style={{color:"#66bbec"}}/>, label:'Documents',    value: docs.length,                              bg:"#ebf0f0", trend:'Uploaded' },
    { icon:<FaCheckCircle style={{color:"green"}}/>, label:'Ready',        value: docs.filter(d=>d.status==='ready').length, bg:"#ebf0f0", trend:'Indexed'  },
    { icon:<FaComments style={{color:"black"}}/>, label:'Conversations',value: analytics?.total_queries || 0,             bg:"#ebf0f0", trend:'Total'   },
    { icon:<FaBolt style={{color:"#ebbb37"}}/>, label:'Avg Response', value:'1.2s',                                     bg:"#ebf0f0", trend:'Speed'   },
  ];

  const card = {
    background:   isDark ? '#1a1d27' : '#ffffff',
    border:       `1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
    borderRadius: 14,
    overflow:     'hidden',
    boxShadow:    isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
  };

  return (
    <Layout>

      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, margin:'0 0 4px',
                     color: isDark?'#f0f2f8':'#0f172a' }}>
          {greeting()}, {user?.email?.split('@')[0]} 👋
        </h1>
        <p style={{ fontSize:13, color: isDark?'#6b7280':'#64748b', margin:0 }}>
          {user?.company_name} — Knowledge platform overview
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
                    gap:14, marginBottom:20 }}>
        {stats.map((s,i) => (
          <div key={i} style={{ ...card, padding:20 }}>
            <div style={{ width:36, height:36, borderRadius:10,
                          background:s.bg, display:'flex',
                          alignItems:'center', justifyContent:'center',
                          fontSize:16, marginBottom:14 }}>
              {s.icon}
            </div>
            <div style={{ fontSize:24, fontWeight:700, letterSpacing:'-1px',
                          color: isDark?'#f0f2f8':'#0f172a', margin:'0 0 3px' }}>
              {loading ? '...' : s.value}
            </div>
            <div style={{ fontSize:12, color: isDark?'#6b7280':'#64748b',
                          textTransform:'uppercase', letterSpacing:'0.5px',
                          margin:'0 0 8px' }}>
              {s.label}
            </div>
            <span style={{ fontSize:11, color:'#4ade80',
                           background:'rgba(74,222,128,0.1)',
                           padding:'2px 8px', borderRadius:20 }}>
              {s.trend}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 280px', gap:14 }}>

        {/* Recent Queries */}
        <div style={card}>
          <div style={{ padding:'14px 20px', borderBottom:`1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
                        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, fontWeight:700,
                           color: isDark?'#9ca3af':'#64748b',
                           textTransform:'uppercase', letterSpacing:'0.6px' }}>
              Recent Conversations
            </span>
            <button onClick={()=>navigate('/analytics')}
              style={{ fontSize:12, color:'#3b82f6', background:'none',
                       border:'none', cursor:'pointer', fontFamily:'inherit' }}>
              View all →
            </button>
          </div>
          {loading ? (
            <div style={{ padding:40, textAlign:'center',
                          color: isDark?'#6b7280':'#94a3b8' }}>
              Loading...
            </div>
          ) : (analytics?.recent || []).length === 0 ? (
            <div style={{ padding:40, textAlign:'center',
                          color: isDark?'#6b7280':'#94a3b8', fontSize:13 }}>
              No conversations yet.{' '}
              <span style={{ color:'#3b82f6', cursor:'pointer' }}
                onClick={()=>navigate('/chat')}>
                Start chatting
              </span>
            </div>
          ) : (
            (analytics?.recent || []).slice(0,6).map((q,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center',
                                    gap:10, padding:'11px 20px',
                                    borderBottom:`1px solid ${isDark?'#1f2230':'#f1f5f9'}` }}>
                <div style={{ width:7, height:7, borderRadius:'50%',
                               background:'#8b5cf6', flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color: isDark?'#d1d5db':'#374151',
                                overflow:'hidden', textOverflow:'ellipsis',
                                whiteSpace:'nowrap', margin:'0 0 2px' }}>
                    {q.question}
                  </div>
                  <div style={{ fontSize:11, color: isDark?'#4b5563':'#94a3b8' }}>
                    {q.asked_by}
                  </div>
                </div>
                <span style={{ fontSize:11, color: isDark?'#4b5563':'#94a3b8',
                               flexShrink:0 }}>
                  {formatTime(q.asked_at)}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={card}>
          <div style={{ padding:'14px 20px', borderBottom:`1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
                        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, fontWeight:700,
                           color: isDark?'#9ca3af':'#64748b',
                           textTransform:'uppercase', letterSpacing:'0.6px' }}>
              Documents
            </span>
            <button onClick={()=>navigate('/documents')}
              style={{ fontSize:12, color:'#3b82f6', background:'none',
                       border:'none', cursor:'pointer', fontFamily:'inherit' }}>
              Manage →
            </button>
          </div>
          {docs.length === 0 ? (
            <div style={{ padding:40, textAlign:'center',
                          color: isDark?'#6b7280':'#94a3b8', fontSize:13 }}>
              No documents yet.{' '}
              <span style={{ color:'#3b82f6', cursor:'pointer' }}
                onClick={()=>navigate('/documents')}>
                Upload one
              </span>
            </div>
          ) : (
            docs.slice(0,6).map((doc,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center',
                                    gap:10, padding:'11px 20px',
                                    borderBottom:`1px solid ${isDark?'#1f2230':'#f1f5f9'}` }}>
                <div style={{ width:30, height:30, background: isDark?'#252840':'#eff6ff',
                               borderRadius:7, display:'flex',
                               alignItems:'center', justifyContent:'center',
                               fontSize:13, flexShrink:0 }}>
                  <FaFile/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color: isDark?'#d1d5db':'#374151',
                                overflow:'hidden', textOverflow:'ellipsis',
                                whiteSpace:'nowrap', margin:'0 0 2px' }}>
                    {doc.filename}
                  </div>
                  <div style={{ fontSize:11, color: isDark?'#4b5563':'#94a3b8' }}>
                    {doc.chunks_created ? `${doc.chunks_created} chunks` : '...'}
                  </div>
                </div>
                <span style={{ fontSize:10, padding:'2px 8px',
                               borderRadius:20,
                               background: doc.status==='ready'
                                 ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
                               color: doc.status==='ready' ? '#22c55e' : '#fbbf24' }}>
                  {doc.status === 'ready' ? 'Ready' : 'Processing'}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ ...card, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700,
                          color: isDark?'#9ca3af':'#64748b',
                          textTransform:'uppercase', letterSpacing:'0.6px',
                          marginBottom:12 }}>
              Quick Actions
            </div>
            {[
              { label:'Upload Document', path:'/documents', primary:true  },
              { label:'Open Chat',       path:'/chat',      primary:false },
              { label:'Analytics',       path:'/analytics', primary:false },
              { label:'API Key',         path:'/account',   primary:false },
            ].map((btn,i) => (
              <button key={i} onClick={()=>navigate(btn.path)} style={{
                width:'100%', padding:'10px 12px', borderRadius:9,
                border: btn.primary ? 'none'
                  : `1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
                background: btn.primary ? '#2563eb'
                  : isDark ? '#1f2230' : '#f8fafc',
                color: btn.primary ? '#fff'
                  : isDark ? '#c9cdd8' : '#374151',
                cursor:'pointer', fontSize:13, fontWeight:500,
                fontFamily:'inherit', marginBottom:6,
                textAlign:'left', transition:'all 0.15s',
              }}>
                {btn.label}
              </button>
            ))}
          </div>

          <div style={{ ...card, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700,
                          color: isDark?'#9ca3af':'#64748b',
                          textTransform:'uppercase', letterSpacing:'0.6px',
                          marginBottom:12 }}>
              System Status
            </div>
            {['API Gateway','AI Engine','Vector Store','Database'].map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center',
                                    justifyContent:'space-between',
                                    marginBottom:10 }}>
                <span style={{ fontSize:12,
                               color: isDark?'#9ca3af':'#64748b' }}>
                  {s}
                </span>
                <span style={{ fontSize:11, color:'#22c55e',
                               display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:6, height:6, background:'#22c55e',
                                  borderRadius:'50%', display:'inline-block' }}/>
                  Online
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}