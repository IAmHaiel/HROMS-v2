import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    LayoutDashboard,
    BarChart3,
    UserCircle2,
} from 'lucide-react';

import './employee_detail.css';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type NavTab =
    | 'dashboard'
    | 'employees'
    | 'delivery'
    | 'analytics'
    | 'profile';

interface EmployeeProfile {
    employeeNumber: string;
    employeeName: string;
    contactNumber: string;
    role: string;
    accountStatus: string;
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

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const ROLES = [
    'System Admin',
    'Operation Admin',
    'Operation Team',
    'Coordinator',
    'Delivery Driver',
    'Encoder',
];

const NAV_ITEMS: {
    tab: NavTab;
    icon: any;
    label: string;
}[] = [
        { tab: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { tab: 'employees', icon: Package, label: 'Manage Employees' },
        { tab: 'delivery', icon: Truck, label: 'Delivery' },
        { tab: 'analytics', icon: BarChart3, label: 'Analytics' },
        { tab: 'profile', icon: UserCircle2, label: 'Profile' },
    ];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const toBackendRole = (role: string) =>
    role.replace(/\s+/g, '');

const toDisplayRole = (role: string) =>
    role.replace(/([a-z])([A-Z])/g, '$1 $2');

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

// ─────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────

function Skeleton({
    w = '100%',
    h = 16,
}: {
    w?: string | number;
    h?: number;
}) {
    return (
        <div
            className="skel"
            style={{ width: w, height: h }}
        />
    );
}

// ─────────────────────────────────────────────────────────────
// EDIT MODAL
// ─────────────────────────────────────────────────────────────

interface EditModalProps {
    profile: EmployeeProfile;
    onClose: () => void;
    onSaved: (updated: EmployeeProfile) => void;
}

function EditProfileModal({
    profile,
    onClose,
    onSaved,
}: EditModalProps) {
    const [form, setForm] = useState({
        employeeName: profile.employeeName,
        contactNumber: profile.contactNumber,
        role: toDisplayRole(profile.role),
        accountStatus: profile.accountStatus,
    });

    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    const set =
        (key: keyof typeof form) =>
            (
                e: React.ChangeEvent<
                    HTMLInputElement | HTMLSelectElement
                >
            ) => {
                setForm(prev => ({
                    ...prev,
                    [key]: e.target.value,
                }));

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

            const updateRes = await fetch(
                `/api/systemadmin/update-user?employeeNumber=${encodeURIComponent(
                    profile.employeeNumber
                )}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        employeeNumber:
                            profile.employeeNumber,
                        employeeName: form.employeeName,
                        contactNumber:
                            form.contactNumber,
                    }),
                }
            );

            if (!updateRes.ok) {
                throw new Error(
                    `Error ${updateRes.status}`
                );
            }

            if (
                toBackendRole(form.role) !==
                profile.role
            ) {
                const roleRes = await fetch(
                    '/api/systemadmin/assign-role',
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type':
                                'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            employeeNumber:
                                profile.employeeNumber,
                            roleName: toBackendRole(
                                form.role
                            ),
                        }),
                    }
                );

                if (!roleRes.ok) {
                    throw new Error(
                        `Error ${roleRes.status}`
                    );
                }
            }

            if (form.accountStatus !== profile.accountStatus) {
                const statusEndpoint =
                    form.accountStatus === 'Active'
                        ? '/api/systemadmin/activate-user'
                        : '/api/systemadmin/deactivate-user';

                const statusRes = await fetch(
                    statusEndpoint,
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type':
                                'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            employeeNumber:
                                profile.employeeNumber,
                        }),
                    }
                );

                if (!statusRes.ok) {
                    throw new Error(
                        `Status update failed`
                    );
                }
            }

            onSaved({
                ...profile,
                employeeName: form.employeeName,
                contactNumber: form.contactNumber,
                role: toBackendRole(form.role),
                accountStatus:
                    form.accountStatus,
            });

            onClose();
        } catch (err: any) {
            setApiError(
                err.message ??
                'Something went wrong.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="ed-modal-overlay"
            onClick={onClose}
        >
            <div
                className="ed-modal-card"
                onClick={e => e.stopPropagation()}
            >
                <div className="ed-modal-header">
                    <div>
                        <h3>Edit Employee</h3>
                        <p>
                            Update details for{' '}
                            {profile.employeeName}
                        </p>
                    </div>

                    <button
                        className="ed-icon-btn"
                        onClick={onClose}
                    >
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

                        <input
                            type="text"
                            value={form.employeeName}
                            onChange={set(
                                'employeeName'
                            )}
                        />
                    </div>

                    <div className="ed-field">
                        <label>Contact Number</label>

                        <input
                            type="tel"
                            value={form.contactNumber}
                            onChange={set(
                                'contactNumber'
                            )}
                        />
                    </div>

                    <div className="ed-field-row">
                        <div className="ed-field">
                            <label>Role</label>

                            <select
                                value={form.role}
                                onChange={set('role')}
                            >
                                {ROLES.map(r => (
                                    <option
                                        key={r}
                                        value={r}
                                    >
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="ed-field">
                            <label>
                                Account Status
                            </label>

                            <select
                                value={
                                    form.accountStatus
                                }
                                onChange={set(
                                    'accountStatus'
                                )}
                            >
                                <option value="Active">
                                    Active
                                </option>

                                <option value="Deactivated">
                                    Deactivated
                                </option>

                                {profile.accountStatus === 'On Leave' && (
                                    <option value="On Leave">
                                        On Leave
                                    </option>
                                )}

                                {profile.accountStatus === 'Emergency Overriden' && (
                                    <option value="Emergency Overriden">
                                        Emergency Overriden
                                    </option>
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="ed-modal-actions">
                    <button
                        className="ed-btn"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </button>

                    <button
                        className="ed-btn ed-btn-primary"
                        onClick={handleSave}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2
                                    size={13}
                                    className="spin"
                                />
                                Saving…
                            </>
                        ) : (
                            <>
                                <Save size={13} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function EmployeeDetail() {
    const { employeeNumber } =
        useParams<{
            employeeNumber: string;
        }>();

    const navigate = useNavigate();

    const [adminName, setAdminName] =
        useState('Super Admin');

    const [adminInitial, setAdminInitial] =
        useState('S');

    const [activeTab, setActiveTab] =
        useState<NavTab>('employees');

    const [profile, setProfile] =
        useState<EmployeeProfile | null>(
            null
        );

    const [deliveries, setDeliveries] =
        useState<DeliveryRecord[]>([]);

    const [activityLogs, setActivityLogs] =
        useState<ActivityLog[]>([]);

    const [loadingProfile, setLoadingProfile] =
        useState(true);

    const [
        loadingDeliveries,
        setLoadingDeliveries,
    ] = useState(true);

    const [loadingLogs, setLoadingLogs] =
        useState(true);

    const [fetchError, setFetchError] =
        useState('');

    const [showEdit, setShowEdit] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const [activeSection, setActiveSection] =
        useState<
            'overview' | 'deliveries' | 'activity'
        >('overview');

    // ─────────────────────────────────────────
    // SIDEBAR NAVIGATION
    // ─────────────────────────────────────────

    const handleSidebarNavigation = (
        tab: NavTab
    ) => {
        setActiveTab(tab);

        switch (tab) {
            case 'dashboard':
                navigate(
                    '/systemadmin_dashboard'
                );
                break;

            case 'employees':
                navigate(
                    '/systemadmin_dashboard'
                );
                break;

            case 'delivery':
                navigate(
                    '/systemadmin_dashboard'
                );
                break;

            case 'analytics':
                navigate(
                    '/systemadmin_dashboard'
                );
                break;

            case 'profile':
                navigate(
                    '/systemadmin_dashboard'
                );
                break;

            default:
                break;
        }
    };

    // ─────────────────────────────────────────
    // DELIVERY COUNTS
    // ─────────────────────────────────────────

    const totalDeliveries =
        deliveries.length;

    const completedDeliveries =
        deliveries.filter(
            d =>
                d.status?.toLowerCase() ===
                'delivered'
        ).length;

    const inTransit =
        deliveries.filter(
            d =>
                d.status?.toLowerCase() ===
                'in-transit'
        ).length;

    const failedDeliveries =
        deliveries.filter(d =>
            ['failed', 'returned'].includes(
                d.status?.toLowerCase()
            )
        ).length;

    // ─────────────────────────────────────────
    // FETCH PROFILE
    // ─────────────────────────────────────────

    useEffect(() => {
        if (!employeeNumber) return;

        const token =
            localStorage.getItem(
                'authToken'
            );

        const decoded =
            decodeURIComponent(
                employeeNumber
            );

        fetch(
            '/api/systemadmin/recent-employees',
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )
            .then(res => {
                if (!res.ok)
                    throw new Error();

                return res.json();
            })
            .then((data: any[]) => {
                const found = data.find(
                    e =>
                        e.employeeNumber ===
                        decoded
                );

                if (!found)
                    throw new Error();

                setProfile({
                    employeeNumber:
                        found.employeeNumber,
                    employeeName:
                        found.employeeName,
                    contactNumber:
                        found.contactNumber ??
                        '',
                    role: found.role ?? '',
                    accountStatus:
                        found.accountStatus ??
                        'Active',
                });
            })
            .catch(() => {
                setFetchError(
                    'Could not load employee details.'
                );
            })
            .finally(() =>
                setLoadingProfile(false)
            );
    }, [employeeNumber]);

    useEffect(() => {
        const storedName =
            localStorage.getItem('employeeName');

        if (storedName) {
            setAdminName(storedName);

            setAdminInitial(
                storedName.charAt(0).toUpperCase()
            );
        }
    }, []);

    // ─────────────────────────────────────────
    // FETCH DELIVERIES
    // ─────────────────────────────────────────

    useEffect(() => {
        if (!employeeNumber) return;

        const token =
            localStorage.getItem(
                'authToken'
            );

        fetch(
            `/api/systemadmin/employee/${encodeURIComponent(
                employeeNumber
            )}/deliveries`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )
            .then(res => {
                if (!res.ok) return [];

                return res.json();
            })
            .then(data =>
                setDeliveries(
                    Array.isArray(data)
                        ? data
                        : []
                )
            )
            .catch(() =>
                setDeliveries([])
            )
            .finally(() =>
                setLoadingDeliveries(false)
            );
    }, [employeeNumber]);

    // ─────────────────────────────────────────
    // FETCH ACTIVITY LOGS
    // ─────────────────────────────────────────

    useEffect(() => {
        if (!employeeNumber) return;

        const token =
            localStorage.getItem(
                'authToken'
            );

        fetch(
            `/api/activity-logs/employee/${encodeURIComponent(
                employeeNumber
            )}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: 'no-store'
            }
        )
            .then(res => {
                if (!res.ok) return [];

                return res.json();
            })
            .then(data =>
                setActivityLogs(
                    Array.isArray(data)
                        ? data
                        : []
                )
            )
            .catch(() =>
                setActivityLogs([])
            )
            .finally(() =>
                setLoadingLogs(false)
            );
    }, [employeeNumber]);

