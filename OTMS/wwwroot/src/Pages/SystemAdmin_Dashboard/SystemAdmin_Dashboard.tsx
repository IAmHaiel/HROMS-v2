import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './SystemAdmin_Dashboard.css';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmployeeRegisterDTO {
    employeeNumber: string;
    employeeName: string;
    contactNumber: string;
    role: string;
}

interface FieldError {
    employeeNumber?: string;
    employeeName?: string;
    contactNumber?: string;
    role?: string;
}

type FormState = EmployeeRegisterDTO;

interface ActivityLog {
    id: number;
    description: string;
    timestamp: string;
}

// Matches backend RecentEmployeesResponseDTO exactly
interface RecentEmployee {
    employeeNumber: string;
    employeeName: string;
    contactNumber: string;
    role: string;
    accountStatus: string; // ✅ matches backend field name (not 'status')
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
    'System Admin',
    'Operation Admin',
    'Operation Team',
    'Warehouse Staff',
    'Delivery Driver',
    'Dispatcher',
];

const DAILY_DELIVERIES = [
    { day: 'Mon', weekday: 30, peak: 10 },
    { day: 'Tue', weekday: 25, peak: 15 },
    { day: 'Wed', weekday: 40, peak: 20 },
    { day: 'Thu', weekday: 35, peak: 12 },
    { day: 'Fri', weekday: 50, peak: 25 },
    { day: 'Sat', weekday: 20, peak: 8 },
    { day: 'Sun', weekday: 15, peak: 5 },
];

const EMPTY_FORM: FormState = {
    employeeNumber: '',
    employeeName: '',
    contactNumber: '',
    role: '',
};

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Package, label: 'Manage' },
    { icon: Truck, label: 'Delivery' },
    { icon: BarChart3, label: 'Analytics' },
    { icon: UserCircle2, label: 'Profile' },
];

const STAT_CARDS = [
    { icon: Users, bg: 'bg-primary', label: 'TOTAL EMPLOYEES', sub: 'Current active staff' },
    { icon: ClipboardList, bg: 'bg-warning', label: 'ACTIVE TASKS', sub: 'Pending & In Transit' },
    { icon: CheckCircle2, bg: 'bg-success', label: 'TASKS COMPLETED', sub: 'Total successful deliveries' },
    { icon: AlertCircle, bg: 'bg-danger', label: 'LOCKED ACCOUNTS', sub: 'Needs admin action' },
];

