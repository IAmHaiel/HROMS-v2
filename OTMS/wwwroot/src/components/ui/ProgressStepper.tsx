interface Step {
    label: string;
    subLabel?: string;
}

interface ProgressStepperProps {
    steps: Step[];
    currentStep: number;
}

export default function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>
            {steps.map((step, i) => {
                const isCompleted = i < currentStep;
                const isActive = i === currentStep;
                const isLast = i === steps.length - 1;

                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    background: isCompleted ? 'var(--status-active)' : isActive ? 'var(--primary)' : 'var(--bg-main)',
                                    color: isCompleted || isActive ? '#fff' : 'var(--text-secondary)',
                                    border: isCompleted || isActive ? 'none' : '2px solid var(--border)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {isCompleted ? '✓' : i + 1}
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                {step.label}
                            </span>
                            {step.subLabel && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: -2 }}>
                                    {step.subLabel}
                                </span>
                            )}
                        </div>
                        {!isLast && (
                            <div
                                style={{
                                    flex: 1,
                                    height: 2,
                                    margin: '0 8px',
                                    marginBottom: 24,
                                    background: i < currentStep ? 'var(--status-active)' : 'var(--border)',
                                    transition: 'background 0.2s',
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
