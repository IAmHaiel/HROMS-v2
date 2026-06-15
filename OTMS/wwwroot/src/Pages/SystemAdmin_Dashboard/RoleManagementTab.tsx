import React, { useEffect, useState } from 'react';
import {
    Shield,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    Info,
    Settings,
    Key,
    Building2,
    Briefcase,
    ToggleLeft,
    ToggleRight,
    Users,
    CheckCircle2,
    XCircle,
    BarChart2,
    Clock,
    RefreshCw,
    TrendingUp,
    Activity,
    Lock,
} from 'lucide-react';
import { useToast } from '../../components/Toast/Toast';
import StatCard from '../../components/StatCard/StatCard';
import { TableCard, ActionsDropdown } from '../../components/TableCard/TableCard';
import FormModal from '../../components/FormModal/FormModal';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import './RoleManagementTab.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubTab = 'roles' | 'departments' | 'positions' | 'overview';

// ── Audit / Activity ──
export interface OrgAuditEntry {
    id: string;
    action: string;          // e.g. "Department Created"
    entityType: 'Department' | 'JobPosition' | 'Role';
    entityName: string;
    performedBy: string;
    performedAt: string;     // ISO date string
    details?: string;
}

// ── Roles ──
export interface RoleResponseDTO {
    roleId: string;
    name: string;
    description?: string;
    isSystemDefined: boolean;
    permissions: string[];
}
export interface PermissionResponseDTO {
    permissionId: string;
    name: string;
    description?: string;
}
export interface CreateRoleDTO { name: string; description?: string; permissions: string[]; }
export interface UpdateRoleDTO { description?: string; permissions: string[]; }

// ── Departments ──
export interface DepartmentResponseDTO {
    departmentId: string;
    name: string;
    description?: string;
    // Future fields (handled gracefully when backend adds them):
    code?: string;
    isActive?: boolean;
    employeeCount?: number;
    createdAt?: string;
}
export interface CreateDepartmentDTO { name: string; description?: string; code?: string; isActive?: boolean; }

// ── Job Positions ──
export interface JobPositionResponseDTO {
    jobPositionId: string;
    name: string;
    description?: string;
    departmentId: string;
    departmentName: string;
    // Future fields:
    code?: string;
    isActive?: boolean;
    employeeCount?: number;
    reportsToId?: string;
    reportsToName?: string;
    createdAt?: string;
}
export interface CreateJobPositionDTO {
    name: string;
    description?: string;
    departmentId: string;
    code?: string;
    isActive?: boolean;
    reportsToId?: string;
}

// ── Shared ──
interface ConfirmState {
    isOpen: boolean;
    variant: 'danger' | 'warning' | 'info' | 'success' | 'neutral';
    icon?: string;
    title: string;
    description: React.ReactNode;
    notice?: string;
    confirmLabel?: string;
    onConfirm: () => void;
}
const CONFIRM_CLOSED: ConfirmState = { isOpen: false, variant: 'neutral', title: '', description: '', onConfirm: () => {} };

// ─── Permission Helpers ───────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
    SystemAdmin: 'System Administration', Users: 'User Management',
    Roles: 'Role Management', Departments: 'Department Management',
    JobPositions: 'Job Position Management', Tasks: 'Task Management',
};
function formatCategory(cat: string) { return CATEGORY_LABELS[cat] || cat.replace(/([A-Z])/g, ' $1').trim(); }
function groupPermissions(perms: PermissionResponseDTO[]): Record<string, PermissionResponseDTO[]> {
    const g: Record<string, PermissionResponseDTO[]> = {};
    perms.forEach(p => { const cat = p.name.split('.').length > 2 ? p.name.split('.')[1] : 'General'; if (!g[cat]) g[cat] = []; g[cat].push(p); });
    return g;
}
function getFriendlyName(name: string) { const p = name.split('.'); return p.length > 2 ? p.slice(2).join(' ').replace(/([A-Z])/g, ' $1').trim() : name; }
function togglePerm(set: Set<string>, name: string) { const n = new Set(set); n.has(name) ? n.delete(name) : n.add(name); return n; }
function toggleCat(set: Set<string>, perms: PermissionResponseDTO[], add: boolean) { const n = new Set(set); perms.forEach(p => (add ? n.add(p.name) : n.delete(p.name))); return n; }

// ─── SVG Donut Chart ─────────────────────────────────────────────────────────

const DONUT_COLORS = ['#00A99D', '#4318FF', '#FFB547', '#E31A1A', '#01B574', '#7551FF', '#3965FF', '#F59E0B'];

const DonutChart: React.FC<{ slices: { label: string; value: number }[]; total: number }> = ({ slices, total }) => {
    const r = 52; const circ = 2 * Math.PI * r;
    let offset = 0;
    const segments = slices.map((s, i) => {
        const pct = total > 0 ? s.value / total : 0;
        const dash = pct * circ;
        const seg = { color: DONUT_COLORS[i % DONUT_COLORS.length], dash, offset: -offset, pct };
        offset += dash;
        return seg;
    });
    return (
        <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
            {segments.map((seg, i) => seg.dash > 0 && (
                <circle key={i} cx="65" cy="65" r={r} fill="none"
                    stroke={seg.color} strokeWidth="14"
                    strokeDasharray={`${seg.dash} ${circ}`}
                    strokeDashoffset={seg.offset}
                    transform="rotate(-90 65 65)" />
            ))}
            <text x="65" y="61" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1B254B">{total}</text>
            <text x="65" y="77" textAnchor="middle" fontSize="9" fill="#A3AED0">Total</text>
        </svg>
    );
};

// ─── Audit Entry Row ──────────────────────────────────────────────────────────

const AUDIT_ICON_MAP: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
    Created:     { icon: <Plus size={11} />,    bg: '#dcfce7', color: '#16a34a' },
    Updated:     { icon: <Pencil size={11} />,  bg: '#dbeafe', color: '#2563eb' },
    Deleted:     { icon: <Trash2 size={11} />,  bg: '#fee2e2', color: '#dc2626' },
    Activated:   { icon: <CheckCircle2 size={11} />, bg: '#d1fae5', color: '#059669' },
    Deactivated: { icon: <XCircle size={11} />, bg: '#fef3c7', color: '#d97706' },
    Default:     { icon: <Activity size={11} />, bg: '#ede9fe', color: '#7c3aed' },
};

function getAuditStyle(action: string) {
    const key = Object.keys(AUDIT_ICON_MAP).find(k => action.includes(k)) ?? 'Default';
    return AUDIT_ICON_MAP[key];
}

