import React, { useEffect, useState } from 'react';
import {
    Shield,
    ShieldAlert,
    Lock,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X,
    Info,
} from 'lucide-react';
import { useToast } from '../../components/Toast/Toast';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';

// ─── Interfaces ──────────────────────────────────────────────────────────────
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

export interface CreateRoleDTO {
    name: string;
    description?: string;
    permissions: string[];
}

export interface UpdateRoleDTO {
    description?: string;
    permissions: string[];
}

interface ConfirmModalState {
    isOpen: boolean;
    variant: 'danger' | 'warning' | 'info' | 'success' | 'neutral';
    icon?: string;
    title: string;
    description: React.ReactNode;
    notice?: string;
    confirmLabel?: string;
    onConfirm: () => void;
}

const CONFIRM_CLOSED: ConfirmModalState = {
    isOpen: false,
    variant: 'neutral',
    title: '',
    description: '',
    onConfirm: () => { },
};

export default function RoleManagementTab() {
    const { success: toastSuccess, error: toastError } = useToast();
    const [roles, setRoles] = useState<RoleResponseDTO[]>([]);
    const [permissions, setPermissions] = useState<PermissionResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleResponseDTO | null>(null);
    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(CONFIRM_CLOSED);

    // Create Form State
    const [createName, setCreateName] = useState('');
    const [createDesc, setCreateDesc] = useState('');
    const [createPerms, setCreatePerms] = useState<Set<string>>(new Set());
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

    // Edit Form State
    const [editDesc, setEditDesc] = useState('');
    const [editPerms, setEditPerms] = useState<Set<string>>(new Set());

    // Expand states for permission lists in role cards
    const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});

    // ─── Fetch Data ────────────────────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        setApiError(null);
        try {
            const token = localStorage.getItem('authToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [rolesRes, permsRes] = await Promise.all([
                fetch('/api/roles', { headers }),
                fetch('/api/roles/permissions', { headers })
            ]);

            if (!rolesRes.ok) throw new Error(`HTTP ${rolesRes.status}: Failed to fetch roles`);
            if (!permsRes.ok) throw new Error(`HTTP ${permsRes.status}: Failed to fetch permissions`);

            const rolesData = await rolesRes.json();
            const permsData = await permsRes.json();

            // Handle possible wrap formatting ($values or standard arrays)
            const resolvedRoles: RoleResponseDTO[] = Array.isArray(rolesData)
                ? rolesData
                : (rolesData.data || rolesData.$values || []);
            const resolvedPerms: PermissionResponseDTO[] = Array.isArray(permsData)
                ? permsData
                : (permsData.data || permsData.$values || []);

            setRoles(resolvedRoles);
            setPermissions(resolvedPerms);
        } catch (err: any) {
            setApiError(err.message || 'An error occurred while loading role management data.');
            toastError(err.message || 'Failed to load role management data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ─── Helpers ───────────────────────────────────────────────────────────────
    const formatCategory = (cat: string) => {
        const mapping: Record<string, string> = {
            SystemAdmin: 'System Administration',
            Users: 'User Management',
            Roles: 'Role Management',
            Departments: 'Department Management',
            JobPositions: 'Job Position Management',
            Tasks: 'Task Management',
        };
        return mapping[cat] || cat.replace(/([A-Z])/g, ' $1').trim() + ' Permissions';
    };

    const groupPermissions = (permsList: PermissionResponseDTO[]) => {
        const grouped: Record<string, PermissionResponseDTO[]> = {};
        permsList.forEach(p => {
            const parts = p.name.split('.');
            // typically Permissions.Module.Action
            const category = parts.length > 2 ? parts[1] : 'General';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(p);
        });
        return grouped;
    };

    const togglePermissionInSet = (set: Set<string>, permName: string) => {
        const next = new Set(set);
        if (next.has(permName)) {
            next.delete(permName);
        } else {
            next.add(permName);
        }
        return next;
    };

    const toggleSelectAllCategory = (set: Set<string>, categoryPerms: PermissionResponseDTO[], isSelected: boolean) => {
        const next = new Set(set);
        categoryPerms.forEach(p => {
            if (isSelected) {
                next.add(p.name);
            } else {
                next.delete(p.name);
            }
        });
        return next;
    };

    const getPermissionFriendlyName = (name: string) => {
        const parts = name.split('.');
        return parts.length > 2 ? parts.slice(2).join(' ') : name;
    };

    // ─── Actions ───────────────────────────────────────────────────────────────
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateErrors({});
        const errors: Record<string, string> = {};

        if (!createName.trim()) {
            errors.name = 'Role name is required.';
        } else if (!/^[a-zA-Z0-9_-]{3,50}$/.test(createName.trim())) {
            errors.name = 'Role name must be 3-50 alphanumeric characters (no spaces, dashes/underscores allowed).';
        }

        if (Object.keys(errors).length > 0) {
            setCreateErrors(errors);
            return;
        }

        setActionLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const payload: CreateRoleDTO = {
                name: createName.trim(),
                description: createDesc.trim() || undefined,
                permissions: Array.from(createPerms)
            };

            const res = await fetch('/api/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${res.status}: Create role failed`);
            }

            toastSuccess('Role created successfully!');
            setIsCreateOpen(false);
            setCreateName('');
            setCreateDesc('');
            setCreatePerms(new Set());
            fetchData();
        } catch (err: any) {
            toastError(err.message || 'Failed to create role.');
            setCreateErrors({ api: err.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditOpen = (role: RoleResponseDTO) => {
        setEditingRole(role);
        setEditDesc(role.description || '');
        setEditPerms(new Set(role.permissions));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const payload: UpdateRoleDTO = {
                description: editDesc.trim() || undefined,
                permissions: Array.from(editPerms)
            };

            const res = await fetch(`/api/roles/${editingRole.roleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${res.status}: Update role failed`);
            }

            toastSuccess('Role permissions updated successfully!');
            setEditingRole(null);
            fetchData();
        } catch (err: any) {
            toastError(err.message || 'Failed to update role.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteClick = (role: RoleResponseDTO) => {
        setConfirmModal({
            isOpen: true,
            variant: 'danger',
            icon: 'ti-trash',
            title: `Delete Role: ${role.name}?`,
            description: (
                <>
                    Are you sure you want to permanently delete the custom role <strong>{role.name}</strong>?
                    This action cannot be undone.
                </>
            ),
            notice: 'If any accounts are currently assigned to this role, the operation will fail.',
            confirmLabel: 'Delete Role',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    const token = localStorage.getItem('authToken');
                    const res = await fetch(`/api/roles/${role.roleId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.message || `Error ${res.status}: Delete failed`);
                    }

                    toastSuccess('Role deleted successfully!');
                    setConfirmModal(CONFIRM_CLOSED);
                    fetchData();
                } catch (err: any) {
                    toastError(err.message || 'Failed to delete role.');
                    setConfirmModal(CONFIRM_CLOSED);
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const toggleRoleExpand = (roleId: string) => {
        setExpandedRoles(prev => ({
            ...prev,
            [roleId]: !prev[roleId]
        }));
    };

    const grouped = groupPermissions(permissions);

    return (
        <div className="dashboard-content roles-tab-content">
            <div className="roles-header-row">
                <div>
                    <h3 className="section-title">Roles & Access Control</h3>
                    <p className="section-subtitle">Manage system user roles, permission mappings, and access levels.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
                    <Plus size={15} /> Create Custom Role
                </button>
            </div>

            {loading ? (
                <div className="loading-state">
                    <Loader2 size={36} className="spin text-primary" />
                    <p>Fetching roles and permissions details...</p>
                </div>
            ) : apiError ? (
                <div className="error-state">
                    <ShieldAlert size={40} className="text-danger" />
                    <h4>Failed to load Roles</h4>
                    <p>{apiError}</p>
                    <button className="btn btn-outline btn-sm" onClick={fetchData}>Try Again</button>
                </div>
            ) : (
                <div className="roles-grid">
                    {roles.map(role => {
                        const isExpanded = !!expandedRoles[role.roleId];
                        return (
                            <div key={role.roleId} className={`role-card ${role.isSystemDefined ? 'system-defined' : 'custom-defined'}`}>
                                <div className="role-card-header">
                                    <div className="role-info-wrap">
                                        <div className="role-icon-box">
                                            <Shield size={20} className="role-shield-icon" />
                                        </div>
                                        <div>
                                            <h4 className="role-name">{role.name}</h4>
                                            <span className={`role-badge ${role.isSystemDefined ? 'badge-system' : 'badge-custom'}`}>
                                                {role.isSystemDefined ? (
                                                    <><Lock size={10} style={{ marginRight: 4 }} /> System Role</>
                                                ) : (
                                                    'Custom Role'
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {!role.isSystemDefined && (
                                        <div className="role-card-actions">
                                            <button
                                                className="role-action-btn edit-btn"
                                                onClick={() => handleEditOpen(role)}
                                                title="Edit permissions"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                className="role-action-btn delete-btn"
                                                onClick={() => handleDeleteClick(role)}
                                                title="Delete role"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="role-card-body">
                                    <p className="role-desc">{role.description || 'No description provided.'}</p>

                                    <div className="role-perms-summary">
                                        <div className="summary-title-row">
                                            <span className="perms-count">
                                                <strong>{role.permissions.length}</strong> permissions assigned
                                            </span>
                                            <button className="expand-toggle-btn" onClick={() => toggleRoleExpand(role.roleId)}>
                                                {isExpanded ? 'Hide permissions' : 'Show permissions'}
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="perms-tags-container animate-fade-in">
                                                {role.permissions.length === 0 ? (
                                                    <span className="no-perms-text">No permissions assigned to this role.</span>
                                                ) : (
                                                    role.permissions.map(permName => (
                                                        <span key={permName} className="perm-tag" title={permName}>
                                                            {getPermissionFriendlyName(permName)}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── CREATE ROLE MODAL ─────────────────────────────────────────── */}
            {isCreateOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
                    <div className="modal-card modal-card-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>Create Custom Role</h3>
                                <p className="modal-subtitle">Define a new system role and map access permissions.</p>
                            </div>
                            <button className="icon-btn" onClick={() => setIsCreateOpen(false)} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="modal-form-scrollable">
                            {createErrors.api && (
                                <div className="form-api-error">
                                    <AlertCircle size={14} />
                                    <span>{createErrors.api}</span>
                                </div>
                            )}

                            <div className="field">
                                <label htmlFor="create-role-name">Role Name <span className="req">*</span></label>
                                <input
                                    id="create-role-name"
                                    type="text"
                                    placeholder="e.g. OperationAuditor"
                                    value={createName}
                                    onChange={e => {
                                        setCreateName(e.target.value);
                                        setCreateErrors(prev => ({ ...prev, name: '' }));
                                    }}
                                    className={createErrors.name ? 'input-error' : ''}
                                />
                                {createErrors.name && (
                                    <span className="field-error"><AlertCircle size={12} />{createErrors.name}</span>
                                )}
                            </div>

                            <div className="field">
                                <label htmlFor="create-role-desc">Description</label>
                                <textarea
                                    id="create-role-desc"
                                    rows={2}
                                    placeholder="Enter what this role represents in the system..."
                                    value={createDesc}
                                    onChange={e => setCreateDesc(e.target.value)}
                                />
                            </div>

                            <div className="permissions-selector-section">
                                <div className="section-label-row">
                                    <span className="form-label">Assign Permissions</span>
                                    <span className="perms-selected-badge">{createPerms.size} selected</span>
                                </div>

                                <div className="permissions-groups-grid">
                                    {Object.entries(grouped).map(([category, permsList]) => {
                                        const allSelected = permsList.every(p => createPerms.has(p.name));
                                        const someSelected = permsList.some(p => createPerms.has(p.name)) && !allSelected;

                                        return (
                                            <div key={category} className="perm-category-box">
                                                <div className="perm-category-header">
                                                    <label className="checkbox-wrap category-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={allSelected}
                                                            ref={el => {
                                                                if (el) el.indeterminate = someSelected;
                                                            }}
                                                            onChange={e => {
                                                                setCreatePerms(prev =>
                                                                    toggleSelectAllCategory(prev, permsList, e.target.checked)
                                                                );
                                                            }}
                                                        />
                                                        <span>{formatCategory(category)}</span>
                                                    </label>
                                                </div>
                                                <div className="perm-category-body">
                                                    {permsList.map(perm => (
                                                        <label key={perm.permissionId} className="checkbox-wrap perm-item-label" title={perm.description}>
                                                            <input
                                                                type="checkbox"
                                                                checked={createPerms.has(perm.name)}
                                                                onChange={() => {
                                                                    setCreatePerms(prev =>
                                                                        togglePermissionInSet(prev, perm.name)
                                                                    );
                                                                }}
                                                            />
                                                            <div className="perm-checkbox-info">
                                                                <span className="perm-friendly-name">{getPermissionFriendlyName(perm.name)}</span>
                                                                {perm.description && (
                                                                    <span className="perm-desc">{perm.description}</span>
                                                                )}
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="modal-actions sticky-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setIsCreateOpen(false)} disabled={actionLoading}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                                    {actionLoading ? <Loader2 size={13} className="spin" /> : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── EDIT ROLE MODAL ───────────────────────────────────────────── */}
            {editingRole && (
                <div className="modal-overlay" onClick={() => setEditingRole(null)}>
                    <div className="modal-card modal-card-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>Edit Custom Role: {editingRole.name}</h3>
                                <p className="modal-subtitle">Update role description and system access mappings.</p>
                            </div>
                            <button className="icon-btn" onClick={() => setEditingRole(null)} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="modal-form-scrollable">
                            <div className="field">
                                <label>Role Name</label>
                                <input
                                    type="text"
                                    value={editingRole.name}
                                    disabled
                                    className="disabled-input"
                                    style={{ background: '#f8fafc', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
                                />
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                                    <Info size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                    System constraints prevent renaming roles once created.
                                </span>
                            </div>

                            <div className="field">
                                <label htmlFor="edit-role-desc">Description</label>
                                <textarea
                                    id="edit-role-desc"
                                    rows={2}
                                    placeholder="Enter what this role represents in the system..."
                                    value={editDesc}
                                    onChange={e => setEditDesc(e.target.value)}
                                />
                            </div>

                            <div className="permissions-selector-section">
                                <div className="section-label-row">
                                    <span className="form-label">Assign Permissions</span>
                                    <span className="perms-selected-badge">{editPerms.size} selected</span>
                                </div>

                                <div className="permissions-groups-grid">
                                    {Object.entries(grouped).map(([category, permsList]) => {
                                        const allSelected = permsList.every(p => editPerms.has(p.name));
                                        const someSelected = permsList.some(p => editPerms.has(p.name)) && !allSelected;

                                        return (
                                            <div key={category} className="perm-category-box">
                                                <div className="perm-category-header">
                                                    <label className="checkbox-wrap category-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={allSelected}
                                                            ref={el => {
                                                                if (el) el.indeterminate = someSelected;
                                                            }}
                                                            onChange={e => {
                                                                setEditPerms(prev =>
                                                                    toggleSelectAllCategory(prev, permsList, e.target.checked)
                                                                );
                                                            }}
                                                        />
                                                        <span>{formatCategory(category)}</span>
                                                    </label>
                                                </div>
                                                <div className="perm-category-body">
                                                    {permsList.map(perm => (
                                                        <label key={perm.permissionId} className="checkbox-wrap perm-item-label" title={perm.description}>
                                                            <input
                                                                type="checkbox"
                                                                checked={editPerms.has(perm.name)}
                                                                onChange={() => {
                                                                    setEditPerms(prev =>
                                                                        togglePermissionInSet(prev, perm.name)
                                                                    );
                                                                }}
                                                            />
                                                            <div className="perm-checkbox-info">
                                                                <span className="perm-friendly-name">{getPermissionFriendlyName(perm.name)}</span>
                                                                {perm.description && (
                                                                    <span className="perm-desc">{perm.description}</span>
                                                                )}
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="modal-actions sticky-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setEditingRole(null)} disabled={actionLoading}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                                    {actionLoading ? <Loader2 size={13} className="spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Confirmation Modal ─── */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                variant={confirmModal.variant}
                icon={confirmModal.icon}
                title={confirmModal.title}
                description={confirmModal.description}
                notice={confirmModal.notice}
                confirmLabel={confirmModal.confirmLabel}
                isLoading={actionLoading}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(CONFIRM_CLOSED)}
            />
        </div>
    );
}
