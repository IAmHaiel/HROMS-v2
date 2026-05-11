import React, { useState } from 'react';
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
    Trash2,
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
} from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './OpAdmin_Dashboard.css';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'high' | 'medium' | 'low';
type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
type NavTab = 'dashboard' | 'tasks' | 'team' | 'reports' | 'profile';

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

const NAV_ITEMS = [
    { tab: 'dashboard' as NavTab, icon: LayoutDashboard, label: 'Dashboard' },
    { tab: 'tasks' as NavTab, icon: Package, label: 'Tasks' },
    { tab: 'team' as NavTab, icon: Users, label: 'Team' },
    { tab: 'reports' as NavTab, icon: BarChart3, label: 'Reports' },
    { tab: 'profile' as NavTab, icon: UserCircle2, label: 'Profile' },
];

const EMPTY_TASK: Omit<Task, 'id'> = {
    name: '', description: '', deadline: '',
    priority: 'medium', assigneeId: '', status: 'pending', progress: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const findMember = (id: string): TeamMember | undefined =>
    TEAM_MEMBERS.find(m => m.id === id);

const fmtDate = (d: string): string => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const isEffectivelyOverdue = (t: Task): boolean =>
    t.status !== 'completed' && !!t.deadline && new Date(t.deadline + 'T00:00:00') < new Date();

const statusBadgeClass = (s: TaskStatus): string =>
    ({ pending: 'badge badge-blue', 'in-progress': 'badge badge-amber', completed: 'badge badge-green', overdue: 'badge badge-red' }[s] ?? 'badge badge-blue');

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
    <span className={`badge ${p === 'high' ? 'badge-red' : p === 'medium' ? 'badge-amber' : 'badge-green'}`}>{p}</span>
);

