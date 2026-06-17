import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface PasswordInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function PasswordInput({ value, onChange, placeholder = 'Enter password', className = '' }: PasswordInputProps) {
    const [visible, setVisible] = useState(false);
    return (
        <div className={`pwd-input-wrap ${className}`}>
            <input
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
            <button className="pwd-toggle" onClick={() => setVisible(v => !v)} tabIndex={-1} type="button">
                {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
        </div>
    );
}
