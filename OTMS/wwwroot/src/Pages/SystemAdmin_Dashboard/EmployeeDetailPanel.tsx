import { useEffect, useState } from 'react';
import {
    User,
    Phone,
    Shield,
    Hash,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Pencil,
    Save,
    X,
    Truck,
    ClipboardList,
    Package,
    ToggleLeft,
    ToggleRight,
    Trash2,
    Calendar,
    Clock,
    ChevronLeft,
    Mail,
} from 'lucide-react';
import '../employee_details/employee_detail.css';
import { useToast } from '../../components/Toast/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentEmployee {
    employeeNumber: string;
    employeeName: string;
    contactNumber: string;
    role: string;
    accountStatus: string;
    email?: string;
}

interface DeliveryRecord {
    deliveryId: string;
    trackingNumber: string;
    recipient: string;
    destination: string;
    status: string;
    deliveredAt: string | null;
    assignedAt: string;
}

interface ActivityLog {
    id: number;
    description: string;
    timestamp: string;
}

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const ROLES = [
    'System Admin',
    'Operation Admin',
    'Operation Team',
    'Coordinator',
    'Delivery Driver',
    'Encoder',
];

const toBackendRole = (role: string) => role.replace(/\s+/g, '');
const toDisplayRole = (role: string) => role.replace(/([a-z])([A-Z])/g, '$1 $2');

const fmtDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const fmtDateTime = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const deliveryStatusClass = (s: string) => {
    const map: Record<string, string> = {
        delivered: 'ds-delivered',
        'in-transit': 'ds-transit',
        pending: 'ds-pending',
        failed: 'ds-failed',
        returned: 'ds-returned',
    };
    return map[s?.toLowerCase()] ?? 'ds-pending';
};

function Skeleton({ w = '100%', h = 16 }: { w?: string | number; h?: number }) {
    return <div className="skel" style={{ width: w, height: h }} />;
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
    profile: RecentEmployee;
    onClose: () => void;
    onSaved: (updated: RecentEmployee) => void;
}

