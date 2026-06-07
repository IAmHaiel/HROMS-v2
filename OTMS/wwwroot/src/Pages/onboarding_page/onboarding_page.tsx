import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Save, Eye, EyeOff, ArrowRight, User, Lock, Phone } from 'lucide-react';

type Step = 'welcome' | 'profile' | 'password' | 'done';

const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-.]+$/;

export default function OnboardingPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('welcome');

    // Profile form
    const [profile, setProfile] = useState({
        firstName: '', middleName: '', lastName: '', suffix: '', contactNumber: '',
    });
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileApiError, setProfileApiError] = useState('');

    // Password form
    const [pw, setPw] = useState({ next: '', confirm: '' });
    const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
    const [pwSaving, setPwSaving] = useState(false);
    const [pwApiError, setPwApiError] = useState('');
    const [showNext, setShowNext] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const employeeId = localStorage.getItem('employeeId') ?? '';
    const token = localStorage.getItem('authToken') ?? '';

    const steps: Step[] = ['welcome', 'profile', 'password', 'done'];
    const stepIndex = steps.indexOf(step);

    // ── Profile validation ──
    const validateProfile = () => {
        const errs: Record<string, string> = {};
        if (!profile.firstName.trim()) errs.firstName = 'First name is required.';
        else if (profile.firstName.trim().length < 2) errs.firstName = 'Must be at least 2 characters.';
        else if (!NAME_REGEX.test(profile.firstName.trim())) errs.firstName = 'Contains invalid characters.';
        if (!profile.lastName.trim()) errs.lastName = 'Last name is required.';
        else if (profile.lastName.trim().length < 2) errs.lastName = 'Must be at least 2 characters.';
        else if (!NAME_REGEX.test(profile.lastName.trim())) errs.lastName = 'Contains invalid characters.';
        if (profile.middleName.trim() && !NAME_REGEX.test(profile.middleName.trim())) errs.middleName = 'Contains invalid characters.';
        if (profile.contactNumber && !/^09\d{9}$/.test(profile.contactNumber.trim())) errs.contactNumber = 'Must be 11 digits starting with 09.';
        return errs;
    };

    const handleProfileSave = async () => {
        const errs = validateProfile();
        if (Object.keys(errs).length > 0) { setProfileErrors(errs); return; }
        setProfileSaving(true); setProfileApiError('');
        try {
            const res = await fetch(`/api/profile/update-profile?employeeNumber=${encodeURIComponent(employeeId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    employeeNumber: employeeId,
                    firstName: profile.firstName.trim(),
                    middleName: profile.middleName.trim(),
                    lastName: profile.lastName.trim(),
                    suffix: profile.suffix.trim(),
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
        if (pw.next.length < 8) errs.next = 'Password must be at least 8 characters.';
        if (pw.next !== pw.confirm) errs.confirm = 'Passwords do not match.';
        if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }
        setPwSaving(true); setPwApiError('');
        try {
            const res = await fetch('/api/systemadmin/change-password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ newPassword: pw.next }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message || 'Password update failed.');
            }
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

    return (
        <div style={{
            minHeight: '100vh', background: 'linear-gradient(135deg, #0c1527 0%, #1a2540 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Montserrat', sans-serif", padding: '24px 16px',
        }}>
            <div style={{ width: '100%', maxWidth: 520 }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <img src="/src/assets/SpeedexLogo.jpg" alt="Speedex" style={{ height: 40, objectFit: 'contain' }} />
                </div>

                {/* Progress bar */}
                {step !== 'welcome' && step !== 'done' && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            {['Profile Setup', 'Set Password'].map((label, i) => (
                                <span key={label} style={{
                                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                                    color: stepIndex - 1 >= i ? '#05cd99' : 'rgba(255,255,255,0.35)',
                                    textTransform: 'uppercase',
                                }}>
                                    {stepIndex - 1 > i ? '✓ ' : ''}{label}
                                </span>
                            ))}
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 999,
                                background: 'linear-gradient(90deg, #05cd99, #4318ff)',
                                width: step === 'profile' ? '50%' : '100%',
                                transition: 'width 0.4s ease',
                            }} />
                        </div>
                    </div>
                )}

                <div style={{
                    background: 'white', borderRadius: 20, overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
                }}>

                    {/* ── WELCOME ── */}
                    {step === 'welcome' && (
                        <div>
                            <div style={{
                                background: 'linear-gradient(135deg, #0c1527, #1e293b)',
                                padding: '40px 32px 32px', textAlign: 'center',
                            }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%',
                                    background: 'rgba(5,205,153,0.15)', border: '2px solid rgba(5,205,153,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 16px',
                                }}>
                                    <CheckCircle2 size={28} color="#05cd99" />
                                </div>
                                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                                    Welcome to Speedex!
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                                    Your email has been verified. Let's set up your account before you get started.
                                </p>
                            </div>
                            <div style={{ padding: '28px 32px 32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                                    {[
                                        { icon: User, label: 'Set up your profile', desc: 'Add your name and contact details' },
                                        { icon: Lock, label: 'Create a secure password', desc: 'Replace the temporary password sent to you' },
                                    ].map(({ icon: Icon, label, desc }, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: 14,
                                            padding: '14px 16px', background: '#f8fafc',
                                            borderRadius: 12, border: '1px solid #e8ecf4',
                                        }}>
                                            <div style={{
                                                width: 38, height: 38, borderRadius: 10,
                                                background: 'rgba(67,24,255,0.08)', flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Icon size={18} color="#4318ff" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2332' }}>{label}</div>
                                                <div style={{ fontSize: 11, color: '#8a95b0', marginTop: 2 }}>{desc}</div>
                                            </div>
                                            <div style={{
                                                marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%',
                                                background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#4318ff' }}>{i + 1}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setStep('profile')} style={{
                                    width: '100%', height: 46, border: 'none', borderRadius: 12,
                                    background: 'linear-gradient(135deg, #4318ff, #6a5cff)',
                                    color: 'white', fontSize: 14, fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: 8,
                                    boxShadow: '0 8px 24px rgba(67,24,255,0.3)',
                                    fontFamily: 'inherit',
                                }}>
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
                                    {[
                                        { key: 'firstName', label: 'First Name', placeholder: 'e.g. Juan', required: true },
                                        { key: 'lastName', label: 'Last Name', placeholder: 'e.g. dela Cruz', required: true },
                                    ].map(({ key, label, placeholder, required }) => (
                                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#1a2332', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                {label} {required && <span style={{ color: '#ee5d50' }}>*</span>}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={placeholder}
                                                value={profile[key as keyof typeof profile]}
                                                onChange={e => { setProfile(p => ({ ...p, [key]: e.target.value })); setProfileErrors(p => ({ ...p, [key]: '' })); }}
                                                maxLength={50}
                                                style={{
                                                    padding: '9px 13px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                                                    border: `1.5px solid ${profileErrors[key] ? '#ee5d50' : '#e8ecf4'}`,
                                                    outline: 'none', color: '#1a2332', background: 'white',
                                                }}
                                            />
                                            {profileErrors[key] && <span style={{ fontSize: 11, color: '#ee5d50', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{profileErrors[key]}</span>}
                                        </div>
                                    ))}
                                </div>
                                {/* Middle + Suffix */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {[
                                        { key: 'middleName', label: 'Middle Name', placeholder: 'e.g. Santos', optional: true },
                                        { key: 'suffix', label: 'Suffix', placeholder: 'e.g. Jr., Sr., III', optional: true },
                                    ].map(({ key, label, placeholder }) => (
                                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#1a2332', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                {label} <span style={{ fontSize: 10, color: '#8a95b0', textTransform: 'none', fontWeight: 500 }}>(optional)</span>
                                            </label>
                                            <input
                                                type="text" placeholder={placeholder}
                                                value={profile[key as keyof typeof profile]}
                                                onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                                                maxLength={key === 'suffix' ? 10 : 50}
                                                style={{ padding: '9px 13px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', border: '1.5px solid #e8ecf4', outline: 'none', color: '#1a2332', background: 'white' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                {/* Contact */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a2332', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Contact Number <span style={{ fontSize: 10, color: '#8a95b0', textTransform: 'none', fontWeight: 500 }}>(optional)</span>
                                    </label>
                                    <input
                                        type="tel" placeholder="e.g. 09123456789"
                                        value={profile.contactNumber}
                                        onChange={e => { const d = e.target.value.replace(/\D/g, ''); setProfile(p => ({ ...p, contactNumber: d })); setProfileErrors(p => ({ ...p, contactNumber: '' })); }}
                                        maxLength={11}
                                        style={{
                                            padding: '9px 13px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                                            border: `1.5px solid ${profileErrors.contactNumber ? '#ee5d50' : '#e8ecf4'}`,
                                            outline: 'none', color: '#1a2332', background: 'white',
                                        }}
                                    />
                                    {profileErrors.contactNumber
                                        ? <span style={{ fontSize: 11, color: '#ee5d50' }}>{profileErrors.contactNumber}</span>
                                        : <span style={{ fontSize: 11, color: '#8a95b0' }}>Format: 09XXXXXXXXX (11 digits)</span>
                                    }
                                </div>
                                <button onClick={handleProfileSave} disabled={profileSaving} style={{
                                    width: '100%', height: 44, border: 'none', borderRadius: 10,
                                    background: profileSaving ? '#a78bfa' : 'linear-gradient(135deg, #4318ff, #6a5cff)',
                                    color: 'white', fontSize: 13, fontWeight: 700, cursor: profileSaving ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    fontFamily: 'inherit', marginTop: 4,
                                }}>
                                    {profileSaving ? <><Loader2 size={14} className="spin" /> Saving…</> : <>Save & Continue <ArrowRight size={14} /></>}
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
                                {/* New Password */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a2332', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        New Password <span style={{ color: '#ee5d50' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showNext ? 'text' : 'password'}
                                            placeholder="At least 8 characters"
                                            value={pw.next}
                                            onChange={e => { setPw(p => ({ ...p, next: e.target.value })); setPwErrors(p => ({ ...p, next: '' })); }}
                                            style={{
                                                width: '100%', padding: '9px 40px 9px 13px', borderRadius: 8, fontSize: 13,
                                                border: `1.5px solid ${pwErrors.next ? '#ee5d50' : '#e8ecf4'}`,
                                                outline: 'none', color: '#1a2332', background: 'white', fontFamily: 'inherit',
                                                boxSizing: 'border-box',
                                            }}
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
                                            <span style={{ fontSize: 11, color: pwStrengthColor[pwStrength], marginTop: 3, display: 'block', fontWeight: 600 }}>
                                                {pwStrengthLabel[pwStrength]}
                                            </span>
                                        </div>
                                    )}
                                    {pwErrors.next && <span style={{ fontSize: 11, color: '#ee5d50' }}>{pwErrors.next}</span>}
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
                                            onChange={e => { setPw(p => ({ ...p, confirm: e.target.value })); setPwErrors(p => ({ ...p, confirm: '' })); }}
                                            style={{
                                                width: '100%', padding: '9px 40px 9px 13px', borderRadius: 8, fontSize: 13,
                                                border: `1.5px solid ${pwErrors.confirm ? '#ee5d50' : '#e8ecf4'}`,
                                                outline: 'none', color: '#1a2332', background: 'white', fontFamily: 'inherit',
                                                boxSizing: 'border-box',
                                            }}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a95b0' }}>
                                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {pw.confirm.length > 0 && (
                                        <span style={{ fontSize: 11, color: pw.next === pw.confirm ? '#05cd99' : '#ee5d50', fontWeight: 600 }}>
                                            {pw.next === pw.confirm ? '✓ Passwords match' : 'Passwords do not match'}
                                        </span>
                                    )}
                                    {pwErrors.confirm && <span style={{ fontSize: 11, color: '#ee5d50' }}>{pwErrors.confirm}</span>}
                                </div>
                                <button onClick={handlePasswordSave} disabled={pwSaving} style={{
                                    width: '100%', height: 44, border: 'none', borderRadius: 10,
                                    background: pwSaving ? '#a78bfa' : 'linear-gradient(135deg, #4318ff, #6a5cff)',
                                    color: 'white', fontSize: 13, fontWeight: 700, cursor: pwSaving ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    fontFamily: 'inherit', marginTop: 4,
                                }}>
                                    {pwSaving ? <><Loader2 size={14} className="spin" /> Saving…</> : <>Set Password & Finish <ArrowRight size={14} /></>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── DONE ── */}
                    {step === 'done' && (
                        <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: '50%',
                                background: 'rgba(5,205,153,0.1)', border: '2px solid rgba(5,205,153,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                            }}>
                                <CheckCircle2 size={32} color="#05cd99" />
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                                You're all set!
                            </h2>
                            <p style={{ fontSize: 13, color: '#8a95b0', margin: '0 0 28px', lineHeight: 1.6 }}>
                                Your account is ready. Welcome to the Speedex team!
                            </p>
                            <button onClick={() => navigate('/dashboard')} style={{
                                width: '100%', height: 46, border: 'none', borderRadius: 12,
                                background: 'linear-gradient(135deg, #0c1527, #1e293b)',
                                color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(15,23,42,0.2)',
                            }}>
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