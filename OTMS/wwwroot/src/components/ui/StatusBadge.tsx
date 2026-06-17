interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md';
    className?: string;
}

const BADGE_CLASSES: Record<string, string> = {
    Draft: 'badge badge-gray',
    Pending: 'badge badge-blue',
    Assigned: 'badge badge-purple',
    'In Progress': 'badge badge-amber',
    Done: 'badge badge-blue',
    'Pending Admin Review': 'badge badge-purple',
    Completed: 'badge badge-green',
    Overdue: 'badge badge-red',
    Active: 'status-badge active',
    Deactivated: 'status-badge deactivated',
    'On Leave': 'status-badge pending-badge',
    Locked: 'status-badge locked',
    Successful: 'status-badge active',
    Failed: 'status-badge deactivated',
    Approved: 'badge badge-green',
    Rejected: 'badge badge-red',
};

export default function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
    const cls = BADGE_CLASSES[status] ?? 'badge badge-blue';
    const style = size === 'sm' ? { fontSize: '0.65rem', padding: '1px 8px' } : undefined;
    return <span className={`${cls} ${className}`} style={style}>{status}</span>;
}
