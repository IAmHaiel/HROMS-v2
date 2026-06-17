import { Loader2 } from 'lucide-react';

interface LoadingButtonProps {
    loading: boolean;
    loadingText?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'outline' | 'danger';
    className?: string;
    type?: 'button' | 'submit';
}

export default function LoadingButton({
    loading, loadingText, icon, children, onClick, disabled, variant = 'primary', className = '', type = 'button',
}: LoadingButtonProps) {
    const cls = variant === 'primary' ? 'btn btn-primary' : variant === 'outline' ? 'btn btn-outline' : 'btn btn-danger';
    return (
        <button className={`${cls} ${className}`} onClick={onClick} disabled={disabled || loading} type={type}>
            {loading
                ? <><Loader2 size={13} className="spin" /> {loadingText || 'Loading…'}</>
                : <>{icon} {children}</>
            }
        </button>
    );
}
