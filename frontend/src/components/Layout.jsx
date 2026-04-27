import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png'
import { FaBuilding } from "react-icons/fa";
import {
  LayoutDashboard, Files, MessageSquare,
  BarChart3, UserCircle, LogOut,
  BrainCircuit, Sun, Moon, Menu, X
} from 'lucide-react';

const NAV = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Documents', path: '/documents', icon: Files },
  { name: 'Chat', path: '/chat', icon: MessageSquare },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Account', path: '/account', icon: UserCircle },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const isDark = theme === 'dark';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <aside style={{
        width: open ? '240px' : '0px',
        minWidth: open ? '240px' : '0px',
        overflow: 'hidden',
        background: isDark ? '#1a1d27' : '#ffffff',
        borderRight: `1px solid ${isDark ? '#2a2d3a' : '#e5e7eb'}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        top: 0, left: 0,
        zIndex: 50,
        transition: 'width 0.2s, min-width 0.2s',
      }}>

        <div style={{
          padding: '15px 20px 20px', display: 'flex',
          alignItems: 'center', gap: '10px'
        }}>
          <div style={{
            width: 36, height: 36, background: '#fff',
            borderRadius: 50, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <img
              src={logo}
              alt="Logo"
              style={{
                height: '100%',
                width: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: '16px',
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #00ff7f, #00c6ff, #8a2be2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}
          >
            NexaBOt
          </span>
        </div>

        <div style={{
          margin: '0 12px 16px', padding: '8px 12px',
          background: isDark ? '#252840' : '#eff6ff',
          borderRadius: 8, fontSize: 12,
          color: isDark ? '#9ca3af' : '#64748b',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          <FaBuilding /> {user?.company_name || 'Organization'}
        </div>

        <nav style={{
          flex: 1, padding: '0 8px', display: 'flex',
          flexDirection: 'column', gap: 2
        }}>
          {NAV.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                background: active
                  ? '#2563eb'
                  : 'transparent',
                color: active
                  ? '#ffffff'
                  : isDark ? '#9ca3af' : '#64748b',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = isDark ? '#252840' : '#f1f5f9'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{
          padding: '12px 8px',
          borderTop: `1px solid ${isDark ? '#2a2d3a' : '#e5e7eb'}`
        }}>
          <div style={{
            padding: '8px 12px', display: 'flex',
            alignItems: 'center', gap: 8, marginBottom: 4
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: '#2563eb', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff'
            }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontSize: 13, fontWeight: 600,
                color: isDark ? '#f0f2f8' : '#0f172a',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.email}
              </div>
              <div style={{ fontSize: 11, color: isDark ? '#6b7280' : '#94a3b8' }}>
                Admin
              </div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 8, padding: '9px 12px', borderRadius: 10,
              border: 'none', background: 'transparent',
              color: '#ef4444', cursor: 'pointer', fontSize: 14,
              fontWeight: 500, fontFamily: 'inherit'
            }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{
        marginLeft: open ? '230px' : '0px',
        flex: 1, transition: 'margin 0.2s',
        display: 'flex', flexDirection: 'column'
      }}>


        <header style={{
          height: 60,
          borderBottom: `1px solid ${isDark ? '#2a2d3a' : '#e5e7eb'}`,
          background: isDark ? '#1a1d27' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0, zIndex: 40,
        }}>
          <button onClick={() => setOpen(!open)}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', padding: 6, borderRadius: 8,marginTop:'5px',
              color: isDark ? '#9ca3af' : '#64748b'
            }}>
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
          <button onClick={toggleTheme}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', padding: 6, borderRadius: 8,
              color: isDark ? '#9ca3af' : '#64748b'
            }}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>


        <main style={{
          flex: 1, padding: '28px 32px',
          maxWidth: 1200, width: '100%', margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}