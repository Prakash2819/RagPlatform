import React, { useState, useEffect, useRef } from 'react';
import Layout  from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import API     from '../api/axios';
import { Trash2, Search, Upload } from 'lucide-react';
import { FaFile } from 'react-icons/fa';

export default function Documents() {
  const { theme }      = useTheme();
  const isDark         = theme === 'dark';
  const fileRef        = useRef();

  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search,    setSearch]    = useState('');
  const [deleteId,  setDeleteId]  = useState(null);
  const [msg,       setMsg]       = useState({ type:'', text:'' });

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    try {
      const res = await API.get('/documents/list');
      setDocs(res.data.documents || []);
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg({ type:'', text:'' });
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await API.post('/documents/upload', fd);
      setMsg({ type:'success',
               text:`✅ "${file.name}" uploaded! ${res.data.chunks_created} chunks created.` });
      fetchDocs();
    } catch(e) {
      setMsg({ type:'error',
               text: `❌ ${e.response?.data?.detail || 'Upload failed'}` });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`/documents/${deleteId}`);
      setDocs(prev => prev.filter(d => d._id !== deleteId));
      setDeleteId(null);
    } catch(e) { console.error(e); }
  };

  const formatTime = d => new Date(d).toLocaleDateString();
  const filtered   = docs.filter(d =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  );

  const card = {
    background:   isDark ? '#1a1d27' : '#ffffff',
    border:       `1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
    borderRadius: 14,
  };

  return (
    <Layout>
      <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:'0 0 4px',
                       color: isDark?'#f0f2f8':'#0f172a' }}>
            Documents
          </h1>
          <p style={{ fontSize:13, color: isDark?'#6b7280':'#64748b', margin:0 }}>
            Upload and manage knowledge base documents
          </p>
        </div>
        <label style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'10px 18px', background:'#2563eb',
          color:'#fff', borderRadius:10, cursor:'pointer',
          fontSize:14, fontWeight:600,
          opacity: uploading ? 0.7 : 1,
        }}>
          <Upload size={16}/>
          {uploading ? 'Uploading...' : 'Upload Document'}
          <input ref={fileRef} type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display:'none' }}/>
        </label>
      </div>

      {/* Message */}
      {msg.text && (
        <div style={{
          padding:'12px 16px', borderRadius:10, marginBottom:16,
          fontSize:13, fontWeight:500,
          background: msg.type==='success'
            ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: msg.type==='success' ? '#22c55e' : '#ef4444',
          border:`1px solid ${msg.type==='success'
            ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          {msg.text}
        </div>
      )}

      {/* Upload Area */}
      <div onClick={()=>fileRef.current?.click()}
        style={{ ...card, padding:32, textAlign:'center',
                 cursor:'pointer', marginBottom:20,
                 border:`2px dashed ${isDark?'#2a2d3a':'#e5e7eb'}`,
                 transition:'all 0.2s' }}
        onMouseEnter={e=>e.currentTarget.style.borderColor='#3b82f6'}
        onMouseLeave={e=>e.currentTarget.style.borderColor=isDark?'#2a2d3a':'#e5e7eb'}
      >
        <div style={{ fontSize:32, marginBottom:10 }}>📁</div>
        <div style={{ fontSize:14, fontWeight:600,
                      color: isDark?'#d1d5db':'#374151',
                      marginBottom:4 }}>
          Drop files here or click to upload
        </div>
        <div style={{ fontSize:12, color: isDark?'#6b7280':'#94a3b8' }}>
          Supports PDF, DOCX, TXT
        </div>
      </div>

      <div style={card}>

        <div style={{ padding:'14px 20px',
                      borderBottom:`1px solid ${isDark?'#2a2d3a':'#e5e7eb'}` }}>
          <div style={{ position:'relative', maxWidth:300 }}>
            <Search size={15} style={{ position:'absolute', left:10,
                                       top:'50%', transform:'translateY(-50%)',
                                       color: isDark?'#6b7280':'#94a3b8' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search documents..."
              style={{ width:'100%', padding:'8px 12px 8px 32px',
                       borderRadius:8,
                       border:`1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
                       background: isDark?'#252840':'#f8fafc',
                       color: isDark?'#f0f2f8':'#0f172a',
                       fontSize:13, outline:'none', boxSizing:'border-box',
                       fontFamily:'inherit' }}/>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 100px 100px 80px',
                      padding:'10px 20px',
                      borderBottom:`1px solid ${isDark?'#2a2d3a':'#e5e7eb'}` }}>
          {['Filename','Chunks','Status','Uploaded',''].map((h,i) => (
            <div key={i} style={{ fontSize:11, fontWeight:700,
                                  color: isDark?'#6b7280':'#94a3b8',
                                  textTransform:'uppercase',
                                  letterSpacing:'0.5px',
                                  textAlign: i===4?'right':'left' }}>
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding:40, textAlign:'center',
                        color: isDark?'#6b7280':'#94a3b8', fontSize:13 }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:40, textAlign:'center',
                        color: isDark?'#6b7280':'#94a3b8', fontSize:13 }}>
            No documents found.
          </div>
        ) : filtered.map((doc,i) => (
          <div key={i} style={{
            display:'grid',
            gridTemplateColumns:'1fr 120px 100px 100px 80px',
            padding:'13px 20px',
            borderBottom:`1px solid ${isDark?'#1f2230':'#f1f5f9'}`,
            alignItems:'center',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32,
                             background: isDark?'#252840':'#eff6ff',
                             borderRadius:8, display:'flex',
                             alignItems:'center', justifyContent:'center',
                             fontSize:14, flexShrink:0 }}>
                <FaFile/>
              </div>
              <span style={{ fontSize:13, color: isDark?'#d1d5db':'#374151',
                             fontWeight:500 }}>
                {doc.filename}
              </span>
            </div>
            <div style={{ fontSize:13, color: isDark?'#9ca3af':'#64748b' }}>
              {doc.chunks_created || '—'}
            </div>
            <div>
              <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20,
                             background: doc.status==='ready'
                               ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
                             color: doc.status==='ready' ? '#22c55e' : '#fbbf24' }}>
                {doc.status === 'ready' ? 'Ready' : 'Processing'}
              </span>
            </div>
            <div style={{ fontSize:13, color: isDark?'#9ca3af':'#64748b' }}>
              {formatTime(doc.uploaded_at)}
            </div>
            <div style={{ textAlign:'right' }}>
              <button onClick={()=>setDeleteId(doc._id)}
                onEve
                style={{ background:'none', border:'none', cursor:'pointer',
                         color: isDark?'#6b7280':'#94a3b8', padding:6,
                         borderRadius:6 }}>
                <Trash2 size={15}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {deleteId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      zIndex:100 }}>
          <div style={{ background: isDark?'#1a1d27':'#ffffff',
                        borderRadius:16, padding:32,
                        maxWidth:380, width:'100%', margin:16,
                        textAlign:'center',
                        border:`1px solid ${isDark?'#2a2d3a':'#e5e7eb'}` }}>
            <h3 style={{ fontSize:18, fontWeight:700, margin:'0 0 8px',
                         color: isDark?'#f0f2f8':'#0f172a' }}>
              Delete Document?
            </h3>
            <p style={{ fontSize:13, color: isDark?'#9ca3af':'#64748b',
                        margin:'0 0 24px' }}>
              This cannot be undone. The document and its vectors will be removed.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setDeleteId(null)} style={{
                flex:1, padding:'11px', borderRadius:10,
                border:`1px solid ${isDark?'#2a2d3a':'#e5e7eb'}`,
                background:'transparent',
                color: isDark?'#d1d5db':'#374151',
                cursor:'pointer', fontSize:14, fontWeight:600,
                fontFamily:'inherit',
              }}>
                Cancel
              </button>
              <button onClick={handleDelete} style={{
                flex:1, padding:'11px', borderRadius:10, border:'none',
                background:'#ef4444', color:'#fff',
                cursor:'pointer', fontSize:14, fontWeight:600,
                fontFamily:'inherit',
              }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}