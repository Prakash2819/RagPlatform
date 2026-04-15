import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function EmployeeRegister() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: ''
  });
  const [domainStatus, setDomainStatus] = useState(null);
  // null | 'checking' | 'found' | 'notfound'
  const [companyName,  setCompanyName]  = useState('');
  const [errors,       setErrors]       = useState({});
  const [apiErr,       setApiErr]       = useState('');
  const [loading,      setLoading]      = useState(false);

  // Check domain 
  useEffect(() => {
    const parts = form.email.split('@');
    if (parts.length === 2 && parts[1].includes('.')) {
      checkDomain(parts[1]);
    } else {
      setDomainStatus(null);
      setCompanyName('');
    }
  }, [form.email]);

  const checkDomain = async (domain) => {
    setDomainStatus('checking');
    try {
      // ← REAL API CALL to your backend
      const res = await API.get(
        `/auth/check-domain?domain=${domain}`
      );
      if (res.data.exists) {
        setDomainStatus('found');
        setCompanyName(res.data.company_name);
      } else {
        setDomainStatus('notfound');
        setCompanyName('');
      }
    } catch {
      setDomainStatus('notfound');
      setCompanyName('');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setApiErr('');
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())
      e.name = 'Name is required';
    if (domainStatus !== 'found')
      e.email = 'Organization not found for this email';
    if (form.password.length < 8)
      e.password = 'Minimum 8 characters required';
    if (form.password !== form.confirm)
      e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiErr('');

    try {
      const res = await API.post('/auth/register/employee', {
        name:     form.name,
        email:    form.email,
        password: form.password,
      });

      login(res.data.token, {
        email:        form.email,
        role:         'member',
        tenant_id:    res.data.tenant_id,
        user_id:      res.data.user_id,
        company_name: res.data.company_name,
      });

      navigate('/chat');

    } catch (err) {
      setApiErr(
        err.response?.data?.detail ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Password strength checker
  const getStrength = () => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8)          score++;
    if (/[A-Z]/.test(p))        score++;
    if (/[0-9]/.test(p))        score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
    return { score, label: labels[score], color: colors[score] };
  };

  const pw = getStrength();

  return (
    <div style={S.page}>
      <div style={S.card}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>👤</div>
          <h1 style={S.brand}>Employee Registration</h1>
          <p style={S.tagline}>
            Join your organization's knowledge platform
          </p>
        </div>

        {apiErr && (
          <div style={S.error}>⚠️ {apiErr}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ravi Kumar"
              style={{
                ...S.input,
                ...(errors.name ? S.inputErr : {})
              }}
            />
            {errors.name && (
              <span style={S.fieldErr}>{errors.name}</span>
            )}
          </div>

          <div style={S.field}>
            <label style={S.label}>
              Work Email
              <span style={S.hint}>
                — must be your company email
              </span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@yourcompany.com"
              style={{
                ...S.input,
                borderColor:
                  domainStatus === 'found'    ? '#22c55e' :
                  domainStatus === 'notfound' ? '#ef4444' :
                  errors.email               ? '#fca5a5' :
                  '#e5e7eb',
              }}
            />

            {domainStatus === 'checking' && (
              <div style={S.statusInfo}>
                🔍 Checking organization...
              </div>
            )}

            {domainStatus === 'found' && (
              <div style={S.statusFound}>
                ✅ Organization found:{' '}
                <strong>{companyName}</strong>
              </div>
            )}

            {domainStatus === 'notfound' && (
              <div style={S.statusNotFound}>
                ❌ No organization registered with this
                email domain. Ask your admin to{' '}
                <Link to="/register" style={{ color: '#dc2626' }}>
                  register your company
                </Link>{' '}
                first.
              </div>
            )}

            {!domainStatus && !errors.email && (
              <p style={S.helperText}>
                We find your organization from your
                email domain automatically
              </p>
            )}

            {errors.email && !domainStatus && (
              <span style={S.fieldErr}>{errors.email}</span>
            )}
          </div>

          <div style={S.field}>
            <label style={S.label}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              style={{
                ...S.input,
                ...(errors.password ? S.inputErr : {})
              }}
            />
    
            {pw && (
              <div style={{ display: 'flex', alignItems: 'center',
                            gap: 8, marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i <= pw.score
                        ? pw.color : '#e5e7eb',
                      transition: 'background 0.3s',
                    }}/>
                  ))}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600,
                               color: pw.color, minWidth: 40 }}>
                  {pw.label}
                </span>
              </div>
            )}
            {errors.password && (
              <span style={S.fieldErr}>{errors.password}</span>
            )}
          </div>

          <div style={S.field}>
            <label style={S.label}>Confirm Password</label>
            <input
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                ...S.input,
                ...(errors.confirm ? S.inputErr : {})
              }}
            />
            {form.confirm && form.password && (
              <div style={{ fontSize: 12, marginTop: 4,
                            color: form.password === form.confirm
                              ? '#22c55e' : '#ef4444' }}>
                {form.password === form.confirm
                  ? '✅ Passwords match'
                  : '❌ Passwords do not match'}
              </div>
            )}
            {errors.confirm && (
              <span style={S.fieldErr}>{errors.confirm}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              domainStatus !== 'found' ||
              !form.name ||
              !form.password ||
              !form.confirm
            }
            style={{
              ...S.btn,
              background: domainStatus === 'found'
                ? '#2563eb' : '#94a3b8',
              cursor: domainStatus === 'found'
                ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

        </form>


        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={S.footerText}>
            Already have an account?{' '}
            <Link to="/login" style={S.link}>Sign in</Link>
          </p>
          <p style={S.footerText}>
            Registering your company?{' '}
            <Link to="/register" style={S.link}>
              Register organization
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

// 
const S = {
  page: {
    minHeight:      '100vh',
    background:     '#f8fafc',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        24,
    fontFamily:     "'DM Sans', Arial, sans-serif",
  },
  card: {
    background:   '#ffffff',
    borderRadius: 20,
    padding:      40,
    width:        '100%',
    maxWidth:     460,
    boxShadow:    '0 4px 32px rgba(0,0,0,0.08)',
    border:       '1px solid #f1f5f9',
  },
  brand: {
    fontSize:      22,
    fontWeight:    700,
    color:         '#0f172a',
    margin:        '0 0 4px',
    letterSpacing: '-0.3px',
  },
  tagline: { fontSize: 13, color: '#94a3b8', margin: 0 },
  error: {
    background:   '#fef2f2',
    border:       '1px solid #fecaca',
    color:        '#dc2626',
    borderRadius: 10,
    padding:      12,
    fontSize:     13,
    marginBottom: 16,
    lineHeight:   1.5,
  },
  field:      { marginBottom: 16 },
  label: {
    display:      'block',
    fontSize:     13,
    fontWeight:   600,
    color:        '#374151',
    marginBottom: 6,
  },
  hint: {
    fontWeight: 'normal',
    color:      '#94a3b8',
    fontSize:   12,
    marginLeft: 4,
  },
  helperText: {
    fontSize:  12,
    color:     '#94a3b8',
    marginTop: 4,
  },
  statusInfo: {
    background:   '#eff6ff',
    border:       '1px solid #bfdbfe',
    color:        '#1d4ed8',
    borderRadius: 8,
    padding:      '8px 12px',
    fontSize:     12,
    marginTop:    6,
  },
  statusFound: {
    background:   'rgba(34,197,94,0.08)',
    border:       '1px solid rgba(34,197,94,0.3)',
    color:        '#16a34a',
    borderRadius: 8,
    padding:      '8px 12px',
    fontSize:     12,
    marginTop:    6,
  },
  statusNotFound: {
    background:   '#fef2f2',
    border:       '1px solid #fecaca',
    color:        '#dc2626',
    borderRadius: 8,
    padding:      '10px 12px',
    fontSize:     12,
    marginTop:    6,
    lineHeight:   1.6,
  },
  input: {
    width:        '100%',
    padding:      '12px 14px',
    borderRadius: 10,
    border:       '1.5px solid #e5e7eb',
    fontSize:     14,
    outline:      'none',
    color:        '#0f172a',
    background:   '#ffffff',
    transition:   'border-color 0.2s',
    boxSizing:    'border-box',
    fontFamily:   'inherit',
  },
  inputErr:  { borderColor: '#fca5a5', background: '#fff5f5' },
  fieldErr:  { fontSize: 12, color: '#dc2626', display: 'block', marginTop: 4 },
  btn: {
    width:        '100%',
    padding:      13,
    color:        '#ffffff',
    border:       'none',
    borderRadius: 10,
    fontSize:     15,
    fontWeight:   600,
    fontFamily:   'inherit',
    marginTop:    4,
    transition:   'all 0.2s',
  },
  footerText: { fontSize: 13, color: '#64748b', margin: '6px 0' },
  link: {
    color:          '#2563eb',
    textDecoration: 'none',
    fontWeight:     600,
  },
};