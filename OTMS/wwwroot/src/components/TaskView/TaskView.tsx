import React, { useState, useEffect, useRef } from 'react';
import {
    Pencil, X, Package, Send, CheckCircle2,
    XCircle, Clock, AlertTriangle, ThumbsUp, RotateCcw,
} from 'lucide-react';
import './TaskView.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
type TaskStatus = 'Draft' | 'Assigned' | 'Pending' | 'In Progress' | 'Done' | 'Completed' | 'Overdue';
type ReviewState = 'none' | 'pending_review' | 'approved' | 'rejected';

export interface TaskViewTask {
    taskId: string;
    taskTitle: string;
    taskDescription: string;
    priority: Priority;
    dueAt: string | null;
    taskStatus: TaskStatus;
    taskRemarks?: string;
    assignedEmployee: string;
    createdByEmployee: string;
    assignedTo: string;
    createdAt: string;
}

export interface Comment {
    id: string;
    author: string;
    role: 'admin' | 'employee';
    text: string;
    timestamp: string;
    type?: 'message' | 'system';
}

interface ReviewHistoryEntry {
    action: 'submitted' | 'approved' | 'rejected' | 'reopened';
    by: string;
    at: string;
    note?: string;
}

interface TaskViewProps {
    task: TaskViewTask;
    onEdit: () => void;
    onReopen: () => void;
    onClose: () => void;
    onApprove?: (taskId: string) => void;
    onReject?: (taskId: string, reason: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isEffectivelyOverdue = (t: TaskViewTask): boolean =>
    t.taskStatus !== 'Completed' && !!t.dueAt && new Date(t.dueAt) < new Date();

const fmtDate = (d: string): string => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

const fmtDateTime = (d: string): string => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
    });
};

const statusBadgeClass = (s: string): string =>
({
    'Pending': 'tv-badge tv-badge-blue',
    'In Progress': 'tv-badge tv-badge-amber',
    'Completed': 'tv-badge tv-badge-green',
    'Overdue': 'tv-badge tv-badge-red',
    'Pending Review': 'tv-badge tv-badge-purple',
}[s] ?? 'tv-badge tv-badge-blue');

const priorityDotClass = (p: Priority): string =>
    ({ Critical: 'tv-prio-dot high', High: 'tv-prio-dot high', Medium: 'tv-prio-dot medium', Low: 'tv-prio-dot low' }[p]);

const PrioBadge: React.FC<{ p: Priority }> = ({ p }) => (
    <span className={`tv-badge ${p === 'Critical' || p === 'High' ? 'tv-badge-red' : p === 'Medium' ? 'tv-badge-amber' : 'tv-badge-green'}`}>
        {p}
    </span>
);

// ─── Mock seed data ───────────────────────────────────────────────────────────

