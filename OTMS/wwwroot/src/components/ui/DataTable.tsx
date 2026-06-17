import StatusBadge from './StatusBadge';

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
}

export default function DataTable<T extends Record<string, any>>({ columns, data, onRowClick }: DataTableProps<T>) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {columns.map(col => (
                            <th
                                key={col.header}
                                style={{
                                    padding: '12px 14px',
                                    textAlign: 'left',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    color: 'var(--text-secondary)',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr
                            key={i}
                            onClick={() => onRowClick?.(row)}
                            style={{
                                borderBottom: '1px solid var(--border)',
                                cursor: onRowClick ? 'pointer' : 'default',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = 'var(--bg-main)'; }}
                            onMouseLeave={e => { if (onRowClick) e.currentTarget.style.background = ''; }}
                        >
                            {columns.map(col => {
                                const value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
                                return (
                                    <td key={col.header} style={{ padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                        {value ?? '—'}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