function EditProfileModal({ profile, onClose, onSaved }: EditModalProps) {
    const [form, setForm] = useState({
        employeeName: profile.employeeName,
        contactNumber: profile.contactNumber,
        role: toDisplayRole(profile.role),
        accountStatus: profile.accountStatus,
        email: profile.email ?? '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');
    const { confirm, success, error } = useToast();

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [key]: e.target.value }));
        setApiError('');
    };

    const handleSave = async () => {
        if (!form.employeeName.trim()) {
            setApiError('Full name is required.');
            return;
        }
        setSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');

            // 1. Update personal details
            const updateRes = await fetch(
                `/api/systemadmin/update-user?employeeNumber=${encodeURIComponent(profile.employeeNumber)}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        employeeNumber: profile.employeeNumber,
                        contactNumber: form.contactNumber,
                        email: form.email.trim(),
                    }),
                }
            );
            if (!updateRes.ok) throw new Error(`Details update failed (HTTP ${updateRes.status})`);

            // 2. Update role if changed
            if (toBackendRole(form.role) !== profile.role) {
                const roleRes = await fetch('/api/systemadmin/assign-role', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        employeeNumber: profile.employeeNumber,
                        roleName: toBackendRole(form.role),
                    }),
                });
                if (!roleRes.ok) throw new Error(`Role update failed (HTTP ${roleRes.status})`);
            }

            // 3. Update status in database if changed
            if (form.accountStatus !== profile.accountStatus) {
                const actionText = form.accountStatus === 'Active' ? 'activate' : 'deactivate';
                const isConfirmed = await confirm(`Are you sure you want to ${actionText} ${profile.employeeName}?`);
                if (!isConfirmed) {
                    setSubmitting(false);
                    return;
                }

                const statusEndpoint =
                    form.accountStatus === 'Active'
                        ? '/api/systemadmin/activate-user'
                        : '/api/systemadmin/deactivate-user';

                const statusRes = await fetch(statusEndpoint, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        employeeNumber: profile.employeeNumber,
                    }),
                });
                if (!statusRes.ok) throw new Error(`Status update failed (HTTP ${statusRes.status})`);
            }

            onSaved({
                ...profile,
                employeeName: form.employeeName,
                contactNumber: form.contactNumber,
                role: toBackendRole(form.role),
                accountStatus: form.accountStatus,
                email: form.email.trim(),
            });
            success('Employee details updated successfully!');
            onClose();
        } catch (err: any) {
            error(err.message ?? 'Something went wrong.');
            setApiError(err.message ?? 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="ed-modal-overlay" onClick={onClose}>
            <div className="ed-modal-card" onClick={e => e.stopPropagation()}>
                <div className="ed-modal-header">
                    <div>
                        <h3>Edit Employee</h3>
                        <p>Update details for {profile.employeeName}</p>
                    </div>
                    <button className="ed-icon-btn" onClick={onClose} aria-label="Close">
                        <X size={16} />
                    </button>
                </div>

                {apiError && (
                    <div className="ed-api-error">
                        <AlertCircle size={14} />
                        <span>{apiError}</span>
                    </div>
                )}

                <div className="ed-modal-form">
                    <div className="ed-field">
                        <label>Full Name</label>
                        <input type="text" value={form.employeeName} onChange={set('employeeName')} />
                    </div>
                    <div className="ed-field">
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={set('email')} />
                    </div>
                    <div className="ed-field">
                        <label>Contact Number</label>
                        <input type="tel" value={form.contactNumber} onChange={set('contactNumber')} />
                    </div>
                    <div className="ed-field-row">
                        <div className="ed-field">
                            <label>Role</label>
                            <select value={form.role} onChange={set('role')}>
                                {ROLES.map(r => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="ed-field">
                            <label>Account Status</label>
                            <select value={form.accountStatus} onChange={set('accountStatus')}>
                                <option value="Active">Active</option>
                                <option value="Deactivated">Deactivated</option>
                                {profile.accountStatus === 'On Leave' && <option value="On Leave">On Leave</option>}
                                {profile.accountStatus === 'Emergency Overriden' && <option value="Emergency Overriden">Emergency Overriden</option>}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="ed-modal-actions">
                    <button className="ed-btn" onClick={onClose} disabled={submitting}>
                        Cancel
                    </button>
                    <button className="ed-btn ed-btn-primary" onClick={handleSave} disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 size={13} className="spin" /> Saving…
                            </>
                        ) : (
                            <>
                                <Save size={13} /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Panel Component ────────────────────────────────────────────────────

interface EmployeeDetailPanelProps {
    employee: RecentEmployee;
    onBack: () => void;
    onEmployeeUpdated: (updated: RecentEmployee) => void;
}

export default function EmployeeDetailPanel({
    employee,
    onBack,
    onEmployeeUpdated,
}: EmployeeDetailPanelProps) {
    const [profile, setProfile] = useState<RecentEmployee>(employee);
    const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

    const [loadingDeliveries, setLoadingDeliveries] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeSection, setActiveSection] = useState<'overview' | 'deliveries' | 'activity'>('overview');
    const { confirm, success, error } = useToast();

    // Sync profile state if employee prop changes
    useEffect(() => {
        setProfile(employee);
    }, [employee]);

    // Fetch Deliveries
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        setLoadingDeliveries(true);
        fetch(`/api/systemadmin/employee/${encodeURIComponent(profile.employeeNumber)}/deliveries`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => (res.ok ? res.json() : []))
            .then(data => setDeliveries(Array.isArray(data) ? data : []))
            .catch(() => setDeliveries([]))
            .finally(() => setLoadingDeliveries(false));
    }, [profile.employeeNumber]);

    // Fetch Activity Logs
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        setLoadingLogs(true);
        fetch(`/api/activity-logs/employee/${encodeURIComponent(profile.employeeNumber)}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        })
            .then(res => (res.ok ? res.json() : []))
            .then(data => setActivityLogs(Array.isArray(data) ? data : []))
            .catch(() => setActivityLogs([]))
            .finally(() => setLoadingLogs(false));
    }, [profile.employeeNumber]);

    // Delete Employee
    const handleDelete = async () => {
        const isConfirmed = await confirm(`Are you sure you want to permanently delete ${profile.employeeName}?`);
        if (!isConfirmed) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/systemadmin/delete-user', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ employeeNumber: profile.employeeNumber }),
            });
            if (!res.ok) throw new Error();
            success(`Successfully deleted ${profile.employeeName}.`);
            onEmployeeUpdated({ ...profile, accountStatus: '__deleted__' });
        } catch {
            error('Failed to delete employee.');
        } finally {
            setDeleting(false);
        }
    };

    // Toggle status (Activate/Deactivate)
    const handleToggleStatus = async () => {
        const isActive = ['Active', 'On Leave', 'Emergency Overriden'].includes(profile.accountStatus);
        const next = isActive ? 'Deactivated' : 'Active';
        const actionText = next === 'Deactivated' ? 'deactivate' : 'activate';
        
        const isConfirmed = await confirm(`Are you sure you want to ${actionText} ${profile.employeeName}?`);
        if (!isConfirmed) return;

        const endpoint =
            next === 'Active' ? '/api/systemadmin/activate-user' : '/api/systemadmin/deactivate-user';

        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ employeeNumber: profile.employeeNumber }),
            });
            if (!res.ok) throw new Error();

            const updatedProfile = { ...profile, accountStatus: next };
            setProfile(updatedProfile);
            onEmployeeUpdated(updatedProfile);
            success(`Successfully ${next.toLowerCase()} ${profile.employeeName}.`);
        } catch {
            error(`Failed to ${actionText} employee.`);
        }
    };

    const completedCount = deliveries.filter(d => d.status?.toLowerCase() === 'delivered').length;
    const transitCount = deliveries.filter(d => d.status?.toLowerCase() === 'in-transit').length;
    const failedCount = deliveries.filter(d => ['failed', 'returned'].includes(d.status?.toLowerCase())).length;

    return (
        <div className="ed-main" style={{ minHeight: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column' }}>
            {/* Top actions bar */}
            <div className="ed-topbar">
                <button className="ed-btn ed-btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ChevronLeft size={16} /> Back to Employees
                </button>
                <div className="ed-topbar-actions">
                    <button
                        className={`ed-btn ed-btn-ghost ${['Active', 'On Leave', 'Emergency Overriden'].includes(profile.accountStatus) ? 'deactivate' : 'activate'}`}
                        onClick={handleToggleStatus}
                    >
                        {['Active', 'On Leave', 'Emergency Overriden'].includes(profile.accountStatus) ? (
                            <>
                                <ToggleLeft size={15} /> Deactivate
                            </>
                        ) : (
                            <>
                                <ToggleRight size={15} /> Activate
                            </>
                        )}
                    </button>
                    <button className="ed-btn ed-btn-secondary" onClick={() => setShowEdit(true)}>
                        <Pencil size={14} /> Edit Profile
                    </button>
                    <button className="ed-btn ed-btn-danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />} Delete
                    </button>
                </div>
            </div>

            {/* Hero banner */}
            <div className="ed-hero">
                <div className="ed-hero-inner">
                    <div className="ed-hero-avatar">{profile.employeeName.charAt(0).toUpperCase()}</div>
                    <div className="ed-hero-info">
                        <div className="ed-hero-name-row">
                            <h1>{profile.employeeName}</h1>
                            <span className={`ed-status-pill ${profile.accountStatus.toLowerCase()}`}>
                                {profile.accountStatus}
                            </span>
                        </div>
                        <div className="ed-hero-meta">
                            <span>
                                <Hash size={13} /> {profile.employeeNumber}
                            </span>
                            <span>
                                <Mail size={13} /> {profile.email || '—'}
                            </span>
                            <span>
                                <Shield size={13} /> {toDisplayRole(profile.role)}
                            </span>
                            <span>
                                <Phone size={13} /> {profile.contactNumber || '—'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="ed-hero-stats">
                    {[
                        { label: 'Total Deliveries', value: deliveries.length, cls: '' },
                        { label: 'Completed', value: completedCount, cls: 'green' },
                        { label: 'In Transit', value: transitCount, cls: 'amber' },
                        { label: 'Failed / Returned', value: failedCount, cls: 'red' },
                        { label: 'Activity Logs', value: activityLogs.length, cls: '' },
                    ].map(({ label, value, cls }) => (
                        <div key={label} className="ed-hero-stat">
                            <span className={`ed-hero-stat-value ${cls}`}>
                                {loadingDeliveries ? '—' : value}
                            </span>
                            <span className="ed-hero-stat-label">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section tabs */}
            <div className="ed-section-tabs">
                {([
                    { key: 'overview', icon: User, label: 'Overview' },
                    { key: 'deliveries', icon: Truck, label: 'Delivery History' },
                    { key: 'activity', icon: ClipboardList, label: 'Activity Logs' },
                ] as const).map(({ key, icon: Icon, label }) => (
                    <button
                        key={key}
                        className={`ed-section-tab ${activeSection === key ? 'active' : ''}`}
                        onClick={() => setActiveSection(key)}
                    >
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {/* Body content */}
            <div className="ed-body" style={{ flex: 1 }}>
                {activeSection === 'overview' && (
                    <div className="ed-overview-grid">
                        {/* Personal Information */}
                        <div className="ed-card">
                            <div className="ed-card-header">
                                <h3>
                                    <User size={15} /> Personal Information
                                </h3>
                            </div>
                            <div className="ed-field-list">
                                {[
                                    { label: 'Employee Number', value: profile.employeeNumber, icon: Hash },
                                    { label: 'Full Name', value: profile.employeeName, icon: User },
                                    { label: 'Email', value: profile.email || '—', icon: Mail },
                                    { label: 'Contact Number', value: profile.contactNumber || '—', icon: Phone },
                                    { label: 'Role', value: toDisplayRole(profile.role), icon: Shield },
                                    { label: 'Account Status', value: profile.accountStatus, icon: CheckCircle2 },
                                ].map(({ label, value, icon: Icon }) => (
                                    <div key={label} className="ed-info-row">
                                        <span className="ed-info-label">
                                            <Icon size={12} /> {label}
                                        </span>
                                        <span
                                            className={`ed-info-value ${label === 'Account Status' ? `status-${value.toLowerCase()}` : ''
                                                }`}
                                        >
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="ed-card">
                            <div className="ed-card-header">
                                <h3>
                                    <Clock size={15} /> Recent Activity
                                </h3>
                                <button className="ed-view-all" onClick={() => setActiveSection('activity')}>
                                    View all →
                                </button>
                            </div>
                            {loadingLogs ? (
                                <div className="ed-log-list">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="ed-log-item">
                                            <Skeleton w="70%" />
                                            <Skeleton w="25%" />
                                        </div>
                                    ))}
                                </div>
                            ) : activityLogs.length === 0 ? (
                                <div className="ed-empty">
                                    <ClipboardList size={18} />
                                    <p>No activity recorded</p>
                                </div>
                            ) : (
                                <div className="ed-log-list">
                                    {activityLogs.slice(0, 5).map(log => (
                                        <div key={log.id} className="ed-log-item">
                                            <span className="ed-log-dot" />
                                            <span className="ed-log-desc">{log.description}</span>
                                            <span className="ed-log-time">{fmtDateTime(log.timestamp)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeSection === 'deliveries' && (
                    <div className="ed-card">
                        <div className="ed-card-header">
                            <h3>
                                <Truck size={15} /> Delivery History
                            </h3>
                            <span className="ed-badge-count">{deliveries.length} records</span>
                        </div>
                        {loadingDeliveries ? (
                            <div className="ed-empty">
                                <Loader2 size={22} className="spin" />
                                <p>Loading deliveries…</p>
                            </div>
                        ) : deliveries.length === 0 ? (
                            <div className="ed-empty">
                                <Package size={24} />
                                <p>No delivery records found</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="ed-table">
                                    <thead>
                                        <tr>
                                            <th>Tracking #</th>
                                            <th>Recipient</th>
                                            <th>Destination</th>
                                            <th>Status</th>
                                            <th>Assigned</th>
                                            <th>Delivered</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deliveries.map(d => (
                                            <tr key={d.deliveryId}>
                                                <td className="ed-tracking-num">{d.trackingNumber}</td>
                                                <td>{d.recipient}</td>
                                                <td>{d.destination}</td>
                                                <td>
                                                    <span className={`ed-delivery-badge ${deliveryStatusClass(d.status)}`}>
                                                        {d.status}
                                                    </span>
                                                </td>
                                                <td>{fmtDate(d.assignedAt)}</td>
                                                <td>{fmtDate(d.deliveredAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeSection === 'activity' && (
                    <div className="ed-card">
                        <div className="ed-card-header">
                            <h3>
                                <ClipboardList size={15} /> Activity Logs
                            </h3>
                            <span className="ed-badge-count">{activityLogs.length} entries</span>
                        </div>
                        {loadingLogs ? (
                            <div className="ed-empty">
                                <Loader2 size={22} className="spin" />
                                <p>Loading logs…</p>
                            </div>
                        ) : activityLogs.length === 0 ? (
                            <div className="ed-empty">
                                <ClipboardList size={24} />
                                <p>No activity logs found</p>
                            </div>
                        ) : (
                            <div className="ed-log-timeline">
                                {activityLogs.map((log, idx) => (
                                    <div key={log.id} className="ed-timeline-item">
                                        <div className="ed-timeline-line">
                                            <div className="ed-timeline-dot" />
                                            {idx < activityLogs.length - 1 && <div className="ed-timeline-connector" />}
                                        </div>
                                        <div className="ed-timeline-content">
                                            <p className="ed-timeline-desc">{log.description}</p>
                                            <span className="ed-timeline-time">
                                                <Calendar size={11} /> {fmtDateTime(log.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showEdit && (
                <EditProfileModal
                    profile={profile}
                    onClose={() => setShowEdit(false)}
                    onSaved={updated => {
                        setProfile(updated);
                        onEmployeeUpdated(updated);
                        setShowEdit(false);
                    }}
                />
            )}
        </div>
    );
}