const MOCK_COMMENTS: Comment[] = [
    {
        id: '1', author: 'Operations Admin', role: 'admin', type: 'message',
        text: 'Please review the task details and confirm once you start working on this.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
        id: '2', author: 'Assigned Employee', role: 'employee', type: 'message',
        text: "Got it! I'll begin shortly and update the status once in progress.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
];

// ─── Reject Modal ─────────────────────────────────────────────────────────────

const RejectModal: React.FC<{
    onConfirm: (reason: string) => void;
    onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    return (
        <div className="tv-modal-overlay" onClick={onCancel}>
            <div className="tv-modal" onClick={e => e.stopPropagation()}>
                <div className="tv-modal-header">
                    <div className="tv-modal-icon tv-modal-icon-danger">
                        <XCircle size={20} />
                    </div>
                    <div>
                        <h4 className="tv-modal-title">Reject Completion</h4>
                        <p className="tv-modal-sub">Provide a reason so the employee can revise.</p>
                    </div>
                </div>
                <textarea
                    className="tv-modal-textarea"
                    placeholder="e.g. Missing attachment, incomplete encoding, wrong format…"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                    autoFocus
                />
                <div className="tv-modal-actions">
                    <button className="tv-btn tv-btn-outline" onClick={onCancel}>Cancel</button>
                    <button
                        className="tv-btn tv-btn-danger"
                        onClick={() => reason.trim() && onConfirm(reason.trim())}
                        disabled={!reason.trim()}
                    >
                        <XCircle size={13} /> Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

const TaskView: React.FC<TaskViewProps> = ({
    task, onEdit, onReopen, onClose, onApprove, onReject,
}) => {
    const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
    const [reviewState, setReviewState] = useState<ReviewState>(
        task.taskStatus === 'Completed' ? 'approved' :
            task.taskStatus === 'In Progress' ? 'pending_review' : 'none'
    );
    const [reviewHistory, setReviewHistory] = useState<ReviewHistoryEntry[]>([]);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [localStatus, setLocalStatus] = useState<TaskStatus>(task.taskStatus);

    const commentsEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const currentUser = localStorage.getItem('employeeName') ?? 'Admin';

    const od = isEffectivelyOverdue({ ...task, taskStatus: localStatus });
    const effectiveStatus = od ? 'Overdue' : localStatus;

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments, activeTab]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // ── Comment helpers ──
    const addSystemComment = (text: string) => {
        setComments(prev => [...prev, {
            id: Date.now().toString(),
            author: 'System',
            role: 'admin',
            type: 'system',
            text,
            timestamp: new Date().toISOString(),
        }]);
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewComment(e.target.value);
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
        }
    };

    const handleSend = () => {
        const text = newComment.trim();
        if (!text || sending) return;
        setSending(true);
        setComments(prev => [...prev, {
            id: Date.now().toString(),
            author: currentUser,
            role: 'admin',
            type: 'message',
            text,
            timestamp: new Date().toISOString(),
        }]);
        setNewComment('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setSending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ── Review actions ──
    const handleRequestReview = () => {
        setReviewState('pending_review');
        setLocalStatus('In Progress');
        setReviewHistory(prev => [...prev, {
            action: 'submitted', by: task.assignedEmployee,
            at: new Date().toISOString(),
        }]);
        addSystemComment(`${task.assignedEmployee} submitted this task for completion review.`);
    };

    const handleApprove = () => {
        setReviewState('approved');
        setLocalStatus('Completed');
        setReviewHistory(prev => [...prev, {
            action: 'approved', by: currentUser,
            at: new Date().toISOString(),
        }]);
        addSystemComment(`✓ ${currentUser} approved completion of this task.`);
        onApprove?.(task.taskId);
    };

    const handleReject = (reason: string) => {
        setShowRejectModal(false);
        setReviewState('rejected');
        setLocalStatus('In Progress');
        setReviewHistory(prev => [...prev, {
            action: 'rejected', by: currentUser,
            at: new Date().toISOString(), note: reason,
        }]);
        addSystemComment(`✗ ${currentUser} rejected completion: "${reason}"`);
        onReject?.(task.taskId, reason);
    };

    const handleReopen = () => {
        setReviewState('none');
        setLocalStatus('Pending');
        setReviewHistory(prev => [...prev, {
            action: 'reopened', by: currentUser,
            at: new Date().toISOString(),
        }]);
        addSystemComment(`${currentUser} reopened this task.`);
        onReopen();
    };

    // ── Review banner ──
    const renderReviewBanner = () => {
        if (reviewState === 'pending_review') return (
            <div className="tv-review-banner tv-review-pending">
                <div className="tv-review-banner-left">
                    <Clock size={16} />
                    <div>
                        <span className="tv-review-banner-title">Awaiting completion review</span>
                        <span className="tv-review-banner-sub">
                            {task.assignedEmployee} marked this task as done. Review and approve or reject.
                        </span>
                    </div>
                </div>
                <div className="tv-review-banner-actions">
                    <button className="tv-btn tv-btn-danger-solid" onClick={() => setShowRejectModal(true)}>
                        <XCircle size={13} /> Reject
                    </button>
                    <button className="tv-btn tv-btn-success" onClick={handleApprove}>
                        <CheckCircle2 size={13} /> Approve
                    </button>
                </div>
            </div>
        );

        if (reviewState === 'approved') return (
            <div className="tv-review-banner tv-review-approved">
                <div className="tv-review-banner-left">
                    <ThumbsUp size={16} />
                    <div>
                        <span className="tv-review-banner-title">Completion approved</span>
                        <span className="tv-review-banner-sub">This task has been marked as complete.</span>
                    </div>
                </div>
                <button className="tv-btn tv-btn-ghost-sm" onClick={handleReopen}>
                    <RotateCcw size={12} /> Reopen
                </button>
            </div>
        );

        if (reviewState === 'rejected') return (
            <div className="tv-review-banner tv-review-rejected">
                <div className="tv-review-banner-left">
                    <AlertTriangle size={16} />
                    <div>
                        <span className="tv-review-banner-title">Completion rejected</span>
                        <span className="tv-review-banner-sub">
                            The employee needs to revise and resubmit.
                        </span>
                    </div>
                </div>
                <button className="tv-btn tv-btn-outline-sm" onClick={handleRequestReview}>
                    <Clock size={12} /> Re-submit
                </button>
            </div>
        );

        // none — show simulate button (demo only; in real app employee triggers this)
        return (
            <div className="tv-review-banner tv-review-none">
                <div className="tv-review-banner-left">
                    <Clock size={15} />
                    <div>
                        <span className="tv-review-banner-title">Task in progress</span>
                        <span className="tv-review-banner-sub">
                            Waiting for {task.assignedEmployee} to submit for review.
                        </span>
                    </div>
                </div>
                <button className="tv-btn tv-btn-ghost-sm" onClick={handleRequestReview}
                    title="Simulate employee submitting for review">
                    Simulate submit ↗
                </button>
            </div>
        );
    };

    return (
        <>
            <div className="tv-backdrop" onClick={onClose} />

            <div className="tv-panel" role="dialog" aria-modal="true" aria-label={task.taskTitle}>

                {/* ── Header ── */}
                <div className="tv-header">
                    <div className="tv-header-left">
                        <span className={priorityDotClass(task.priority)} />
                        <div className="tv-header-text">
                            <h2 className="tv-title">{task.taskTitle}</h2>
                            <p className="tv-subtitle">
                                Created by <strong>{task.createdByEmployee}</strong>
                                {task.createdAt && <> · {fmtDate(task.createdAt)}</>}
                            </p>
                        </div>
                    </div>
                    <div className="tv-header-actions">
                        <button className="tv-btn tv-btn-primary" onClick={onEdit}>
                            <Pencil size={13} /> Edit
                        </button>
                        <button className="tv-icon-btn" onClick={onClose} aria-label="Close">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Review banner ── */}
                {renderReviewBanner()}

                {/* ── Mobile tabs ── */}
                <div className="tv-tabs">
                    <button className={`tv-tab${activeTab === 'details' ? ' active' : ''}`}
                        onClick={() => setActiveTab('details')}>Details</button>
                    <button className={`tv-tab${activeTab === 'comments' ? ' active' : ''}`}
                        onClick={() => setActiveTab('comments')}>
                        Comments <span className="tv-tab-count">{comments.length}</span>
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="tv-body">

                    {/* ── Left: Details ── */}
                    <div className={`tv-details${activeTab === 'details' ? ' tv-mobile-visible' : ''}`}>

                        {/* Meta chips */}
                        <div className="tv-meta-grid">
                            <div className="tv-meta-chip">
                                <span className="tv-meta-label">Status</span>
                                <span className={statusBadgeClass(
                                    reviewState === 'pending_review' ? 'Pending Review' : effectiveStatus
                                )}>
                                    {reviewState === 'pending_review' ? 'Pending Review' : effectiveStatus}
                                </span>
                            </div>
                            <div className="tv-meta-chip">
                                <span className="tv-meta-label">Priority</span>
                                <PrioBadge p={task.priority} />
                            </div>
                            <div className="tv-meta-chip">
                                <span className="tv-meta-label">Due Date</span>
                                <span className={`tv-meta-value${od ? ' tv-overdue' : ''}`}>
                                    {task.dueAt ? fmtDate(task.dueAt) : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Assigned to */}
                        <div className="tv-section">
                            <span className="tv-section-label">Assigned To</span>
                            <div className="tv-assignee">
                                <div className="tv-avatar tv-avatar-blue">
                                    {(task.assignedEmployee || '?').charAt(0).toUpperCase()}
                                </div>
                                <span className="tv-assignee-name">
                                    {task.assignedEmployee || 'Unassigned'}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="tv-section">
                            <span className="tv-section-label">Description</span>
                            <div className="tv-text-box">
                                {task.taskDescription
                                    ? task.taskDescription
                                    : <span className="tv-empty-text">No description provided.</span>}
                            </div>
                        </div>

                        {/* Remarks */}
                        {task.taskRemarks && (
                            <div className="tv-section">
                                <span className="tv-section-label">Remarks</span>
                                <div className="tv-text-box tv-text-box-remarks">{task.taskRemarks}</div>
                            </div>
                        )}

                        {/* Review history */}
                        {reviewHistory.length > 0 && (
                            <div className="tv-section">
                                <span className="tv-section-label">Review History</span>
                                <div className="tv-review-history">
                                    {reviewHistory.map((h, i) => (
                                        <div key={i} className={`tv-rh-item tv-rh-${h.action}`}>
                                            <div className={`tv-rh-dot tv-rh-dot-${h.action}`} />
                                            <div className="tv-rh-content">
                                                <span className="tv-rh-label">
                                                    {h.action === 'submitted' && 'Submitted for review'}
                                                    {h.action === 'approved' && 'Completion approved'}
                                                    {h.action === 'rejected' && 'Completion rejected'}
                                                    {h.action === 'reopened' && 'Task reopened'}
                                                </span>
                                                <span className="tv-rh-meta">by {h.by} · {fmtDateTime(h.at)}</span>
                                                {h.note && <span className="tv-rh-note">"{h.note}"</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="tv-timeline">
                            <div className="tv-timeline-item">
                                <span className="tv-timeline-dot" />
                                <span className="tv-timeline-text">
                                    Task created · {task.createdAt ? fmtDateTime(task.createdAt) : '—'}
                                </span>
                            </div>
                            {task.dueAt && (
                                <div className="tv-timeline-item">
                                    <span className={`tv-timeline-dot${od ? ' tv-dot-red' : ' tv-dot-blue'}`} />
                                    <span className="tv-timeline-text">Due · {fmtDateTime(task.dueAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Comments ── */}
                    <div className={`tv-comments${activeTab === 'comments' ? ' tv-mobile-visible' : ''}`}>
                        <div className="tv-comments-header">
                            <span className="tv-comments-title">Comments</span>
                            <span className="tv-comments-count">{comments.filter(c => c.type !== 'system').length}</span>
                        </div>

                        <div className="tv-thread">
                            {comments.length === 0 ? (
                                <div className="tv-thread-empty">
                                    <Package size={22} strokeWidth={1.5} />
                                    <p>No comments yet.</p>
                                    <span>Start the conversation below.</span>
                                </div>
                            ) : comments.map(c => {
                                if (c.type === 'system') return (
                                    <div key={c.id} className="tv-system-msg">
                                        <span className="tv-system-dot" />
                                        <span>{c.text}</span>
                                        <span className="tv-system-time">{fmtDateTime(c.timestamp)}</span>
                                    </div>
                                );
                                const isMe = c.author === currentUser;
                                return (
                                    <div key={c.id} className={`tv-msg${isMe ? ' tv-msg-mine' : ' tv-msg-theirs'}`}>
                                        {!isMe && (
                                            <div className="tv-msg-avatar">{c.author.charAt(0).toUpperCase()}</div>
                                        )}
                                        <div className="tv-msg-body">
                                            {!isMe && <span className="tv-msg-author">{c.author}</span>}
                                            <div className={`tv-bubble${isMe ? ' tv-bubble-mine' : ' tv-bubble-theirs'}`}>
                                                {c.text}
                                            </div>
                                            <span className="tv-msg-time">{fmtDateTime(c.timestamp)}</span>
                                        </div>
                                        {isMe && (
                                            <div className="tv-msg-avatar tv-avatar-self">
                                                {c.author.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={commentsEndRef} />
                        </div>

                        <div className="tv-input-area">
                            <div className="tv-input-row">
                                <div className="tv-self-avatar">{currentUser.charAt(0).toUpperCase()}</div>
                                <div className="tv-input-box">
                                    <textarea
                                        ref={textareaRef}
                                        className="tv-textarea"
                                        placeholder="Write a comment… (Enter to send)"
                                        value={newComment}
                                        onChange={handleCommentChange}
                                        onKeyDown={handleKeyDown}
                                        rows={1}
                                        disabled={sending}
                                    />
                                    <button className="tv-send-btn" onClick={handleSend}
                                        disabled={!newComment.trim() || sending} aria-label="Send">
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                            <p className="tv-input-hint">Shift + Enter for new line</p>
                        </div>
                    </div>
                </div>
            </div>

            {showRejectModal && (
                <RejectModal
                    onConfirm={handleReject}
                    onCancel={() => setShowRejectModal(false)}
                />
            )}
        </>
    );
};

export default TaskView;