import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, ArrowRight, User, Lock } from 'lucide-react';

type Step = 'welcome' | 'profile' | 'password' | 'done';

const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-.]+$/;
const SUFFIX_REGEX = /^[A-Za-z.\s]+$/;

export default function OnboardingPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('welcome');

    const [profile, setProfile] = useState({
        firstName: '', middleName: '', lastName: '', suffix: '', contactNumber: '',
    });
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileApiError, setProfileApiError] = useState('');

    const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
    const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
    const [pwSaving, setPwSaving] = useState(false);
    const [pwApiError, setPwApiError] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const token = localStorage.getItem('authToken') ?? '';
    const steps: Step[] = ['welcome', 'profile', 'password', 'done'];
    const stepIndex = steps.indexOf(step);

    // ── Per-field validators ──
    const validateField = (key: string, value: string): string => {
        switch (key) {
            case 'firstName':
            case 'lastName':
                if (!value.trim()) return `${key === 'firstName' ? 'First' : 'Last'} name is required.`;
                if (value.trim().length < 2) return 'Must be at least 2 characters.';
                if (value.trim().length > 50) return 'Must not exceed 50 characters.';
                if (key === 'firstName') {
                    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s'\-.]+$/.test(value.trim())) return 'Letters, numbers, spaces, hyphens, and apostrophes only.';
                } else {
                    if (!NAME_REGEX.test(value.trim())) return 'Letters, spaces, hyphens, and apostrophes only.';
                }
                return '';
            case 'middleName':
                if (!value.trim()) return '';
                if (value.trim().length < 2) return 'Must be at least 2 characters.';
                if (value.trim().length > 50) return 'Must not exceed 50 characters.';
                if (!NAME_REGEX.test(value.trim())) return 'Letters, spaces, hyphens, and apostrophes only.';
                return '';
            case 'suffix':
                if (!value.trim()) return '';
                if (value.trim().length > 10) return 'Must not exceed 10 characters.';
                if (!SUFFIX_REGEX.test(value.trim())) return 'Letters and periods only (e.g. Jr., Sr., III).';
                return '';
            case 'contactNumber':
                if (!value.trim()) return '';
                if (!/^09\d{9}$/.test(value.trim())) return 'Must be 11 digits starting with 09.';
                return '';
            default:
                return '';
        }
    };

    const validateProfile = () => {
        const errs: Record<string, string> = {};
        Object.keys(profile).forEach(key => {
            const err = validateField(key, profile[key as keyof typeof profile]);
            if (err) errs[key] = err;
        });
        if (!profile.firstName.trim()) errs.firstName = 'First name is required.';
        if (!profile.lastName.trim()) errs.lastName = 'Last name is required.';
        return errs;
    };

    const validatePwField = (key: string, value: string): string => {
        switch (key) {
            case 'current':
                if (!value) return 'Current password is required.';
                return '';
            case 'next':
                if (!value) return 'New password is required.';
                if (value.length < 15) return 'Must be at least 15 characters.';
                if (value.length > 64) return 'Must not exceed 64 characters.';
                return '';
            case 'confirm':
                if (!value) return 'Please confirm your password.';
                if (value !== pw.next) return 'Passwords do not match.';
                return '';
            default:
                return '';
        }
    };

    const handleProfileSave = async () => {
        const errs = validateProfile();
        if (Object.keys(errs).length > 0) { setProfileErrors(errs); return; }
        setProfileSaving(true); setProfileApiError('');
        try {
            const employeeNumber = localStorage.getItem('employeeId');
            const res = await fetch(`/api/profile/update-profile?employeeNumber=${employeeNumber}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    firstName: profile.firstName.trim(),
                    middleName: profile.middleName.trim() || null,
                    lastName: profile.lastName.trim(),
                    suffix: profile.suffix.trim() || null,
                    contactNumber: profile.contactNumber.trim(),
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message || 'Profile update failed.');
            }
            localStorage.setItem('firstName', profile.firstName.trim());
            localStorage.setItem('middleName', profile.middleName.trim());
            localStorage.setItem('lastName', profile.lastName.trim());
            localStorage.setItem('suffix', profile.suffix.trim());
            localStorage.setItem('contactNumber', profile.contactNumber.trim());
            setStep('password');
        } catch (err: any) {
            setProfileApiError(err.message ?? 'Something went wrong.');
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordSave = async () => {
        const errs: Record<string, string> = {};
        ['current', 'next', 'confirm'].forEach(k => {
            const err = validatePwField(k, pw[k as keyof typeof pw]);
            if (err) errs[k] = err;
        });
        if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }
        setPwSaving(true); setPwApiError('');
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/profile/change-password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message || 'Password update failed.');
            }
            localStorage.setItem('isPasswordChanged', 'true');
            setStep('done');
        } catch (err: any) {
            setPwApiError(err.message ?? 'Something went wrong.');
        } finally {
            setPwSaving(false);
        }
    };

    const pwStrength = pw.next.length === 0 ? 0 : pw.next.length < 6 ? 1 : pw.next.length < 10 ? 2 : 3;
    const pwStrengthLabel = ['', 'Weak', 'Fair', 'Strong'];
    const pwStrengthColor = ['', '#ee5d50', '#ffb547', '#05cd99'];

    const inputStyle = (err?: string) => ({
        padding: '9px 13px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
        border: `1.5px solid ${err ? '#ee5d50' : '#e8ecf4'}`,
        outline: 'none', color: '#1a2332', background: 'white', width: '100%',
        boxSizing: 'border-box' as const,
    });

    const pwInputStyle = (err?: string) => ({
        ...inputStyle(err),
        padding: '9px 40px 9px 13px',
    });

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c1527 0%, #1a2540 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif", padding: '24px 16px' }}>
            <div style={{ width: '100%', maxWidth: 520 }}>

                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <img src="/src/assets/SpeedexLogo.jpg" alt="Speedex" style={{ height: 40, objectFit: 'contain' }} />
                </div>

                {step !== 'welcome' && step !== 'done' && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            {['Profile Setup', 'Set Password'].map((label, i) => (
                                <span key={label} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: stepIndex - 1 >= i ? '#05cd99' : 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                                    {stepIndex - 1 > i ? '✓ ' : ''}{label}
                                </span>
                            ))}
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #05cd99, #4318ff)', width: step === 'profile' ? '50%' : '100%', transition: 'width 0.4s ease' }} />
                        </div>
                    </div>
                )}

                <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>

                    {/* ── WELCOME ── */}
                    {step === 'welcome' && (
                        <div>
                            <div style={{ background: 'linear-gradient(135deg, #0c1527, #1e293b)', padding: '40px 32px 32px', textAlign: 'center' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(5,205,153,0.15)', border: '2px solid rgba(5,205,153,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <CheckCircle2 size={28} color="#05cd99" />
                                </div>
                                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Welcome to Speedex!</h2>
                                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>Your email has been verified. Let's set up your account before you get started.</p>
                            </div>
                            <div style={{ padding: '28px 32px 32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                                    {[
                                        { icon: User, label: 'Set up your profile', desc: 'Add your name and contact details' },
                                        { icon: Lock, label: 'Create a secure password', desc: 'Replace the temporary password sent to you' },
                                    ].map(({ icon: Icon, label, desc }, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e8ecf4' }}>
                                            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(67,24,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon size={18} color="#4318ff" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2332' }}>{label}</div>
                                                <div style={{ fontSize: 11, color: '#8a95b0', marginTop: 2 }}>{desc}</div>
                                            </div>
                                            <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#4318ff' }}>{i + 1}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setStep('profile')} style={{ width: '100%', height: 46, border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #4318ff, #6a5cff)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(67,24,255,0.3)', fontFamily: 'inherit' }}>
                                    Get Started <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── PROFILE ── */}
                    {step === 'profile' && (
                        <div>
                            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #edf2f7' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(67,24,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={16} color="#4318ff" />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Profile Setup</h3>
                                </div>
                                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', marginLeft: 42 }}>Fill in your personal details for your account.</p>
                            </div>
                            <div style={{ padding: '24px 32px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {profileApiError && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(238,93,80,0.08)', border: '1px solid rgba(238,93,80,0.2)', borderRadius: 8, fontSize: 13, color: '#ee5d50' }}>
                                        <AlertCircle size={14} />{profileApiError}
                                    </div>
                                )}

                                {/* First + Last */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {(['firstName', 'lastName'] as const).map(key => (
                                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#1a2332', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                {key === 'firstName' ? 'First Name' : 'Last Name'} <span style={{ color: '#ee5d50' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={key === 'firstName' ? 'e.g. Juan' : 'e.g. dela Cruz'}
                                                value={profile[key]}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setProfile(p => ({ ...p, [key]: val }));
                                                    setProfileErrors(p => ({ ...p, [key]: validateField(key, val) }));
                                                }}
                                                maxLength={50}
                                                style={inputStyle(profileErrors[key])}
                                            />
                                            {profileErrors[key]
                                                ? <span style={{ fontSize: 11, color: '#ee5d50', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{profileErrors[key]}</span>
                                                : <span style={{ fontSize: 11, color: '#8a95b0' }}>{key === 'firstName' ? 'Letters, numbers, hyphens, apostrophes only' : 'Letters, hyphens, apostrophes only'}</span>
                                            }
                                        </div>
                                    ))}
                                </div>

                                {/* Middle + Suffix */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {([
                                        { key: 'middleName', label: 'Middle Name', placeholder: 'e.g. Santos' },
                                        { key: 'suffix', label: 'Suffix', placeholder: 'e.g. Jr., Sr., III' },
                                    ] as const).map(({ key, label, placeholder }) => (
                                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#1a2332', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                {label} <span style={{ fontSize: 10, color: '#8a95b0', textTransform: 'none', fontWeight: 500 }}>(optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={placeholder}
                                                value={profile[key]}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setProfile(p => ({ ...p, [key]: val }));
                                                    setProfileErrors(p => ({ ...p, [key]: validateField(key, val) }));
                                                }}
                                                maxLength={key === 'suffix' ? 10 : 50}
                                                style={inputStyle(profileErrors[key])}
                                            />
                                            {profileErrors[key] && <span style={{ fontSize: 11, color: '#ee5d50', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{profileErrors[key]}</span>}
                                        </div>
                                    ))}
                                </div>

                                {/* Contact */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a2332', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Contact Number <span style={{ fontSize: 10, color: '#8a95b0', textTransform: 'none', fontWeight: 500 }}>(optional)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="e.g. 09123456789"
                                        value={profile.contactNumber}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setProfile(p => ({ ...p, contactNumber: val }));
                                            setProfileErrors(p => ({ ...p, contactNumber: validateField('contactNumber', val) }));
                                        }}
                                        maxLength={11}
                                        style={inputStyle(profileErrors.contactNumber)}
                                    />
                                    {profileErrors.contactNumber
                                        ? <span style={{ fontSize: 11, color: '#ee5d50', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{profileErrors.contactNumber}</span>
                                        : <span style={{ fontSize: 11, color: '#8a95b0' }}>Format: 09XXXXXXXXX (11 digits)</span>
                                    }
                                </div>

                                <button onClick={handleProfileSave} disabled={profileSaving} style={{ width: '100%', height: 44, border: 'none', borderRadius: 10, background: profileSaving ? '#a78bfa' : 'linear-gradient(135deg, #4318ff, #6a5cff)', color: 'white', fontSize: 13, fontWeight: 700, cursor: profileSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginTop: 4 }}>
                                    {profileSaving ? <><Loader2 size={14} /> Saving…</> : <>Save & Continue <ArrowRight size={14} /></>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── PASSWORD ── */}
                    {step === 'password' && (
                        <div>
                            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #edf2f7' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(67,24,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Lock size={16} color="#4318ff" />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Set Your Password</h3>
                                </div>
                                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', marginLeft: 42 }}>Create a strong password to secure your account.</p>
                            </div>
                            <div style={{ padding: '24px 32px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {pwApiError && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(238,93,80,0.08)', border: '1px solid rgba(238,93,80,0.2)', borderRadius: 8, fontSize: 13, color: '#ee5d50' }}>
                                        <AlertCircle size={14} />{pwApiError}
                                    </div>
                                )}

                                {/* Current Password */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a2332', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Current Password <span style={{ color: '#ee5d50' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showCurrent ? 'text' : 'password'}
                                            placeholder="Enter your current password"
                                            value={pw.current}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setPw(p => ({ ...p, current: val }));
                                                setPwErrors(p => ({ ...p, current: validatePwField('current', val) }));
                                            }}
                                            style={pwInputStyle(pwErrors.current)}
                                        />
                                        <button type="button" onClick={() => setShowCurrent(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a95b0' }}>
                                            {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {pwErrors.current && <span style={{ fontSize: 11, color: '#ee5d50', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{pwErrors.current}</span>}
                                </div>

                                {/* New Password */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a2332', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        New Password <span style={{ color: '#ee5d50' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showNext ? 'text' : 'password'}
                                            placeholder="At least 15 characters"
                                            value={pw.next}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setPw(p => ({ ...p, next: val }));
                                                setPwErrors(p => ({
                                                    ...p,
                                                    next: validatePwField('next', val),
                                                    confirm: pw.confirm ? (pw.confirm !== val ? 'Passwords do not match.' : '') : p.confirm,
                                                }));
                                            }}
                                            maxLength={64}
                                            style={pwInputStyle(pwErrors.next)}
                                        />
                                        <button type="button" onClick={() => setShowNext(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a95b0' }}>
                                            {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {pw.next.length > 0 && (
                                        <div>
                                            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                                {[1, 2, 3].map(l => (
                                                    <div key={l} style={{ flex: 1, height: 4, borderRadius: 2, background: pwStrength >= l ? pwStrengthColor[pwStrength] : '#e8ecf4', transition: 'background 0.2s' }} />
                                                ))}
                                            </div>
                                            <span style={{ fontSize: 11, color: pwStrengthColor[pwStrength], marginTop: 3, display: 'block', fontWeight: 600 }}>{pwStrengthLabel[pwStrength]}</span>
                                        </div>
                                    )}
                                    {pwErrors.next && <span style={{ fontSize: 11, color: '#ee5d50', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{pwErrors.next}</span>}
                                </div>

                                {/* Confirm Password */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a2332', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Confirm Password <span style={{ color: '#ee5d50' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            placeholder="Re-enter your password"
                                            value={pw.confirm}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setPw(p => ({ ...p, confirm: val }));
                                                setPwErrors(p => ({ ...p, confirm: validatePwField('confirm', val) }));
                                            }}
                                            maxLength={64}
                                            style={pwInputStyle(pwErrors.confirm)}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a95b0' }}>
                                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {pw.confirm.length > 0 && !pwErrors.confirm && (
                                        <span style={{ fontSize: 11, color: '#05cd99', fontWeight: 600 }}>✓ Passwords match</span>
                                    )}
                                    {pwErrors.confirm && <span style={{ fontSize: 11, color: '#ee5d50', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{pwErrors.confirm}</span>}
                                </div>

                                <button onClick={handlePasswordSave} disabled={pwSaving} style={{ width: '100%', height: 44, border: 'none', borderRadius: 10, background: pwSaving ? '#a78bfa' : 'linear-gradient(135deg, #4318ff, #6a5cff)', color: 'white', fontSize: 13, fontWeight: 700, cursor: pwSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginTop: 4 }}>
                                    {pwSaving ? <><Loader2 size={14} /> Saving…</> : <>Set Password & Finish <ArrowRight size={14} /></>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── DONE ── */}
                    {step === 'done' && (
                        <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(5,205,153,0.1)', border: '2px solid rgba(5,205,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <CheckCircle2 size={32} color="#05cd99" />
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>You're all set!</h2>
                            <p style={{ fontSize: 13, color: '#8a95b0', margin: '0 0 28px', lineHeight: 1.6 }}>Your account is ready. Welcome to the Speedex team!</p>
                            <button onClick={() => {
                                const role = localStorage.getItem('userRole');
                                const routes: Record<string, string> = {
                                    'System Admin': '/SystemAdmin_Dashboard',
                                    'SuperAdmin': '/SystemAdmin_Dashboard',
                                    'Operation Admin': '/OpAdmin_Dashboard',
                                    'OpAdmin': '/OpAdmin_Dashboard',
                                    'Coordinator': '/OpEmployee_Dashboard',
                                    'Encoder': '/OpEmployee_Dashboard',
                                };
                                navigate(routes[role ?? ''] ?? '/');
                            }} style={{ width: '100%', height: 46, border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #0c1527, #1e293b)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(15,23,42,0.2)' }}>
                                Go to Dashboard <ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                    © {new Date().getFullYear()} Speedex Courier Inc. All rights reserved.
                </p>
            </div>
        </div>
    );
}