import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../context/AuthContext';
import {
  MessageSquare, Plus, Trash2,
  LogOut, Menu, X, BrainCircuit
} from 'lucide-react';

export default function EmployeeLayout({
  children, chats, activeChatId,
  onSelectChat, onNewChat, onDeleteChat
}) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(true);

  return (
    <div style={{ display:'flex', height:'100vh',
                  background:'#ffffff', fontFamily:'Arial,sans-serif' }}>

      <aside style={{
        width:      open ? '260px' : '0px',
        minWidth:   open ? '260px' : '0px',
        overflow:   'hidden',
        background: '#fff',
        display:    'flex',
        flexDirection:'column',
        transition: 'width 0.2s, min-width 0.2s',
        height:     '100vh',
        borderRight: '1px solid #e6dede'
      }}>

        <div style={{ padding:'16px 12px',
                      display:'flex', alignItems:'center',
                      justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, background:'#2563eb',
                          borderRadius:7, display:'flex',
                          alignItems:'center', justifyContent:'center' }}>
              <BrainCircuit size={16} color="#fff"/>
            </div>
            <span style={{ color:'black', fontWeight:700,
                           fontSize:14 }}>
              {user?.company_name || 'RAG Platform'}
            </span>
          </div>
        </div>

        <div style={{ padding:'0 8px 8px' }}>
          <button onClick={onNewChat} style={{
            width:'100%', display:'flex', alignItems:'center',
            gap:8, padding:'10px 12px', borderRadius:8,
            border:'1px solid #e6dede', background:'transparent',
            color:'black', cursor:'pointer', fontSize:13,
            fontWeight:500, fontFamily:'inherit', transition:'all 0.15s',
          }}
          onMouseEnter={e=>e.currentTarget.style.background='#e0e3ec'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <Plus size={16}/> New chat
          </button>
        </div>

        {/* Chat History */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 8px' }}>
          {chats.length > 0 && (
            <div style={{ fontSize:11, color:'#4b5563',
                          padding:'8px 4px 4px',
                          textTransform:'uppercase', letterSpacing:'0.5px' }}>
              Recent
            </div>
          )}
          {chats.map(chat => (
            <div key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'9px 10px', borderRadius:8,
                cursor:'pointer', transition:'all 0.15s',
                background: activeChatId === chat.id
                  ? 'white' : 'transparent',
                marginBottom:1,
              }}
              onMouseEnter={e=>e.currentTarget.style.background='#e3e5ee'}
              onMouseLeave={e=>e.currentTarget.style.background=
                activeChatId===chat.id?'white':'transparent'}
            >
              <MessageSquare size={14} color="#6b7280"/>
              <span style={{ flex:1, fontSize:13, color:'black',
                             overflow:'hidden', textOverflow:'ellipsis',
                             whiteSpace:'nowrap' }}>
                {chat.title || 'New conversation'}
              </span>
              <button
                onClick={e=>{e.stopPropagation();onDeleteChat(chat.id);}}
                style={{ background:'none', border:'none', cursor:'pointer',
                         padding:3, borderRadius:4, opacity:1,
                         color:'#6b7280', transition:'opacity 0.15s' }}
                 onMouseEnter={e=>e.currentTarget.style.color='red'}
                 onMouseLeave={e=>e.currentTarget.style.color='#6b7280'}
              >
                <Trash2 size={13}/>
              </button>
            </div>
          ))}
          {chats.length === 0 && (
            <div style={{ textAlign:'center', padding:'24px 8px',
                          color:'#4b5563', fontSize:13 }}>
              No conversations yet
            </div>
          )}
        </div>

        <div style={{ padding:'8px', borderTop:'1px solid #e6dede' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8,
                        padding:'10px', borderRadius:8,
                        background:'white' }}>
            <div style={{ width:28, height:28, borderRadius:'50%',
                          background:'#2563eb', display:'flex',
                          alignItems:'center', justifyContent:'center',
                          fontSize:12, fontWeight:700, color:'#fff',
                          flexShrink:0 }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={{ fontSize:12, color:'black',
                            overflow:'hidden', textOverflow:'ellipsis',
                            whiteSpace:'nowrap' }}>
                {user?.email}
              </div>
            </div>
            <button
              onClick={()=>{logout();navigate('/login');}}
              style={{ background:'none', border:'none',
                       cursor:'pointer', color:'#6b7280', padding:4 }}
              title="Logout"

              onMouseEnter={e=>e.currentTarget.style.color='red'}
              onMouseLeave={e=>e.currentTarget.style.color='#6b7280'}
            >
              <LogOut size={15}/>
            </button>
          </div>
        </div>
      </aside>

      <div style={{ flex:1, display:'flex', flexDirection:'column',
                    height:'100vh', overflow:'hidden' }}>

        <div style={{ position:'absolute', top:12, left: open?268:12,
                      zIndex:50, transition:'left 0.2s' }}>
          <button onClick={()=>setOpen(!open)}
            style={{ background:'none', border:'none',
                     cursor:'pointer', padding:6, borderRadius:6,
                     color:'#64748b' }}>
            {open ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}