function formatRelativeTime(isoString: string): string {
    try {
        const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return new Date(isoString).toLocaleDateString();
    } catch { return isoString; }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const RoleTypeBadge = ({ isSystem }: { isSystem: boolean }) => (
    <span className={`rm2-type-badge ${isSystem ? 'rm2-type-badge--system' : 'rm2-type-badge--custom'}`}>
        {isSystem ? 'System' : 'Custom'}
    </span>
);

const StatusBadge = ({ isActive = true }: { isActive?: boolean }) => (
    <span className={`rm2-status-badge ${isActive ? 'rm2-status-badge--active' : 'rm2-status-badge--inactive'}`}>
        {isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
        {isActive ? 'Active' : 'Inactive'}
    </span>
);

interface PermSelectorProps {
    grouped: Record<string, PermissionResponseDTO[]>;
    selected: Set<string>;
    setSelected: (s: Set<string>) => void;
    disabled?: boolean;
}
const PermissionSelector: React.FC<PermSelectorProps> = ({ grouped, selected, setSelected, disabled }) => (
    <div className="rm2-perm-selector">
        <div className="rm2-perm-selector__header">
            <span className="rm2-form-label">Assign Permissions</span>
            <span className="rm2-perm-count">{selected.size} selected</span>
        </div>
        <div className="rm2-perm-groups">
            {Object.entries(grouped).map(([cat, perms]) => {
                const allSel = perms.every(p => selected.has(p.name));
                const someSel = perms.some(p => selected.has(p.name)) && !allSel;
                return (
                    <div key={cat} className="rm2-perm-group">
                        <label className="rm2-perm-category">
                            <input type="checkbox" checked={allSel} disabled={disabled}
                                ref={el => { if (el) el.indeterminate = someSel; }}
                                onChange={e => setSelected(toggleCat(selected, perms, e.target.checked))} />
                            <span>{formatCategory(cat)}</span>
                        </label>
                        <div className="rm2-perm-items">
                            {perms.map(perm => (
                                <label key={perm.permissionId} className="rm2-perm-item" title={perm.description}>
                                    <input type="checkbox" checked={selected.has(perm.name)} disabled={disabled}
                                        onChange={() => setSelected(togglePerm(selected, perm.name))} />
                                    <div className="rm2-perm-item__info">
                                        <span className="rm2-perm-item__name">{getFriendlyName(perm.name)}</span>
                                        {perm.description && <span className="rm2-perm-item__desc">{perm.description}</span>}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })}
            {Object.keys(grouped).length === 0 && <p className="rm2-perm-empty">No permissions available.</p>}
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const PER_PAGE = 10;

export default function RoleManagementTab() {
    const { success: toastSuccess, error: toastError } = useToast();
    const [subTab, setSubTab] = useState<SubTab>('roles');

    // ── Loading states ──
    const [rolesLoading, setRolesLoading] = useState(true);
    const [deptsLoading, setDeptsLoading] = useState(false);
    const [posLoading, setPosLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // ── Data ──
    const [roles, setRoles] = useState<RoleResponseDTO[]>([]);
    const [permissions, setPermissions] = useState<PermissionResponseDTO[]>([]);
    const [departments, setDepartments] = useState<DepartmentResponseDTO[]>([]);
    const [positions, setPositions] = useState<JobPositionResponseDTO[]>([]);

    // ── Search / page ──
    const [roleSearch, setRoleSearch] = useState(''); const [rolePage, setRolePage] = useState(1);
    const [deptSearch, setDeptSearch] = useState(''); const [deptPage, setDeptPage] = useState(1);
    const [posSearch, setPosSearch] = useState('');  const [posPage, setPosPage] = useState(1);

    // ── Modals ──
    const [confirmModal, setConfirmModal] = useState<ConfirmState>(CONFIRM_CLOSED);

    // Role form
    const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleResponseDTO | null>(null);
    const [createRoleName, setCreateRoleName] = useState('');
    const [createRoleDesc, setCreateRoleDesc] = useState('');
    const [createRolePerms, setCreateRolePerms] = useState<Set<string>>(new Set());
    const [createRoleErrors, setCreateRoleErrors] = useState<Record<string, string>>({});
    const [editRoleDesc, setEditRoleDesc] = useState('');
    const [editRolePerms, setEditRolePerms] = useState<Set<string>>(new Set());
    const [editRoleError, setEditRoleError] = useState('');

    // Dept form
    const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<DepartmentResponseDTO | null>(null);
    const [deptForm, setDeptForm] = useState({ name: '', description: '', code: '', isActive: true });
    const [deptFormErrors, setDeptFormErrors] = useState<Record<string, string>>({});

    // Position form
    const [isCreatePosOpen, setIsCreatePosOpen] = useState(false);
    const [editingPos, setEditingPos] = useState<JobPositionResponseDTO | null>(null);
    const [posForm, setPosForm] = useState({ name: '', description: '', code: '', departmentId: '', isActive: true, reportsToId: '' });
    const [posFormErrors, setPosFormErrors] = useState<Record<string, string>>({});

    // Audit / Activity Log
    const [auditEntries, setAuditEntries] = useState<OrgAuditEntry[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);

    const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}`, 'Content-Type': 'application/json' });

    // ─────────────────────────── Fetch Functions ──────────────────────────────

    const fetchRoles = async () => {
        setRolesLoading(true);
        try {
            const [rRes, pRes] = await Promise.all([
                fetch('/api/roles', { headers: authHeaders() }),
                fetch('/api/roles/permissions', { headers: authHeaders() }),
            ]);
            if (!rRes.ok) throw new Error(`Failed to fetch roles`);
            if (!pRes.ok) throw new Error(`Failed to fetch permissions`);
            const rd = await rRes.json(); const pd = await pRes.json();
            const normalize = (d: any): RoleResponseDTO => ({
                roleId: d.roleId ?? d.RoleId, name: d.name ?? d.Name,
                description: d.description ?? d.Description,
                isSystemDefined: d.isSystemDefined ?? d.IsSystemDefined ?? false,
                permissions: d.permissions ?? d.Permissions ?? [],
            });
            setRoles((Array.isArray(rd) ? rd : rd.data ?? rd.$values ?? []).map(normalize));
            setPermissions((Array.isArray(pd) ? pd : pd.data ?? pd.$values ?? []).map((p: any) => ({
                permissionId: p.permissionId ?? p.PermissionId,
                name: p.name ?? p.Name, description: p.description ?? p.Description,
            })));
        } catch (e: any) { toastError(e.message || 'Failed to load roles'); } finally { setRolesLoading(false); }
    };

    const fetchDepartments = async () => {
        setDeptsLoading(true);
        try {
            const res = await fetch('/api/organization/departments', { headers: authHeaders() });
            if (!res.ok) throw new Error(`Failed to fetch departments`);
            const data = await res.json();
            const normalize = (d: any): DepartmentResponseDTO => ({
                departmentId: d.departmentId ?? d.DepartmentId,
                name: d.name ?? d.Name, description: d.description ?? d.Description,
                code: d.code ?? d.Code ?? '', isActive: d.isActive ?? d.IsActive ?? true,
                employeeCount: d.employeeCount ?? d.EmployeeCount ?? 0,
                createdAt: d.createdAt ?? d.CreatedAt,
            });
            setDepartments((Array.isArray(data) ? data : data.data ?? data.$values ?? []).map(normalize));
        } catch (e: any) { toastError(e.message || 'Failed to load departments'); } finally { setDeptsLoading(false); }
    };

    const fetchPositions = async () => {
        setPosLoading(true);
        try {
            const res = await fetch('/api/organization/job-positions', { headers: authHeaders() });
            if (!res.ok) throw new Error(`Failed to fetch positions`);
            const data = await res.json();
            const normalize = (p: any): JobPositionResponseDTO => ({
                jobPositionId: p.jobPositionId ?? p.JobPositionId,
                name: p.name ?? p.Name, description: p.description ?? p.Description,
                departmentId: p.departmentId ?? p.DepartmentId,
                departmentName: p.departmentName ?? p.DepartmentName ?? '',
                code: p.code ?? p.Code ?? '', isActive: p.isActive ?? p.IsActive ?? true,
                employeeCount: p.employeeCount ?? p.EmployeeCount ?? 0,
                reportsToId: p.reportsToId ?? p.ReportsToId ?? '',
                reportsToName: p.reportsToName ?? p.ReportsToName ?? '',
                createdAt: p.createdAt ?? p.CreatedAt,
            });
            setPositions((Array.isArray(data) ? data : data.data ?? data.$values ?? []).map(normalize));
        } catch (e: any) { toastError(e.message || 'Failed to load job positions'); } finally { setPosLoading(false); }
    };

    // Fetch audit log (wired to /api/activity-logs?module=organization when backend supports filtering)
    // Falls back to empty list gracefully until backend implements it.
    const fetchAuditLog = async () => {
        setAuditLoading(true);
        try {
            const res = await fetch('/api/activity-logs?module=organization&limit=20', { headers: authHeaders() });
            if (!res.ok) { setAuditEntries([]); return; }
            const data = await res.json();
            const raw: any[] = Array.isArray(data) ? data : data.data ?? data.$values ?? data.items ?? [];
            setAuditEntries(raw.map((e: any): OrgAuditEntry => ({
                id: e.id ?? e.activityLogId ?? e.ActivityLogId ?? String(Math.random()),
                action: e.action ?? e.Action ?? e.description ?? e.Description ?? 'Activity',
                entityType: e.entityType ?? e.EntityType ?? 'Department',
                entityName: e.entityName ?? e.EntityName ?? e.targetName ?? '',
                performedBy: e.performedBy ?? e.PerformedBy ?? e.actorName ?? e.ActorName ?? 'System',
                performedAt: e.performedAt ?? e.PerformedAt ?? e.createdAt ?? e.CreatedAt ?? new Date().toISOString(),
                details: e.details ?? e.Details,
            })));
        } catch { setAuditEntries([]); } finally { setAuditLoading(false); }
    };

    useEffect(() => { fetchRoles(); }, []);
    useEffect(() => { if (subTab === 'departments' && departments.length === 0) fetchDepartments(); }, [subTab]);
    useEffect(() => {
        if (subTab === 'positions') {
            if (positions.length === 0) fetchPositions();
            if (departments.length === 0) fetchDepartments();
        }
    }, [subTab]);
    useEffect(() => {
        if (subTab === 'overview') {
            if (departments.length === 0) fetchDepartments();
            if (positions.length === 0) fetchPositions();
            fetchAuditLog();
        }
    }, [subTab]);


    // ─── Derived Data ─────────────────────────────────────────────────────────

    const grouped = groupPermissions(permissions);

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(roleSearch.toLowerCase()));
    const roleTotalPages = Math.max(1, Math.ceil(filteredRoles.length / PER_PAGE));
    const pagedRoles = filteredRoles.slice((rolePage - 1) * PER_PAGE, rolePage * PER_PAGE);

    const filteredDepts = departments.filter(d =>
        d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
        (d.code || '').toLowerCase().includes(deptSearch.toLowerCase()) ||
        (d.description || '').toLowerCase().includes(deptSearch.toLowerCase()));
    const deptTotalPages = Math.max(1, Math.ceil(filteredDepts.length / PER_PAGE));
    const pagedDepts = filteredDepts.slice((deptPage - 1) * PER_PAGE, deptPage * PER_PAGE);

    const filteredPos = positions.filter(p =>
        p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
        (p.code || '').toLowerCase().includes(posSearch.toLowerCase()) ||
        p.departmentName.toLowerCase().includes(posSearch.toLowerCase()));
    const posTotalPages = Math.max(1, Math.ceil(filteredPos.length / PER_PAGE));
    const pagedPos = filteredPos.slice((posPage - 1) * PER_PAGE, posPage * PER_PAGE);

    // ─── Role Actions ─────────────────────────────────────────────────────────

    const openCreateRole = () => {
        setCreateRoleName(''); setCreateRoleDesc(''); setCreateRolePerms(new Set()); setCreateRoleErrors({});
        setIsCreateRoleOpen(true);
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};
        if (!createRoleName.trim()) errors.name = 'Role name is required.';
        else if (!/^[a-zA-Z0-9_ -]{3,50}$/.test(createRoleName.trim()))
            errors.name = 'Role name must be 3–50 characters (letters, numbers, spaces, underscores, dashes).';
        if (Object.keys(errors).length) { setCreateRoleErrors(errors); return; }
        setActionLoading(true);
        try {
            const res = await fetch('/api/roles', {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ name: createRoleName.trim(), description: createRoleDesc.trim() || undefined, permissions: Array.from(createRolePerms) }),
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to create role.'); }
            toastSuccess('Role created successfully!');
            setIsCreateRoleOpen(false); fetchRoles();
        } catch (e: any) { toastError(e.message); setCreateRoleErrors({ api: e.message }); } finally { setActionLoading(false); }
    };

    const openEditRole = (role: RoleResponseDTO) => {
        setEditingRole(role); setEditRoleDesc(role.description || ''); setEditRolePerms(new Set(role.permissions)); setEditRoleError('');
    };

    const handleEditRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/roles/${editingRole.roleId}`, {
                method: 'PUT', headers: authHeaders(),
                body: JSON.stringify({ description: editRoleDesc.trim() || undefined, permissions: Array.from(editRolePerms) }),
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to update role.'); }
            toastSuccess('Role updated successfully!');
            setEditingRole(null); fetchRoles();
        } catch (e: any) { toastError(e.message); setEditRoleError(e.message); } finally { setActionLoading(false); }
    };

    const confirmDeleteRole = (role: RoleResponseDTO) => {
        setConfirmModal({
            isOpen: true, variant: 'danger', icon: 'ti-trash',
            title: `Delete Role: ${role.name}?`,
            description: (<>Permanently delete role <strong>{role.name}</strong>? This cannot be undone.</>),
            notice: 'Accounts currently assigned to this role must be reassigned first.',
            confirmLabel: 'Delete Role',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    const res = await fetch(`/api/roles/${role.roleId}`, { method: 'DELETE', headers: authHeaders() });
                    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed.'); }
                    toastSuccess('Role deleted.'); setConfirmModal(CONFIRM_CLOSED); fetchRoles();
                } catch (e: any) { toastError(e.message); setConfirmModal(CONFIRM_CLOSED); } finally { setActionLoading(false); }
            },
        });
    };

    // ─── Department Actions ───────────────────────────────────────────────────

    const openCreateDept = () => {
        setDeptForm({ name: '', description: '', code: '', isActive: true }); setDeptFormErrors({});
        setIsCreateDeptOpen(true);
    };

    const validateDeptForm = () => {
        const errors: Record<string, string> = {};
        if (!deptForm.name.trim()) errors.name = 'Department name is required.';
        else if (deptForm.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
        else {
            const existing = departments.find(d =>
                d.name.toLowerCase() === deptForm.name.trim().toLowerCase() &&
                d.departmentId !== (editingDept?.departmentId ?? ''));
            if (existing) errors.name = 'A department with this name already exists.';
        }
        if (deptForm.code.trim()) {
            const codeExists = departments.find(d =>
                (d.code || '').toLowerCase() === deptForm.code.trim().toLowerCase() &&
                d.departmentId !== (editingDept?.departmentId ?? ''));
            if (codeExists) errors.code = 'This department code is already in use.';
        }
        return errors;
    };

    const handleCreateDept = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validateDeptForm();
        if (Object.keys(errors).length) { setDeptFormErrors(errors); return; }
        setActionLoading(true);
        try {
            const payload: CreateDepartmentDTO = {
                name: deptForm.name.trim(), description: deptForm.description.trim() || undefined,
                code: deptForm.code.trim() || undefined, isActive: deptForm.isActive,
            };
            const res = await fetch('/api/organization/departments', { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to create department.'); }
            toastSuccess('Department created successfully!');
            setIsCreateDeptOpen(false); fetchDepartments();
        } catch (e: any) { toastError(e.message); setDeptFormErrors({ api: e.message }); } finally { setActionLoading(false); }
    };

    const openEditDept = (dept: DepartmentResponseDTO) => {
        setEditingDept(dept);
        setDeptForm({ name: dept.name, description: dept.description || '', code: dept.code || '', isActive: dept.isActive ?? true });
        setDeptFormErrors({});
    };

    const handleEditDept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDept) return;
        const errors = validateDeptForm();
        if (Object.keys(errors).length) { setDeptFormErrors(errors); return; }
        setActionLoading(true);
        try {
            const payload: CreateDepartmentDTO = {
                name: deptForm.name.trim(), description: deptForm.description.trim() || undefined,
                code: deptForm.code.trim() || undefined, isActive: deptForm.isActive,
            };
            const res = await fetch(`/api/organization/departments/${editingDept.departmentId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to update department.'); }
            toastSuccess('Department updated successfully!');
            setEditingDept(null); fetchDepartments();
        } catch (e: any) { toastError(e.message); setDeptFormErrors({ api: e.message }); } finally { setActionLoading(false); }
    };

    const confirmToggleDeptStatus = (dept: DepartmentResponseDTO) => {
        const activate = !(dept.isActive ?? true);
        setConfirmModal({
            isOpen: true, variant: activate ? 'success' : 'warning',
            icon: activate ? 'ti-check' : 'ti-alert-triangle',
            title: `${activate ? 'Activate' : 'Deactivate'} Department?`,
            description: (<>Are you sure you want to <strong>{activate ? 'activate' : 'deactivate'}</strong> the department <strong>{dept.name}</strong>?</>),
            notice: !activate ? 'Deactivated departments will not be available for new employee assignments.' : undefined,
            confirmLabel: activate ? 'Activate' : 'Deactivate',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    // Try PATCH toggle-status endpoint; if not available, use PUT with toggled isActive
                    const patchRes = await fetch(`/api/organization/departments/${dept.departmentId}/toggle-status`, { method: 'PATCH', headers: authHeaders() });
                    if (!patchRes.ok) {
                        // Fallback: PUT with toggled isActive
                        const putRes = await fetch(`/api/organization/departments/${dept.departmentId}`, {
                            method: 'PUT', headers: authHeaders(),
                            body: JSON.stringify({ name: dept.name, description: dept.description, code: dept.code, isActive: activate }),
                        });
                        if (!putRes.ok) { const e = await putRes.json().catch(() => ({})); throw new Error(e.message || 'Failed to update status.'); }
                    }
                    toastSuccess(`Department ${activate ? 'activated' : 'deactivated'}.`);
                    setConfirmModal(CONFIRM_CLOSED); fetchDepartments();
                } catch (e: any) { toastError(e.message); setConfirmModal(CONFIRM_CLOSED); } finally { setActionLoading(false); }
            },
        });
    };

    const confirmDeleteDept = (dept: DepartmentResponseDTO) => {
        const empCount = dept.employeeCount ?? 0;
        setConfirmModal({
            isOpen: true, variant: 'danger', icon: 'ti-trash',
            title: `Delete Department: ${dept.name}?`,
            description: (<>Permanently delete department <strong>{dept.name}</strong>? This cannot be undone.</>),
            notice: empCount > 0
                ? `This department has ${empCount} active employee(s). Reassign them before deleting.`
                : 'All associated job positions will also be removed.',
            confirmLabel: empCount > 0 ? undefined : 'Delete Department',
            onConfirm: empCount > 0 ? () => setConfirmModal(CONFIRM_CLOSED) : async () => {
                setActionLoading(true);
                try {
                    const res = await fetch(`/api/organization/departments/${dept.departmentId}`, { method: 'DELETE', headers: authHeaders() });
                    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to delete department.'); }
                    toastSuccess('Department deleted.'); setConfirmModal(CONFIRM_CLOSED); fetchDepartments();
                } catch (e: any) { toastError(e.message); setConfirmModal(CONFIRM_CLOSED); } finally { setActionLoading(false); }
            },
        });
    };

    // ─── Position Actions ─────────────────────────────────────────────────────

    const openCreatePos = () => {
        setPosForm({ name: '', description: '', code: '', departmentId: '', isActive: true, reportsToId: '' });
        setPosFormErrors({}); setIsCreatePosOpen(true);
    };

    const validatePosForm = () => {
        const errors: Record<string, string> = {};
        if (!posForm.name.trim()) errors.name = 'Position name is required.';
        else {
            const existing = positions.find(p =>
                p.name.toLowerCase() === posForm.name.trim().toLowerCase() &&
                p.departmentId === posForm.departmentId &&
                p.jobPositionId !== (editingPos?.jobPositionId ?? ''));
            if (existing) errors.name = 'A position with this name already exists in this department.';
        }
        if (!posForm.departmentId) errors.departmentId = 'Department is required.';
        if (posForm.code.trim()) {
            const codeExists = positions.find(p =>
                (p.code || '').toLowerCase() === posForm.code.trim().toLowerCase() &&
                p.jobPositionId !== (editingPos?.jobPositionId ?? ''));
            if (codeExists) errors.code = 'This position code is already in use.';
        }
        return errors;
    };

    const handleCreatePos = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validatePosForm();
        if (Object.keys(errors).length) { setPosFormErrors(errors); return; }
        setActionLoading(true);
        try {
            const payload: CreateJobPositionDTO = {
                name: posForm.name.trim(), description: posForm.description.trim() || undefined,
                departmentId: posForm.departmentId, code: posForm.code.trim() || undefined,
                isActive: posForm.isActive, reportsToId: posForm.reportsToId || undefined,
            };
            const res = await fetch('/api/organization/job-positions', { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to create position.'); }
            toastSuccess('Position created successfully!');
            setIsCreatePosOpen(false); fetchPositions();
        } catch (e: any) { toastError(e.message); setPosFormErrors({ api: e.message }); } finally { setActionLoading(false); }
    };

    const openEditPos = (pos: JobPositionResponseDTO) => {
        setEditingPos(pos);
        setPosForm({ name: pos.name, description: pos.description || '', code: pos.code || '', departmentId: pos.departmentId, isActive: pos.isActive ?? true, reportsToId: pos.reportsToId || '' });
        setPosFormErrors({});
    };

    const handleEditPos = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPos) return;
        const errors = validatePosForm();
        if (Object.keys(errors).length) { setPosFormErrors(errors); return; }
        setActionLoading(true);
        try {
            const payload: CreateJobPositionDTO = {
                name: posForm.name.trim(), description: posForm.description.trim() || undefined,
                departmentId: posForm.departmentId, code: posForm.code.trim() || undefined,
                isActive: posForm.isActive, reportsToId: posForm.reportsToId || undefined,
            };
            const res = await fetch(`/api/organization/job-positions/${editingPos.jobPositionId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to update position.'); }
            toastSuccess('Position updated successfully!');
            setEditingPos(null); fetchPositions();
        } catch (e: any) { toastError(e.message); setPosFormErrors({ api: e.message }); } finally { setActionLoading(false); }
    };

    const confirmTogglePosStatus = (pos: JobPositionResponseDTO) => {
        const activate = !(pos.isActive ?? true);
        setConfirmModal({
            isOpen: true, variant: activate ? 'success' : 'warning',
            icon: activate ? 'ti-check' : 'ti-alert-triangle',
            title: `${activate ? 'Activate' : 'Deactivate'} Position?`,
            description: (<>Are you sure you want to <strong>{activate ? 'activate' : 'deactivate'}</strong> the position <strong>{pos.name}</strong>?</>),
            notice: !activate ? 'Deactivated positions will not be available for new employee assignments.' : undefined,
            confirmLabel: activate ? 'Activate' : 'Deactivate',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    const patchRes = await fetch(`/api/organization/job-positions/${pos.jobPositionId}/toggle-status`, { method: 'PATCH', headers: authHeaders() });
                    if (!patchRes.ok) {
                        const putRes = await fetch(`/api/organization/job-positions/${pos.jobPositionId}`, {
                            method: 'PUT', headers: authHeaders(),
                            body: JSON.stringify({ name: pos.name, description: pos.description, departmentId: pos.departmentId, code: pos.code, isActive: activate }),
                        });
                        if (!putRes.ok) { const e = await putRes.json().catch(() => ({})); throw new Error(e.message || 'Failed to update status.'); }
                    }
                    toastSuccess(`Position ${activate ? 'activated' : 'deactivated'}.`);
                    setConfirmModal(CONFIRM_CLOSED); fetchPositions();
                } catch (e: any) { toastError(e.message); setConfirmModal(CONFIRM_CLOSED); } finally { setActionLoading(false); }
            },
        });
    };

    const confirmDeletePos = (pos: JobPositionResponseDTO) => {
        const empCount = pos.employeeCount ?? 0;
        setConfirmModal({
            isOpen: true, variant: 'danger', icon: 'ti-trash',
            title: `Delete Position: ${pos.name}?`,
            description: (<>Permanently delete position <strong>{pos.name}</strong>? This cannot be undone.</>),
            notice: empCount > 0
                ? `This position has ${empCount} active employee(s). Reassign them before deleting.`
                : undefined,
            confirmLabel: empCount > 0 ? undefined : 'Delete Position',
            onConfirm: empCount > 0 ? () => setConfirmModal(CONFIRM_CLOSED) : async () => {
                setActionLoading(true);
                try {
                    const res = await fetch(`/api/organization/job-positions/${pos.jobPositionId}`, { method: 'DELETE', headers: authHeaders() });
                    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to delete position.'); }
                    toastSuccess('Position deleted.'); setConfirmModal(CONFIRM_CLOSED); fetchPositions();
                } catch (e: any) { toastError(e.message); setConfirmModal(CONFIRM_CLOSED); } finally { setActionLoading(false); }
            },
        });
    };

    // ─── Stats per sub-tab ────────────────────────────────────────────────────

    const systemRoles = roles.filter(r => r.isSystemDefined).length;
    const customRoles = roles.filter(r => !r.isSystemDefined).length;
    const activeDepts = departments.filter(d => d.isActive !== false).length;
    const activePositions = positions.filter(p => p.isActive !== false).length;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="rm2-root">

            {/* ── Sub-tab Navigation ── */}
            <div className="rm2-subtab-nav">
                <button className={`rm2-subtab-btn${subTab === 'roles' ? ' rm2-subtab-btn--active' : ''}`} onClick={() => setSubTab('roles')}>
                    <Shield size={15} /> Roles & Permissions
                </button>
                <button className={`rm2-subtab-btn${subTab === 'departments' ? ' rm2-subtab-btn--active' : ''}`} onClick={() => setSubTab('departments')}>
                    <Building2 size={15} /> Departments
                </button>
                <button className={`rm2-subtab-btn${subTab === 'positions' ? ' rm2-subtab-btn--active' : ''}`} onClick={() => setSubTab('positions')}>
                    <Briefcase size={15} /> Job Positions
                </button>
                <button className={`rm2-subtab-btn${subTab === 'overview' ? ' rm2-subtab-btn--active' : ''}`} onClick={() => setSubTab('overview')}>
                    <BarChart2 size={15} /> Overview & Logs
                </button>
            </div>

            {/* ─────────────────────────────── ROLES TAB ────────────────────── */}
            {subTab === 'roles' && (
                <>
                    <div className="rm2-stats-grid">
                        <StatCard icon={<Shield size={18} />} label="Total Roles" value={roles.length} subtext={`${systemRoles} system · ${customRoles} custom`} variant="primary" />
                        <StatCard icon={<Settings size={18} />} label="Custom Roles" value={customRoles} subtext="Created by administrators" variant="warning" />
                        <StatCard icon={<Lock size={18} />} label="System Roles" value={systemRoles} subtext="Protected by the system" variant="success" />
                        <StatCard icon={<Key size={18} />} label="Total Permissions" value={permissions.length} subtext="Available across all roles" variant="primary" />
                    </div>

                    <TableCard
                        title="Roles" totalResults={filteredRoles.length}
                        searchQuery={roleSearch} setSearchQuery={v => { setRoleSearch(v); setRolePage(1); }}
                        searchPlaceholder="Search roles…"
                        headers={['Role Name', 'Type', 'Permissions', 'Actions']}
                        loading={rolesLoading} emptyMessage="No roles match your search." emptyIcon={<Shield size={20} />}
                        actionButton={{ label: 'Create Role', icon: <Plus size={14} />, onClick: openCreateRole }}
                        currentPage={rolePage} totalPages={roleTotalPages} onPageChange={setRolePage}
                    >
                        {pagedRoles.map(role => (
                            <tr key={role.roleId}>
                                <td>
                                    <div className="rm2-role-name-cell">
                                        <div className={`rm2-role-icon ${role.isSystemDefined ? 'rm2-role-icon--system' : 'rm2-role-icon--custom'}`}><Shield size={14} /></div>
                                        <div>
                                            <div className="rm2-role-name">{role.name}</div>
                                            <div className="rm2-role-desc">{role.description || <span className="rm2-no-desc">No description</span>}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><RoleTypeBadge isSystem={role.isSystemDefined} /></td>
                                <td><span className="rm2-perm-pill">{role.permissions.length} permissions</span></td>
                                <td>
                                    <ActionsDropdown actions={[
                                        { label: 'Edit Role', icon: <Pencil size={13} />, onClick: () => openEditRole(role) },
                                        ...(!role.isSystemDefined ? [{ label: 'Delete Role', icon: <Trash2 size={13} />, onClick: () => confirmDeleteRole(role), variant: 'danger' as const }] : []),
                                    ]} />
                                </td>
                            </tr>
                        ))}
                    </TableCard>
                </>
            )}

            {/* ───────────────────────────── DEPARTMENTS TAB ────────────────── */}
            {subTab === 'departments' && (
                <>
                    <div className="rm2-stats-grid">
                        <StatCard icon={<Building2 size={18} />} label="Total Departments" value={departments.length} subtext="In the organization" variant="primary" />
                        <StatCard icon={<CheckCircle2 size={18} />} label="Active Departments" value={activeDepts} subtext="Currently operational" variant="success" />
                        <StatCard icon={<XCircle size={18} />} label="Inactive Departments" value={departments.length - activeDepts} subtext="Deactivated units" variant="warning" />
                        <StatCard icon={<Users size={18} />} label="Total Positions" value={positions.length || '—'} subtext="Across all departments" variant="primary" />
                    </div>

                    <TableCard
                        title="Departments" totalResults={filteredDepts.length}
                        searchQuery={deptSearch} setSearchQuery={v => { setDeptSearch(v); setDeptPage(1); }}
                        searchPlaceholder="Search by name or code…"
                        headers={['Department', 'Code', 'Status', 'Employees', 'Actions']}
                        loading={deptsLoading} emptyMessage="No departments found." emptyIcon={<Building2 size={20} />}
                        actionButton={{ label: 'Add Department', icon: <Plus size={14} />, onClick: openCreateDept }}
                        currentPage={deptPage} totalPages={deptTotalPages} onPageChange={setDeptPage}
                    >
                        {pagedDepts.map(dept => (
                            <tr key={dept.departmentId}>
                                <td>
                                    <div className="rm2-role-name-cell">
                                        <div className="rm2-role-icon rm2-role-icon--dept"><Building2 size={14} /></div>
                                        <div>
                                            <div className="rm2-role-name">{dept.name}</div>
                                            <div className="rm2-role-desc">{dept.description || <span className="rm2-no-desc">No description</span>}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{dept.code ? <span className="rm2-code-badge">{dept.code}</span> : <span className="rm2-no-desc">—</span>}</td>
                                <td><StatusBadge isActive={dept.isActive} /></td>
                                <td><span className="rm2-count-text">{dept.employeeCount ?? 0} employees</span></td>
                                <td>
                                    <ActionsDropdown actions={[
                                        { label: 'Edit', icon: <Pencil size={13} />, onClick: () => openEditDept(dept) },
                                        {
                                            label: (dept.isActive ?? true) ? 'Deactivate' : 'Activate',
                                            icon: (dept.isActive ?? true) ? <ToggleLeft size={13} /> : <ToggleRight size={13} />,
                                            onClick: () => confirmToggleDeptStatus(dept),
                                            variant: (dept.isActive ?? true) ? 'danger' as const : 'success' as const,
                                        },
                                        { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => confirmDeleteDept(dept), variant: 'danger' as const },
                                    ]} />
                                </td>
                            </tr>
                        ))}
                    </TableCard>
                </>
            )}

            {/* ─────────────────────────── JOB POSITIONS TAB ────────────────── */}
            {subTab === 'positions' && (
                <>
                    <div className="rm2-stats-grid">
                        <StatCard icon={<Briefcase size={18} />} label="Total Positions" value={positions.length} subtext="Across all departments" variant="primary" />
                        <StatCard icon={<CheckCircle2 size={18} />} label="Active Positions" value={activePositions} subtext="Currently operational" variant="success" />
                        <StatCard icon={<XCircle size={18} />} label="Inactive Positions" value={positions.length - activePositions} subtext="Deactivated positions" variant="warning" />
                        <StatCard icon={<Building2 size={18} />} label="Departments" value={departments.length} subtext="Available departments" variant="primary" />
                    </div>

                    <TableCard
                        title="Job Positions" totalResults={filteredPos.length}
                        searchQuery={posSearch} setSearchQuery={v => { setPosSearch(v); setPosPage(1); }}
                        searchPlaceholder="Search by name, code, or department…"
                        headers={['Position', 'Code', 'Department', 'Status', 'Reports To', 'Employees', 'Actions']}
                        loading={posLoading} emptyMessage="No positions found." emptyIcon={<Briefcase size={20} />}
                        actionButton={{ label: 'Add Position', icon: <Plus size={14} />, onClick: openCreatePos }}
                        currentPage={posPage} totalPages={posTotalPages} onPageChange={setPosPage}
                    >
                        {pagedPos.map(pos => (
                            <tr key={pos.jobPositionId}>
                                <td>
                                    <div className="rm2-role-name-cell">
                                        <div className="rm2-role-icon rm2-role-icon--pos"><Briefcase size={14} /></div>
                                        <div>
                                            <div className="rm2-role-name">{pos.name}</div>
                                            <div className="rm2-role-desc">{pos.description || <span className="rm2-no-desc">No description</span>}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{pos.code ? <span className="rm2-code-badge">{pos.code}</span> : <span className="rm2-no-desc">—</span>}</td>
                                <td><span className="rm2-dept-tag">{pos.departmentName}</span></td>
                                <td><StatusBadge isActive={pos.isActive} /></td>
                                <td>{pos.reportsToName ? <span className="rm2-reports-to">{pos.reportsToName}</span> : <span className="rm2-no-desc">—</span>}</td>
                                <td><span className="rm2-count-text">{pos.employeeCount ?? 0}</span></td>
                                <td>
                                    <ActionsDropdown actions={[
                                        { label: 'Edit', icon: <Pencil size={13} />, onClick: () => openEditPos(pos) },
                                        {
                                            label: (pos.isActive ?? true) ? 'Deactivate' : 'Activate',
                                            icon: (pos.isActive ?? true) ? <ToggleLeft size={13} /> : <ToggleRight size={13} />,
                                            onClick: () => confirmTogglePosStatus(pos),
                                            variant: (pos.isActive ?? true) ? 'danger' as const : 'success' as const,
                                        },
                                        { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => confirmDeletePos(pos), variant: 'danger' as const },
                                    ]} />
                                </td>
                            </tr>
                        ))}
                    </TableCard>
                </>
            )}

            {/* ─── CREATE ROLE MODAL ───────────────────────────────────────── */}
            <FormModal isOpen={isCreateRoleOpen} onClose={() => setIsCreateRoleOpen(false)}
                title="Create Custom Role" subtitle="Define a new role and assign permissions."
                onSubmit={handleCreateRole} submitLabel="Create Role" isSubmitting={actionLoading}
                apiError={createRoleErrors.api} size="md">
                <div className="rm2-form-body">
                    <div className="rm2-field">
                        <label className="rm2-form-label">Role Name <span className="rm2-req">*</span></label>
                        <input type="text" className={`form-input${createRoleErrors.name ? ' rm2-input--error' : ''}`}
                            placeholder="e.g. Operation Auditor" value={createRoleName}
                            onChange={e => { setCreateRoleName(e.target.value); setCreateRoleErrors(p => ({ ...p, name: '' })); }} />
                        {createRoleErrors.name && <span className="rm2-field-error"><AlertCircle size={11} /> {createRoleErrors.name}</span>}
                    </div>
                    <div className="rm2-field">
                        <label className="rm2-form-label">Description</label>
                        <textarea className="form-input" rows={2} placeholder="Briefly describe what this role does…"
                            value={createRoleDesc} onChange={e => setCreateRoleDesc(e.target.value)} />
                    </div>
                    <PermissionSelector grouped={grouped} selected={createRolePerms} setSelected={setCreateRolePerms} />
                </div>
            </FormModal>

            {/* ─── EDIT ROLE MODAL ─────────────────────────────────────────── */}
            <FormModal isOpen={!!editingRole} onClose={() => setEditingRole(null)}
                title={editingRole ? `Edit Role: ${editingRole.name}` : ''} subtitle="Update role description and permissions."
                onSubmit={handleEditRole} submitLabel="Save Changes" isSubmitting={actionLoading}
                apiError={editRoleError} size="md">
                {editingRole && (
                    <div className="rm2-form-body">
                        <div className="rm2-field">
                            <label className="rm2-form-label">Role Name</label>
                            <input type="text" className="form-input rm2-input--disabled" value={editingRole.name} disabled />
                            <span className="rm2-field-hint"><Info size={11} /> Role names cannot be changed after creation.</span>
                        </div>
                        <div className="rm2-field">
                            <label className="rm2-form-label">Description</label>
                            <textarea className="form-input" rows={2} value={editRoleDesc} onChange={e => setEditRoleDesc(e.target.value)} />
                        </div>
                        <PermissionSelector grouped={grouped} selected={editRolePerms} setSelected={setEditRolePerms} />
                    </div>
                )}
            </FormModal>

            {/* ─── CREATE DEPT MODAL ───────────────────────────────────────── */}
            <FormModal isOpen={isCreateDeptOpen} onClose={() => setIsCreateDeptOpen(false)}
                title="Add Department" subtitle="Create a new department in the organization."
                onSubmit={handleCreateDept} submitLabel="Create Department" isSubmitting={actionLoading}
                apiError={deptFormErrors.api} size="md">
                <div className="rm2-form-body">
                    <div className="rm2-field-row">
                        <div className="rm2-field">
                            <label className="rm2-form-label">Department Name <span className="rm2-req">*</span></label>
                            <input type="text" className={`form-input${deptFormErrors.name ? ' rm2-input--error' : ''}`}
                                placeholder="e.g. Human Resources" value={deptForm.name}
                                onChange={e => { setDeptForm(f => ({ ...f, name: e.target.value })); setDeptFormErrors(p => ({ ...p, name: '' })); }} />
                            {deptFormErrors.name && <span className="rm2-field-error"><AlertCircle size={11} /> {deptFormErrors.name}</span>}
                        </div>
                        <div className="rm2-field rm2-field--sm">
                            <label className="rm2-form-label">Code</label>
                            <input type="text" className={`form-input${deptFormErrors.code ? ' rm2-input--error' : ''}`}
                                placeholder="e.g. HR" value={deptForm.code} maxLength={10}
                                onChange={e => { setDeptForm(f => ({ ...f, code: e.target.value.toUpperCase() })); setDeptFormErrors(p => ({ ...p, code: '' })); }} />
                            {deptFormErrors.code && <span className="rm2-field-error"><AlertCircle size={11} /> {deptFormErrors.code}</span>}
                        </div>
                    </div>
                    <div className="rm2-field">
                        <label className="rm2-form-label">Description</label>
                        <textarea className="form-input" rows={2} placeholder="Describe this department's purpose…"
                            value={deptForm.description} onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="rm2-field">
                        <label className="rm2-toggle-wrap">
                            <input type="checkbox" checked={deptForm.isActive} onChange={e => setDeptForm(f => ({ ...f, isActive: e.target.checked }))} />
                            <span className="rm2-toggle-label">Active on creation</span>
                        </label>
                    </div>
                </div>
            </FormModal>

            {/* ─── EDIT DEPT MODAL ─────────────────────────────────────────── */}
            <FormModal isOpen={!!editingDept} onClose={() => setEditingDept(null)}
                title={editingDept ? `Edit: ${editingDept.name}` : ''} subtitle="Update department information."
                onSubmit={handleEditDept} submitLabel="Save Changes" isSubmitting={actionLoading}
                apiError={deptFormErrors.api} size="md">
                {editingDept && (
                    <div className="rm2-form-body">
                        <div className="rm2-field-row">
                            <div className="rm2-field">
                                <label className="rm2-form-label">Department Name <span className="rm2-req">*</span></label>
                                <input type="text" className={`form-input${deptFormErrors.name ? ' rm2-input--error' : ''}`}
                                    value={deptForm.name}
                                    onChange={e => { setDeptForm(f => ({ ...f, name: e.target.value })); setDeptFormErrors(p => ({ ...p, name: '' })); }} />
                                {deptFormErrors.name && <span className="rm2-field-error"><AlertCircle size={11} /> {deptFormErrors.name}</span>}
                            </div>
                            <div className="rm2-field rm2-field--sm">
                                <label className="rm2-form-label">Code</label>
                                <input type="text" className={`form-input${deptFormErrors.code ? ' rm2-input--error' : ''}`}
                                    value={deptForm.code} maxLength={10}
                                    onChange={e => { setDeptForm(f => ({ ...f, code: e.target.value.toUpperCase() })); setDeptFormErrors(p => ({ ...p, code: '' })); }} />
                                {deptFormErrors.code && <span className="rm2-field-error"><AlertCircle size={11} /> {deptFormErrors.code}</span>}
                            </div>
                        </div>
                        <div className="rm2-field">
                            <label className="rm2-form-label">Description</label>
                            <textarea className="form-input" rows={2} value={deptForm.description}
                                onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div className="rm2-field">
                            <label className="rm2-toggle-wrap">
                                <input type="checkbox" checked={deptForm.isActive} onChange={e => setDeptForm(f => ({ ...f, isActive: e.target.checked }))} />
                                <span className="rm2-toggle-label">Active</span>
                            </label>
                        </div>
                    </div>
                )}
            </FormModal>

            {/* ─── CREATE POSITION MODAL ───────────────────────────────────── */}
            <FormModal isOpen={isCreatePosOpen} onClose={() => setIsCreatePosOpen(false)}
                title="Add Job Position" subtitle="Create a new position and associate it with a department."
                onSubmit={handleCreatePos} submitLabel="Create Position" isSubmitting={actionLoading}
                apiError={posFormErrors.api} size="md">
                <div className="rm2-form-body">
                    <div className="rm2-field-row">
                        <div className="rm2-field">
                            <label className="rm2-form-label">Position Name <span className="rm2-req">*</span></label>
                            <input type="text" className={`form-input${posFormErrors.name ? ' rm2-input--error' : ''}`}
                                placeholder="e.g. Operations Manager" value={posForm.name}
                                onChange={e => { setPosForm(f => ({ ...f, name: e.target.value })); setPosFormErrors(p => ({ ...p, name: '' })); }} />
                            {posFormErrors.name && <span className="rm2-field-error"><AlertCircle size={11} /> {posFormErrors.name}</span>}
                        </div>
                        <div className="rm2-field rm2-field--sm">
                            <label className="rm2-form-label">Code</label>
                            <input type="text" className={`form-input${posFormErrors.code ? ' rm2-input--error' : ''}`}
                                placeholder="e.g. OPS-MGR" value={posForm.code} maxLength={12}
                                onChange={e => { setPosForm(f => ({ ...f, code: e.target.value.toUpperCase() })); setPosFormErrors(p => ({ ...p, code: '' })); }} />
                            {posFormErrors.code && <span className="rm2-field-error"><AlertCircle size={11} /> {posFormErrors.code}</span>}
                        </div>
                    </div>
                    <div className="rm2-field">
                        <label className="rm2-form-label">Department <span className="rm2-req">*</span></label>
                        <select className={`form-input${posFormErrors.departmentId ? ' rm2-input--error' : ''}`}
                            value={posForm.departmentId}
                            onChange={e => { setPosForm(f => ({ ...f, departmentId: e.target.value })); setPosFormErrors(p => ({ ...p, departmentId: '' })); }}>
                            <option value="">— Select a department —</option>
                            {departments.filter(d => d.isActive !== false).map(d => (
                                <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                            ))}
                        </select>
                        {posFormErrors.departmentId && <span className="rm2-field-error"><AlertCircle size={11} /> {posFormErrors.departmentId}</span>}
                    </div>
                    <div className="rm2-field">
                        <label className="rm2-form-label">Reports To <span className="rm2-field-optional">(optional)</span></label>
                        <select className="form-input" value={posForm.reportsToId}
                            onChange={e => setPosForm(f => ({ ...f, reportsToId: e.target.value }))}>
                            <option value="">— None (top-level position) —</option>
                            {positions.filter(p => p.jobPositionId !== editingPos?.jobPositionId && (p.isActive ?? true)).map(p => (
                                <option key={p.jobPositionId} value={p.jobPositionId}>{p.name} ({p.departmentName})</option>
                            ))}
                        </select>
                        <span className="rm2-field-hint"><Info size={11} /> Defines the organizational reporting hierarchy.</span>
                    </div>
                    <div className="rm2-field">
                        <label className="rm2-form-label">Description</label>
                        <textarea className="form-input" rows={2} placeholder="Describe this position's responsibilities…"
                            value={posForm.description} onChange={e => setPosForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="rm2-field">
                        <label className="rm2-toggle-wrap">
                            <input type="checkbox" checked={posForm.isActive} onChange={e => setPosForm(f => ({ ...f, isActive: e.target.checked }))} />
                            <span className="rm2-toggle-label">Active on creation</span>
                        </label>
                    </div>
                </div>
            </FormModal>

            {/* ─── EDIT POSITION MODAL ─────────────────────────────────────── */}
            <FormModal isOpen={!!editingPos} onClose={() => setEditingPos(null)}
                title={editingPos ? `Edit: ${editingPos.name}` : ''} subtitle="Update position information."
                onSubmit={handleEditPos} submitLabel="Save Changes" isSubmitting={actionLoading}
                apiError={posFormErrors.api} size="md">
                {editingPos && (
                    <div className="rm2-form-body">
                        <div className="rm2-field-row">
                            <div className="rm2-field">
                                <label className="rm2-form-label">Position Name <span className="rm2-req">*</span></label>
                                <input type="text" className={`form-input${posFormErrors.name ? ' rm2-input--error' : ''}`}
                                    value={posForm.name}
                                    onChange={e => { setPosForm(f => ({ ...f, name: e.target.value })); setPosFormErrors(p => ({ ...p, name: '' })); }} />
                                {posFormErrors.name && <span className="rm2-field-error"><AlertCircle size={11} /> {posFormErrors.name}</span>}
                            </div>
                            <div className="rm2-field rm2-field--sm">
                                <label className="rm2-form-label">Code</label>
                                <input type="text" className={`form-input${posFormErrors.code ? ' rm2-input--error' : ''}`}
                                    value={posForm.code} maxLength={12}
                                    onChange={e => { setPosForm(f => ({ ...f, code: e.target.value.toUpperCase() })); setPosFormErrors(p => ({ ...p, code: '' })); }} />
                                {posFormErrors.code && <span className="rm2-field-error"><AlertCircle size={11} /> {posFormErrors.code}</span>}
                            </div>
                        </div>
                        <div className="rm2-field">
                            <label className="rm2-form-label">Department <span className="rm2-req">*</span></label>
                            <select className={`form-input${posFormErrors.departmentId ? ' rm2-input--error' : ''}`}
                                value={posForm.departmentId}
                                onChange={e => { setPosForm(f => ({ ...f, departmentId: e.target.value })); setPosFormErrors(p => ({ ...p, departmentId: '' })); }}>
                                <option value="">— Select a department —</option>
                                {departments.map(d => (
                                    <option key={d.departmentId} value={d.departmentId}>{d.name}{d.isActive === false ? ' (Inactive)' : ''}</option>
                                ))}
                            </select>
                            {posFormErrors.departmentId && <span className="rm2-field-error"><AlertCircle size={11} /> {posFormErrors.departmentId}</span>}
                        </div>
                        <div className="rm2-field">
                            <label className="rm2-form-label">Reports To <span className="rm2-field-optional">(optional)</span></label>
                            <select className="form-input" value={posForm.reportsToId}
                                onChange={e => setPosForm(f => ({ ...f, reportsToId: e.target.value }))}>
                                <option value="">— None (top-level position) —</option>
                                {positions.filter(p => p.jobPositionId !== editingPos.jobPositionId).map(p => (
                                    <option key={p.jobPositionId} value={p.jobPositionId}>{p.name} ({p.departmentName})</option>
                                ))}
                            </select>
                        </div>
                        <div className="rm2-field">
                            <label className="rm2-form-label">Description</label>
                            <textarea className="form-input" rows={2} value={posForm.description}
                                onChange={e => setPosForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div className="rm2-field">
                            <label className="rm2-toggle-wrap">
                                <input type="checkbox" checked={posForm.isActive} onChange={e => setPosForm(f => ({ ...f, isActive: e.target.checked }))} />
                                <span className="rm2-toggle-label">Active</span>
                            </label>
                        </div>
                    </div>
                )}
            </FormModal>

            {/* ──────────────────────────── OVERVIEW TAB ────────────────────── */}
            {subTab === 'overview' && (() => {
                // Derived analytics data
                const activeDeptCount = departments.filter(d => d.isActive !== false).length;
                const inactiveDeptCount = departments.length - activeDeptCount;
                const activePosCount = positions.filter(p => p.isActive !== false).length;
                const inactivePosCount = positions.length - activePosCount;
                const totalEmployees = departments.reduce((s, d) => s + (d.employeeCount ?? 0), 0);

                // Position count per department (for breakdown table)
                const posByDept = departments.map(d => ({
                    dept: d,
                    posCount: positions.filter(p => p.departmentId === d.departmentId).length,
                    activePosCount: positions.filter(p => p.departmentId === d.departmentId && p.isActive !== false).length,
                })).sort((a, b) => b.posCount - a.posCount);

                const deptDonutSlices = [
                    { label: 'Active', value: activeDeptCount },
                    { label: 'Inactive', value: inactiveDeptCount },
                ];
                const posDonutSlices = [
                    { label: 'Active', value: activePosCount },
                    { label: 'Inactive', value: inactivePosCount },
                ];

                return (
                    <>
                        {/* Summary Stats */}
                        <div className="rm2-stats-grid">
                            <StatCard icon={<Building2 size={18} />} label="Total Departments" value={departments.length} subtext={`${activeDeptCount} active · ${inactiveDeptCount} inactive`} variant="primary" />
                            <StatCard icon={<Briefcase size={18} />} label="Total Positions" value={positions.length} subtext={`${activePosCount} active · ${inactivePosCount} inactive`} variant="success" />
                            <StatCard icon={<Shield size={18} />} label="Total Roles" value={roles.length} subtext={`${roles.filter(r => r.isSystemDefined).length} system · ${roles.filter(r => !r.isSystemDefined).length} custom`} variant="warning" />
                            <StatCard icon={<Users size={18} />} label="Employees on Record" value={totalEmployees > 0 ? totalEmployees : '—'} subtext="Across all departments" variant="primary" />
                        </div>

                        {/* Charts + Audit row */}
                        <div className="rm2-overview-grid">

                            {/* Dept Breakdown Donut */}
                            <div className="rm2-overview-card">
                                <div className="rm2-overview-card__header">
                                    <TrendingUp size={15} />
                                    <span>Department Overview</span>
                                </div>
                                {departments.length === 0 ? (
                                    <div className="rm2-overview-empty"><Building2 size={28} /><p>No departments yet</p></div>
                                ) : (
                                    <div className="rm2-chart-area">
                                        <DonutChart slices={deptDonutSlices} total={departments.length} />
                                        <div className="rm2-chart-legend">
                                            {deptDonutSlices.map((s, i) => s.value > 0 && (
                                                <div key={i} className="rm2-legend-row">
                                                    <span className="rm2-legend-dot" style={{ background: ['#00A99D','#FFB547'][i] }} />
                                                    <span>{s.label}</span>
                                                    <strong>{s.value} ({departments.length > 0 ? Math.round((s.value / departments.length) * 100) : 0}%)</strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Position Breakdown Donut */}
                            <div className="rm2-overview-card">
                                <div className="rm2-overview-card__header">
                                    <TrendingUp size={15} />
                                    <span>Position Overview</span>
                                </div>
                                {positions.length === 0 ? (
                                    <div className="rm2-overview-empty"><Briefcase size={28} /><p>No positions yet</p></div>
                                ) : (
                                    <div className="rm2-chart-area">
                                        <DonutChart slices={posDonutSlices} total={positions.length} />
                                        <div className="rm2-chart-legend">
                                            {posDonutSlices.map((s, i) => s.value > 0 && (
                                                <div key={i} className="rm2-legend-row">
                                                    <span className="rm2-legend-dot" style={{ background: ['#01B574','#FFB547'][i] }} />
                                                    <span>{s.label}</span>
                                                    <strong>{s.value} ({positions.length > 0 ? Math.round((s.value / positions.length) * 100) : 0}%)</strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Audit / Activity Log — criteria #19 & #20 */}
                            <div className="rm2-overview-card rm2-overview-card--wide">
                                <div className="rm2-overview-card__header">
                                    <Activity size={15} />
                                    <span>Organization Activity Log</span>
                                    <button className="rm2-refresh-btn" onClick={fetchAuditLog} title="Refresh">
                                        <RefreshCw size={12} className={auditLoading ? 'rm2-spin' : ''} />
                                    </button>
                                </div>
                                {auditLoading ? (
                                    <div className="rm2-overview-empty"><Loader2 size={22} className="rm2-spin" /></div>
                                ) : auditEntries.length === 0 ? (
                                    <div className="rm2-overview-empty">
                                        <Clock size={28} />
                                        <p>No activity logs yet</p>
                                        <span className="rm2-overview-empty__hint">Logs will appear here once the backend audit logging is enabled.</span>
                                    </div>
                                ) : (
                                    <div className="rm2-audit-list">
                                        {auditEntries.map(entry => {
                                            const style = getAuditStyle(entry.action);
                                            return (
                                                <div key={entry.id} className="rm2-audit-item">
                                                    <div className="rm2-audit-icon" style={{ background: style.bg, color: style.color }}>
                                                        {style.icon}
                                                    </div>
                                                    <div className="rm2-audit-body">
                                                        <div className="rm2-audit-action">
                                                            <span className="rm2-audit-entity-type">{entry.entityType}</span>
                                                            {' '}{entry.action}
                                                            {entry.entityName && <> — <strong>{entry.entityName}</strong></>}
                                                        </div>
                                                        <div className="rm2-audit-meta">
                                                            by {entry.performedBy} · {formatRelativeTime(entry.performedAt)}
                                                            {entry.details && <span className="rm2-audit-detail"> · {entry.details}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Position distribution by department — criteria #24 */}
                        <div className="rm2-overview-card">
                            <div className="rm2-overview-card__header">
                                <BarChart2 size={15} />
                                <span>Position Distribution by Department</span>
                            </div>
                            {posByDept.length === 0 ? (
                                <div className="rm2-overview-empty"><Briefcase size={28} /><p>No data yet</p></div>
                            ) : (
                                <div className="rm2-dist-table-wrap">
                                    <table className="rm2-dist-table">
                                        <thead>
                                            <tr>
                                                <th>Department</th>
                                                <th>Status</th>
                                                <th>Total Positions</th>
                                                <th>Active Positions</th>
                                                <th>Employees</th>
                                                <th>Distribution</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {posByDept.map(({ dept, posCount, activePosCount }) => {
                                                const pct = positions.length > 0 ? Math.round((posCount / positions.length) * 100) : 0;
                                                return (
                                                    <tr key={dept.departmentId}>
                                                        <td>
                                                            <div className="rm2-role-name-cell">
                                                                <div className="rm2-role-icon rm2-role-icon--dept"><Building2 size={13} /></div>
                                                                <div>
                                                                    <div className="rm2-role-name">{dept.name}</div>
                                                                    {dept.code && <div className="rm2-role-desc">{dept.code}</div>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><StatusBadge isActive={dept.isActive} /></td>
                                                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{posCount}</td>
                                                        <td style={{ textAlign: 'center' }}>{activePosCount}</td>
                                                        <td style={{ textAlign: 'center' }}>{dept.employeeCount ?? 0}</td>
                                                        <td>
                                                            <div className="rm2-dist-bar-wrap">
                                                                <div className="rm2-dist-bar">
                                                                    <div className="rm2-dist-bar__fill" style={{ width: `${pct}%` }} />
                                                                </div>
                                                                <span className="rm2-dist-pct">{pct}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                );
            })()}

            {/* ─── Confirmation Modal ───────────────────────────────────────── */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen} variant={confirmModal.variant} icon={confirmModal.icon}
                title={confirmModal.title} description={confirmModal.description}
                notice={confirmModal.notice} confirmLabel={confirmModal.confirmLabel}
                isLoading={actionLoading} onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(CONFIRM_CLOSED)} />
        </div>
    );
}