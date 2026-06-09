import React, { useState, useEffect } from 'react';
import {
    ClipboardList,
    CheckCircle2,
    AlertCircle,
    Package,
    LayoutDashboard,
    Truck,
    BarChart3,
    UserCircle2,
    Plus,
    Pencil,
    X,
    Hash,
    Eye,
    EyeOff,
    Shield,
    Phone,
    Lock,
    ChevronRight,
    ChevronLeft,
    LogOut,
    Save,
    Loader2,
    Users,
    Search,
    Trash2,
    CalendarDays,
    Mail,
} from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './OpAdmin_Dashboard.css';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../../components/NotificationBell/NotificationBell';
import TaskView, { TaskViewTask } from '../../components/TaskView/TaskView';
import { useToast } from '../../components/Toast/Toast';
import LeaveRequestModal, {
    LeaveRecord,
    LeaveType,
    LeaveStatus,
    LEAVE_TYPES,
} from '../../components/LeaveRequestModal/LeaveRequestModal';
import { usePreventBackNav } from '../../components/Auth/usePreventBackNav';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'High' | 'Medium' | 'Low';  // match backend casing
type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
type NavTab =
    | 'dashboard'
    | 'tasks'
    | 'team'
    | 'leave'
    | 'reports'
    | 'profile';

interface TeamMember {
    accountId: string;  
    employeeName: string;
    role: string;
    presenceStatus?: string;
}

interface Task {
    taskId: string;
    taskTitle: string;
    taskDescription: string;
    priority: Priority;
    dueAt: string | null;
    taskStatus: TaskStatus;
    taskRemarks?: string;
    assignedEmployee: string;
    createdByEmployee: string;
    assignedTo: string;
    createdAt: string;
    deleted?: boolean;  
    Deleted?: boolean;   
}

// DTOs matching backend
interface CreateTaskDTO {
    taskTitle: string;
    taskDescription: string;
    priority: Priority;
    dueAt: string | null;
    assignedTo: string;      // accountId Guid
}

