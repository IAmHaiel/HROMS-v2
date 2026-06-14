import React, { useEffect, useRef } from "react";
import "./ConfirmationModal.css";

export type ConfirmationVariant =
    | "danger"
    | "warning"
    | "info"
    | "success"
    | "neutral";

export interface ConfirmationModalProps {
    isOpen: boolean;
    variant?: ConfirmationVariant;
    icon?: string;
    title: string;
    description: React.ReactNode;
    notice?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const VARIANT_DEFAULTS: Record<
    ConfirmationVariant,
    { icon: string; confirmLabel: string }
> = {
    danger: { icon: "ti-trash", confirmLabel: "Delete" },
    warning: { icon: "ti-alert-triangle", confirmLabel: "Proceed" },
    info: { icon: "ti-info-circle", confirmLabel: "Confirm" },
    success: { icon: "ti-check", confirmLabel: "Save" },
    neutral: { icon: "ti-help-circle", confirmLabel: "Confirm" },
};

const NOTICE_ICONS: Record<ConfirmationVariant, string> = {
    danger: "ti-alert-triangle",
    warning: "ti-alert-circle",
    info: "ti-info-circle",
    success: "ti-lock",
    neutral: "ti-info-circle",
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    variant = "neutral",
    icon,
    title,
    description,
    notice,
    confirmLabel,
    cancelLabel = "Cancel",
    isLoading = false,
    onConfirm,
    onCancel,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    const defaults = VARIANT_DEFAULTS[variant];
    const resolvedIcon = icon ?? defaults.icon;
    const resolvedConfirmLabel = confirmLabel ?? defaults.confirmLabel;
    const noticeIcon = NOTICE_ICONS[variant];

    useEffect(() => {
        if (isOpen) {
            confirmBtnRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") onCancel();
            if (e.key === "Enter" && !isLoading) onConfirm();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isLoading, onConfirm, onCancel]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onCancel();
    };

    if (!isOpen) return null;

    return (
        <div
            className={`cm-overlay`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cm-title"
            aria-describedby="cm-desc"
            onClick={handleOverlayClick}
        >
            <div className={`cm-card cm-variant-${variant}`} ref={modalRef}>

                <div className="cm-header">
                    <div className={`cm-icon-circle cm-icon-${variant}`}>
                        <i className={`ti ${resolvedIcon}`} aria-hidden="true" />
                    </div>
                    <div className="cm-header-text">
                        <p className="cm-title" id="cm-title">{title}</p>
                        <p className="cm-desc" id="cm-desc">{description}</p>
                    </div>
                </div>

                {notice && (
                    <div className={`cm-notice cm-notice-${variant}`}>
                        <i className={`ti ${noticeIcon} cm-notice-icon`} aria-hidden="true" />
                        <span>{notice}</span>
                    </div>
                )}

                <div className="cm-actions">
                    <button
                        type="button"
                        className="cm-btn cm-btn-cancel"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`cm-btn cm-btn-confirm cm-btn-${variant}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                        ref={confirmBtnRef}
                    >
                        {isLoading ? (
                            <>
                                <i className="ti ti-loader-2 cm-spin" aria-hidden="true" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <i className={`ti ${resolvedIcon}`} aria-hidden="true" />
                                <span>{resolvedConfirmLabel}</span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ConfirmationModal;