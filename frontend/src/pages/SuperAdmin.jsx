import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
  LogOut, Building2, Users, MessageSquare,
  FileText, Shield, ChevronRight, ArrowLeft,
  Trash2, CheckCircle, XCircle, Eye, EyeOff,
  BarChart3, Activity
} from 'lucide-react';

const fmt = d => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
});

const fmtTime = d => {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return fmt(d);
};


const C = {
  card: {
    background: '#fff', border: '1px solid #e5e7eb',
    boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
    borderRadius: 14, overflow: 'hidden',
  },
  th: {
    fontSize: 11, fontWeight: 700, color: '#302e2e',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  td: { fontSize: 13, color: 'black' },
  tdPrimary: { fontSize: 13, color: 'black', fontWeight: 500 },
  row: {
    transition: 'background 0.15s',
    cursor: 'pointer'
  },
  badge: (bg, color) => ({
    fontSize: 10, padding: '2px 8px', borderRadius: 20,
    background: bg, color,
  }),
  btn: (bg, color) => ({
    background: bg, color, border: 'none', cursor: 'pointer',
    padding: '8px 14px', borderRadius: 8, fontSize: 12,
    fontWeight: 600, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 5,
  }),
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 5, borderRadius: 6, color: '#6b7280',
    transition: 'color 0.15s',
  },
};