interface UpdateTaskDTO {
    taskTitle: string;
    taskDescription: string;
    priority: Priority;
    dueAt: string | null;
    assignedTo: string;
    taskRemarks?: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const WEEKLY_DATA = [
    { day: 'Mon', completed: 12, pending: 5 },
    { day: 'Tue', completed: 18, pending: 8 },
    { day: 'Wed', completed: 15, pending: 10 },
    { day: 'Thu', completed: 22, pending: 6 },
    { day: 'Fri', completed: 28, pending: 4 },
    { day: 'Sat', completed: 10, pending: 3 },
    { day: 'Sun', completed: 8, pending: 2 },
];

const NAV_GROUPS = [
    {
        label: 'MAIN MENU',
        items: [
            { tab: 'dashboard' as NavTab, icon: LayoutDashboard, label: 'Dashboard' },
            { tab: 'tasks' as NavTab, icon: Package, label: 'Tasks' },
            { tab: 'team' as NavTab, icon: Users, label: 'Team' },
        ],
    },
    {
        label: 'REPORTS',
        items: [
            { tab: 'reports' as NavTab, icon: BarChart3, label: 'Reports' },
        ],
    },
    {
        label: 'ACCOUNT',
        items: [
            { tab: 'profile' as NavTab, icon: UserCircle2, label: 'Profile' },
            { tab: 'leave' as NavTab, icon: CalendarDays, label: 'Leave Requests' },
        ],
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isEffectivelyOverdue = (t: Task): boolean =>
    t.taskStatus !== 'Completed' && !!t.dueAt && new Date(t.dueAt) < new Date();

const getInitials = (name: string): string => {
    if (!name) return 'OA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

const statusBadgeClass = (s: string): string =>
({
    'Pending': 'badge badge-blue',
    'In Progress': 'badge badge-amber',
    'Completed': 'badge badge-green',
    'Overdue': 'badge badge-red'
}[s] ?? 'badge badge-blue');

const priorityDotClass = (p: Priority): string =>
    ({ High: 'prio-dot high', Medium: 'prio-dot medium', Low: 'prio-dot low' }[p]);

const fmtDate = (d: string): string => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Avatar: React.FC<{ member: TeamMember; size?: 'sm' | 'md' }> = ({ member, size = 'sm' }) => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
        <div className={`avatar-chip av-blue ${size === 'md' ? 'avatar-md' : ''}`}>
            {member.employeeName.charAt(0).toUpperCase()}
        </div>
        <span style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 9, height: 9, borderRadius: '50%',
            background: member.presenceStatus === 'Online' ? '#05cd99' : '#a3aed0',
            border: '2px solid var(--bg-primary, #fff)',
            display: 'block'
        }} title={member.presenceStatus ?? 'Offline'} />
    </div>
);

const PrioBadge: React.FC<{ p: Priority }> = ({ p }) => (
    <span className={`badge ${p === 'High' ? 'badge-red' : p === 'Medium' ? 'badge-amber' : 'badge-green'}`}>{p}</span>
);

const ProgressBar: React.FC<{ pct: number; cls: string }> = ({ pct, cls }) => (
    <div className="progress-bar">
        <div className={`progress-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
);

interface TaskRowProps {
    task: Task;
    onView: (id: string) => void;   // string not number
    onEdit?: (id: string) => void;
    showEditBtn?: boolean;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, onView, onEdit, showEditBtn = false }) => {
    const od = isEffectivelyOverdue(task);
    const effectiveStatus = od ? 'Overdue' : task.taskStatus;
    return (
        <div className="task-item" onClick={() => onView(task.taskId)}>
            <div className="task-row-top">
                <span className={priorityDotClass(task.priority)} />
                <span className="task-name">{task.taskTitle}</span>
                <span className={statusBadgeClass(effectiveStatus)}>{effectiveStatus}</span>
                {showEditBtn && onEdit && (
                    <button className="btn btn-xs" onClick={e => { e.stopPropagation(); onEdit(task.taskId); }}>
                        <Pencil size={11} /> Edit
                    </button>
                )}
            </div>
            <div className="task-row-bottom">
                <span className="task-assignee">{task.assignedEmployee || 'Unassigned'}</span>
                <span className={`task-due${od ? ' overdue' : ''}`}>{task.dueAt ? fmtDate(task.dueAt) : '—'}</span>
            </div>
        </div>
    );
};

// ─── Modal: New / Edit Task ───────────────────────────────────────────────────

interface TaskModalProps {
    mode: 'new' | 'edit';
    initial?: Partial<Task>;
    teamMembers: TeamMember[];
    onSave: (data: CreateTaskDTO | UpdateTaskDTO) => void;
    onClose: () => void;
    onDelete?: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ mode, initial = {}, teamMembers, onSave, onClose, onDelete }) => {
    const resolvedAssignedTo =
        initial.assignedTo ||
        teamMembers.find(m => m.employeeName === initial.assignedEmployee)?.accountId ||
        '';

    const [form, setForm] = useState({
        taskTitle: initial.taskTitle ?? '',
        taskDescription: initial.taskDescription ?? '',
        dueAt: initial.dueAt ? initial.dueAt.split('T')[0] : '',
        priority: initial.priority ?? '' as Priority,
        assignedTo: resolvedAssignedTo,
        taskRemarks: initial.taskRemarks ?? '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    // ── Per-field live validator ──────────────────────────────────────────
    const validateField = (key: string, value: string): string => {
        switch (key) {
            case 'taskTitle': {
                const v = value.trim();
                if (!v) return 'Task title is required.';
                if (v.length < 3) return 'Title must be at least 3 characters.';
                if (v.length > 100) return 'Title must not exceed 100 characters.';
                return '';
            }
            case 'taskDescription': {
                const v = value.trim();
                if (v.length > 500) return 'Description must not exceed 500 characters.';
                return '';
            }
            case 'dueAt': {
                if (!value) return 'Due date is required.';
                const selected = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selected < today) return 'Due date cannot be in the past.';
                return '';
            }
            case 'assignedTo': {
                if (!value) return 'Please assign the task to someone.';
                return '';
            }
            case 'priority': {
                if (!value) return 'Priority is required.';
                if (!['High', 'Medium', 'Low'].includes(value)) return 'Please select a valid priority.';
                return '';
            }
            default:
                return '';
        }
    };

    // ── Validate all fields on submit ─────────────────────────────────────
    const validateAll = (): boolean => {
        const newErrors: Record<string, string> = {};
        (['taskTitle', 'taskDescription', 'dueAt', 'assignedTo', 'priority'] as const).forEach(key => {
            const msg = validateField(key, form[key] ?? '');
            if (msg) newErrors[key] = msg;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ── Live change handler ───────────────────────────────────────────────
    const set = (key: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const value = e.target.value;
            setForm(prev => ({ ...prev, [key]: value }));
            setFormError('');
            const msg = validateField(key, value);
            setErrors(prev => ({ ...prev, [key]: msg || '' }));
        };

    const handleSave = () => {
        if (!validateAll()) return;
        setSubmitting(true);
        onSave({
            taskTitle: form.taskTitle.trim(),
            taskDescription: form.taskDescription.trim(),
            priority: form.priority,
            dueAt: form.dueAt || null,
            assignedTo: form.assignedTo,
            taskRemarks: form.taskRemarks.trim() || undefined,
        });
        setSubmitting(false);
    };

    // ── Shared field error renderer ───────────────────────────────────────
    const FieldErr = ({ name }: { name: string }) =>
        errors[name] ? (
            <span style={{ fontSize: 11, color: 'var(--danger, #ee5d50)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={11} />{errors[name]}
            </span>
        ) : null;

    // ── Char counter renderer ─────────────────────────────────────────────
    const CharCount = ({ value, max }: { value: string; max: number }) => (
        <span style={{
            fontSize: 11, marginTop: 3, display: 'block', textAlign: 'right',
            color: value.length > max * 0.9 ? (value.length >= max ? 'var(--danger, #ee5d50)' : '#c05c00') : 'var(--text-secondary)',
        }}>
            {value.length}/{max}
        </span>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3>{mode === 'new' ? 'Create New Task' : 'Edit Task'}</h3>
                        <p className="modal-subtitle">
                            {mode === 'new' ? 'Fill in the details to create a new task.' : 'Update the task details below.'}
                        </p>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={16} /></button>
                </div>

                <div className="modal-form">

                    {/* ── Task Title ── */}
                    <div className="field">
                        <label>Task Title <span style={{ color: 'var(--danger, #ee5d50)' }}>*</span></label>
                        <input
                            value={form.taskTitle}
                            onChange={set('taskTitle')}
                            placeholder="e.g. Route planning update"
                            className={errors.taskTitle ? 'input-error' : ''}
                            maxLength={100}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <FieldErr name="taskTitle" />
                            {!errors.taskTitle && form.taskTitle.trim().length >= 3 && (
                                <span style={{ fontSize: 11, color: '#05cd99', marginTop: 3 }}>✓ Looks good</span>
                            )}
                            <CharCount value={form.taskTitle} max={100} />
                        </div>
                    </div>

                    {/* ── Description ── */}
                    <div className="field">
                        <label>Description</label>
                        <textarea
                            value={form.taskDescription}
                            onChange={set('taskDescription')}
                            placeholder="Describe the task..."
                            rows={3}
                            className={errors.taskDescription ? 'input-error' : ''}
                            maxLength={500}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <FieldErr name="taskDescription" />
                            <CharCount value={form.taskDescription} max={500} />
                        </div>
                    </div>

                    {/* ── Due Date + Priority ── */}
                    <div className="field-row">
                        <div className="field">
                            <label>
                                Due Date <span style={{ color: 'var(--danger, #ee5d50)' }}>*</span>
                            </label>
                            <input
                                type="date"
                                value={form.dueAt}
                                onChange={set('dueAt')}
                                className={errors.dueAt ? 'input-error' : form.dueAt ? 'input-success' : ''}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <FieldErr name="dueAt" />
                            {!errors.dueAt && form.dueAt && (
                                <span style={{ fontSize: 11, color: '#05cd99', marginTop: 3, display: 'block' }}>
                                    ✓ {new Date(form.dueAt + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            )}
                            {!form.dueAt && !errors.dueAt && (
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>
                                    Cannot be a past date.
                                </span>
                            )}
                        </div>
                        <div className="field">
                            <label>
                                Priority <span style={{ color: 'var(--danger, #ee5d50)' }}>*</span>
                            </label>
                            <select
                                value={form.priority}
                                onChange={set('priority')}
                                className={errors.priority ? 'input-error' : ''}
                            >
                                <option value="">Select priority</option>
                                <option value="High">🔴 High</option>
                                <option value="Medium">🟡 Medium</option>
                                <option value="Low">🟢 Low</option>
                            </select>
                            <FieldErr name="priority" />
                            {!errors.priority && form.priority && (
                                <span style={{
                                    fontSize: 11, marginTop: 3, display: 'block',
                                    color: form.priority === 'High' ? '#ee5d50' : form.priority === 'Medium' ? '#ffb547' : '#05cd99',
                                }}>
                                    {form.priority === 'High' && '⚠ High priority — will be flagged for urgent attention'}
                                    {form.priority === 'Medium' && '✓ Medium priority selected'}
                                    {form.priority === 'Low' && '✓ Low priority selected'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── Assign To ── */}
                    <div className="field">
                        <label>Assign To <span style={{ color: 'var(--danger, #ee5d50)' }}>*</span></label>
                        <div
                            className={`assignee-select${errors.assignedTo ? ' input-error' : ''}`}
                            tabIndex={0}
                            onBlur={e => {
                                if (!e.currentTarget.contains(e.relatedTarget))
                                    e.currentTarget.querySelector<HTMLElement>('.assignee-options')?.style.setProperty('display', 'none');
                            }}
                        >
                            <div
                                className="assignee-trigger"
                                onClick={e => {
                                    const opts = e.currentTarget.nextElementSibling as HTMLElement;
                                    opts.style.display = opts.style.display === 'block' ? 'none' : 'block';
                                }}
                            >
                                <span className={form.assignedTo ? 'assignee-trigger-value' : 'assignee-trigger-placeholder'}>
                                    {form.assignedTo
                                        ? teamMembers.find(m => m.accountId === form.assignedTo)?.employeeName ?? 'Select employee'
                                        : 'Select employee'}
                                </span>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div className="assignee-options" style={{ display: 'none' }}>
                                <div
                                    className="assignee-option placeholder-opt"
                                    onClick={e => {
                                        setForm(prev => ({ ...prev, assignedTo: '' }));
                                        setErrors(prev => ({ ...prev, assignedTo: 'Please assign the task to someone.' }));
                                        (e.currentTarget.closest('.assignee-options') as HTMLElement).style.display = 'none';
                                    }}
                                >
                                    Select employee
                                </div>
                                {teamMembers.map(m => (
                                    <div
                                        key={m.accountId}
                                        className={`assignee-option${form.assignedTo === m.accountId ? ' selected' : ''}`}
                                        onClick={e => {
                                            setForm(prev => ({ ...prev, assignedTo: m.accountId }));
                                            setErrors(prev => ({ ...prev, assignedTo: '' }));
                                            (e.currentTarget.closest('.assignee-options') as HTMLElement).style.display = 'none';
                                        }}
                                    >
                                        <span className="assignee-opt-name">{m.employeeName}</span>
                                        <span className="assignee-opt-role">{m.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <FieldErr name="assignedTo" />
                        {!errors.assignedTo && form.assignedTo && (
                            <span style={{ fontSize: 11, color: '#05cd99', marginTop: 3, display: 'block' }}>
                                ✓ {teamMembers.find(m => m.accountId === form.assignedTo)?.employeeName} assigned
                            </span>
                        )}
                    </div>

                    {/* ── Remarks (edit mode only) ── */}
                    {mode === 'edit' && (
                        <div className="field">
                            <label>Remarks</label>
                            <input
                                value={form.taskRemarks}
                                onChange={set('taskRemarks')}
                                placeholder="Optional remarks..."
                                maxLength={200}
                            />
                            <CharCount value={form.taskRemarks} max={200} />
                        </div>
                    )}
                </div>

                {formError && (
                    <div className="form-api-error" style={{ marginBottom: 8 }}>
                        <AlertCircle size={14} /><span>{formError}</span>
                    </div>
                )}

                <div className="modal-actions">
                    <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                        {mode === 'edit' && onDelete && (
                            <button className="btn btn-danger" onClick={() => onDelete()} disabled={submitting}>
                                <Trash2 size={13} /> Delete Task
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn" onClick={onClose} disabled={submitting}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                            {submitting
                                ? <><Loader2 size={13} className="spin" /> Saving…</>
                                : <><Save size={13} /> Save Changes</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Modal: View Task ─────────────────────────────────────────────────────────

interface ViewModalProps {
    task: Task;
    onEdit: () => void;
    onReopen: () => void;
    onClose: () => void;
    onViewMore?: () => void;
}

const ViewModal: React.FC<ViewModalProps> = ({ task, onEdit, onReopen, onClose, onViewMore }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card view-modal-card" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="view-modal-header">
                    <div>
                        <h3 className="view-modal-title">{task.taskTitle}</h3>
                        <p className="view-modal-subtitle">Created by: {task.createdByEmployee}</p>
                    </div>
                </div>

                {/* Meta row */}
                <div className="view-modal-meta">
                    <div className="view-modal-meta-item">
                        <span className="view-modal-label">Due Date</span>
                        <span className="view-modal-meta-value">{task.dueAt ? fmtDate(task.dueAt) : '—'}</span>
                    </div>
                    <div className="view-modal-meta-item">
                        <span className="view-modal-label">Priority</span>
                        <PrioBadge p={task.priority} />
                    </div>
                    <div className="view-modal-meta-item">
                        <span className="view-modal-label">Status</span>
                        <span className={statusBadgeClass(task.taskStatus)}>{task.taskStatus}</span>
                    </div>
                </div>

                {/* Description */}
                <div className="view-modal-section">
                    <label className="view-modal-label">Description</label>
                    <div className="view-modal-desc-box">
                        {task.taskDescription || ''}
                    </div>
                </div>

                {/* Assigned To */}
                <div className="view-modal-section">
                    <label className="view-modal-label">Assigned To:</label>
                    <div className="view-modal-assignee-box">
                        {task.assignedEmployee || '—'}
                    </div>
                </div>

                {/* Remarks if any */}
                {task.taskRemarks && (
                    <div className="view-modal-section">
                        <label className="view-modal-label">Remarks</label>
                        <div className="view-modal-desc-box">{task.taskRemarks}</div>
                    </div>
                )}

                {/* Actions */}
                <div className="view-modal-actions">
                    <button className="btn btn-danger" onClick={onReopen}
                        style={{ visibility: task.taskStatus === 'Completed' ? 'visible' : 'hidden' }}>
                        Reopen
                    </button>
                    <button className="btn btn-primary" onClick={onViewMore}>
                        View More
                    </button>
                    <button className="btn btn-primary" onClick={onEdit}>
                        <Pencil size={13} /> Edit Task
                    </button>
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

const DashboardTab: React.FC<{ tasks: Task[]; loading: boolean; onView: (id: string) => void; onNewTask: () => void }> =
    ({ tasks, loading, onView, onNewTask }) => {
        const total = tasks.length;
        const inProg = tasks.filter(t => t.taskStatus === 'In Progress').length;
        const done = tasks.filter(t => t.taskStatus === 'Completed').length;
        const overdue = tasks.filter(t => t.taskStatus === 'Overdue' || isEffectivelyOverdue(t)).length;
        const hi = tasks.filter(t => t.priority === 'High').length;
        const md = tasks.filter(t => t.priority === 'Medium').length;
        const lo = tasks.filter(t => t.priority === 'Low').length;
        const pct = total ? Math.round(done / total * 100) : 0;

        return (
            <div className="dashboard-content">
                {/* Stat Cards */}
                <div className="stats-row">
                    {[
                        { label: 'TOTAL TASKS', value: total, icon: <ClipboardList size={18} />, cls: 'bg-primary', sub: 'All active tasks' },
                        { label: 'IN PROGRESS', value: inProg, icon: <Truck size={18} />, cls: 'bg-warning', sub: 'Assigned & running' },
                        { label: 'COMPLETED', value: done, icon: <CheckCircle2 size={18} />, cls: 'bg-success', sub: 'This period' },
                        { label: 'OVERDUE', value: overdue, icon: <AlertCircle size={18} />, cls: 'bg-danger', sub: 'Past deadline' },
                    ].map(s => (
                        <div key={s.label} className="stat-card">
                            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                            <div className="stat-text">
                                <p className="stat-label">{s.label}</p>
                                <h3 className="stat-value">{s.value}</h3>
                                <small>{s.sub}</small>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Middle Grid */}
                <div className="dashboard-grid">
                    {/* Recent Tasks */}
                    <div className="card">
                        <div className="card-header">
                            <h3>Recent Tasks</h3>
                            <span className="view-all-link">View all <ChevronRight size={12} /></span>
                        </div>
                        {loading ? (
                            <div className="empty-state"><Loader2 size={20} className="spin" /><p>Loading tasks…</p></div>
                        ) : tasks.slice(-5).reverse().map(t => (
                            <TaskRow key={t.taskId} task={t} onView={onView} />
                        ))}
                    </div>

                    {/* Priority Breakdown */}
                    <div className="card">
                        <div className="card-header">
                            <h3>Priority Breakdown</h3>
                        </div>
                        <div className="perf-bars">
                            {[
                                { label: 'High', val: hi, cls: 'fill-red' },
                                { label: 'Medium', val: md, cls: 'fill-amber' },
                                { label: 'Low', val: lo, cls: 'fill-green' },
                            ].map(p => (
                                <div key={p.label} className="perf-item">
                                    <span className="perf-label">{p.label}</span>
                                    <div className="perf-track">
                                        <div className={`perf-fill ${p.cls}`} style={{ width: `${Math.round(p.val / (Math.max(hi, md, lo) || 1) * 100)}%` }} />
                                    </div>
                                    <span className="perf-pct">{p.val}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>{pct}%</span>
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 6px' }}>completion rate</p>
                            </div>
                            <ProgressBar pct={pct} cls="green" />
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="dashboard-bottom-row">
                    <div className="card" style={{ flex: 2 }}>
                        <div className="card-header">
                            <h3>Delivery Performance</h3>
                            <span className="badge-week">This Week</span>
                        </div>
                        <div className="chart-wrap">
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={WEEKLY_DATA} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a3aed0' }} />
                                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="completed" fill="#4318ff" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="pending" fill="#ffb547" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

const TasksTab: React.FC<{
    tasks: Task[];
    allTasks: Task[];
    binTasks: Task[];
    loading: boolean;
    searchQuery: string;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onRestore: (taskId: string) => void;
    onEmptyBin: () => void;
}> = ({ tasks, allTasks, binTasks, loading, searchQuery, onView, onEdit, onRestore, onEmptyBin }) => {
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [subTab, setSubTab] = useState<'active' | 'bin'>('active');

    const deletedTasks = binTasks;

    const filtered = tasks.filter(t =>
        (!filterStatus || t.taskStatus === filterStatus) &&
        (!filterPriority || t.priority === filterPriority) &&
        (!searchQuery || t.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="dashboard-content">

            {/* ── Subtab Bar ── */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16, background: 'var(--bg-card)', borderRadius: '12px 12px 0 0', padding: '0 20px' }}>
                {([
                    { key: 'active', label: 'Active Tasks', icon: <Package size={14} />, count: tasks.length },
                    { key: 'bin', label: 'Bin', icon: <Trash2 size={14} />, count: deletedTasks.length },
                ] as const).map(({ key, label, icon, count }) => (
                    <button
                        key={key}
                        onClick={() => setSubTab(key)}
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
                        {count > 0 && (
                            <span style={{
                                fontSize: 11, fontWeight: 600,
                                padding: '1px 7px', borderRadius: 999,
                                background: key === 'bin'
                                    ? 'rgba(238,93,80,0.12)'
                                    : subTab === key ? 'rgba(67,24,255,0.1)' : 'var(--border)',
                                color: key === 'bin' ? 'var(--status-failed)' : subTab === key ? 'var(--primary)' : 'var(--text-secondary)',
                            }}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ══ ACTIVE TASKS PANE ══ */}
            {subTab === 'active' && (
                <>
                    <div className="filter-bar" style={{ marginBottom: 12 }}>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                            <option value="">All Priorities</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div className="card">
                        {loading ? (
                            <div className="empty-state"><Loader2 size={20} className="spin" /><p>Loading tasks…</p></div>
                        ) : filtered.length === 0 ? (
                            <div className="empty-state"><Package size={20} /><p>No tasks match filters</p></div>
                        ) : filtered.map(t => (
                            <TaskRow key={t.taskId} task={t} onView={onView} onEdit={onEdit} showEditBtn />
                        ))}
                    </div>
                </>
            )}

            {/* ══ BIN PANE ══ */}
            {subTab === 'bin' && (
                <div className="card">
                    {/* Bin notice */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(238,93,80,0.06)', border: '1px solid rgba(238,93,80,0.18)', borderRadius: 10, fontSize: 13, color: '#b42318', flex: 1 }}>
                            <Trash2 size={14} />
                            Items in the bin are soft-deleted. You can restore them or empty the bin.
                        </div>
                        {deletedTasks.length > 0 && (
                            <button
                                className="btn btn-danger"
                                style={{ marginLeft: 12, whiteSpace: 'nowrap' }}
                                onClick={() => onEmptyBin()}
                            >
                                <Trash2 size={13} /> Empty Bin
                            </button>
                        )}
                    </div>

                    {deletedTasks.length === 0 ? (
                        <div className="empty-state">
                            <Trash2 size={24} />
                            <p>Bin is empty</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>TASK</th>
                                    <th>ASSIGNEE</th>
                                    <th>PRIORITY</th>
                                    <th>DUE DATE</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deletedTasks.map(t => (
                                    <tr key={t.taskId} style={{ opacity: 0.75 }}>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', textDecoration: 'line-through', textDecorationColor: 'var(--text-secondary)' }}>
                                                {t.taskTitle}
                                            </div>
                                            {t.taskDescription && (
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {t.taskDescription}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                            {t.assignedEmployee || '—'}
                                        </td>
                                        <td><PrioBadge p={t.priority} /></td>
                                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                            {t.dueAt ? fmtDate(t.dueAt) : '—'}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-xs"
                                                style={{ background: 'rgba(5,205,153,0.1)', color: '#05cd99', border: '1px solid rgba(5,205,153,0.3)', fontWeight: 600 }}
                                                onClick={() => onRestore(t.taskId)}
                                            >
                                                <CheckCircle2 size={11} /> Restore
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
    };

// ─── Team Tab ─────────────────────────────────────────────────────────────────

const TeamTab: React.FC<{
    tasks: Task[];
    teamMembers: TeamMember[];
    onView: (id: string) => void;
}> = ({ tasks, teamMembers, onView }) => {
    const [selectedMemberId, setSelectedMemberId] = useState(teamMembers[0]?.accountId ?? '');
    const maxLoad = Math.max(...teamMembers.map(m =>
        tasks.filter(t => t.assignedEmployee === m.employeeName).length), 1);

    return (
        <div className="dashboard-content">
            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><h3>Team Members</h3></div>
                    {teamMembers.length === 0 ? (
                        <div className="empty-state"><Users size={20} /><p>No team members found</p></div>
                    ) : teamMembers.map(m => {
                        const mt = tasks.filter(t => t.assignedEmployee === m.employeeName);
                        const mc = mt.filter(t => t.taskStatus === 'Completed').length;
                        return (
                            <div
                                key={m.accountId}
                                className={`member-row${selectedMemberId === m.accountId ? ' selected' : ''}`}
                                onClick={() => setSelectedMemberId(m.accountId)}
                            >
                                <Avatar member={m} />
                                <div style={{ flex: 1 }}>
                                    <div className="member-name">{m.employeeName}</div>
                                    <div className="member-role">{m.role}</div>
                                </div>
                                <span className="badge badge-blue">{mt.length} tasks</span>
                                <span className="badge badge-green">{mc} done</span>
                            </div>
                        );
                    })}
                </div>
                <div className="card">
                    <div className="card-header"><h3>Workload Distribution</h3></div>
                    <div className="perf-bars">
                        {teamMembers.map(m => {
                            const cnt = tasks.filter(t => t.assignedEmployee === m.employeeName).length;
                            return (
                                <div key={m.accountId} className="perf-item">
                                    <span className="perf-label">{m.employeeName.split(' ')[0]}</span>
                                    <div className="perf-track">
                                        <div className="perf-fill fill-primary" style={{ width: `${Math.round(cnt / maxLoad * 100)}%` }} />
                                    </div>
                                    <span className="perf-pct">{cnt}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="card-header">
                    <h3>{teamMembers.find(m => m.accountId === selectedMemberId)?.employeeName}'s Tasks</h3>
                </div>
                {tasks.filter(t => t.assignedEmployee === teamMembers.find(m => m.accountId === selectedMemberId)?.employeeName).length === 0
                    ? <div className="empty-state"><Package size={20} /><p>No tasks assigned</p></div>
                    : tasks
                        .filter(t => t.assignedEmployee === teamMembers.find(m => m.accountId === selectedMemberId)?.employeeName)
                        .map(t => <TaskRow key={t.taskId} task={t} onView={onView} />)
                }
            </div>
        </div>
    );
};

// ─── Reports Tab ──────────────────────────────────────────────────────────────

const ReportsTab: React.FC<{ tasks: Task[]; teamMembers: TeamMember[] }> = ({ tasks, teamMembers }) => {
    const total = tasks.length || 1;
    const done = tasks.filter(t => t.taskStatus === 'Completed').length;
    const hiDone = tasks.filter(t => t.taskStatus === 'Completed' && t.priority === 'High').length;
    const avg = teamMembers.length ? (tasks.length / teamMembers.length).toFixed(1) : '0';
    const rate = Math.round(done / total * 100);
    const ontime = tasks.filter(t =>
        t.taskStatus === 'Completed' && (!t.dueAt || new Date(t.dueAt) >= new Date())
    ).length;
    const ontimeRate = Math.round(ontime / total * 100);

    const statuses: TaskStatus[] = ['Pending', 'In Progress', 'Completed', 'Overdue'];
    const maxStat = Math.max(...statuses.map(s => tasks.filter(t => t.taskStatus === s).length), 1);
    const statusColors: Record<string, string> = {
        'Pending': 'fill-primary',
        'In Progress': 'fill-amber',
        'Completed': 'fill-green',
        'Overdue': 'fill-red',
    };

    return (
        <div className="dashboard-content">
            <div className="stats-row">
                {[
                    { label: 'COMPLETION RATE', value: `${rate}%`, icon: <CheckCircle2 size={18} />, cls: 'bg-success', sub: 'Tasks finished on time' },
                    { label: 'HIGH PRIORITY DONE', value: hiDone, icon: <AlertCircle size={18} />, cls: 'bg-danger', sub: 'Critical tasks resolved' },
                    { label: 'AVG TASKS / MEMBER', value: avg, icon: <Users size={18} />, cls: 'bg-primary', sub: 'Workload balance' },
                    { label: 'ON-TIME RATE', value: `${ontimeRate}%`, icon: <BarChart3 size={18} />, cls: 'bg-warning', sub: 'Completed before deadline' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                        <div className="stat-text">
                            <p className="stat-label">{s.label}</p>
                            <h3 className="stat-value">{s.value}</h3>
                            <small>{s.sub}</small>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><h3>Task Status Distribution</h3></div>
                    <div className="perf-bars" style={{ marginTop: 8 }}>
                        {statuses.map(s => {
                            const cnt = tasks.filter(t => t.taskStatus === s).length;
                            return (
                                <div key={s} className="perf-item">
                                    <span className="perf-label" style={{ textTransform: 'capitalize' }}>{s}</span>
                                    <div className="perf-track">
                                        <div className={`perf-fill ${statusColors[s]}`} style={{ width: `${Math.round(cnt / maxStat * 100)}%` }} />
                                    </div>
                                    <span className="perf-pct">{cnt}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><h3>Team Performance</h3></div>
                    <div className="perf-bars" style={{ marginTop: 8 }}>
                        {teamMembers.map(m => {
                            const mt = tasks.filter(t => t.assignedEmployee === m.employeeName);
                            const mc = mt.filter(t => t.taskStatus === 'Completed').length;
                            const r = mt.length ? Math.round(mc / mt.length * 100) : 0;
                            return (
                                <div key={m.accountId} className="perf-item">
                                    <span className="perf-label">{m.employeeName.split(' ')[0]}</span>
                                    <div className="perf-track">
                                        <div className="perf-fill fill-primary" style={{ width: `${r}%` }} />
                                    </div>
                                    <span className="perf-pct">{r}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3>Full Task Report</h3></div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>TASK</th>
                                <th>ASSIGNEE</th>
                                <th>PRIORITY</th>
                                <th>DEADLINE</th>
                                <th>STATUS</th>
                                <th>PROGRESS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(t => (
                                <tr key={t.taskId}>
                                    <td>{t.taskTitle}</td>
                                    <td>{t.assignedEmployee || '—'}</td>
                                    <td><PrioBadge p={t.priority} /></td>
                                    <td>{t.dueAt ? fmtDate(t.dueAt) : '—'}</td>
                                    <td><span className={statusBadgeClass(t.taskStatus)}>{t.taskStatus}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
    const { success, error } = useToast();
    const employeeId = localStorage.getItem('employeeId') ?? '';
    const firstName = localStorage.getItem('firstName') ?? '';
    const middleName = localStorage.getItem('middleName') ?? '';
    const lastName = localStorage.getItem('lastName') ?? '';
    const employeeNameStored = [firstName, middleName, lastName].filter(Boolean).join(' ');
    const employeeContact = localStorage.getItem('contactNumber') ?? '';
    const storedEmail = localStorage.getItem('email') ?? '';

    // ── Profile edit state ───────────────────────────────────────────────────
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        contactNumber: employeeContact,
        email: storedEmail,
    });
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [profileError, setProfileError] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

    // ── Password Gate state ──────────────────────────────────────────────────
    const [passwordGate, setPasswordGate] = useState(false);
    const [gatePassword, setGatePassword] = useState('');
    const [gateError, setGateError] = useState('');
    const [gateLoading, setGateLoading] = useState(false);
    const [showGatePassword, setShowGatePassword] = useState(false);

    // ── Password change state ────────────────────────────────────────────────
    const [editingPassword, setEditingPassword] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwError, setPwError] = useState('');
    const [pwSaving, setPwSaving] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const t = localStorage.getItem('authToken');
        if (!t) return;
        fetch('/api/profile/view-profile', {
            headers: { Authorization: `Bearer ${t}` },
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) return;
                const contact = data.contactNumber ?? data.contact ?? data.phoneNumber ?? '';
                const email = data.email ?? '';
                if (contact) {
                    localStorage.setItem('contactNumber', contact);
                    setProfileForm(prev => ({ ...prev, contactNumber: contact }));
                }
                if (email) {
                    localStorage.setItem('email', email);
                    setProfileForm(prev => ({ ...prev, email: email }));
                }
            })
            .catch(() => { });
    }, []);

    const authHeader = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    });

    // ── "Save Changes" clicked: validate first, then open gate ───────────────
    const requestSave = () => {
        if (!profileForm.firstName.trim() || !/^[A-Za-z\s]{1,50}$/.test(profileForm.firstName.trim())) {
            setProfileError('Given Name must contain letters only and be up to 50 characters.');
            return;
        }
        if (profileForm.middleName?.trim() && !/^[A-Za-z\s]{1,50}$/.test(profileForm.middleName.trim())) {
            setProfileError('Middle Name must contain letters only and be up to 50 characters.');
            return;
        }
        if (!profileForm.lastName.trim() || !/^[A-Za-z\s]{1,50}$/.test(profileForm.lastName.trim())) {
            setProfileError('Last Name must contain letters only and be up to 50 characters.');
            return;
        }
        const email = profileForm.email.trim();
        if (!email || email.length < 12 || email.length > 64 || !/^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
            setProfileError('Enter a valid Email Address (12-64 characters, local-part@domain).');
            return;
        }
        if (!profileForm.contactNumber.trim() || !/^[0-9]{11}$/.test(profileForm.contactNumber.trim())) {
            setProfileError('Contact Number must be exactly 11 digits.');
            return;
        }
        setProfileError('');
        setGatePassword('');
        setGateError('');
        setShowGatePassword(false);
        setPasswordGate(true);
    };

    // ── Gate confirmed: verify password then save ────────────────────────────
    const handleGateConfirm = async () => {
        if (!gatePassword) { setGateError('Please enter your password.'); return; }
        setGateLoading(true);
        setGateError('');
        try {
            const verifyRes = await fetch('/api/authentication/verify-password', {
                method: 'POST',
                headers: authHeader(),
                body: JSON.stringify({
                    employeeID: employeeId,   
                    password: gatePassword,
                }),
            });
            if (!verifyRes.ok) {
                const err = await verifyRes.json().catch(() => ({}));
                throw new Error((err as any).message || 'Incorrect password. Please try again.');
            }
            setPasswordGate(false);
            setGatePassword('');
            await performSave();
        } catch (err: any) {
            setGateError(err.message ?? 'Incorrect password. Please try again.');
        } finally {
            setGateLoading(false);
        }
    };

    // ── Actual save (only called after password verified) ────────────────────
    const performSave = async () => {
        setProfileSaving(true);
        setProfileError('');
        try {
            const res = await fetch(
                `/api/profile/update-profile?employeeNumber=${encodeURIComponent(employeeId)}`,
                {
                    method: 'PUT',
                    headers: authHeader(),
                    body: JSON.stringify({
                        employeeNumber: employeeId,
                        firstName: profileForm.firstName.trim(),
                        middleName: profileForm.middleName.trim(),
                        lastName: profileForm.lastName.trim(),
                        contactNumber: profileForm.contactNumber.trim(),
                        email: profileForm.email.trim(),
                    }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message || 'Profile update failed.');
            }
            localStorage.setItem('firstName', profileForm.firstName.trim());
            localStorage.setItem('middleName', profileForm.middleName.trim());
            localStorage.setItem('lastName', profileForm.lastName.trim());
            localStorage.setItem('contactNumber', profileForm.contactNumber.trim());
            localStorage.setItem('email', profileForm.email.trim());
            setProfileSuccess(true);
            setEditingProfile(false);
            setTimeout(() => setProfileSuccess(false), 2500);
            success('Profile updated successfully.');
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

    const validateField = (key: string, value: string) => {
        let err = '';
        if (key === 'firstName' || key === 'middleName' || key === 'lastName') {
            if (value && !/^[A-Za-z\s]+$/.test(value)) err = 'Letters only (A-Z, a-z)';
            else if (value.length > 50) err = 'Max 50 characters';
            else if ((key === 'firstName' || key === 'lastName') && !value) err = 'Required';
        } else if (key === 'email') {
            if (!value) err = 'Required';
            else if (value.length < 12 || value.length > 64) err = 'Must be 12-64 characters';
            else if (!/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) err = 'Invalid format';
        } else if (key === 'contactNumber') {
            if (value && !/^\d+$/.test(value)) err = 'Numbers only';
            else if (value && value.length !== 11) err = 'Must be exactly 11 digits';
        }
        setValidationErrors(prev => ({ ...prev, [key]: err }));
        return err;
    };

    const handleProfileChange = (key: keyof typeof profileForm) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setProfileForm(prev => ({ ...prev, [key]: val }));
            validateField(key, val);
            setProfileError('');
            setProfileSuccess(false);
        };

    const handlePwSave = async () => {
        if (!pwForm.current) { setPwError('Current password is required.'); return; }
        if (pwForm.next.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
        if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
        setPwSaving(true);
        try {
            const res = await fetch('/api/profile/change-password', {
                method: 'PATCH',
                headers: authHeader(),
                body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message || 'Password update failed.');
            }
            success('Password changed successfully!');
            setEditingPassword(false);
            setPwForm({ current: '', next: '', confirm: '' });
        } catch (err: any) {
            setPwError(err.message ?? 'Something went wrong.');
        } finally {
            setPwSaving(false);
        }
    };

    const displayName = [profileForm.firstName, profileForm.middleName, profileForm.lastName]
        .filter(Boolean).join(' ') || 'Operation Admin';
    const displayContact = profileForm.contactNumber || employeeContact;

    return (
        <div className="dashboard-content">

            {/* ── Password Gate Modal ──────────────────────────────────────── */}
            {passwordGate && (
                <div className="modal-overlay" onClick={() => setPasswordGate(false)}>
                    <div
                        className="modal-card"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: 400 }}
                    >
                        <div className="modal-head">
                            <div>
                                <h3>Confirm Your Identity</h3>
                                <p className="modal-sub">Enter your password to save your profile changes.</p>
                            </div>
                            <button
                                className="icon-btn"
                                onClick={() => setPasswordGate(false)}
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            padding: '8px 0 16px', gap: 8,
                        }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: '50%',
                                background: 'rgba(67,24,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Lock size={22} color="var(--primary)" />
                            </div>
                            <p style={{
                                fontSize: 13, color: 'var(--text-secondary)',
                                textAlign: 'center', margin: 0,
                            }}>
                                For your security, please verify your identity before saving changes.
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
                                    style={{
                                        position: 'absolute', right: 12, top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                                    }}
                                    tabIndex={-1}
                                >
                                    {showGatePassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn"
                                onClick={() => setPasswordGate(false)}
                                disabled={gateLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleGateConfirm}
                                disabled={gateLoading || !gatePassword}
                            >
                                {gateLoading
                                    ? <><Loader2 size={13} className="spin" /> Verifying…</>
                                    : <><Shield size={13} /> Confirm & Save</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1.5fr' }}>

                {/* ── Profile Card ─────────────────────────────────────────── */}
                <div className="card">
                    <div className="card-header">
                        <h3>My Profile</h3>
                        {!editingProfile && (
                            <button
                                className="btn btn-primary"
                                style={{ fontSize: 12, padding: '6px 14px', width: 'fit-content', flexShrink: 0, marginLeft: 'auto' }}
                                onClick={() => { 
                                    setEditingProfile(true); 
                                    setProfileSuccess(false); 
                                    ['firstName', 'middleName', 'lastName', 'email', 'contactNumber'].forEach(k => validateField(k, (profileForm as any)[k]));
                                }}
                            >
                                <Pencil size={12} /> Edit Profile
                            </button>
                        )}
                    </div>

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
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px',
                            background: 'rgba(5,205,153,0.1)',
                            border: '1px solid rgba(5,205,153,0.25)',
                            borderRadius: 10, marginBottom: 12,
                            fontSize: 13, color: '#05cd99', fontWeight: 600,
                        }}>
                            <CheckCircle2 size={14} /> Profile updated successfully!
                        </div>
                    )}

                    {editingProfile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {profileError && (
                                <div className="form-api-error">
                                    <AlertCircle size={14} /><span>{profileError}</span>
                                </div>
                            )}
                            <div className="field">
                                <label>First Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="text"
                                    value={profileForm.firstName}
                                    onChange={handleProfileChange('firstName')}
                                    placeholder="Enter first name"
                                    maxLength={50}
                                    style={validationErrors['firstName'] ? { borderColor: 'var(--danger)' } : {}}
                                />
                                {validationErrors['firstName'] && <span style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{validationErrors['firstName']}</span>}
                            </div>
                            <div className="field">
                                <label>Middle Name <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>(optional)</span></label>
                                <input
                                    type="text"
                                    value={profileForm.middleName}
                                    onChange={handleProfileChange('middleName')}
                                    placeholder="Enter middle name"
                                    maxLength={50}
                                    style={validationErrors['middleName'] ? { borderColor: 'var(--danger)' } : {}}
                                />
                                {validationErrors['middleName'] && <span style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{validationErrors['middleName']}</span>}
                            </div>
                            <div className="field">
                                <label>Last Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="text"
                                    value={profileForm.lastName}
                                    onChange={handleProfileChange('lastName')}
                                    placeholder="Enter last name"
                                    maxLength={50}
                                    style={validationErrors['lastName'] ? { borderColor: 'var(--danger)' } : {}}
                                />
                                {validationErrors['lastName'] && <span style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{validationErrors['lastName']}</span>}
                            </div>
                            <div className="field">
                                <label>Email Address <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={handleProfileChange('email')}
                                    placeholder="e.g. name@company.com"
                                    style={validationErrors['email'] ? { borderColor: 'var(--danger)' } : {}}
                                />
                                {validationErrors['email'] && <span style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{validationErrors['email']}</span>}
                            </div>
                            <div className="field">
                                <label>Contact Number</label>
                                <input
                                    type="tel"
                                    value={profileForm.contactNumber}
                                    onChange={handleProfileChange('contactNumber')}
                                    placeholder="e.g. 09170000000"
                                    style={validationErrors['contactNumber'] ? { borderColor: 'var(--danger)' } : {}}
                                />
                                {validationErrors['contactNumber'] && <span style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{validationErrors['contactNumber']}</span>}
                            </div>
                            <div className="detail-grid" style={{ marginTop: 4 }}>
                                <div className="detail-item">
                                    <span className="detail-label">Employee ID</span>
                                    <span className="detail-value">{employeeId || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Role</span>
                                    <span className="detail-value">Operation Admin</span>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ padding: '4px 0 0' }}>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setEditingProfile(false);
                                        setProfileError('');
                                        setProfileForm({
                                            firstName: localStorage.getItem('firstName') ?? '',
                                            middleName: localStorage.getItem('middleName') ?? '',
                                            lastName: localStorage.getItem('lastName') ?? '',
                                            contactNumber: employeeContact,
                                            email: storedEmail,
                                        });
                                    }}
                                    disabled={profileSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={requestSave}
                                    disabled={profileSaving}
                                >
                                    {profileSaving
                                        ? <><Loader2 size={13} className="spin" /> Saving…</>
                                        : <><Save size={13} /> Save Changes</>
                                    }
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="detail-grid" style={{ marginTop: 4 }}>
                            <div className="detail-item">
                                <span className="detail-label">
                                    <Hash size={11} style={{ display: 'inline', marginRight: 4 }} />Employee ID
                                </span>
                                <span className="detail-value">{employeeId || '—'}</span>
                            </div>
                                <div className="detail-item">
                                    <span className="detail-label">
                                        <UserCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} />First Name
                                    </span>
                                    <span className="detail-value">{profileForm.firstName || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">
                                        <UserCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} />Middle Name
                                    </span>
                                    <span className="detail-value">{profileForm.middleName || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">
                                        <UserCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} />Last Name
                                    </span>
                                    <span className="detail-value">{profileForm.lastName || '—'}</span>
                                </div>
                            <div className="detail-item">
                                <span className="detail-label">
                                    <Mail size={11} style={{ display: 'inline', marginRight: 4 }} />Email Address
                                </span>
                                <span className="detail-value">{profileForm.email || '—'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">
                                    <Shield size={11} style={{ display: 'inline', marginRight: 4 }} />Role
                                </span>
                                <span className="detail-value">Operation Admin</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">
                                    <Phone size={11} style={{ display: 'inline', marginRight: 4 }} />Contact
                                </span>
                                <span className="detail-value">{displayContact || '—'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Security Card ─────────────────────────────────────────── */}
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
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#05cd99', background: 'rgba(5,205,153,0.12)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                                    Secure
                                </span>
                            </div>
                            <div style={{ height: 1, background: 'var(--border)' }} />
                            <div className="system-status-item" style={{ cursor: 'default' }}>
                                <div className="system-icon bg-primary"><Shield size={16} /></div>
                                <div className="system-info">
                                    <span className="system-name">Role Permissions</span>
                                    <span className="system-detail">Operations access granted</span>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'rgba(67,24,255,0.1)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                                    Op Admin
                                </span>
                            </div>
                            <div style={{ height: 1, background: 'var(--border)' }} />
                            <div className="system-status-item" style={{ cursor: 'default' }}>
                                <div className="system-icon bg-warning"><AlertCircle size={16} /></div>
                                <div className="system-info">
                                    <span className="system-name">Active Session</span>
                                    <span className="system-detail">Logged in on this device</span>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#ffb547', background: 'rgba(255,181,71,0.15)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                                    Live
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="modal-form" style={{ padding: '4px 0 0' }}>
                            {pwError && (
                                <div className="form-api-error" style={{ marginBottom: 8 }}>
                                    <AlertCircle size={14} /><span>{pwError}</span>
                                </div>
                            )}
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
                                    <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3, display: 'block' }}>
                                        Passwords do not match
                                    </span>
                                )}
                                {pwForm.confirm.length > 0 && pwForm.next === pwForm.confirm && (
                                    <span style={{ fontSize: 11, color: '#05cd99', marginTop: 3, display: 'block' }}>
                                        ✓ Passwords match
                                    </span>
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
                                <button
                                    className="btn btn-primary"
                                    onClick={handlePwSave}
                                    disabled={pwSaving}
                                >
                                    {pwSaving
                                        ? <><Loader2 size={13} className="spin" /> Saving…</>
                                        : <><Save size={13} /> Update Password</>
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Account Overview ─────────────────────────────────────────── */}
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
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#2b3674', background: '#eef2ff', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                                Full Access
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


// ─── Leave Requests Tab ──────────────────────────────────────────────────────────────

const LeaveTab: React.FC<{
    records: LeaveRecord[];
    loading: boolean;
    onNewRecord: (r: LeaveRecord) => void;
}> = ({ records, loading, onNewRecord }) => {
    const [showModal, setShowModal] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [histFilter, setHistFilter] = useState<'all' | LeaveStatus>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 5;

    const pendingCount = records.filter(r => r.status === 'Pending').length;
    const approvedCount = records.filter(r => r.status === 'Approved').length;
    const declinedCount = records.filter(r => r.status === 'Declined').length;

    const filteredRecords = histFilter === 'all'
        ? records
        : records.filter(r => r.status === histFilter);
    const sortedRecords = [...filteredRecords].sort((a, b) =>
        b.submittedAt.localeCompare(a.submittedAt)
    );
    const totalPages = Math.max(1, Math.ceil(sortedRecords.length / PAGE_SIZE));
    const paginatedRecords = sortedRecords.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handleFilterChange = (f: 'all' | LeaveStatus) => {
        setHistFilter(f);
        setCurrentPage(1);
    };

    const handleSubmit = (record: LeaveRecord) => {
        onNewRecord(record);
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3500);
    };

    return (
        <div className="tab-content">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={14} /> Request Leave
                </button>
            </div>

            {/* Success toast */}
            {submitSuccess && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(5,205,153,0.1)', border: '1px solid rgba(5,205,153,0.25)',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                    fontSize: 13, color: '#05cd99', fontWeight: 600,
                }}>
                    <CheckCircle2 size={14} /> Request submitted — your manager will review it shortly.
                </div>
            )}

            {/* Stat cards */}
            <div className="stats-row" style={{ marginBottom: 16 }}>
                {[
                    { label: 'TOTAL REQUESTS', value: records.length, icon: <ClipboardList size={18} />, cls: 'bg-primary', sub: 'All submitted' },
                    { label: 'PENDING', value: pendingCount, icon: <AlertCircle size={18} />, cls: 'bg-warning', sub: 'Awaiting review' },
                    { label: 'APPROVED', value: approvedCount, icon: <CheckCircle2 size={18} />, cls: 'bg-success', sub: 'This period' },
                    { label: 'DECLINED', value: declinedCount, icon: <X size={18} />, cls: 'bg-danger', sub: 'Not approved' },
                ].map(s => (
                    <div key={s.label} className="card stat-card">
                        <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                        <div><p>{s.label}</p><h3>{s.value}</h3><small>{s.sub}</small></div>
                    </div>
                ))}
            </div>

            {/* History card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="card-header" style={{ padding: '16px 20px 14px' }}>
                    <h3>My Leave History</h3>
                </div>

                {/* Filter pills */}
                <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(['all', 'Pending', 'Approved', 'Declined'] as const).map(f => (
                        <button
                            key={f}
                            className={`filter-pill${histFilter === f ? ' active' : ''}`}
                            onClick={() => handleFilterChange(f)}
                            style={{ fontSize: 12, padding: '4px 11px' }}
                        >
                            {f === 'all' ? 'All' : f}
                            <span style={{
                                marginLeft: 5, fontSize: 11, fontWeight: 600,
                                padding: '1px 6px', borderRadius: 999,
                                background: histFilter === f ? 'rgba(67,24,255,0.15)' : 'var(--border)',
                                color: histFilter === f ? 'var(--primary)' : 'var(--text-secondary)',
                            }}>
                                {f === 'all' ? records.length : records.filter(r => r.status === f).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Records list */}
                <div style={{ padding: '0 20px' }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: '32px 0' }}>
                            <Loader2 size={20} className="spin" /><p>Loading leave records…</p>
                        </div>
                    ) : paginatedRecords.length === 0 ? (
                        <div className="empty-state" style={{ padding: '36px 0' }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%',
                                background: 'rgba(67,24,255,0.07)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 8,
                            }}>
                                <CalendarDays size={26} color="var(--primary)" />
                            </div>
                            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {histFilter === 'all' ? 'No leave requests yet' : `No ${histFilter} requests`}
                            </p>
                            {histFilter === 'all' && (
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    Click "Request Leave" to submit your first request.
                                </span>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
                            {paginatedRecords.map(r => <LeaveRecordCard key={r.id} record={r} />)}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {sortedRecords.length > PAGE_SIZE && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 20px', borderTop: '1px solid var(--border)',
                    }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                            {Math.min(currentPage * PAGE_SIZE, sortedRecords.length)} of {sortedRecords.length}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-xs" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <ChevronLeft size={13} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    className={`btn btn-xs${currentPage === page ? ' btn-primary' : ''}`}
                                    onClick={() => setCurrentPage(page)}
                                    style={{ minWidth: 28 }}
                                >
                                    {page}
                                </button>
                            ))}
                            <button className="btn btn-xs" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <LeaveRequestModal
                    onClose={() => setShowModal(false)}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    );
    };


const LeaveRecordCard: React.FC<{ record: LeaveRecord }> = ({ record }) => {
    const statusColors: Record<LeaveStatus, { bg: string; color: string }> = {
        Pending: { bg: 'rgba(255,181,71,0.12)', color: '#c05c00' },
        Approved: { bg: 'rgba(5,205,153,0.12)', color: '#05cd99' },
        Declined: { bg: 'rgba(238,93,80,0.12)', color: '#ee5d50' },
    };
    const meta = statusColors[record.status];

    return (
        <div style={{
            border: '1px solid var(--border)', borderRadius: 10,
            padding: '12px 16px', background: 'var(--bg-card)',
            display: 'flex', flexDirection: 'column', gap: 6,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    {record.leaveType}
                </span>
                <span style={{
                    fontSize: 12, fontWeight: 600, padding: '3px 10px',
                    borderRadius: 999, background: meta.bg, color: meta.color,
                }}>
                    {record.status}
                </span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>From: <strong style={{ color: 'var(--text-primary)' }}>{record.startDate}</strong></span>
                <span>To: <strong style={{ color: 'var(--text-primary)' }}>{record.endDate}</strong></span>
            </div>
            {record.reason && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                    {record.reason}
                </p>
            )}
            {record.reviewNote && (
                <div style={{
                    fontSize: 12, padding: '6px 10px', borderRadius: 8,
                    background: meta.bg, color: meta.color,
                }}>
                    <strong>Note:</strong> {record.reviewNote}
                </div>
            )}
        </div>
    );
};

// ─── Root Component ───────────────────────────────────────────────────────────

export default function OpsAdminDashboard() {
    const navigate = useNavigate();
    usePreventBackNav();

    const employeeId = localStorage.getItem('employeeId') ?? '';
    const firstName = localStorage.getItem('firstName') ?? '';
    const lastName = localStorage.getItem('lastName') ?? '';
    const middleName = localStorage.getItem('middleName') ?? '';
    const employeeName = [firstName, middleName, lastName].filter(Boolean).join(' ') || 'Op Admin';
    const { success, error, confirm } = useToast();

    const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userPresenceStatus, setUserPresenceStatus] = useState('Offline');

    const [showNew, setShowNew] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [detailTask, setDetailTask] = useState<TaskViewTask | null>(null);

    const token = () => localStorage.getItem('authToken');

    // ── Fetch Tasks ──
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [deletedTaskIds, setDeletedTaskIds] = useState<Set<string>>(new Set()); 
    const [binTasks, setBinTasks] = useState<Task[]>([]);

    // Fetch Leave records
    const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
    const [leaveLoading, setLeaveLoading] = useState(false);

    // ── Update fetchTasks ──
    const fetchTasks = async () => {
        setLoadingTasks(true);
        try {
            const res = await fetch('/api/task/all-tasks', {
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!res.ok) throw new Error();
            const data: any[] = await res.json();
            console.log('Raw API response:', JSON.stringify(data[0])); // inspect first task's raw shape

            // Normalize: map Deleted → deleted regardless of casing
            const normalized: Task[] = data.map(t => ({
                ...t,
                deleted: deletedTaskIds.has(t.taskId),
            }));

            console.log('Tasks with deleted flags:', normalized.map(t => ({ title: t.taskTitle, deleted: t.deleted })));

            setAllTasks(normalized);
            setTasks(normalized.filter(t => !t.deleted));
        } catch {
            setAllTasks([]);
            setTasks([]);
        } finally {
            setLoadingTasks(false);
        }
    };

    const fetchBinRecords = async () => {
        try {
            const res = await fetch(
                `/api/task/bin-records/${employeeId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token()}`,
                    },
                }
            );

            if (!res.ok) throw new Error();

            const data = await res.json();

            setBinTasks(data);
        } catch {
            setBinTasks([]);
        }
    };

    // ── Restore task ──
    const handleRestoreTask = async (taskId: string) => {
        try {
            const res = await fetch(`/api/task/${taskId}/restore-task`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to restore task.');
            }
            setAllTasks(prev => prev.map(t =>
                t.taskId === taskId ? { ...t, deleted: false } : t
            ));
            setTasks(prev => {
                const restored = allTasks.find(t => t.taskId === taskId);
                return restored ? [...prev, { ...restored, deleted: false }] : prev;
            });
            success('Task restored successfully.');
            await fetchTasks();
            await fetchBinRecords();
        } catch (err: any) {
            error(err.message ?? 'Failed to restore task.');
        }
    };

    const handleEmptyBin = async () => {
        const ok = await confirm(
            'Permanently remove all items in the bin?',
            {
                confirmLabel: 'Empty Bin',
                cancelLabel: 'Cancel',
            }
        );

        if (!ok) return;

        try {
            const res = await fetch(
                `/api/task/empty-bin/${employeeId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token()}`,
                    },
                }
            );

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to empty bin.');
            }

            setBinTasks([]);
            await fetchTasks();
            success('Bin emptied successfully.');
        } catch (err: any) {
            error(err.message ?? 'Failed to empty bin.');
        }
    };

    // ── Fetch Team Members (for assignee dropdown) ──
    const fetchTeamMembers = async () => {
        try {
            const res = await fetch('/api/systemadmin/assignable-employees', {
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!res.ok) throw new Error();
            const data: any[] = await res.json();

            console.log('Team members raw:', data); // ← ADD THIS to inspect shape

            setTeamMembers(data.map(e => ({
                accountId: e.accountId ?? e.AccountId ?? e.id,       // try variants
                employeeName: e.employeeName ?? e.EmployeeName ?? e.name,
                role: e.role ?? e.Role ?? '',
                presenceStatus: e.presenceStatus ?? 'Offline',
            })));
        } catch {
            setTeamMembers([]);
        }
    };

    const fetchLeaveRecords = async () => {
        setLeaveLoading(true);
        try {
            const res = await fetch('/api/leaverequest/my-leave-requests', {
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setLeaveRecords(Array.isArray(data) ? data : []);
        } catch {
            setLeaveRecords([]);
        } finally {
            setLeaveLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchBinRecords();
        fetchTeamMembers();
        fetchLeaveRecords();
        const t = localStorage.getItem('authToken');
        if (!t) return;
        fetch('/api/profile/view-profile', {
            headers: { Authorization: `Bearer ${t}` },
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) return;
                const contact = data.contactNumber ?? data.contact ?? data.phoneNumber ?? '';
                const email = data.email ?? '';
                if (contact) {
                    localStorage.setItem('contactNumber', contact);
                }
                if (email) {
                    localStorage.setItem('email', email);
                }
            })
            .catch(() => { });
    }, []);

    // ── Create Task ──
    const handleNewTask = async (data: CreateTaskDTO) => {
        try {
            const res = await fetch('/api/task/create-task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to create task.');
            }
            await fetchTasks();
            setShowNew(false);
            success('Task created successfully.');
        } catch (err: any) {
            error(err.message ?? 'Failed to create task.');
        }
    };

    // ── Update Task ──
    const handleEditTask = async (taskId: string, data: UpdateTaskDTO) => {
        try {
            const res = await fetch(`/api/task/update-task/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to update task.');
            }
            await fetchTasks();
            setEditingTask(null);
            success('Task updated successfully.');
        } catch (err: any) {
            error(err.message ?? 'Failed to update task.');
        }
    };

    // ── Reopen Task ──
    const handleReopenTask = async (taskId: string) => {
        try {
            const res = await fetch(`/api/task/${taskId}/reopen`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to reopen task.');
            }
            await fetchTasks();
            setViewingTask(null);
            success('Task reopened.');
        } catch (err: any) {
            error(err.message ?? 'Failed to reopen task.');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        const ok = await confirm('Delete this task? This cannot be undone.', {
            confirmLabel: 'Delete',
            cancelLabel: 'Keep',
        });
        if (!ok) return;

        try {
            const res = await fetch(`/api/task/${taskId}/delete-task`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to delete task.');
            }

            // Track locally so refetches don't resurrect the task
            setDeletedTaskIds(prev => new Set(prev).add(taskId));
            setAllTasks(prev => prev.map(t =>
                t.taskId === taskId ? { ...t, deleted: true } : t
            ));
            setTasks(prev => prev.filter(t => t.taskId !== taskId));
            setEditingTask(null);
            setViewingTask(null);
            setDetailTask(null);
            success('Task deleted successfully.');

            await fetchBinRecords();

        } catch (err: any) {
            error(err.message ?? 'Something went wrong.');
        }
    };

    const handleLogout = async () => {
        const token = localStorage.getItem('authToken');

        if (token) {
            await fetch('/api/authentication/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            }).catch(() => { }); // non-fatal — clear localStorage regardless
        }

        ['employeeId', 'refreshToken', 'authToken', 'employeeName',
            'firstName', 'middleName', 'lastName', 'contactNumber', 'role']
            .forEach(k => localStorage.removeItem(k));
        navigate('/');
    };

    const pageTitles: Record<NavTab, string> = {
        dashboard: 'Board Overview',
        tasks: 'Task Management',
        team: 'Team Management',
        reports: 'Performance Reports',
        profile: 'My Profile',
        leave: 'Leave Requests',
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/src/assets/SpeedexLogo.jpg" alt="Speedex Logo" className="logo-image" />
                </div>

                <div className="sidebar-role-section">
                    <div className="sidebar-role-badge super-admin">
                        <div className="role-dot-inner" />
                        OPERATION ADMIN
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
                                        onClick={() => setActiveTab(tab)}
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
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <div className="profile-avatar">
                                {getInitials(employeeName || 'Operation Admin')}
                            </div>
                            <span style={{
                                position: 'absolute', bottom: 1, right: 1,
                                width: 9, height: 9, borderRadius: '50%',
                                background: userPresenceStatus === 'Online' ? '#05cd99' : '#a3aed0',
                                border: '2px solid var(--sidebar-bg, #1b2559)',
                                display: 'block'
                            }} />
                        </div>
                        <div className="profile-info">
                            <span className="profile-name">{employeeName || 'Op Admin'}</span>
                            <span className="profile-role">OPERATION ADMIN</span>
                        </div>
                        <button className="profile-logout" onClick={handleLogout} title="Logout" aria-label="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="main-viewport">
                <div className="dashboard-header">
                    <div className="header-title">
                        <h2>{pageTitles[activeTab]}</h2>
                        <p>Operations Admin — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    {activeTab !== 'profile' && activeTab !== 'leave' && (
                        <div className="header-actions">
                            <div className="header-search">
                                <Search size={15} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="quick-action-btn-header" onClick={() => setShowNew(true)}>
                                <Plus size={18} /> New Task
                            </button>
                            <NotificationBell apiEndpoint="/api/notification/my-notifications" />
                        </div>
                    )}
                </div>

                {activeTab === 'dashboard' && (
                    <DashboardTab
                        tasks={tasks}
                        loading={loadingTasks}
                        onView={id => setViewingTask(tasks.find(t => t.taskId === id) ?? null)}
                        onNewTask={() => setShowNew(true)}
                    />
                )}
                {activeTab === 'tasks' && (
                    <TasksTab
                        tasks={tasks}
                        allTasks={allTasks}
                        binTasks={binTasks}
                        loading={loadingTasks}
                        searchQuery={searchQuery}
                        onView={id => setDetailTask(tasks.find(t => t.taskId === id) ?? null)}
                        onEdit={id => setEditingTask(tasks.find(t => t.taskId === id) ?? null)}
                        onRestore={handleRestoreTask}
                        onEmptyBin={handleEmptyBin}
                    />
                )}
                {activeTab === 'team' && (
                    <TeamTab
                        tasks={tasks}
                        teamMembers={teamMembers}
                        onView={id => setViewingTask(tasks.find(t => t.taskId === id) ?? null)}
                    />
                )}
                {activeTab === 'reports' && <ReportsTab tasks={tasks} teamMembers={teamMembers} />}
                {activeTab === 'profile' && <ProfileTab />}
                {activeTab === 'leave' && (
                    <LeaveTab
                        records={leaveRecords}
                        loading={leaveLoading}
                        onNewRecord={record => setLeaveRecords(prev => [record, ...prev])}
                    />
                )}
            </main>

            {/* ── Modals ── */}
            {showNew && (
                <TaskModal
                    mode="new"
                    teamMembers={teamMembers}
                    onSave={data => handleNewTask(data as CreateTaskDTO)}
                    onClose={() => setShowNew(false)}
                />
            )}
            {editingTask && (
                <TaskModal
                    mode="edit"
                    initial={editingTask}
                    teamMembers={teamMembers}
                    onSave={data => handleEditTask(editingTask.taskId, data as UpdateTaskDTO)}
                    onClose={() => setEditingTask(null)}
                    onDelete={() => handleDeleteTask(editingTask.taskId)}
                />
            )}
            {viewingTask && (
                <ViewModal
                    task={viewingTask}
                    onEdit={() => { setEditingTask(viewingTask); setViewingTask(null); }}
                    onReopen={() => handleReopenTask(viewingTask.taskId)}
                    onClose={() => setViewingTask(null)}
                    onViewMore={() => { setDetailTask(viewingTask); setViewingTask(null); }}
                />
            )}
            {detailTask && (
                <TaskView
                    task={detailTask}
                    onEdit={() => { setEditingTask(detailTask); setDetailTask(null); }}
                    onReopen={() => handleReopenTask(detailTask.taskId)}
                    onClose={() => setDetailTask(null)}
                />
            )}
        </div>
    );
}