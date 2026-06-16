import { useState } from 'react';
import type { CSSProperties, DragEvent, ChangeEvent } from 'react';


// ── Types ────────────────────────────────────────────────────────────────────

type Stage = 'landing' | 'auth' | 'form' | 'success';

type FormKey = 'fullName' | 'contactNumber' | 'position' | 'resume';

interface ApplicationForm {
    fullName: string;
    email: string;
    contactNumber: string;
    position: string;
    resume: File | null;
}

type FormErrors = Partial<Record<FormKey, string>>;

// ── Icon components (inline SVG) ─────────────────────────────────────────────

const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const UploadIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const CheckIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const ShieldIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const FileIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const XIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const AlertIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

// ── Mock data ────────────────────────────────────────────────────────────────

const OPEN_POSITIONS: string[] = [
    'Operations Manager',
    'Logistics Coordinator',
    'Delivery Driver',
    'Warehouse Staff',
    'Customer Service Representative',
    'Finance Analyst',
    'IT Support Specialist',
    'Administrative Officer',
    'HR Coordinator',
    'Data Entry Specialist',
];

const EMPTY_FORM: ApplicationForm = {
    fullName: '',
    email: 'hannabelle.reyes@gmail.com',
    contactNumber: '',
    position: '',
    resume: null,
};

// ── Inject fonts + keyframes once ────────────────────────────────────────────

