import React, { useState } from 'react';
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
    Plus,
    Pencil,
    Trash2,
    Eye,
    X,
    ChevronRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './OpAdmin_Dashboard.css';

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = 'high' | 'medium' | 'low';
type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
type NavTab = 'dashboard' | 'tasks' | 'team' | 'reports';

interface TeamMember {
    id: string;
    name: string;
    initials: string;
    role: string;
    avatarClass: string;
}

interface Task {
    id: number;
    name: string;
    description: string;
    deadline: string;
    priority: Priority;
    assigneeId: string;
    status: TaskStatus;
    progress: number;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const TEAM_MEMBERS: TeamMember[] = [
    { id: 'm1', name: 'Alex Rivera', initials: 'AR', role: 'Field Ops', avatarClass: 'av-blue' },
    { id: 'm2', name: 'Sam Chen', initials: 'SC', role: 'Logistics', avatarClass: 'av-purple' },
    { id: 'm3', name: 'Priya Nair', initials: 'PN', role: 'Dispatch', avatarClass: 'av-green' },
    { id: 'm4', name: 'Jordan Wu', initials: 'JW', role: 'Coordination', avatarClass: 'av-amber' },
    { id: 'm5', name: 'Maya Torres', initials: 'MT', role: 'Support Ops', avatarClass: 'av-red' },
];

const INITIAL_TASKS: Task[] = [
    { id: 1, name: 'Update delivery route maps', description: 'Review and update all Q2 delivery routes based on new zone assignments.', deadline: '2026-04-28', priority: 'high', assigneeId: 'm1', status: 'in-progress', progress: 65 },
    { id: 2, name: 'Inventory reconciliation', description: 'Cross-check warehouse inventory against system records.', deadline: '2026-04-30', priority: 'medium', assigneeId: 'm2', status: 'pending', progress: 0 },
    { id: 3, name: 'Driver briefing documentation', description: 'Prepare briefing materials for new drivers joining next week.', deadline: '2026-04-25', priority: 'high', assigneeId: 'm3', status: 'overdue', progress: 30 },
    { id: 4, name: 'Fleet maintenance log review', description: 'Audit the last 30 days of fleet maintenance logs.', deadline: '2026-05-05', priority: 'low', assigneeId: 'm4', status: 'completed', progress: 100 },
    { id: 5, name: 'Customer complaint follow-up', description: 'Resolve 12 pending customer complaints from the support queue.', deadline: '2026-04-29', priority: 'high', assigneeId: 'm5', status: 'in-progress', progress: 50 },
    { id: 6, name: 'SLA report for April', description: 'Generate and submit the monthly SLA compliance report.', deadline: '2026-05-01', priority: 'medium', assigneeId: 'm1', status: 'pending', progress: 0 },
    { id: 7, name: 'Warehouse zone labeling', description: 'Re-label warehouse zones C and D per new layout.', deadline: '2026-04-24', priority: 'medium', assigneeId: 'm3', status: 'completed', progress: 100 },
];

const WEEKLY_DATA = [
    { day: 'Mon', completed: 12, pending: 5 },
    { day: 'Tue', completed: 18, pending: 8 },
    { day: 'Wed', completed: 15, pending: 10 },
    { day: 'Thu', completed: 22, pending: 6 },
    { day: 'Fri', completed: 28, pending: 4 },
    { day: 'Sat', completed: 10, pending: 3 },
    { day: 'Sun', completed: 8, pending: 2 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const findMember = (id: string): TeamMember | undefined =>
    TEAM_MEMBERS.find(m => m.id === id);

const fmtDate = (d: string): string => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const isEffectivelyOverdue = (t: Task): boolean =>
    t.status !== 'completed' && !!t.deadline && new Date(t.deadline + 'T00:00:00') < new Date();

const statusBadgeClass = (s: TaskStatus): string => {
    const map: Record<TaskStatus, string> = {
        pending: 'badge badge-blue',
        'in-progress': 'badge badge-amber',
        completed: 'badge badge-green',
        overdue: 'badge badge-red',
    };
    return map[s] ?? 'badge badge-blue';
};

const priorityDotClass = (p: Priority): string =>
    ({ high: 'prio-dot high', medium: 'prio-dot medium', low: 'prio-dot low' }[p]);

const progressFillClass = (t: Task): string => {
    if (t.status === 'completed') return 'progress-fill green';
    if (t.status === 'overdue' || isEffectivelyOverdue(t)) return 'progress-fill red';
    return 'progress-fill blue';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Avatar: React.FC<{ member: TeamMember; size?: 'sm' | 'md' }> = ({ member, size = 'sm' }) => (
    <div className={`avatar-chip ${member.avatarClass} ${size === 'md' ? 'avatar-md' : ''}`}>
        {member.initials}
    </div>
);

const PrioBadge: React.FC<{ p: Priority }> = ({ p }) => (
    <span className={`badge ${p === 'high' ? 'badge-red' : p === 'medium' ? 'badge-amber' : 'badge-green'}`}>
        {p}
    </span>
);

const ProgressBar: React.FC<{ pct: number; cls: string }> = ({ pct, cls }) => (
    <div className="progress-bar">
        <div className={`progress-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
);

interface TaskRowProps {
    task: Task;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    showEditBtn?: boolean;
}
const TaskRow: React.FC<TaskRowProps> = ({ task, onView, onEdit, showEditBtn = false }) => {
    const member = findMember(task.assigneeId);
    const od = isEffectivelyOverdue(task) && task.status !== 'completed';
    const effectiveStatus: TaskStatus = od ? 'overdue' : task.status;
    return (
        <div className="task-item" onClick={() => onView(task.id)}>
            <div className="task-row-top">
                <span className={priorityDotClass(task.priority)} />
                <span className="task-name">{task.name}</span>
                <span className={statusBadgeClass(effectiveStatus)}>{effectiveStatus}</span>
                {showEditBtn && (
                    <button
                        className="btn btn-xs"
                        onClick={e => { e.stopPropagation(); onEdit(task.id); }}
                    >
                        <Pencil size={11} /> Edit
                    </button>
                )}
            </div>
            <div className="task-row-bottom">
                <span className="task-assignee">{member?.name ?? 'Unassigned'}</span>
                <span className={`task-due${od ? ' overdue' : ''}`}>{fmtDate(task.deadline)}</span>
            </div>
            <ProgressBar pct={task.progress} cls={progressFillClass(task)} />
        </div>
    );
};

// ─── Modal: New / Edit Task ───────────────────────────────────────────────────

interface TaskModalProps {
    mode: 'new' | 'edit';
    initial?: Partial<Task>;
    onSave: (data: Omit<Task, 'id'> & { id?: number }) => void;
    onDelete?: () => void;
    onClose: () => void;
}

const EMPTY_TASK: Omit<Task, 'id'> = {
    name: '', description: '', deadline: '',
    priority: 'medium', assigneeId: '', status: 'pending', progress: 0,
};

const TaskModal: React.FC<TaskModalProps> = ({ mode, initial = {}, onSave, onDelete, onClose }) => {
    const [form, setForm] = useState<Omit<Task, 'id'>>({ ...EMPTY_TASK, ...initial });

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value }));

    const handleSave = () => {
        if (!form.name.trim()) { alert('Task name is required'); return; }
        onSave({ ...form, ...(initial?.id !== undefined ? { id: initial.id } : {}) });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{mode === 'new' ? 'Create New Task (FR-011)' : 'Edit Task (FR-013)'}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={16} /></button>
                </div>

                <div className="field">
                    <label>Task Name</label>
                    <input value={form.name} onChange={set('name')} placeholder="e.g. Route planning update" />
                </div>
                <div className="field">
                    <label>Description</label>
                    <textarea value={form.description} onChange={set('description')} placeholder="Describe the task in detail..." rows={3} />
                </div>
                <div className="field-row">
                    <div className="field">
                        <label>Deadline</label>
                        <input type="date" value={form.deadline} onChange={set('deadline')} />
                    </div>
                    <div className="field">
                        <label>Priority</label>
                        <select value={form.priority} onChange={set('priority')}>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>
                <div className="field-row">
                    <div className="field">
                        <label>Assign To (FR-012)</label>
                        <select value={form.assigneeId} onChange={set('assigneeId')}>
                            <option value="">Unassigned</option>
                            {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label>Status</label>
                        <select value={form.status} onChange={set('status')}>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>
                </div>
                {mode === 'edit' && (
                    <div className="field">
                        <label>Progress %</label>
                        <input
                            type="number" min={0} max={100}
                            value={form.progress}
                            onChange={e => setForm(prev => ({ ...prev, progress: Number(e.target.value) }))}
                        />
                    </div>
                )}

                <div className="modal-actions">
                    {mode === 'edit' && onDelete && (
                        <button className="btn btn-danger" onClick={onDelete}><Trash2 size={13} /> Delete</button>
                    )}
                    <div style={{ flex: 1 }} />
                    <button className="btn" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        {mode === 'new' ? 'Create Task' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Modal: View Task ─────────────────────────────────────────────────────────

interface ViewModalProps {
    task: Task;
    onEdit: () => void;
    onClose: () => void;
}
const ViewModal: React.FC<ViewModalProps> = ({ task, onEdit, onClose }) => {
    const member = findMember(task.assigneeId);
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{task.name}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={16} /></button>
                </div>
                <table className="view-table">
                    <tbody>
                        <tr><td className="vl">Description</td><td className="vv">{task.description || '—'}</td></tr>
                        <tr><td className="vl">Assignee</td><td className="vv">{member?.name ?? 'Unassigned'}</td></tr>
                        <tr><td className="vl">Deadline</td><td className="vv">{fmtDate(task.deadline)}</td></tr>
                        <tr><td className="vl">Priority</td><td className="vv"><PrioBadge p={task.priority} /></td></tr>
                        <tr><td className="vl">Status</td><td className="vv"><span className={statusBadgeClass(task.status)}>{task.status}</span></td></tr>
                        <tr>
                            <td className="vl">Progress</td>
                            <td className="vv">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>{task.progress}%</span>
                                    <div style={{ flex: 1 }}><ProgressBar pct={task.progress} cls={progressFillClass(task)} /></div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="modal-actions">
                    <div style={{ flex: 1 }} />
                    <button className="btn" onClick={onClose}>Close</button>
                    <button className="btn btn-primary" onClick={onEdit}><Pencil size={13} /> Edit Task</button>
                </div>
            </div>
        </div>
    );
};

// ─── Tabs ──────────────────────────────────────────────────────────────────────

const DashboardTab: React.FC<{ tasks: Task[]; onView: (id: number) => void; onNewTask: () => void; }> =
    ({ tasks, onView, onNewTask }) => {
        const total = tasks.length;
        const inProg = tasks.filter(t => t.status === 'in-progress').length;
        const done = tasks.filter(t => t.status === 'completed').length;
        const overdue = tasks.filter(t => t.status === 'overdue' || isEffectivelyOverdue(t)).length;
        const hi = tasks.filter(t => t.priority === 'high').length;
        const md = tasks.filter(t => t.priority === 'medium').length;
        const lo = tasks.filter(t => t.priority === 'low').length;
        const pct = total ? Math.round(done / total * 100) : 0;

        return (
            <div className="tab-content">
                {/* Stats */}
                <div className="stats-row">
                    {[
                        { label: 'Total Tasks', value: total, icon: <ClipboardList size={18} />, cls: 'bg-primary', sub: 'All active tasks' },
                        { label: 'In Progress', value: inProg, icon: <Truck size={18} />, cls: 'bg-warning', sub: 'Assigned & running' },
                        { label: 'Completed', value: done, icon: <CheckCircle2 size={18} />, cls: 'bg-success', sub: 'This period' },
                        { label: 'Overdue', value: overdue, icon: <AlertCircle size={18} />, cls: 'bg-danger', sub: 'Past deadline' },
                    ].map(s => (
                        <div key={s.label} className="card stat-card">
                            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                            <div>
                                <p>{s.label}</p>
                                <h3>{s.value}</h3>
                                <small>{s.sub}</small>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Grid */}
                <div className="dashboard-grid">
                    <div className="card">
                        <div className="card-header">
                            <h3>Recent Tasks</h3>
                            <span className="view-all-link">View all <ChevronRight size={12} /></span>
                        </div>
                        {tasks.slice(-5).reverse().map(t => (
                            <TaskRow key={t.id} task={t} onView={onView} onEdit={() => { }} />
                        ))}
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="dashboard-bottom-row">
                    {/* Quick Actions */}
                    <div className="card">
                        <h3>Quick Actions</h3>
                        <div className="quick-actions-grid">
                            <button className="quick-action-btn primary" onClick={onNewTask}>
                                <div className="quick-action-icon"><Users size={20} /></div>
                                <span>Add Task</span>
                            </button>
                            <button className="quick-action-btn">
                                <div className="quick-action-icon warning"><ClipboardList size={20} /></div>
                                <span>View Reports</span>
                            </button>
                        </div>
                    </div>

                    {/* Priority Breakdown */}
                    <div className="card">
                        <div className="card-header">
                            <h3>Priority Breakdown</h3>
                        </div>
                        <div className="perf-bars">
                            {[{ label: 'High', val: hi, cls: 'fill-red' }, { label: 'Medium', val: md, cls: 'fill-amber' }, { label: 'Low', val: lo, cls: 'fill-green' }].map(p => (
                                <div key={p.label} className="perf-item">
                                    <span className="perf-label">{p.label}</span>
                                    <div className="perf-track">
                                        <div className={`perf-fill ${p.cls}`} style={{ width: `${Math.round(p.val / (Math.max(hi, md, lo) || 1) * 100)}%` }} />
                                    </div>
                                    <span className="perf-pct">{p.val}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>{pct}%</span>
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 6px' }}>completion rate</p>
                            </div>
                            <ProgressBar pct={pct} cls="green" />
                        </div>
                    </div>

                    {/* Delivery Chart */}
                    <div className="card">
                        <div className="card-header">
                            <h3>Delivery Performance</h3>
                            <span className="system-all-operational alt">This Week</span>
                        </div>
                        <div style={{ width: '100%', height: 180, marginTop: 12 }}>
                            <ResponsiveContainer>
                                <BarChart data={WEEKLY_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                    <Tooltip />
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

const TasksTab: React.FC<{ tasks: Task[]; onView: (id: number) => void; onEdit: (id: number) => void; }> =
    ({ tasks, onView, onEdit }) => {
        const [filterStatus, setFilterStatus] = useState('');
        const [filterPriority, setFilterPriority] = useState('');
        const [filterAssignee, setFilterAssignee] = useState('');

        const filtered = tasks.filter(t =>
            (!filterStatus || t.status === filterStatus) &&
            (!filterPriority || t.priority === filterPriority) &&
            (!filterAssignee || t.assigneeId === filterAssignee)
        );

        return (
            <div className="tab-content">
                <div className="filter-bar">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                    </select>
                    <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                        <option value="">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
                        <option value="">All Assignees</option>
                        {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div className="card">
                    {filtered.length === 0
                        ? <div className="empty-state"><Package size={20} /><p>No tasks match filters</p></div>
                        : filtered.map(t => <TaskRow key={t.id} task={t} onView={onView} onEdit={onEdit} showEditBtn />)
                    }
                </div>
            </div>
        );
    };

// ─── Team Tab ─────────────────────────────────────────────────────────────────

const TeamTab: React.FC<{ tasks: Task[]; onView: (id: number) => void; }> = ({ tasks, onView }) => {
    const [selectedMemberId, setSelectedMemberId] = useState(TEAM_MEMBERS[0].id);
    const maxLoad = Math.max(...TEAM_MEMBERS.map(m => tasks.filter(t => t.assigneeId === m.id).length), 1);

    return (
        <div className="tab-content">
            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><h3>Team Members</h3></div>
                    {TEAM_MEMBERS.map(m => {
                        const mt = tasks.filter(t => t.assigneeId === m.id);
                        const mc = mt.filter(t => t.status === 'completed').length;
                        return (
                            <div
                                key={m.id}
                                className={`member-row${selectedMemberId === m.id ? ' selected' : ''}`}
                                onClick={() => setSelectedMemberId(m.id)}
                            >
                                <Avatar member={m} />
                                <div style={{ flex: 1 }}>
                                    <div className="member-name">{m.name}</div>
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
                        {TEAM_MEMBERS.map(m => {
                            const cnt = tasks.filter(t => t.assigneeId === m.id).length;
                            return (
                                <div key={m.id} className="perf-item">
                                    <span className="perf-label">{m.name.split(' ')[0]}</span>
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

            {/* Member Task Detail */}
            <div className="card">
                <div className="card-header">
                    <h3>{findMember(selectedMemberId)?.name}'s Tasks (FR-014)</h3>
                </div>
                {tasks.filter(t => t.assigneeId === selectedMemberId).length === 0
                    ? <div className="empty-state"><Package size={20} /><p>No tasks assigned</p></div>
                    : tasks.filter(t => t.assigneeId === selectedMemberId).map(t =>
                        <TaskRow key={t.id} task={t} onView={onView} onEdit={() => { }} />
                    )
                }
            </div>
        </div>
    );
};

// ─── Reports Tab ──────────────────────────────────────────────────────────────

const ReportsTab: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const total = tasks.length || 1;
    const done = tasks.filter(t => t.status === 'completed').length;
    const hiDone = tasks.filter(t => t.status === 'completed' && t.priority === 'high').length;
    const avg = (tasks.length / TEAM_MEMBERS.length).toFixed(1);
    const rate = Math.round(done / total * 100);
    const ontime = tasks.filter(t => t.status === 'completed' && (!t.deadline || new Date(t.deadline + 'T00:00:00') >= new Date())).length;
    const ontimeRate = Math.round(ontime / total * 100);

    const statuses: TaskStatus[] = ['pending', 'in-progress', 'completed', 'overdue'];
    const maxStat = Math.max(...statuses.map(s => tasks.filter(t => t.status === s).length), 1);
    const statusColors: Record<TaskStatus, string> = {
        pending: 'fill-primary', 'in-progress': 'fill-amber', completed: 'fill-green', overdue: 'fill-red',
    };

    return (
        <div className="tab-content">
            <div className="stats-row">
                {[
                    { label: 'Completion Rate', value: `${rate}%`, icon: <CheckCircle2 size={18} />, cls: 'bg-success', sub: 'Tasks finished on time' },
                    { label: 'High Priority Done', value: hiDone, icon: <AlertCircle size={18} />, cls: 'bg-danger', sub: 'Critical tasks resolved' },
                    { label: 'Avg Tasks / Member', value: avg, icon: <Users size={18} />, cls: 'bg-primary', sub: 'Workload balance' },
                    { label: 'On-time Rate', value: `${ontimeRate}%`, icon: <BarChart3 size={18} />, cls: 'bg-warning', sub: 'Completed before deadline' },
                ].map(s => (
                    <div key={s.label} className="card stat-card">
                        <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                        <div><p>{s.label}</p><h3>{s.value}</h3><small>{s.sub}</small></div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><h3>Task Status Distribution</h3></div>
                    <div className="perf-bars" style={{ marginTop: 8 }}>
                        {statuses.map(s => {
                            const cnt = tasks.filter(t => t.status === s).length;
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
                        {TEAM_MEMBERS.map(m => {
                            const mt = tasks.filter(t => t.assigneeId === m.id);
                            const mc = mt.filter(t => t.status === 'completed').length;
                            const r = mt.length ? Math.round(mc / mt.length * 100) : 0;
                            return (
                                <div key={m.id} className="perf-item">
                                    <span className="perf-label">{m.name.split(' ')[0]}</span>
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

            {/* Full Report Table */}
            <div className="card">
                <div className="card-header"><h3>Full Task Report (FR-015)</h3></div>
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
                            {tasks.map(t => {
                                const m = findMember(t.assigneeId);
                                return (
                                    <tr key={t.id}>
                                        <td>{t.name}</td>
                                        <td>{m?.name ?? '—'}</td>
                                        <td><PrioBadge p={t.priority} /></td>
                                        <td>{fmtDate(t.deadline)}</td>
                                        <td><span className={statusBadgeClass(t.status)}>{t.status}</span></td>
                                        <td style={{ minWidth: 100 }}><ProgressBar pct={t.progress} cls={progressFillClass(t)} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ─── Root Component ───────────────────────────────────────────────────────────

export default function OpsAdminDashboard() {
    const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [nextId, setNextId] = useState(INITIAL_TASKS.length + 1);

    // Modal state
    const [showNew, setShowNew] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);

    const employeeId = typeof window !== 'undefined' ? localStorage.getItem('employeeId') ?? 'Admin' : 'Admin';

    const handleNewTask = (data: Omit<Task, 'id'> & { id?: number }) => {
        const task: Task = { ...data, id: nextId } as Task;
        setTasks(prev => [...prev, task]);
        setNextId(n => n + 1);
        setShowNew(false);
    };

    const handleEditTask = (data: Omit<Task, 'id'> & { id?: number }) => {
        setTasks(ts => ts.map(t => t.id === data.id ? { ...data, id: data.id! } as Task : t));
        setEditingTask(null);
    };

    const handleDeleteTask = () => {
        if (!editingTask) return;
        if (!window.confirm('Delete this task?')) return;
        setTasks(ts => ts.filter(t => t.id !== editingTask.id));
        setEditingTask(null);
    };

    const navItems = [
        { tab: 'dashboard' as NavTab, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { tab: 'tasks' as NavTab, label: 'Tasks', icon: <Package size={20} /> },
        { tab: 'team' as NavTab, label: 'Team', icon: <Users size={20} /> },
        { tab: 'reports' as NavTab, label: 'Reports', icon: <BarChart3 size={20} /> },
    ];

    const pageTitles: Record<NavTab, string> = {
        dashboard: 'Board Overview',
        tasks: 'Task Management',
        team: 'Team Management',
        reports: 'Performance Reports',
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-box" />
                </div>
                <nav className="sidebar-nav">
                    {navItems.map(n => (
                        <div
                            key={n.tab}
                            className={`nav-item${activeTab === n.tab ? ' active' : ''}`}
                            onClick={() => setActiveTab(n.tab)}
                        >
                            {n.icon}
                            <span>{n.label}</span>
                        </div>
                    ))}
                    <div className="nav-item"><Truck size={20} /><span>Delivery</span></div>
                    <div className="nav-item"><UserCircle2 size={20} /><span>Profile</span></div>
                </nav>
            </aside>

            {/* Main */}
            <main className="main-viewport">
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h2>{pageTitles[activeTab]}</h2>
                        <p>
                            Dashboard —{' '}
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="header-user">
                        <div className="user-block">
                            <div className="avatar-circle">{employeeId.charAt(0).toUpperCase()}</div>
                            <div className="user-text">
                                <span className="welcome-text">Welcome back</span>
                                <strong>{employeeId}</strong>
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
                            <Plus size={14} /> New Task
                        </button>
                        <button className="logout-btn" onClick={() => {
                            localStorage.removeItem('employeeId');
                            localStorage.removeItem('authToken');
                            window.location.href = '/';
                        }}>
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'dashboard' && (
                    <DashboardTab
                        tasks={tasks}
                        onView={id => setViewingTask(tasks.find(t => t.id === id) ?? null)}
                        onNewTask={() => setShowNew(true)}
                    />
                )}
                {activeTab === 'tasks' && (
                    <TasksTab
                        tasks={tasks}
                        onView={id => setViewingTask(tasks.find(t => t.id === id) ?? null)}
                        onEdit={id => setEditingTask(tasks.find(t => t.id === id) ?? null)}
                    />
                )}
                {activeTab === 'team' && (
                    <TeamTab tasks={tasks} onView={id => setViewingTask(tasks.find(t => t.id === id) ?? null)} />
                )}
                {activeTab === 'reports' && <ReportsTab tasks={tasks} />}
            </main>

            {/* Modals */}
            {showNew && <TaskModal mode="new" onSave={handleNewTask} onClose={() => setShowNew(false)} />}
            {editingTask && (
                <TaskModal
                    mode="edit"
                    initial={editingTask}
                    onSave={handleEditTask}
                    onDelete={handleDeleteTask}
                    onClose={() => setEditingTask(null)}
                />
            )}
            {viewingTask && (
                <ViewModal
                    task={viewingTask}
                    onEdit={() => { setEditingTask(viewingTask); setViewingTask(null); }}
                    onClose={() => setViewingTask(null)}
                />
            )}
        </div>
    );
}