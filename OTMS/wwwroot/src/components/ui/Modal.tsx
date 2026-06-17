import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const WIDTH_MAP = { sm: 420, md: 520, lg: 680, xl: 860 };

export default function Modal({ isOpen, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" style={{ maxWidth: WIDTH_MAP[size] }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3>{title}</h3>
                        {subtitle && <p className="modal-subtitle">{subtitle}</p>}
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={16} /></button>
                </div>
                <div className="modal-form">
                    {children}
                </div>
                {footer && <div className="modal-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>{footer}</div>}
            </div>
        </div>
    );
}
