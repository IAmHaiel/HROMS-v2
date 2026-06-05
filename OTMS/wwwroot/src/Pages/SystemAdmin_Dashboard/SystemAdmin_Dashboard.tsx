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
    employeeName: string;
    contactNumber: string;
    role: string;
    email: string;
}

interface FieldError {
    employeeNumber?: string;
    employeeName?: string;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
    'System Admin',
    'Operation Admin',
    'Operation Team',
    'Coordinator',
    'Delivery Driver',
    'Encoder',
];

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

const ITEMS_PER_PAGE = 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface FieldError {
    employeeName?: string;
    contactNumber?: string;
    role?: string;
    email?: string;
}

const EMPTY_FORM: FormState = {
    employeeNumber: '',   // will be auto-filled
    employeeName: '',
    contactNumber: '',
    role: '',
    email: '',
};

function validate(form: FormState): FieldError {
    const errs: FieldError = {};

    // ── Full Name ──
    const name = form.employeeName.trim();
    if (!name) {
        errs.employeeName = 'Full name is required.';
    } else if (name.length < 2) {
        errs.employeeName = 'Name must be at least 2 characters.';
    } else if (name.length > 80) {
        errs.employeeName = 'Name must not exceed 80 characters.';
    } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-\.]+$/.test(name)) {
        errs.employeeName = 'Name contains invalid characters.';
    } else if (name.split(/\s+/).filter(Boolean).length < 2) {
        errs.employeeName = 'Please enter both first and last name.';
    }

    // ── Contact Number ──
    const contact = form.contactNumber.trim();
    if (!contact) {
        errs.contactNumber = 'Contact number is required.';
    } else if (!/^\d+$/.test(contact)) {
        errs.contactNumber = 'Contact number must contain digits only.';
    } else if (contact.length !== 11) {
        errs.contactNumber = `Must be exactly 11 digits (currently ${contact.length}).`;
    } else if (!/^09\d{9}$/.test(contact)) {
        errs.contactNumber = 'Must start with 09 (e.g. 09123456789).';
    }

    // ── Role ──
    if (!form.role) {
        errs.role = 'Please select a role.';
    } else if (!ROLES.includes(form.role)) {
        errs.role = 'Selected role is not valid.';
    }

    // ── Email ──
    const email = form.email.trim();
    if (!email) {
        errs.email = 'Email address is required.';
    } else if (email.length > 100) {
        errs.email = 'Email must not exceed 100 characters.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        errs.email = 'Enter a valid email address.';
    }

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
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
};

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

    // ── Auto-generate employee number on mount ──────────────────────────────
    useEffect(() => {
        const generateEmployeeNumber = async () => {
            setEmpNumLoading(true);
            setEmpNumError('');
            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch('/api/systemadmin/recent-employees', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                const employees: { employeeNumber: string }[] = Array.isArray(data) ? data : [];

                // Extract all numeric parts from existing employee numbers
                const usedNumbers = new Set(
                    employees
                        .map(e => {
                            const match = e.employeeNumber?.match(/(\d+)$/);
                            return match ? parseInt(match[1], 10) : null;
                        })
                        .filter((n): n is number => n !== null)
                );

                // Find the next available incremental number (no gaps skipped, just max + 1)
                let next = 1;
                while (usedNumbers.has(next)) next++;

                const generated = `EMP-${String(next).padStart(4, '0')}`;
                setForm(prev => ({ ...prev, employeeNumber: generated }));
            } catch {
                setEmpNumError('Could not generate employee number. Please try again.');
            } finally {
                setEmpNumLoading(false);
            }
        };

        generateEmployeeNumber();
    }, []);

    // ── Per-field live validator ──────────────────────────────────────────────
    const validateField = (key: keyof FormState, value: string): string => {
        switch (key) {
            case 'employeeName': {
                const name = value.trim();
                if (!name) return 'Full name is required.';
                if (name.length < 2) return 'Name must be at least 2 characters.';
                if (name.length > 80) return 'Name must not exceed 80 characters.';
                if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-\.]+$/.test(name)) return 'Name contains invalid characters.';
                return '';
            }
            case 'contactNumber': {
                const contact = value.trim();
                if (!contact) return 'Contact number is required.';
                if (!/^\d+$/.test(contact)) return 'Digits only — no spaces, dashes, or symbols.';
                if (contact.length !== 11) return `Must be exactly 11 digits (currently ${contact.length}).`;
                if (!/^09\d{9}$/.test(contact)) return 'Must start with 09 (e.g. 09123456789).';
                return '';
            }
            case 'role': {
                if (!value) return 'Please select a role.';
                if (!ROLES.includes(value)) return 'Selected role is not valid.';
                return '';
            }
            case 'email': {
                const email = value.trim();
                if (!email) return 'Email address is required.';
                if (email.length > 100) return 'Email must not exceed 100 characters.';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Enter a valid email address.';
                return '';
            }
            default:
                return '';
        }
    };

    // ── Handle change with live validation ───────────────────────────────────
    const handleChange =
        (key: keyof FormState) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                const value = e.target.value;
                setForm(prev => ({ ...prev, [key]: value }));
                setApiError('');

                // Only show live error after the field has been touched
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
                employeeName: form.employeeName.trim(),
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
            setSuccessData({ employeeNumber: data.employeeNumber });
            success('Employee registered successfully!');
            onSuccess({
                employeeNumber: data.employeeNumber,
                employeeName: data.employeeName,
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

                {apiError && (
                    <div className="form-api-error"><AlertCircle size={14} /><span>{apiError}</span></div>
                )}

                <div className="modal-form">
                    {/* ── Account info ── */}
                    <p className="modal-section-label">Account info</p>
                    <div className="field-row">

                        {/* ── Employee Number (read-only, system-generated) ── */}
                        <div className="field">
                            <label htmlFor="emp-number">
                                Employee Number
                                <span style={{
                                    marginLeft: 6, fontSize: 10, fontWeight: 600,
                                    background: 'rgba(67,24,255,0.1)', color: 'var(--primary)',
                                    padding: '2px 7px', borderRadius: 999, verticalAlign: 'middle',
                                }}>
                                    AUTO
                                </span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="emp-number"
                                    type="text"
                                    value={empNumLoading ? '' : form.employeeNumber}
                                    readOnly
                                    placeholder={empNumLoading ? 'Generating…' : ''}
                                    style={{
                                        background: 'var(--bg-secondary, #f8f9fc)',
                                        color: empNumLoading ? 'var(--text-secondary)' : 'var(--text-primary)',
                                        cursor: 'not-allowed',
                                        fontWeight: 600,
                                        letterSpacing: '0.5px',
                                        paddingRight: 36,
                                        border: empNumError
                                            ? '1px solid var(--danger)'
                                            : '1px solid var(--border)',
                                    }}
                                />
                                <span style={{
                                    position: 'absolute', right: 10, top: '50%',
                                    transform: 'translateY(-50%)',
                                    display: 'flex', alignItems: 'center',
                                    color: empNumLoading ? 'var(--text-secondary)' : '#05cd99',
                                }}>
                                    {empNumLoading
                                        ? <Loader2 size={13} className="spin" />
                                        : <CheckCircle2 size={13} />
                                    }
                                </span>
                            </div>
                            {empNumError
                                ? <span className="field-error"><AlertCircle size={12} />{empNumError}</span>
                                : !empNumLoading && (
                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>
                                        Assigned automatically. Cannot be changed.
                                    </span>
                                )
                            }
                        </div>

                        {/* ── Role ── */}
                        <div className="field">
                            <label htmlFor="emp-role">Role</label>
                            <select
                                id="emp-role" value={form.role} onChange={handleChange('role')}
                                className={errors.role ? 'input-error' : ''}
                            >
                                <option value="">Select a role</option>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {errors.role && <span className="field-error"><AlertCircle size={12} />{errors.role}</span>}
                        </div>
                    </div>

                    {/* ── Personal info ── */}
                    <p className="modal-section-label" style={{ marginTop: 8 }}>Personal info</p>
                    <div className="field">
                        <label htmlFor="emp-name">Full Name</label>
                        <input
                            id="emp-name" type="text" placeholder="e.g. Juan dela Cruz"
                            value={form.employeeName} onChange={handleChange('employeeName')}
                            className={errors.employeeName ? 'input-error' : ''}
                            maxLength={80}
                        />
                        {errors.employeeName
                            ? <span className="field-error"><AlertCircle size={12} />{errors.employeeName}</span>
                            : form.employeeName.trim() && (
                                <span style={{
                                    fontSize: 11, marginTop: 3, display: 'block',
                                    color: form.employeeName.trim().split(/\s+/).filter(Boolean).length < 2
                                        ? '#c05c00' : '#05cd99',
                                }}>
                                    {form.employeeName.trim().split(/\s+/).filter(Boolean).length < 2
                                        ? '⚠ Enter both first and last name'
                                        : '✓ Looks good'}
                                </span>
                            )
                        }
                    </div>
                    <div className="field-row">
                        <div className="field">
                            <label htmlFor="emp-contact">Contact Number</label>
                            <input
                                id="emp-contact"
                                type="tel"
                                placeholder="e.g. 09123456789"
                                value={form.contactNumber}
                                onChange={e => {
                                    // Strip non-digits automatically on input
                                    const digitsOnly = e.target.value.replace(/\D/g, '');
                                    setForm(prev => ({ ...prev, contactNumber: digitsOnly }));
                                    setApiError('');
                                    const errMsg = validateField('contactNumber', digitsOnly);
                                    setErrors(prev => ({ ...prev, contactNumber: errMsg || undefined }));
                                }}
                                className={errors.contactNumber ? 'input-error' : form.contactNumber.length === 11 && /^09\d{9}$/.test(form.contactNumber) ? 'input-success' : ''}
                                maxLength={11}
                            />
                            {errors.contactNumber
                                ? <span className="field-error"><AlertCircle size={12} />{errors.contactNumber}</span>
                                : form.contactNumber.length > 0
                                    ? <span style={{ fontSize: 11, marginTop: 3, display: 'block', color: form.contactNumber.length === 11 ? '#05cd99' : 'var(--text-secondary)' }}>
                                        {form.contactNumber.length}/11 digits{form.contactNumber.length === 11 && ' ✓'}
                                    </span>
                                    : <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>
                                        Format: 09XXXXXXXXX (11 digits)
                                    </span>
                            }
                        </div>
                        <div className="field">
                            <label htmlFor="emp-email">Email Address</label>
                            <input
                                id="emp-email" type="email" placeholder="e.g. juan@speedex.com"
                                value={form.email} onChange={handleChange('email')}
                                className={errors.email ? 'input-error' : ''}
                                maxLength={100}
                                autoComplete="off"
                            />
                            {errors.email
                                ? <span className="field-error"><AlertCircle size={12} />{errors.email}</span>
                                : form.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()) && (
                                    <span style={{ fontSize: 11, color: '#05cd99', marginTop: 3, display: 'block' }}>✓ Valid email</span>
                                )
                            }
                        </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, marginTop: -6 }}>
                        <AlertCircle size={11} />
                        A verification link will be sent to this address after registration.
                    </p>
                </div>

                <div className="modal-actions">
                    <button className="btn" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={submitting || empNumLoading || !!empNumError}
                    >
                        {submitting
                            ? <><Loader2 size={13} className="spin" /> Registering…</>
                            : <><Save size={13} /> Register Employee</>
                        }
                    </button>
                </div>
            </div>

            {successData && (
                <div className="modal-overlay" onClick={() => { setSuccessData(null); onClose(); }}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, padding: '8px 0 20px' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(5,205,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle2 size={28} color="#05cd99" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0 }}>Employee registered</h3>
                                <p className="modal-subtitle">Account has been created successfully.</p>
                            </div>
                        </div>

                        {/* ── Employee details ── */}
                        <div style={{ background: 'var(--bg-secondary, #f8f9fc)', borderRadius: 10, border: '1px solid var(--border)', padding: '12px 16px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Employee number</span>
                                <strong>{successData.employeeNumber}</strong>
                            </div>
                            <div style={{ height: 1, background: 'var(--border)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Full name</span>
                                <strong>{form.employeeName.trim()}</strong>
                            </div>
                            <div style={{ height: 1, background: 'var(--border)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-all', textAlign: 'right', maxWidth: 220 }}>
                                    {form.email.trim()}
                                </span>
                            </div>
                        </div>

                        {/* ── Email sent notice ── */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, background: 'rgba(5,205,153,0.08)', border: '1px solid rgba(5,205,153,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#05cd99' }}>
                            <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                Login credentials have been sent to <strong>{form.email.trim()}</strong>. Ask the employee to check their inbox to activate their account.
                            </span>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={() => { setSuccessData(null); onClose(); }}
                        >
                            Done
                        </button>
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
    const [form, setForm] = useState({
        employeeName: employee.employeeName,
        contactNumber: employee.contactNumber,
        role: toDisplayRole(employee.role),
        accountStatus: employee.accountStatus,
    });
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    const handleChange = (key: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setForm(prev => ({ ...prev, [key]: e.target.value }));
            setApiError('');
        };

    const handleSave = async () => {
        setSubmitting(true);
        setApiError('');
        try {
            const token = localStorage.getItem('authToken');
            const updateRes = await fetch(
                `/api/profile/update-profile?employeeNumber=${encodeURIComponent(employee.employeeNumber)}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ employeeNumber: employee.employeeNumber, employeeName: form.employeeName, contactNumber: form.contactNumber }),
                }
            );
            if (!updateRes.ok) {
                const err = await updateRes.json().catch(() => ({}));
                throw new Error(err.message || `Error ${updateRes.status}: Update failed`);
            }
            if (toBackendRole(form.role) !== employee.role) {
                const roleRes = await fetch('/api/systemadmin/assign-role', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ employeeNumber: employee.employeeNumber, roleName: toBackendRole(form.role) }),
                });
                if (!roleRes.ok) {
                    const err = await roleRes.json().catch(() => ({}));
                    throw new Error(err.message || `Error ${roleRes.status}: Role update failed`);
                }
            }
            if (form.accountStatus !== employee.accountStatus) {
                const statusEndpoint = form.accountStatus === 'Active' ? '/api/systemadmin/activate-user' : '/api/systemadmin/deactivate-user';
                const statusRes = await fetch(statusEndpoint, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ employeeNumber: employee.employeeNumber }),
                });
                if (!statusRes.ok) {
                    const err = await statusRes.json().catch(() => ({}));
                    throw new Error(err.message || `Error ${statusRes.status}: Status update failed`);
                }
            }
            const updated: RecentEmployee = {
                ...employee,
                employeeName: form.employeeName,
                contactNumber: form.contactNumber,
                role: toBackendRole(form.role),
                accountStatus: form.accountStatus,
            };
            onUpdated(updated);
            setIsEditing(false);
            alert('Employee details updated successfully!');
            onClose();
        } catch (err: any) {
            setApiError(err.message ?? 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${employee.employeeName}? This cannot be undone.`)) return;
        setSubmitting(true);
        setApiError('');
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/systemadmin/delete-user', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ employeeNumber: employee.employeeNumber }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Error ${res.status}: Delete failed`);
            }
            alert(`${employee.employeeName} has been deleted.`);
            onUpdated({ ...employee, accountStatus: '__deleted__' });
            onClose();
        } catch (err: any) {
            setApiError(err.message ?? 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3>Employee Details</h3>
                        <p className="modal-subtitle">
                            {isEditing ? 'Editing profile' : 'Viewing profile'} of {employee.employeeName}
                        </p>
                    </div>
                    <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
                </div>
                {apiError && (
                    <div className="form-api-error"><AlertCircle size={14} /><span>{apiError}</span></div>
                )}
                <div className="modal-form">
                    <div className="employee-detail-avatar">
                        <div className="avatar-circle large">{employee.employeeName.charAt(0).toUpperCase()}</div>
                        <div className="avatar-info">
                            <h4>{form.employeeName}</h4>
                            <div className="avatar-meta">
                                {isEditing ? (
                                    <select value={form.accountStatus} onChange={handleChange('accountStatus')} className="detail-input status-select">
                                        <option value="Active">Active</option>
                                        <option value="Deactivated">Deactivated</option>
                                        {employee.accountStatus === 'On Leave' && <option value="On Leave">On Leave</option>}
                                        {employee.accountStatus === 'Emergency Overriden' && <option value="Emergency Overriden">Emergency Overriden</option>}
                                    </select>
                                ) : (
                                    <span className={`status-badge ${(form.accountStatus ?? 'active').toLowerCase()}`}>
                                        {form.accountStatus ?? 'Active'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">Employee Number</span>
                            <span className="detail-value">{employee.employeeNumber}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Full Name</span>
                            {isEditing ? <input type="text" value={form.employeeName} onChange={handleChange('employeeName')} className="detail-input" /> : <span className="detail-value">{form.employeeName}</span>}
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Role</span>
                            {isEditing ? (
                                <select value={form.role} onChange={handleChange('role')} className="detail-input">
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            ) : (
                                <span className="detail-value">{form.role || '—'}</span>
                            )}
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Contact Number</span>
                            {isEditing ? <input type="tel" value={form.contactNumber} onChange={handleChange('contactNumber')} className="detail-input" /> : <span className="detail-value">{form.contactNumber}</span>}
                        </div>
                    </div>
                </div>
                <div className="modal-actions">
                    {isEditing ? (
                        <>
                            <button className="btn" onClick={() => { setIsEditing(false); setApiError(''); }} disabled={submitting}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                                {submitting ? <><Loader2 size={13} className="spin" /> Saving…</> : <><Save size={13} /> Save Changes</>}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>Delete</button>
                            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit</button>
                        </>
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
            const res = await fetch(`/api/leaverequest/${request.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    approval_Status: isApprove ? 'Approved' : 'Declined',
                    leaveRequestNote: note.trim(),
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message || `Failed to ${action} leave request.`);
            }
            onConfirm(request.id, action, note.trim());
            onClose();
        } catch (err: any) {
            alert(err.message ?? 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
                <div className="modal-header">
                    <div>
                        <h3>{isApprove ? 'Approve Leave Request' : 'Decline Leave Request'}</h3>
                        <p className="modal-subtitle">
                            {isApprove ? 'Confirm approval for this leave request.' : 'Provide a reason for declining this request.'}
                        </p>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={16} /></button>
                </div>
                <div style={{ background: 'var(--bg-secondary, #f8f9fc)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div className="emp-avatar" style={{ flexShrink: 0 }}>
                            {request.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{request.employeeName}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{toDisplayRole(request.role)}</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 12 }}>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Type</span><br /><strong>{LEAVE_TYPE_LABELS[request.leaveType]}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Duration</span><br /><strong>{days} {days === 1 ? 'day' : 'days'}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>From</span><br /><strong>{fmtDate(request.startDate)}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>To</span><br /><strong>{fmtDate(request.endDate)}</strong></div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Reason</span><br />
                        <span style={{ color: 'var(--text-primary)' }}>{request.reason}</span>
                    </div>
                </div>
                <div className="field">
                    <label>{isApprove ? 'Note (optional)' : 'Reason for declining'}</label>
                    <textarea
                        rows={3}
                        maxLength={300}
                        placeholder={isApprove ? 'Add a message for the employee (optional)…' : 'Explain why this request is being declined…'}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        style={{ width: '100%', resize: 'vertical', borderRadius: 8, border: '1px solid var(--border)', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', marginTop: 3 }}>{note.length} / 300</div>
                </div>
                <div className="modal-actions">
                    <button className="btn" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button
                        className={`btn ${isApprove ? 'btn-primary' : 'btn-danger'}`}
                        onClick={handleConfirm}
                        disabled={submitting || (!isApprove && !note.trim())}
                    >
                        {submitting
                            ? <><Loader2 size={13} className="spin" /> Processing…</>
                            : isApprove
                                ? <><CheckCircle2 size={13} /> Approve</>
                                : <><X size={13} /> Decline</>
                        }
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

function DashboardTab({
    employees,
    recentEmployees,
    activityLogs,
    loading,
    onSelectEmployee,
    onViewAll,
}: DashboardTabProps) {
    const activeCount = employees.filter(e => e.accountStatus === 'Active').length;
    const deactivatedCount = employees.filter(e => e.accountStatus === 'Deactivated').length;

    return (
        <div className="dashboard-content">

            {/* ── STATS ROW ───────────────────────────────────── */}
            <div className="stats-row">
                {[
                    { icon: Users, bg: 'bg-primary', accent: 'accent-primary', label: 'TOTAL EMPLOYEES', value: employees.length, sub: 'All registered staff' },
                    { icon: CheckCircle2, bg: 'bg-success', accent: 'accent-success', label: 'ACTIVE', value: activeCount, sub: 'Currently active accounts' },
                    { icon: AlertCircle, bg: 'bg-danger', accent: 'accent-danger', label: 'DEACTIVATED', value: deactivatedCount, sub: 'Accounts needing review' },
                    { icon: Shield, bg: 'bg-warning', accent: 'accent-warning', label: 'ROLES', value: ROLES.length, sub: 'Available role types' },
                ].map(({ icon: Icon, bg, accent, label, value, sub }) => (
                    <div key={label} className={`stat-card ${accent}`}>
                        <div className="stat-card-top">
                            <div className={`stat-icon ${bg}`}>
                                <Icon size={20} strokeWidth={2.3} />
                            </div>
                            <div className="stat-text">
                                <span className="stat-label">{label}</span>
                            </div>
                        </div>
                        <h3 className="stat-value">{value}</h3>
                        <div className="stat-subtext">{sub}</div>
                    </div>
                ))}
            </div>

            {/* ── MAIN GRID ──────────────────────────────────── */}
            <div className="dashboard-grid">

                {/* ── RECENT EMPLOYEES ───────────────────────── */}
                <div className="card">
                    <div className="card-header">
                        <button className="text-link">Recent Employees</button>
                        <button className="view-all-link" onClick={onViewAll}>View more →</button>
                    </div>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>NAME</th>
                                    <th>EMPLOYEE NO.</th>
                                    <th>ROLE</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4}>
                                            <div className="empty-state">
                                                <Loader2 size={22} className="spin" />
                                                <p>Loading...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : recentEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={4}>
                                            <div className="empty-state">
                                                <Package size={22} />
                                                <p>No data available</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    recentEmployees.slice(0, 7).map(emp => (
                                        <tr
                                            key={emp.employeeNumber}
                                            onClick={() => onSelectEmployee(emp)}
                                            className="clickable-row"
                                        >
                                            <td>
                                                <div className="emp-name-cell">
                                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                                        <div className="emp-avatar">
                                                            {emp.employeeName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span style={{
                                                            position: 'absolute', bottom: 1, right: 1,
                                                            width: 9, height: 9, borderRadius: '50%',
                                                            background: emp.presenceStatus === 'Online' ? '#05cd99' : '#a3aed0',
                                                            border: '2px solid var(--bg-primary, #fff)',
                                                            display: 'block'
                                                        }} title={emp.presenceStatus ?? 'Offline'} />
                                                    </div>
                                                    <span className="cell-name">{emp.employeeName}</span>
                                                </div>
                                            </td>
                                            <td className="cell-id">{emp.employeeNumber}</td>
                                            <td>
                                                {emp.role ? toDisplayRole(emp.role) : <span className="no-role">—</span>}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${(emp.accountStatus ?? 'active').toLowerCase()}`}>
                                                    {emp.accountStatus ?? 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── RECENT ACTIVITY ────────────────────────── */}
                <div className="card activity-card">
                    <div className="card-header">
                        <button className="text-link">Recent Activity</button>
                        <a href="/activity-logs" className="view-all-link">View all →</a>
                    </div>
                    <div className="activity-feed-list">
                        {loading ? (
                            <div className="empty-state">
                                <Loader2 size={22} className="spin" />
                                <p>Loading...</p>
                            </div>
                        ) : activityLogs.length === 0 ? (
                            <div className="empty-state">
                                <ClipboardList size={22} />
                                <p>No recent activity</p>
                            </div>
                        ) : (
                            activityLogs.slice(0, 8).map(log => (
                                <div key={log.id} className="activity-feed-item">
                                    <div className="activity-feed-dot bg-primary" />
                                    <div className="activity-feed-content">
                                        <span className="activity-feed-text">{log.description}</span>
                                        <span className="activity-feed-time">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

// ─── Manage Employees Tab (with pagination) ───────────────────────────────────

type EmployeeSubTab = 'employees' | 'leave';

interface ManageEmployeesTabProps {
    employees: RecentEmployee[];
    loading: boolean;
    onSelectEmployee: (emp: RecentEmployee) => void;
    onAddEmployee: () => void;
}

function ManageEmployeesTab({ employees, loading, onSelectEmployee, onAddEmployee }: ManageEmployeesTabProps) {
    const [subTab, setSubTab] = useState<EmployeeSubTab>('employees');
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [leaveLoading, setLeaveLoading] = useState(true);
    const [leaveFilterStatus, setLeaveFilterStatus] = useState<'all' | LeaveStatus>('pending');
    const [leaveFilterRole, setLeaveFilterRole] = useState('');
    const [leaveSearch, setLeaveSearch] = useState('');
    const [leavePage, setLeavePage] = useState(1);
    const [actionModal, setActionModal] = useState<{ request: LeaveRequest; action: 'approve' | 'decline' } | null>(null);
    const [detailModal, setDetailModal] = useState<LeaveRequest | null>(null);

    const adminName = localStorage.getItem('employeeName') ?? 'System Admin';
    const PAGE_SIZE = 7;

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        fetch('/api/leaverequest/get-all-leave-requests', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then((data: any[]) => {
                setLeaveRequests(Array.isArray(data) ? data.map(r => ({
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
                })) : []);
            })
            .catch(() => setLeaveRequests([]))
            .finally(() => setLeaveLoading(false));
    }, []);

    const filteredEmps = employees.filter(emp => {
        const matchSearch = !search || emp.employeeName.toLowerCase().includes(search.toLowerCase()) || emp.employeeNumber.toLowerCase().includes(search.toLowerCase());
        const matchRole = !filterRole || emp.role === filterRole || toDisplayRole(emp.role) === filterRole;
        const matchStatus = !filterStatus || emp.accountStatus === filterStatus;
        return matchSearch && matchRole && matchStatus;
    });
    useEffect(() => { setCurrentPage(1); }, [search, filterRole, filterStatus]);
    const empTotalPages = Math.max(1, Math.ceil(filteredEmps.length / PAGE_SIZE));
    const paginatedEmps = filteredEmps.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const filteredLeave = leaveRequests.filter(r => {
        const matchStatus = leaveFilterStatus === 'all' || r.status === leaveFilterStatus;
        const matchRole = !leaveFilterRole || r.role === leaveFilterRole || toDisplayRole(r.role) === leaveFilterRole;
        const matchSearch = !leaveSearch || r.employeeName.toLowerCase().includes(leaveSearch.toLowerCase()) || r.employeeNumber.toLowerCase().includes(leaveSearch.toLowerCase());
        return matchStatus && matchRole && matchSearch;
    });
    useEffect(() => { setLeavePage(1); }, [leaveFilterStatus, leaveFilterRole, leaveSearch]);
    const sortedLeave = [...filteredLeave].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    const leaveTotalPages = Math.max(1, Math.ceil(sortedLeave.length / PAGE_SIZE));
    const paginatedLeave = sortedLeave.slice((leavePage - 1) * PAGE_SIZE, leavePage * PAGE_SIZE);

    const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;

    const handleLeaveConfirm = (id: number, action: 'approve' | 'decline', note: string) => {
        setLeaveRequests(prev => prev.map(r =>
            r.id === id
                ? { ...r, status: action === 'approve' ? 'approved' : 'declined', reviewedBy: adminName, reviewNote: note || undefined }
                : r
        ));
    };

    const getPageNumbers = (total: number, current: number) => {
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
    };

    return (
        <div className="dashboard-content">
            <div className="card employees-table-card" style={{ minHeight: 520, padding: 0, overflow: 'hidden' }}>

                {/* ── Subtab Bar ── */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
                    {([
                        { key: 'employees' as EmployeeSubTab, label: 'All Employees', icon: <Users size={14} />, badge: undefined },
                        { key: 'leave' as EmployeeSubTab, label: 'Leave Requests', icon: <CalendarDays size={14} />, badge: pendingCount },
                    ]).map(({ key, label, icon, badge }) => (
                        <button
                            key={key}
                            onClick={() => setSubTab(key as EmployeeSubTab)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '13px 16px',
                                fontSize: 13, fontWeight: 500,
                                border: 'none', background: 'none', cursor: 'pointer',
                                borderBottom: `2px solid ${subTab === key ? 'var(--primary)' : 'transparent'}`,
                                color: subTab === key ? 'var(--primary)' : 'var(--text-secondary)',
                                marginBottom: -1,
                            }}
                        >
                            {icon}
                            {label}
                            {badge !== undefined && badge > 0 && (
                                <span style={{
                                    background: subTab === key ? 'rgba(67,24,255,0.12)' : 'rgba(255,181,71,0.2)',
                                    color: subTab === key ? 'var(--primary)' : '#c05c00',
                                    fontSize: 11, fontWeight: 600,
                                    padding: '1px 7px', borderRadius: 999,
                                }}>
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
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    {filteredEmps.length} result{filteredEmps.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="filter-bar">
                                <div className="search-input-wrap">
                                    <Search size={14} className="search-icon" />
                                    <input type="text" placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
                                </div>
                                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                                    <option value="">All Roles</option>
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                    <option value="">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Deactivated">Deactivated</option>
                                </select>
                            </div>
                        </div>
                        <div className="data-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>NAME</th><th>EMPLOYEE NO</th><th>ROLE</th><th>CONTACT</th><th>STATUS</th><th>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={6}><div className="empty-state"><Loader2 size={20} className="spin" /><p>Loading employees…</p></div></td></tr>
                                    ) : paginatedEmps.length === 0 ? (
                                        <tr><td colSpan={6}><div className="empty-state"><Package size={20} /><p>No employees match your filters</p></div></td></tr>
                                    ) : paginatedEmps.map(emp => (
                                        <tr key={emp.employeeNumber} className="clickable-row" onClick={() => onSelectEmployee(emp)}>
                                            <td>
                                                <div className="emp-name-cell">
                                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                                        <div className="emp-avatar">{emp.employeeName.charAt(0).toUpperCase()}</div>
                                                        <span style={{
                                                            position: 'absolute', bottom: 1, right: 1,
                                                            width: 9, height: 9, borderRadius: '50%',
                                                            background: emp.presenceStatus === 'Online' ? '#05cd99' : '#a3aed0',
                                                            border: '2px solid var(--bg-primary, #fff)',
                                                            display: 'block'
                                                        }} title={emp.presenceStatus ?? 'Offline'} />
                                                    </div>
                                                    {emp.employeeName}
                                                </div>
                                            </td>
                                            <td>{emp.employeeNumber}</td>
                                            <td>{emp.role ? toDisplayRole(emp.role) : <span className="no-role">—</span>}</td>
                                            <td>{emp.contactNumber}</td>
                                            <td>
                                                <span className={`status-badge ${(emp.accountStatus ?? 'active').toLowerCase()}`}>
                                                    {emp.accountStatus ?? 'Active'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-xs" onClick={e => { e.stopPropagation(); onSelectEmployee(emp); }}>
                                                    <Pencil size={11} /> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!loading && filteredEmps.length > 0 && (
                            <div className="pagination-bar">
                                <span className="pagination-info">
                                    Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredEmps.length)}–{Math.min(currentPage * PAGE_SIZE, filteredEmps.length)} of {filteredEmps.length}
                                </span>
                                <div className="pagination-controls">
                                    <button className="page-btn page-btn-nav" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={15} /></button>
                                    {getPageNumbers(empTotalPages, currentPage).map((p, i) =>
                                        p === '...' ? <span key={`e-${i}`} className="page-ellipsis">…</span> :
                                            <button key={p} className={`page-btn${currentPage === p ? ' active' : ''}`} onClick={() => setCurrentPage(p as number)}>{p}</button>
                                    )}
                                    <button className="page-btn page-btn-nav" onClick={() => setCurrentPage(p => Math.min(empTotalPages, p + 1))} disabled={currentPage === empTotalPages}><ChevronRight size={15} /></button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ══ LEAVE REQUESTS PANE ══ */}
                {subTab === 'leave' && (
                    <>
                        <div style={{ padding: '16px 20px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    {filteredLeave.length} result{filteredLeave.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="filter-bar">
                                <div className="search-input-wrap">
                                    <Search size={14} className="search-icon" />
                                    <input type="text" placeholder="Search by name or ID…" value={leaveSearch} onChange={e => setLeaveSearch(e.target.value)} className="search-input" />
                                </div>
                                <select value={leaveFilterStatus} onChange={e => setLeaveFilterStatus(e.target.value as any)}>
                                    <option value="pending">Pending</option>
                                    <option value="all">All Statuses</option>
                                    <option value="approved">Approved</option>
                                    <option value="declined">Declined</option>
                                </select>
                                <select value={leaveFilterRole} onChange={e => setLeaveFilterRole(e.target.value)}>
                                    <option value="">All Roles</option>
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="data-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>EMPLOYEE</th><th>LEAVE TYPE</th><th>DATES</th><th>DURATION</th><th>SUBMITTED</th><th>STATUS</th><th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaveLoading ? (
                                        <tr><td colSpan={7}><div className="empty-state"><Loader2 size={20} className="spin" /><p>Loading requests…</p></div></td></tr>
                                    ) : paginatedLeave.length === 0 ? (
                                        <tr><td colSpan={7}><div className="empty-state"><Package size={20} /><p>No leave requests match your filters</p></div></td></tr>
                                    ) : paginatedLeave.map(r => {
                                        const days = calcDays(r.startDate, r.endDate);
                                        const meta = LEAVE_STATUS_META[r.status];
                                        return (
                                            <tr key={r.id} className="clickable-row" onClick={() => setDetailModal(r)}>
                                                <td>
                                                    <div className="emp-name-cell">
                                                        <div className="emp-avatar">{r.employeeName.charAt(0).toUpperCase()}</div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.employeeName}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.employeeNumber}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: 13 }}>{LEAVE_TYPE_LABELS[r.leaveType]}</td>
                                                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(r.startDate)}<br />{fmtDate(r.endDate)}</td>
                                                <td style={{ fontSize: 13, fontWeight: 600 }}>{days} {days === 1 ? 'day' : 'days'}</td>
                                                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(r.submittedAt)}</td>
                                                <td>
                                                    <span className={`status-badge ${r.status === 'approved' ? 'active' : r.status === 'declined' ? 'deactivated' : 'pending-badge'}`}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                        {meta.icon}{meta.label}
                                                    </span>
                                                </td>
                                                <td onClick={e => e.stopPropagation()}>
                                                    {r.status === 'pending' ? (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button
                                                                className="btn btn-xs"
                                                                style={{ background: 'rgba(5,205,153,0.12)', color: '#05cd99', border: '1px solid rgba(5,205,153,0.3)', fontWeight: 600 }}
                                                                onClick={() => setActionModal({ request: r, action: 'approve' })}
                                                            >
                                                                <CheckCircle2 size={11} /> Approve
                                                            </button>
                                                            <button className="btn btn-xs btn-danger" onClick={() => setActionModal({ request: r, action: 'decline' })}>
                                                                <X size={11} /> Decline
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                            {r.status === 'approved' ? `By ${r.reviewedBy ?? 'Admin'}` : 'Declined'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {!leaveLoading && filteredLeave.length > 0 && (
                            <div className="pagination-bar">
                                <span className="pagination-info">
                                    Showing {Math.min((leavePage - 1) * PAGE_SIZE + 1, filteredLeave.length)}–{Math.min(leavePage * PAGE_SIZE, filteredLeave.length)} of {filteredLeave.length}
                                </span>
                                <div className="pagination-controls">
                                    <button className="page-btn page-btn-nav" onClick={() => setLeavePage(p => Math.max(1, p - 1))} disabled={leavePage === 1}><ChevronLeft size={15} /></button>
                                    {getPageNumbers(leaveTotalPages, leavePage).map((p, i) =>
                                        p === '...' ? <span key={`l-${i}`} className="page-ellipsis">…</span> :
                                            <button key={p} className={`page-btn${leavePage === p ? ' active' : ''}`} onClick={() => setLeavePage(p as number)}>{p}</button>
                                    )}
                                    <button className="page-btn page-btn-nav" onClick={() => setLeavePage(p => Math.min(leaveTotalPages, p + 1))} disabled={leavePage === leaveTotalPages}><ChevronRight size={15} /></button>
                                </div>
                            </div>
                        )}

                        {/* ── Leave Detail Modal ── */}
                        {detailModal && (
                            <div className="modal-overlay" onClick={() => setDetailModal(null)}>
                                <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                                    <div className="modal-header">
                                        <div>
                                            <h3>Leave Request Detail</h3>
                                            <p className="modal-subtitle">Full details for this request</p>
                                        </div>
                                        <button className="icon-btn" onClick={() => setDetailModal(null)}><X size={16} /></button>
                                    </div>
                                    <div className="employee-detail-avatar" style={{ marginBottom: 16 }}>
                                        <div className="avatar-circle large">{detailModal.employeeName.charAt(0).toUpperCase()}</div>
                                        <div className="avatar-info">
                                            <h4>{detailModal.employeeName}</h4>
                                            <div className="avatar-meta" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                                {detailModal.employeeNumber} · {toDisplayRole(detailModal.role)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="detail-grid">
                                        {[
                                            { label: 'Leave Type', value: LEAVE_TYPE_LABELS[detailModal.leaveType] },
                                            { label: 'Duration', value: `${calcDays(detailModal.startDate, detailModal.endDate)} days` },
                                            { label: 'Start Date', value: fmtDate(detailModal.startDate) },
                                            { label: 'End Date', value: fmtDate(detailModal.endDate) },
                                            { label: 'Submitted', value: fmtDate(detailModal.submittedAt) },
                                            { label: 'Status', value: LEAVE_STATUS_META[detailModal.status].label },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="detail-item">
                                                <span className="detail-label">{label}</span>
                                                <span className="detail-value">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="detail-item" style={{ margin: '12px 0' }}>
                                        <span className="detail-label">Reason</span>
                                        <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{detailModal.reason}</span>
                                    </div>
                                    {detailModal.reviewNote && (
                                        <div style={{ background: detailModal.status === 'approved' ? 'rgba(5,205,153,0.08)' : 'rgba(238,93,80,0.08)', border: `1px solid ${detailModal.status === 'approved' ? 'rgba(5,205,153,0.25)' : 'rgba(238,93,80,0.25)'}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>
                                            <strong>Review Note:</strong> {detailModal.reviewNote}
                                        </div>
                                    )}
                                    <div className="modal-actions">
                                        {detailModal.status === 'pending' ? (
                                            <>
                                                <button className="btn btn-danger" onClick={() => { setDetailModal(null); setActionModal({ request: detailModal, action: 'decline' }); }}><X size={13} /> Decline</button>
                                                <button className="btn btn-primary" onClick={() => { setDetailModal(null); setActionModal({ request: detailModal, action: 'approve' }); }}><CheckCircle2 size={13} /> Approve</button>
                                            </>
                                        ) : (
                                            <button className="btn" onClick={() => setDetailModal(null)}>Close</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Action Confirm Modal ── */}
                        {actionModal && (
                            <LeaveActionModal
                                request={actionModal.request}
                                action={actionModal.action}
                                onClose={() => setActionModal(null)}
                                onConfirm={handleLeaveConfirm}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
    const employeeId = localStorage.getItem('employeeId') ?? '';
    const employeeName = localStorage.getItem('employeeName') ?? '';
    const employeeContact = localStorage.getItem('contactNumber') ?? '';

    // ── Password Gate ──
    const [passwordGate, setPasswordGate] = useState(false);
    const [gatePassword, setGatePassword] = useState('');
    const [gateError, setGateError] = useState('');
    const [gateLoading, setGateLoading] = useState(false);
    const [showGatePassword, setShowGatePassword] = useState(false);
    const [pendingEdit, setPendingEdit] = useState<'profile' | null>(null);

    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ employeeName, contactNumber: employeeContact });
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

    // ── Open gate before allowing profile edit ──
    const requestEditProfile = () => {
        setGatePassword('');
        setGateError('');
        setShowGatePassword(false);
        setPendingEdit('profile');
        setPasswordGate(true);
    };

    const handleGateConfirm = async () => {
        if (!gatePassword) { setGateError('Please enter your password.'); return; }
        setGateLoading(true);
        setGateError('');
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/systemadmin/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password: gatePassword }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Incorrect password. Please try again.');
            }
            setPasswordGate(false);
            setGatePassword('');
            if (pendingEdit === 'profile') {
                setEditingProfile(true);
                setProfileSuccess(false);
            }
        } catch (err: any) {
            setGateError(err.message ?? 'Incorrect password. Please try again.');
        } finally {
            setGateLoading(false);
        }
    };

    const handleProfileChange = (key: keyof typeof profileForm) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setProfileForm(prev => ({ ...prev, [key]: e.target.value }));
            setProfileError('');
            setProfileSuccess(false);
        };

    const handleProfileSave = async () => {
        if (!profileForm.employeeName.trim()) { setProfileError('Full name is required.'); return; }
        if (profileForm.contactNumber && !/^[0-9+\-\s()]{7,20}$/.test(profileForm.contactNumber.trim())) {
            setProfileError('Enter a valid contact number.'); return;
        }
        setProfileSaving(true);
        setProfileError('');
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(
                `/api/systemadmin/update-user?employeeNumber=${encodeURIComponent(employeeId)}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ employeeNumber: employeeId, employeeName: profileForm.employeeName.trim(), contactNumber: profileForm.contactNumber.trim() }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Profile update failed.');
            }
            localStorage.setItem('employeeName', profileForm.employeeName.trim());
            localStorage.setItem('contactNumber', profileForm.contactNumber.trim());
            setProfileSuccess(true);
            setEditingProfile(false);
        } catch (err: any) {
            setProfileError(err.message ?? 'Something went wrong.');
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePwChange = (key: keyof typeof pwForm) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setPwForm(prev => ({ ...prev, [key]: e.target.value }));
            setPwError('');
        };

    const handlePwSave = async () => {
        if (!pwForm.current) { setPwError('Current password is required.'); return; }
        if (pwForm.next.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
        if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
        setPwSaving(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/systemadmin/change-password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Password update failed.');
            }
            alert('Password changed successfully!');
            setEditingPassword(false);
            setPwForm({ current: '', next: '', confirm: '' });
        } catch (err: any) {
            setPwError(err.message ?? 'Something went wrong.');
        } finally {
            setPwSaving(false);
        }
    };

    const displayName = profileForm.employeeName || employeeName || 'System Admin';
    const displayContact = profileForm.contactNumber || employeeContact;

    return (
        <div className="dashboard-content">

            {/* ── Password Gate Modal ── */}
            {passwordGate && (
                <div className="modal-overlay" onClick={() => setPasswordGate(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <div>
                                <h3>Confirm Your Identity</h3>
                                <p className="modal-subtitle">Enter your password to edit your profile.</p>
                            </div>
                            <button className="icon-btn" onClick={() => setPasswordGate(false)} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 16px', gap: 8 }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: '50%',
                                background: 'rgba(67,24,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Lock size={22} color="var(--primary)" />
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                                For your security, please verify your identity before making changes.
                            </p>
                        </div>

                        {gateError && (
                            <div className="form-api-error" style={{ marginBottom: 12 }}>
                                <AlertCircle size={14} /><span>{gateError}</span>
                            </div>
                        )}

                        <div className="field" style={{ marginBottom: 20 }}>
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showGatePassword ? 'text' : 'password'}
                                    value={gatePassword}
                                    onChange={e => { setGatePassword(e.target.value); setGateError(''); }}
                                    onKeyDown={e => e.key === 'Enter' && handleGateConfirm()}
                                    placeholder="Enter your current password"
                                    style={{ paddingRight: 40, width: '100%' }}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowGatePassword(p => !p)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                                    tabIndex={-1}
                                >
                                    {showGatePassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn" onClick={() => setPasswordGate(false)} disabled={gateLoading}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleGateConfirm} disabled={gateLoading || !gatePassword}>
                                {gateLoading
                                    ? <><Loader2 size={13} className="spin" /> Verifying…</>
                                    : <><Shield size={13} /> Confirm</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1.5fr' }}>

                {/* ── Profile Card ── */}
                <div className="card">
                    <div className="card-header">
                        <h3>My Profile</h3>
                        {!editingProfile && (
                            <button
                                className="btn btn-primary"
                                style={{ fontSize: 12, padding: '6px 14px', width: 'fit-content', flexShrink: 0, marginLeft: 'auto' }}
                                onClick={requestEditProfile} // ← gate instead of direct edit
                            >
                                <Pencil size={12} /> Edit Profile
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 16px', gap: 10 }}>
                        <div
                            className="avatar-circle large"
                            style={{ width: 72, height: 72, fontSize: 28, background: 'linear-gradient(135deg, #4318ff, #6a5cff)', boxShadow: '0 8px 20px rgba(67,24,255,0.28)' }}
                        >
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{displayName}</h4>
                            <span className="status-badge active" style={{ marginTop: 6, display: 'inline-block' }}>Active</span>
                        </div>
                    </div>
                    {profileSuccess && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(5,205,153,0.1)', border: '1px solid rgba(5,205,153,0.25)', borderRadius: 10, marginBottom: 12, fontSize: 13, color: '#05cd99', fontWeight: 600 }}>
                            <CheckCircle2 size={14} /> Profile updated successfully!
                        </div>
                    )}
                    {editingProfile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {profileError && <div className="form-api-error"><AlertCircle size={14} /><span>{profileError}</span></div>}
                            <div className="field">
                                <label>Full Name</label>
                                <input type="text" value={profileForm.employeeName} onChange={handleProfileChange('employeeName')} placeholder="Enter full name" />
                            </div>
                            <div className="field">
                                <label>Contact Number</label>
                                <input type="tel" value={profileForm.contactNumber} onChange={handleProfileChange('contactNumber')} placeholder="e.g. +63 917 000 0000" />
                            </div>
                            <div className="detail-grid" style={{ marginTop: 4 }}>
                                <div className="detail-item">
                                    <span className="detail-label">Employee ID</span>
                                    <span className="detail-value">{employeeId || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Role</span>
                                    <span className="detail-value">System Admin</span>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ padding: '4px 0 0' }}>
                                <button className="btn" onClick={() => { setEditingProfile(false); setProfileError(''); setProfileForm({ employeeName, contactNumber: employeeContact }); }} disabled={profileSaving}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleProfileSave} disabled={profileSaving}>
                                    {profileSaving ? <><Loader2 size={13} className="spin" /> Saving…</> : <><Save size={13} /> Save Changes</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="detail-grid" style={{ marginTop: 4 }}>
                            <div className="detail-item">
                                <span className="detail-label"><Hash size={11} style={{ display: 'inline', marginRight: 4 }} />Employee ID</span>
                                <span className="detail-value">{employeeId || '—'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label"><UserCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} />Full Name</span>
                                <span className="detail-value">{displayName}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label"><Shield size={11} style={{ display: 'inline', marginRight: 4 }} />Role</span>
                                <span className="detail-value">System Admin</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label"><Phone size={11} style={{ display: 'inline', marginRight: 4 }} />Contact</span>
                                <span className="detail-value">{displayContact || '—'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Security Card ── (unchanged) */}
                <div className="card">
                    <div className="card-header">
                        <h3>Security Settings</h3>
                        {!editingPassword && (
                            <button
                                className="btn btn-primary"
                                style={{ fontSize: 12, padding: '6px 14px', width: 'fit-content', flexShrink: 0, marginLeft: 'auto' }}
                                onClick={() => setEditingPassword(true)}
                            >
                                <Lock size={12} /> Change Password
                            </button>
                        )}
                    </div>
                    {!editingPassword ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
                            <div className="system-status-item" style={{ cursor: 'default' }}>
                                <div className="system-icon bg-success"><CheckCircle2 size={16} /></div>
                                <div className="system-info">
                                    <span className="system-name">Password</span>
                                    <span className="system-detail">Last updated recently</span>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#05cd99', background: 'rgba(5,205,153,0.12)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Secure</span>
                            </div>
                            <div style={{ height: 1, background: 'var(--border)' }} />
                            <div className="system-status-item" style={{ cursor: 'default' }}>
                                <div className="system-icon bg-primary"><Shield size={16} /></div>
                                <div className="system-info">
                                    <span className="system-name">Role Permissions</span>
                                    <span className="system-detail">Full system access granted</span>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'rgba(67,24,255,0.1)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Admin</span>
                            </div>
                            <div style={{ height: 1, background: 'var(--border)' }} />
                            <div className="system-status-item" style={{ cursor: 'default' }}>
                                <div className="system-icon bg-warning"><AlertCircle size={16} /></div>
                                <div className="system-info">
                                    <span className="system-name">Active Session</span>
                                    <span className="system-detail">Logged in on this device</span>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#ffb547', background: 'rgba(255,181,71,0.15)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Live</span>
                            </div>
                        </div>
                    ) : (
                        <div className="modal-form" style={{ padding: '4px 0 0' }}>
                            {pwError && <div className="form-api-error" style={{ marginBottom: 8 }}><AlertCircle size={14} /><span>{pwError}</span></div>}
                            <div className="field">
                                <label>Current Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showCurrent ? 'text' : 'password'} value={pwForm.current} onChange={handlePwChange('current')} placeholder="Enter current password" style={{ paddingRight: 40, width: '100%' }} />
                                    <button type="button" onClick={() => setShowCurrent(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} tabIndex={-1}>
                                        {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                            <div className="field">
                                <label>New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showNext ? 'text' : 'password'} value={pwForm.next} onChange={handlePwChange('next')} placeholder="At least 6 characters" style={{ paddingRight: 40, width: '100%' }} />
                                    <button type="button" onClick={() => setShowNext(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} tabIndex={-1}>
                                        {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {pwForm.next.length > 0 && (
                                    <div style={{ marginTop: 6 }}>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {[1, 2, 3].map(level => (
                                                <div key={level} style={{ flex: 1, height: 4, borderRadius: 2, background: pwForm.next.length >= level * 4 ? level === 1 ? '#ee5d50' : level === 2 ? '#ffb547' : '#05cd99' : '#e9edf7', transition: 'background 0.2s' }} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>
                                            {pwForm.next.length < 4 ? 'Weak' : pwForm.next.length < 8 ? 'Fair' : 'Strong'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="field">
                                <label>Confirm New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showConfirm ? 'text' : 'password'} value={pwForm.confirm} onChange={handlePwChange('confirm')} placeholder="Re-enter new password" style={{ paddingRight: 40, width: '100%' }} />
                                    <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} tabIndex={-1}>
                                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {pwForm.confirm.length > 0 && pwForm.next !== pwForm.confirm && (
                                    <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3, display: 'block' }}>Passwords do not match</span>
                                )}
                                {pwForm.confirm.length > 0 && pwForm.next === pwForm.confirm && (
                                    <span style={{ fontSize: 11, color: '#05cd99', marginTop: 3, display: 'block' }}>✓ Passwords match</span>
                                )}
                            </div>
                            <div className="modal-actions" style={{ padding: '4px 0 0' }}>
                                <button className="btn" onClick={() => { setEditingPassword(false); setPwError(''); setPwForm({ current: '', next: '', confirm: '' }); }} disabled={pwSaving}>Cancel</button>
                                <button className="btn btn-primary" onClick={handlePwSave} disabled={pwSaving}>
                                    {pwSaving ? <><Loader2 size={13} className="spin" /> Saving…</> : <><Save size={13} /> Update Password</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Account Overview (unchanged) ── */}
            <div className="card">
                <div className="card-header"><h3>Account Overview</h3></div>
                <div className="system-status-list">
                    {[
                        { icon: Users, bg: 'bg-primary', name: 'Manage Employees', detail: 'Register, edit, and deactivate accounts' },
                        { icon: Truck, bg: 'bg-warning', name: 'Delivery Oversight', detail: 'View and manage all deliveries' },
                        { icon: BarChart3, bg: 'bg-success', name: 'Analytics & Reports', detail: 'Access system-wide reports' },
                    ].map(({ icon: Icon, bg, name, detail }) => (
                        <div key={name} className="system-status-item">
                            <div className={`system-icon ${bg}`}><Icon size={16} /></div>
                            <div className="system-info">
                                <span className="system-name">{name}</span>
                                <span className="system-detail">{detail}</span>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#2b3674', background: '#eef2ff', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Full Access</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Leave Management Tab ─────────────────────────────────────────────────────

function LeaveManagementTab() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | LeaveStatus>('pending');
    const [filterRole, setFilterRole] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [actionModal, setActionModal] = useState<{ request: LeaveRequest; action: 'approve' | 'decline' } | null>(null);
    const [detailModal, setDetailModal] = useState<LeaveRequest | null>(null);

    const PAGE_SIZE = 7;
    const adminName = localStorage.getItem('employeeName') ?? 'System Admin';

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        fetch('/api/leave/all', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then((data: any[]) => {
                setRequests(Array.isArray(data) ? data.map(r => ({
                    id: r.id,
                    employeeNumber: r.employeeNumber,
                    employeeName: r.employeeName,
                    role: r.role ?? '',
                    leaveType: r.leaveType,
                    startDate: r.startDate,
                    endDate: r.endDate,
                    reason: r.reason,
                    status: r.status,
                    submittedAt: r.submittedAt,
                    reviewedBy: r.reviewedBy,
                    reviewNote: r.reviewNote,
                })) : []);
            })
            .catch(() => setRequests([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = requests.filter(r => {
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchRole = !filterRole || r.role === filterRole || toDisplayRole(r.role) === filterRole;
        const matchSearch = !search || r.employeeName.toLowerCase().includes(search.toLowerCase()) || r.employeeNumber.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchRole && matchSearch;
    });

    useEffect(() => { setCurrentPage(1); }, [filterStatus, filterRole, search]);

    const sorted = [...filtered].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const approvedCount = requests.filter(r => r.status === 'approved').length;
    const declinedCount = requests.filter(r => r.status === 'declined').length;

    const handleConfirm = (id: number, action: 'approve' | 'decline', note: string) => {
        setRequests(prev => prev.map(r =>
            r.id === id
                ? { ...r, status: action === 'approve' ? 'approved' : 'declined', reviewedBy: adminName, reviewNote: note || undefined }
                : r
        ));
    };

    const getPageNumbers = () => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="dashboard-content">
            <div className="stats-row" style={{ marginBottom: 20 }}>
                {[
                    { icon: Clock, bg: 'bg-warning', label: 'PENDING', value: pendingCount, sub: 'Awaiting review' },
                    { icon: CheckCircle2, bg: 'bg-success', label: 'APPROVED', value: approvedCount, sub: 'Granted this period' },
                    { icon: AlertCircle, bg: 'bg-danger', label: 'DECLINED', value: declinedCount, sub: 'Rejected requests' },
                    { icon: Users, bg: 'bg-primary', label: 'TOTAL', value: requests.length, sub: 'All leave requests' },
                ].map(({ icon: Icon, bg, label, value, sub }) => (
                    <div key={label} className="stat-card">
                        <div className={`stat-icon ${bg}`}><Icon size={18} /></div>
                        <div className="stat-text">
                            <p className="stat-label">{label}</p>
                            <h3 className="stat-value">{value}</h3>
                            <small>{sub}</small>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card employees-table-card" style={{ minHeight: 520 }}>
                <div className="card-header">
                    <h3>Leave Requests</h3>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="filter-bar">
                    <div className="search-input-wrap">
                        <Search size={14} className="search-icon" />
                        <input type="text" placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="declined">Declined</option>
                    </select>
                    <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                        <option value="">All Roles</option>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>EMPLOYEE</th><th>LEAVE TYPE</th><th>DATES</th><th>DURATION</th><th>SUBMITTED</th><th>STATUS</th><th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7}><div className="empty-state"><Loader2 size={20} className="spin" /><p>Loading requests…</p></div></td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={7}><div className="empty-state"><Package size={20} /><p>No leave requests match your filters</p></div></td></tr>
                            ) : paginated.map(r => {
                                const days = calcDays(r.startDate, r.endDate);
                                const meta = LEAVE_STATUS_META[r.status];
                                return (
                                    <tr key={r.id} className="clickable-row" onClick={() => setDetailModal(r)}>
                                        <td>
                                            <div className="emp-name-cell">
                                                <div className="emp-avatar">{r.employeeName.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.employeeName}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.employeeNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 13 }}>{LEAVE_TYPE_LABELS[r.leaveType]}</td>
                                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(r.startDate)}<br />{fmtDate(r.endDate)}</td>
                                        <td style={{ fontSize: 13, fontWeight: 600 }}>{days} {days === 1 ? 'day' : 'days'}</td>
                                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(r.submittedAt)}</td>
                                        <td>
                                            <span className={`status-badge ${r.status === 'approved' ? 'active' : r.status === 'declined' ? 'deactivated' : 'pending-badge'}`}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                {meta.icon}{meta.label}
                                            </span>
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            {r.status === 'pending' ? (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button
                                                        className="btn btn-xs"
                                                        style={{ background: 'rgba(5,205,153,0.12)', color: '#05cd99', border: '1px solid rgba(5,205,153,0.3)', fontWeight: 600 }}
                                                        onClick={() => setActionModal({ request: r, action: 'approve' })}
                                                    >
                                                        <CheckCircle2 size={11} /> Approve
                                                    </button>
                                                    <button className="btn btn-xs btn-danger" onClick={() => setActionModal({ request: r, action: 'decline' })}>
                                                        <X size={11} /> Decline
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                    {r.status === 'approved' ? `By ${r.reviewedBy ?? 'Admin'}` : 'Declined'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {!loading && filtered.length > 0 && (
                    <div className="pagination-bar">
                        <span className="pagination-info">
                            Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </span>
                        <div className="pagination-controls">
                            <button className="page-btn page-btn-nav" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft size={15} /></button>
                            {getPageNumbers().map((p, i) =>
                                p === '...' ? <span key={`ellipsis-${i}`} className="page-ellipsis">…</span> :
                                    <button key={p} className={`page-btn${currentPage === p ? ' active' : ''}`} onClick={() => setCurrentPage(p as number)}>{p}</button>
                            )}
                            <button className="page-btn page-btn-nav" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight size={15} /></button>
                        </div>
                    </div>
                )}
            </div>

            {detailModal && (
                <div className="modal-overlay" onClick={() => setDetailModal(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div className="modal-header">
                            <div>
                                <h3>Leave Request Detail</h3>
                                <p className="modal-subtitle">Full details for this request</p>
                            </div>
                            <button className="icon-btn" onClick={() => setDetailModal(null)}><X size={16} /></button>
                        </div>
                        <div className="employee-detail-avatar" style={{ marginBottom: 16 }}>
                            <div className="avatar-circle large">{detailModal.employeeName.charAt(0).toUpperCase()}</div>
                            <div className="avatar-info">
                                <h4>{detailModal.employeeName}</h4>
                                <div className="avatar-meta" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    {detailModal.employeeNumber} · {toDisplayRole(detailModal.role)}
                                </div>
                            </div>
                        </div>
                        <div className="detail-grid">
                            {[
                                { label: 'Leave Type', value: LEAVE_TYPE_LABELS[detailModal.leaveType] },
                                { label: 'Duration', value: `${calcDays(detailModal.startDate, detailModal.endDate)} days` },
                                { label: 'Start Date', value: fmtDate(detailModal.startDate) },
                                { label: 'End Date', value: fmtDate(detailModal.endDate) },
                                { label: 'Submitted', value: fmtDate(detailModal.submittedAt) },
                                { label: 'Status', value: LEAVE_STATUS_META[detailModal.status].label },
                            ].map(({ label, value }) => (
                                <div key={label} className="detail-item">
                                    <span className="detail-label">{label}</span>
                                    <span className="detail-value">{value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="detail-item" style={{ margin: '12px 0' }}>
                            <span className="detail-label">Reason</span>
                            <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{detailModal.reason}</span>
                        </div>
                        {detailModal.reviewNote && (
                            <div style={{ background: detailModal.status === 'approved' ? 'rgba(5,205,153,0.08)' : 'rgba(238,93,80,0.08)', border: `1px solid ${detailModal.status === 'approved' ? 'rgba(5,205,153,0.25)' : 'rgba(238,93,80,0.25)'}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>
                                <strong>Review Note:</strong> {detailModal.reviewNote}
                            </div>
                        )}
                        <div className="modal-actions">
                            {detailModal.status === 'pending' ? (
                                <>
                                    <button className="btn btn-danger" onClick={() => { setDetailModal(null); setActionModal({ request: detailModal, action: 'decline' }); }}><X size={13} /> Decline</button>
                                    <button className="btn btn-primary" onClick={() => { setDetailModal(null); setActionModal({ request: detailModal, action: 'approve' }); }}><CheckCircle2 size={13} /> Approve</button>
                                </>
                            ) : (
                                <button className="btn" onClick={() => setDetailModal(null)}>Close</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {actionModal && (
                <LeaveActionModal
                    request={actionModal.request}
                    action={actionModal.action}
                    onClose={() => setActionModal(null)}
                    onConfirm={handleConfirm}
                />
            )}
        </div>
    );
}

// ─── Emergency Overrides Tab ──────────────────────────────────────────────────

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

function EmergencyOverridesTab() {
    const [overrides, setOverrides] = useState<EmergencyOverride[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'All' | OverrideStatus>('Pending');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [actionModal, setActionModal] = useState<{ override: EmergencyOverride; action: 'Approved' | 'Rejected' } | null>(null);
    const [overrideUntil, setOverrideUntil] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState('');

    const PAGE_SIZE = 7;

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        fetch('/api/emergency_override_controls/all-requests', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then((data: any[]) => {
                setOverrides(Array.isArray(data) ? data.map(o => ({
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
                })) : []);
            })
            .catch(() => setOverrides([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = overrides.filter(o => {
        const matchStatus = filterStatus === 'All' || o.status === filterStatus;
        const matchSearch = !search || o.employeeName.toLowerCase().includes(search.toLowerCase()) || o.employeeNumber.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    useEffect(() => { setCurrentPage(1); }, [filterStatus, search]);

    const sorted = [...filtered].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const pendingCount = overrides.filter(o => o.status === 'Pending').length;
    const approvedCount = overrides.filter(o => o.status === 'Approved').length;
    const rejectedCount = overrides.filter(o => o.status === 'Rejected').length;

    const handleAction = async () => {
        if (!actionModal) return;
        if (actionModal.action === 'Approved' && !overrideUntil) {
            setActionError('Please set an override expiry date and time.');
            return;
        }
        setSubmitting(true);
        setActionError('');
        try {
            const token = localStorage.getItem('authToken');
            const isApprove = actionModal.action === 'Approved';
            const endpoint = isApprove ? '/api/emergency_override_controls/approve' : '/api/emergency_override_controls/decline';
            const body = isApprove
                ? { emergencyOverrideId: actionModal.override.emergencyOverrideId, status: actionModal.action, overrideUntil: new Date(overrideUntil).toISOString() }
                : { emergencyOverrideId: actionModal.override.emergencyOverrideId };
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Action failed.');
            }
            setOverrides(prev => prev.map(o =>
                o.emergencyOverrideId === actionModal.override.emergencyOverrideId
                    ? { ...o, status: actionModal.action, overrideUntil: overrideUntil || undefined }
                    : o
            ));
            setActionModal(null);
            setOverrideUntil('');
            setNote('');
        } catch (err: any) {
            setActionError(err.message ?? 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    const getPageNumbers = () => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
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
                    { icon: ShieldAlert, bg: 'bg-primary', label: 'TOTAL', value: overrides.length, sub: 'All override requests' },
                ].map(({ icon: Icon, bg, label, value, sub }) => (
                    <div key={label} className="stat-card">
                        <div className={`stat-icon ${bg}`}><Icon size={18} /></div>
                        <div className="stat-text">
                            <p className="stat-label">{label}</p>
                            <h3 className="stat-value">{value}</h3>
                            <small>{sub}</small>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card employees-table-card" style={{ minHeight: 520 }}>
                <div className="card-header">
                    <h3>Emergency Override Requests</h3>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="filter-bar">
                    <div className="search-input-wrap">
                        <Search size={14} className="search-icon" />
                        <input type="text" placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                        <option value="Pending">Pending</option>
                        <option value="All">All Statuses</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>EMPLOYEE</th><th>REASON</th><th>REQUESTED</th><th>OVERRIDE UNTIL</th><th>STATUS</th><th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6}><div className="empty-state"><Loader2 size={20} className="spin" /><p>Loading requests…</p></div></td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={6}><div className="empty-state"><ShieldAlert size={20} /><p>No override requests match your filters</p></div></td></tr>
                            ) : paginated.map(o => {
                                const meta = statusMeta[o.status];
                                return (
                                    <tr key={o.emergencyOverrideId}>
                                        <td>
                                            <div className="emp-name-cell">
                                                <div className="emp-avatar">{o.employeeName.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{o.employeeName}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{o.employeeNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 13, maxWidth: 200 }}>
                                            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {o.reason}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(o.requestedAt).toLocaleString()}</td>
                                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.overrideUntil ? new Date(o.overrideUntil).toLocaleString() : '—'}</td>
                                        <td>
                                            <span className={`status-badge ${meta.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                {meta.icon}{meta.label}
                                            </span>
                                        </td>
                                        <td>
                                            {o.status === 'Pending' ? (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button
                                                        className="btn btn-xs"
                                                        style={{ background: 'rgba(5,205,153,0.12)', color: '#05cd99', border: '1px solid rgba(5,205,153,0.3)', fontWeight: 600 }}
                                                        onClick={() => { setActionModal({ override: o, action: 'Approved' }); setOverrideUntil(''); setNote(''); setActionError(''); }}
                                                    >
                                                        <CheckCircle2 size={11} /> Approve
                                                    </button>
                                                    <button className="btn btn-xs btn-danger" onClick={() => { setActionModal({ override: o, action: 'Rejected' }); setOverrideUntil(''); setNote(''); setActionError(''); }}>
                                                        <X size={11} /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                    {o.status === 'Approved' ? 'Access granted' : 'Access denied'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {!loading && filtered.length > 0 && (
                    <div className="pagination-bar">
                        <span className="pagination-info">
                            Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </span>
                        <div className="pagination-controls">
                            <button className="page-btn page-btn-nav" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft size={15} /></button>
                            {getPageNumbers().map((p, i) =>
                                p === '...' ? <span key={`e-${i}`} className="page-ellipsis">…</span> :
                                    <button key={p} className={`page-btn${currentPage === p ? ' active' : ''}`} onClick={() => setCurrentPage(p as number)}>{p}</button>
                            )}
                            <button className="page-btn page-btn-nav" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight size={15} /></button>
                        </div>
                    </div>
                )}
            </div>

            {actionModal && (
                <div className="modal-overlay" onClick={() => setActionModal(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
                        <div className="modal-header">
                            <div>
                                <h3>{actionModal.action === 'Approved' ? 'Approve Override Request' : 'Reject Override Request'}</h3>
                                <p className="modal-subtitle">
                                    {actionModal.action === 'Approved'
                                        ? 'Set how long the employee can access the system.'
                                        : 'Confirm rejection of this emergency override request.'}
                                </p>
                            </div>
                            <button className="icon-btn" onClick={() => setActionModal(null)}><X size={16} /></button>
                        </div>
                        <div style={{ background: 'var(--bg-secondary, #f8f9fc)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid var(--border)', fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Employee</span>
                                <strong>{actionModal.override.employeeName}</strong>
                            </div>
                            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Reason</span>
                                <span style={{ maxWidth: 260, textAlign: 'right' }}>{actionModal.override.reason}</span>
                            </div>
                        </div>
                        {actionModal.action === 'Approved' && (
                            <div className="field" style={{ marginBottom: 16 }}>
                                <label>Override Access Until</label>
                                <input type="datetime-local" value={overrideUntil} onChange={e => { setOverrideUntil(e.target.value); setActionError(''); }} min={new Date().toISOString().slice(0, 16)} />
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                                    The employee's access will automatically expire at this time.
                                </span>
                            </div>
                        )}
                        {actionError && (
                            <div className="form-api-error" style={{ marginBottom: 12 }}>
                                <AlertCircle size={14} /><span>{actionError}</span>
                            </div>
                        )}
                        <div className="modal-actions">
                            <button className="btn" onClick={() => setActionModal(null)} disabled={submitting}>Cancel</button>
                            <button className={`btn ${actionModal.action === 'Approved' ? 'btn-primary' : 'btn-danger'}`} onClick={handleAction} disabled={submitting}>
                                {submitting
                                    ? <><Loader2 size={13} className="spin" /> Processing…</>
                                    : actionModal.action === 'Approved'
                                        ? <><CheckCircle2 size={13} /> Approve Access</>
                                        : <><X size={13} /> Reject Request</>
                                }
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
    const employeeId = localStorage.getItem('employeeId') ?? '';
    const employeeName = localStorage.getItem('employeeName') ?? '';

    const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<RecentEmployee | null>(null);
    const [selectedPanelEmployee, setSelectedPanelEmployee] = useState<RecentEmployee | null>(null);

    const [employees, setEmployees] = useState<RecentEmployee[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [recentEmployees, setRecentEmployees] = useState<RecentEmployee[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEmployees = () => {
        const token = localStorage.getItem('authToken');
        fetch('/api/systemadmin/recent-employees', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then(data => {
                const list: RecentEmployee[] = Array.isArray(data)
                    ? data
                        .map((e: any) => ({
                            employeeNumber: e.employeeNumber,
                            employeeName: e.employeeName,
                            contactNumber: e.contactNumber,
                            role: e.role,
                            accountStatus: e.accountStatus ?? 'Unknown',
                            presenceStatus: e.presenceStatus ?? 'Offline',
                        }))
                        .filter((e: RecentEmployee) => e.accountStatus !== 'Deleted')
                    : [];
                setEmployees(list);
                setRecentEmployees(list);
            })
            .catch(err => { setEmployees([]); setRecentEmployees([]); console.error('Failed to fetch employees:', err); })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchEmployees();
        const token = localStorage.getItem('authToken');
        fetch('/api/activity-logs/recent', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => { if (!res.ok) return []; return res.json(); })
            .then(data => setActivityLogs(Array.isArray(data) ? data : []))
            .catch(() => setActivityLogs([]));
    }, []);

    const handleLogout = async () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            await fetch('/api/authentication/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            }).catch(() => { });
        }
        ['employeeId', 'refreshToken', 'authToken', 'employeeName', 'contactNumber', 'role']
            .forEach(k => localStorage.removeItem(k));
        navigate('/');
    };

    const handleSelectEmployee = (emp: RecentEmployee) => setSelectedEmployee(emp);

    const handleSelectEmployeeFromManage = (emp: RecentEmployee) => {
        setSelectedPanelEmployee(emp);
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

    const pageTitles: Record<NavTab, string> = {
        dashboard: 'Dashboard',
        employees: 'Employees',
        emergency_override: 'Emergency Override',
        delivery: 'Delivery Summary',
        analytics: 'Analytics View',
        settings: 'Settings',
        activity_logs: 'Activity Logs',
        profile: 'My Profile',
    };

    return (
        <div className="dashboard-container">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/src/assets/SpeedexLogo.jpg" alt="Speedex Logo" className="logo-image" />
                </div>
                <div className="sidebar-role-section">
                    <div className="sidebar-role-badge super-admin">
                        <div className="role-dot-inner" />
                        SUPER ADMIN
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {NAV_GROUPS.map(group => (
                        <div key={group.label} className="nav-section">
                            <div className="nav-section-title">{group.label}</div>
                            {group.items.map(({ tab, icon: Icon, label }) => {
                                const isActive = activeTab === tab;
                                return (
                                    <div
                                        key={tab}
                                        className={`nav-item${isActive ? ' nav-item-active' : ''}`}
                                        onClick={() => {
                                            setActiveTab(tab);
                                            setSelectedPanelEmployee(null);
                                        }}
                                    >
                                        <Icon size={18} />
                                        <span className="nav-item-label">{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>
                <div className="sidebar-footer-profile">
                    <div className="profile-card">
                        <div className="profile-avatar">
                            {getInitials(employeeName || 'Super Admin')}
                        </div>
                        <div className="profile-info">
                            <span className="profile-name">{employeeName || 'Super Admin'}</span>
                            <span className="profile-role">SUPER ADMIN</span>
                        </div>
                        <button className="profile-logout" onClick={handleLogout} title="Logout" aria-label="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="main-viewport">
                {!(activeTab === 'employees' && selectedPanelEmployee) && (
                    <div className="dashboard-header">
                        <div className="header-title">
                            <h2>{pageTitles[activeTab]}</h2>
                            <p>
                                Speedex Courier Inc. —{' '}
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="header-search-wrap">
                                <Search size={14} className="header-search-icon" />
                                <input type="text" className="header-search-input" placeholder="Search employee, task…" />
                            </div>
                            {(activeTab === 'dashboard' || activeTab === 'employees') && (
                                <div className="header-actions">
                                    <button className="quick-action-btn-header" onClick={() => setShowAddModal(true)}>
                                        <Users size={18} />
                                        Add Employee
                                    </button>
                                </div>
                            )}
                            <NotificationBell apiEndpoint="/api/notification/my-notifications" />
                        </div>
                    </div>
                )}

                {activeTab === 'dashboard' && (
                    <DashboardTab
                        employees={employees}
                        recentEmployees={recentEmployees}
                        activityLogs={activityLogs}
                        loading={loading}
                        onSelectEmployee={handleSelectEmployee}
                        onViewAll={() => {
                            setActiveTab('employees');
                            setSelectedPanelEmployee(null);
                        }}
                    />
                )}

                {activeTab === 'employees' && (
                    selectedPanelEmployee ? (
                        <EmployeeDetailPanel
                            employee={selectedPanelEmployee}
                            onBack={() => setSelectedPanelEmployee(null)}
                            onEmployeeUpdated={(updated) => {
                                handleEmployeeUpdated(updated);
                                if (updated.accountStatus === '__deleted__') {
                                    setSelectedPanelEmployee(null);
                                } else {
                                    setSelectedPanelEmployee(updated);
                                }
                            }}
                        />
                    ) : (
                        <ManageEmployeesTab
                            employees={employees}
                            loading={loading}
                            onSelectEmployee={handleSelectEmployeeFromManage}
                            onAddEmployee={() => setShowAddModal(true)}
                        />
                    )
                )}

                {(activeTab === 'profile' || activeTab === 'settings') && <ProfileTab />}

                {activeTab === 'delivery' && (
                    <div className="dashboard-content">
                        <div className="card">
                            <div className="empty-state" style={{ padding: 48 }}>
                                <Truck size={32} />
                                <p>Delivery module coming soon.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="dashboard-content">
                        <div className="card">
                            <div className="empty-state" style={{ padding: 48 }}>
                                <BarChart3 size={32} />
                                <p>Analytics module coming soon.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'emergency_override' && <EmergencyOverridesTab />}

                {activeTab === 'activity_logs' && (
                    <div className="dashboard-content">
                        <div className="card">
                            <div className="card-header">
                                <h3>System Activity Logs</h3>
                            </div>
                            {activityLogs.length === 0 ? (
                                <div className="empty-state" style={{ padding: 48 }}>
                                    <Activity size={32} />
                                    <p>No activity logs found.</p>
                                </div>
                            ) : (
                                <div className="data-table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>DESCRIPTION</th>
                                                <th>TIMESTAMP</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activityLogs.map(log => (
                                                <tr key={log.id}>
                                                    <td className="cell-name">{log.description}</td>
                                                    <td className="cell-muted">{new Date(log.timestamp).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* ── Modals ── */}
            {showAddModal && (
                <AddEmployeeModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={newEmp => {
                        setEmployees(prev => [newEmp, ...prev]);
                        setRecentEmployees(prev => [newEmp, ...prev]);
                    }}
                />
            )}

            {selectedEmployee && (
                <EmployeeDetailModal
                    employee={selectedEmployee}
                    onClose={() => setSelectedEmployee(null)}
                    onUpdated={handleEmployeeUpdated}
                />
            )}
        </div>
    );
}