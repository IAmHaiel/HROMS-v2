import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Hash, Shield, Lock, Eye, EyeOff, Pencil, X, Save, Loader2, AlertCircle, CheckCircle2, ArrowLeft, LogOut } from 'lucide-react';
import '../OpEmployee_Dashboard/OpEmployee_Dashboard.css';
import './profile_page.css';

const NAME_REGEX = /^[A-Za-z\s]+$/;
const EMAIL_REGEX = /^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function toDisplayRole(role: string): string {
    const map: Record<string, string> = {
        SystemAdmin: 'System Admin',
        SuperAdmin: 'Super Admin',
        OperationAdmin: 'Operation Admin',
        OpAdmin: 'Operation Admin',
        Coordinator: 'Coordinator',
        Encoder: 'Encoder',
    };
    return map[role] ?? role.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const authToken = localStorage.getItem('authToken');

    const [user, setUser] = useState({
        employeeId: localStorage.getItem('employeeId') ?? '',
        fullName: localStorage.getItem('employeeName') ?? '',
        firstName: localStorage.getItem('firstName') ?? '',
        middleName: localStorage.getItem('middleName') ?? '',
        lastName: localStorage.getItem('lastName') ?? '',
        suffix: localStorage.getItem('suffix') ?? '',
        email: localStorage.getItem('email') ?? '',
        phone: localStorage.getItem('contactNumber') ?? '',
        role: localStorage.getItem('role') ?? '',
        accountStatus: 'Active',
        presenceStatus: 'Offline',
    });

    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [pwdMode, setPwdMode] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState(false);

    const [form, setForm] = useState({
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        suffix: user.suffix,
        email: user.email,
        phone: user.phone,
    });
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
    const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
    const [pwdError, setPwdError] = useState('');
    const [pwdSaving, setPwdSaving] = useState(false);

    useEffect(() => {
        if (!authToken) { navigate('/'); return; }
        fetch('/api/profile/view-profile', {
            headers: { Authorization: `Bearer ${authToken}` },
        })
            .then(res => res.ok ? res.json() : null)
            .then(resJson => {
                if (!resJson?.isSuccess || !resJson.data) return;
                const d = resJson.data;
                const fullName = [d.firstName, d.middleName, d.lastName, d.suffix].filter(Boolean).join(' ');
                setUser(prev => ({
                    ...prev,
                    employeeId: d.employeeNumber ?? prev.employeeId,
                    firstName: d.firstName ?? '',
                    middleName: d.middleName ?? '',
                    lastName: d.lastName ?? '',
                    suffix: d.suffix ?? '',
                    email: d.email ?? '',
                    phone: d.contactNumber ?? '',
                    role: d.role ?? prev.role,
                    accountStatus: d.accountStatus ?? 'Active',
                    presenceStatus: d.presenceStatus ?? 'Offline',
                    fullName: fullName || prev.fullName,
                }));
                setForm(prev => ({
                    ...prev,
                    firstName: d.firstName ?? '',
                    middleName: d.middleName ?? '',
                    lastName: d.lastName ?? '',
                    suffix: d.suffix ?? '',
                    email: d.email ?? '',
                    phone: d.contactNumber ?? '',
                }));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const validateField = (key: string, value: string): string => {
        if (key === 'firstName' || key === 'lastName') {
            if (!value) return 'Required';
            if (!NAME_REGEX.test(value)) return 'Letters only';
            if (value.length > 50) return 'Max 50 characters';
        }
        if (key === 'middleName' || key === 'suffix') {
            if (value && !NAME_REGEX.test(value)) return 'Letters only';
            if (value.length > 50) return 'Max 50 characters';
        }
        if (key === 'email') {
            if (!value) return 'Required';
            if (value.length < 12 || value.length > 64) return '12-64 characters';
            if (!EMAIL_REGEX.test(value)) return 'Invalid format';
        }
        if (key === 'phone') {
            if (value && !/^\d{11}$/.test(value)) return 'Exactly 11 digits';
        }
        return '';
    };

    const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setForm(prev => ({ ...prev, [k]: val }));
        setValidationErrors(prev => ({ ...prev, [k]: validateField(k, val) }));
        setProfileError('');
    };

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        (['firstName', 'lastName', 'email', 'phone'] as const).forEach(k => {
            const err = validateField(k, form[k]);
            if (err) errs[k] = err;
        });
        setValidationErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setProfileSaving(true);
        setProfileError('');
        try {
            const fd = new FormData();
            fd.append('employeeNumber', user.employeeId);
            fd.append('firstName', form.firstName.trim());
            fd.append('middleName', form.middleName.trim());
            fd.append('lastName', form.lastName.trim());
            fd.append('suffix', form.suffix.trim());
            fd.append('contactNumber', form.phone.trim());
            fd.append('email', form.email.trim());

            const res = await fetch(`/api/profile/update-profile?employeeNumber=${encodeURIComponent(user.employeeId)}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${authToken}` },
                body: fd,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message || 'Profile update failed.');
            }
            const newFullName = [form.firstName.trim(), form.middleName.trim(), form.lastName.trim(), form.suffix.trim()].filter(Boolean).join(' ');
            ['firstName', 'middleName', 'lastName', 'suffix'].forEach(k => localStorage.setItem(k, (form as any)[k].trim()));
            localStorage.setItem('employeeName', newFullName);
            localStorage.setItem('email', form.email.trim());
            localStorage.setItem('contactNumber', form.phone.trim());
            setUser(prev => ({ ...prev, fullName: newFullName }));
            setProfileSuccess(true);
            setEditMode(false);
            setTimeout(() => setProfileSuccess(false), 2500);
        } catch (err: any) {
            setProfileError(err.message);
        } finally {
            setProfileSaving(false);
        }
    };

    const handleChangePwd = async () => {
        if (!pwd.current) { setPwdError('Current password is required.'); return; }
        if (pwd.next.length < 6) { setPwdError('New password must be at least 6 characters.'); return; }
        if (pwd.next !== pwd.confirm) { setPwdError('Passwords do not match.'); return; }
        setPwdSaving(true);
        setPwdError('');
        try {
            const res = await fetch('/api/profile/change-password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message || 'Password update failed.');
            }
            localStorage.setItem('isPasswordChanged', 'true');
            setPwdMode(false);
            setPwd({ current: '', next: '', confirm: '' });
        } catch (err: any) {
            setPwdError(err.message);
        } finally {
            setPwdSaving(false);
        }
    };

    const initials = getInitials(user.fullName);
    const roleName = toDisplayRole(user.role);

    if (loading) {
        return (
            <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
                <Loader2 size={32} className="spin" />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '24px 32px' }}>
            {/* Top bar with back button and logout */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ArrowLeft size={14} /> Back to Dashboard
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => {
                    ['authToken', 'refreshToken', 'employeeId', 'employeeName', 'firstName', 'middleName', 'lastName', 'suffix', 'contactNumber', 'email', 'role', 'isPasswordChanged', 'userRole'].forEach(k => localStorage.removeItem(k));
                    navigate('/');
                }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LogOut size={14} /> Logout
                </button>
            </div>

            {profileSuccess && (
                <div className="toast-success" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--status-active-bg)', border: '1px solid rgba(5,150,105,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--status-active)', fontWeight: 600 }}>
                    <CheckCircle2 size={16} /> Profile updated successfully
                </div>
            )}

            {/* ── Profile Hero ── */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 28, flexShrink: 0,
                    boxShadow: '0 8px 20px rgba(0,169,157,0.28)',
                }}>
                    {initials}
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{user.fullName || '—'}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>{roleName}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <span className="badge badge-blue">{user.employeeId}</span>
                        <span className={`badge ${user.accountStatus === 'Active' ? 'badge-green' : 'badge-red'}`}>{user.accountStatus}</span>
                        <span className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: user.presenceStatus === 'Online' ? 'var(--status-active)' : 'var(--text-secondary)' }} />
                            {user.presenceStatus ?? 'Offline'}
                        </span>
                    </div>
                </div>
                <button
                    className={`btn ${editMode ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => {
                        if (editMode) { setEditMode(false); setForm({ firstName: user.firstName, middleName: user.middleName, lastName: user.lastName, suffix: user.suffix, email: user.email, phone: user.phone }); setValidationErrors({}); setProfileError(''); }
                        else setEditMode(true);
                    }}
                >
                    {editMode ? <><X size={13} /> Cancel</> : <><Pencil size={13} /> Edit Profile</>}
                </button>
            </div>

            {/* ── Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Basic Information */}
                <div className="card">
                    <div className="card-header-layout">
                        <h3>Basic Information</h3>
                        {editMode && (
                            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={profileSaving}>
                                {profileSaving ? <><Loader2 size={13} className="spin" /> Saving…</> : <><Save size={13} /> Save</>}
                            </button>
                        )}
                    </div>
                    {profileError && <div className="form-api-error" style={{ marginBottom: 10 }}><AlertCircle size={14} /><span>{profileError}</span></div>}
                    <div className="info-fields">
                        <div className="info-field">
                            <label>Employee ID</label>
                            <div className="if-value"><span className="if-icon"><Hash size={15} /></span><span className="read-only-val">{user.employeeId || '—'}</span></div>
                        </div>
                        {editMode ? (
                            <>
                                {(['firstName', 'middleName', 'lastName', 'suffix'] as const).map(k => (
                                    <div className="info-field" key={k}>
                                        <label>{k === 'firstName' ? 'Given Name' : k === 'lastName' ? 'Last Name' : k === 'suffix' ? 'Suffix' : 'Middle Name'}
                                            {k === 'firstName' || k === 'lastName' ? <span style={{ color: 'var(--status-failed)' }}>*</span> : null}
                                            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{k === 'middleName' || k === 'suffix' ? ' (optional)' : ''}</span>
                                        </label>
                                        <div className="if-input-wrap" style={validationErrors[k] ? { borderColor: 'var(--status-failed)' } : {}}>
                                            <span className="if-icon"><User size={15} /></span>
                                            <input type="text" value={form[k]} onChange={setF(k)} placeholder={`Enter ${k}`} maxLength={50} />
                                        </div>
                                        {validationErrors[k] && <span style={{ color: 'var(--status-failed)', fontSize: 11, marginTop: 4, display: 'block' }}>{validationErrors[k]}</span>}
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="info-field">
                                <label>Full Name</label>
                                <div className="if-value"><span className="if-icon"><User size={15} /></span><span>{user.fullName || '—'}</span></div>
                            </div>
                        )}
                        <div className="info-field">
                            <label>Email Address {editMode && <span style={{ color: 'var(--status-failed)' }}>*</span>}</label>
                            {editMode ? (
                                <>
                                    <div className="if-input-wrap" style={validationErrors['email'] ? { borderColor: 'var(--status-failed)' } : {}}>
                                        <span className="if-icon"><Mail size={15} /></span>
                                        <input type="email" value={form.email} onChange={setF('email')} placeholder="e.g. name@company.com" />
                                    </div>
                                    {validationErrors['email'] && <span style={{ color: 'var(--status-failed)', fontSize: 11, marginTop: 4, display: 'block' }}>{validationErrors['email']}</span>}
                                </>
                            ) : (
                                <div className="if-value"><span className="if-icon"><Mail size={15} /></span><span>{user.email || '—'}</span></div>
                            )}
                        </div>
                        <div className="info-field">
                            <label>Contact Number</label>
                            {editMode ? (
                                <>
                                    <div className="if-input-wrap" style={validationErrors['phone'] ? { borderColor: 'var(--status-failed)' } : {}}>
                                        <span className="if-icon"><Phone size={15} /></span>
                                        <input type="tel" value={form.phone} onChange={setF('phone')} placeholder="e.g. 09170000000" maxLength={11} />
                                    </div>
                                    {validationErrors['phone'] && <span style={{ color: 'var(--status-failed)', fontSize: 11, marginTop: 4, display: 'block' }}>{validationErrors['phone']}</span>}
                                </>
                            ) : (
                                <div className="if-value"><span className="if-icon"><Phone size={15} /></span><span>{user.phone || '—'}</span></div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Account & Security */}
                <div className="card">
                    <div className="card-header-layout"><h3>Account & Security</h3></div>
                    <div className="account-info">
                        <div className="info-field">
                            <label>Role</label>
                            <div className="if-value"><span className="if-icon"><Shield size={15} /></span><span className="read-only-val">{roleName}</span></div>
                        </div>
                        <div className="info-field">
                            <label>Account Status</label>
                            <div className="if-value">
                                <span className={`status-badge ${user.accountStatus === 'Active' ? 'active' : 'deactivated'}`} style={{ fontSize: 11, padding: '3px 10px' }}>
                                    {user.accountStatus || 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="pwd-section" style={{ marginTop: 20 }}>
                        <div className="pwd-header">
                            <div className="pwd-title"><Lock size={15} /><span>Change Password</span></div>
                            <button className={`btn ${pwdMode ? '' : 'btn-primary'} btn-sm`} onClick={() => { setPwdMode(m => !m); setPwdError(''); setEditMode(false); }}>
                                {pwdMode ? 'Cancel' : 'Change'}
                            </button>
                        </div>
                        {pwdMode && (
                            <div className="pwd-form">
                                {pwdError && <div className="form-api-error" style={{ marginBottom: 8 }}><AlertCircle size={14} /><span>{pwdError}</span></div>}
                                {(['current', 'next', 'confirm'] as const).map((k, i) => (
                                    <div className="field" key={k}>
                                        <label>{i === 0 ? 'Current Password' : i === 1 ? 'New Password' : 'Confirm New Password'}</label>
                                        <div className="pwd-input-wrap">
                                            <input type={showPwd[k] ? 'text' : 'password'} value={pwd[k]} onChange={e => setPwd(p => ({ ...p, [k]: e.target.value }))}
                                                placeholder={i === 0 ? 'Enter current password' : i === 1 ? 'At least 6 characters' : 'Re-enter new password'} />
                                            <button className="pwd-toggle" onClick={() => setShowPwd(p => ({ ...p, [k]: !p[k] }))} tabIndex={-1}>
                                                {showPwd[k] ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                        {k === 'next' && pwd.next.length > 0 && (
                                            <div style={{ marginTop: 6 }}>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    {[1, 2, 3].map(lv => (
                                                        <div key={lv} style={{ flex: 1, height: 4, borderRadius: 2, background: pwd.next.length >= lv * 4 ? (lv === 1 ? 'var(--status-failed)' : lv === 2 ? 'var(--status-pending)' : 'var(--status-active)') : 'var(--border)', transition: 'background 0.2s' }} />
                                                    ))}
                                                </div>
                                                <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>{pwd.next.length < 4 ? 'Weak' : pwd.next.length < 8 ? 'Fair' : 'Strong'}</span>
                                            </div>
                                        )}
                                        {k === 'confirm' && pwd.confirm.length > 0 && (
                                            <span style={{ fontSize: 11, color: pwd.next === pwd.confirm ? 'var(--status-active)' : 'var(--status-failed)', marginTop: 3, display: 'block' }}>
                                                {pwd.next === pwd.confirm ? '✓ Passwords match' : 'Passwords do not match'}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleChangePwd} disabled={pwdSaving}>
                                    {pwdSaving ? <><Loader2 size={13} className="spin" /> Saving…</> : <><Lock size={13} /> Update Password</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
