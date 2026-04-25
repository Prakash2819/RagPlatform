import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { MdLayers } from 'react-icons/md'
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [tab, setTab] = useState('org');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Live domain hint
  const domain = form.email.includes('@')
    ? form.email.split('@')[1] : '';

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const switchTab = t => {
    setTab(t);
    setForm({ email: '', password: '' });
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const endpoint = tab === 'org'
        ? '/auth/login'
        : '/auth/login/employee';

      const res = await API.post(endpoint, {
        email: form.email,
        password: form.password,
      });

      login(res.data.token, {
        email: form.email,
        role: res.data.role,
        tenant_id: res.data.tenant_id,
        user_id: res.data.user_id,
        company_name: res.data.company_name,
      });

      if (res.data.role === 'superadmin') navigate('/superadmin');
      else if (res.data.role === 'admin') navigate('/dashboard');
      else navigate('/chat');

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={s.logo}><i class="fa-solid fa-layer-group" style={{backgroundColor:"blue", padding:"10px", width:"50px" , borderRadius:"10px"}}></i></div>
          <h1 style={s.brand}>RAG Platform</h1>
          <p style={s.tagline}>AI-powered knowledge assistant</p>
        </div>

        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(tab === 'org' ? s.tabOn : s.tabOff) }}
            onClick={() => switchTab('org')}
          >
            Organization
          </button>
          <button
            style={{ ...s.tab, ...(tab === 'employee' ? s.tabOn : s.tabOff) }}
            onClick={() => switchTab('employee')}
          >
            Employee
          </button>
        </div>

        <p style={s.desc}>
          {tab === 'org'
            ? 'Sign in to manage your organization'
            : 'Sign in to access your company chatbot'
          }
        </p>

        {error && <div style={s.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>

          <div style={s.field}>
            <label style={s.label}>
              {tab === 'org' ? 'Email' : 'Work Email'}
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder={tab === 'org'
                ? 'admin@company.com'
                : 'you@yourcompany.com'
              }
              required
              style={s.input}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={s.input}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: 24, textAlign: 'center',
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          {tab === 'org' ? (
            <>
              <p style={s.footerText}>
                New organization?{' '}
                <Link to="/register" style={s.link}>
                  Register here
                </Link>
              </p>
            </>
          ) : (
            <>
              <p style={s.footerText}>
                No account yet?{' '}
                <Link to="/register/employee" style={s.link}>
                  Register as employee
                </Link>
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', background: '#f8fafc',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 24,
    fontFamily: "'DM Sans', Arial, sans-serif",
  },
  card: {
    background: '#ffffff', borderRadius: 20,
    padding: 40, width: '100%', maxWidth: 420,
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    border: '1px solid #f1f5f9',
  },
  logo: { fontSize: 28, marginBottom: 10, display: 'block' , color:"white",padding:"10px"},
  brand: {
    fontSize: 22, fontWeight: 700, color: '#0f172a',
    margin: '0 0 4px', letterSpacing: '-0.3px'
  },
  tagline: { fontSize: 13, color: '#94a3b8', margin: 0 },
  tabs: {
    display: 'flex', padding: 4, marginBottom: 20, gap: 4,
  },
  tab: {
    flex: 1, padding: '10px', border: 'none',
    borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
  },
  tabOn: {
    background: '#2563eb', color: '#ffffff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
  },
  tabOff: { background: 'transparent', color: '#64748b' },
  desc: {
    fontSize: 13, color: '#64748b', textAlign: 'center',
    marginBottom: 20, lineHeight: 1.5,
  },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#dc2626', borderRadius: 10, padding: 12,
    fontSize: 13, marginBottom: 16,
  },
  field: { marginBottom: 16 },
  label: {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#374151', marginBottom: 6
  },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid #e5e7eb', fontSize: 14,
    outline: 'none', color: '#0f172a', background: '#ffffff',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  hint: {
    background: '#eff6ff', border: '1px solid #bfdbfe',
    color: '#1d4ed8', borderRadius: 8, padding: '8px 12px',
    fontSize: 12, marginTop: 6,
  },
  btn: {
    width: '100%', padding: 13, background: '#2563eb',
    color: '#ffffff', border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    marginTop: 4, fontFamily: 'inherit', transition: 'background 0.2s',
  },
  footerText: { fontSize: 13, color: '#64748b', margin: 0 },
  link: { color: '#2563eb', textDecoration: 'none', fontWeight: 600 },
  linkBtn: {
    background: 'none', border: 'none', color: '#2563eb',
    cursor: 'pointer', fontWeight: 600, fontSize: 13,
    fontFamily: 'inherit', padding: 0,
  },
};