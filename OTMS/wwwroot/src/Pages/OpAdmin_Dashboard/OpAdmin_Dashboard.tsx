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
    Save,
    Loader2,
    Users,
    Search,
    Trash2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './OpAdmin_Dashboard.css';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../../components/NotificationBell/NotificationBell';
import TaskView, { TaskViewTask } from '../../components/TaskView/TaskView';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'High' | 'Medium' | 'Low';  // match backend casing
type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
type NavTab = 'dashboard' | 'tasks' | 'team' | 'reports' | 'profile';

interface TeamMember {
    accountId: string;      // use accountId (Guid) from backend
    employeeName: string;
    role: string;
}

interface Task {
    taskId: string;          // Guid from backend
    taskTitle: string;
    taskDescription: string;
    priority: Priority;
    dueAt: string | null;
    taskStatus: TaskStatus;
    taskRemarks?: string;
    assignedEmployee: string;
    createdByEmployee: string;
    assignedTo: string;      // accountId Guid
    createdAt: string;
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

const NAV_ITEMS = [
    { tab: 'dashboard' as NavTab, icon: LayoutDashboard, label: 'Dashboard' },
    { tab: 'tasks' as NavTab, icon: Package, label: 'Tasks' },
    { tab: 'team' as NavTab, icon: Users, label: 'Team' },
    { tab: 'reports' as NavTab, icon: BarChart3, label: 'Reports' },
    { tab: 'profile' as NavTab, icon: UserCircle2, label: 'Profile' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isEffectivelyOverdue = (t: Task): boolean =>
    t.taskStatus !== 'Completed' && !!t.dueAt && new Date(t.dueAt) < new Date();

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
    <div className={`avatar-chip av-blue ${size === 'md' ? 'avatar-md' : ''}`}>
        {member.employeeName.charAt(0).toUpperCase()}
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

const EMPTY_FORM = {
    taskTitle: '',
    taskDescription: '',
    dueAt: '',
    priority: 'Medium' as Priority,
    assignedTo: '',
    taskRemarks: '',
};

const TaskModal: React.FC<TaskModalProps> = ({ mode, initial = {}, teamMembers, onSave, onClose, onDelete }) => {
    const resolvedAssignedTo =
        initial.assignedTo ||
        teamMembers.find(m => m.employeeName === initial.assignedEmployee)?.accountId ||
        '';

    const [form, setForm] = useState({
        taskTitle: initial.taskTitle ?? '',
        taskDescription: initial.taskDescription ?? '',
        dueAt: initial.dueAt ? initial.dueAt.split('T')[0] : '',
        priority: initial.priority ?? 'Medium' as Priority,
        assignedTo: resolvedAssignedTo,
        taskRemarks: initial.taskRemarks ?? '',
    });
    const [submitting, setSubmitting] = useState(false);

    const set = (key: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setForm(prev => ({ ...prev, [key]: e.target.value }));

    const handleSave = () => {
        if (!form.taskTitle.trim()) { alert('Task title is required'); return; }
        if (!form.assignedTo) { alert('Please assign the task to someone'); return; }
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
                    <div className="field">
                        <label>Task Title</label>
                        <input value={form.taskTitle} onChange={set('taskTitle')} placeholder="e.g. Route planning update" />
                    </div>
                    <div className="field">
                        <label>Description</label>
                        <textarea value={form.taskDescription} onChange={set('taskDescription')} placeholder="Describe the task..." rows={3} />
                    </div>
                    <div className="field-row">
                        <div className="field">
                            <label>Due Date</label>
                            <input type="date" value={form.dueAt} onChange={set('dueAt')} />
                        </div>
                        <div className="field">
                            <label>Priority</label>
                            <select value={form.priority} onChange={set('priority')}>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>
                    {/* Replace Assign To field in TaskModal */}
                    <div className="field">
                        <label>Assign To</label>
                        <div className="assignee-select" tabIndex={0}
                            onBlur={e => {
                                if (!e.currentTarget.contains(e.relatedTarget))
                                    e.currentTarget.querySelector<HTMLElement>('.assignee-options')?.style.setProperty('display', 'none');
                            }}
                        >
                            {/* Trigger — looks like a select */}
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

                            {/* Options dropdown */}
                            <div className="assignee-options" style={{ display: 'none' }}>
                                <div
                                    className="assignee-option placeholder-opt"
                                    onClick={e => {
                                        setForm(prev => ({ ...prev, assignedTo: '' }));
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
                                            (e.currentTarget.closest('.assignee-options') as HTMLElement).style.display = 'none';
                                        }}
                                    >
                                        <span className="assignee-opt-name">{m.employeeName}</span>
                                        <span className="assignee-opt-role">{m.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {mode === 'edit' && (
                        <div className="field">
                            <label>Remarks</label>
                            <input value={form.taskRemarks} onChange={set('taskRemarks')} placeholder="Optional remarks..." />
                        </div>
                    )}
                </div>
                <div className="modal-actions">
                    <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                        {mode === 'edit' && onDelete && (
                            <button
                                className="btn btn-danger"
                                onClick={() => {
                                    if (window.confirm('Delete this task? This cannot be undone.')) {
                                        onDelete();
                                    }
                                }}
                                disabled={submitting}
                            >
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
    loading: boolean;
    searchQuery: string;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
}> = ({ tasks, loading, searchQuery, onView, onEdit }) => {
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');

    const filtered = tasks.filter(t =>
        (!filterStatus || t.taskStatus === filterStatus) &&
        (!filterPriority || t.priority === filterPriority) &&
        (!searchQuery || t.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="dashboard-content">
            <div className="filter-bar">
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
    const employeeId = localStorage.getItem('employeeId') ?? '';
    const employeeName = localStorage.getItem('employeeName') ?? '';
    const employeeContact = localStorage.getItem('contactNumber') ?? '';

    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        employeeName: employeeName,
        contactNumber: employeeContact,
    });
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
                `/api/profile/update-profile?employeeNumber=${encodeURIComponent(employeeId)}`,
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
            const res = await fetch('/api/profile/change-password', {
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

// ─── Root Component ───────────────────────────────────────────────────────────

export default function OpsAdminDashboard() {
    const navigate = useNavigate();
    const employeeId = localStorage.getItem('employeeId') ?? '';
    const employeeName = localStorage.getItem('employeeName') ?? '';

    const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [showNew, setShowNew] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [detailTask, setDetailTask] = useState<TaskViewTask | null>(null);

    const token = () => localStorage.getItem('authToken');

    // ── Fetch Tasks ──
    const fetchTasks = async () => {
        setLoadingTasks(true);
        try {
            const res = await fetch('/api/task/all-tasks', {
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!res.ok) throw new Error();
            const data: Task[] = await res.json();
            setTasks(data);
        } catch {
            setTasks([]);
        } finally {
            setLoadingTasks(false);
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
            })));
        } catch {
            setTeamMembers([]);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchTeamMembers();
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
        } catch (err: any) {
            alert(err.message ?? 'Something went wrong.');
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
        } catch (err: any) {
            alert(err.message ?? 'Something went wrong.');
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
        } catch (err: any) {
            alert(err.message ?? 'Something went wrong.');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            const res = await fetch(`/api/task/delete-task/${taskId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to delete task.');
            }
            await fetchTasks();
            setEditingTask(null);
        } catch (err: any) {
            alert(err.message ?? 'Something went wrong.');
        }
    };

    const handleLogout = () => {
        ['employeeId', 'refreshToken', 'authToken'].forEach(k => localStorage.removeItem(k));
        navigate('/');
    };

    const pageTitles: Record<NavTab, string> = {
        dashboard: 'Board Overview',
        tasks: 'Task Management',
        team: 'Team Management',
        reports: 'Performance Reports',
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
                        <p>Operations Admin — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    {activeTab !== 'profile' && (
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
                        loading={loadingTasks}
                        searchQuery={searchQuery}
                        onView={id => setDetailTask(tasks.find(t => t.taskId === id) ?? null)}
                        onEdit={id => setEditingTask(tasks.find(t => t.taskId === id) ?? null)}
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