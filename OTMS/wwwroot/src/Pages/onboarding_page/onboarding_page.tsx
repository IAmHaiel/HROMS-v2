import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, ArrowRight, ArrowLeft,
    User, Lock, Upload, FileText, Trash2, ShieldCheck, CreditCard, Phone
} from 'lucide-react';

type Step = 'welcome' | 'profile' | 'password' | 'documents' | 'documents201' | 'done';

interface UploadedFile {
    name: string;
    size: string;
    status: 'idle' | 'uploading' | 'done' | 'error';
    error?: string;
}

const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-.]+$/;
const SUFFIX_REGEX = /^[A-Za-z.\s]+$/;

// ── PH Gov ID format validators ──
const SSS_REGEX = /^\d{2}-\d{7}-\d{1}$/;           // XX-XXXXXXX-X
const PHILHEALTH_REGEX = /^\d{2}-\d{9}-\d{1}$/;     // XX-XXXXXXXXX-X
const PAGIBIG_REGEX = /^\d{4}-\d{4}-\d{4}$/;        // XXXX-XXXX-XXXX
const TIN_REGEX = /^\d{3}-\d{3}-\d{3}-\d{3}$/;      // XXX-XXX-XXX-XXX
const PH_MOBILE_REGEX = /^09\d{9}$/;

const BANK_OPTIONS = [
    'BDO Unibank', 'Bank of the Philippine Islands (BPI)', 'Metrobank',
    'Land Bank of the Philippines', 'Philippine National Bank (PNB)',
    'Security Bank', 'UnionBank', 'Chinabank', 'EastWest Bank',
    'RCBC', 'PSBANK', 'Robinsons Bank', 'GCash (Maya/GCash Padala)',
    'PayMaya / Maya Bank', 'Seabank', 'Other',
];

function applySSS(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 2) return d;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 9)}-${d.slice(9)}`;
}
function applyPhilHealth(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 12);
    if (d.length <= 2) return d;
    if (d.length <= 11) return `${d.slice(0, 2)}-${d.slice(2)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 11)}-${d.slice(11)}`;
}
function applyPagIBIG(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 12);
    if (d.length <= 4) return d;
    if (d.length <= 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
    return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
}
function applyTIN(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 12);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 9)}-${d.slice(9)}`;
}

