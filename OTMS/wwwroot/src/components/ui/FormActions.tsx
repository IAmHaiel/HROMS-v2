import LoadingButton from './LoadingButton';

interface FormActionsProps {
    onCancel: () => void;
    onSubmit: () => void;
    submitting: boolean;
    submitLabel?: string;
    submitIcon?: React.ReactNode;
    cancelLabel?: string;
    disabled?: boolean;
    className?: string;
}

export default function FormActions({
    onCancel, onSubmit, submitting, submitLabel = 'Save', submitIcon, cancelLabel = 'Cancel', disabled, className = '',
}: FormActionsProps) {
    return (
        <div className={`modal-actions ${className}`}>
            <button className="btn" onClick={onCancel} disabled={submitting}>{cancelLabel}</button>
            <LoadingButton loading={submitting} icon={submitIcon} onClick={onSubmit} disabled={disabled}>
                {submitLabel}
            </LoadingButton>
        </div>
    );
}
