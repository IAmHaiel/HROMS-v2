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
} from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './SystemAdmin_Dashboard.css';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavTab = 'dashboard' | 'employees' | 'delivery' | 'analytics' | 'profile';

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

interface RecentEmployee {
    employeeNumber: string;
    employeeName: string;
    contactNumber: string;
    role: string;
    accountStatus: string;
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

const EMPTY_FORM: FormState = {
    employeeNumber: '',
    employeeName: '',
    contactNumber: '',
    role: '',
};

const NAV_ITEMS: { tab: NavTab; icon: any; label: string }[] = [
    { tab: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { tab: 'employees', icon: Package, label: 'Manage Employees' },
    { tab: 'delivery', icon: Truck, label: 'Delivery' },
    { tab: 'analytics', icon: BarChart3, label: 'Analytics' },
    { tab: 'profile', icon: UserCircle2, label: 'Profile' },
];

const STAT_CARDS = [
    { icon: Users, bg: 'bg-primary', label: 'TOTAL EMPLOYEES', sub: 'Current active staff' },
    { icon: ClipboardList, bg: 'bg-warning', label: 'ACTIVE TASKS', sub: 'Pending & In Transit' },
    { icon: CheckCircle2, bg: 'bg-success', label: 'TASKS COMPLETED', sub: 'Total successful deliveries' },
    { icon: AlertCircle, bg: 'bg-danger', label: 'LOCKED ACCOUNTS', sub: 'Needs admin action' },
];

const ITEMS_PER_PAGE = 7;

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

const toBackendRole = (role: string) => role.replace(/\s+/g, '');
const toDisplayRole = (role: string) => role.replace(/([a-z])([A-Z])/g, '$1 $2');

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
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setSubmitting(true);
        setApiError('');
        try {
            const token = localStorage.getItem('authToken');
            const payload: EmployeeRegisterDTO = {
                employeeNumber: form.employeeNumber.trim(),
                employeeName: form.employeeName.trim(),
                contactNumber: form.contactNumber.trim(),
                role: toBackendRole(form.role),
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
            alert(
                `Employee account created successfully!\n\nEmployee Number: ${data.employeeNumber}\nGenerated Password: ${data.generatedPassword}\n\nSave this password. It will not be shown again.`
            );
            onSuccess({
                employeeNumber: data.employeeNumber,
                employeeName: data.employeeName,
                contactNumber: payload.contactNumber,
                role: data.role,
                accountStatus: 'Active',
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
                    <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
                </div>
                {apiError && (
                    <div className="form-api-error"><AlertCircle size={14} /><span>{apiError}</span></div>
                )}
                <div className="modal-form">
                    <div className="field">
                        <label htmlFor="emp-number">Employee Number</label>
                        <input id="emp-number" type="text" placeholder="e.g. EMP-0001" value={form.employeeNumber} onChange={handleChange('employeeNumber')} className={errors.employeeNumber ? 'input-error' : ''} />
                        {errors.employeeNumber && <span className="field-error"><AlertCircle size={12} />{errors.employeeNumber}</span>}
                    </div>
                    <div className="field">
                        <label htmlFor="emp-name">Full Name</label>
                        <input id="emp-name" type="text" placeholder="e.g. Juan dela Cruz" value={form.employeeName} onChange={handleChange('employeeName')} className={errors.employeeName ? 'input-error' : ''} />
                        {errors.employeeName && <span className="field-error"><AlertCircle size={12} />{errors.employeeName}</span>}
                    </div>
                    <div className="field-row">
                        <div className="field">
                            <label htmlFor="emp-contact">Contact Number</label>
                            <input id="emp-contact" type="tel" placeholder="e.g. +63 917 000 0000" value={form.contactNumber} onChange={handleChange('contactNumber')} className={errors.contactNumber ? 'input-error' : ''} />
                            {errors.contactNumber && <span className="field-error"><AlertCircle size={12} />{errors.contactNumber}</span>}
                        </div>
                        <div className="field">
                            <label htmlFor="emp-role">Role</label>
                            <select id="emp-role" value={form.role} onChange={handleChange('role')} className={errors.role ? 'input-error' : ''}>
                                <option value="">Select a role</option>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {errors.role && <span className="field-error"><AlertCircle size={12} />{errors.role}</span>}
                        </div>
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <><Loader2 size={13} className="spin" /> Registering…</> : <><Save size={13} /> Register Employee</>}
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

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

interface DashboardTabProps {
    employees: RecentEmployee[];
    recentEmployees: RecentEmployee[];
    activityLogs: ActivityLog[];
    loading: boolean;
    onSelectEmployee: (emp: RecentEmployee) => void;
}

function DashboardTab({ employees, recentEmployees, activityLogs, loading, onSelectEmployee }: DashboardTabProps) {

    const activeCount = employees.filter(e => e.accountStatus === 'Active').length;
    const deactivatedCount = employees.filter(e => e.accountStatus === 'Deactivated').length;
    return (
        <div className="dashboard-content">
            <div className="stats-row">
                {[
                    { icon: Users, bg: 'bg-primary', label: 'TOTAL EMPLOYEES', value: employees.length, sub: 'All registered staff' },
                    { icon: CheckCircle2, bg: 'bg-success', label: 'ACTIVE', value: activeCount, sub: 'Currently active accounts' },
                    { icon: AlertCircle, bg: 'bg-danger', label: 'DEACTIVATED', value: deactivatedCount, sub: 'Accounts needing review' },
                    { icon: Shield, bg: 'bg-warning', label: 'ROLES', value: ROLES.length, sub: 'Available role types' },
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

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <h3>Recent Employees</h3>
                        <a href="/employees" className="view-all-link">View all →</a>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>NAME</th><th>ID</th><th>ROLE</th><th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4}><div className="empty-state"><Loader2 size={20} className="spin" /><p>Loading...</p></div></td></tr>
                            ) : recentEmployees.length === 0 ? (
                                <tr><td colSpan={4}><div className="empty-state"><Package size={20} /><p>No data available</p></div></td></tr>
                            ) : (
                                recentEmployees.slice(0, 7).map(emp => (
                                    <tr key={emp.employeeNumber} onClick={() => onSelectEmployee(emp)} className="clickable-row">
                                        <td>
                                            <div className="emp-name-cell">
                                                <div className="emp-avatar">{emp.employeeName.charAt(0).toUpperCase()}</div>
                                                {emp.employeeName}
                                            </div>
                                        </td>
                                        <td>{emp.employeeNumber}</td>
                                        <td>{emp.role ? toDisplayRole(emp.role) : <span className="no-role">—</span>}</td>
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

                <div className="card">
                    <div className="card-header">
                        <h3>Recent Activity</h3>
                        <a href="/activity-logs" className="view-all-link">View all →</a>
                    </div>
                    <div className="activity-feed-list">
                        {loading ? (
                            <div className="empty-state"><Loader2 size={20} className="spin" /><p>Loading...</p></div>
                        ) : activityLogs.length === 0 ? (
                            <div className="empty-state"><ClipboardList size={20} /><p>No recent activity</p></div>
                        ) : (
                            activityLogs.map(log => (
                                <div key={log.id} className="activity-feed-item">
                                    <span className="activity-desc">{log.description}</span>
                                    <span className="activity-timestamp">{new Date(log.timestamp).toLocaleString()}</span>
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

interface ManageEmployeesTabProps {
    employees: RecentEmployee[];
    loading: boolean;
    onSelectEmployee: (emp: RecentEmployee) => void;
    onAddEmployee: () => void;
}

function ManageEmployeesTab({ employees, loading, onSelectEmployee, onAddEmployee }: ManageEmployeesTabProps) {
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = employees.filter(emp => {
        const matchSearch =
            !search ||
            emp.employeeName.toLowerCase().includes(search.toLowerCase()) ||
            emp.employeeNumber.toLowerCase().includes(search.toLowerCase());
        const matchRole = !filterRole || emp.role === filterRole || toDisplayRole(emp.role) === filterRole;
        const matchStatus = !filterStatus || emp.accountStatus === filterStatus;
        return matchSearch && matchRole && matchStatus;
    });

    // Reset to page 1 when filters change
    useEffect(() => { setCurrentPage(1); }, [search, filterRole, filterStatus]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    // Generate page number buttons (max 5 shown)
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

            <div className="card employees-table-card" style={{ minHeight: 520 }}>
                <div className="card-header">
                    <h3>All Employees</h3>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <div className="filter-bar">
                    <div className="search-input-wrap">
                        <Search size={14} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name or ID…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
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

                <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>NAME</th>
                                    <th>EMPLOYEE ID</th>
                                    <th>ROLE</th>
                                    <th>CONTACT</th>
                                    <th>STATUS</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6}><div className="empty-state"><Loader2 size={20} className="spin" /><p>Loading employees…</p></div></td></tr>
                                ) : paginated.length === 0 ? (
                                    <tr><td colSpan={6}><div className="empty-state"><Package size={20} /><p>No employees match your filters</p></div></td></tr>
                                ) : (
                                    paginated.map(emp => (
                                        <tr key={emp.employeeNumber} className="clickable-row" onClick={() => onSelectEmployee(emp)}>
                                            <td>
                                                <div className="emp-name-cell">
                                                    <div className="emp-avatar">{emp.employeeName.charAt(0).toUpperCase()}</div>
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
                                                <button
                                                    className="btn btn-xs"
                                                    onClick={e => { e.stopPropagation(); onSelectEmployee(emp); }}
                                                >
                                                    <Pencil size={11} /> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                    </table>
                </div>
                

                {/* ── Pagination ── */}
                {!loading && filtered.length > 0 && (
                    <div className="pagination-bar">
                        <span className="pagination-info">
                            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                        </span>
                        <div className="pagination-controls">
                            <button
                                className="page-btn page-btn-nav"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            {getPageNumbers().map((p, i) =>
                                p === '...' ? (
                                    <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        className={`page-btn${currentPage === p ? ' active' : ''}`}
                                        onClick={() => goToPage(p as number)}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                            <button
                                className="page-btn page-btn-nav"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                aria-label="Next page"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
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

    // ── Edit profile state ──
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        employeeName: employeeName,
        contactNumber: employeeContact,
    });
    const [profileError, setProfileError] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

    // ── Change password state ──
    const [editingPassword, setEditingPassword] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwError, setPwError] = useState('');
    const [pwSaving, setPwSaving] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

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
                    body: JSON.stringify({
                        employeeNumber: employeeId,
                        employeeName: profileForm.employeeName.trim(),
                        contactNumber: profileForm.contactNumber.trim(),
                    }),
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

    // Current display name (updates after save)
    const displayName = profileForm.employeeName || employeeName || 'System Admin';
    const displayContact = profileForm.contactNumber || employeeContact;

    return (
        <div className="dashboard-content">
            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1.5fr' }}>

                {/* ── Profile Card ── */}
                <div className="card">
                    <div className="card-header">
                        <h3>My Profile</h3>
                        {!editingProfile && (
                            <button
                                className="btn btn-primary"
                                style={{ fontSize: 12, padding: '6px 14px', width: 'fit-content', flexShrink: 0, marginLeft: 'auto' }}
                                onClick={() => { setEditingProfile(true); setProfileSuccess(false); }}
                            >
                                <Pencil size={12} /> Edit Profile
                            </button>
                        )}
                    </div>

                    {/* Avatar */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 16px', gap: 10 }}>
                        <div
                            className="avatar-circle large"
                            style={{
                                width: 72, height: 72, fontSize: 28,
                                background: 'linear-gradient(135deg, #4318ff, #6a5cff)',
                                boxShadow: '0 8px 20px rgba(67,24,255,0.28)',
                            }}
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
                        /* ── Edit mode ── */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {profileError && (
                                <div className="form-api-error"><AlertCircle size={14} /><span>{profileError}</span></div>
                            )}
                            <div className="field">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={profileForm.employeeName}
                                    onChange={handleProfileChange('employeeName')}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="field">
                                <label>Contact Number</label>
                                <input
                                    type="tel"
                                    value={profileForm.contactNumber}
                                    onChange={handleProfileChange('contactNumber')}
                                    placeholder="e.g. +63 917 000 0000"
                                />
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
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setEditingProfile(false);
                                        setProfileError('');
                                        setProfileForm({ employeeName: employeeName, contactNumber: employeeContact });
                                    }}
                                    disabled={profileSaving}
                                >
                                    Cancel
                                </button>
                                <button className="btn btn-primary" onClick={handleProfileSave} disabled={profileSaving}>
                                    {profileSaving ? <><Loader2 size={13} className="spin" /> Saving…</> : <><Save size={13} /> Save Changes</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── View mode ── */
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

                {/* ── Security Card ── */}
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
                            {/* Password row */}
                            <div className="system-status-item" style={{ cursor: 'default' }}>
                                <div className="system-icon bg-success"><CheckCircle2 size={16} /></div>
                                <div className="system-info">
                                    <span className="system-name">Password</span>
                                    <span className="system-detail">Last updated recently</span>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#05cd99', background: 'rgba(5,205,153,0.12)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Secure</span>
                            </div>

                            {/* Divider */}
                            <div style={{ height: 1, background: 'var(--border)' }} />

                            {/* Role Permissions row */}
                            <div className="system-status-item" style={{ cursor: 'default' }}>
                                <div className="system-icon bg-primary"><Shield size={16} /></div>
                                <div className="system-info">
                                    <span className="system-name">Role Permissions</span>
                                    <span className="system-detail">Full system access granted</span>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'rgba(67,24,255,0.1)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Admin</span>
                            </div>

                            {/* Divider */}
                            <div style={{ height: 1, background: 'var(--border)' }} />

                            {/* Session row */}
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
                            {pwError && (
                                <div className="form-api-error" style={{ marginBottom: 8 }}>
                                    <AlertCircle size={14} /><span>{pwError}</span>
                                </div>
                            )}

                            {/* Current Password */}
                            <div className="field">
                                <label>Current Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showCurrent ? 'text' : 'password'}
                                        value={pwForm.current}
                                        onChange={handlePwChange('current')}
                                        placeholder="Enter current password"
                                        style={{ paddingRight: 40, width: '100%' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(p => !p)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                                        tabIndex={-1}
                                    >
                                        {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="field">
                                <label>New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showNext ? 'text' : 'password'}
                                        value={pwForm.next}
                                        onChange={handlePwChange('next')}
                                        placeholder="At least 6 characters"
                                        style={{ paddingRight: 40, width: '100%' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNext(p => !p)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                                        tabIndex={-1}
                                    >
                                        {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {/* Password strength indicator */}
                                {pwForm.next.length > 0 && (
                                    <div style={{ marginTop: 6 }}>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {[1, 2, 3].map(level => (
                                                <div key={level} style={{
                                                    flex: 1, height: 4, borderRadius: 2,
                                                    background: pwForm.next.length >= level * 4
                                                        ? level === 1 ? '#ee5d50' : level === 2 ? '#ffb547' : '#05cd99'
                                                        : '#e9edf7',
                                                    transition: 'background 0.2s',
                                                }} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>
                                            {pwForm.next.length < 4 ? 'Weak' : pwForm.next.length < 8 ? 'Fair' : 'Strong'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="field">
                                <label>Confirm New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={pwForm.confirm}
                                        onChange={handlePwChange('confirm')}
                                        placeholder="Re-enter new password"
                                        style={{ paddingRight: 40, width: '100%' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(p => !p)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                                        tabIndex={-1}
                                    >
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
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setEditingPassword(false);
                                        setPwError('');
                                        setPwForm({ current: '', next: '', confirm: '' });
                                    }}
                                    disabled={pwSaving}
                                >
                                    Cancel
                                </button>
                                <button className="btn btn-primary" onClick={handlePwSave} disabled={pwSaving}>
                                    {pwSaving ? <><Loader2 size={13} className="spin" /> Saving…</> : <><Save size={13} /> Update Password</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Account Overview ── */}
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

// ─── Root Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
    const navigate = useNavigate();
    const employeeId = localStorage.getItem('employeeId') ?? '';
    const employeeName = localStorage.getItem('employeeName') ?? '';

    const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<RecentEmployee | null>(null);

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
                    ? data.map((e: any) => ({
                        employeeNumber: e.employeeNumber,
                        employeeName: e.employeeName,
                        contactNumber: e.contactNumber,
                        role: e.role,
                        accountStatus: e.accountStatus ?? 'Unknown',
                    }))
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

    const handleLogout = () => {
        ['employeeId', 'refreshToken', 'authToken'].forEach(k => localStorage.removeItem(k));
        navigate('/');
    };

    const handleSelectEmployee = (emp: RecentEmployee) => {
        setSelectedEmployee(emp);
    };

    const handleSelectEmployeeFromManage = (emp: RecentEmployee) => {
        navigate(`/employee_detail/${encodeURIComponent(emp.employeeNumber)}`);
    };

    const handleEmployeeUpdated = (updated: RecentEmployee) => {
        if (updated.employeeNumber === '__deleted__') {
            setEmployees(prev => prev.filter(e => e.employeeNumber !== updated.employeeNumber));
            setRecentEmployees(prev => prev.filter(e => e.employeeNumber !== updated.employeeNumber));
        } else {
            setEmployees(prev => prev.map(e => e.employeeNumber === updated.employeeNumber ? updated : e));
            setRecentEmployees(prev => prev.map(e => e.employeeNumber === updated.employeeNumber ? updated : e));
        }
    };

    const pageTitles: Record<NavTab, string> = {
        dashboard: 'Dashboard',
        employees: 'Manage Employees',
        delivery: 'Delivery',
        analytics: 'Analytics',
        profile: 'My Profile',
    };

    return (
        <div className="dashboard-container">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/src/assets/SpeedexLogo.jpg" alt="Speedex Logo" className="sidebar-logo-img" />
                </div>
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(({ tab, icon: Icon, label }) => (
                        <div
                            key={tab}
                            className={`nav-item${activeTab === tab ? ' active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            <Icon size={22} />
                            <span>{label}</span>
                        </div>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div className="user-block">
                        <div className="avatar-circle">
                            {employeeName ? employeeName.charAt(0).toUpperCase() : 'E'}
                        </div>
                        <div className="user-text">
                            <span className="welcome-text">Welcome!</span>
                            <strong>{employeeName || 'Employee'}</strong>
                        </div>
                    </div>
                    <button className="logout-btn-sidebar" onClick={handleLogout}>Logout</button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="main-viewport">
                <div className="dashboard-header">
                    <div className="header-title">
                        <h2>{pageTitles[activeTab]}</h2>
                        <p>
                            Speedex Courier Inc. —{' '}
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                            })}
                        </p>
                    </div>
                    {(activeTab === 'dashboard' || activeTab === 'employees') && (
                        <div className="header-actions">
                            <button className="quick-action-btn-header" onClick={() => setShowAddModal(true)}>
                                <Users size={18} /> Add Employee
                            </button>
                        </div>
                    )}
                </div>

                {activeTab === 'dashboard' && (
                    <DashboardTab
                        employees={employees}
                        recentEmployees={recentEmployees}
                        activityLogs={activityLogs}
                        loading={loading}
                        onSelectEmployee={handleSelectEmployee}
                    />
                )}
                {activeTab === 'employees' && (
                    <ManageEmployeesTab
                        employees={employees}
                        loading={loading}
                        onSelectEmployee={handleSelectEmployeeFromManage}
                        onAddEmployee={() => setShowAddModal(true)}
                    />
                )}
                {activeTab === 'profile' && <ProfileTab />}
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