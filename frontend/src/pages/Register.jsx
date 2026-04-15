import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Register() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    company_name:  '',
    email:         '',
    password:      '',
    confirm:       '',
    system_prompt: '',
  });
  const [domain,  setDomain]  = useState('');
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setApiErr('');

    if (name === 'email') {
      const parts = value.split('@');
      if (parts.length === 2 && parts[1].includes('.')) {
        setDomain(parts[1]);
      } else {
        setDomain('');
      }
    }
  };

  const validate = () => {
    const e = {};
    if (!form.company_name.trim())
      e.company_name = 'Company name is required';
    if (!form.email.trim())
      e.email = 'Email is required';
    if (form.password.length < 8)
      e.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password))
      e.password = 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(form.password))
      e.password = 'Password must contain at least one number';
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
      const res = await API.post('/auth/register/org', {
        company_name:  form.company_name,
        email:         form.email,
        password:      form.password,
        system_prompt: form.system_prompt ||
          `You are a helpful assistant for ${form.company_name}.`
      });

      login(res.data.token, {
        email:        form.email,
        role:         'admin',
        tenant_id:    res.data.tenant_id,
        company_name: form.company_name,
      });

      navigate('/dashboard');

    } catch (err) {
      setApiErr(
        err.response?.data?.detail ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const pwStrength = () => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8)          score++;
    if (/[A-Z]/.test(p))        score++;
    if (/[0-9]/.test(p))        score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map = {
      1: { label: 'Weak',     color: '#ef4444' },
      2: { label: 'Fair',     color: '#f59e0b' },
      3: { label: 'Good',     color: '#3b82f6' },
      4: { label: 'Strong',   color: '#22c55e' },
    };
    return { score, ...map[score] };
  };

  const strength = pwStrength();

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.logoWrap}>
          <div style={s.logo}>🏢</div>
          <h1 style={s.brand}>Register Organization</h1>
          <p style={s.tagline}>
            Create your AI knowledge platform
          </p>
        </div>

        {apiErr && (
          <div style={s.error}>⚠️ {apiErr}</div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Company Name</label>
            <input
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              placeholder="Apollo Hospital"
              style={{
                ...s.input,
                ...(errors.company_name ? s.inputErr : {})
              }}
            />
            {errors.company_name && (
              <span style={s.fieldErr}>
                {errors.company_name}
              </span>
            )}
          </div>

          <div style={s.field}>
            <label style={s.label}>Admin Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@apollo.com"
              style={{
                ...s.input,
                ...(errors.email ? s.inputErr : {})
              }}
            />
            {domain && (
              <div style={s.domainTag}>
                👥 Employees with <strong>@{domain}</strong> email
                can join your organization automatically
              </div>
            )}
            {errors.email && (
              <span style={s.fieldErr}>{errors.email}</span>
            )}
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              style={{
                ...s.input,
                ...(errors.password ? s.inputErr : {})
              }}
            />

            {strength && (
              <div style={s.strengthWrap}>
                <div style={s.strengthBar}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      ...s.strengthSeg,
                      background: i <= strength.score
                        ? strength.color
                        : '#e5e7eb'
                    }} />
                  ))}
                </div>
                <span style={{
                  ...s.strengthLabel,
                  color: strength.color
                }}>
                  {strength.label}
                </span>
              </div>
            )}
            {errors.password && (
              <span style={s.fieldErr}>{errors.password}</span>
            )}
          </div>

          <div style={s.field}>
            <label style={s.label}>Confirm Password</label>
            <input
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                ...s.input,
                ...(errors.confirm ? s.inputErr : {})
              }}
            />
            {errors.confirm && (
              <span style={s.fieldErr}>{errors.confirm}</span>
            )}
          </div>

          <div style={s.field}>
            <label style={s.label}>
              Chatbot Personality
              <span style={s.optional}> — optional</span>
            </label>
            <textarea
              name="system_prompt"
              value={form.system_prompt}
              onChange={handleChange}
              placeholder={`You are a helpful assistant for ${form.company_name || 'your organization'}. Answer only from uploaded documents.`}
              style={{
                ...s.input,
                height:   '80px',
                resize:   'vertical',
                padding:  '12px 14px',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...s.btn,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating account...' : 'Create Organization'}
          </button>

        </form>

        <p style={s.footerText}>
          Already registered?{' '}
          <Link to="/login" style={s.link}>
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight:       '100vh',
    background:      '#f8fafc',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         '24px',
    fontFamily:      "'DM Sans', Arial, sans-serif",
  },
  card: {
    background:   '#ffffff',
    borderRadius: '20px',
    padding:      '40px',
    width:        '100%',
    maxWidth:     '460px',
    boxShadow:    '0 4px 32px rgba(0,0,0,0.08)',
    border:       '1px solid #f1f5f9',
  },
  logoWrap: {
    textAlign:    'center',
    marginBottom: '28px',
  },
  logo:    { fontSize: '44px', marginBottom: '10px', display: 'block' },
  brand:   { fontSize: '22px', fontWeight: '700', color: '#0f172a',
             margin: '0 0 4px', letterSpacing: '-0.3px' },
  tagline: { fontSize: '13px', color: '#94a3b8', margin: 0 },
  error: {
    background:   '#fef2f2',
    border:       '1px solid #fecaca',
    color:        '#dc2626',
    borderRadius: '10px',
    padding:      '12px',
    fontSize:     '13px',
    marginBottom: '16px',
  },
  form:  { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  optional: { fontWeight: '400', color: '#9ca3af', fontSize: '12px' },
  input: {
    padding:      '12px 14px',
    borderRadius: '10px',
    border:       '1.5px solid #e5e7eb',
    fontSize:     '14px',
    outline:      'none',
    color:        '#0f172a',
    background:   '#ffffff',
    boxSizing:    'border-box',
    width:        '100%',
    fontFamily:   'inherit',
    transition:   'border-color 0.2s',
  },
  inputErr: {
    borderColor: '#fca5a5',
    background:  '#fff5f5',
  },
  fieldErr: {
    fontSize: '12px',
    color:    '#dc2626',
  },
  domainTag: {
    background:   '#eff6ff',
    border:       '1px solid #bfdbfe',
    color:        '#1d4ed8',
    borderRadius: '8px',
    padding:      '8px 12px',
    fontSize:     '12px',
  },
  strengthWrap: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    marginTop:  '4px',
  },
  strengthBar: {
    display: 'flex',
    gap:     '4px',
    flex:    1,
  },
  strengthSeg: {
    flex:         1,
    height:       '4px',
    borderRadius: '2px',
    transition:   'background 0.3s',
  },
  strengthLabel: {
    fontSize:   '12px',
    fontWeight: '600',
    minWidth:   '44px',
  },
  btn: {
    padding:      '13px',
    background:   '#2563eb',
    color:        '#ffffff',
    border:       'none',
    borderRadius: '10px',
    fontSize:     '15px',
    fontWeight:   '600',
    cursor:       'pointer',
    marginTop:    '4px',
    fontFamily:   'inherit',
  },
  footerText: {
    textAlign:  'center',
    marginTop:  '20px',
    fontSize:   '13px',
    color:      '#64748b',
  },
  link: {
    color:          '#2563eb',
    textDecoration: 'none',
    fontWeight:     '600',
  },
};