export default function OnboardingPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('welcome');

    // ── Profile state ──
    const [profile, setProfile] = useState({ firstName: '', middleName: '', lastName: '', suffix: '', contactNumber: '' });
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileApiError, setProfileApiError] = useState('');

    // ── Password state ──
    const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
    const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
    const [pwSaving, setPwSaving] = useState(false);
    const [pwApiError, setPwApiError] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // ── File upload state ──
    const [fileObjects, setFileObjects] = useState<Record<string, File>>({});
    const [submittingDocs, setSubmittingDocs] = useState(false);
    const [docsApiError, setDocsApiError] = useState('');
    const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedFile>>({
        biodata: { name: '', size: '', status: 'idle' },
        medical: { name: '', size: '', status: 'idle' },
        govId: { name: '', size: '', status: 'idle' },
        nbi: { name: '', size: '', status: 'idle' },
        education: { name: '', size: '', status: 'idle' },
    });

    // ── 201 File state ──
    const [form201, setForm201] = useState({
        sss: '', philhealth: '', pagibig: '', tin: '',
        bankName: '', bankAccount: '',
        emergencyName: '', emergencyNumber: '',
    });
    const [errors201, setErrors201] = useState<Record<string, string>>({});
    const [saving201, setSaving201] = useState(false);
    const [api201Error, setApi201Error] = useState('');

    const token = localStorage.getItem('authToken') ?? '';
    const steps: Step[] = ['welcome', 'profile', 'password', 'documents', 'documents201', 'done'];
    const stepIndex = steps.indexOf(step);

    // ── Helpers ──
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleFileChange = (key: string, file: File | null) => {
        if (!file) return;
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const sizeStr = formatFileSize(file.size);
        const validExtensionsMap: Record<string, string[]> = {
            biodata: ['pdf', 'docx'],
            medical: ['pdf', 'jpg', 'jpeg', 'png'],
            govId: ['pdf', 'jpg', 'jpeg', 'png'],
            nbi: ['pdf', 'jpg', 'jpeg', 'png'],
            education: ['pdf', 'jpg', 'jpeg', 'png'],
        };
        const validExts = validExtensionsMap[key] || [];
        if (file.size > 10 * 1024 * 1024) {
            setUploadedDocs(prev => ({ ...prev, [key]: { name: file.name, size: sizeStr, status: 'error', error: 'File size exceeds 10MB limit.' } }));
            return;
        }
        if (!validExts.includes(ext)) {
            setUploadedDocs(prev => ({ ...prev, [key]: { name: file.name, size: sizeStr, status: 'error', error: key === 'biodata' ? 'Upload a PDF or DOCX.' : 'Upload a PDF or image.' } }));
            return;
        }
        setUploadedDocs(prev => ({ ...prev, [key]: { name: file.name, size: sizeStr, status: 'uploading' } }));
        setFileObjects(prev => ({ ...prev, [key]: file }));
        setTimeout(() => {
            setUploadedDocs(prev => prev[key]?.status === 'uploading' ? { ...prev, [key]: { ...prev[key], status: 'done' } } : prev);
        }, 1500);
    };

    const handleFileClear = (key: string) => {
        setUploadedDocs(prev => ({ ...prev, [key]: { name: '', size: '', status: 'idle' } }));
        setFileObjects(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

    const requiredKeys = ['biodata', 'medical', 'govId'];
    const pendingRequiredCount = requiredKeys.filter(k => uploadedDocs[k]?.status !== 'done').length;
    const isSubmitDisabled = pendingRequiredCount > 0;

    // ── Validators ──
    const validateField = (key: string, value: string): string => {
        switch (key) {
            case 'firstName':
            case 'lastName':
                if (!value.trim()) return `${key === 'firstName' ? 'First' : 'Last'} name is required.`;
                if (value.trim().length < 2) return 'Must be at least 2 characters.';
                if (value.trim().length > 50) return 'Must not exceed 50 characters.';
                if (key === 'firstName') { if (!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s'\-.]+$/.test(value.trim())) return 'Letters, numbers, spaces, hyphens, and apostrophes only.'; }
                else { if (!NAME_REGEX.test(value.trim())) return 'Letters, spaces, hyphens, and apostrophes only.'; }
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
                if (!PH_MOBILE_REGEX.test(value.trim())) return 'Must be 11 digits starting with 09.';
                return '';
            default:
                return '';
        }
    };

    const validate201Field = (key: string, value: string): string => {
        switch (key) {
            case 'sss':
                if (!value.trim()) return 'SSS Number is required.';
                if (!SSS_REGEX.test(value.trim())) return 'Format must be XX-XXXXXXX-X (e.g. 34-5678901-2).';
                return '';
            case 'philhealth':
                if (!value.trim()) return 'PhilHealth Number is required.';
                if (!PHILHEALTH_REGEX.test(value.trim())) return 'Format must be XX-XXXXXXXXX-X (e.g. 01-234567890-1).';
                return '';
            case 'pagibig':
                if (!value.trim()) return 'Pag-IBIG Number is required.';
                if (!PAGIBIG_REGEX.test(value.trim())) return 'Format must be XXXX-XXXX-XXXX (e.g. 1234-5678-9012).';
                return '';
            case 'tin':
                if (!value.trim()) return '';
                if (!TIN_REGEX.test(value.trim())) return 'Format must be XXX-XXX-XXX-XXX (e.g. 123-456-789-000).';
                return '';
            case 'bankName':
                if (!value.trim()) return 'Bank name is required.';
                return '';
            case 'bankAccount':
                if (!value.trim()) return 'Bank account number is required.';
                if (!/^\d+$/.test(value.trim())) return 'Account number must be numeric only.';
                if (value.trim().length < 8) return 'Must be at least 8 digits.';
                return '';
            case 'emergencyName':
                if (!value.trim()) return 'Emergency contact name is required.';
                if (value.trim().length < 2) return 'Must be at least 2 characters.';
                return '';
            case 'emergencyNumber':
                if (!value.trim()) return 'Emergency contact number is required.';
                if (!PH_MOBILE_REGEX.test(value.trim())) return 'Must be 11 digits starting with 09.';
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

    const validate201 = () => {
        const errs: Record<string, string> = {};
        Object.keys(form201).forEach(key => {
            const err = validate201Field(key, form201[key as keyof typeof form201]);
            if (err) errs[key] = err;
        });
        return errs;
    };

    const validatePwField = (key: string, value: string): string => {
        switch (key) {
            case 'current': return !value ? 'Current password is required.' : '';
            case 'next':
                if (!value) return 'New password is required.';
                if (value.length < 15) return 'Must be at least 15 characters.';
                if (value.length > 64) return 'Must not exceed 64 characters.';
                return '';
            case 'confirm':
                if (!value) return 'Please confirm your password.';
                if (value !== pw.next) return 'Passwords do not match.';
                return '';
            default: return '';
        }
    };

    // ── API calls ──
    const handleProfileSave = async () => {
        const errs = validateProfile();
        if (Object.keys(errs).length > 0) { setProfileErrors(errs); return; }
        setProfileSaving(true); setProfileApiError('');
        try {
            const employeeNumber = localStorage.getItem('employeeId') ?? '';
            const formData = new FormData();
            formData.append('firstName', profile.firstName.trim());
            formData.append('middleName', profile.middleName.trim());
            formData.append('lastName', profile.lastName.trim());
            formData.append('suffix', profile.suffix.trim());
            formData.append('contactNumber', profile.contactNumber.trim());
            const res = await fetch(`/api/profile/update-profile?employeeNumber=${encodeURIComponent(employeeNumber)}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).message || 'Profile update failed.'); }
            ['firstName', 'middleName', 'lastName', 'suffix', 'contactNumber'].forEach(k => localStorage.setItem(k, profile[k as keyof typeof profile].trim()));
            setStep('password');
        } catch (err: any) {
            const errMsg = err.message ?? 'Something went wrong.';
            if (errMsg.toLowerCase().includes('contact number')) setProfileErrors(prev => ({ ...prev, contactNumber: errMsg }));
            else setProfileApiError(errMsg);
        } finally { setProfileSaving(false); }
    };

    const handlePasswordSave = async () => {
        const errs: Record<string, string> = {};
        ['current', 'next', 'confirm'].forEach(k => { const err = validatePwField(k, pw[k as keyof typeof pw]); if (err) errs[k] = err; });
        if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }
        setPwSaving(true); setPwApiError('');
        try {
            const res = await fetch('/api/profile/change-password', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).message || 'Password update failed.'); }
            localStorage.setItem('isPasswordChanged', 'true');
            setStep('documents');
        } catch (err: any) { setPwApiError(err.message ?? 'Something went wrong.'); }
        finally { setPwSaving(false); }
    };

    const handleSubmitAndFinish = async () => {
        const files = Object.values(fileObjects);
        if (files.length === 0) { setStep('documents201'); return; }
        setSubmittingDocs(true); setDocsApiError('');
        try {
            const employeeNumber = localStorage.getItem('employeeId') ?? '';
            const formData = new FormData();
            formData.append('employeeNumber', employeeNumber);
            files.forEach(file => formData.append('Attachments', file));
            const res = await fetch(`/api/profile/update-profile?employeeNumber=${encodeURIComponent(employeeNumber)}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).message || 'Failed to upload documents.'); }
            setStep('documents201');
        } catch (err: any) { setDocsApiError(err.message ?? 'Failed to upload documents.'); }
        finally { setSubmittingDocs(false); }
    };

    const handle201Submit = async () => {
        const errs = validate201();
        if (Object.keys(errs).length > 0) { setErrors201(errs); return; }
        setSaving201(true); setApi201Error('');
        try {
            const employeeNumber = localStorage.getItem('employeeId') ?? '';
            const payload = {
                employeeNumber,
                sssNumber: form201.sss.trim(),
                philhealthNumber: form201.philhealth.trim(),
                pagibigNumber: form201.pagibig.trim(),
                tinNumber: form201.tin.trim() || null,
                bankName: form201.bankName.trim(),
                bankAccountNumber: form201.bankAccount.trim(),
                emergencyContactName: form201.emergencyName.trim(),
                emergencyContactNumber: form201.emergencyNumber.trim(),
            };
            const res = await fetch('/api/profile/submit-201-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).message || 'Failed to submit 201 File.'); }
            // Token is invalidated server-side upon successful submission
            setStep('done');
        } catch (err: any) { setApi201Error(err.message ?? 'Something went wrong. Please try again.'); }
        finally { setSaving201(false); }
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
    const pwInputStyle = (err?: string) => ({ ...inputStyle(err), padding: '9px 40px 9px 13px' });

    // ── Inline label component ──
    const FieldLabel = ({ label, required, optional }: { label: string; required?: boolean; optional?: boolean }) => (
        <label style={{ fontSize: 11, fontWeight: 700, color: '#1a2332', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
            {label}{' '}
            {required && <span style={{ color: '#ee5d50' }}>*</span>}
            {optional && <span style={{ fontSize: 10, color: '#8a95b0', textTransform: 'none' as const, fontWeight: 500 }}>(optional)</span>}
        </label>
    );

    const FieldError = ({ msg }: { msg?: string }) => msg ? (
        <span style={{ fontSize: 11, color: '#ee5d50', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{msg}</span>
    ) : null;

    const FieldHint = ({ hint }: { hint: string }) => (
        <span style={{ fontSize: 11, color: '#8a95b0' }}>{hint}</span>
    );

    const BackButton = ({ to, disabled }: { to: Step; disabled?: boolean }) => (
        <button
            type="button"
            onClick={() => setStep(to)}
            disabled={disabled}
            style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: '1.5px solid #e8ecf4', borderRadius: 10,
                padding: '0 16px', height: 44, fontSize: 13, fontWeight: 700,
                color: disabled ? '#cbd5e1' : '#64748b',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', flexShrink: 0,
            }}
            onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = '#c7d2e0'; e.currentTarget.style.color = '#334155'; } }}
            onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = '#e8ecf4'; e.currentTarget.style.color = '#64748b'; } }}
        >
            <ArrowLeft size={14} /> Back
        </button>
    );

    // ── Upload slot renderer ──
    const renderUploadSlot = (key: string, label: string, specs: string, required: boolean) => {
        const fileState = uploadedDocs[key];
        const status = fileState.status;
        let cardStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: 12, cursor: 'pointer', position: 'relative' };
        if (status === 'idle') cardStyle = { ...cardStyle, background: '#f8fafc', border: '1.5px dashed #cbd5e1' };
        else if (status === 'uploading') cardStyle = { ...cardStyle, background: '#f8fafc', border: '1.5px solid #cbd5e1', cursor: 'default' };
        else if (status === 'done') cardStyle = { ...cardStyle, background: 'rgba(5,205,153,0.03)', border: '1.5px solid rgba(5,205,153,0.18)', cursor: 'default' };
        else if (status === 'error') cardStyle = { ...cardStyle, background: 'rgba(238,93,80,0.03)', border: '1.5px solid rgba(238,93,80,0.18)' };

        return (
            <div key={key}>
                <input type="file" id={`file-input-${key}`} style={{ display: 'none' }} onChange={e => { handleFileChange(key, e.target.files?.[0] || null); e.target.value = ''; }} accept={key === 'biodata' ? '.pdf,.docx' : '.pdf,.jpg,.jpeg,.png'} />
                <div className={status === 'idle' || status === 'error' ? 'upload-slot-card' : ''} style={cardStyle} onClick={() => { if (status === 'idle' || status === 'error') document.getElementById(`file-input-${key}`)?.click(); }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 14, background: status === 'done' ? 'rgba(5,205,153,0.08)' : status === 'error' ? 'rgba(238,93,80,0.08)' : 'rgba(67,24,255,0.05)' }}>
                        {status === 'idle' && <Upload size={16} color="#4318ff" />}
                        {status === 'uploading' && <Loader2 size={16} color="#4318ff" className="spin-icon" />}
                        {status === 'done' && <CheckCircle2 size={16} color="#05cd99" />}
                        {status === 'error' && <AlertCircle size={16} color="#ee5d50" />}
                    </div>
                    <div style={{ flexGrow: 1, minWidth: 0, marginRight: 12 }}>
                        {status === 'idle' && (<><div style={{ fontSize: 13, fontWeight: 700, color: '#1a2332', display: 'flex', alignItems: 'center', gap: 3 }}>{label} {required && <span style={{ color: '#ee5d50' }}>*</span>}</div><div style={{ fontSize: 11, color: '#8a95b0', marginTop: 2 }}>{specs}</div></>)}
                        {status === 'uploading' && (<><div style={{ fontSize: 13, fontWeight: 700, color: '#4318ff' }}>Uploading...</div><div style={{ fontSize: 11, color: '#8a95b0', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileState.name} ({fileState.size})</div></>)}
                        {status === 'done' && (<><div style={{ fontSize: 13, fontWeight: 700, color: '#1a2332' }}>{label} {required && <span style={{ color: '#ee5d50' }}>*</span>}</div><div style={{ fontSize: 11, color: '#05cd99', fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={12} /> {fileState.name} ({fileState.size})</div></>)}
                        {status === 'error' && (<><div style={{ fontSize: 13, fontWeight: 700, color: '#1a2332' }}>{label} {required && <span style={{ color: '#ee5d50' }}>*</span>}</div><div style={{ fontSize: 11, color: '#ee5d50', fontWeight: 600, marginTop: 2 }}>{fileState.error || 'Upload failed.'}</div></>)}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                        {status === 'idle' && <span style={{ fontSize: 11, fontWeight: 700, color: '#4318ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Browse</span>}
                        {status === 'done' && (
                            <button type="button" onClick={e => { e.stopPropagation(); handleFileClear(key); }} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: '#8a95b0', display: 'flex', alignItems: 'center', borderRadius: 6 }} onMouseEnter={e => (e.currentTarget.style.color = '#ee5d50')} onMouseLeave={e => (e.currentTarget.style.color = '#8a95b0')}><Trash2 size={15} /></button>
                        )}
                        {status === 'error' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#ee5d50', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>Retry</span>
                                <button type="button" onClick={e => { e.stopPropagation(); handleFileClear(key); }} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: '#8a95b0', display: 'flex', alignItems: 'center', borderRadius: 6 }} onMouseEnter={e => (e.currentTarget.style.color = '#ee5d50')} onMouseLeave={e => (e.currentTarget.style.color = '#8a95b0')}><Trash2 size={15} /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ── Progress bar step labels ──
    const progressLabels = ['Profile Setup', 'Set Password', 'Upload Documents', '201 File'];
    const progressIndex = step === 'profile' ? 0 : step === 'password' ? 1 : step === 'documents' ? 2 : step === 'documents201' ? 3 : -1;

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c1527 0%, #1a2540 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif", padding: '24px 16px' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .spin-icon { animation: spin 1s linear infinite; }
                .upload-slot-card { transition: all 0.2s ease; }
                .upload-slot-card:hover { border-color: #4318ff !important; background-color: #f8fafc !important; }
                select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a95b0' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px !important; }
            `}</style>
            <div style={{ width: '100%', maxWidth: 520 }}>

                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <img src="/src/assets/SpeedexLogo.jpg" alt="Speedex" style={{ height: 40, objectFit: 'contain' }} />
                </div>

                {/* ── Progress bar ── */}
                {step !== 'welcome' && step !== 'done' && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            {progressLabels.map((label, i) => (
                                <span key={label} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: progressIndex >= i ? '#05cd99' : 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                                    {progressIndex > i ? '✓ ' : ''}{label}
                                </span>
                            ))}
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #05cd99, #4318ff)', width: step === 'profile' ? '25%' : step === 'password' ? '50%' : step === 'documents' ? '75%' : '100%', transition: 'width 0.4s ease' }} />
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
                                        { icon: Upload, label: 'Upload onboarding documents', desc: 'Biodata, medical certificate, government ID' },
                                        { icon: CreditCard, label: 'Submit your 201 File', desc: 'Government IDs, bank details, emergency contacts' },
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
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(67,24,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color="#4318ff" /></div>
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
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {(['firstName', 'lastName'] as const).map(key => (
                                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <FieldLabel label={key === 'firstName' ? 'First Name' : 'Last Name'} required />
                                            <input type="text" placeholder={key === 'firstName' ? 'e.g. Juan' : 'e.g. dela Cruz'} value={profile[key]} onChange={e => { const val = e.target.value; setProfile(p => ({ ...p, [key]: val })); setProfileErrors(p => ({ ...p, [key]: validateField(key, val) })); }} maxLength={50} style={inputStyle(profileErrors[key])} />
                                            {profileErrors[key] ? <FieldError msg={profileErrors[key]} /> : <FieldHint hint={key === 'firstName' ? 'Letters, numbers, hyphens, apostrophes only' : 'Letters, hyphens, apostrophes only'} />}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {([{ key: 'middleName', label: 'Middle Name', placeholder: 'e.g. Santos' }, { key: 'suffix', label: 'Suffix', placeholder: 'e.g. Jr., Sr., III' }] as const).map(({ key, label, placeholder }) => (
                                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <FieldLabel label={label} optional />
                                            <input type="text" placeholder={placeholder} value={profile[key]} onChange={e => { const val = e.target.value; setProfile(p => ({ ...p, [key]: val })); setProfileErrors(p => ({ ...p, [key]: validateField(key, val) })); }} maxLength={key === 'suffix' ? 10 : 50} style={inputStyle(profileErrors[key])} />
                                            <FieldError msg={profileErrors[key]} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <FieldLabel label="Contact Number" optional />
                                    <input type="tel" placeholder="e.g. 09123456789" value={profile.contactNumber} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setProfile(p => ({ ...p, contactNumber: val })); setProfileErrors(p => ({ ...p, contactNumber: validateField('contactNumber', val) })); }} maxLength={11} style={inputStyle(profileErrors.contactNumber)} />
                                    {profileErrors.contactNumber ? <FieldError msg={profileErrors.contactNumber} /> : <FieldHint hint="Format: 09XXXXXXXXX (11 digits)" />}
                                </div>
                                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                    <BackButton to="welcome" disabled={profileSaving} />
                                    <button onClick={handleProfileSave} disabled={profileSaving} style={{ flex: 1, height: 44, border: 'none', borderRadius: 10, background: profileSaving ? '#a78bfa' : 'linear-gradient(135deg, #4318ff, #6a5cff)', color: 'white', fontSize: 13, fontWeight: 700, cursor: profileSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                                        {profileSaving ? <><Loader2 size={14} className="spin-icon" /> Saving…</> : <>Save & Continue <ArrowRight size={14} /></>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PASSWORD ── */}
                    {step === 'password' && (
                        <div>
                            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #edf2f7' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(67,24,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={16} color="#4318ff" /></div>
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
                                {[
                                    { key: 'current', label: 'Current Password', show: showCurrent, setShow: setShowCurrent, placeholder: 'Enter your current password' },
                                    { key: 'next', label: 'New Password', show: showNext, setShow: setShowNext, placeholder: 'At least 15 characters' },
                                    { key: 'confirm', label: 'Confirm Password', show: showConfirm, setShow: setShowConfirm, placeholder: 'Re-enter your password' },
                                ].map(({ key, label, show, setShow, placeholder }) => (
                                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                        <FieldLabel label={label} required />
                                        <div style={{ position: 'relative' }}>
                                            <input type={show ? 'text' : 'password'} placeholder={placeholder} value={pw[key as keyof typeof pw]} onChange={e => { const val = e.target.value; setPw(p => ({ ...p, [key]: val })); setPwErrors(p => ({ ...p, [key]: validatePwField(key, val), ...(key === 'next' && pw.confirm ? { confirm: pw.confirm !== val ? 'Passwords do not match.' : '' } : {}) })); }} maxLength={key === 'current' ? undefined : 64} style={pwInputStyle(pwErrors[key])} />
                                            <button type="button" onClick={() => setShow((p: boolean) => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a95b0' }}>
                                                {show ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        {key === 'next' && pw.next.length > 0 && (
                                            <div>
                                                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                                    {[1, 2, 3].map(l => <div key={l} style={{ flex: 1, height: 4, borderRadius: 2, background: pwStrength >= l ? pwStrengthColor[pwStrength] : '#e8ecf4', transition: 'background 0.2s' }} />)}
                                                </div>
                                                <span style={{ fontSize: 11, color: pwStrengthColor[pwStrength], marginTop: 3, display: 'block', fontWeight: 600 }}>{pwStrengthLabel[pwStrength]}</span>
                                            </div>
                                        )}
                                        {key === 'confirm' && pw.confirm.length > 0 && !pwErrors.confirm && <span style={{ fontSize: 11, color: '#05cd99', fontWeight: 600 }}>✓ Passwords match</span>}
                                        <FieldError msg={pwErrors[key]} />
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                    <BackButton to="profile" disabled={pwSaving} />
                                    <button onClick={handlePasswordSave} disabled={pwSaving} style={{ flex: 1, height: 44, border: 'none', borderRadius: 10, background: pwSaving ? '#a78bfa' : 'linear-gradient(135deg, #4318ff, #6a5cff)', color: 'white', fontSize: 13, fontWeight: 700, cursor: pwSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                                        {pwSaving ? <><Loader2 size={14} className="spin-icon" /> Saving…</> : <>Set Password & Continue <ArrowRight size={14} /></>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── UPLOAD DOCUMENTS ── */}
                    {step === 'documents' && (
                        <div>
                            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #edf2f7' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(67,24,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload size={16} color="#4318ff" /></div>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Upload Documents</h3>
                                </div>
                                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', marginLeft: 42 }}>Please upload the required personal files to complete your onboarding.</p>
                            </div>
                            <div style={{ padding: '24px 32px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Required Documents <span style={{ color: '#ee5d50' }}>*</span></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {renderUploadSlot('biodata', 'Biodata / Resume', 'PDF or DOCX up to 10MB', true)}
                                        {renderUploadSlot('medical', 'Medical Certificate', 'PDF, JPG, or PNG up to 10MB', true)}
                                        {renderUploadSlot('govId', 'Government-issued ID', 'JPG, PNG, or PDF up to 10MB', true)}
                                    </div>
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Optional Documents</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {renderUploadSlot('nbi', 'NBI / Police Clearance', 'JPG, PNG, or PDF up to 10MB', false)}
                                        {renderUploadSlot('education', 'Educational Documents', 'PDF, JPG, or PNG up to 10MB', false)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'rgba(67,24,255,0.05)', border: '1px solid rgba(67,24,255,0.1)', borderRadius: 10, marginTop: 8, alignItems: 'flex-start' }}>
                                    <ShieldCheck size={18} color="#4318ff" style={{ flexShrink: 0, marginTop: 1 }} />
                                    <span style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.4 }}>Your files are encrypted and securely stored. Only authorized HR personnel can access them.</span>
                                </div>
                                {docsApiError && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(238,93,80,0.08)', border: '1px solid rgba(238,93,80,0.2)', borderRadius: 8, fontSize: 13, color: '#ee5d50' }}>
                                        <AlertCircle size={14} />{docsApiError}
                                    </div>
                                )}
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <BackButton to="password" disabled={submittingDocs} />
                                        <button onClick={() => setStep('documents201')} disabled={submittingDocs} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: submittingDocs ? 'not-allowed' : 'pointer', fontFamily: 'inherit', padding: '8px 4px', whiteSpace: 'nowrap' }} onMouseEnter={e => { if (!submittingDocs) e.currentTarget.style.color = '#334155'; }} onMouseLeave={e => { if (!submittingDocs) e.currentTarget.style.color = '#64748b'; }}>
                                            Skip for now
                                        </button>
                                        <button disabled={isSubmitDisabled || submittingDocs} onClick={handleSubmitAndFinish} style={{ flex: 1, height: 44, border: 'none', borderRadius: 10, background: (isSubmitDisabled || submittingDocs) ? '#cbd5e1' : 'linear-gradient(135deg, #4318ff, #6a5cff)', color: (isSubmitDisabled || submittingDocs) ? '#94a3b8' : 'white', fontSize: 13, fontWeight: 700, cursor: (isSubmitDisabled || submittingDocs) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', boxShadow: (isSubmitDisabled || submittingDocs) ? 'none' : '0 8px 20px rgba(67,24,255,0.25)', transition: 'all 0.2s ease' }}>
                                            {submittingDocs ? <><Loader2 size={14} className="spin-icon" /> Uploading…</> : <>Upload & Continue <ArrowRight size={14} /></>}
                                        </button>
                                    </div>
                                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                                        {pendingRequiredCount > 0
                                            ? <span style={{ fontSize: 11, color: '#ee5d50', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> {pendingRequiredCount} required {pendingRequiredCount === 1 ? 'document' : 'documents'} still pending</span>
                                            : <span style={{ fontSize: 11, color: '#05cd99', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} /> All required documents uploaded</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── 201 FILE FORM ── */}
                    {step === 'documents201' && (
                        <div>
                            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #edf2f7' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(67,24,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CreditCard size={16} color="#4318ff" /></div>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Official Employee 201 File</h3>
                                </div>
                                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', marginLeft: 42 }}>Provide your government IDs, bank details, and emergency contact. This information is strictly confidential.</p>
                            </div>

                            <div style={{ padding: '24px 32px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                                {api201Error && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(238,93,80,0.08)', border: '1px solid rgba(238,93,80,0.2)', borderRadius: 8, fontSize: 13, color: '#ee5d50' }}>
                                        <AlertCircle size={14} />{api201Error}
                                    </div>
                                )}

                                {/* ── Government IDs section ── */}
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                                        Government IDs
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                                        {/* SSS */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <FieldLabel label="SSS Number" required />
                                            <input
                                                type="text"
                                                placeholder="XX-XXXXXXX-X"
                                                value={form201.sss}
                                                onChange={e => {
                                                    const val = applySSS(e.target.value);
                                                    setForm201(p => ({ ...p, sss: val }));
                                                    setErrors201(p => ({ ...p, sss: validate201Field('sss', val) }));
                                                }}
                                                maxLength={12}
                                                style={inputStyle(errors201.sss)}
                                            />
                                            {errors201.sss ? <FieldError msg={errors201.sss} /> : <FieldHint hint="Format: XX-XXXXXXX-X (e.g. 34-5678901-2)" />}
                                        </div>

                                        {/* PhilHealth */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <FieldLabel label="PhilHealth Number" required />
                                            <input
                                                type="text"
                                                placeholder="XX-XXXXXXXXX-X"
                                                value={form201.philhealth}
                                                onChange={e => {
                                                    const val = applyPhilHealth(e.target.value);
                                                    setForm201(p => ({ ...p, philhealth: val }));
                                                    setErrors201(p => ({ ...p, philhealth: validate201Field('philhealth', val) }));
                                                }}
                                                maxLength={14}
                                                style={inputStyle(errors201.philhealth)}
                                            />
                                            {errors201.philhealth ? <FieldError msg={errors201.philhealth} /> : <FieldHint hint="Format: XX-XXXXXXXXX-X (e.g. 01-234567890-1)" />}
                                        </div>

                                        {/* Pag-IBIG */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <FieldLabel label="Pag-IBIG Number (HDMF)" required />
                                            <input
                                                type="text"
                                                placeholder="XXXX-XXXX-XXXX"
                                                value={form201.pagibig}
                                                onChange={e => {
                                                    const val = applyPagIBIG(e.target.value);
                                                    setForm201(p => ({ ...p, pagibig: val }));
                                                    setErrors201(p => ({ ...p, pagibig: validate201Field('pagibig', val) }));
                                                }}
                                                maxLength={14}
                                                style={inputStyle(errors201.pagibig)}
                                            />
                                            {errors201.pagibig ? <FieldError msg={errors201.pagibig} /> : <FieldHint hint="Format: XXXX-XXXX-XXXX (e.g. 1234-5678-9012)" />}
                                        </div>

                                        {/* TIN (optional) */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <FieldLabel label="Tax Identification Number (TIN)" optional />
                                            <input
                                                type="text"
                                                placeholder="XXX-XXX-XXX-XXX"
                                                value={form201.tin}
                                                onChange={e => {
                                                    const val = applyTIN(e.target.value);
                                                    setForm201(p => ({ ...p, tin: val }));
                                                    setErrors201(p => ({ ...p, tin: validate201Field('tin', val) }));
                                                }}
                                                maxLength={15}
                                                style={inputStyle(errors201.tin)}
                                            />
                                            {errors201.tin ? <FieldError msg={errors201.tin} /> : <FieldHint hint="Format: XXX-XXX-XXX-XXX (e.g. 123-456-789-000)" />}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Bank Details section ── */}
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                                        Bank Account Details
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                                        {/* Bank Name */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <FieldLabel label="Bank Name" required />
                                            <select
                                                value={form201.bankName}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setForm201(p => ({ ...p, bankName: val }));
                                                    setErrors201(p => ({ ...p, bankName: validate201Field('bankName', val) }));
                                                }}
                                                style={{ ...inputStyle(errors201.bankName), cursor: 'pointer', color: form201.bankName ? '#1a2332' : '#9aa5b4' }}
                                            >
                                                <option value="" disabled>Select your bank</option>
                                                {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                            <FieldError msg={errors201.bankName} />
                                        </div>

                                        {/* Bank Account Number */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <FieldLabel label="Bank Account Number" required />
                                            <input
                                                type="text"
                                                placeholder="Numeric account number"
                                                value={form201.bankAccount}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setForm201(p => ({ ...p, bankAccount: val }));
                                                    setErrors201(p => ({ ...p, bankAccount: validate201Field('bankAccount', val) }));
                                                }}
                                                maxLength={20}
                                                style={inputStyle(errors201.bankAccount)}
                                            />
                                            {errors201.bankAccount ? <FieldError msg={errors201.bankAccount} /> : <FieldHint hint="Numbers only — no spaces or dashes" />}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Emergency Contact section ── */}
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                                        Emergency Contact
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                                        {/* Emergency Contact Name */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <FieldLabel label="Contact Name" required />
                                            <input
                                                type="text"
                                                placeholder="Full name of emergency contact"
                                                value={form201.emergencyName}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setForm201(p => ({ ...p, emergencyName: val }));
                                                    setErrors201(p => ({ ...p, emergencyName: validate201Field('emergencyName', val) }));
                                                }}
                                                maxLength={80}
                                                style={inputStyle(errors201.emergencyName)}
                                            />
                                            <FieldError msg={errors201.emergencyName} />
                                        </div>

                                        {/* Emergency Contact Number */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <FieldLabel label="Contact Number" required />
                                            <div style={{ position: 'relative' }}>
                                                <Phone size={14} color="#8a95b0" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                                                <input
                                                    type="tel"
                                                    placeholder="09XXXXXXXXX"
                                                    value={form201.emergencyNumber}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setForm201(p => ({ ...p, emergencyNumber: val }));
                                                        setErrors201(p => ({ ...p, emergencyNumber: validate201Field('emergencyNumber', val) }));
                                                    }}
                                                    maxLength={11}
                                                    style={{ ...inputStyle(errors201.emergencyNumber), paddingLeft: 34 }}
                                                />
                                            </div>
                                            {errors201.emergencyNumber ? <FieldError msg={errors201.emergencyNumber} /> : <FieldHint hint="Format: 09XXXXXXXXX (11 digits)" />}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Security notice ── */}
                                <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'rgba(5,205,153,0.05)', border: '1px solid rgba(5,205,153,0.15)', borderRadius: 10, alignItems: 'flex-start' }}>
                                    <ShieldCheck size={18} color="#05cd99" style={{ flexShrink: 0, marginTop: 1 }} />
                                    <span style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.5 }}>
                                        All sensitive data is <strong>end-to-end encrypted</strong> before storage. This form can only be submitted once — the link will be permanently deactivated after submission.
                                    </span>
                                </div>

                                {/* ── Submit ── */}
                                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                    <BackButton to="documents" disabled={saving201} />
                                    <button
                                        onClick={handle201Submit}
                                        disabled={saving201}
                                        style={{ flex: 1, height: 46, border: 'none', borderRadius: 10, background: saving201 ? '#a78bfa' : 'linear-gradient(135deg, #4318ff, #6a5cff)', color: 'white', fontSize: 13, fontWeight: 700, cursor: saving201 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', boxShadow: saving201 ? 'none' : '0 8px 24px rgba(67,24,255,0.3)' }}
                                    >
                                        {saving201 ? <><Loader2 size={14} className="spin-icon" /> Encrypting & Submitting…</> : <>Submit 201 File <ArrowRight size={14} /></>}
                                    </button>
                                </div>
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
                            <p style={{ fontSize: 13, color: '#8a95b0', margin: '0 0 8px', lineHeight: 1.6 }}>Form submitted successfully. Welcome aboard!</p>
                            <p style={{ fontSize: 12, color: '#c3cad9', margin: '0 0 28px', lineHeight: 1.6 }}>Your 201 File has been securely encrypted and submitted to HR. This onboarding link has been permanently deactivated.</p>
                            <button onClick={() => {
                                const role = localStorage.getItem('userRole');
                                const routes: Record<string, string> = { 'System Admin': '/SystemAdmin_Dashboard', 'SuperAdmin': '/SystemAdmin_Dashboard', 'Operation Admin': '/OpAdmin_Dashboard', 'OpAdmin': '/OpAdmin_Dashboard', 'Coordinator': '/OpEmployee_Dashboard', 'Encoder': '/OpEmployee_Dashboard' };
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