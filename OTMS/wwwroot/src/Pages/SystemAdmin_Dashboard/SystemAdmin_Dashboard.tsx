import { useEffect, useState, useRef } from 'react';
import {
    Users,
    ClipboardList,
    CheckCircle2,
    AlertCircle,
    Package,
    LayoutDashboard,
    Truck,
    BarChart3,
    UserCircle2,
    X,
    Save,
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Search,
    Phone,
    Shield,
    Hash,
    ChevronLeft,
    ChevronRight,
    Lock,
    Eye,
    EyeOff,
    Clock,
    CalendarRange,
    CalendarDays,
    Filter,
    Copy,
    ShieldAlert,
    LogOut,
    Settings,
    Activity,
    FileText,
} from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './SystemAdmin_Dashboard.css';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../../components/NotificationBell/NotificationBell';
import { useToast } from '../../components/Toast/Toast';
import EmployeeDetailPanel from './EmployeeDetailPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavTab =
    | 'dashboard'
    | 'employees'
    | 'delivery'
    | 'analytics'
    | 'settings'
    | 'activity_logs'
    | 'emergency_override'
    | 'profile';

interface EmployeeRegisterDTO {
    employeeNumber: string;
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    contactNumber: string;
    role: string;
    email: string;
}

interface FieldError {
    employeeNumber?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    suffix?: string;
    contactNumber?: string;
    role?: string;
    email?: string;
}

type FormState = EmployeeRegisterDTO;

interface ActivityLog {
    id: number;
    description: string;
    timestamp: string;
}

interface RecentEmployee {
    employeeNumber: string;
    employeeName: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    suffix?: string;
    contactNumber: string;
    role: string;
    accountStatus: string;
    presenceStatus?: string;
}

type LeaveType = 'vacation' | 'sick' | 'emergency' | 'personal' | 'maternity' | 'other';
type LeaveStatus = 'pending' | 'approved' | 'declined';

interface LeaveRequest {
    id: number;
    employeeNumber: string;
    employeeName: string;
    role: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveStatus;
    submittedAt: string;
    reviewedBy?: string;
    reviewNote?: string;
}

type OverrideStatus = 'Pending' | 'Approved' | 'Rejected';

interface EmergencyOverride {
    emergencyOverrideId: string;
    requestedById: string;
    employeeName: string;
    employeeNumber: string;
    leaveId: string;
    status: OverrideStatus;
    reason: string;
    requestedAt: string;
    approvedAt?: string;
    overrideUntil?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
    'System Admin',
    'Operation Admin',
    'Operation Team',
    'Coordinator',
    'Delivery Driver',
    'Encoder',
];

const PAGE_SIZE = 10;

const NAV_GROUPS = [
    {
        label: 'MAIN MENU',
        items: [
            { tab: 'dashboard' as NavTab, icon: LayoutDashboard, label: 'Dashboard' },
            { tab: 'employees' as NavTab, icon: Users, label: 'Employees' },
            { tab: 'emergency_override' as NavTab, icon: FileText, label: 'Emergency Override' },
        ],
    },
    {
        label: 'INTEGRATION',
        items: [
            { tab: 'delivery' as NavTab, icon: FileText, label: 'Delivery Summary' },
            { tab: 'analytics' as NavTab, icon: BarChart3, label: 'Analytics View' },
        ],
    },
    {
        label: 'SYSTEM',
        items: [
            { tab: 'settings' as NavTab, icon: Settings, label: 'Settings' },
            { tab: 'activity_logs' as NavTab, icon: Activity, label: 'Activity Logs' },
        ],
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildDisplayName = (
    firstName: string,
    middleName: string,
    lastName: string,
    suffix: string
): string => {
    return [firstName, middleName, lastName, suffix]
        .map(s => s.trim())
        .filter(Boolean)
        .join(' ');
};

const getEmployeeDisplayName = (emp: RecentEmployee): string => {
    if (emp.firstName || emp.lastName) {
        return buildDisplayName(
            emp.firstName ?? '',
            emp.middleName ?? '',
            emp.lastName ?? '',
            emp.suffix ?? ''
        );
    }
    return emp.employeeName ?? '';
};

const EMPTY_FORM: FormState = {
    employeeNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    contactNumber: '',
    role: '',
    email: '',
};

const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-.]+$/;

function validate(form: FormState): FieldError {
    const errs: FieldError = {};
    const firstName = form.firstName.trim();
    if (!firstName) { errs.firstName = 'First name is required.'; }
    else if (firstName.length < 2) { errs.firstName = 'First name must be at least 2 characters.'; }
    else if (firstName.length > 50) { errs.firstName = 'First name must not exceed 50 characters.'; }
    else if (!NAME_REGEX.test(firstName)) { errs.firstName = 'First name contains invalid characters.'; }

    const middleName = form.middleName.trim();
    if (middleName) {
        if (middleName.length > 50) { errs.middleName = 'Middle name must not exceed 50 characters.'; }
        else if (!NAME_REGEX.test(middleName)) { errs.middleName = 'Middle name contains invalid characters.'; }
    }

    const lastName = form.lastName.trim();
    if (!lastName) { errs.lastName = 'Last name is required.'; }
    else if (lastName.length < 2) { errs.lastName = 'Last name must be at least 2 characters.'; }
    else if (lastName.length > 50) { errs.lastName = 'Last name must not exceed 50 characters.'; }
    else if (!NAME_REGEX.test(lastName)) { errs.lastName = 'Last name contains invalid characters.'; }

    const suffix = form.suffix.trim();
    if (suffix && suffix.length > 10) { errs.suffix = 'Suffix must not exceed 10 characters.'; }

    const contact = form.contactNumber.trim();
    if (!contact) { errs.contactNumber = 'Contact number is required.'; }
    else if (!/^\d+$/.test(contact)) { errs.contactNumber = 'Contact number must contain digits only.'; }
    else if (contact.length !== 11) { errs.contactNumber = `Must be exactly 11 digits (currently ${contact.length}).`; }
    else if (!/^09\d{9}$/.test(contact)) { errs.contactNumber = 'Must start with 09 (e.g. 09123456789).'; }

    if (!form.role) { errs.role = 'Please select a role.'; }
    else if (!ROLES.includes(form.role)) { errs.role = 'Selected role is not valid.'; }

    const email = form.email.trim();
    if (!email) { errs.email = 'Email address is required.'; }
    else if (email.length > 100) { errs.email = 'Email must not exceed 100 characters.'; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { errs.email = 'Enter a valid email address.'; }

    return errs;
}

const toBackendRole = (role: string) => role.replace(/\s+/g, '');
const toDisplayRole = (role: string) => role.replace(/([a-z])([A-Z])/g, '$1 $2');

const fmtDate = (d: string): string => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const calcDays = (start: string, end: string): number =>
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
    vacation: 'Vacation',
    sick: 'Sick Leave',
    emergency: 'Emergency',
    personal: 'Personal',
    maternity: 'Maternity/Paternity',
    other: 'Other',
};

const LEAVE_STATUS_META: Record<LeaveStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    pending: { label: 'Pending', cls: 'badge-amber', icon: <Clock size={12} /> },
    approved: { label: 'Approved', cls: 'badge-green', icon: <CheckCircle2 size={12} /> },
    declined: { label: 'Declined', cls: 'badge-red', icon: <X size={12} /> },
};

const getInitials = (name: string): string => {
    if (!name) return 'SA';
    const cleanName = name.trim();
    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
};

// ─── Shared Pagination Helper ─────────────────────────────────────────────────

function getPageNumbers(total: number, current: number): (number | '...')[] {
    const pages: (number | '...')[] = [];
    if (total <= 5) {
        for (let i = 1; i <= total; i++) pages.push(i);
    } else {
        pages.push(1);
        if (current > 3) pages.push('...');
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (current < total - 2) pages.push('...');
        pages.push(total);
    }
    return pages;
}

// ─── Add Employee Modal ───────────────────────────────────────────────────────

interface AddEmployeeModalProps {
    onClose: () => void;
    onSuccess: (employee: RecentEmployee) => void;
}

