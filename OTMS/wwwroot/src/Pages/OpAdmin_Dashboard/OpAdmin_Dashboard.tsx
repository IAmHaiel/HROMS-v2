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
    RotateCcw,
    ThumbsUp,
    ThumbsDown,
    Download,
    FileText,
    Calendar,
    Filter,
    Repeat,
    ToggleLeft,
    Copy,
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
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader';
import StatCard from '../../components/StatCard/StatCard';
import TableCard, { ActionsDropdown } from '../../components/TableCard/TableCard';
import ActionButton from '../../components/ActionButton/ActionButton';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';

interface ConfirmModalState {
    isOpen: boolean;
    variant: 'neutral' | 'danger' | 'warning' | 'info' | 'success';
    title: string;
    description: string;
    notice?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
}

const CONFIRM_CLOSED: ConfirmModalState = {
    isOpen: false,
    variant: 'neutral',
    title: '',
    description: '',
    onConfirm: () => {},
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'Critical' | 'High' | 'Medium' | 'Low';  // match backend casing
type TaskStatus = 'Draft' | 'Assigned' | 'Pending' | 'In Progress' | 'Done' | 'Completed' | 'Overdue';
type NavTab =
    | 'dashboard'
    | 'tasks'
    | 'team'
    | 'leave'
    | 'reports'
    | 'profile'
    | 'reopen'
    | 'templates';

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

// ─── Reopen Request Types ──────────────────────────────────────────────────────

interface ReopenRequest {
    requestId: string;
    taskId: string;
    taskTitle: string;
    employeeName: string;
    employeeId: string;
    reason: string;
    supportingEvidence?: string;
    currentStatus: TaskStatus;
    status: 'Pending' | 'Approved' | 'Rejected';
    submittedAt: string;
    reviewedAt?: string;
    adminRemarks?: string;
}

// ─── Report Types ──────────────────────────────────────────────────────────────

interface ReportFilter {
    dateRangeStart: string;
    dateRangeEnd: string;
    employeeId: string;
    taskPriorityLevel: string;
    taskStatus: string;
    taskCategory: string;
}

interface TaskCompletionReport {
    totalTasksAssigned: number;
    totalTasksCompleted: number;
    totalTasksInProgress: number;
    totalTasksPendingReview: number;
    totalOverdueTasks: number;
    taskCompletionRate: number;
    averageTaskCompletionTimeHours: number;
    employeePerformanceSummary: EmployeePerformance[];
}

interface EmployeePerformance {
    employeeName: string;
    totalAssigned: number;
    totalCompleted: number;
    completionRate: number;
    averageCompletionTimeHours: number;
}

const TASK_CATEGORIES = [
    'Delivery',
    'Warehouse',
    'Maintenance',
    'Administrative',
    'Logistics',
];

const TASK_STATUSES_FILTER = [
    'Pending',
    'In Progress',
    'Done',
    'Completed',
    'Overdue',
];

const PRIORITY_LEVELS = ['Critical', 'High', 'Medium', 'Low'];

// ─── Task Template Types ───────────────────────────────────────────────────────

interface TaskTemplateDTO {
    templateId: string;
    templateName: string;
    templateDescription: string;
    priorityLevel: string;
    recurrenceType: string;
    recurrenceStartDate: string;
    assignedEmployeeId: string | null;
    assignedEmployeeName: string | null;
    templateStatus: string;
    nextGenerationDate: string | null;
    lastGeneratedDate: string | null;
    createdBy: string;
    createdByName: string | null;
    createdAt: string;
}

interface CreateTemplateDTO {
    templateName: string;
    templateDescription: string;
    priorityLevel: string;
    recurrenceType: string;
    recurrenceStartDate: string;
    assignedEmployee: string | null;
    templateStatus: string;
}

const RECURRENCE_TYPES = ['Daily', 'Weekly', 'Monthly'];
const TEMPLATE_STATUSES = ['Active', 'Inactive'];
const RECURRENCE_LABELS: Record<string, string> = { Daily: 'Every day', Weekly: 'Every week', Monthly: 'Every month' };

// ─── Mock Template Data (toggle to test without backend) ──────────────────────
const USE_MOCK_TEMPLATES = true;

const MOCK_TEMPLATES: TaskTemplateDTO[] = [
    { templateId: 'tpl-001', templateName: 'Weekly Warehouse Inventory', templateDescription: 'Full inventory count of all warehouse stock items, including pallets, bins, and cold storage.', priorityLevel: 'High', recurrenceType: 'Weekly', recurrenceStartDate: '2026-06-15T00:00:00', nextGenerationDate: '2026-06-22T00:00:00', lastGeneratedDate: null, assignedEmployeeId: 'mock-003', assignedEmployeeName: 'Clara Santos', templateStatus: 'Active', createdBy: 'admin', createdByName: 'System Admin', createdAt: '2026-05-01T00:00:00' },
    { templateId: 'tpl-002', templateName: 'Daily Delivery Route Review', templateDescription: 'Review and optimize daily delivery routes for all couriers based on pending orders and traffic data.', priorityLevel: 'Medium', recurrenceType: 'Daily', recurrenceStartDate: '2026-06-01T00:00:00', nextGenerationDate: '2026-06-17T00:00:00', lastGeneratedDate: null, assignedEmployeeId: 'mock-001', assignedEmployeeName: 'Ana Reyes', templateStatus: 'Active', createdBy: 'admin', createdByName: 'System Admin', createdAt: '2026-05-15T00:00:00' },
    { templateId: 'tpl-003', templateName: 'Monthly Fleet Maintenance', templateDescription: 'Scheduled maintenance check for all delivery vehicles including oil change, tire pressure, brake inspection, and fluid levels.', priorityLevel: 'Critical', recurrenceType: 'Monthly', recurrenceStartDate: '2026-01-01T00:00:00', nextGenerationDate: '2026-07-01T00:00:00', lastGeneratedDate: null, assignedEmployeeId: 'mock-004', assignedEmployeeName: 'Franco Mendoza', templateStatus: 'Active', createdBy: 'admin', createdByName: 'System Admin', createdAt: '2025-12-20T00:00:00' },
    { templateId: 'tpl-004', templateName: 'Customer Feedback Follow-Up', templateDescription: 'Call customers who received deliveries in the past week to collect satisfaction feedback and resolve issues.', priorityLevel: 'Low', recurrenceType: 'Weekly', recurrenceStartDate: '2026-06-10T00:00:00', nextGenerationDate: '2026-06-24T00:00:00', lastGeneratedDate: null, assignedEmployeeId: null, assignedEmployeeName: null, templateStatus: 'Inactive', createdBy: 'admin', createdByName: 'System Admin', createdAt: '2026-06-01T00:00:00' },
    { templateId: 'tpl-005', templateName: 'End-of-Day Reconciliation', templateDescription: 'Reconcile all deliveries completed for the day, including proof of delivery photos, signatures, and payment collection.', priorityLevel: 'Medium', recurrenceType: 'Daily', recurrenceStartDate: '2026-06-01T00:00:00', nextGenerationDate: '2026-06-17T00:00:00', lastGeneratedDate: null, assignedEmployeeId: 'mock-002', assignedEmployeeName: 'Ben Villanueva', templateStatus: 'Active', createdBy: 'admin', createdByName: 'System Admin', createdAt: '2026-05-10T00:00:00' },
    { templateId: 'tpl-006', templateName: 'Safety Compliance Audit', templateDescription: 'Bi-weekly audit of safety compliance across warehouse and delivery operations, including PPE checks and incident log review.', priorityLevel: 'High', recurrenceType: 'Weekly', recurrenceStartDate: '2026-06-08T00:00:00', nextGenerationDate: '2026-06-22T00:00:00', lastGeneratedDate: null, assignedEmployeeId: 'mock-006', assignedEmployeeName: 'Elena Bautista', templateStatus: 'Active', createdBy: 'admin', createdByName: 'System Admin', createdAt: '2026-04-01T00:00:00' },
];

// ─── Mock Report Data (toggle to test without backend) ────────────────────────
const USE_MOCK_REPORT = true;

function mockTaskCompletionReport(filter: ReportFilter): TaskCompletionReport {
    return {
        totalTasksAssigned: 42,
        totalTasksCompleted: 28,
        totalTasksInProgress: 8,
        totalTasksPendingReview: 3,
        totalOverdueTasks: 3,
        taskCompletionRate: 67,
        averageTaskCompletionTimeHours: 4.5,
        employeePerformanceSummary: [
            { employeeName: 'Ana Reyes', totalAssigned: 12, totalCompleted: 9, completionRate: 75, averageCompletionTimeHours: 3.2 },
            { employeeName: 'Ben Villanueva', totalAssigned: 10, totalCompleted: 7, completionRate: 70, averageCompletionTimeHours: 4.1 },
            { employeeName: 'Clara Santos', totalAssigned: 8, totalCompleted: 6, completionRate: 75, averageCompletionTimeHours: 2.8 },
            { employeeName: 'Franco Mendoza', totalAssigned: 7, totalCompleted: 4, completionRate: 57, averageCompletionTimeHours: 5.3 },
            { employeeName: 'Daniel Cruz', totalAssigned: 3, totalCompleted: 1, completionRate: 33, averageCompletionTimeHours: 6.7 },
            { employeeName: 'Elena Bautista', totalAssigned: 2, totalCompleted: 1, completionRate: 50, averageCompletionTimeHours: 4.0 },
        ],
    };
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

// ─── Mock Data Toggle (set to true to test smart task routing) ────────────────
const USE_MOCK_DATA = true;

const MOCK_TEAM_MEMBERS: TeamMember[] = [
    { accountId: 'mock-001', employeeName: 'Ana Reyes',        role: 'Courier',          presenceStatus: 'Online'   },
    { accountId: 'mock-002', employeeName: 'Ben Villanueva',   role: 'Courier',          presenceStatus: 'Online'   },
    { accountId: 'mock-003', employeeName: 'Clara Santos',     role: 'Warehouse Staff',  presenceStatus: 'Online'   },
    { accountId: 'mock-004', employeeName: 'Daniel Cruz',      role: 'Courier',          presenceStatus: 'Offline'  },
    { accountId: 'mock-005', employeeName: 'Elena Bautista',   role: 'Warehouse Staff',  presenceStatus: 'On Leave' },
    { accountId: 'mock-006', employeeName: 'Franco Mendoza',   role: 'Courier',          presenceStatus: 'Online'   },
];

const futureDate = (daysFromNow: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString();
};
const pastDate = (daysAgo: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
};

const MOCK_TASKS: Task[] = [
    // ── Ana Reyes – 3 active tasks (heaviest workload among online members) ──
    {
        taskId: 'task-001', taskTitle: 'Deliver parcels to Makati CBD',
        taskDescription: 'Batch delivery of 15 parcels to Makati commercial district.',
        priority: 'High', dueAt: futureDate(1), taskStatus: 'In Progress',
        assignedEmployee: 'Ana Reyes', createdByEmployee: 'Op Admin',
        assignedTo: 'mock-001', createdAt: pastDate(2),
    },
    {
        taskId: 'task-002', taskTitle: 'Sort incoming shipments – Zone A',
        taskDescription: 'Sort and tag all incoming parcels for Zone A.',
        priority: 'Medium', dueAt: futureDate(2), taskStatus: 'Pending',
        assignedEmployee: 'Ana Reyes', createdByEmployee: 'Op Admin',
        assignedTo: 'mock-001', createdAt: pastDate(1),
    },
    {
        taskId: 'task-003', taskTitle: 'Return failed deliveries to hub',
        taskDescription: 'Bring back 4 undelivered parcels and log return reasons.',
        priority: 'Low', dueAt: futureDate(3), taskStatus: 'Pending',
        assignedEmployee: 'Ana Reyes', createdByEmployee: 'Op Admin',
        assignedTo: 'mock-001', createdAt: pastDate(1),
    },

    // ── Ben Villanueva – 2 active tasks ──
    {
        taskId: 'task-004', taskTitle: 'Route optimization for Quezon City',
        taskDescription: 'Plan optimal delivery route for 20 stops in QC.',
        priority: 'Critical', dueAt: futureDate(1), taskStatus: 'In Progress',
        assignedEmployee: 'Ben Villanueva', createdByEmployee: 'Op Admin',
        assignedTo: 'mock-002', createdAt: pastDate(3),
    },
    {
        taskId: 'task-005', taskTitle: 'Vehicle maintenance check – Van 3',
        taskDescription: 'Coordinate with garage for scheduled maintenance.',
        priority: 'Medium', dueAt: futureDate(5), taskStatus: 'Pending',
        assignedEmployee: 'Ben Villanueva', createdByEmployee: 'Op Admin',
        assignedTo: 'mock-002', createdAt: pastDate(2),
    },

    // ── Clara Santos – 1 active task (should be recommended by smart routing) ──
    {
        taskId: 'task-006', taskTitle: 'Inventory audit – Shelf B12',
        taskDescription: 'Count and reconcile items on shelf B12 against system records.',
        priority: 'Low', dueAt: futureDate(4), taskStatus: 'Pending',
        assignedEmployee: 'Clara Santos', createdByEmployee: 'Op Admin',
        assignedTo: 'mock-003', createdAt: pastDate(1),
    },

    // ── Franco Mendoza – 2 active tasks ──
    {
        taskId: 'task-007', taskTitle: 'Pickup from supplier – Pasig warehouse',
        taskDescription: 'Collect 8 pallets from supplier and transport to main hub.',
        priority: 'High', dueAt: futureDate(1), taskStatus: 'In Progress',
        assignedEmployee: 'Franco Mendoza', createdByEmployee: 'Op Admin',
        assignedTo: 'mock-006', createdAt: pastDate(2),
    },
    {
        taskId: 'task-008', taskTitle: 'Deliver fragile items – Taguig',
        taskDescription: 'Handle with care: electronics delivery to Taguig residential area.',
        priority: 'Critical', dueAt: futureDate(2), taskStatus: 'Pending',
        assignedEmployee: 'Franco Mendoza', createdByEmployee: 'Op Admin',
        assignedTo: 'mock-006', createdAt: pastDate(1),
    },

    // ── Daniel Cruz (Offline) – tasks should NOT count for routing ──
    {
        taskId: 'task-009', taskTitle: 'Deliver to Mandaluyong offices',
        taskDescription: 'Scheduled office deliveries for the week.',
        priority: 'Medium', dueAt: futureDate(3), taskStatus: 'Pending',
        assignedEmployee: 'Daniel Cruz', createdByEmployee: 'Op Admin',
        assignedTo: 'mock-004', createdAt: pastDate(4),
    },

    // ── Elena Bautista (On Leave) – tasks should NOT count for routing ──
    {
        taskId: 'task-010', taskTitle: 'Restock packaging materials',
        taskDescription: 'Order and restock bubble wrap, tape, and boxes.',
        priority: 'Low', dueAt: futureDate(7), taskStatus: 'Pending',
        assignedEmployee: 'Elena Bautista', createdByEmployee: 'Op Admin',
        assignedTo: 'mock-005', createdAt: pastDate(5),
    },

    // ── Completed tasks (should NOT affect workload count) ──
    {
        taskId: 'task-011', taskTitle: 'Weekly report submission',
        taskDescription: 'Submit weekly delivery performance report.',
        priority: 'Medium', dueAt: pastDate(1), taskStatus: 'Completed',
        assignedEmployee: 'Ana Reyes', createdByEmployee: 'Op Admin',
        assignedTo: 'mock-001', createdAt: pastDate(7),
    },
    {
        taskId: 'task-012', taskTitle: 'Calibrate weighing scale',
        taskDescription: 'Annual calibration of warehouse weighing equipment.',
        priority: 'High', dueAt: pastDate(2), taskStatus: 'Completed',
        assignedEmployee: 'Clara Santos', createdByEmployee: 'Op Admin',
        assignedTo: 'mock-003', createdAt: pastDate(10),
    },
];

const MOCK_REOPEN_REQUESTS: ReopenRequest[] = [
    {
        requestId: 'reopen-001',
        taskId: 'task-011',
        taskTitle: 'Weekly report submission',
        employeeName: 'Ana Reyes',
        employeeId: 'mock-001',
        reason: 'Several entries in the weekly report were incorrect. I need to update the delivery counts and add missing data for Friday.',
        currentStatus: 'Completed',
        status: 'Pending',
        submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
        requestId: 'reopen-002',
        taskId: 'task-012',
        taskTitle: 'Calibrate weighing scale',
        employeeName: 'Clara Santos',
        employeeId: 'mock-003',
        reason: 'The calibration was done but the certification document was not attached. Need to reopen to upload the certificate.',
        supportingEvidence: 'calibration_note.pdf',
        currentStatus: 'Completed',
        status: 'Pending',
        submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
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
        label: 'TEMPLATES',
        items: [
            { tab: 'templates' as NavTab, icon: Copy, label: 'Task Templates' },
        ],
    },
    {
        label: 'REPORTS',
        items: [
            { tab: 'reports' as NavTab, icon: BarChart3, label: 'Reports' },
        ],
    },
    {
        label: 'REQUESTS',
        items: [
            { tab: 'reopen' as NavTab, icon: RotateCcw, label: 'Reopen Requests' },
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
    t.taskStatus !== 'Completed' && t.taskStatus !== 'Draft' && !!t.dueAt && new Date(t.dueAt) < new Date();

const getInitials = (name: string): string => {
    if (!name) return 'OA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

const statusBadgeClass = (s: string): string =>
({
    'Draft': 'badge badge-gray',
    'Assigned': 'badge badge-purple',
    'Pending': 'badge badge-blue',
    'In Progress': 'badge badge-amber',
    'Done': 'badge badge-blue',
    'Completed': 'badge badge-green',
    'Overdue': 'badge badge-red'
}[s] ?? 'badge badge-blue');

// ─── FSM (Finite State Machine) Task Status Transitions ──────────────────────
const FSM_TRANSITIONS: Record<string, string[]> = {
    'Draft': ['Assigned'],
    'Assigned': ['In Progress'],
    'In Progress': ['Done'],
    'Done': ['Completed'],
    'Completed': [],
    'Pending': ['In Progress'],
    'Overdue': [],
};

const isTransitionValid = (from: string, to: string): boolean =>
    FSM_TRANSITIONS[from]?.includes(to) ?? false;

const priorityDotClass = (p: Priority): string =>
    ({ Critical: 'prio-dot critical', High: 'prio-dot high', Medium: 'prio-dot medium', Low: 'prio-dot low' }[p]);

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
    <span className={`badge ${p === 'Critical' ? 'badge-critical' : p === 'High' ? 'badge-red' : p === 'Medium' ? 'badge-amber' : 'badge-green'}`}>{p}</span>
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
                    <ActionsDropdown
                        actions={[
                            {
                                label: 'Edit',
                                icon: <Pencil size={12} />,
                                onClick: () => onEdit(task.taskId)
                            },
                            {
                                label: 'View Details',
                                icon: <Eye size={12} />,
                                onClick: () => onView(task.taskId)
                            }
                        ]}
                    />
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

interface WorkloadInfo {
    employeeName: string;
    accountId: string;
    availabilityStatus: string;
    workload: number;
}

interface Recommendation {
    employeeName: string;
    accountId: string;
    availabilityStatus: string;
    workload: number;
    reason: string;
}

interface TaskModalProps {
    mode: 'new' | 'edit';
    initial?: Partial<Task>;
    teamMembers: TeamMember[];
    tasks: Task[];
    onSave: (data: CreateTaskDTO | UpdateTaskDTO) => void;
    onClose: () => void;
    onDelete?: () => void;
    showSuccess?: (msg: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ mode, initial = {}, teamMembers, tasks, onSave, onClose, onDelete, showSuccess }) => {
    const resolvedAssignedTo =
        initial.assignedTo ||
        teamMembers.find(m => m.employeeName === initial.assignedEmployee)?.accountId ||
        '';

    const [form, setForm] = useState({
        taskTitle: initial.taskTitle ?? '',
        taskDescription: initial.taskDescription ?? '',
        dueAt: initial.dueAt ? initial.dueAt.substring(0, 16) : '',
        priority: initial.priority ?? '' as Priority,
        assignedTo: resolvedAssignedTo,
        taskRemarks: initial.taskRemarks ?? '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [eligibleEmployees, setEligibleEmployees] = useState<WorkloadInfo[]>([]);
    const [recommendationAccepted, setRecommendationAccepted] = useState(true);

    useEffect(() => {
        if (mode !== 'new') return;
        const eligible = teamMembers.filter(m =>
            m.presenceStatus !== 'Offline' && m.presenceStatus !== 'On Leave'
        );
        const withWorkload = eligible.map(m => ({
            employeeName: m.employeeName,
            accountId: m.accountId,
            availabilityStatus: m.presenceStatus || 'Active',
            workload: tasks.filter(t =>
                t.assignedEmployee === m.employeeName &&
                t.taskStatus !== 'Completed'
            ).length,
        }));
        withWorkload.sort((a, b) => a.workload - b.workload);
        setEligibleEmployees(withWorkload);
        if (withWorkload.length > 0) {
            const best = withWorkload[0];
            setRecommendation({
                ...best,
                reason: `Lowest active workload (${best.workload} tasks) among eligible team members. Availability: ${best.availabilityStatus}.`,
            });
            if (resolvedAssignedTo === '') {
                setForm(prev => ({ ...prev, assignedTo: best.accountId }));
            }
        }
    }, []);

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
                if (!value) return 'Due date/time is required.';
                const selected = new Date(value);
                const now = new Date();
                if (selected < now) return 'Due date/time cannot be in the past.';
                return '';
            }
            case 'assignedTo': {
                if (!value) return 'Please assign the task to someone.';
                return '';
            }
            case 'priority': {
                if (!value) return 'Priority is required.';
                if (!['Critical', 'High', 'Medium', 'Low'].includes(value)) return 'Please select a valid priority.';
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
        if (mode === 'new' && showSuccess) {
            if (recommendationAccepted) {
                showSuccess('Recommendation accepted · Final assignment saved · Audit Log entry created.');
            } else {
                showSuccess('Recommendation overridden · Final assignment saved · Audit Log entry created.');
            }
        }
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
                                type="datetime-local"
                                value={form.dueAt}
                                onChange={set('dueAt')}
                                className={errors.dueAt ? 'input-error' : form.dueAt ? 'input-success' : ''}
                            />
                            <FieldErr name="dueAt" />
                            {!errors.dueAt && form.dueAt && (
                                <span style={{ fontSize: 11, color: '#05cd99', marginTop: 3, display: 'block' }}>
                                    ✓ {new Date(form.dueAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            {!form.dueAt && !errors.dueAt && (
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>
                                    Cannot be in the past.
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
                                <option value="Critical">⚫ Critical</option>
                                <option value="High">🔴 High</option>
                                <option value="Medium">🟡 Medium</option>
                                <option value="Low">🟢 Low</option>
                            </select>
                            <FieldErr name="priority" />
                            {!errors.priority && form.priority && (
                                <span style={{
                                    fontSize: 11, marginTop: 3, display: 'block',
                                    color: form.priority === 'Critical' ? '#7c1d1d' : form.priority === 'High' ? '#ee5d50' : form.priority === 'Medium' ? '#ffb547' : '#05cd99',
                                }}>
                                    {form.priority === 'Critical' && '🚨 Critical — requires immediate attention'}
                                    {form.priority === 'High' && '⚠ High priority — will be flagged for urgent attention'}
                                    {form.priority === 'Medium' && '✓ Medium priority selected'}
                                    {form.priority === 'Low' && '✓ Low priority selected'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── Smart Task Routing Recommendation ── */}
                    {mode === 'new' && recommendation && (
                        <div className="sr-section">
                            <div className="sr-header">
                                <div className="sr-title-row">
                                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                                        Smart Task Routing
                                    </span>
                                    <span className="sr-badge">Recommendation Ready</span>
                                </div>
                            </div>

                            <div className="sr-recommendation">
                                <div className="sr-rec-avatar">
                                    {recommendation.employeeName.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="sr-rec-name">{recommendation.employeeName}</div>
                                    <div className="sr-rec-meta">
                                        <span>Workload: <strong>{recommendation.workload} active tasks</strong></span>
                                        <span className={`sr-status-dot ${recommendation.availabilityStatus === 'Active' || recommendation.availabilityStatus === 'Online' ? 'online' : ''}`} />
                                        <span>Status: <strong>{recommendation.availabilityStatus}</strong></span>
                                    </div>
                                    <div className="sr-rec-reason">{recommendation.reason}</div>
                                </div>
                            </div>

                            {eligibleEmployees.length > 0 && (
                                <div className="sr-eligible-list">
                                    <div className="sr-eligible-title">Employee Availability & Workload</div>
                                    <div className="sr-eligible-header">
                                        <span>Employee</span>
                                        <span>Status</span>
                                        <span>Workload</span>
                                        <span />
                                    </div>
                                    {eligibleEmployees.map(e => (
                                        <div key={e.accountId} className={`sr-eligible-row${e.accountId === recommendation.accountId ? ' recommended' : ''}`}>
                                            <span className="sr-emp-name">{e.employeeName}</span>
                                            <span className={`sr-status-tag ${e.availabilityStatus === 'Active' || e.availabilityStatus === 'Online' ? 'active' : e.availabilityStatus === 'Offline' ? 'offline' : 'leave'}`}>
                                                {e.availabilityStatus}
                                            </span>
                                            <span className="sr-workload">{e.workload} tasks</span>
                                            {e.accountId === recommendation.accountId && (
                                                <span className="sr-rec-tag">Recommended</span>
                                            )}
                                        </div>
                                    ))}
                                    {teamMembers.filter(m => m.presenceStatus === 'Offline' || m.presenceStatus === 'On Leave').map(m => (
                                        <div key={m.accountId} className="sr-eligible-row excluded">
                                            <span className="sr-emp-name">{m.employeeName}</span>
                                            <span className={`sr-status-tag ${m.presenceStatus === 'Offline' ? 'offline' : 'leave'}`}>
                                                {m.presenceStatus}
                                            </span>
                                            <span className="sr-workload">—</span>
                                            <span className="sr-excluded-tag">Excluded</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="sr-note">
                                The system recommended <strong>{recommendation.employeeName}</strong> based on lowest workload.
                                You can accept this recommendation or select a different employee below.
                            </div>
                        </div>
                    )}

                    {/* ── Assign To ── */}
                    <div className="field">
                        <label>
                            {mode === 'new' ? 'Final Assigned Employee' : 'Assign To'}
                            <span style={{ color: 'var(--danger, #ee5d50)' }}>*</span>
                        </label>
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
                                        setRecommendationAccepted(false);
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
                                            if (recommendation && m.accountId !== recommendation.accountId) {
                                                setRecommendationAccepted(false);
                                            }
                                            (e.currentTarget.closest('.assignee-options') as HTMLElement).style.display = 'none';
                                        }}
                                    >
                                        <span className="assignee-opt-name">{m.employeeName}</span>
                                        <span className="assignee-opt-role">{m.role}</span>
                                        {recommendation && m.accountId === recommendation.accountId && (
                                            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--primary)', background: 'rgba(67,24,255,0.08)', padding: '2px 6px', borderRadius: 4, marginLeft: 8 }}>Recommended</span>
                                        )}
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
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
    onAdminOverride: (taskId: string) => void;
    onClose: () => void;
    onViewMore?: () => void;
}

const ViewModal: React.FC<ViewModalProps> = ({ task, onEdit, onReopen, onStatusChange, onAdminOverride, onClose, onViewMore }) => {
    const nextStatus = (FSM_TRANSITIONS[task.taskStatus]?.[0] ?? '') as TaskStatus;
    const canTransition = !!nextStatus;
    const statusLabel: Record<string, string> = {
        'Assigned': 'Mark In Progress',
        'In Progress': 'Mark Done',
        'Done': 'Approve & Complete',
    };

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
                    {canTransition && (
                        <button className="btn btn-primary" onClick={() => onStatusChange(task.taskId, nextStatus)}
                            title={`Transition to ${nextStatus}`}>
                            {statusLabel[task.taskStatus] ?? `Move to ${nextStatus}`}
                        </button>
                    )}
                    {task.taskStatus === 'Completed' && (
                        <button className="btn btn-primary" onClick={() => onAdminOverride(task.taskId)}
                            title="Admin override for completed task">
                            <RotateCcw size={13} /> Admin Override
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={onViewMore}>
                        View More
                    </button>
                    {task.taskStatus !== 'Completed' && (
                        <button className="btn btn-primary" onClick={onEdit}>
                            <Pencil size={13} /> Edit Task
                        </button>
                    )}
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

// ─── Admin Override Modal ──────────────────────────────────────────────────────
interface AdminOverrideModalProps {
    task: Task;
    onSubmit: (reason: string, remarks: string) => void;
    onClose: () => void;
}

const AdminOverrideModal: React.FC<AdminOverrideModalProps> = ({ task, onSubmit, onClose }) => {
    const [reason, setReason] = useState('');
    const [remarks, setRemarks] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [errors, setErrors] = useState<{ reason?: string; remarks?: string; confirmed?: string }>({});

    const handleSubmit = () => {
        const e: typeof errors = {};
        if (!reason.trim()) e.reason = 'Override reason is required.';
        else if (reason.length > 500) e.reason = 'Override reason must not exceed 500 characters.';
        if (!remarks.trim()) e.remarks = 'Admin remarks are required.';
        else if (remarks.length > 500) e.remarks = 'Admin remarks must not exceed 500 characters.';
        if (!confirmed) e.confirmed = 'You must confirm this override.';
        setErrors(e);
        if (Object.keys(e).length === 0) onSubmit(reason.trim(), remarks.trim());
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3>Admin Override</h3>
                        <p className="modal-subtitle" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                            Modifying completed task: <strong>{task.taskTitle}</strong>
                        </p>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={16} /></button>
                </div>
                <div className="modal-form">
                    <div className="view-modal-meta" style={{ marginBottom: 16 }}>
                        <div className="view-modal-meta-item">
                            <span className="view-modal-label">Task ID</span>
                            <span className="view-modal-meta-value" style={{ fontSize: 12 }}>{task.taskId}</span>
                        </div>
                        <div className="view-modal-meta-item">
                            <span className="view-modal-label">Current Status</span>
                            <span className={statusBadgeClass(task.taskStatus)}>{task.taskStatus}</span>
                        </div>
                        <div className="view-modal-meta-item">
                            <span className="view-modal-label">Priority</span>
                            <PrioBadge p={task.priority} />
                        </div>
                    </div>

                    <div className="field">
                        <label>Override Reason *</label>
                        <textarea className={errors.reason ? 'report-input report-input-error' : 'report-input'}
                            rows={3} maxLength={500} value={reason}
                            onChange={e => { setReason(e.target.value); setErrors(p => ({ ...p, reason: '' })); }}
                            placeholder="Explain why this completed task needs modification..." />
                        {errors.reason && <span className="report-field-error">{errors.reason}</span>}
                        <span style={{ fontSize: 11, marginTop: 3, display: 'block', textAlign: 'right', color: reason.length > 450 ? (reason.length >= 500 ? 'var(--status-failed)' : '#c05c00') : 'var(--text-secondary)' }}>
                            {reason.length}/500
                        </span>
                    </div>

                    <div className="field">
                        <label>Admin Remarks *</label>
                        <textarea className={errors.remarks ? 'report-input report-input-error' : 'report-input'}
                            rows={3} maxLength={500} value={remarks}
                            onChange={e => { setRemarks(e.target.value); setErrors(p => ({ ...p, remarks: '' })); }}
                            placeholder="Additional notes for the audit log..." />
                        {errors.remarks && <span className="report-field-error">{errors.remarks}</span>}
                        <span style={{ fontSize: 11, marginTop: 3, display: 'block', textAlign: 'right', color: remarks.length > 450 ? (remarks.length >= 500 ? 'var(--status-failed)' : '#c05c00') : 'var(--text-secondary)' }}>
                            {remarks.length}/500
                        </span>
                    </div>

                    <div className="field" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <input type="checkbox" id="override-confirm" checked={confirmed}
                            onChange={e => { setConfirmed(e.target.checked); setErrors(p => ({ ...p, confirmed: '' })); }}
                            style={{ marginTop: 3 }} />
                        <label htmlFor="override-confirm" style={{ fontSize: 13, fontWeight: 500, margin: 0, textTransform: 'none', letterSpacing: 0, color: 'var(--text-primary)' }}>
                            I confirm this admin override. I understand this action will be recorded in the Audit Log and the task will be reopened for modification.
                        </label>
                    </div>
                    {errors.confirmed && <span className="report-field-error">{errors.confirmed}</span>}

                    <div className="modal-actions" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}
                            style={{ background: 'var(--status-failed)', borderColor: 'var(--status-failed)' }}>
                            <Shield size={14} /> Submit Override
                        </button>
                    </div>
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
                        { label: 'TOTAL TASKS', value: total, icon: <ClipboardList size={20} strokeWidth={2.3} />, variant: 'primary', subtext: 'All active tasks' },
                        { label: 'IN PROGRESS', value: inProg, icon: <Truck size={20} strokeWidth={2.3} />, variant: 'warning', subtext: 'Assigned & running' },
                        { label: 'COMPLETED', value: done, icon: <CheckCircle2 size={20} strokeWidth={2.3} />, variant: 'success', subtext: 'This period' },
                        { label: 'OVERDUE', value: overdue, icon: <AlertCircle size={20} strokeWidth={2.3} />, variant: 'danger', subtext: 'Past deadline' },
                    ].map(s => (
                        <StatCard key={s.label} icon={s.icon} variant={s.variant} label={s.label} value={s.value} subtext={s.subtext} />
                    ))}
                </div>

                {/* Middle Grid */}
                <div className="dashboard-grid">
                    {/* Recent Tasks */}
                    <div className="card">
                        <div className="card-header-layout">
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
                        <div className="card-header-layout">
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
                        <div className="card-header-layout">
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

const TASK_STATUS_FILTERS = ['Pending', 'In Progress', 'Done', 'Completed', 'Overdue'];

const PRIORITY_WEIGHTS: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

const TasksTab: React.FC<{
    tasks: Task[];
    allTasks: Task[];
    binTasks: Task[];
    teamMembers: TeamMember[];
    loading: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onRestore: (taskId: string) => void;
    onEmptyBin: () => void;
    onNewTask: () => void;
}> = ({ tasks, allTasks, binTasks, teamMembers, loading, searchQuery, setSearchQuery, onView, onEdit, onRestore, onEmptyBin, onNewTask }) => {
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterDeadline, setFilterDeadline] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [subTab, setSubTab] = useState<'active' | 'bin'>('active');
    const [searchError, setSearchError] = useState('');

    const deletedTasks = binTasks;

    const handleSearchChange = (val: string) => {
        if (val.length > 150) {
            setSearchError('Search must not exceed 150 characters.');
            return;
        }
        setSearchError('');
        setSearchQuery(val);
    };

    const sorted = [...tasks]
        .filter(t =>
            (!filterStatus || t.taskStatus === filterStatus) &&
            (!filterPriority || t.priority === filterPriority) &&
            (!filterEmployee || t.assignedTo === filterEmployee) &&
            (!filterDeadline || (t.dueAt && t.dueAt.startsWith(filterDeadline))) &&
            (!searchQuery || t.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => {
            if (!sortBy) return 0;
            const dir = sortOrder === 'asc' ? 1 : -1;
            switch (sortBy) {
                case 'taskTitle':
                    return dir * a.taskTitle.localeCompare(b.taskTitle);
                case 'deadline':
                    return dir * ((a.dueAt ?? '') > (b.dueAt ?? '') ? 1 : -1);
                case 'priority':
                    return dir * ((PRIORITY_WEIGHTS[a.priority] ?? 0) - (PRIORITY_WEIGHTS[b.priority] ?? 0));
                case 'status':
                    return dir * a.taskStatus.localeCompare(b.taskStatus);
                case 'assignedEmployee':
                    return dir * a.assignedEmployee.localeCompare(b.assignedEmployee);
                default:
                    return 0;
            }
        });

    return (
        <div className="dashboard-content">
            <TableCard
                tabs={[
                    { key: 'active', label: 'Active Tasks', icon: <Package size={14} />, badge: tasks.length },
                    { key: 'bin', label: 'Bin', icon: <Trash2 size={14} />, badge: deletedTasks.length },
                ]}
                activeTab={subTab}
                onTabChange={key => setSubTab(key as 'active' | 'bin')}
                searchQuery={subTab === 'active' ? searchQuery : undefined}
                setSearchQuery={subTab === 'active' ? handleSearchChange : undefined}
                searchPlaceholder="Search tasks..."
                filterElements={subTab === 'active' ? (
                    <>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">All Statuses</option>
                            {TASK_STATUS_FILTERS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                            <option value="">All Priorities</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                        <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
                            <option value="">All Employees</option>
                            {teamMembers.map(m => (
                                <option key={m.accountId} value={m.accountId}>{m.employeeName}</option>
                            ))}
                        </select>
                        <input type="date" value={filterDeadline}
                            onChange={e => setFilterDeadline(e.target.value)}
                            style={{ height: 38, borderRadius: 8, border: '1.5px solid var(--border, #e8ecf4)', padding: '0 12px', fontSize: '0.82rem', fontFamily: 'inherit', background: 'white', color: 'var(--text-primary)', outline: 'none' }} />
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                            style={{ borderLeft: '2px solid var(--border, #e8ecf4)', paddingLeft: 12, borderRadius: 0 }}>
                            <option value="">Sort By</option>
                            <option value="taskTitle">Task Title</option>
                            <option value="deadline">Deadline</option>
                            <option value="priority">Priority Level</option>
                            <option value="status">Status</option>
                            <option value="assignedEmployee">Assigned Employee</option>
                        </select>
                        <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}>
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </>
                ) : (
                    deletedTasks.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(238,93,80,0.06)', border: '1px solid rgba(238,93,80,0.18)', borderRadius: 10, fontSize: 13, color: '#b42318', flex: 1 }}>
                            <Trash2 size={14} />
                            Items in the bin are soft-deleted. You can restore them or empty the bin.
                        </div>
                    ) : undefined
                )}
                actionButton={subTab === 'active' ? {
                    label: 'New Task',
                    icon: <Plus size={14} />,
                    onClick: onNewTask
                } : (
                    deletedTasks.length > 0 ? {
                        label: 'Empty Bin',
                        icon: <Trash2 size={13} />,
                        onClick: onEmptyBin
                    } : undefined
                )}
                headers={subTab === 'bin' ? ['TASK', 'ASSIGNEE', 'PRIORITY', 'DUE DATE', 'ACTIONS'] : undefined}
                loading={loading}
                emptyIcon={subTab === 'bin' ? <Trash2 size={24} /> : <Package size={20} />}
                emptyMessage={subTab === 'bin' ? 'Bin is empty' : 'No matching task records found.'}
            >
                {searchError && (
                    <div style={{ padding: '8px 20px 0' }}>
                        <span style={{ fontSize: 12, color: 'var(--status-failed)' }}>{searchError}</span>
                    </div>
                )}
                {subTab === 'active' ? (
                    <div style={{ padding: '0 20px 20px' }}>
                        {sorted.map(t => (
                            <TaskRow key={t.taskId} task={t} onView={onView} onEdit={onEdit} showEditBtn />
                        ))}
                    </div>
                ) : (
                    deletedTasks.map(t => (
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
                                <ActionsDropdown
                                    actions={[
                                        {
                                            label: 'Restore',
                                            icon: <CheckCircle2 size={12} />,
                                            onClick: () => onRestore(t.taskId),
                                            variant: 'success'
                                        }
                                    ]}
                                />
                            </td>
                        </tr>
                    ))
                )}
            </TableCard>
        </div>
    );
};



// ─── Task Template Tab ─────────────────────────────────────────────────────────

const TemplateTab: React.FC<{ teamMembers: TeamMember[] }> = ({ teamMembers }) => {
    const { success, error } = useToast();
    const [templates, setTemplates] = useState<TaskTemplateDTO[]>(USE_MOCK_TEMPLATES ? [...MOCK_TEMPLATES] : []);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<TaskTemplateDTO | null>(null);

    const fetchTemplates = async () => {
        setLoading(true);
        if (USE_MOCK_TEMPLATES) {
            setTemplates([...MOCK_TEMPLATES]);
            setLoading(false);
            return;
        }
        try {
            const res = await fetch('/api/taskTemplate?pageNumber=1&pageSize=50', {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
            });
            if (!res.ok) throw new Error('Failed to fetch templates.');
            const data = await res.json();
            setTemplates(data.items ?? data.data ?? []);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    const handleToggle = async (templateId: string) => {
        if (USE_MOCK_TEMPLATES) {
            setTemplates(prev => prev.map(t => t.templateId === templateId ? { ...t, templateStatus: t.templateStatus === 'Active' ? 'Inactive' : 'Active' } : t));
            success('Template status toggled successfully.');
            return;
        }
        try {
            const res = await fetch(`/api/taskTemplate/${templateId}/toggle-status`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
            });
            if (!res.ok) throw new Error('Failed to toggle template status.');
            success('Template status toggled successfully.');
            await fetchTemplates();
        } catch (err: any) {
            error(err.message ?? 'Failed to toggle template status.');
        }
    };

    const handleSave = async (data: CreateTemplateDTO, templateId?: string) => {
        if (USE_MOCK_TEMPLATES) {
            if (templateId) {
                setTemplates(prev => prev.map(t => t.templateId === templateId ? {
                    ...t,
                    templateName: data.templateName,
                    templateDescription: data.templateDescription,
                    priorityLevel: data.priorityLevel,
                    recurrenceType: data.recurrenceType,
                    recurrenceStartDate: data.recurrenceStartDate,
                    assignedEmployeeId: data.assignedEmployee,
                    assignedEmployeeName: data.assignedEmployee ? teamMembers.find(m => m.accountId === data.assignedEmployee)?.employeeName ?? null : null,
                    templateStatus: data.templateStatus,
                } : t));
            } else {
                const newTemplate: TaskTemplateDTO = {
                    templateId: `tpl-mock-${Date.now()}`,
                    templateName: data.templateName,
                    templateDescription: data.templateDescription,
                    priorityLevel: data.priorityLevel,
                    recurrenceType: data.recurrenceType,
                    recurrenceStartDate: data.recurrenceStartDate,
                    nextGenerationDate: data.recurrenceStartDate,
                    assignedEmployeeId: data.assignedEmployee,
                    assignedEmployeeName: data.assignedEmployee ? teamMembers.find(m => m.accountId === data.assignedEmployee)?.employeeName ?? null : null,
                    lastGeneratedDate: null,
                    templateStatus: data.templateStatus,
                    createdBy: 'admin',
                    createdByName: 'System Admin',
                    createdAt: new Date().toISOString(),
                };
                setTemplates(prev => [newTemplate, ...prev]);
            }
            setShowModal(false);
            setEditingTemplate(null);
            return;
        }
        if (templateId) {
            const res = await fetch(`/api/taskTemplate/${templateId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` },
                body: JSON.stringify(data),
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to update template.'); }
        } else {
            const res = await fetch('/api/taskTemplate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` },
                body: JSON.stringify(data),
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to create template.'); }
        }
        await fetchTemplates();
        setShowModal(false);
        setEditingTemplate(null);
    };

    const openEdit = (t: TaskTemplateDTO) => {
        setEditingTemplate(t);
        setShowModal(true);
    };

    const fmtTemplateDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    return (
        <div className="dashboard-content">
            <TableCard
                title="Task Templates"
                totalResults={templates.length}
                actionButton={{ label: 'Create Template', icon: <Plus size={14} />, onClick: () => { setEditingTemplate(null); setShowModal(true); } }}
                loading={loading}
                emptyMessage="No task templates found."
                emptyIcon={<Copy size={20} />}
                headers={['TEMPLATE NAME', 'PRIORITY', 'RECURRENCE', 'NEXT GENERATION', 'ASSIGNEE', 'STATUS', 'ACTIONS']}
            >
                {templates.map(t => (
                    <tr key={t.templateId}>
                        <td>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{t.templateName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.templateDescription}</div>
                        </td>
                        <td><PrioBadge p={t.priorityLevel as Priority} /></td>
                        <td>
                            <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Repeat size={12} /> {RECURRENCE_LABELS[t.recurrenceType] ?? t.recurrenceType}
                            </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtTemplateDate(t.nextGenerationDate)}</td>
                        <td style={{ fontSize: 13 }}>{t.assignedEmployeeName || 'Auto-assign'}</td>
                        <td>
                            <span className={`badge ${t.templateStatus === 'Active' ? 'badge-green' : 'badge-gray'}`}>{t.templateStatus}</span>
                        </td>
                        <td>
                            <ActionsDropdown
                                actions={[
                                    { label: 'Edit', icon: <Pencil size={12} />, onClick: () => openEdit(t) },
                                    {
                                        label: t.templateStatus === 'Active' ? 'Deactivate' : 'Activate',
                                        icon: <ToggleLeft size={12} />,
                                        onClick: () => handleToggle(t.templateId),
                                        variant: 'default' as const,
                                    },
                                ]}
                            />
                        </td>
                    </tr>
                ))}
            </TableCard>

            {showModal && (
                <TemplateModal
                    template={editingTemplate}
                    teamMembers={teamMembers}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditingTemplate(null); }}
                />
            )}
        </div>
    );
};

// ─── Template Create/Edit Modal ──────────────────────────────────────────────

interface TemplateModalProps {
    template: TaskTemplateDTO | null;
    teamMembers: TeamMember[];
    onSave: (data: CreateTemplateDTO, templateId?: string) => Promise<void>;
    onClose: () => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ template, teamMembers, onSave, onClose }) => {
    const isEdit = !!template;
    const [form, setForm] = useState({
        templateName: template?.templateName ?? '',
        templateDescription: template?.templateDescription ?? '',
        priorityLevel: template?.priorityLevel ?? 'Medium',
        recurrenceType: template?.recurrenceType ?? 'Daily',
        recurrenceStartDate: template?.recurrenceStartDate ? template.recurrenceStartDate.substring(0, 10) : '',
        assignedEmployee: template?.assignedEmployeeId ?? '',
        templateStatus: template?.templateStatus ?? 'Active',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.templateName.trim()) e.templateName = 'Template name is required.';
        else if (form.templateName.length > 150) e.templateName = 'Must not exceed 150 characters.';
        if (!form.templateDescription.trim()) e.templateDescription = 'Description is required.';
        else if (form.templateDescription.length > 2000) e.templateDescription = 'Must not exceed 2000 characters.';
        if (!form.recurrenceStartDate) e.recurrenceStartDate = 'Start date is required.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        setApiError('');
        try {
            await onSave({
                templateName: form.templateName.trim(),
                templateDescription: form.templateDescription.trim(),
                priorityLevel: form.priorityLevel,
                recurrenceType: form.recurrenceType,
                recurrenceStartDate: form.recurrenceStartDate,
                assignedEmployee: form.assignedEmployee || null,
                templateStatus: form.templateStatus,
            }, template?.templateId);
        } catch (err: any) {
            setApiError(err.message ?? 'Operation failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(p => ({ ...p, [key]: e.target.value }));
        setErrors(p => ({ ...p, [key]: '' }));
    };

    const FieldErr = ({ name }: { name: string }) => errors[name] ? <span className="report-field-error">{errors[name]}</span> : null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3>{isEdit ? 'Edit Task Template' : 'Create Task Template'}</h3>
                        <p className="modal-subtitle" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                            {isEdit ? 'Update the template details below.' : 'Fill in the details to create a recurring task template.'}
                        </p>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={16} /></button>
                </div>

                <div className="modal-form">
                    {apiError && (
                        <div className="report-error-msg" style={{ marginBottom: 14 }}>{apiError}</div>
                    )}

                    <div className="field">
                        <label>Template Name *</label>
                        <input type="text" className={errors.templateName ? 'report-input report-input-error' : 'report-input'}
                            value={form.templateName} onChange={set('templateName')} maxLength={150} placeholder="e.g. Weekly Warehouse Inventory" />
                        <FieldErr name="templateName" />
                    </div>

                    <div className="field">
                        <label>Template Description *</label>
                        <textarea className={errors.templateDescription ? 'report-input report-input-error' : 'report-input'}
                            rows={3} value={form.templateDescription} onChange={set('templateDescription')} maxLength={2000} placeholder="Describe the recurring task..." />
                        <FieldErr name="templateDescription" />
                        <span style={{ fontSize: 11, marginTop: 3, display: 'block', textAlign: 'right', color: 'var(--text-secondary)' }}>{form.templateDescription.length}/2000</span>
                    </div>

                    <div className="field-row">
                        <div className="field">
                            <label>Priority Level</label>
                            <select className="report-select" value={form.priorityLevel} onChange={set('priorityLevel')}>
                                {PRIORITY_LEVELS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="field">
                            <label>Recurrence Type</label>
                            <select className="report-select" value={form.recurrenceType} onChange={set('recurrenceType')}>
                                {RECURRENCE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="field-row">
                        <div className="field">
                            <label>Recurrence Start Date *</label>
                            <input type="date" className={errors.recurrenceStartDate ? 'report-input report-input-error' : 'report-input'}
                                value={form.recurrenceStartDate} onChange={set('recurrenceStartDate')} />
                            <FieldErr name="recurrenceStartDate" />
                        </div>
                        <div className="field">
                            <label>Assigned Employee</label>
                            <select className="report-select" value={form.assignedEmployee} onChange={set('assignedEmployee')}>
                                <option value="">Auto-assign (unassigned)</option>
                                {teamMembers.map(m => <option key={m.accountId} value={m.accountId}>{m.employeeName}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="field">
                        <label>Template Status</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {TEMPLATE_STATUSES.map(s => (
                                <button key={s} type="button"
                                    className={`filter-pill${form.templateStatus === s ? ' active' : ''}`}
                                    onClick={() => { setForm(p => ({ ...p, templateStatus: s })); }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? <><Loader2 size={13} className="spin" /> Saving…</> : <><Save size={13} /> {isEdit ? 'Update Template' : 'Create Template'}</>}
                        </button>
                    </div>
                </div>
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
                    <div className="card-header-layout"><h3>Team Members</h3></div>
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
                    <div className="card-header-layout"><h3>Workload Distribution</h3></div>
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
                <div className="card-header-layout">
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

const ReportsTab: React.FC<{ teamMembers: TeamMember[] }> = ({ teamMembers }) => {
    const { success, error } = useToast();
    const [filter, setFilter] = useState<ReportFilter>({
        dateRangeStart: '',
        dateRangeEnd: '',
        employeeId: '',
        taskPriorityLevel: '',
        taskStatus: '',
        taskCategory: '',
    });
    const [report, setReport] = useState<TaskCompletionReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [noRecords, setNoRecords] = useState(false);
    const [generatedAt, setGeneratedAt] = useState('');
    const [errors, setErrors] = useState<{ dateRangeStart?: string; dateRangeEnd?: string }>({});

    const validate = (): boolean => {
        const e: { dateRangeStart?: string; dateRangeEnd?: string } = {};
        if (!filter.dateRangeStart) e.dateRangeStart = 'Date range start is required.';
        if (!filter.dateRangeEnd) e.dateRangeEnd = 'Date range end is required.';
        if (filter.dateRangeStart && filter.dateRangeEnd && filter.dateRangeEnd < filter.dateRangeStart) {
            e.dateRangeEnd = 'End date must not be earlier than start date.';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleGenerate = async () => {
        if (!validate()) return;
        setLoading(true);
        setFetchError('');
        setNoRecords(false);
        setReport(null);
        try {
            if (USE_MOCK_REPORT) {
                await new Promise(r => setTimeout(r, 600));
                const mockData = mockTaskCompletionReport(filter);
                setReport(mockData);
                setGeneratedAt(new Date().toLocaleString());
                setLoading(false);
                return;
            }

            const params = new URLSearchParams();
            params.set('DateRangeStart', filter.dateRangeStart);
            params.set('DateRangeEnd', filter.dateRangeEnd);
            if (filter.employeeId) params.set('EmployeeId', filter.employeeId);
            if (filter.taskPriorityLevel) params.set('TaskPriorityLevel', filter.taskPriorityLevel);
            if (filter.taskStatus) params.set('TaskStatus', filter.taskStatus);
            if (filter.taskCategory) params.set('TaskCategory', filter.taskCategory);

            const res = await fetch(`/api/reporting/task-completion?${params}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
            });

            if (res.status === 400) {
                setFetchError('Invalid date range selected.');
                setLoading(false);
                return;
            }
            if (!res.ok) {
                setFetchError('Failed to generate report. Please try again.');
                setLoading(false);
                return;
            }

            const data = await res.json();
            if (data.isSuccess && data.data) {
                setReport(data.data);
                setGeneratedAt(new Date().toLocaleString());
            } else {
                setNoRecords(true);
            }
        } catch {
            setFetchError('Failed to generate report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFilter({ dateRangeStart: '', dateRangeEnd: '', employeeId: '', taskPriorityLevel: '', taskStatus: '', taskCategory: '' });
        setReport(null);
        setFetchError('');
        setNoRecords(false);
        setErrors({});
        setGeneratedAt('');
    };

    const exportCSV = () => {
        if (!report) return;
        const rows: string[] = [];
        rows.push('Task Completion Report');
        rows.push(`Generated,${generatedAt}`);
        rows.push('');
        rows.push('Summary');
        rows.push(`Total Tasks Assigned,${report.totalTasksAssigned}`);
        rows.push(`Total Tasks Completed,${report.totalTasksCompleted}`);
        rows.push(`Total Tasks In Progress,${report.totalTasksInProgress}`);
        rows.push(`Total Tasks Pending Review,${report.totalTasksPendingReview}`);
        rows.push(`Total Overdue Tasks,${report.totalOverdueTasks}`);
        rows.push(`Task Completion Rate,${report.taskCompletionRate}%`);
        rows.push(`Avg Completion Time (Hours),${report.averageTaskCompletionTimeHours.toFixed(1)}`);
        rows.push('');
        rows.push('Employee Performance');
        rows.push('Employee,Assigned,Completed,Completion Rate,Avg Time (Hours)');
        for (const ep of report.employeePerformanceSummary) {
            rows.push(`${ep.employeeName},${ep.totalAssigned},${ep.totalCompleted},${ep.completionRate}%,${ep.averageCompletionTimeHours.toFixed(1)}`);
        }
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `task-completion-report-${filter.dateRangeStart}-to-${filter.dateRangeEnd}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        success('CSV exported successfully.');
    };

    const selectClass = (field: keyof typeof errors) =>
        errors[field] ? 'report-select report-select-error' : 'report-select';

    const inputClass = (field: keyof typeof errors) =>
        errors[field] ? 'report-input report-input-error' : 'report-input';

    const statusChartData = report
        ? [
            { name: 'Completed', value: report.totalTasksCompleted, fill: '#05cd99' },
            { name: 'In Progress', value: report.totalTasksInProgress, fill: '#ffb547' },
            { name: 'Pending Review', value: report.totalTasksPendingReview, fill: '#4318ff' },
            { name: 'Overdue', value: report.totalOverdueTasks, fill: '#ee5d50' },
        ].filter(d => d.value > 0)
        : [];

    return (
        <div className="dashboard-content">
            <div className="card report-filter-card">
                <div className="card-header-layout">
                    <h3><FileText size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />Task Completion Reports</h3>
                </div>
                <div className="report-filter-grid">
                    <div className="field">
                        <label>Date Start *</label>
                        <input type="date" className={inputClass('dateRangeStart')}
                            value={filter.dateRangeStart}
                            onChange={e => setFilter(p => ({ ...p, dateRangeStart: e.target.value }))} />
                        {errors.dateRangeStart && <span className="report-field-error">{errors.dateRangeStart}</span>}
                    </div>
                    <div className="field">
                        <label>Date End *</label>
                        <input type="date" className={inputClass('dateRangeEnd')}
                            value={filter.dateRangeEnd}
                            onChange={e => setFilter(p => ({ ...p, dateRangeEnd: e.target.value }))} />
                        {errors.dateRangeEnd && <span className="report-field-error">{errors.dateRangeEnd}</span>}
                    </div>
                    <div className="field">
                        <label>Employee</label>
                        <select className="report-select"
                            value={filter.employeeId}
                            onChange={e => setFilter(p => ({ ...p, employeeId: e.target.value }))}>
                            <option value="">All Employees</option>
                            {teamMembers.map(m => (
                                <option key={m.accountId} value={m.accountId}>{m.employeeName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Priority</label>
                        <select className="report-select"
                            value={filter.taskPriorityLevel}
                            onChange={e => setFilter(p => ({ ...p, taskPriorityLevel: e.target.value }))}>
                            <option value="">All Priorities</option>
                            {PRIORITY_LEVELS.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Status</label>
                        <select className="report-select"
                            value={filter.taskStatus}
                            onChange={e => setFilter(p => ({ ...p, taskStatus: e.target.value }))}>
                            <option value="">All Statuses</option>
                            {TASK_STATUSES_FILTER.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Category</label>
                        <select className="report-select"
                            value={filter.taskCategory}
                            onChange={e => setFilter(p => ({ ...p, taskCategory: e.target.value }))}>
                            <option value="">All Categories</option>
                            {TASK_CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="report-filter-actions">
                    <button className="btn" onClick={handleReset}><RotateCcw size={14} /> Reset</button>
                    <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
                        {loading ? <Loader2 size={14} className="spin" /> : <Filter size={14} />}
                        {' '}{loading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>

            {fetchError && <div className="report-error-msg">{fetchError}</div>}
            {noRecords && <div className="report-empty-state"><FileText size={22} /><p>No records found for selected criteria.</p></div>}

            {report && (
                <>
                    <div className="report-summary-grid">
                        <StatCard icon={<ClipboardList size={20} strokeWidth={2.3} />} variant="primary" label="ASSIGNED" value={String(report.totalTasksAssigned)} subtext="Total tasks" />
                        <StatCard icon={<CheckCircle2 size={20} strokeWidth={2.3} />} variant="success" label="COMPLETED" value={String(report.totalTasksCompleted)} subtext="Tasks finished" />
                        <StatCard icon={<Loader2 size={20} strokeWidth={2.3} />} variant="warning" label="IN PROGRESS" value={String(report.totalTasksInProgress)} subtext="Ongoing" />
                        <StatCard icon={<Eye size={20} strokeWidth={2.3} />} variant="primary" label="PENDING REVIEW" value={String(report.totalTasksPendingReview)} subtext="Awaiting review" />
                        <StatCard icon={<AlertCircle size={20} strokeWidth={2.3} />} variant="danger" label="OVERDUE" value={String(report.totalOverdueTasks)} subtext="Past deadline" />
                        <StatCard icon={<BarChart3 size={20} strokeWidth={2.3} />} variant="success" label="COMPLETION RATE" value={`${report.taskCompletionRate}%`} subtext="Overall rate" />
                        <StatCard icon={<Calendar size={20} strokeWidth={2.3} />} variant="warning" label="AVG TIME" value={`${report.averageTaskCompletionTimeHours.toFixed(1)}h`} subtext="Per task" />
                    </div>

                    <div className="card">
                        <div className="card-header-layout"><h3>Employee Performance Summary</h3></div>
                        {report.employeePerformanceSummary.length === 0 ? (
                            <div className="report-empty-state" style={{ padding: '20px 0' }}><p>No employee data for selected criteria.</p></div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table report-perf-table">
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Assigned</th>
                                            <th>Completed</th>
                                            <th>Rate</th>
                                            <th>Avg Time (h)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.employeePerformanceSummary.map(ep => (
                                            <tr key={ep.employeeName}>
                                                <td style={{ fontWeight: 600 }}>{ep.employeeName}</td>
                                                <td>{ep.totalAssigned}</td>
                                                <td>{ep.totalCompleted}</td>
                                                <td>{ep.completionRate}%</td>
                                                <td>{ep.averageCompletionTimeHours.toFixed(1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div className="card-header-layout"><h3>Task Status Distribution</h3></div>
                        {statusChartData.length === 0 ? (
                            <div className="report-empty-state" style={{ padding: '20px 0' }}><p>No status data available.</p></div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={statusChartData} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e9edf7" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#a3aed0' }} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="report-export-row">
                        <span className="report-generated-badge"><Calendar size={12} /> Report generated at: {generatedAt}</span>
                        <button className="btn btn-primary" onClick={exportCSV}>
                            <Download size={14} /> Export CSV
                        </button>
                    </div>
                </>
            )}
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
            .then(resJson => {
                if (!resJson || !resJson.isSuccess || !resJson.data) return;
                const data = resJson.data;
                const contact = data.contactNumber ?? data.contact ?? data.phoneNumber ?? '';
                const email = data.email ?? '';
                const firstNameVal = data.firstName ?? '';
                const middleNameVal = data.middleName ?? '';
                const lastNameVal = data.lastName ?? '';
                const suffixVal = data.suffix ?? '';

                if (firstNameVal) localStorage.setItem('firstName', firstNameVal);
                if (middleNameVal) localStorage.setItem('middleName', middleNameVal);
                if (lastNameVal) localStorage.setItem('lastName', lastNameVal);
                if (suffixVal) localStorage.setItem('suffix', suffixVal);
                if (contact) localStorage.setItem('contactNumber', contact);
                if (email) localStorage.setItem('email', email);

                setProfileForm(prev => ({
                    ...prev,
                    firstName: firstNameVal || prev.firstName,
                    middleName: middleNameVal || prev.middleName,
                    lastName: lastNameVal || prev.lastName,
                    contactNumber: contact || prev.contactNumber,
                    email: email || prev.email,
                }));
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
                    <div className="card-header-layout">
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
                    <div className="card-header-layout">
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
                <div className="card-header-layout"><h3>Account Overview</h3></div>
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
                    { label: 'TOTAL REQUESTS', value: records.length, icon: <ClipboardList size={20} strokeWidth={2.3} />, variant: 'primary', subtext: 'All submitted' },
                    { label: 'PENDING', value: pendingCount, icon: <AlertCircle size={20} strokeWidth={2.3} />, variant: 'warning', subtext: 'Awaiting review' },
                    { label: 'APPROVED', value: approvedCount, icon: <CheckCircle2 size={20} strokeWidth={2.3} />, variant: 'success', subtext: 'This period' },
                    { label: 'DECLINED', value: declinedCount, icon: <X size={20} strokeWidth={2.3} />, variant: 'danger', subtext: 'Not approved' },
                ].map(s => (
                    <StatCard key={s.label} icon={s.icon} variant={s.variant} label={s.label} value={s.value} subtext={s.subtext} />
                ))}
            </div>

            <TableCard
                title="My Leave History"
                filterElements={
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                }
                loading={loading}
                emptyIcon={<CalendarDays size={26} color="var(--primary)" />}
                emptyMessage={histFilter === 'all' ? 'No leave requests yet' : `No ${histFilter} requests`}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            >
                <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                    {paginatedRecords.map(r => <LeaveRecordCard key={r.id} record={r} />)}
                </div>
            </TableCard>

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

// ─── Modal: Reopen Approval ──────────────────────────────────────────────────

interface ReopenApprovalModalProps {
    request: ReopenRequest;
    onApprove: (requestId: string, remarks: string) => void;
    onReject: (requestId: string, remarks: string) => void;
    onClose: () => void;
}

const ReopenApprovalModal: React.FC<ReopenApprovalModalProps> = ({ request, onApprove, onReject, onClose }) => {
    const [decision, setDecision] = useState<'Approve' | 'Reject' | ''>('');
    const [remarks, setRemarks] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!decision) errs.decision = 'Please select an approval decision.';
        if (!remarks.trim()) errs.remarks = 'Admin remarks are required.';
        else if (remarks.trim().length > 500) errs.remarks = 'Remarks must not exceed 500 characters.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        setSubmitting(true);
        if (decision === 'Approve') {
            onApprove(request.requestId, remarks.trim());
        } else {
            onReject(request.requestId, remarks.trim());
        }
        setSubmitting(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card reopen-approval-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3>Reopen Task Approval</h3>
                        <p className="modal-subtitle">Review and decide on the reopening request.</p>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={16} /></button>
                </div>

                <div className="modal-form">
                    {/* ── Request Info ── */}
                    <div className="reopen-info-grid">
                        <div className="reopen-info-item">
                            <span className="reopen-info-label">Request ID</span>
                            <span className="reopen-info-value">{request.requestId}</span>
                        </div>
                        <div className="reopen-info-item">
                            <span className="reopen-info-label">Task ID</span>
                            <span className="reopen-info-value">{request.taskId}</span>
                        </div>
                        <div className="reopen-info-item">
                            <span className="reopen-info-label">Task Title</span>
                            <span className="reopen-info-value">{request.taskTitle}</span>
                        </div>
                        <div className="reopen-info-item">
                            <span className="reopen-info-label">Employee</span>
                            <span className="reopen-info-value">{request.employeeName}</span>
                        </div>
                        <div className="reopen-info-item">
                            <span className="reopen-info-label">Current Status</span>
                            <span className={`${statusBadgeClass(request.currentStatus)}`} style={{ fontSize: 11 }}>{request.currentStatus}</span>
                        </div>
                        <div className="reopen-info-item">
                            <span className="reopen-info-label">Submitted</span>
                            <span className="reopen-info-value">{fmtDate(request.submittedAt)}</span>
                        </div>
                    </div>

                    {/* ── Reason ── */}
                    <div className="field">
                        <label>Reopening Reason</label>
                        <div className="reopen-reason-box">{request.reason}</div>
                    </div>

                    {/* ── Supporting Evidence ── */}
                    {request.supportingEvidence && (
                        <div className="field">
                            <label>Supporting Evidence</label>
                            <div className="reopen-evidence-box">
                                <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>{request.supportingEvidence}</span>
                            </div>
                        </div>
                    )}

                    {/* ── Decision ── */}
                    <div className="field">
                        <label>Approval Decision <span style={{ color: 'var(--danger, #ee5d50)' }}>*</span></label>
                        <select
                            value={decision}
                            onChange={e => { setDecision(e.target.value as 'Approve' | 'Reject'); setErrors(prev => ({ ...prev, decision: '' })); }}
                            className={errors.decision ? 'input-error' : ''}
                        >
                            <option value="">Select decision</option>
                            <option value="Approve">Approve</option>
                            <option value="Reject">Reject</option>
                        </select>
                        {errors.decision && (
                            <span style={{ fontSize: 11, color: 'var(--danger, #ee5d50)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <AlertCircle size={11} />{errors.decision}
                            </span>
                        )}
                    </div>

                    {/* ── Admin Remarks ── */}
                    <div className="field">
                        <label>Admin Remarks <span style={{ color: 'var(--danger, #ee5d50)' }}>*</span></label>
                        <textarea
                            value={remarks}
                            onChange={e => { setRemarks(e.target.value); setErrors(prev => ({ ...prev, remarks: '' })); }}
                            placeholder="Provide a reason for your decision..."
                            rows={3}
                            className={errors.remarks ? 'input-error' : ''}
                            maxLength={500}
                        />
                        {errors.remarks && (
                            <span style={{ fontSize: 11, color: 'var(--danger, #ee5d50)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <AlertCircle size={11} />{errors.remarks}
                            </span>
                        )}
                        <span style={{ fontSize: 11, marginTop: 3, display: 'block', textAlign: 'right', color: remarks.length > 450 ? (remarks.length >= 500 ? 'var(--danger, #ee5d50)' : '#c05c00') : 'var(--text-secondary)' }}>
                            {remarks.length}/500
                        </span>
                    </div>
                </div>

                <div className="modal-actions">
                    <div style={{ flex: 1 }} />
                    <button className="btn" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !decision}>
                        {submitting
                            ? <><Loader2 size={13} className="spin" /> Submitting…</>
                            : <><ThumbsUp size={13} /> Submit Decision</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Tab: Reopen Requests ─────────────────────────────────────────────────────

const ReopenTab: React.FC<{
    requests: ReopenRequest[];
    onReview: (req: ReopenRequest) => void;
}> = ({ requests, onReview }) => {
    const pending = requests.filter(r => r.status === 'Pending');
    const history = requests.filter(r => r.status !== 'Pending');

    return (
        <div className="dashboard-content">
            {/* Stat cards */}
            <div className="stats-row">
                {[
                    { label: 'PENDING REQUESTS', value: pending.length, icon: <RotateCcw size={20} strokeWidth={2.3} />, variant: 'warning', subtext: 'Awaiting review' },
                    { label: 'APPROVED', value: history.filter(r => r.status === 'Approved').length, icon: <ThumbsUp size={20} strokeWidth={2.3} />, variant: 'success', subtext: 'Task reopened' },
                    { label: 'REJECTED', value: history.filter(r => r.status === 'Rejected').length, icon: <ThumbsDown size={20} strokeWidth={2.3} />, variant: 'danger', subtext: 'Declined requests' },
                    { label: 'TOTAL', value: requests.length, icon: <ClipboardList size={20} strokeWidth={2.3} />, variant: 'primary', subtext: 'All time' },
                ].map(s => (
                    <StatCard key={s.label} icon={s.icon} variant={s.variant} label={s.label} value={s.value} subtext={s.subtext} />
                ))}
            </div>

            {/* Pending Requests */}
            <div className="reopen-section">
                <div className="reopen-section-header">
                    <h3>Pending Reopen Requests</h3>
                    {pending.length > 0 && <span className="badge badge-amber">{pending.length} pending</span>}
                </div>
                {pending.length === 0 ? (
                    <div className="empty-state">
                        <RotateCcw size={24} />
                        <p>No pending reopen requests.</p>
                    </div>
                ) : (
                    <div className="reopen-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>REQUEST ID</th>
                                    <th>TASK</th>
                                    <th>EMPLOYEE</th>
                                    <th>REASON</th>
                                    <th>SUBMITTED</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.map(r => (
                                    <tr key={r.requestId}>
                                        <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.requestId}</td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.taskTitle}</div>
                                        </td>
                                        <td>{r.employeeName}</td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.reason}
                                        </td>
                                        <td style={{ fontSize: 12 }}>{fmtDate(r.submittedAt)}</td>
                                        <td>
                                            <button className="btn btn-primary" onClick={() => onReview(r)} style={{ fontSize: 11, padding: '4px 12px' }}>
                                                <Eye size={12} /> Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* History */}
            {history.length > 0 && (
                <div className="reopen-section">
                    <div className="reopen-section-header">
                        <h3>Request History</h3>
                    </div>
                    <div className="reopen-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>REQUEST ID</th>
                                    <th>TASK</th>
                                    <th>EMPLOYEE</th>
                                    <th>DECISION</th>
                                    <th>REMARKS</th>
                                    <th>REVIEWED</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(r => (
                                    <tr key={r.requestId}>
                                        <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.requestId}</td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.taskTitle}</div>
                                        </td>
                                        <td>{r.employeeName}</td>
                                        <td>
                                            <span className={`badge ${r.status === 'Approved' ? 'badge-green' : 'badge-red'}`}>{r.status}</span>
                                        </td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.adminRemarks || '—'}
                                        </td>
                                        <td style={{ fontSize: 12 }}>{r.reviewedAt ? fmtDate(r.reviewedAt) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
    const { success, error } = useToast();
    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(CONFIRM_CLOSED);

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
    const [overrideTask, setOverrideTask] = useState<Task | null>(null);

    const token = () => localStorage.getItem('authToken');

    // ── Fetch Tasks ──
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [deletedTaskIds, setDeletedTaskIds] = useState<Set<string>>(new Set()); 
    const [binTasks, setBinTasks] = useState<Task[]>([]);

    // Fetch Leave records
    const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
    const [leaveLoading, setLeaveLoading] = useState(false);

    // Reopen Requests state
    const [reopenRequests, setReopenRequests] = useState<ReopenRequest[]>(MOCK_REOPEN_REQUESTS);
    const [reviewingRequest, setReviewingRequest] = useState<ReopenRequest | null>(null);

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

    const handleEmptyBin = () => {
        setConfirmModal({
            isOpen: true,
            variant: 'danger',
            title: 'Empty Trash Bin',
            description: 'Permanently remove all items in the bin? This action cannot be undone.',
            confirmLabel: 'Empty Bin',
            onConfirm: async () => {
                setConfirmModal(CONFIRM_CLOSED);
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
            }
        });
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
        if (USE_MOCK_DATA) {
            // ── Load mock data for smart task routing testing ──
            setAllTasks(MOCK_TASKS);
            setTasks(MOCK_TASKS.filter(t => !t.deleted));
            setTeamMembers(MOCK_TEAM_MEMBERS);
            setLoadingTasks(false);
            console.log('[MOCK] Loaded mock data for smart routing test.');
            console.log('[MOCK] Expected recommendation: Clara Santos (1 active task, Online)');
            console.log('[MOCK] Workload summary:');
            console.log('  Ana Reyes     → 3 active (Online)');
            console.log('  Ben Villanueva→ 2 active (Online)');
            console.log('  Clara Santos  → 1 active (Online) ← SHOULD BE RECOMMENDED');
            console.log('  Franco Mendoza→ 2 active (Online)');
            console.log('  Daniel Cruz   → excluded (Offline)');
            console.log('  Elena Bautista→ excluded (On Leave)');
            return;
        }
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
            .then(resJson => {
                if (!resJson || !resJson.isSuccess || !resJson.data) return;
                const data = resJson.data;
                const contact = data.contactNumber ?? data.contact ?? data.phoneNumber ?? '';
                const email = data.email ?? '';
                const firstNameVal = data.firstName ?? '';
                const middleNameVal = data.middleName ?? '';
                const lastNameVal = data.lastName ?? '';
                const suffixVal = data.suffix ?? '';

                if (firstNameVal) localStorage.setItem('firstName', firstNameVal);
                if (middleNameVal) localStorage.setItem('middleName', middleNameVal);
                if (lastNameVal) localStorage.setItem('lastName', lastNameVal);
                if (suffixVal) localStorage.setItem('suffix', suffixVal);
                if (contact) localStorage.setItem('contactNumber', contact);
                if (email) localStorage.setItem('email', email);

                const fullName = [firstNameVal, middleNameVal, lastNameVal, suffixVal].map(s => (s ?? '').trim()).filter(Boolean).join(' ');
                if (fullName) localStorage.setItem('employeeName', fullName);
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

    // ── Reopen Task (direct admin override) ──
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

    // ── FSM Status Transition ──
    const handleStatusTransition = async (taskId: string, newStatus: TaskStatus) => {
        const task = tasks.find(t => t.taskId === taskId);
        if (!task) { error('Task not found.'); return; }
        if (!isTransitionValid(task.taskStatus, newStatus)) {
            error(`Invalid task status transition: ${task.taskStatus} → ${newStatus}. Status sequence violation detected.`);
            return;
        }
        try {
            const res = await fetch(`/api/task/${taskId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to update task status.');
            }
            await fetchTasks();
            setViewingTask(null);
            success('Task status updated successfully.');
        } catch (err: any) {
            error(err.message ?? 'Invalid task status transition.');
        }
    };

    // ── Admin Override (completed task) ──
    const handleAdminOverride = async (taskId: string, reason: string, remarks: string) => {
        try {
            const res = await fetch(`/api/task/${taskId}/reopen`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({ overrideReason: reason, adminRemarks: remarks }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to process admin override.');
            }
            await fetchTasks();
            setOverrideTask(null);
            success('Administrator override applied · Task reopened · Audit Log entry generated.');
        } catch (err: any) {
            error(err.message ?? 'Administrator override failed.');
        }
    };

    // ── Approve Reopen Request ──
    const handleApproveReopen = async (requestId: string, adminRemarks: string) => {
        setReopenRequests(prev => prev.map(r =>
            r.requestId === requestId
                ? { ...r, status: 'Approved', adminRemarks, reviewedAt: new Date().toISOString() }
                : r
        ));
        const req = reopenRequests.find(r => r.requestId === requestId);
        if (req) {
            try {
                await fetch(`/api/task/${req.taskId}/reopen`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token()}` },
                });
                await fetchTasks();
            } catch { /* non-critical */ }
        }
        setReviewingRequest(null);
        success('Reopening request approved · Task reopened · Task history preserved · Audit Log entry generated.');
    };

    // ── Reject Reopen Request ──
    const handleRejectReopen = async (requestId: string, adminRemarks: string) => {
        setReopenRequests(prev => prev.map(r =>
            r.requestId === requestId
                ? { ...r, status: 'Rejected', adminRemarks, reviewedAt: new Date().toISOString() }
                : r
        ));
        setReviewingRequest(null);
        success('Reopening request rejected · Original task preserved · Audit Log entry generated.');
    };

    const handleDeleteTask = (taskId: string) => {
        setConfirmModal({
            isOpen: true,
            variant: 'danger',
            title: 'Delete Task',
            description: 'Delete this task? This cannot be undone.',
            confirmLabel: 'Delete',
            cancelLabel: 'Keep',
            onConfirm: async () => {
                setConfirmModal(CONFIRM_CLOSED);
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
            }
        });
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
        reopen: 'Reopen Requests',
        templates: 'Task Templates',
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
                <DashboardHeader
                    title={pageTitles[activeTab]}
                    notificationApi="/api/notification/my-notifications"
                    userInitials={getInitials(employeeName || 'Operation Admin')}
                    onSettingsClick={() => setActiveTab('profile')}
                    onLogout={handleLogout}
                >
                    {activeTab !== 'profile' && activeTab !== 'leave' && activeTab !== 'tasks' && activeTab !== 'reopen' && (
                        <>
                            <div className="header-search">
                                <Search size={15} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <ActionButton icon={<Plus size={18} />} onClick={() => setShowNew(true)}>
                                New Task
                            </ActionButton>
                        </>
                    )}
                </DashboardHeader>

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
                        teamMembers={teamMembers}
                        loading={loadingTasks}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onView={id => setDetailTask(tasks.find(t => t.taskId === id) ?? null)}
                        onEdit={id => setEditingTask(tasks.find(t => t.taskId === id) ?? null)}
                        onRestore={handleRestoreTask}
                        onEmptyBin={handleEmptyBin}
                        onNewTask={() => setShowNew(true)}
                    />
                )}
                {activeTab === 'team' && (
                    <TeamTab
                        tasks={tasks}
                        teamMembers={teamMembers}
                        onView={id => setViewingTask(tasks.find(t => t.taskId === id) ?? null)}
                    />
                )}
                {activeTab === 'templates' && <TemplateTab teamMembers={teamMembers} />}
                {activeTab === 'reports' && <ReportsTab teamMembers={teamMembers} />}
                {activeTab === 'profile' && <ProfileTab />}
                {activeTab === 'leave' && (
                    <LeaveTab
                        records={leaveRecords}
                        loading={leaveLoading}
                        onNewRecord={record => setLeaveRecords(prev => [record, ...prev])}
                    />
                )}
                {activeTab === 'reopen' && (
                    <ReopenTab
                        requests={reopenRequests}
                        onReview={req => setReviewingRequest(req)}
                    />
                )}
            </main>

            {/* ── Modals ── */}
            {showNew && (
                <TaskModal
                    mode="new"
                    teamMembers={teamMembers}
                    tasks={tasks}
                    onSave={data => handleNewTask(data as CreateTaskDTO)}
                    onClose={() => setShowNew(false)}
                    showSuccess={success}
                />
            )}
            {editingTask && (
                <TaskModal
                    mode="edit"
                    initial={editingTask}
                    teamMembers={teamMembers}
                    tasks={tasks}
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
                    onStatusChange={(id, status) => handleStatusTransition(id, status)}
                    onAdminOverride={(id) => setOverrideTask(tasks.find(t => t.taskId === id) ?? null)}
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
            {overrideTask && (
                <AdminOverrideModal
                    task={overrideTask}
                    onSubmit={(reason, remarks) => handleAdminOverride(overrideTask.taskId, reason, remarks)}
                    onClose={() => setOverrideTask(null)}
                />
            )}
            {reviewingRequest && (
                <ReopenApprovalModal
                    request={reviewingRequest}
                    onApprove={handleApproveReopen}
                    onReject={handleRejectReopen}
                    onClose={() => setReviewingRequest(null)}
                />
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                variant={confirmModal.variant}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmLabel={confirmModal.confirmLabel}
                cancelLabel={confirmModal.cancelLabel}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(CONFIRM_CLOSED)}
            />
        </div>
    );
}