const SYSTEM_STATUS_ITEMS = [
    { icon: Users, bg: 'bg-primary', name: 'Operation System', detail: 'employees active', uptime: '99.9%' },
    { icon: ClipboardList, bg: 'bg-danger', name: 'Delivery Management', detail: 'total orders', uptime: '99.7%' },
    { icon: Package, bg: 'bg-success', name: 'Delivery Tracker', detail: 'active shipments', uptime: '98.2%' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validate(form: FormState): FieldError {
    const errs: FieldError = {};

    if (!form.employeeNumber.trim()) errs.employeeNumber = 'Employee number is required.';
    if (!form.employeeName.trim()) errs.employeeName = 'Full name is required.';

    if (!form.contactNumber.trim()) {
        errs.contactNumber = 'Contact number is required.';
    } else if (!/^[0-9+\-\s()]{7,20}$/.test(form.contactNumber.trim())) {
        errs.contactNumber = 'Enter a valid contact number.';
    }

    if (!form.role) errs.role = 'Please select a role.';

    return errs;
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

    const handleChange =
        (key: keyof FormState) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                setForm(prev => ({ ...prev, [key]: e.target.value }));
                setErrors(prev => ({ ...prev, [key]: undefined }));
                setApiError('');
            };

    const handleSubmit = async () => {
        if (submitting) return;

        const errs = validate(form);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setSubmitting(true);
        setApiError('');

        try {
            const token = localStorage.getItem('authToken');

            const payload: EmployeeRegisterDTO = {
                employeeNumber: form.employeeNumber.trim(),
                employeeName: form.employeeName.trim(),
                contactNumber: form.contactNumber.trim(),
                role: form.role,
            };

            const res = await fetch('/api/authorization/systemadmin/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${res.status}: Registration failed`);
            }

            const data = await res.json();

            alert(
                `Employee account created successfully!\n\n` +
                `Employee Number: ${data.employeeNumber}\n` +
                `Generated Password: ${data.generatedPassword}\n\n` +
                `Save this password. It will not be shown again.`
            );

            onSuccess({
                employeeNumber: data.employeeNumber,
                employeeName: data.employeeName,
                contactNumber: payload.contactNumber,
                role: data.role,
                accountStatus: 'Active', // ✅ newly registered accounts are always Active
            });

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
                        <h3>Add New Employee</h3>
                        <p className="modal-subtitle">Fill in the details to register a new employee account.</p>
                    </div>
                    <button className="icon-btn" onClick={onClose} aria-label="Close">
                        <X size={16} />
                    </button>
                </div>

                {apiError && (
                    <div className="form-api-error">
                        <AlertCircle size={14} />
                        <span>{apiError}</span>
                    </div>
                )}

                <div className="modal-form">
                    <div className="field">
                        <label htmlFor="emp-number">Employee Number</label>
                        <input
                            id="emp-number"
                            type="text"
                            placeholder="e.g. EMP-0001"
                            value={form.employeeNumber}
                            onChange={handleChange('employeeNumber')}
                            className={errors.employeeNumber ? 'input-error' : ''}
                        />
                        {errors.employeeNumber && <span className="field-error"><AlertCircle size={12} />{errors.employeeNumber}</span>}
                    </div>

                    <div className="field">
                        <label htmlFor="emp-name">Full Name</label>
                        <input
                            id="emp-name"
                            type="text"
                            placeholder="e.g. Juan dela Cruz"
                            value={form.employeeName}
                            onChange={handleChange('employeeName')}
                            className={errors.employeeName ? 'input-error' : ''}
                        />
                        {errors.employeeName && <span className="field-error"><AlertCircle size={12} />{errors.employeeName}</span>}
                    </div>

                    <div className="field-row">
                        <div className="field">
                            <label htmlFor="emp-contact">Contact Number</label>
                            <input
                                id="emp-contact"
                                type="tel"
                                placeholder="e.g. +63 917 000 0000"
                                value={form.contactNumber}
                                onChange={handleChange('contactNumber')}
                                className={errors.contactNumber ? 'input-error' : ''}
                            />
                            {errors.contactNumber && <span className="field-error"><AlertCircle size={12} />{errors.contactNumber}</span>}
                        </div>

                        <div className="field">
                            <label htmlFor="emp-role">Role</label>
                            <select
                                id="emp-role"
                                value={form.role}
                                onChange={handleChange('role')}
                                className={errors.role ? 'input-error' : ''}
                            >
                                <option value="">Select a role</option>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {errors.role && <span className="field-error"><AlertCircle size={12} />{errors.role}</span>}
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn" onClick={onClose} disabled={submitting}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting
                            ? <><Loader2 size={13} className="spin" /> Registering…</>
                            : <><Save size={13} /> Register Employee</>
                        }
                    </button>
                </div>
            </div>
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
        role: employee.role,
        accountStatus: employee.accountStatus, // ✅ use accountStatus
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

            // 1. Update employee details (name, contact)
            const updateRes = await fetch(
                `/api/systemadmin/update-user?employeeNumber=${encodeURIComponent(employee.employeeNumber)}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        employeeNumber: employee.employeeNumber,
                        employeeName: form.employeeName,
                        contactNumber: form.contactNumber,
                    }),
                }
            );

            if (!updateRes.ok) {
                const err = await updateRes.json().catch(() => ({}));
                throw new Error(err.message || `Error ${updateRes.status}: Update failed`);
            }

            // 2. Update role if changed
            if (form.role !== employee.role) {
                const roleRes = await fetch('/api/systemadmin/assign-role', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        employeeNumber: employee.employeeNumber,
                        roleName: form.role,
                    }),
                });

                if (!roleRes.ok) {
                    const err = await roleRes.json().catch(() => ({}));
                    throw new Error(err.message || `Error ${roleRes.status}: Role update failed`);
                }
            }

            // 3. Update status if changed
            if (form.accountStatus !== employee.accountStatus) {
                const statusEndpoint = form.accountStatus === 'Active'
                    ? '/api/systemadmin/activate-user'
                    : '/api/systemadmin/deactivate-user';

                const statusRes = await fetch(statusEndpoint, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
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
                role: form.role,
                accountStatus: form.accountStatus, // ✅
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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ employeeNumber: employee.employeeNumber }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Error ${res.status}: Delete failed`);
            }

            alert(`${employee.employeeName} has been deleted.`);
            onUpdated({ ...employee, employeeNumber: '__deleted__' });
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
                    <button className="icon-btn" onClick={onClose} aria-label="Close">
                        <X size={16} />
                    </button>
                </div>

                {apiError && (
                    <div className="form-api-error">
                        <AlertCircle size={14} />
                        <span>{apiError}</span>
                    </div>
                )}

                <div className="modal-form">
                    <div className="employee-detail-avatar">
                        <div className="avatar-circle large">
                            {employee.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div className="avatar-info">
                            <h4>{form.employeeName}</h4>
                            <div className="avatar-meta">
                                {isEditing ? (
                                    <select
                                        value={form.accountStatus}
                                        onChange={handleChange('accountStatus')}
                                        className="detail-input status-select"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Deactivated">Deactivated</option>
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
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={form.employeeName}
                                    onChange={handleChange('employeeName')}
                                    className="detail-input"
                                />
                            ) : (
                                <span className="detail-value">{form.employeeName}</span>
                            )}
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Role</span>
                            {isEditing ? (
                                <select
                                    value={form.role}
                                    onChange={handleChange('role')}
                                    className="detail-input"
                                >
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            ) : (
                                <span className="detail-value">{form.role || '—'}</span>
                            )}
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Contact Number</span>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={form.contactNumber}
                                    onChange={handleChange('contactNumber')}
                                    className="detail-input"
                                />
                            ) : (
                                <span className="detail-value">{form.contactNumber}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    {isEditing ? (
                        <>
                            <button
                                className="btn"
                                onClick={() => { setIsEditing(false); setApiError(''); }}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                                {submitting
                                    ? <><Loader2 size={13} className="spin" /> Saving…</>
                                    : <><Save size={13} /> Save Changes</>
                                }
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={submitting}
                            >
                                Delete
                            </button>
                            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                                Edit
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const navigate = useNavigate();
    const employeeId = localStorage.getItem('employeeId') ?? '';
    const [showAddModal, setShowAddModal] = useState(false);

    const [employees, setEmployees] = useState<RecentEmployee[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [recentEmployees, setRecentEmployees] = useState<RecentEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<RecentEmployee | null>(null);

    const fetchEmployees = () => {
        const token = localStorage.getItem('authToken');

        fetch('/api/systemadmin/recent-employees', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                // ✅ Explicitly map backend fields to RecentEmployee interface
                const list: RecentEmployee[] = Array.isArray(data)
                    ? data.map((e: any) => ({
                        employeeNumber: e.employeeNumber,
                        employeeName: e.employeeName,
                        contactNumber: e.contactNumber,
                        role: e.role,
                        accountStatus: e.accountStatus ?? 'Unknown', // ✅ correct field
                    }))
                    : [];
                setEmployees(list);
                setRecentEmployees(list);
            })
            .catch(err => {
                setEmployees([]);
                setRecentEmployees([]);
                console.error('Failed to fetch employees:', err);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchEmployees();

        const token = localStorage.getItem('authToken');

        // Activity logs — silently fail if endpoint not yet implemented
        fetch('/api/activity-logs/recent', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => {
                if (!res.ok) return [];
                return res.json();
            })
            .then(data => setActivityLogs(Array.isArray(data) ? data : []))
            .catch(() => setActivityLogs([]));

    }, []);

    const handleLogout = () => {
        ['employeeId', 'refreshToken', 'authToken'].forEach(k => localStorage.removeItem(k));
        navigate('/');
    };

    const handleEmployeeUpdated = (updated: RecentEmployee) => {
        if (updated.employeeNumber === '__deleted__') {
            setEmployees(prev => prev.filter(e => e.employeeNumber !== selectedEmployee?.employeeNumber));
            setRecentEmployees(prev => prev.filter(e => e.employeeNumber !== selectedEmployee?.employeeNumber));
        } else {
            setEmployees(prev => prev.map(e => e.employeeNumber === updated.employeeNumber ? updated : e));
            setRecentEmployees(prev => prev.map(e => e.employeeNumber === updated.employeeNumber ? updated : e));
        }
    };

    return (
        <div className="dashboard-container">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/src/assets/SpeedexLogo.jpg" alt="Speedex Logo" className="sidebar-logo-img" />
                </div>
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
                        <div key={label} className={`nav-item${active ? ' active' : ''}`}>
                            <Icon size={22} />
                            <span>{label}</span>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-block">
                        <div className="avatar-circle">
                            {employeeId ? employeeId.charAt(0).toUpperCase() : 'E'}
                        </div>
                        <div className="user-text">
                            <span className="welcome-text">Welcome!</span>
                            <strong>{employeeId || 'Employee'}</strong>
                        </div>
                    </div>
                    <button className="logout-btn-sidebar" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="main-viewport">

                {/* Header */}
                <div className="dashboard-header">
                    <div className="header-title">
                        <h2>Dashboard</h2>
                        <p>
                            Speedex Courier Inc. —{' '}
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                            })}
                        </p>
                    </div>

                    <div className="header-actions">
                        <button
                            className="quick-action-btn-header"
                            onClick={() => setShowAddModal(true)}
                        >
                            <Users size={18} />
                            Add Employee
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="dashboard-content">

                    {/* Stat Cards */}
                    <div className="stats-row">
                        {STAT_CARDS.map(({ icon: Icon, bg, label, sub }) => (
                            <div key={label} className="stat-card">
                                <div className={`stat-icon ${bg}`}><Icon size={18} /></div>
                                <div className="stat-text">
                                    <p className="stat-label">{label}</p>
                                    <h3 className="stat-value">
                                        {label === 'TOTAL EMPLOYEES'
                                            ? employees.length
                                            : label === 'ACTIVE TASKS'
                                                ? activityLogs.length
                                                : label === 'TASKS COMPLETED'
                                                    ? 128
                                                    // ✅ count deactivated using correct field
                                                    : recentEmployees.filter(emp => emp.accountStatus === 'Deactivated').length}
                                    </h3>
                                    <small>{sub}</small>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Middle Grid */}
                    <div className="dashboard-grid">

                        {/* Recent Employees */}
                        <div className="card">
                            <div className="card-header">
                                <h3>Recent Employees</h3>
                                <a href="/employees" className="view-all-link">View all →</a>
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>NAME</th>
                                        <th>ID</th>
                                        <th>ROLE</th>
                                        <th>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4}>
                                                <div className="empty-state">
                                                    <Loader2 size={20} className="spin" />
                                                    <p>Loading...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : recentEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan={4}>
                                                <div className="empty-state">
                                                    <Package size={20} />
                                                    <p>No data available</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        recentEmployees.map(emp => (
                                            <tr
                                                key={emp.employeeNumber}
                                                onClick={() => setSelectedEmployee(emp)}
                                                className="clickable-row"
                                            >
                                                <td>
                                                    <div className="emp-name-cell">
                                                        <div className="emp-avatar">
                                                            {emp.employeeName.charAt(0).toUpperCase()}
                                                        </div>
                                                        {emp.employeeName}
                                                    </div>
                                                </td>
                                                <td>{emp.employeeNumber}</td>
                                                <td>{emp.role || <span className="no-role">—</span>}</td>
                                                <td>
                                                    {/* ✅ uses accountStatus from backend */}
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

                        {/* Recent Activity */}
                        <div className="card">
                            <div className="card-header">
                                <h3>Recent Activity</h3>
                                <a href="/activity-logs" className="view-all-link">View all →</a>
                            </div>
                            <div className="activity-feed-list">
                                {loading ? (
                                    <div className="empty-state">
                                        <Loader2 size={20} className="spin" />
                                        <p>Loading...</p>
                                    </div>
                                ) : activityLogs.length === 0 ? (
                                    <div className="empty-state">
                                        <ClipboardList size={20} />
                                        <p>No recent activity</p>
                                    </div>
                                ) : (
                                    activityLogs.map(log => (
                                        <div key={log.id} className="activity-feed-item">
                                            <span className="activity-desc">{log.description}</span>
                                            <span className="activity-timestamp">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="dashboard-bottom-row">

                        {/* System Status */}
                        <div className="card">
                            <div className="card-header">
                                <h3>System Status</h3>
                                <span className="badge-operational">All Operational</span>
                            </div>
                            <div className="system-status-list">
                                {SYSTEM_STATUS_ITEMS.map(({ icon: Icon, bg, name, detail, uptime }) => (
                                    <div key={name} className="system-status-item">
                                        <div className={`system-icon ${bg}`}><Icon size={16} /></div>
                                        <div className="system-info">
                                            <span className="system-name">{name}</span>
                                            <span className="system-detail">{detail}</span>
                                        </div>
                                        <span className="system-uptime">{uptime}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Performance */}
                        <div className="card">
                            <div className="card-header">
                                <h3>Delivery Performance</h3>
                                <span className="badge-week">This Week</span>
                            </div>
                            <div className="chart-wrap">
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={DAILY_DELIVERIES} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a3aed0' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="weekday" fill="#4318ff" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="peak" fill="#a3aed0" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Modals */}
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