function AddEmployeeModal({ onClose, onSuccess }: AddEmployeeModalProps) {
    const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
    const [errors, setErrors] = useState<FieldError>({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');
    const [successData, setSuccessData] = useState<{ employeeNumber: string } | null>(null);
    const [empNumLoading, setEmpNumLoading] = useState(true);
    const [empNumError, setEmpNumError] = useState('');
    const { success } = useToast();

    useEffect(() => {
        const generateEmployeeNumber = async () => {
            setEmpNumLoading(true);
            setEmpNumError('');
            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch('/api/systemadmin/recent-employees?PageNumber=1&PageSize=1000', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const result = await res.json();
                const employees: { employeeNumber: string }[] = Array.isArray(result.data) ? result.data : [];
                const usedNumbers = new Set(
                    employees
                        .map(e => { const num = parseInt(e.employeeNumber, 10); return isNaN(num) ? null : num; })
                        .filter((n): n is number => n !== null)
                );
                let next = 1;
                while (usedNumbers.has(next)) next++;
                setForm(prev => ({ ...prev, employeeNumber: String(next).padStart(4, '0') }));
            } catch {
                setEmpNumError('Could not generate employee number. Please try again.');
            } finally {
                setEmpNumLoading(false);
            }
        };
        generateEmployeeNumber();
    }, []);

    const validateField = (key: keyof FormState, value: string): string => {
        switch (key) {
            case 'firstName': { const v = value.trim(); if (!v) return 'First name is required.'; if (v.length < 2) return 'Must be at least 2 characters.'; if (v.length > 50) return 'Must not exceed 50 characters.'; if (!NAME_REGEX.test(v)) return 'Contains invalid characters.'; return ''; }
            case 'middleName': { const v = value.trim(); if (!v) return ''; if (v.length > 50) return 'Must not exceed 50 characters.'; if (!NAME_REGEX.test(v)) return 'Contains invalid characters.'; return ''; }
            case 'lastName': { const v = value.trim(); if (!v) return 'Last name is required.'; if (v.length < 2) return 'Must be at least 2 characters.'; if (v.length > 50) return 'Must not exceed 50 characters.'; if (!NAME_REGEX.test(v)) return 'Contains invalid characters.'; return ''; }
            case 'suffix': { const v = value.trim(); if (!v) return ''; if (v.length > 10) return 'Must not exceed 10 characters.'; return ''; }
            case 'contactNumber': { const c = value.trim(); if (!c) return 'Contact number is required.'; if (!/^\d+$/.test(c)) return 'Digits only.'; if (c.length !== 11) return `Must be exactly 11 digits (currently ${c.length}).`; if (!/^09\d{9}$/.test(c)) return 'Must start with 09.'; return ''; }
            case 'role': { if (!value) return 'Please select a role.'; if (!ROLES.includes(value)) return 'Selected role is not valid.'; return ''; }
            case 'email': { const e = value.trim(); if (!e) return 'Email address is required.'; if (e.length > 100) return 'Email must not exceed 100 characters.'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return 'Enter a valid email address.'; return ''; }
            default: return '';
        }
    };

    const handleChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value;
        setForm(prev => ({ ...prev, [key]: value }));
        setApiError('');
        const errMsg = validateField(key, value);
        setErrors(prev => ({ ...prev, [key]: errMsg || undefined }));
    };

    const handleSubmit = async () => {
        if (submitting || empNumLoading || !form.employeeNumber) return;
        const errs = validate(form);
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setSubmitting(true);
        setApiError('');
        try {
            const token = localStorage.getItem('authToken');
            const payload: EmployeeRegisterDTO = {
                employeeNumber: form.employeeNumber,
                firstName: form.firstName.trim(),
                middleName: form.middleName.trim(),
                lastName: form.lastName.trim(),
                suffix: form.suffix.trim(),
                contactNumber: form.contactNumber.trim(),
                role: toBackendRole(form.role),
                email: form.email.trim(),
            };
            const res = await fetch('/api/authorization/systemadmin/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${res.status}: Registration failed`);
            }
            const data = await res.json();
            const displayName = buildDisplayName(form.firstName, form.middleName, form.lastName, form.suffix);
            setSuccessData({ employeeNumber: data.employeeNumber });
            success('Employee registered successfully!');
            onSuccess({
                employeeNumber: data.employeeNumber,
                employeeName: data.employeeName ?? displayName,
                firstName: form.firstName.trim(),
                middleName: form.middleName.trim(),
                lastName: form.lastName.trim(),
                suffix: form.suffix.trim(),
                contactNumber: payload.contactNumber,
                role: data.role,
                accountStatus: 'Active',
            });
        } catch (err: any) {
            setApiError(err.message ?? 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const previewName = buildDisplayName(form.firstName, form.middleName, form.lastName, form.suffix);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3>Add New Employee</h3>
                        <p className="modal-subtitle">Fill in the details to register a new employee account.</p>
                    </div>
                    <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
                </div>
                {apiError && <div className="form-api-error"><AlertCircle size={14} /><span>{apiError}</span></div>}
                <div className="modal-form">
                    <p className="modal-section-label">Account info</p>
                    <div className="field-row">
                        <div className="field">
                            <label htmlFor="emp-number">Employee Number <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, background: 'rgba(67,24,255,0.1)', color: 'var(--primary)', padding: '2px 7px', borderRadius: 999, verticalAlign: 'middle' }}>AUTO</span></label>
                            <div style={{ position: 'relative' }}>
                                <input id="emp-number" type="text" value={empNumLoading ? '' : form.employeeNumber} readOnly placeholder={empNumLoading ? 'Generating…' : ''} style={{ background: 'var(--bg-secondary, #f8f9fc)', color: empNumLoading ? 'var(--text-secondary)' : 'var(--text-primary)', cursor: 'not-allowed', fontWeight: 600, letterSpacing: '0.5px', paddingRight: 36, border: empNumError ? '1px solid var(--danger)' : '1px solid var(--border)' }} />
                                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: empNumLoading ? 'var(--text-secondary)' : '#05cd99' }}>
                                    {empNumLoading ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />}
                                </span>
                            </div>
                            {empNumError ? <span className="field-error"><AlertCircle size={12} />{empNumError}</span> : !empNumLoading && <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>Assigned automatically. Cannot be changed.</span>}
                        </div>
                        <div className="field">
                            <label htmlFor="emp-role">Role <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <select id="emp-role" value={form.role} onChange={handleChange('role')} className={errors.role ? 'input-error' : ''}>
                                <option value="">Select a role</option>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {errors.role && <span className="field-error"><AlertCircle size={12} />{errors.role}</span>}
                        </div>
                    </div>
                    <p className="modal-section-label" style={{ marginTop: 8 }}>Personal info</p>
                    {previewName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(67,24,255,0.05)', border: '1px solid rgba(67,24,255,0.15)', borderRadius: 8, padding: '7px 12px', marginBottom: 10, fontSize: 13 }}>
                            <UserCircle2 size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-secondary)' }}>Preview:</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{previewName}</strong>
                        </div>
                    )}
                    <div className="field-row">
                        <div className="field">
                            <label htmlFor="emp-firstname">First Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input id="emp-firstname" type="text" placeholder="e.g. Juan" value={form.firstName} onChange={handleChange('firstName')} className={errors.firstName ? 'input-error' : form.firstName.trim().length >= 2 && !errors.firstName ? 'input-success' : ''} maxLength={50} />
                            {errors.firstName ? <span className="field-error"><AlertCircle size={12} />{errors.firstName}</span> : form.firstName.trim() && !errors.firstName && <span style={{ fontSize: 11, color: '#05cd99', marginTop: 3, display: 'block' }}>✓ Looks good</span>}
                        </div>
                        <div className="field">
                            <label htmlFor="emp-lastname">Last Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input id="emp-lastname" type="text" placeholder="e.g. dela Cruz" value={form.lastName} onChange={handleChange('lastName')} className={errors.lastName ? 'input-error' : form.lastName.trim().length >= 2 && !errors.lastName ? 'input-success' : ''} maxLength={50} />
                            {errors.lastName ? <span className="field-error"><AlertCircle size={12} />{errors.lastName}</span> : form.lastName.trim() && !errors.lastName && <span style={{ fontSize: 11, color: '#05cd99', marginTop: 3, display: 'block' }}>✓ Looks good</span>}
                        </div>
                    </div>
                    <div className="field-row">
                        <div className="field">
                            <label htmlFor="emp-middlename">Middle Name <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, background: 'rgba(163,174,208,0.2)', color: 'var(--text-secondary)', padding: '2px 7px', borderRadius: 999, verticalAlign: 'middle' }}>OPTIONAL</span></label>
                            <input id="emp-middlename" type="text" placeholder="e.g. Santos" value={form.middleName} onChange={handleChange('middleName')} className={errors.middleName ? 'input-error' : ''} maxLength={50} />
                            {errors.middleName ? <span className="field-error"><AlertCircle size={12} />{errors.middleName}</span> : <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>Leave blank if none</span>}
                        </div>
                        <div className="field">
                            <label htmlFor="emp-suffix">Suffix <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, background: 'rgba(163,174,208,0.2)', color: 'var(--text-secondary)', padding: '2px 7px', borderRadius: 999, verticalAlign: 'middle' }}>OPTIONAL</span></label>
                            <input id="emp-suffix" type="text" placeholder="e.g. Jr., Sr., III" value={form.suffix} onChange={handleChange('suffix')} className={errors.suffix ? 'input-error' : ''} maxLength={10} />
                            {errors.suffix ? <span className="field-error"><AlertCircle size={12} />{errors.suffix}</span> : <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>Leave blank if none</span>}
                        </div>
                    </div>
                    <div className="field-row">
                        <div className="field">
                            <label htmlFor="emp-contact">Contact Number <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input id="emp-contact" type="tel" placeholder="e.g. 09123456789" value={form.contactNumber} onChange={e => { const d = e.target.value.replace(/\D/g, ''); setForm(prev => ({ ...prev, contactNumber: d })); setApiError(''); setErrors(prev => ({ ...prev, contactNumber: validateField('contactNumber', d) || undefined })); }} className={errors.contactNumber ? 'input-error' : form.contactNumber.length === 11 && /^09\d{9}$/.test(form.contactNumber) ? 'input-success' : ''} maxLength={11} />
                            {errors.contactNumber ? <span className="field-error"><AlertCircle size={12} />{errors.contactNumber}</span> : form.contactNumber.length > 0 ? <span style={{ fontSize: 11, marginTop: 3, display: 'block', color: form.contactNumber.length === 11 ? '#05cd99' : 'var(--text-secondary)' }}>{form.contactNumber.length}/11 digits{form.contactNumber.length === 11 && ' ✓'}</span> : <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>Format: 09XXXXXXXXX (11 digits)</span>}
                        </div>
                        <div className="field">
                            <label htmlFor="emp-email">Email Address <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input id="emp-email" type="email" placeholder="e.g. juan@speedex.com" value={form.email} onChange={handleChange('email')} className={errors.email ? 'input-error' : ''} maxLength={100} autoComplete="off" />
                            {errors.email ? <span className="field-error"><AlertCircle size={12} />{errors.email}</span> : form.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()) && <span style={{ fontSize: 11, color: '#05cd99', marginTop: 3, display: 'block' }}>✓ Valid email</span>}
                        </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, marginTop: -6 }}><AlertCircle size={11} />A verification link will be sent to this address after registration.</p>
                </div>
                <div className="modal-actions">
                    <button className="btn" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || empNumLoading || !!empNumError}>
                        {submitting ? <><Loader2 size={13} className="spin" /> Registering…</> : <><Save size={13} /> Register Employee</>}
                    </button>
                </div>
            </div>
            {successData && (
                <div className="modal-overlay" onClick={() => { setSuccessData(null); onClose(); }}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, padding: '8px 0 20px' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(5,205,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={28} color="#05cd99" /></div>
                            <div><h3 style={{ margin: 0 }}>Employee registered</h3><p className="modal-subtitle">Account has been created successfully.</p></div>
                        </div>
                        <div style={{ background: 'var(--bg-secondary, #f8f9fc)', borderRadius: 10, border: '1px solid var(--border)', padding: '12px 16px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>Employee number</span><strong>{successData.employeeNumber}</strong></div>
                            <div style={{ height: 1, background: 'var(--border)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>Full name</span><strong>{previewName}</strong></div>
                            <div style={{ height: 1, background: 'var(--border)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>Email</span><span style={{ fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-all', textAlign: 'right', maxWidth: 220 }}>{form.email.trim()}</span></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, background: 'rgba(5,205,153,0.08)', border: '1px solid rgba(5,205,153,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13 }}>
                            <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} color="#05cd99" />
                            <span style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>Login credentials have been sent to <strong>{form.email.trim()}</strong>. Ask the employee to check their inbox to activate their account.</span>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setSuccessData(null); onClose(); }}>Done</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Employee Details Modal ───────────────────────────────────────────────────

interface EmployeeDetailModalProps {
    employee: RecentEmployee;
    onClose: () => void;
    onUpdated: (updated: RecentEmployee) => void;
}

function EmployeeDetailModal({ employee, onClose, onUpdated }: EmployeeDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ firstName: employee.firstName ?? '', middleName: employee.middleName ?? '', lastName: employee.lastName ?? '', suffix: employee.suffix ?? '', contactNumber: employee.contactNumber, role: toDisplayRole(employee.role), accountStatus: employee.accountStatus });
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');
    const displayName = getEmployeeDisplayName(employee);

    const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setForm(prev => ({ ...prev, [key]: e.target.value })); setApiError(''); };

    const handleSave = async () => {
        setSubmitting(true); setApiError('');
        try {
            const token = localStorage.getItem('authToken');
            const builtName = buildDisplayName(form.firstName, form.middleName, form.lastName, form.suffix);
            const updateRes = await fetch(`/api/profile/update-profile?employeeNumber=${encodeURIComponent(employee.employeeNumber)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ employeeNumber: employee.employeeNumber, firstName: form.firstName.trim(), middleName: form.middleName.trim(), lastName: form.lastName.trim(), suffix: form.suffix.trim(), contactNumber: form.contactNumber }) });
            if (!updateRes.ok) { const err = await updateRes.json().catch(() => ({})); throw new Error(err.message || `Error ${updateRes.status}: Update failed`); }
            if (toBackendRole(form.role) !== employee.role) {
                const roleRes = await fetch('/api/systemadmin/assign-role', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ employeeNumber: employee.employeeNumber, roleName: toBackendRole(form.role) }) });
                if (!roleRes.ok) { const err = await roleRes.json().catch(() => ({})); throw new Error(err.message || `Error ${roleRes.status}: Role update failed`); }
            }
            if (form.accountStatus !== employee.accountStatus) {
                const statusEndpoint = form.accountStatus === 'Active' ? '/api/systemadmin/activate-user' : '/api/systemadmin/deactivate-user';
                const statusRes = await fetch(statusEndpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ employeeNumber: employee.employeeNumber }) });
                if (!statusRes.ok) { const err = await statusRes.json().catch(() => ({})); throw new Error(err.message || `Error ${statusRes.status}: Status update failed`); }
            }
            onUpdated({ ...employee, firstName: form.firstName.trim(), middleName: form.middleName.trim(), lastName: form.lastName.trim(), suffix: form.suffix.trim(), employeeName: builtName, contactNumber: form.contactNumber, role: toBackendRole(form.role), accountStatus: form.accountStatus });
            setIsEditing(false);
            alert('Employee details updated successfully!');
            onClose();
        } catch (err: any) { setApiError(err.message ?? 'Something went wrong. Please try again.'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${displayName}? This cannot be undone.`)) return;
        setSubmitting(true); setApiError('');
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/systemadmin/delete-user', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ employeeNumber: employee.employeeNumber }) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || `Error ${res.status}: Delete failed`); }
            alert(`${displayName} has been deleted.`);
            onUpdated({ ...employee, accountStatus: '__deleted__' });
            onClose();
        } catch (err: any) { setApiError(err.message ?? 'Something went wrong. Please try again.'); }
        finally { setSubmitting(false); }
    };

    const editDisplayName = buildDisplayName(form.firstName, form.middleName, form.lastName, form.suffix);
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div><h3>Employee Details</h3><p className="modal-subtitle">{isEditing ? 'Editing profile' : 'Viewing profile'} of {displayName}</p></div>
                    <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
                </div>
                {apiError && <div className="form-api-error"><AlertCircle size={14} /><span>{apiError}</span></div>}
                <div className="modal-form">
                    <div className="employee-detail-avatar">
                        <div className="avatar-circle large">{(displayName || '?').charAt(0).toUpperCase()}</div>
                        <div className="avatar-info">
                            <h4>{isEditing ? editDisplayName || '—' : displayName}</h4>
                            <div className="avatar-meta">
                                {isEditing ? (
                                    <select value={form.accountStatus} onChange={handleChange('accountStatus')} className="detail-input status-select">
                                        <option value="Active">Active</option>
                                        <option value="Deactivated">Deactivated</option>
                                        {employee.accountStatus === 'On Leave' && <option value="On Leave">On Leave</option>}
                                        {employee.accountStatus === 'Emergency Overriden' && <option value="Emergency Overriden">Emergency Overriden</option>}
                                    </select>
                                ) : <span className={`status-badge ${(form.accountStatus ?? 'active').toLowerCase()}`}>{form.accountStatus ?? 'Active'}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="detail-grid">
                        <div className="detail-item"><span className="detail-label">Employee Number</span><span className="detail-value">{employee.employeeNumber}</span></div>
                        <div className="detail-item"><span className="detail-label">Role</span>{isEditing ? <select value={form.role} onChange={handleChange('role')} className="detail-input">{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select> : <span className="detail-value">{form.role || '—'}</span>}</div>
                        <div className="detail-item"><span className="detail-label">First Name</span>{isEditing ? <input type="text" value={form.firstName} onChange={handleChange('firstName')} className="detail-input" maxLength={50} /> : <span className="detail-value">{form.firstName || '—'}</span>}</div>
                        <div className="detail-item"><span className="detail-label">Last Name</span>{isEditing ? <input type="text" value={form.lastName} onChange={handleChange('lastName')} className="detail-input" maxLength={50} /> : <span className="detail-value">{form.lastName || '—'}</span>}</div>
                        <div className="detail-item"><span className="detail-label">Middle Name <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>(optional)</span></span>{isEditing ? <input type="text" value={form.middleName} onChange={handleChange('middleName')} className="detail-input" maxLength={50} placeholder="None" /> : <span className="detail-value">{form.middleName || '—'}</span>}</div>
                        <div className="detail-item"><span className="detail-label">Suffix <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>(optional)</span></span>{isEditing ? <input type="text" value={form.suffix} onChange={handleChange('suffix')} className="detail-input" maxLength={10} placeholder="None" /> : <span className="detail-value">{form.suffix || '—'}</span>}</div>
                        <div className="detail-item"><span className="detail-label">Contact Number</span>{isEditing ? <input type="tel" value={form.contactNumber} onChange={handleChange('contactNumber')} className="detail-input" /> : <span className="detail-value">{form.contactNumber}</span>}</div>
                    </div>
                </div>
                <div className="modal-actions">
                    {isEditing ? (
                        <><button className="btn" onClick={() => { setIsEditing(false); setApiError(''); }} disabled={submitting}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? <><Loader2 size={13} className="spin" /> Saving…</> : <><Save size={13} /> Save Changes</>}</button></>
                    ) : (
                        <><button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>Delete</button><button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit</button></>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Leave Action Modal ───────────────────────────────────────────────────────

interface LeaveActionModalProps {
    request: LeaveRequest;
    action: 'approve' | 'decline';
    onClose: () => void;
    onConfirm: (id: number, action: 'approve' | 'decline', note: string) => void;
}

function LeaveActionModal({ request, action, onClose, onConfirm }: LeaveActionModalProps) {
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const isApprove = action === 'approve';
    const days = calcDays(request.startDate, request.endDate);


    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`/api/leaverequest/${request.id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ approval_Status: isApprove ? 'Approved' : 'Declined', leaveRequestNote: note.trim() }) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).message || `Failed to ${action} leave request.`); }
            onConfirm(request.id, action, note.trim());
            onClose();
        } catch (err: any) { alert(err.message ?? 'Something went wrong.'); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
                <div className="modal-header">
                    <div><h3>{isApprove ? 'Approve Leave Request' : 'Decline Leave Request'}</h3><p className="modal-subtitle">{isApprove ? 'Confirm approval for this leave request.' : 'Provide a reason for declining this request.'}</p></div>
                    <button className="icon-btn" onClick={onClose}><X size={16} /></button>
                </div>
                <div style={{ background: 'var(--bg-secondary, #f8f9fc)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div className="emp-avatar" style={{ flexShrink: 0 }}>{request.employeeName.charAt(0).toUpperCase()}</div>
                        <div><div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{request.employeeName}</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{toDisplayRole(request.role)}</div></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 12 }}>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Type</span><br /><strong>{LEAVE_TYPE_LABELS[request.leaveType]}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Duration</span><br /><strong>{days} {days === 1 ? 'day' : 'days'}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>From</span><br /><strong>{fmtDate(request.startDate)}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>To</span><br /><strong>{fmtDate(request.endDate)}</strong></div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12 }}><span style={{ color: 'var(--text-secondary)' }}>Reason</span><br /><span style={{ color: 'var(--text-primary)' }}>{request.reason}</span></div>
                </div>
                <div className="field">
                    <label>{isApprove ? 'Note (optional)' : 'Reason for declining'}</label>
                    <textarea rows={3} maxLength={300} placeholder={isApprove ? 'Add a message for the employee (optional)…' : 'Explain why this request is being declined…'} value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', resize: 'vertical', borderRadius: 8, border: '1px solid var(--border)', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', marginTop: 3 }}>{note.length} / 300</div>
                </div>
                <div className="modal-actions">
                    <button className="btn" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button className={`btn ${isApprove ? 'btn-primary' : 'btn-danger'}`} onClick={handleConfirm} disabled={submitting || (!isApprove && !note.trim())}>
                        {submitting ? <><Loader2 size={13} className="spin" /> Processing…</> : isApprove ? <><CheckCircle2 size={13} /> Approve</> : <><X size={13} /> Decline</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

interface DashboardTabProps {
    employees: RecentEmployee[];
    recentEmployees: RecentEmployee[];
    activityLogs: ActivityLog[];
    loading: boolean;
    onSelectEmployee: (emp: RecentEmployee) => void;
    onViewAll: () => void;
}

function DashboardTab({ employees, recentEmployees, activityLogs, loading, onSelectEmployee, onViewAll }: DashboardTabProps) {
    const activeCount = employees.filter(e => e.accountStatus === 'Active').length;
    const deactivatedCount = employees.filter(e => e.accountStatus === 'Deactivated').length;

    return (
        <div className="dashboard-content">
            <div className="stats-row">
                {[
                    { icon: Users, bg: 'bg-primary', accent: 'accent-primary', label: 'TOTAL EMPLOYEES', value: employees.length, sub: 'All registered staff' },
                    { icon: CheckCircle2, bg: 'bg-success', accent: 'accent-success', label: 'ACTIVE', value: activeCount, sub: 'Currently active accounts' },
                    { icon: AlertCircle, bg: 'bg-danger', accent: 'accent-danger', label: 'DEACTIVATED', value: deactivatedCount, sub: 'Accounts needing review' },
                    { icon: Shield, bg: 'bg-warning', accent: 'accent-warning', label: 'ROLES', value: ROLES.length, sub: 'Available role types' },
                ].map(({ icon: Icon, bg, accent, label, value, sub }) => (
                    <div key={label} className={`stat-card ${accent}`}>
                        <div className="stat-card-top"><div className={`stat-icon ${bg}`}><Icon size={20} strokeWidth={2.3} /></div><div className="stat-text"><span className="stat-label">{label}</span></div></div>
                        <h3 className="stat-value">{value}</h3>
                        <div className="stat-subtext">{sub}</div>
                    </div>
                ))}
            </div>
            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><button className="text-link">Recent Employees</button><button className="view-all-link" onClick={onViewAll}>View more →</button></div>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead><tr><th>NAME</th><th>EMPLOYEE NO.</th><th>ROLE</th><th>STATUS</th></tr></thead>
                            <tbody>
                                {loading ? <tr><td colSpan={4}><div className="empty-state"><Loader2 size={22} className="spin" /><p>Loading...</p></div></td></tr>
                                    : recentEmployees.length === 0 ? <tr><td colSpan={4}><div className="empty-state"><Package size={22} /><p>No data available</p></div></td></tr>
                                        : recentEmployees.slice(0, 7).map(emp => {
                                            const name = getEmployeeDisplayName(emp);
                                            return (
                                                <tr key={emp.employeeNumber} onClick={() => onSelectEmployee(emp)} className="clickable-row">
                                                    <td><div className="emp-name-cell"><div style={{ position: 'relative', display: 'inline-block' }}><div className="emp-avatar">{name.charAt(0).toUpperCase()}</div><span style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: emp.presenceStatus === 'Online' ? '#05cd99' : '#a3aed0', border: '2px solid var(--bg-primary, #fff)', display: 'block' }} title={emp.presenceStatus ?? 'Offline'} /></div><span className="cell-name">{name}</span></div></td>
                                                    <td className="cell-id">{emp.employeeNumber}</td>
                                                    <td>{emp.role ? toDisplayRole(emp.role) : <span className="no-role">—</span>}</td>
                                                    <td><span className={`status-badge ${(emp.accountStatus ?? 'active').toLowerCase()}`}>{emp.accountStatus ?? 'Active'}</span></td>
                                                </tr>
                                            );
                                        })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card activity-card">
                    <div className="card-header"><button className="text-link">Recent Activity</button><a href="/activity-logs" className="view-all-link">View all →</a></div>
                    <div className="activity-feed-list">
                        {loading ? <div className="empty-state"><Loader2 size={22} className="spin" /><p>Loading...</p></div>
                            : activityLogs.length === 0 ? <div className="empty-state"><ClipboardList size={22} /><p>No recent activity</p></div>
                                : activityLogs.slice(0, 8).map(log => (
                                    <div key={log.id} className="activity-feed-item">
                                        <div className="activity-feed-dot bg-primary" />
                                        <div className="activity-feed-content"><span className="activity-feed-text">{log.description}</span><span className="activity-feed-time">{new Date(log.timestamp).toLocaleString()}</span></div>
                                    </div>
                                ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Manage Employees Tab ─────────────────────────────────────────────────────

type EmployeeSubTab = 'employees' | 'leave';

interface ManageEmployeesTabProps {
    employees: RecentEmployee[];
    loading: boolean;
    onSelectEmployee: (emp: RecentEmployee) => void;
    onAddEmployee: () => void;
    // ── Employee server-side pagination ──
    empPage: number;
    empTotalPages: number;
    onEmpPageChange: (page: number, filters: { search: string; role: string; status: string }) => void;
    // ── Leave server-side pagination ──
    leaveRequests: LeaveRequest[];
    leaveLoading: boolean;
    leavePage: number;
    leaveTotalPages: number;
    leavePendingCount: number;
    onLeavePageChange: (page: number, filters: LeaveFilters) => void;
    onLeaveConfirm: (id: number, action: 'approve' | 'decline', note: string) => void;
}

export interface LeaveFilters {
    status: 'all' | LeaveStatus;
    role: string;
    search: string;
}

function ManageEmployeesTab({
    employees, loading, onSelectEmployee, onAddEmployee,
    empPage, empTotalPages, onEmpPageChange,
    leaveRequests, leaveLoading, leavePage, leaveTotalPages, leavePendingCount,
    onLeavePageChange, onLeaveConfirm,
}: ManageEmployeesTabProps) {
    const [subTab, setSubTab] = useState<EmployeeSubTab>('employees');

    // ── Employee filters ──
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // ── Leave filters (server-side) ──
    const [leaveFilterStatus, setLeaveFilterStatus] = useState<'all' | LeaveStatus>('pending');
    const [leaveFilterRole, setLeaveFilterRole] = useState('');
    const [leaveSearch, setLeaveSearch] = useState('');

    const [actionModal, setActionModal] = useState<{ request: LeaveRequest; action: 'approve' | 'decline' } | null>(null);
    const [detailModal, setDetailModal] = useState<LeaveRequest | null>(null);

    const adminName = localStorage.getItem('employeeName') ?? 'System Admin';

    // Debounce/Trigger: re-fetch when employee filters change
    useEffect(() => {
        onEmpPageChange(1, { search, role: filterRole, status: filterStatus });
    }, [search, filterRole, filterStatus]);

    // Debounce: re-fetch when leave filters change
    useEffect(() => {
        onLeavePageChange(1, { status: leaveFilterStatus, role: leaveFilterRole, search: leaveSearch });
    }, [leaveFilterStatus, leaveFilterRole, leaveSearch]);

    return (
        <div className="dashboard-content">
            <div className="card employees-table-card" style={{ minHeight: 520, padding: 0, overflow: 'hidden' }}>
                {/* ── Subtab Bar ── */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
                    {([
                        { key: 'employees' as EmployeeSubTab, label: 'All Employees', icon: <Users size={14} />, badge: undefined },
                        { key: 'leave' as EmployeeSubTab, label: 'Leave Requests', icon: <CalendarDays size={14} />, badge: leavePendingCount },
                    ]).map(({ key, label, icon, badge }) => (
                        <button key={key} onClick={() => setSubTab(key)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 16px', fontSize: 13, fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', borderBottom: `2px solid ${subTab === key ? 'var(--primary)' : 'transparent'}`, color: subTab === key ? 'var(--primary)' : 'var(--text-secondary)', marginBottom: -1 }}>
                            {icon}{label}
                            {badge !== undefined && badge > 0 && (
                                <span style={{ background: subTab === key ? 'rgba(67,24,255,0.12)' : 'rgba(255,181,71,0.2)', color: subTab === key ? 'var(--primary)' : '#c05c00', fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 999 }}>
                                    {badge} pending
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ══ ALL EMPLOYEES PANE ══ */}
                {subTab === 'employees' && (
                    <>
                        <div style={{ padding: '16px 20px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{employees.length} result{employees.length !== 1 ? 's' : ''} on this page</span>
                            </div>
                            <div className="filter-bar">
                                <div className="search-input-wrap"><Search size={14} className="search-icon" /><input type="text" placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)} className="search-input" /></div>
                                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}><option value="">All Roles</option>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="">All Statuses</option><option value="Active">Active</option><option value="Deactivated">Deactivated</option></select>
                            </div>
                        </div>
                        <div className="data-table-wrap">
                            <table className="data-table">
                                <thead><tr><th>NAME</th><th>EMPLOYEE NO</th><th>ROLE</th><th>CONTACT</th><th>STATUS</th><th>ACTION</th></tr></thead>
                                <tbody>
                                    {loading ? <tr><td colSpan={6}><div className="empty-state"><Loader2 size={20} className="spin" /><p>Loading employees…</p></div></td></tr>
                                        : employees.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><Package size={20} /><p>No employees match your filters</p></div></td></tr>
                                            : employees.map(emp => {
                                                const name = getEmployeeDisplayName(emp);
                                                return (
                                                    <tr key={emp.employeeNumber} className="clickable-row" onClick={() => onSelectEmployee(emp)}>
                                                        <td><div className="emp-name-cell"><div style={{ position: 'relative', display: 'inline-block' }}><div className="emp-avatar">{name.charAt(0).toUpperCase()}</div><span style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: emp.presenceStatus === 'Online' ? '#05cd99' : '#a3aed0', border: '2px solid var(--bg-primary, #fff)', display: 'block' }} title={emp.presenceStatus ?? 'Offline'} /></div>{name}</div></td>
                                                        <td>{emp.employeeNumber}</td>
                                                        <td>{emp.role ? toDisplayRole(emp.role) : <span className="no-role">—</span>}</td>
                                                        <td>{emp.contactNumber}</td>
                                                        <td><span className={`status-badge ${(emp.accountStatus ?? 'active').toLowerCase()}`}>{emp.accountStatus ?? 'Active'}</span></td>
                                                        <td><button className="btn btn-xs" onClick={e => { e.stopPropagation(); onSelectEmployee(emp); }}><Pencil size={11} /> Edit</button></td>
                                                    </tr>
                                                );
                                            })}
                                </tbody>
                            </table>
                        </div>
                        {!loading && empTotalPages > 1 && (
                            <div className="pagination-bar">
                                <span className="pagination-info">Page {empPage} of {empTotalPages}</span>
                                <div className="pagination-controls">
                                    <button className="page-btn page-btn-nav" onClick={() => onEmpPageChange(empPage - 1, { search, role: filterRole, status: filterStatus })} disabled={empPage === 1}><ChevronLeft size={15} /></button>
                                    {getPageNumbers(empTotalPages, empPage).map((p, i) =>
                                        p === '...' ? <span key={`e-${i}`} className="page-ellipsis">…</span>
                                            : <button key={p} className={`page-btn${empPage === p ? ' active' : ''}`} onClick={() => onEmpPageChange(p as number, { search, role: filterRole, status: filterStatus })}>{p}</button>
                                    )}
                                    <button className="page-btn page-btn-nav" onClick={() => onEmpPageChange(empPage + 1, { search, role: filterRole, status: filterStatus })} disabled={empPage === empTotalPages}><ChevronRight size={15} /></button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ══ LEAVE REQUESTS PANE ══ */}
                {subTab === 'leave' && (
                    <>
                        <div style={{ padding: '16px 20px 0' }}>
                            <div className="filter-bar">
                                <div className="search-input-wrap"><Search size={14} className="search-icon" /><input type="text" placeholder="Search by name or ID…" value={leaveSearch} onChange={e => setLeaveSearch(e.target.value)} className="search-input" /></div>
                                <select value={leaveFilterStatus} onChange={e => setLeaveFilterStatus(e.target.value as any)}>
                                    <option value="pending">Pending</option><option value="all">All Statuses</option><option value="approved">Approved</option><option value="declined">Declined</option>
                                </select>
                                <select value={leaveFilterRole} onChange={e => setLeaveFilterRole(e.target.value)}>
                                    <option value="">All Roles</option>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="data-table-wrap">
                            <table className="data-table">
                                <thead><tr><th>EMPLOYEE</th><th>LEAVE TYPE</th><th>DATES</th><th>DURATION</th><th>SUBMITTED</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                                <tbody>
                                    {leaveLoading ? <tr><td colSpan={7}><div className="empty-state"><Loader2 size={20} className="spin" /><p>Loading requests…</p></div></td></tr>
                                        : leaveRequests.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><Package size={20} /><p>No leave requests match your filters</p></div></td></tr>
                                            : leaveRequests.map(r => {
                                                const days = calcDays(r.startDate, r.endDate);
                                                const meta = LEAVE_STATUS_META[r.status];
                                                return (
                                                    <tr key={r.id} className="clickable-row" onClick={() => setDetailModal(r)}>
                                                        <td><div className="emp-name-cell"><div className="emp-avatar">{r.employeeName.charAt(0).toUpperCase()}</div><div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.employeeName}</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.employeeNumber}</div></div></div></td>
                                                        <td style={{ fontSize: 13 }}>{LEAVE_TYPE_LABELS[r.leaveType]}</td>
                                                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(r.startDate)}<br />{fmtDate(r.endDate)}</td>
                                                        <td style={{ fontSize: 13, fontWeight: 600 }}>{days} {days === 1 ? 'day' : 'days'}</td>
                                                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(r.submittedAt)}</td>
                                                        <td><span className={`status-badge ${r.status === 'approved' ? 'active' : r.status === 'declined' ? 'deactivated' : 'pending-badge'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{meta.icon}{meta.label}</span></td>
                                                        <td onClick={e => e.stopPropagation()}>
                                                            {r.status === 'pending' ? (
                                                                <div style={{ display: 'flex', gap: 6 }}>
                                                                    <button className="btn btn-xs" style={{ background: 'rgba(5,205,153,0.12)', color: '#05cd99', border: '1px solid rgba(5,205,153,0.3)', fontWeight: 600 }} onClick={() => setActionModal({ request: r, action: 'approve' })}><CheckCircle2 size={11} /> Approve</button>
                                                                    <button className="btn btn-xs btn-danger" onClick={() => setActionModal({ request: r, action: 'decline' })}><X size={11} /> Decline</button>
                                                                </div>
                                                            ) : <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{r.status === 'approved' ? `By ${r.reviewedBy ?? 'Admin'}` : 'Declined'}</span>}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                </tbody>
                            </table>
                        </div>
                        {/* ✅ Server-side leave pagination */}
                        {!leaveLoading && leaveTotalPages > 1 && (
                            <div className="pagination-bar">
                                <span className="pagination-info">Page {leavePage} of {leaveTotalPages}</span>
                                <div className="pagination-controls">
                                    <button className="page-btn page-btn-nav" onClick={() => onLeavePageChange(leavePage - 1, { status: leaveFilterStatus, role: leaveFilterRole, search: leaveSearch })} disabled={leavePage === 1}><ChevronLeft size={15} /></button>
                                    {getPageNumbers(leaveTotalPages, leavePage).map((p, i) =>
                                        p === '...' ? <span key={`l-${i}`} className="page-ellipsis">…</span>
                                            : <button key={p} className={`page-btn${leavePage === p ? ' active' : ''}`} onClick={() => onLeavePageChange(p as number, { status: leaveFilterStatus, role: leaveFilterRole, search: leaveSearch })}>{p}</button>
                                    )}
                                    <button className="page-btn page-btn-nav" onClick={() => onLeavePageChange(leavePage + 1, { status: leaveFilterStatus, role: leaveFilterRole, search: leaveSearch })} disabled={leavePage === leaveTotalPages}><ChevronRight size={15} /></button>
                                </div>
                            </div>
                        )}

                        {detailModal && (
                            <div className="modal-overlay" onClick={() => setDetailModal(null)}>
                                <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                                    <div className="modal-header"><div><h3>Leave Request Detail</h3><p className="modal-subtitle">Full details for this request</p></div><button className="icon-btn" onClick={() => setDetailModal(null)}><X size={16} /></button></div>
                                    <div className="employee-detail-avatar" style={{ marginBottom: 16 }}><div className="avatar-circle large">{detailModal.employeeName.charAt(0).toUpperCase()}</div><div className="avatar-info"><h4>{detailModal.employeeName}</h4><div className="avatar-meta" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{detailModal.employeeNumber} · {toDisplayRole(detailModal.role)}</div></div></div>
                                    <div className="detail-grid">
                                        {[{ label: 'Leave Type', value: LEAVE_TYPE_LABELS[detailModal.leaveType] }, { label: 'Duration', value: `${calcDays(detailModal.startDate, detailModal.endDate)} days` }, { label: 'Start Date', value: fmtDate(detailModal.startDate) }, { label: 'End Date', value: fmtDate(detailModal.endDate) }, { label: 'Submitted', value: fmtDate(detailModal.submittedAt) }, { label: 'Status', value: LEAVE_STATUS_META[detailModal.status].label }].map(({ label, value }) => (
                                            <div key={label} className="detail-item"><span className="detail-label">{label}</span><span className="detail-value">{value}</span></div>
                                        ))}
                                    </div>
                                    <div className="detail-item" style={{ margin: '12px 0' }}><span className="detail-label">Reason</span><span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{detailModal.reason}</span></div>
                                    {detailModal.reviewNote && <div style={{ background: detailModal.status === 'approved' ? 'rgba(5,205,153,0.08)' : 'rgba(238,93,80,0.08)', border: `1px solid ${detailModal.status === 'approved' ? 'rgba(5,205,153,0.25)' : 'rgba(238,93,80,0.25)'}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}><strong>Review Note:</strong> {detailModal.reviewNote}</div>}
                                    <div className="modal-actions">
                                        {detailModal.status === 'pending' ? (
                                            <><button className="btn btn-danger" onClick={() => { setDetailModal(null); setActionModal({ request: detailModal, action: 'decline' }); }}><X size={13} /> Decline</button><button className="btn btn-primary" onClick={() => { setDetailModal(null); setActionModal({ request: detailModal, action: 'approve' }); }}><CheckCircle2 size={13} /> Approve</button></>
                                        ) : <button className="btn" onClick={() => setDetailModal(null)}>Close</button>}
                                    </div>
                                </div>
                            </div>
                        )}
                        {actionModal && <LeaveActionModal request={actionModal.request} action={actionModal.action} onClose={() => setActionModal(null)} onConfirm={(id, action, note) => { onLeaveConfirm(id, action, note); setActionModal(null); }} />}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
    const employeeId = localStorage.getItem('employeeId') ?? '';
    const storedFirstName = localStorage.getItem('firstName') ?? '';
    const storedMiddleName = localStorage.getItem('middleName') ?? '';
    const storedLastName = localStorage.getItem('lastName') ?? '';
    const storedSuffix = localStorage.getItem('suffix') ?? '';
    const legacyName = localStorage.getItem('employeeName') ?? '';
    const employeeContact = localStorage.getItem('contactNumber') ?? '';

    const [passwordGate, setPasswordGate] = useState(false);
    const [gatePassword, setGatePassword] = useState('');
    const [gateError, setGateError] = useState('');
    const [gateLoading, setGateLoading] = useState(false);
    const [showGatePassword, setShowGatePassword] = useState(false);
    const [pendingEdit, setPendingEdit] = useState<'profile' | null>(null);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ firstName: storedFirstName, middleName: storedMiddleName, lastName: storedLastName, suffix: storedSuffix, contactNumber: employeeContact });
    const [profileError, setProfileError] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [editingPassword, setEditingPassword] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwError, setPwError] = useState('');
    const [pwSaving, setPwSaving] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const requestEditProfile = () => { setGatePassword(''); setGateError(''); setShowGatePassword(false); setPendingEdit('profile'); setPasswordGate(true); };

    const handleGateConfirm = async () => {
        if (!gatePassword) { setGateError('Please enter your password.'); return; }
        setGateLoading(true); setGateError('');
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/systemadmin/verify-password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ password: gatePassword }) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Incorrect password. Please try again.'); }
            setPasswordGate(false); setGatePassword('');
            if (pendingEdit === 'profile') { setEditingProfile(true); setProfileSuccess(false); }
        } catch (err: any) { setGateError(err.message ?? 'Incorrect password. Please try again.'); }
        finally { setGateLoading(false); }
    };

    const handleProfileChange = (key: keyof typeof profileForm) => (e: React.ChangeEvent<HTMLInputElement>) => { setProfileForm(prev => ({ ...prev, [key]: e.target.value })); setProfileError(''); setProfileSuccess(false); };

    const handleProfileSave = async () => {
        if (!profileForm.firstName.trim()) { setProfileError('First name is required.'); return; }
        if (!profileForm.lastName.trim()) { setProfileError('Last name is required.'); return; }
        if (profileForm.contactNumber && !/^[0-9+\-\s()]{7,20}$/.test(profileForm.contactNumber.trim())) { setProfileError('Enter a valid contact number.'); return; }
        setProfileSaving(true); setProfileError('');
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`/api/systemadmin/update-user?employeeNumber=${encodeURIComponent(employeeId)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ employeeNumber: employeeId, firstName: profileForm.firstName.trim(), middleName: profileForm.middleName.trim(), lastName: profileForm.lastName.trim(), suffix: profileForm.suffix.trim(), contactNumber: profileForm.contactNumber.trim() }) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Profile update failed.'); }
            localStorage.setItem('firstName', profileForm.firstName.trim());
            localStorage.setItem('middleName', profileForm.middleName.trim());
            localStorage.setItem('lastName', profileForm.lastName.trim());
            localStorage.setItem('suffix', profileForm.suffix.trim());
            localStorage.setItem('contactNumber', profileForm.contactNumber.trim());
            localStorage.setItem('employeeName', buildDisplayName(profileForm.firstName, profileForm.middleName, profileForm.lastName, profileForm.suffix));
            setProfileSuccess(true); setEditingProfile(false);
        } catch (err: any) { setProfileError(err.message ?? 'Something went wrong.'); }
        finally { setProfileSaving(false); }
    };

    const handlePwChange = (key: keyof typeof pwForm) => (e: React.ChangeEvent<HTMLInputElement>) => { setPwForm(prev => ({ ...prev, [key]: e.target.value })); setPwError(''); };

    const handlePwSave = async () => {
        if (!pwForm.current) { setPwError('Current password is required.'); return; }
        if (pwForm.next.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
        if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
        setPwSaving(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/systemadmin/change-password', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Password update failed.'); }
            alert('Password changed successfully!');
            setEditingPassword(false);
            setPwForm({ current: '', next: '', confirm: '' });
        } catch (err: any) { setPwError(err.message ?? 'Something went wrong.'); }
        finally { setPwSaving(false); }
    };

    const displayName = buildDisplayName(profileForm.firstName || storedFirstName, profileForm.middleName || storedMiddleName, profileForm.lastName || storedLastName, profileForm.suffix || storedSuffix) || legacyName || 'System Admin';
    const displayContact = profileForm.contactNumber || employeeContact;

    return (
        <div className="dashboard-content">
            {passwordGate && (
                <div className="modal-overlay" onClick={() => setPasswordGate(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header"><div><h3>Confirm Your Identity</h3><p className="modal-subtitle">Enter your password to edit your profile.</p></div><button className="icon-btn" onClick={() => setPasswordGate(false)} aria-label="Close"><X size={16} /></button></div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 16px', gap: 8 }}><div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(67,24,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={22} color="var(--primary)" /></div><p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>For your security, please verify your identity before making changes.</p></div>
                        {gateError && <div className="form-api-error" style={{ marginBottom: 12 }}><AlertCircle size={14} /><span>{gateError}</span></div>}
                        <div className="field" style={{ marginBottom: 20 }}>
                            <label>Password</label>
                            <div style={{ position: 'relative' }}><input type={showGatePassword ? 'text' : 'password'} value={gatePassword} onChange={e => { setGatePassword(e.target.value); setGateError(''); }} onKeyDown={e => e.key === 'Enter' && handleGateConfirm()} placeholder="Enter your current password" style={{ paddingRight: 40, width: '100%' }} autoFocus /><button type="button" onClick={() => setShowGatePassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} tabIndex={-1}>{showGatePassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
                        </div>
                        <div className="modal-actions"><button className="btn" onClick={() => setPasswordGate(false)} disabled={gateLoading}>Cancel</button><button className="btn btn-primary" onClick={handleGateConfirm} disabled={gateLoading || !gatePassword}>{gateLoading ? <><Loader2 size={13} className="spin" /> Verifying…</> : <><Shield size={13} /> Confirm</>}</button></div>
                    </div>
                </div>
            )}
            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
                <div className="card">
                    <div className="card-header"><h3>My Profile</h3>{!editingProfile && <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', width: 'fit-content', flexShrink: 0, marginLeft: 'auto' }} onClick={requestEditProfile}><Pencil size={12} /> Edit Profile</button>}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 16px', gap: 10 }}><div className="avatar-circle large" style={{ width: 72, height: 72, fontSize: 28, background: 'linear-gradient(135deg, #4318ff, #6a5cff)', boxShadow: '0 8px 20px rgba(67,24,255,0.28)' }}>{displayName.charAt(0).toUpperCase()}</div><div style={{ textAlign: 'center' }}><h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{displayName}</h4><span className="status-badge active" style={{ marginTop: 6, display: 'inline-block' }}>Active</span></div></div>
                    {profileSuccess && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(5,205,153,0.1)', border: '1px solid rgba(5,205,153,0.25)', borderRadius: 10, marginBottom: 12, fontSize: 13, color: '#05cd99', fontWeight: 600 }}><CheckCircle2 size={14} /> Profile updated successfully!</div>}
                    {editingProfile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {profileError && <div className="form-api-error"><AlertCircle size={14} /><span>{profileError}</span></div>}
                            <div className="field-row"><div className="field"><label>First Name <span style={{ color: 'var(--danger)' }}>*</span></label><input type="text" value={profileForm.firstName} onChange={handleProfileChange('firstName')} placeholder="First name" maxLength={50} /></div><div className="field"><label>Last Name <span style={{ color: 'var(--danger)' }}>*</span></label><input type="text" value={profileForm.lastName} onChange={handleProfileChange('lastName')} placeholder="Last name" maxLength={50} /></div></div>
                            <div className="field-row"><div className="field"><label>Middle Name <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>(optional)</span></label><input type="text" value={profileForm.middleName} onChange={handleProfileChange('middleName')} placeholder="Middle name" maxLength={50} /></div><div className="field"><label>Suffix <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>(optional)</span></label><input type="text" value={profileForm.suffix} onChange={handleProfileChange('suffix')} placeholder="Jr., Sr., III" maxLength={10} /></div></div>
                            <div className="field"><label>Contact Number</label><input type="tel" value={profileForm.contactNumber} onChange={handleProfileChange('contactNumber')} placeholder="e.g. +63 917 000 0000" /></div>
                            <div className="detail-grid" style={{ marginTop: 4 }}><div className="detail-item"><span className="detail-label">Employee ID</span><span className="detail-value">{employeeId || '—'}</span></div><div className="detail-item"><span className="detail-label">Role</span><span className="detail-value">System Admin</span></div></div>
                            <div className="modal-actions" style={{ padding: '4px 0 0' }}><button className="btn" onClick={() => { setEditingProfile(false); setProfileError(''); setProfileForm({ firstName: storedFirstName, middleName: storedMiddleName, lastName: storedLastName, suffix: storedSuffix, contactNumber: employeeContact }); }} disabled={profileSaving}>Cancel</button><button className="btn btn-primary" onClick={handleProfileSave} disabled={profileSaving}>{profileSaving ? <><Loader2 size={13} className="spin" /> Saving…</> : <><Save size={13} /> Save Changes</>}</button></div>
                        </div>
                    ) : (
                        <div className="detail-grid" style={{ marginTop: 4 }}>
                            <div className="detail-item"><span className="detail-label"><Hash size={11} style={{ display: 'inline', marginRight: 4 }} />Employee ID</span><span className="detail-value">{employeeId || '—'}</span></div>
                            <div className="detail-item"><span className="detail-label"><UserCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} />First Name</span><span className="detail-value">{profileForm.firstName || '—'}</span></div>
                            <div className="detail-item"><span className="detail-label"><UserCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} />Last Name</span><span className="detail-value">{profileForm.lastName || '—'}</span></div>
                            <div className="detail-item"><span className="detail-label"><UserCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} />Middle Name</span><span className="detail-value">{profileForm.middleName || '—'}</span></div>
                            {profileForm.suffix && <div className="detail-item"><span className="detail-label"><UserCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} />Suffix</span><span className="detail-value">{profileForm.suffix}</span></div>}
                            <div className="detail-item"><span className="detail-label"><Shield size={11} style={{ display: 'inline', marginRight: 4 }} />Role</span><span className="detail-value">System Admin</span></div>
                            <div className="detail-item"><span className="detail-label"><Phone size={11} style={{ display: 'inline', marginRight: 4 }} />Contact</span><span className="detail-value">{displayContact || '—'}</span></div>
                        </div>
                    )}
                </div>
                <div className="card">
                    <div className="card-header"><h3>Security Settings</h3>{!editingPassword && <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', width: 'fit-content', flexShrink: 0, marginLeft: 'auto' }} onClick={() => setEditingPassword(true)}><Lock size={12} /> Change Password</button>}</div>
                    {!editingPassword ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
                            <div className="system-status-item" style={{ cursor: 'default' }}><div className="system-icon bg-success"><CheckCircle2 size={16} /></div><div className="system-info"><span className="system-name">Password</span><span className="system-detail">Last updated recently</span></div><span style={{ fontSize: 12, fontWeight: 600, color: '#05cd99', background: 'rgba(5,205,153,0.12)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Secure</span></div>
                            <div style={{ height: 1, background: 'var(--border)' }} />
                            <div className="system-status-item" style={{ cursor: 'default' }}><div className="system-icon bg-primary"><Shield size={16} /></div><div className="system-info"><span className="system-name">Role Permissions</span><span className="system-detail">Full system access granted</span></div><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'rgba(67,24,255,0.1)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Admin</span></div>
                            <div style={{ height: 1, background: 'var(--border)' }} />
                            <div className="system-status-item" style={{ cursor: 'default' }}><div className="system-icon bg-warning"><AlertCircle size={16} /></div><div className="system-info"><span className="system-name">Active Session</span><span className="system-detail">Logged in on this device</span></div><span style={{ fontSize: 12, fontWeight: 600, color: '#ffb547', background: 'rgba(255,181,71,0.15)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Live</span></div>
                        </div>
                    ) : (
                        <div className="modal-form" style={{ padding: '4px 0 0' }}>
                            {pwError && <div className="form-api-error" style={{ marginBottom: 8 }}><AlertCircle size={14} /><span>{pwError}</span></div>}
                            <div className="field"><label>Current Password</label><div style={{ position: 'relative' }}><input type={showCurrent ? 'text' : 'password'} value={pwForm.current} onChange={handlePwChange('current')} placeholder="Enter current password" style={{ paddingRight: 40, width: '100%' }} /><button type="button" onClick={() => setShowCurrent(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} tabIndex={-1}>{showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>
                            <div className="field"><label>New Password</label><div style={{ position: 'relative' }}><input type={showNext ? 'text' : 'password'} value={pwForm.next} onChange={handlePwChange('next')} placeholder="At least 6 characters" style={{ paddingRight: 40, width: '100%' }} /><button type="button" onClick={() => setShowNext(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} tabIndex={-1}>{showNext ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>{pwForm.next.length > 0 && <div style={{ marginTop: 6 }}><div style={{ display: 'flex', gap: 4 }}>{[1, 2, 3].map(level => <div key={level} style={{ flex: 1, height: 4, borderRadius: 2, background: pwForm.next.length >= level * 4 ? level === 1 ? '#ee5d50' : level === 2 ? '#ffb547' : '#05cd99' : '#e9edf7', transition: 'background 0.2s' }} />)}</div><span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>{pwForm.next.length < 4 ? 'Weak' : pwForm.next.length < 8 ? 'Fair' : 'Strong'}</span></div>}</div>
                            <div className="field"><label>Confirm New Password</label><div style={{ position: 'relative' }}><input type={showConfirm ? 'text' : 'password'} value={pwForm.confirm} onChange={handlePwChange('confirm')} placeholder="Re-enter new password" style={{ paddingRight: 40, width: '100%' }} /><button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} tabIndex={-1}>{showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>{pwForm.confirm.length > 0 && pwForm.next !== pwForm.confirm && <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3, display: 'block' }}>Passwords do not match</span>}{pwForm.confirm.length > 0 && pwForm.next === pwForm.confirm && <span style={{ fontSize: 11, color: '#05cd99', marginTop: 3, display: 'block' }}>✓ Passwords match</span>}</div>
                            <div className="modal-actions" style={{ padding: '4px 0 0' }}><button className="btn" onClick={() => { setEditingPassword(false); setPwError(''); setPwForm({ current: '', next: '', confirm: '' }); }} disabled={pwSaving}>Cancel</button><button className="btn btn-primary" onClick={handlePwSave} disabled={pwSaving}>{pwSaving ? <><Loader2 size={13} className="spin" /> Saving…</> : <><Save size={13} /> Update Password</>}</button></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="card"><div className="card-header"><h3>Account Overview</h3></div><div className="system-status-list">{[{ icon: Users, bg: 'bg-primary', name: 'Manage Employees', detail: 'Register, edit, and deactivate accounts' }, { icon: Truck, bg: 'bg-warning', name: 'Delivery Oversight', detail: 'View and manage all deliveries' }, { icon: BarChart3, bg: 'bg-success', name: 'Analytics & Reports', detail: 'Access system-wide reports' }].map(({ icon: Icon, bg, name, detail }) => (<div key={name} className="system-status-item"><div className={`system-icon ${bg}`}><Icon size={16} /></div><div className="system-info"><span className="system-name">{name}</span><span className="system-detail">{detail}</span></div><span style={{ fontSize: 11, fontWeight: 600, color: '#2b3674', background: '#eef2ff', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Full Access</span></div>))}</div></div>
        </div>
    );
}

// ─── Emergency Overrides Tab ──────────────────────────────────────────────────

interface EmergencyOverridesTabProps {
    overrides: EmergencyOverride[];
    loading: boolean;
    overridePage: number;
    overrideTotalPages: number;
    onPageChange: (page: number, filters: OverrideFilters) => void;
    onOverrideUpdated: (id: string, status: OverrideStatus, overrideUntil?: string) => void;
    overrideCounts: { pending: number; approved: number; rejected: number };
}

export interface OverrideFilters {
    status: 'All' | OverrideStatus;
    search: string;
}

function EmergencyOverridesTab({ overrides, loading, overridePage, overrideTotalPages, onPageChange, onOverrideUpdated, overrideCounts }: EmergencyOverridesTabProps) {
    const [filterStatus, setFilterStatus] = useState<'All' | OverrideStatus>('Pending');
    const [search, setSearch] = useState('');
    const [actionModal, setActionModal] = useState<{ override: EmergencyOverride; action: 'Approved' | 'Rejected' } | null>(null);
    const [overrideUntil, setOverrideUntil] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState('');

    // Re-fetch when filters change
    useEffect(() => {
        onPageChange(1, { status: filterStatus, search });
    }, [filterStatus, search]);

    const { pending: pendingCount, approved: approvedCount, rejected: rejectedCount } = overrideCounts;

    const handleAction = async () => {
        if (!actionModal) return;
        if (actionModal.action === 'Approved' && !overrideUntil) { setActionError('Please set an override expiry date and time.'); return; }
        setSubmitting(true); setActionError('');
        try {
            const token = localStorage.getItem('authToken');
            const isApprove = actionModal.action === 'Approved';
            const endpoint = isApprove ? '/api/emergency_override_controls/approve' : '/api/emergency_override_controls/decline';
            const body = isApprove
                ? { emergencyOverrideId: actionModal.override.emergencyOverrideId, status: actionModal.action, overrideUntil: new Date(overrideUntil).toISOString() }
                : { emergencyOverrideId: actionModal.override.emergencyOverrideId };
            const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Action failed.'); }
            onOverrideUpdated(actionModal.override.emergencyOverrideId, actionModal.action, overrideUntil || undefined);
            setActionModal(null); setOverrideUntil(''); setNote('');
        } catch (err: any) { setActionError(err.message ?? 'Something went wrong.'); }
        finally { setSubmitting(false); }
    };

    const statusMeta: Record<OverrideStatus, { label: string; cls: string; icon: React.ReactNode }> = {
        Pending: { label: 'Pending', cls: 'pending-badge', icon: <Clock size={12} /> },
        Approved: { label: 'Approved', cls: 'active', icon: <CheckCircle2 size={12} /> },
        Rejected: { label: 'Rejected', cls: 'deactivated', icon: <X size={12} /> },
    };

    return (
        <div className="dashboard-content">
            <div className="stats-row" style={{ marginBottom: 20 }}>
                {[
                    { icon: Clock, bg: 'bg-warning', label: 'PENDING', value: pendingCount, sub: 'Awaiting review' },
                    { icon: CheckCircle2, bg: 'bg-success', label: 'APPROVED', value: approvedCount, sub: 'Access granted' },
                    { icon: AlertCircle, bg: 'bg-danger', label: 'REJECTED', value: rejectedCount, sub: 'Access denied' },
                    { icon: ShieldAlert, bg: 'bg-primary', label: 'TOTAL', value: overrides.length, sub: 'This page' },
                ].map(({ icon: Icon, bg, label, value, sub }) => (
                    <div key={label} className="stat-card"><div className={`stat-icon ${bg}`}><Icon size={18} /></div><div className="stat-text"><p className="stat-label">{label}</p><h3 className="stat-value">{value}</h3><small>{sub}</small></div></div>
                ))}
            </div>
            <div className="card employees-table-card" style={{ minHeight: 520 }}>
                <div className="card-header"><h3>Emergency Override Requests</h3></div>
                <div className="filter-bar">
                    <div className="search-input-wrap"><Search size={14} className="search-icon" /><input type="text" placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)} className="search-input" /></div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                        <option value="Pending">Pending</option><option value="All">All Statuses</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option>
                    </select>
                </div>
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead><tr><th>EMPLOYEE</th><th>REASON</th><th>REQUESTED</th><th>OVERRIDE UNTIL</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={6}><div className="empty-state"><Loader2 size={20} className="spin" /><p>Loading requests…</p></div></td></tr>
                                : overrides.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><ShieldAlert size={20} /><p>No override requests match your filters</p></div></td></tr>
                                    : overrides.map(o => {
                                        const meta = statusMeta[o.status];
                                        return (
                                            <tr key={o.emergencyOverrideId}>
                                                <td><div className="emp-name-cell"><div className="emp-avatar">{o.employeeName.charAt(0).toUpperCase()}</div><div><div style={{ fontWeight: 600, fontSize: 13 }}>{o.employeeName}</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{o.employeeNumber}</div></div></div></td>
                                                <td style={{ fontSize: 13, maxWidth: 200 }}><span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{o.reason}</span></td>
                                                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(o.requestedAt).toLocaleString()}</td>
                                                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.overrideUntil ? new Date(o.overrideUntil).toLocaleString() : '—'}</td>
                                                <td><span className={`status-badge ${meta.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{meta.icon}{meta.label}</span></td>
                                                <td>
                                                    {o.status === 'Pending' ? (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button className="btn btn-xs" style={{ background: 'rgba(5,205,153,0.12)', color: '#05cd99', border: '1px solid rgba(5,205,153,0.3)', fontWeight: 600 }} onClick={() => { setActionModal({ override: o, action: 'Approved' }); setOverrideUntil(''); setNote(''); setActionError(''); }}><CheckCircle2 size={11} /> Approve</button>
                                                            <button className="btn btn-xs btn-danger" onClick={() => { setActionModal({ override: o, action: 'Rejected' }); setOverrideUntil(''); setNote(''); setActionError(''); }}><X size={11} /> Reject</button>
                                                        </div>
                                                    ) : <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{o.status === 'Approved' ? 'Access granted' : 'Access denied'}</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                        </tbody>
                    </table>
                </div>
                {/* ✅ Server-side override pagination */}
                {!loading && overrideTotalPages > 1 && (
                    <div className="pagination-bar">
                        <span className="pagination-info">Page {overridePage} of {overrideTotalPages}</span>
                        <div className="pagination-controls">
                            <button className="page-btn page-btn-nav" onClick={() => onPageChange(overridePage - 1, { status: filterStatus, search })} disabled={overridePage === 1}><ChevronLeft size={15} /></button>
                            {getPageNumbers(overrideTotalPages, overridePage).map((p, i) =>
                                p === '...' ? <span key={`eo-${i}`} className="page-ellipsis">…</span>
                                    : <button key={p} className={`page-btn${overridePage === p ? ' active' : ''}`} onClick={() => onPageChange(p as number, { status: filterStatus, search })}>{p}</button>
                            )}
                            <button className="page-btn page-btn-nav" onClick={() => onPageChange(overridePage + 1, { status: filterStatus, search })} disabled={overridePage === overrideTotalPages}><ChevronRight size={15} /></button>
                        </div>
                    </div>
                )}
            </div>
            {actionModal && (
                <div className="modal-overlay" onClick={() => setActionModal(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
                        <div className="modal-header"><div><h3>{actionModal.action === 'Approved' ? 'Approve Override Request' : 'Reject Override Request'}</h3><p className="modal-subtitle">{actionModal.action === 'Approved' ? 'Set how long the employee can access the system.' : 'Confirm rejection of this emergency override request.'}</p></div><button className="icon-btn" onClick={() => setActionModal(null)}><X size={16} /></button></div>
                        <div style={{ background: 'var(--bg-secondary, #f8f9fc)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid var(--border)', fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: 'var(--text-secondary)' }}>Employee</span><strong>{actionModal.override.employeeName}</strong></div>
                            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Reason</span><span style={{ maxWidth: 260, textAlign: 'right' }}>{actionModal.override.reason}</span></div>
                        </div>
                        {actionModal.action === 'Approved' && <div className="field" style={{ marginBottom: 16 }}><label>Override Access Until</label><input type="datetime-local" value={overrideUntil} onChange={e => { setOverrideUntil(e.target.value); setActionError(''); }} min={new Date().toISOString().slice(0, 16)} /><span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>The employee's access will automatically expire at this time.</span></div>}
                        {actionError && <div className="form-api-error" style={{ marginBottom: 12 }}><AlertCircle size={14} /><span>{actionError}</span></div>}
                        <div className="modal-actions">
                            <button className="btn" onClick={() => setActionModal(null)} disabled={submitting}>Cancel</button>
                            <button className={`btn ${actionModal.action === 'Approved' ? 'btn-primary' : 'btn-danger'}`} onClick={handleAction} disabled={submitting}>
                                {submitting ? <><Loader2 size={13} className="spin" /> Processing…</> : actionModal.action === 'Approved' ? <><CheckCircle2 size={13} /> Approve Access</> : <><X size={13} /> Reject Request</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Root Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
    const navigate = useNavigate();
    const storedFirst = localStorage.getItem('firstName') ?? '';
    const storedMiddle = localStorage.getItem('middleName') ?? '';
    const storedLast = localStorage.getItem('lastName') ?? '';
    const storedSuffix = localStorage.getItem('suffix') ?? '';
    const employeeName = buildDisplayName(storedFirst, storedMiddle, storedLast, storedSuffix) || localStorage.getItem('employeeName') || '';

    const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<RecentEmployee | null>(null);
    const [selectedPanelEmployee, setSelectedPanelEmployee] = useState<RecentEmployee | null>(null);

    // ── Employees ──
    const [employees, setEmployees] = useState<RecentEmployee[]>([]);
    const [recentEmployees, setRecentEmployees] = useState<RecentEmployee[]>([]);
    const [empLoading, setEmpLoading] = useState(true);
    const [empPage, setEmpPage] = useState(1);
    const [empTotalPages, setEmpTotalPages] = useState(1);

    // ── Leave Requests ──
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [leaveLoading, setLeaveLoading] = useState(true);
    const [leavePage, setLeavePage] = useState(1);
    const [leaveTotalPages, setLeaveTotalPages] = useState(1);
    const [leavePendingCount, setLeavePendingCount] = useState(0);

    // ── Emergency Overrides ──
    const [overrides, setOverrides] = useState<EmergencyOverride[]>([]);
    const [overrideLoading, setOverrideLoading] = useState(true);
    const [overridePage, setOverridePage] = useState(1);
    const [overrideTotalPages, setOverrideTotalPages] = useState(1);
    const [overrideCounts, setOverrideCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

    // ── Activity Logs ──
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

    const fetchEmployees = (page: number = 1, filters: { search: string; role: string; status: string } = { search: '', role: '', status: '' }) => {
        const token = localStorage.getItem('authToken');
        setEmpLoading(true);

        const params = new URLSearchParams({ PageNumber: String(page), PageSize: String(PAGE_SIZE) });
        if (filters.search) params.append('search', filters.search);
        if (filters.role) params.append('role', toBackendRole(filters.role));
        if (filters.status) params.append('status', filters.status);

        fetch(`/api/systemadmin/recent-employees?${params}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then(result => {
                if (!result.isSuccess) throw new Error(result.message ?? 'Failed to fetch');
                const raw: any[] = Array.isArray(result.data) ? result.data : [];
                const list: RecentEmployee[] = raw.map((e: any) => ({
                    employeeNumber: e.employeeNumber,
                    firstName: e.firstName ?? '',
                    middleName: e.middleName ?? '',
                    lastName: e.lastName ?? '',
                    suffix: e.suffix ?? '',
                    employeeName: e.employeeName ?? buildDisplayName(e.firstName ?? '', e.middleName ?? '', e.lastName ?? '', e.suffix ?? ''),
                    contactNumber: e.contactNumber,
                    role: e.role,
                    accountStatus: e.accountStatus ?? 'Unknown',
                    presenceStatus: e.presenceStatus ?? 'Offline',
                })).filter((e: RecentEmployee) => e.accountStatus !== 'Deleted');
                setEmployees(list);
                setRecentEmployees(list);
                setEmpTotalPages(result.totalPages ?? 1);
                setEmpPage(page);
            })
            .catch(() => { setEmployees([]); setRecentEmployees([]); })
            .finally(() => setEmpLoading(false));
    };

    // ── Fetch Leave Requests (server-side) ──
    const fetchLeaveRequests = (page: number = 1, filters: LeaveFilters = { status: 'pending', role: '', search: '' }) => {
        const token = localStorage.getItem('authToken');
        setLeaveLoading(true);
        const params = new URLSearchParams({ PageNumber: String(page), PageSize: String(PAGE_SIZE) });
        if (filters.status !== 'all') params.append('status', filters.status);
        if (filters.role) params.append('role', toBackendRole(filters.role));
        if (filters.search) params.append('search', filters.search);
        fetch(`/api/leaverequest/get-all-leave-requests?${params}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then((result: any) => {
                // Handle both array response and paginated envelope
                const raw: any[] = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : []);
                const list: LeaveRequest[] = raw.map(r => ({
                    id: r.leaveId,
                    employeeNumber: r.employeeNumber ?? '',
                    employeeName: r.employeeName ?? '',
                    role: r.role ?? '',
                    leaveType: ((r.leave_Type ?? r.leaveType ?? 'other') as string).toLowerCase() as LeaveType,
                    startDate: (r.start_Date ?? r.startDate ?? '').split('T')[0],
                    endDate: (r.end_Date ?? r.endDate ?? '').split('T')[0],
                    reason: r.reason ?? '',
                    status: ((r.approval_Status ?? r.approvalStatus ?? 'pending') as string).toLowerCase() as LeaveStatus,
                    submittedAt: (r.submittedAt ?? r.start_Date ?? '').split('T')[0],
                    reviewedBy: r.reviewedBy ?? undefined,
                    reviewNote: r.leaveRequestNote ?? r.reviewNote ?? undefined,
                }));
                setLeaveRequests(list);
                setLeaveTotalPages(result.totalPages ?? 1);
                setLeavePage(page);
                // Count pending for badge — re-fetch without filter only on first load
                if (filters.status === 'pending' && page === 1) {
                    setLeavePendingCount(result.totalCount ?? list.filter(r => r.status === 'pending').length);
                }
            })
            .catch(() => setLeaveRequests([]))
            .finally(() => setLeaveLoading(false));
    };

    // ── Fetch Emergency Overrides (server-side) ──
    const fetchOverrides = (page: number = 1, filters: OverrideFilters = { status: 'Pending', search: '' }) => {
        const token = localStorage.getItem('authToken');
        setOverrideLoading(true);
        const params = new URLSearchParams({ PageNumber: String(page), PageSize: String(PAGE_SIZE) });
        if (filters.status !== 'All') params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        fetch(`/api/emergency_override_controls/all-requests?${params}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then((result: any) => {
                const raw: any[] = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : []);
                setOverrides(raw.map(o => ({
                    emergencyOverrideId: o.emergencyOverrideId,
                    requestedById: o.requestedById,
                    employeeName: o.employeeName ?? '—',
                    employeeNumber: o.employeeNumber ?? '—',
                    leaveId: o.leaveId,
                    status: o.status,
                    reason: o.reason,
                    requestedAt: o.requestedAt,
                    approvedAt: o.approvedAt,
                    overrideUntil: o.overrideUntil,
                })));
                setOverrideTotalPages(result.totalPages ?? 1);
                setOverridePage(page);
                setOverrideCounts({
                    pending: result.totalPending ?? 0,
                    approved: result.totalApproved ?? 0,
                    rejected: result.totalRejected ?? 0,
                });
            })
            .catch(() => setOverrides([]))
            .finally(() => setOverrideLoading(false));
    };

    useEffect(() => {
        fetchEmployees(1);
        fetchLeaveRequests(1, { status: 'pending', role: '', search: '' });
        fetchOverrides(1, { status: 'Pending', search: '' });
        const token = localStorage.getItem('authToken');
        fetch('/api/activity-logs/recent', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => { if (!res.ok) return []; return res.json(); })
            .then(data => setActivityLogs(Array.isArray(data) ? data : []))
            .catch(() => setActivityLogs([]));
    }, []);

    const handleLogout = async () => {
        const token = localStorage.getItem('authToken');
        if (token) { await fetch('/api/authentication/logout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }).catch(() => { }); }
        ['employeeId', 'refreshToken', 'authToken', 'employeeName', 'firstName', 'middleName', 'lastName', 'suffix', 'contactNumber', 'role'].forEach(k => localStorage.removeItem(k));
        navigate('/');
    };

    const handleEmployeeUpdated = (updated: RecentEmployee) => {
        if (updated.accountStatus === '__deleted__') {
            setEmployees(prev => prev.filter(e => e.employeeNumber !== updated.employeeNumber));
            setRecentEmployees(prev => prev.filter(e => e.employeeNumber !== updated.employeeNumber));
        } else {
            setEmployees(prev => prev.map(e => e.employeeNumber === updated.employeeNumber ? updated : e));
            setRecentEmployees(prev => prev.map(e => e.employeeNumber === updated.employeeNumber ? updated : e));
        }
    };

    const handleLeaveConfirm = (id: number, action: 'approve' | 'decline', note: string) => {
        setLeaveRequests(prev => prev.map(r =>
            r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'declined', reviewedBy: localStorage.getItem('employeeName') ?? 'Admin', reviewNote: note || undefined } : r
        ));
    };

    const handleOverrideUpdated = (id: string, status: OverrideStatus, until?: string) => {
        setOverrides(prev => prev.map(o => o.emergencyOverrideId === id ? { ...o, status, overrideUntil: until } : o));
    };

    const pageTitles: Record<NavTab, string> = {
        dashboard: 'Dashboard', employees: 'Employees', emergency_override: 'Emergency Override',
        delivery: 'Delivery Summary', analytics: 'Analytics View', settings: 'Settings',
        activity_logs: 'Activity Logs', profile: 'My Profile',
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-logo"><img src="/src/assets/SpeedexLogo.jpg" alt="Speedex Logo" className="logo-image" /></div>
                <div className="sidebar-role-section"><div className="sidebar-role-badge super-admin"><div className="role-dot-inner" />SUPER ADMIN</div></div>
                <nav className="sidebar-nav">
                    {NAV_GROUPS.map(group => (
                        <div key={group.label} className="nav-section">
                            <div className="nav-section-title">{group.label}</div>
                            {group.items.map(({ tab, icon: Icon, label }) => (
                                <div key={tab} className={`nav-item${activeTab === tab ? ' nav-item-active' : ''}`} onClick={() => { setActiveTab(tab); setSelectedPanelEmployee(null); }}>
                                    <Icon size={18} /><span className="nav-item-label">{label}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </nav>
                <div className="sidebar-footer-profile">
                    <div className="profile-card">
                        <div className="profile-avatar">{getInitials(employeeName || 'Super Admin')}</div>
                        <div className="profile-info"><span className="profile-name">{employeeName || 'Super Admin'}</span><span className="profile-role">SUPER ADMIN</span></div>
                        <button className="profile-logout" onClick={handleLogout} title="Logout" aria-label="Logout"><LogOut size={18} /></button>
                    </div>
                </div>
            </aside>

            <main className="main-viewport">
                {!(activeTab === 'employees' && selectedPanelEmployee) && (
                    <div className="dashboard-header">
                        <div className="header-title">
                            <h2>{pageTitles[activeTab]}</h2>
                            <p>Speedex Courier Inc. — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="header-search-wrap"><Search size={14} className="header-search-icon" /><input type="text" className="header-search-input" placeholder="Search employee, task…" /></div>
                            {(activeTab === 'dashboard' || activeTab === 'employees') && <button className="quick-action-btn-header" onClick={() => setShowAddModal(true)}><Users size={18} /> Add Employee</button>}
                            <NotificationBell apiEndpoint="/api/notification/my-notifications" />
                        </div>
                    </div>
                )}

                {activeTab === 'dashboard' && (
                    <DashboardTab employees={employees} recentEmployees={recentEmployees} activityLogs={activityLogs} loading={empLoading} onSelectEmployee={emp => setSelectedEmployee(emp)} onViewAll={() => { setActiveTab('employees'); setSelectedPanelEmployee(null); }} />
                )}

                {activeTab === 'employees' && (
                    selectedPanelEmployee ? (
                        <EmployeeDetailPanel employee={selectedPanelEmployee} onBack={() => setSelectedPanelEmployee(null)} onEmployeeUpdated={updated => { handleEmployeeUpdated(updated); if (updated.accountStatus === '__deleted__') setSelectedPanelEmployee(null); else setSelectedPanelEmployee(updated); }} />
                    ) : (
                        <ManageEmployeesTab
                            employees={employees}
                            loading={empLoading}
                            onSelectEmployee={emp => setSelectedPanelEmployee(emp)}
                            onAddEmployee={() => setShowAddModal(true)}
                            empPage={empPage}
                            empTotalPages={empTotalPages}
                            onEmpPageChange={fetchEmployees}
                            leaveRequests={leaveRequests}
                            leaveLoading={leaveLoading}
                            leavePage={leavePage}
                            leaveTotalPages={leaveTotalPages}
                            leavePendingCount={leavePendingCount}
                            onLeavePageChange={fetchLeaveRequests}
                            onLeaveConfirm={handleLeaveConfirm}
                        />
                    )
                )}

                {(activeTab === 'profile' || activeTab === 'settings') && <ProfileTab />}

                {activeTab === 'delivery' && <div className="dashboard-content"><div className="card"><div className="empty-state" style={{ padding: 48 }}><Truck size={32} /><p>Delivery module coming soon.</p></div></div></div>}
                {activeTab === 'analytics' && <div className="dashboard-content"><div className="card"><div className="empty-state" style={{ padding: 48 }}><BarChart3 size={32} /><p>Analytics module coming soon.</p></div></div></div>}

                {activeTab === 'emergency_override' && (
                    <EmergencyOverridesTab
                        overrides={overrides}
                        loading={overrideLoading}
                        overridePage={overridePage}
                        overrideTotalPages={overrideTotalPages}
                        onPageChange={fetchOverrides}
                        onOverrideUpdated={handleOverrideUpdated}
                        overrideCounts={overrideCounts} 
                    />
                )}

                {activeTab === 'activity_logs' && (
                    <div className="dashboard-content">
                        <div className="card">
                            <div className="card-header"><h3>System Activity Logs</h3></div>
                            {activityLogs.length === 0 ? <div className="empty-state" style={{ padding: 48 }}><Activity size={32} /><p>No activity logs found.</p></div>
                                : <div className="data-table-wrap"><table className="data-table"><thead><tr><th>DESCRIPTION</th><th>TIMESTAMP</th></tr></thead><tbody>{activityLogs.map(log => <tr key={log.id}><td className="cell-name">{log.description}</td><td className="cell-muted">{new Date(log.timestamp).toLocaleString()}</td></tr>)}</tbody></table></div>}
                        </div>
                    </div>
                )}
            </main>

            {showAddModal && (
                <AddEmployeeModal onClose={() => setShowAddModal(false)} onSuccess={newEmp => { setEmployees(prev => [newEmp, ...prev]); setRecentEmployees(prev => [newEmp, ...prev]); }} />
            )}
            {selectedEmployee && (
                <EmployeeDetailModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onUpdated={handleEmployeeUpdated} />
            )}
        </div>
    );
}