if (typeof document !== 'undefined' && !document.getElementById('portal-styles')) {
    const style = document.createElement('style');
    style.id = 'portal-styles';
    style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
    document.head.appendChild(style);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PublicApplicationPortal() {
    const [stage, setStage] = useState<Stage>('landing');
    const [authLoading, setAuthLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [form, setForm] = useState<ApplicationForm>({ ...EMPTY_FORM });
    const [errors, setErrors] = useState<FormErrors>({});

    // ── Google OAuth simulation ───────────────────────────────────────────────

    const handleGoogleAuth = () => {
        setAuthLoading(true);
        setTimeout(() => {
            setAuthLoading(false);
            setStage('form');
        }, 1800);
    };

    // ── Validation ────────────────────────────────────────────────────────────

    const validateField = (key: FormKey, value: string | File | null): string => {
        if (key === 'fullName') {
            const v = (value as string).trim();
            if (!v) return 'Full name is required.';
            if (v.length > 100) return 'Name must not exceed 100 characters.';
        }
        if (key === 'contactNumber') {
            const v = (value as string).trim();
            if (!v) return 'Contact number is required.';
            if (!/^\d{11}$/.test(v)) return 'Enter a valid 11-digit contact number.';
        }
        if (key === 'position') {
            if (!value) return 'Please select a position.';
        }
        if (key === 'resume') {
            if (!value) return 'Please upload your Resume/CV.';
        }
        return '';
    };

    const handleChange = (key: keyof Pick<ApplicationForm, 'fullName' | 'contactNumber' | 'position'>) =>
        (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const val = e.target.value;
            setForm(p => ({ ...p, [key]: val }));
            const err = validateField(key as FormKey, val);
            setErrors(p => ({ ...p, [key]: err || undefined }));
        };

    const handleFile = (file: File | undefined) => {
        if (!file) return;
        const allowed = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!allowed.includes(file.type) && !['pdf', 'docx'].includes(ext)) {
            setErrors(p => ({ ...p, resume: 'Invalid file format. Please upload a PDF or DOCX.' }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors(p => ({ ...p, resume: 'File exceeds 5MB. Please upload a smaller file.' }));
            return;
        }
        setForm(p => ({ ...p, resume: file }));
        setErrors(p => ({ ...p, resume: undefined }));
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleSubmit = () => {
        const newErrors: FormErrors = {};
        const keys: FormKey[] = ['fullName', 'contactNumber', 'position', 'resume'];
        keys.forEach(k => {
            const err = validateField(k, form[k]);
            if (err) newErrors[k] = err;
        });
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        setSubmitLoading(true);
        setTimeout(() => { setSubmitLoading(false); setStage('success'); }, 2000);
    };

    const formatBytes = (b: number): string => {
        if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    };

    const resetPortal = () => {
        setStage('landing');
        setForm({ ...EMPTY_FORM });
        setErrors({});
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div style={s.root}>
            <div style={s.bgPattern} />
            <div style={s.bgGlow} />

            {/* Header */}
            <header style={s.header}>
                <div style={s.headerInner}>
                    <div style={s.headerLogo}>
                        <div style={s.logoMark}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
                                <rect x="9" y="11" width="14" height="10" rx="2" />
                                <circle cx="12" cy="16" r="1" fill="white" />
                            </svg>
                        </div>
                        <div>
                            <span style={s.logoName}>Speedex Courier</span>
                            <span style={s.logoDivider}>·</span>
                            <span style={s.logoSub}>Careers</span>
                        </div>
                    </div>
                    <div style={s.headerBadge}>
                        <ShieldIcon />
                        <span>Secured with Google OAuth</span>
                    </div>
                </div>
            </header>

            <main style={s.main}>

                {/* ══ LANDING ══════════════════════════════════════════════════════ */}
                {stage === 'landing' && (
                    <div style={s.landingWrap}>
                        <div style={s.landingLeft}>
                            <span style={s.eyebrow}>We're Hiring</span>
                            <h1 style={s.heroTitle}>
                                Drive the future<br />
                                of delivery<span style={s.heroAccent}>.</span>
                            </h1>
                            <p style={s.heroBody}>
                                Join Speedex Courier and be part of a team that keeps the Philippines moving. We're looking for motivated individuals across operations, logistics, and support.
                            </p>
                            <div style={s.pillRow}>
                                {['Operations', 'Logistics', 'IT & Admin', 'Customer Service'].map(t => (
                                    <span key={t} style={s.pill}>{t}</span>
                                ))}
                            </div>
                            <div style={s.trustRow}>
                                {[
                                    { value: '500+', label: 'Active Employees' },
                                    { value: '12', label: 'Open Roles' },
                                    { value: 'NCR', label: 'Primary Location' },
                                ].map(({ value, label }) => (
                                    <div key={label} style={s.trustStat}>
                                        <span style={s.trustValue}>{value}</span>
                                        <span style={s.trustLabel}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={s.landingCard}>
                            <div style={s.cardBadge}>
                                <span style={{ ...s.dot, background: '#05cd99' }} />
                                Applications Open
                            </div>
                            <h2 style={s.cardTitle}>Apply Now</h2>
                            <p style={s.cardBody}>
                                Sign in with your Gmail account to access the application form. Your email will be used as your application identifier.
                            </p>
                            <div style={s.authBox}>
                                {[
                                    'Authenticate with Gmail',
                                    'Fill out the application form',
                                    'Upload your Resume/CV',
                                ].map((text, i) => (
                                    <div key={i} style={s.authStep}>
                                        <span style={s.authNum}>{i + 1}</span>
                                        <span style={s.authText}>{text}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                style={s.googleBtn}
                                onClick={() => setStage('auth')}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 30px rgba(67,24,255,0.25)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(67,24,255,0.15)')}
                            >
                                <GoogleIcon />
                                <span>Continue with Google</span>
                            </button>
                            <p style={s.privacyNote}>
                                <ShieldIcon />
                                Only your Gmail address is accessed. No other Google data is read or stored.
                            </p>
                        </div>
                    </div>
                )}

                {/* ══ AUTH ═════════════════════════════════════════════════════════ */}
                {stage === 'auth' && (
                    <div style={s.centeredStage}>
                        <div style={s.authCard}>
                            <div style={s.authIconWrap}><GoogleIcon /></div>
                            <h2 style={s.authTitle}>Sign in with Google</h2>
                            <p style={s.authSub}>
                                You'll be redirected to Google to verify your identity. Only your email address will be shared with Speedex Courier.
                            </p>
                            <div style={s.authEmailMock}>
                                <div style={s.mockGoogleBar}>
                                    <span style={s.mockDomain}>accounts.google.com</span>
                                    <ShieldIcon />
                                </div>
                                <div style={s.mockContent}>
                                    <GoogleIcon />
                                    <p style={{ margin: '12px 0 4px', fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                                        Sign in to Speedex Careers
                                    </p>
                                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Choose an account to continue</p>
                                    <div style={s.mockAccount}>
                                        <div style={s.mockAvatar}>H</div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>Hannabelle Reyes</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>hannabelle.reyes@gmail.com</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                style={s.googleBtn}
                                onClick={handleGoogleAuth}
                                disabled={authLoading}
                                onMouseEnter={e => { if (!authLoading) e.currentTarget.style.boxShadow = '0 8px 30px rgba(67,24,255,0.25)'; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(67,24,255,0.15)'; }}
                            >
                                {authLoading ? (
                                    <><div style={s.spinner} /><span>Verifying…</span></>
                                ) : (
                                    <><GoogleIcon /><span>Continue as Hannabelle</span></>
                                )}
                            </button>
                            <button style={s.ghostBtn} onClick={() => setStage('landing')}>← Back</button>
                        </div>
                    </div>
                )}

                {/* ══ FORM ═════════════════════════════════════════════════════════ */}
                {stage === 'form' && (
                    <div style={s.formWrap}>
                        {/* Sidebar */}
                        <div style={s.formSide}>
                            <span style={s.eyebrow}>Application Form</span>
                            <h2 style={s.formSideTitle}>Tell us about yourself</h2>
                            <p style={s.formSideBody}>
                                Complete all required fields below. Ensure your resume is up to date before submitting.
                            </p>
                            <div style={s.formStepList}>
                                {[
                                    { num: '01', title: 'Personal Details', desc: 'Name, contact, and email' },
                                    { num: '02', title: 'Position', desc: 'Choose the role you\'re applying for' },
                                    { num: '03', title: 'Resume/CV', desc: 'PDF or DOCX, max 5MB' },
                                ].map(({ num, title, desc }) => (
                                    <div key={num} style={s.formStep}>
                                        <span style={s.formStepNum}>{num}</span>
                                        <div>
                                            <div style={s.formStepTitle}>{title}</div>
                                            <div style={s.formStepDesc}>{desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={s.verifiedBadge}>
                                <div style={s.verifiedDot} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Authenticated</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>{form.email}</div>
                                </div>
                            </div>
                        </div>

                        {/* Form card */}
                        <div style={s.formCard}>
                            <div style={s.formCardHeader}>
                                <h3 style={s.formCardTitle}>Job Application</h3>
                                <span style={s.formCardSub}>All fields marked * are required</span>
                            </div>

                            {/* Personal Info */}
                            <div style={s.sectionLabel}>Personal Information</div>
                            <div style={{ marginBottom: 16 }}>
                                <div style={s.field}>
                                    <label style={s.label}>Full Name <span style={s.req}>*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Juan Dela Cruz"
                                        value={form.fullName}
                                        onChange={handleChange('fullName')}
                                        maxLength={100}
                                        style={{ ...s.input, ...(errors.fullName ? s.inputErr : {}) }}
                                    />
                                    {errors.fullName && <span style={s.errMsg}><AlertIcon />{errors.fullName}</span>}
                                </div>
                            </div>

                            <div style={s.fieldRow2}>
                                <div style={s.field}>
                                    <label style={s.label}>Email Address</label>
                                    <div style={s.prefillWrap}>
                                        <input
                                            type="email"
                                            value={form.email}
                                            readOnly
                                            style={{ ...s.input, ...s.inputReadonly }}
                                        />
                                        <span style={s.prefillTag}>Via Google</span>
                                    </div>
                                    <span style={s.hint}>Pre-filled from your Gmail account</span>
                                </div>
                                <div style={s.field}>
                                    <label style={s.label}>Contact Number <span style={s.req}>*</span></label>
                                    <input
                                        type="tel"
                                        placeholder="e.g. 09170000000"
                                        value={form.contactNumber}
                                        onChange={handleChange('contactNumber')}
                                        maxLength={11}
                                        style={{ ...s.input, ...(errors.contactNumber ? s.inputErr : {}) }}
                                    />
                                    {errors.contactNumber && <span style={s.errMsg}><AlertIcon />{errors.contactNumber}</span>}
                                </div>
                            </div>

                            {/* Position */}
                            <div style={{ ...s.sectionLabel, marginTop: 24 }}>Position Applied For</div>
                            <div style={s.field}>
                                <label style={s.label}>Select Position <span style={s.req}>*</span></label>
                                <select
                                    value={form.position}
                                    onChange={handleChange('position')}
                                    style={{ ...s.input, ...s.select, ...(errors.position ? s.inputErr : {}), cursor: 'pointer' }}
                                >
                                    <option value="">Choose a position…</option>
                                    {OPEN_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                {errors.position && <span style={s.errMsg}><AlertIcon />{errors.position}</span>}
                            </div>

                            {/* Resume */}
                            <div style={{ ...s.sectionLabel, marginTop: 24 }}>Resume / CV</div>

                            {!form.resume ? (
                                <div
                                    style={{ ...s.dropzone, ...(dragOver ? s.dropzoneActive : {}), ...(errors.resume ? s.dropzoneErr : {}) }}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => (document.getElementById('resume-input') as HTMLInputElement)?.click()}
                                >
                                    <input
                                        id="resume-input"
                                        type="file"
                                        accept=".pdf,.docx"
                                        style={{ display: 'none' }}
                                        onChange={e => handleFile(e.target.files?.[0])}
                                    />
                                    <div style={{ ...s.dropzoneIcon, ...(dragOver ? { background: 'rgba(67,24,255,0.15)', color: '#4318ff' } : {}) }}>
                                        <UploadIcon />
                                    </div>
                                    <div style={s.dropzoneTitle}>{dragOver ? 'Drop to upload' : 'Drag & drop your resume here'}</div>
                                    <div style={s.dropzoneHint}>or click to browse · PDF or DOCX · Max 5MB</div>
                                </div>
                            ) : (
                                <div style={s.filePreview}>
                                    <div style={s.fileIcon}><FileIcon /></div>
                                    <div style={s.fileMeta}>
                                        <div style={s.fileName}>{form.resume.name}</div>
                                        <div style={s.fileSize}>{formatBytes(form.resume.size)}</div>
                                    </div>
                                    <button
                                        style={s.fileRemove}
                                        onClick={() => setForm(p => ({ ...p, resume: null }))}
                                        title="Remove file"
                                    >
                                        <XIcon />
                                    </button>
                                </div>
                            )}
                            {errors.resume && <span style={{ ...s.errMsg, marginTop: 6 }}><AlertIcon />{errors.resume}</span>}

                            {/* Submit */}
                            <button
                                style={{ ...s.submitBtn, ...(submitLoading ? { opacity: 0.8, cursor: 'not-allowed' } : {}) }}
                                onClick={handleSubmit}
                                disabled={submitLoading}
                                onMouseEnter={e => { if (!submitLoading) e.currentTarget.style.background = '#3510d9'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#4318ff'; }}
                            >
                                {submitLoading ? (
                                    <><div style={{ ...s.spinner, borderTopColor: 'white' }} />Submitting application…</>
                                ) : (
                                    'Submit Application →'
                                )}
                            </button>

                            <p style={s.submitNote}>
                                By submitting, you confirm the information provided is accurate. Your application status will be{' '}
                                <strong>Pending Review</strong> until assessed by our team.
                            </p>
                        </div>
                    </div>
                )}

                {/* ══ SUCCESS ══════════════════════════════════════════════════════ */}
                {stage === 'success' && (
                    <div style={s.centeredStage}>
                        <div style={s.successCard}>
                            <div style={s.successIconWrap}><CheckIcon /></div>
                            <h2 style={s.successTitle}>Application Submitted!</h2>
                            <p style={s.successBody}>
                                Thank you for applying to Speedex Courier. Your application has been received and is currently under review.
                            </p>
                            <div style={s.successDetails}>
                                {([
                                    { label: 'Applicant', value: form.fullName },
                                    { label: 'Email', value: form.email },
                                    { label: 'Position', value: form.position },
                                    { label: 'Status', value: 'Pending Review', highlight: true },
                                ] as const).map(({ label, value, highlight }) => (
                                    <div key={label} style={s.successRow}>
                                        <span style={s.successLabel}>{label}</span>
                                        <span style={{ ...s.successValue, ...(highlight ? s.successBadge : {}) }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={s.successNotice}>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>What happens next?</div>
                                <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                                    Our recruitment team will review your application and reach out to{' '}
                                    <strong>{form.email}</strong> within 3–5 business days. Please check your inbox, including your spam folder.
                                </p>
                            </div>
                            <button
                                style={{ ...s.submitBtn, background: '#0f172a' }}
                                onClick={resetPortal}
                                onMouseEnter={e => (e.currentTarget.style.background = '#1e293b')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#0f172a')}
                            >
                                Submit Another Application
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer style={s.footer}>
                <span>© 2026 Speedex Courier Inc. · All rights reserved.</span>
                <span style={s.footerRight}>Powered by OTMS · Recruitment Module</span>
            </footer>
        </div>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
    root: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
    },
    bgPattern: {
        position: 'fixed',
        inset: 0,
        backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(67,24,255,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(134,140,255,0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0,
    },
    bgGlow: {
        position: 'fixed',
        top: -200,
        right: -200,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(67,24,255,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
    },

    // Header
    header: {
        position: 'relative',
        zIndex: 10,
        borderBottom: '1px solid #e2e8f0',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
    },
    headerInner: {
        maxWidth: 1200,
        margin: '0 auto',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLogo: { display: 'flex', alignItems: 'center', gap: 12 },
    logoMark: {
        width: 36, height: 36, borderRadius: 10,
        background: 'linear-gradient(135deg, #4318ff, #868cff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(67,24,255,0.25)',
    },
    logoName: { fontWeight: 800, fontSize: 15, color: '#0f172a' },
    logoDivider: { margin: '0 8px', color: '#cbd5e1' },
    logoSub: { fontSize: 14, color: '#64748b', fontWeight: 500 },
    headerBadge: {
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: '#64748b', fontWeight: 500,
        background: '#f1f5f9', borderRadius: 999, padding: '6px 12px',
    },

    // Main
    main: {
        flex: 1,
        position: 'relative',
        zIndex: 1,
        padding: '48px 32px',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
    },

    // Landing
    landingWrap: { display: 'flex', gap: 64, alignItems: 'flex-start', flexWrap: 'wrap' },
    landingLeft: { flex: '1 1 400px', maxWidth: 560 },
    eyebrow: {
        display: 'inline-block',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: '#4318ff',
        background: 'rgba(67,24,255,0.08)',
        padding: '4px 12px', borderRadius: 999, marginBottom: 20,
    },
    heroTitle: {
        fontSize: 52, fontWeight: 800, lineHeight: 1.1,
        color: '#0f172a', margin: '0 0 20px', letterSpacing: '-0.02em',
    },
    heroAccent: { color: '#4318ff' },
    heroBody: { fontSize: 16, color: '#475569', lineHeight: 1.7, margin: '0 0 28px', maxWidth: 460 },
    pillRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 },
    pill: {
        fontSize: 12, fontWeight: 600, color: '#334155',
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 999, padding: '5px 14px',
    },
    trustRow: { display: 'flex', gap: 40 },
    trustStat: { display: 'flex', flexDirection: 'column', gap: 2 },
    trustValue: { fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' },
    trustLabel: { fontSize: 12, color: '#64748b', fontWeight: 500 },

    // Landing card
    landingCard: {
        flex: '0 0 380px',
        background: 'white', border: '1px solid #e2e8f0',
        borderRadius: 24, padding: 36,
        boxShadow: '0 8px 40px rgba(15,23,42,0.08)',
    },
    cardBadge: {
        display: 'inline-flex', alignItems: 'center', gap: 7,
        fontSize: 12, fontWeight: 700, color: '#059669',
        background: 'rgba(5,205,153,0.08)', borderRadius: 999, padding: '4px 12px', marginBottom: 20,
    },
    dot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
    cardTitle: { fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' },
    cardBody: { fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' },
    authBox: {
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14,
        padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24,
    },
    authStep: { display: 'flex', alignItems: 'center', gap: 12 },
    authNum: {
        width: 24, height: 24, borderRadius: '50%',
        background: 'linear-gradient(135deg, #4318ff, #868cff)',
        color: 'white', fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    authText: { fontSize: 13, color: '#334155', fontWeight: 500 },

    // Buttons
    googleBtn: {
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        background: '#4318ff', color: 'white', fontWeight: 700, fontSize: 14,
        border: 'none', borderRadius: 12, padding: '14px 20px', cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(67,24,255,0.15)', transition: 'box-shadow 0.2s',
        marginTop: 4, fontFamily: 'inherit',
    },
    ghostBtn: {
        width: '100%', background: 'none', border: '1px solid #e2e8f0',
        borderRadius: 12, padding: '11px 20px', cursor: 'pointer',
        fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 10, fontFamily: 'inherit',
    },
    privacyNote: {
        display: 'flex', alignItems: 'flex-start', gap: 6,
        fontSize: 11, color: '#94a3b8', lineHeight: 1.5, marginTop: 14,
    },

    // Auth / Success centered layout
    centeredStage: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 16 },
    authCard: {
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 24,
        padding: '40px 40px 32px',
        boxShadow: '0 8px 40px rgba(15,23,42,0.08)',
        width: '100%', maxWidth: 460,
        display: 'flex', flexDirection: 'column', gap: 16,
    },
    authIconWrap: {
        width: 52, height: 52, borderRadius: 14,
        background: '#f8fafc', border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    authTitle: { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 },
    authSub: { fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 },
    authEmailMock: { border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', background: '#f8fafc' },
    mockGoogleBar: {
        background: '#f1f5f9', padding: '8px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11, color: '#64748b',
    },
    mockDomain: { fontWeight: 600, color: '#059669' },
    mockContent: {
        padding: '20px 20px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    },
    mockAccount: {
        display: 'flex', alignItems: 'center', gap: 12, marginTop: 12,
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 10,
        padding: '10px 14px', width: '100%', boxSizing: 'border-box', cursor: 'pointer',
    },
    mockAvatar: {
        width: 36, height: 36, borderRadius: '50%',
        background: 'linear-gradient(135deg, #4318ff, #868cff)',
        color: 'white', fontWeight: 700, fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },

    // Spinner
    spinner: {
        width: 16, height: 16, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: 'white',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
    },

    // Form layout
    formWrap: { display: 'flex', gap: 48, alignItems: 'flex-start', flexWrap: 'wrap' },
    formSide: { flex: '0 0 260px' },
    formSideTitle: { fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '14px 0 10px', lineHeight: 1.2 },
    formSideBody: { fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 28 },
    formStepList: { display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28 },
    formStep: { display: 'flex', alignItems: 'flex-start', gap: 14 },
    formStepNum: {
        fontSize: 11, fontWeight: 800, color: '#4318ff',
        background: 'rgba(67,24,255,0.08)', borderRadius: 7,
        padding: '4px 8px', flexShrink: 0, letterSpacing: '0.04em',
    },
    formStepTitle: { fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 2 },
    formStepDesc: { fontSize: 12, color: '#94a3b8' },
    verifiedBadge: {
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(5,205,153,0.06)', border: '1px solid rgba(5,205,153,0.2)',
        borderRadius: 12, padding: '10px 14px',
    },
    verifiedDot: {
        width: 8, height: 8, borderRadius: '50%',
        background: '#05cd99', flexShrink: 0,
        boxShadow: '0 0 0 3px rgba(5,205,153,0.2)',
    },

    // Form card
    formCard: {
        flex: 1, background: 'white', border: '1px solid #e2e8f0',
        borderRadius: 24, padding: 36,
        boxShadow: '0 8px 40px rgba(15,23,42,0.07)', minWidth: 0,
    },
    formCardHeader: { marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' },
    formCardTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' },
    formCardSub: { fontSize: 13, color: '#94a3b8' },
    sectionLabel: {
        fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#94a3b8', marginBottom: 14,
    },
    fieldRow2: { display: 'flex', gap: 16, marginBottom: 0, flexWrap: 'wrap' },
    field: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 },
    label: { fontSize: 12, fontWeight: 700, color: '#374151' },
    req: { color: '#ef4444' },
    input: {
        height: 42, borderRadius: 10, border: '1px solid #e2e8f0',
        padding: '0 14px', fontSize: 13, color: '#0f172a', background: 'white',
        outline: 'none', width: '100%', boxSizing: 'border-box',
        fontFamily: 'inherit', transition: 'border-color 0.15s',
    },
    inputErr: { border: '1px solid #ef4444', background: '#fff8f8' },
    inputReadonly: { background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' },
    select: { appearance: 'none' },
    prefillWrap: { position: 'relative' },
    prefillTag: {
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        fontSize: 10, fontWeight: 700, color: '#4318ff',
        background: 'rgba(67,24,255,0.08)', borderRadius: 6, padding: '2px 8px',
        pointerEvents: 'none',
    },
    hint: { fontSize: 11, color: '#94a3b8' },
    errMsg: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#ef4444', fontWeight: 500 },

    // Dropzone
    dropzone: {
        border: '2px dashed #e2e8f0', borderRadius: 14, padding: '32px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        cursor: 'pointer', transition: 'all 0.2s', background: '#fafbff',
    },
    dropzoneActive: { border: '2px dashed #4318ff', background: 'rgba(67,24,255,0.04)' },
    dropzoneErr: { border: '2px dashed #ef4444', background: '#fff8f8' },
    dropzoneIcon: {
        width: 56, height: 56, borderRadius: 14,
        background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#94a3b8', marginBottom: 14, transition: 'all 0.2s',
    },
    dropzoneTitle: { fontWeight: 700, fontSize: 14, color: '#334155', marginBottom: 6 },
    dropzoneHint: { fontSize: 12, color: '#94a3b8' },

    filePreview: {
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'rgba(67,24,255,0.04)', border: '1px solid rgba(67,24,255,0.15)',
        borderRadius: 12, padding: '14px 16px',
    },
    fileIcon: {
        width: 38, height: 38, borderRadius: 10,
        background: 'rgba(67,24,255,0.1)', color: '#4318ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    fileMeta: { flex: 1, minWidth: 0 },
    fileName: { fontWeight: 700, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    fileSize: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    fileRemove: {
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#94a3b8', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center',
    },

    // Submit
    submitBtn: {
        width: '100%', marginTop: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        background: '#4318ff', color: 'white', fontWeight: 700, fontSize: 15,
        border: 'none', borderRadius: 12, padding: '15px 20px', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(67,24,255,0.2)', transition: 'background 0.2s', fontFamily: 'inherit',
    },
    submitNote: { fontSize: 12, color: '#94a3b8', lineHeight: 1.5, textAlign: 'center', marginTop: 14 },

    // Success
    successCard: {
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: '48px 40px',
        boxShadow: '0 8px 40px rgba(15,23,42,0.08)', width: '100%', maxWidth: 520,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    successIconWrap: {
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(5,205,153,0.1)', color: '#05cd99',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, boxShadow: '0 0 0 12px rgba(5,205,153,0.06)',
    },
    successTitle: { fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', textAlign: 'center' },
    successBody: { fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 28px', textAlign: 'center' },
    successDetails: {
        width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 14, padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20,
    },
    successRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 13 },
    successLabel: { color: '#94a3b8', fontWeight: 500 },
    successValue: { fontWeight: 700, color: '#0f172a', textAlign: 'right' },
    successBadge: {
        fontSize: 11, fontWeight: 700, color: '#d97706',
        background: 'rgba(255,181,71,0.12)', borderRadius: 999, padding: '3px 10px',
    },
    successNotice: {
        width: '100%', background: 'rgba(67,24,255,0.04)', border: '1px solid rgba(67,24,255,0.12)',
        borderRadius: 12, padding: '14px 16px', marginBottom: 24,
    },

    // Footer
    footer: {
        position: 'relative', zIndex: 1, borderTop: '1px solid #e2e8f0', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 12, color: '#94a3b8',
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
        flexWrap: 'wrap', gap: 8,
    },
    footerRight: { fontWeight: 500 },
};