    // ─────────────────────────────────────────
    // ACTIONS
    // ─────────────────────────────────────────

    const handleDelete = async () => {
        if (!profile) return;

        if (
            !confirm(
                `Delete ${profile.employeeName} permanently?`
            )
        )
            return;

        setDeleting(true);

        try {
            const token =
                localStorage.getItem(
                    'authToken'
                );

            const res = await fetch(
                '/api/systemadmin/delete-user',
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        employeeNumber:
                            profile.employeeNumber,
                    }),
                }
            );

            if (!res.ok)
                throw new Error();

            navigate(-1);
        } catch {
            alert(
                'Failed to delete employee.'
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!profile) return;

        const isActive = ['Active', 'On Leave', 'Emergency Overriden'].includes(profile.accountStatus);
        const next = isActive ? 'Deactivated' : 'Active';

        const endpoint =
            next === 'Active'
                ? '/api/systemadmin/activate-user'
                : '/api/systemadmin/deactivate-user';

        try {
            const token =
                localStorage.getItem(
                    'authToken'
                );

            const res = await fetch(
                endpoint,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        employeeNumber:
                            profile.employeeNumber,
                    }),
                }
            );

            if (!res.ok)
                throw new Error();

            setProfile(prev =>
                prev
                    ? {
                        ...prev,
                        accountStatus: next,
                    }
                    : prev
            );
        } catch {
            alert(
                'Failed to update status.'
            );
        }
    };

    const handleLogout = () => {
        [
            'employeeId',
            'refreshToken',
            'authToken',
        ].forEach(k =>
            localStorage.removeItem(k)
        );

        navigate('/');
    };

    // ─────────────────────────────────────────
    // JSX
    // ─────────────────────────────────────────

    return (
        <div className="ed-page">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img
                        src="/src/assets/SpeedexLogo.jpg"
                        alt="Speedex Logo"
                        className="sidebar-logo-img"
                    />
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(
                        ({
                            tab,
                            icon: Icon,
                            label,
                        }) => (
                            <div
                                key={tab}
                                className={`nav-item${activeTab === tab
                                    ? ' active'
                                    : ''
                                    }`}
                                onClick={() =>
                                    handleSidebarNavigation(
                                        tab
                                    )
                                }
                            >
                                <Icon size={22} />
                                <span>
                                    {label}
                                </span>
                            </div>
                        )
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-block">
                        <div className="avatar-circle">
                            {adminInitial}
                        </div>

                        <div className="user-text">
                            <span className="welcome-text">
                                Welcome!
                            </span>

                            <strong>
                                {adminName}
                            </strong>
                        </div>
                    </div>

                    <button
                        className="logout-btn-sidebar"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </aside>

            <main className="ed-main">
                {/* Error state */}
                {fetchError && (
                    <div className="ed-fetch-error">
                        <AlertCircle size={18} />
                        <p>{fetchError}</p>
                        <button className="ed-btn ed-btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
                    </div>
                )}

                {/* Hero */}
                {!fetchError && (
                    <div className="ed-hero">
                        <div className="ed-hero-inner">
                            {loadingProfile ? (
                                <div className="ed-hero-loading">
                                    <Skeleton w={72} h={72} />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <Skeleton w={200} h={22} />
                                        <Skeleton w={140} h={14} />
                                    </div>
                                </div>
                            ) : profile ? (
                                <>
                                    <div className="ed-hero-avatar">
                                        {profile.employeeName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="ed-hero-info">
                                        <div className="ed-hero-name-row">
                                            <h1>{profile.employeeName}</h1>
                                            <span className={`ed-status-pill ${profile.accountStatus.toLowerCase()}`}>
                                                {profile.accountStatus}
                                            </span>
                                        </div>
                                        <div className="ed-hero-meta">
                                            <span><Hash size={13} />{profile.employeeNumber}</span>
                                            <span><Shield size={13} />{toDisplayRole(profile.role)}</span>
                                            <span><Phone size={13} />{profile.contactNumber || '—'}</span>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {!loadingProfile && profile && (
                            <div className="ed-hero-stats">
                                {[
                                    { label: 'Total Deliveries', value: totalDeliveries, cls: '' },
                                    { label: 'Completed', value: completedDeliveries, cls: 'green' },
                                    { label: 'In Transit', value: inTransit, cls: 'amber' },
                                    { label: 'Failed / Returned', value: failedDeliveries, cls: 'red' },
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
                        )}
                    </div>


                )}
                {/* Top bar — actions only, no back button */}
                {profile && (
                    <div className="ed-topbar">
                        <div className="ed-topbar-actions">
                            <button
                                className={`ed-btn ed-btn-ghost${['Active', 'On Leave', 'Emergency Overriden'].includes(profile.accountStatus) ? ' deactivate' : ' activate'}`}
                                onClick={handleToggleStatus}
                            >
                                {['Active', 'On Leave', 'Emergency Overriden'].includes(profile.accountStatus)
                                    ? <><ToggleLeft size={15} /> Deactivate</>
                                    : <><ToggleRight size={15} /> Activate</>}
                            </button>
                            <button className="ed-btn ed-btn-secondary" onClick={() => setShowEdit(true)}>
                                <Pencil size={14} /> Edit Profile
                            </button>
                            <button className="ed-btn ed-btn-danger" onClick={handleDelete} disabled={deleting}>
                                {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />} Delete
                            </button>
                        </div>
                    </div>
                )}
                {/* Section tabs */}
                {!fetchError && (
                    <div className="ed-section-tabs">
                        {([
                            { key: 'overview', icon: User, label: 'Overview' },
                            { key: 'deliveries', icon: Truck, label: 'Delivery History' },
                            { key: 'activity', icon: ClipboardList, label: 'Activity Logs' },
                        ] as const).map(({ key, icon: Icon, label }) => (
                            <button
                                key={key}
                                className={`ed-section-tab${activeSection === key ? ' active' : ''}`}
                                onClick={() => setActiveSection(key)}
                            >
                                <Icon size={15} />{label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Body */}
                {!fetchError && (
                    <div className="ed-body">

                        {/* ── OVERVIEW ── */}
                        {activeSection === 'overview' && (
                            <div className="ed-overview-grid">

                                {/* Personal Information */}
                                <div className="ed-card">
                                    <div className="ed-card-header">
                                        <h3><User size={15} /> Personal Information</h3>
                                    </div>
                                    {loadingProfile ? (
                                        <div className="ed-field-list">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className="ed-info-row">
                                                    <Skeleton w="40%" /><Skeleton w="55%" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : profile ? (
                                        <div className="ed-field-list">
                                            {[
                                                { label: 'Employee Number', value: profile.employeeNumber, icon: Hash },
                                                { label: 'Full Name', value: profile.employeeName, icon: User },
                                                { label: 'Contact Number', value: profile.contactNumber || '—', icon: Phone },
                                                { label: 'Role', value: toDisplayRole(profile.role), icon: Shield },
                                                { label: 'Account Status', value: profile.accountStatus, icon: CheckCircle2 },
                                            ].map(({ label, value, icon: Icon }) => (
                                                <div key={label} className="ed-info-row">
                                                    <span className="ed-info-label"><Icon size={12} />{label}</span>
                                                    <span className={`ed-info-value${label === 'Account Status' ? ` status-${value.toLowerCase()}` : ''}`}>
                                                        {value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="ed-empty"><AlertCircle size={18} /><p>No profile data</p></div>
                                    )}
                                </div>

                                {/* Recent Activity */}
                                <div className="ed-card">
                                    <div className="ed-card-header">
                                        <h3><Clock size={15} /> Recent Activity</h3>
                                        <button className="ed-view-all" onClick={() => setActiveSection('activity')}>View all →</button>
                                    </div>
                                    {loadingLogs ? (
                                        <div className="ed-log-list">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="ed-log-item">
                                                    <Skeleton w="70%" /><Skeleton w="25%" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : activityLogs.length === 0 ? (
                                        <div className="ed-empty"><ClipboardList size={18} /><p>No activity recorded</p></div>
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

                        {/* ── DELIVERY HISTORY ── */}
                        {activeSection === 'deliveries' && (
                            <div className="ed-card">
                                <div className="ed-card-header">
                                    <h3><Truck size={15} /> Delivery History</h3>
                                    <span className="ed-badge-count">{totalDeliveries} records</span>
                                </div>
                                {loadingDeliveries ? (
                                    <div className="ed-empty"><Loader2 size={22} className="spin" /><p>Loading…</p></div>
                                ) : deliveries.length === 0 ? (
                                    <div className="ed-empty"><Package size={24} /><p>No delivery records found</p></div>
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

                        {/* ── ACTIVITY LOGS ── */}
                        {activeSection === 'activity' && (
                            <div className="ed-card">
                                <div className="ed-card-header">
                                    <h3><ClipboardList size={15} /> Activity Logs</h3>
                                    <span className="ed-badge-count">{activityLogs.length} entries</span>
                                </div>
                                {loadingLogs ? (
                                    <div className="ed-empty"><Loader2 size={22} className="spin" /><p>Loading logs…</p></div>
                                ) : activityLogs.length === 0 ? (
                                    <div className="ed-empty"><ClipboardList size={24} /><p>No activity logs found</p></div>
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
                                                        <Calendar size={11} />{fmtDateTime(log.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}
            </main>

            {showEdit && profile && (
                <EditProfileModal
                    profile={profile}
                    onClose={() =>
                        setShowEdit(false)
                    }
                    onSaved={updated => {
                        setProfile(updated);
                        setShowEdit(false);
                    }}
                />
            )}
        </div>
    );
}