const ProgressBar: React.FC<{ pct: number; cls: string }> = ({ pct, cls }) => (
    <div className="progress-bar">
        <div className={`progress-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
);

interface TaskRowProps {
    task: Task;
    onView: (id: number) => void;
    onEdit?: (id: number) => void;
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
                {showEditBtn && onEdit && (
                    <button className="btn btn-xs" onClick={e => { e.stopPropagation(); onEdit(task.id); }}>
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

const TaskModal: React.FC<TaskModalProps> = ({ mode, initial = {}, onSave, onDelete, onClose }) => {
    const [form, setForm] = useState<Omit<Task, 'id'>>({ ...EMPTY_TASK, ...initial });
    const [submitting, setSubmitting] = useState(false);

    const set = (key: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setForm(prev => ({ ...prev, [key]: e.target.value }));

    const handleSave = () => {
        if (!form.name.trim()) { alert('Task name is required'); return; }
        setSubmitting(true);
        onSave({ ...form, ...(initial?.id !== undefined ? { id: initial.id } : {}) });
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
                            <label>Assign To</label>
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
                </div>

                <div className="modal-actions">
                    <button className="btn" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                        {submitting
                            ? <><Loader2 size={13} className="spin" /> Saving…</>
                            : <><Save size={13} /> {mode === 'new' ? 'Create Task' : 'Save Changes'}</>
                        }
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
    onDelete: () => void;
    onClose: () => void;
}
const ViewModal: React.FC<ViewModalProps> = ({ task, onEdit, onDelete, onClose }) => {
    const member = findMember(task.assigneeId);
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3>{task.name}</h3>
                        <p className="modal-subtitle">Viewing task details</p>
                    </div>
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
                    <button className="btn btn-danger" onClick={onDelete}><Trash2 size={13} /> Delete</button>
                    <div style={{ flex: 1 }} />
                    <button className="btn" onClick={onClose}>Close</button>
                    <button className="btn btn-primary" onClick={onEdit}><Pencil size={13} /> Edit Task</button>
                </div>
            </div>
        </div>
    );
};

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

const DashboardTab: React.FC<{ tasks: Task[]; onView: (id: number) => void; onNewTask: () => void }> =
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
                        {tasks.slice(-5).reverse().map(t => (
                            <TaskRow key={t.id} task={t} onView={onView} />
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
    searchQuery: string;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
}> = ({ tasks, searchQuery, onView, onEdit }) => {
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterAssignee, setFilterAssignee] = useState('');

    const filtered = tasks.filter(t =>
        (!filterStatus || t.status === filterStatus) &&
        (!filterPriority || t.priority === filterPriority) &&
        (!filterAssignee || t.assigneeId === filterAssignee) &&
        (!searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="dashboard-content">
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

const TeamTab: React.FC<{ tasks: Task[]; onView: (id: number) => void }> = ({ tasks, onView }) => {
    const [selectedMemberId, setSelectedMemberId] = useState(TEAM_MEMBERS[0].id);
    const maxLoad = Math.max(...TEAM_MEMBERS.map(m => tasks.filter(t => t.assigneeId === m.id).length), 1);

    return (
        <div className="dashboard-content">
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

            <div className="card">
                <div className="card-header">
                    <h3>{findMember(selectedMemberId)?.name}'s Tasks</h3>
                </div>
                {tasks.filter(t => t.assigneeId === selectedMemberId).length === 0
                    ? <div className="empty-state"><Package size={20} /><p>No tasks assigned</p></div>
                    : tasks.filter(t => t.assigneeId === selectedMemberId).map(t =>
                        <TaskRow key={t.id} task={t} onView={onView} />
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
    const employeeId = localStorage.getItem('employeeId') ?? 'Admin';
    const employeeName = localStorage.getItem('employeeName') ?? '';

    const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [nextId, setNextId] = useState(INITIAL_TASKS.length + 1);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [showNew, setShowNew] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);

    const handleNewTask = (data: Omit<Task, 'id'> & { id?: number }) => {
        setTasks(prev => [...prev, { ...data, id: nextId } as Task]);
        setNextId(n => n + 1);
        setShowNew(false);
    };

    const handleEditTask = (data: Omit<Task, 'id'> & { id?: number }) => {
        setTasks(ts => ts.map(t => t.id === data.id ? { ...data, id: data.id! } as Task : t));
        setEditingTask(null);
    };

    const handleDeleteTask = (taskToDelete: Task) => {
        if (!window.confirm(`Delete "${taskToDelete.name}"? This cannot be undone.`)) return;
        setTasks(ts => ts.filter(t => t.id !== taskToDelete.id));
        setViewingTask(null);
        setEditingTask(null);
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
                        <h2>{pageTitles[activeTab]}</h2>
                        <p>
                            Operations Admin —{' '}
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                            })}
                        </p>
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
                                <Plus size={18} />
                                New Task
                            </button>
                        </div>
                    )}
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
                        searchQuery={searchQuery}
                        onView={id => setViewingTask(tasks.find(t => t.id === id) ?? null)}
                        onEdit={id => setEditingTask(tasks.find(t => t.id === id) ?? null)}
                    />
                )}
                {activeTab === 'team' && (
                    <TeamTab
                        tasks={tasks}
                        onView={id => setViewingTask(tasks.find(t => t.id === id) ?? null)}
                    />
                )}
                {activeTab === 'reports' && <ReportsTab tasks={tasks} />}
                {activeTab === 'profile' && <ProfileTab />}
            </main>

            {/* ── Modals ── */}
            {showNew && (
                <TaskModal
                    mode="new"
                    onSave={handleNewTask}
                    onClose={() => setShowNew(false)}
                />
            )}
            {editingTask && (
                <TaskModal
                    mode="edit"
                    initial={editingTask}
                    onSave={handleEditTask}
                    onClose={() => setEditingTask(null)}
                />
            )}
            {viewingTask && (
                <ViewModal
                    task={viewingTask}
                    onEdit={() => { setEditingTask(viewingTask); setViewingTask(null); }}
                    onDelete={() => handleDeleteTask(viewingTask)}
                    onClose={() => setViewingTask(null)}
                />
            )}
        </div>
    );
}