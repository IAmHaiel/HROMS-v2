interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtitle?: string;
    iconColor?: string;
    subtitleColor?: string;
    accentColor?: string;
}

export default function StatCard({ icon, label, value, subtitle, iconColor = 'var(--primary)', subtitleColor, accentColor = 'var(--primary)' }: StatCardProps) {
    return (
        <div
            style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '18px 18px 16px',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(15,23,42,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <div
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: `${iconColor}18`,
                        color: iconColor,
                    }}
                >
                    {icon}
                </div>
                <span style={{ fontSize: '0.63rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                    {label}
                </span>
            </div>
            <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginTop: 14, marginBottom: 0 }}>
                    {value}
                </div>
                {subtitle && (
                    <div style={{ marginTop: 6, fontSize: '0.72rem', fontWeight: 600, color: subtitleColor ?? 'var(--text-muted)', lineHeight: 1.4 }}>
                        {subtitle}
                    </div>
                )}
            </div>
            <div
                style={{
                    position: 'absolute',
                    left: 8,
                    right: 8,
                    bottom: 0,
                    height: 3,
                    borderRadius: 999,
                    background: accentColor,
                }}
            />
        </div>
    );
}