// 
export default function SuperAdmin() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState('list');
  // 'list' | 'detail' | 'employees' | 'documents' | 'queries' | 'emp_queries'
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null); // tenant
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [queries, setQueries] = useState([]);
  const [selEmployee, setSelEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  // ── Fetch ──────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tenantsRes, statsRes] = await Promise.all([
        API.get('/superadmin/tenants'),
        API.get('/superadmin/stats'),
      ]);
      setTenants(tenantsRes.data.tenants || []);
      setStats(statsRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTenantData = async (tenant) => {
    setSelected(tenant);
    setSubLoading(true);
    setView('detail');
    try {
      const [empRes, docRes, qRes] = await Promise.all([
        API.get(`/superadmin/tenant/${tenant._id}/employees`),
        API.get(`/superadmin/tenant/${tenant._id}/documents`),
        API.get(`/superadmin/tenant/${tenant._id}/queries`),
      ]);
      setEmployees(empRes.data.employees || []);
      setDocuments(docRes.data.documents || []);
      setQueries(qRes.data.queries || []);
    } catch (e) { console.error(e); }
    finally { setSubLoading(false); }
  };

  const fetchEmployeeQueries = async (emp) => {
    setSelEmployee(emp);
    setSubLoading(true);
    setView('emp_queries');
    try {
      const res = await API.get(
        `/superadmin/tenant/${selected._id}/employee/${emp._id}/queries`
      );
      setQueries(res.data.queries || []);
    } catch (e) { console.error(e); }
    finally { setSubLoading(false); }
  };


  const handleConfirmedDelete = async () => {
    const { type, id } = confirmDel;
    try {
      if (type === 'tenant') {
        await API.delete(`/superadmin/tenant/${id}`);
        setTenants(prev => prev.filter(t => t._id !== id));
        setView('list');
        showMsg('success', 'Organization deleted.');
      }
      if (type === 'document') {
        await API.delete(
          `/superadmin/tenant/${selected._id}/document/${id}`
        );
        setDocuments(prev => prev.filter(d => d._id !== id));
        showMsg('success', 'Document deleted.');
      }
      if (type === 'query') {
        await API.delete(
          `/superadmin/tenant/${selected._id}/query/${id}`
        );
        setQueries(prev => prev.filter(q => q._id !== id));
        showMsg('success', 'Query deleted.');
      }
      if (type === 'allQueries') {
        await API.delete(
          `/superadmin/tenant/${selected._id}/queries/all`
        );
        setQueries([]);
        showMsg('success', 'All queries deleted.');
      }
      if (type === 'employee') {
        await API.delete(
          `/superadmin/tenant/${selected._id}/employee/${id}`
        );
        setEmployees(prev => prev.filter(e => e._id !== id));
        showMsg('success', 'Employee deleted.');
      }
    } catch (e) {
      showMsg('error',
        e.response?.data?.detail || 'Delete failed'
      );
    } finally {
      setConfirmDel(null);
    }
  };


  const TopNav = () => (
    <div style={{
      background: 'white',
      boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
      padding: '0 28px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: 58,
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, background: '#7c3aed',
          borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Shield size={16} color="#fff" />
        </div>
        <span style={{
          fontWeight: 700, fontSize: 15,
          color: 'black'
        }}>
          Super Admin
        </span>
        {selected && (
          <>
            <span style={{ color: '#4b5563' }}>›</span>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>
              {selected.name}
            </span>
          </>
        )}
      </div>
      <button
        onClick={() => { logout(); navigate('/login'); }}
        style={{
          ...C.btn('rgba(239,68,68,0.1)', '#f87171'),
          border: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        <LogOut size={13} /> Logout
      </button>
    </div>
  );

  const MsgBanner = () => msg.text ? (
    <div style={{
      padding: '10px 16px', borderRadius: 10,
      marginBottom: 16, fontSize: 13, fontWeight: 500,
      background: msg.type === 'success'
        ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
      color: msg.type === 'success' ? '#22c55e' : '#ef4444',
      border: `1px solid ${msg.type === 'success'
        ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
    }}>
      {msg.type === 'success' ? '✅' : '❌'} {msg.text}
    </div>
  ) : null;

  const DeleteModal = () => !confirmDel ? null : (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{
        background: 'white', border: '1px solid #2a2d3a',
        borderRadius: 16, padding: 28, maxWidth: 360,
        width: '100%', margin: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <h3 style={{
          fontSize: 16, fontWeight: 700,
          color: 'black', margin: '0 0 8px'
        }}>
          Confirm Delete
        </h3>
        <p style={{
          fontSize: 13, color: 'black',
          margin: '0 0 20px', lineHeight: 1.6
        }}>
          {confirmDel.type === 'tenant' &&
            `Delete "${confirmDel.name}"? This removes all employees, documents, and queries permanently.`}
          {confirmDel.type === 'document' &&
            `Delete "${confirmDel.name}"? This removes the document from the knowledge base.`}
          {confirmDel.type === 'query' &&
            'Delete this query from history?'}
          {confirmDel.type === 'allQueries' &&
            'Delete ALL queries for this organization? This cannot be undone.'}
          {confirmDel.type === 'employee' &&
            `Remove employee "${confirmDel.name}"?`}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setConfirmDel(null)} style={{
            flex: 1, padding: 10, borderRadius: 9,
            border: '1px solid grey', background: 'transparent',
            color: 'black', cursor: 'pointer', fontSize: 13,
            fontWeight: 600, fontFamily: 'inherit',
          }}>
            Cancel
          </button>
          <button onClick={handleConfirmedDelete} style={{
            flex: 1, padding: 10, borderRadius: 9, border: 'none',
            background: '#ef4444', color: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  // ── LIST VIEW ──────────────────────────────────
  const ListView = () => (
    <div>
      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        gap: 12, marginBottom: 20,
      }}>
        {[
          {
            icon: '🏢', label: 'Organizations',
            value: stats?.total_tenants || 0, bg: '#1e3a5f'
          },
          {
            icon: '👥', label: 'Total Users',
            value: stats?.total_users || 0, bg: '#2d1b69'
          },
          {
            icon: '📄', label: 'Documents',
            value: stats?.total_documents || 0, bg: '#1a3a2a'
          },
          {
            icon: '💬', label: 'Total Queries',
            value: stats?.total_queries || 0, bg: '#3a2a1a'
          },
        ].map((s, i) => (
          <div key={i} style={{
            ...C.card, padding: 18,
          }}>
            <div style={{
              width: 34, height: 34, background: s.bg,
              borderRadius: 9, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 15, marginBottom: 12,
            }}>
              {s.icon}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700,
              letterSpacing: '-1px',
              color: 'black', margin: '0 0 3px'
            }}>
              {loading ? '...' : s.value}
            </div>
            <div style={{
              fontSize: 11, color: '#353434',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Organizations Table */}
      <div style={C.card}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid grey',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: 'black', textTransform: 'uppercase',
            letterSpacing: '0.6px'
          }}>
            All Organizations
          </span>
          <span style={{ fontSize: 12, color: 'black' }}>
            {tenants.length} total
          </span>
        </div>

        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 140px 70px 70px 70px 120px 100px',
          padding: '10px 20px',
          borderBottom: '1px solid grey',
        }}>
          {['Organization', 'Domain', 'Users', 'Docs',
            'Queries', 'Registered', 'Actions'].map((h, i) => (
              <div key={i} style={{
                ...C.th,
                textAlign: i === 6 ? 'right' : 'left',
              }}>
                {h}
              </div>
            ))}
        </div>

        {loading ? (
          <div style={{
            padding: 40, textAlign: 'center',
            color: '#6b7280', fontSize: 13
          }}>
            Loading...
          </div>
        ) : tenants.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center',
            color: 'black', fontSize: 13
          }}>
            No organizations registered yet.
          </div>
        ) : tenants.map((t, i) => (
          <div key={i}
            onClick={() => fetchTenantData(t)}
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1fr 140px 70px 70px 70px 120px 100px',
              padding: '12px 20px', alignItems: 'center',
              ...C.row,
            }}
            onMouseEnter={e =>
              e.currentTarget.style.background = '#e5e5eb'}
            onMouseLeave={e =>
              e.currentTarget.style.background = 'transparent'}
          >
            {/* Name */}
            <div style={{
              display: 'flex',
              alignItems: 'center', gap: 10
            }}>
              <div style={{
                width: 30, height: 30, background: '#252840',
                borderRadius: 8, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 13, flexShrink: 0,
              }}>
                🏢
              </div>
              <div>
                <div style={C.tdPrimary}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#484a4d' }}>
                  {t.plan}
                </div>
              </div>
            </div>

            <div style={C.td}>{t.domain}</div>
            <div style={C.td}>{t.user_count || 0}</div>
            <div style={C.td}>{t.doc_count || 0}</div>
            <div style={C.td}>{t.query_count || 0}</div>
            <div style={C.td}>{fmt(t.created_at)}</div>

            {/* Actions */}
            <div style={{
              display: 'flex', gap: 6,
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => fetchTenantData(t)}
                style={{
                  ...C.btn(
                    'rgba(59,130,246,0.1)', '#60a5fa'
                  ), padding: '6px 10px', fontSize: 11
                }}
                title="View details"
              >
                <Eye size={12} /> View
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();   
                  setConfirmDel({
                    type: 'tenant',
                    id: t._id,
                    name: t.name
                  });
                }}
                style={{
                  ...C.iconBtn, color: '#6b7280',
                }}
                onMouseEnter={e =>
                  e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e =>
                  e.currentTarget.style.color = '#797c81'}
                title="Delete organization"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── DETAIL VIEW ────────────────────────────────
  const DetailView = () => (
    <div>
      {/* Back + Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => {
            setView('list'); setSelected(null);
          }} style={{
            ...C.btn('#ffffff', '#000000'),
            border: '1px solid grey',
          }}>
            <ArrowLeft size={13} /> Back
          </button>
          <div>
            <h2 style={{
              fontSize: 18, fontWeight: 700,
              color: '#000000', margin: '0 0 2px'
            }}>
              {selected?.name}
            </h2>
            <span style={{ fontSize: 12, color: '#4e5053' }}>
              {selected?.domain}
            </span>
          </div>
        </div>
        <button onClick={() => setConfirmDel({
          type: 'tenant', id: selected?._id, name: selected?.name
        })} style={{
          ...C.btn('rgba(239,68,68,0.1)', '#ef4444'),
          border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <Trash2 size={13} /> Delete Organization
        </button>
      </div>

      {subLoading ? (
        <div style={{
          padding: 60, textAlign: 'center',
          color: '#6b7280', fontSize: 13
        }}>
          Loading organization data...
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            gap: 12, marginBottom: 20,
          }}>
            {[
              {
                icon: '👥', label: 'Employees',
                value: employees.length, color: '#3b82f6'
              },
              {
                icon: '📄', label: 'Documents',
                value: documents.length, color: '#8b5cf6'
              },
              {
                icon: '💬', label: 'Total Queries',
                value: queries.length, color: '#22c55e'
              },
              {
                icon: '🤖', label: 'Chatbot',
                value: selected?.chatbot?.name || 'N/A',
                color: '#f59e0b'
              },
            ].map((s, i) => (
              <div key={i} style={{
                ...C.card, padding: 16,
              }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>
                  {s.icon}
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 700,
                  color: s.color, margin: '0 0 3px'
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontSize: 11, color: 'black',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Tab Buttons */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 16,
            flexWrap: 'wrap'
          }}>
            {[
              {
                id: 'employees', label: '👥 Employees',
                count: employees.length
              },
              {
                id: 'documents', label: '📄 Documents',
                count: documents.length
              },
              {
                id: 'queries', label: '💬 All Queries',
                count: queries.length
              },
            ].map(tab => (
              <button key={tab.id}
                onClick={() => setView(tab.id)}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: `1px solid ${view === tab.id
                      ? 'grey' : 'grey'
                    }`,
                  background: view === tab.id
                    ? 'white' : 'white',
                  color: view === tab.id
                    ? 'black' : 'black',
                  cursor: 'pointer', fontSize: 13,
                  fontWeight: 500, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {tab.label}
                <span style={{
                  fontSize: 10, padding: '1px 7px',
                  borderRadius: 20,
                  background: view === tab.id
                    ? 'rgba(253, 253, 253, 0.2)' : '#252840',
                  color: view === tab.id
                    ? 'white' : 'white',
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Org Info */}
          <div style={{ ...C.card, padding: 20, marginBottom: 16 }}>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: 'black', textTransform: 'uppercase',
              letterSpacing: '0.6px', marginBottom: 16
            }}>
              Organization Details
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 16
            }}>
              {[
                { label: 'Company Name', value: selected?.name },
                { label: 'Domain', value: selected?.domain },
                { label: 'Plan', value: selected?.plan },
                { label: 'Company Code', value: selected?.company_code },
                {
                  label: 'Chatbot Name',
                  value: selected?.chatbot?.name
                },
                {
                  label: 'API Key Status',
                  value: selected?.api_key_active
                    ? '✅ Active' : '❌ Inactive'
                },
              ].map((row, i) => (
                <div key={i}>
                  <div style={{
                    fontSize: 11, color: '#1616168a',
                    marginBottom: 3
                  }}>
                    {row.label}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    color: 'black'
                  }}>
                    {row.value || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ── EMPLOYEES VIEW ─────────────────────────────
  const EmployeesView = () => (
    <div>
      <BackToDetail />
      <div style={C.card}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid grey',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: 'black', textTransform: 'uppercase',
            letterSpacing: '0.6px'
          }}>
            Employees — {selected?.name}
          </span>
          <span style={{ fontSize: 12, color: 'black' }}>
            {employees.length} members
          </span>
        </div>

        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 100px 100px 120px 100px 80px',
          padding: '10px 20px',
          borderBottom: '1px solid grey',
        }}>
          {['Name / Email', 'Role', 'Queries',
            'Joined', 'Status', 'Actions'].map((h, i) => (
              <div key={i} style={{
                ...C.th,
                textAlign: i === 5 ? 'right' : 'left',
              }}>
                {h}
              </div>
            ))}
        </div>

        {employees.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center',
            color: '#6b7280', fontSize: 13
          }}>
            No employees found.
          </div>
        ) : employees.map((emp, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 100px 100px 120px 100px 80px',
            padding: '12px 20px', alignItems: 'center',
            ...C.row,
          }}
            onMouseEnter={e =>
              e.currentTarget.style.background = '#e2e2eb'}
            onMouseLeave={e =>
              e.currentTarget.style.background = 'transparent'}
          >
            {/* Email */}
            <div>
              <div style={C.tdPrimary}>
                {emp.name || emp.email.split('@')[0]}
              </div>
              <div style={{ fontSize: 11, color: '#4b5563' }}>
                {emp.email}
              </div>
            </div>

            {/* Role */}
            <div>
              <span style={C.badge(
                emp.role === 'admin'
                  ? 'rgba(124,58,237,0.1)'
                  : 'rgba(59,130,246,0.1)',
                emp.role === 'admin'
                  ? '#a78bfa' : '#60a5fa'
              )}>
                {emp.role}
              </span>
            </div>

            <div style={C.td}>{emp.query_count || 0}</div>
            <div style={C.td}>{fmt(emp.created_at)}</div>

            {/* Status */}
            <div>
              <span style={C.badge(
                'rgba(34,197,94,0.1)', '#22c55e'
              )}>
                Active
              </span>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex', gap: 4,
              justifyContent: 'flex-end'
            }}>
              {emp.query_count > 0 && (
                <button
                  onClick={() => fetchEmployeeQueries(emp)}
                  style={{ ...C.iconBtn }}
                  onMouseEnter={e =>
                    e.currentTarget.style.color = '#60a5fa'}
                  onMouseLeave={e =>
                    e.currentTarget.style.color = '#6b7280'}
                  title="View queries"
                >
                  <MessageSquare size={14} />
                </button>
              )}
              {emp.role !== 'admin' && (
                <button
                  onClick={() => setConfirmDel({
                    type: 'employee',
                    id: emp._id,
                    name: emp.email,
                  })}
                  style={{ ...C.iconBtn }}
                  onMouseEnter={e =>
                    e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e =>
                    e.currentTarget.style.color = '#6b7280'}
                  title="Delete employee"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── DOCUMENTS VIEW ─────────────────────────────
  const DocumentsView = () => (
    <div>
      <BackToDetail />
      <div style={C.card}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid grey',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: 'black', textTransform: 'uppercase',
            letterSpacing: '0.6px'
          }}>
            Documents — {selected?.name}
          </span>
          <span style={{ fontSize: 12, color: 'black' }}>
            {documents.length} files
          </span>
        </div>

        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 100px 100px 120px 60px',
          padding: '10px 20px',
          borderBottom: '1px solid grey',
        }}>
          {['Filename', 'Chunks', 'Status',
            'Uploaded', ''].map((h, i) => (
              <div key={i} style={{
                ...C.th,
                textAlign: i === 4 ? 'right' : 'left',
              }}>
                {h}
              </div>
            ))}
        </div>

        {documents.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center',
            color: '#6b7280', fontSize: 13
          }}>
            No documents uploaded.
          </div>
        ) : documents.map((doc, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 100px 120px 60px',
            padding: '12px 20px', alignItems: 'center',
            ...C.row,
          }}
            onMouseEnter={e =>
              e.currentTarget.style.background = '#dfe1e7'}
            onMouseLeave={e =>
              e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center', gap: 8
            }}>
              <div style={{
                width: 28, height: 28, background: '#252840',
                borderRadius: 7, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 12, flexShrink: 0,
              }}>
                📋
              </div>
              <span style={C.tdPrimary}>
                {doc.filename}
              </span>
            </div>

            <div style={C.td}>{doc.chunks_created || '—'}</div>

            <div>
              <span style={C.badge(
                doc.status === 'ready'
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(251,191,36,0.1)',
                doc.status === 'ready' ? '#22c55e' : '#fbbf24'
              )}>
                {doc.status}
              </span>
            </div>

            <div style={C.td}>
              {fmtTime(doc.uploaded_at)}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setConfirmDel({
                  type: 'document',
                  id: doc._id,
                  name: doc.filename,
                })}
                style={{ ...C.iconBtn }}
                onMouseEnter={e =>
                  e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e =>
                  e.currentTarget.style.color = '#6b7280'}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── QUERIES VIEW ───────────────────────────────
  const QueriesView = ({ empMode = false }) => (
    <div>
      <BackToDetail empMode={empMode} />
      <div style={C.card}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid grey',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: 'black', textTransform: 'uppercase',
            letterSpacing: '0.6px'
          }}>
            {empMode
              ? `Queries — ${selEmployee?.email}`
              : `All Queries — ${selected?.name}`
            }
          </span>
          <div style={{
            display: 'flex', gap: 8,
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 12, color: '#000000' }}>
              {queries.length} queries
            </span>
            {!empMode && queries.length > 0 && (
              <button
                onClick={() => setConfirmDel({
                  type: 'allQueries',
                  id: selected?._id,
                  name: 'all queries',
                })}
                style={{
                  ...C.btn(
                    'rgba(239,68,68,0.08)', '#ef4444'
                  ),
                  border: '1px solid rgba(239,68,68,0.2)',
                  padding: '5px 10px', fontSize: 11,
                }}
              >
                <Trash2 size={11} /> Delete All
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 140px 80px 50px',
          padding: '10px 20px',
          borderBottom: '1px solid grey',
        }}>
          {['Question', 'Asked By', 'Time',
            'Speed', ''].map((h, i) => (
              <div key={i} style={{
                ...C.th,
                textAlign: i === 4 ? 'right' : 'left',
              }}>
                {h}
              </div>
            ))}
        </div>

        {queries.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center',
            color: '#6b7280', fontSize: 13
          }}>
            No queries found.
          </div>
        ) : queries.map((q, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 140px 80px 50px',
            padding: '12px 20px', alignItems: 'start',
            ...C.row,
          }}
            onMouseEnter={e =>
              e.currentTarget.style.background = '#dedfe6'}
            onMouseLeave={e =>
              e.currentTarget.style.background = 'transparent'}
          >
            {/* Question + Answer */}
            <div>
              <div style={{
                fontSize: 13, color: 'black',
                fontWeight: 500, marginBottom: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 380
              }}>
                {q.question}
              </div>
              <div style={{
                fontSize: 11, color: '#4b5563',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 380
              }}>
                {q.answer?.slice(0, 70)}...
              </div>
            </div>

            {/* User */}
            <div>
              <div style={{
                fontSize: 12, color: 'black',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {q.user_email || q.asked_by || '—'}
              </div>
              <div style={{
                fontSize: 10, color: '#4b5563',
                marginTop: 2
              }}>
                {q.asked_by}
              </div>
            </div>

            <div style={{ ...C.td, fontSize: 11 }}>
              {fmtTime(q.asked_at)}
            </div>

            <div style={{ ...C.td, fontSize: 11 }}>
              {q.response_time_ms
                ? `${q.response_time_ms}ms` : '—'}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setConfirmDel({
                  type: 'query', id: q._id,
                  name: 'this query',
                })}
                style={{ ...C.iconBtn }}
                onMouseEnter={e =>
                  e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e =>
                  e.currentTarget.style.color = '#6b7280'}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  const BackToDetail = ({ empMode = false }) => (
    <div style={{ marginBottom: 16 }}>
      <button onClick={() => {
        if (empMode) {
          setView('employees');
          setSelEmployee(null);
        } else {
          setView('detail');
        }
      }} style={{
        ...C.btn('white', 'black'),
        border: '1px solid grey',
      }}>
        <ArrowLeft size={13} /> Back
      </button>
    </div>
  );


  return (
    <div style={{
      minHeight: '100vh', background: '#fff',
      fontFamily: "'DM Sans', Arial, sans-serif",
      color: '#e8eaf0',margin:'0',padding:'0',boxSizing:'border-box'
    }}>
      <TopNav />
      <div style={{
        padding: '50px 10px',
        maxWidth: 1200, margin: '0 auto'
      }}>
        <MsgBanner />

        {view === 'list' && <ListView />}
        {view === 'detail' && <DetailView />}
        {view === 'employees' && <EmployeesView />}
        {view === 'documents' && <DocumentsView />}
        {view === 'queries' && <QueriesView />}
        {view === 'emp_queries' && <QueriesView empMode />}
      </div>

      <DeleteModal />
    </div>
  );
}