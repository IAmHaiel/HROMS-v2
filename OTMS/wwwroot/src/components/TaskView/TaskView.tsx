import React, { useState, useEffect, useRef } from 'react';
import { Pencil, X, Package, Send } from 'lucide-react';
import './TaskView.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'High' | 'Medium' | 'Low';
type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

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
}

interface TaskViewProps {
    task: TaskViewTask;
    onEdit: () => void;
    onReopen: () => void;
    onClose: () => void;
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
}[s] ?? 'tv-badge tv-badge-blue');

const priorityDotClass = (p: Priority): string =>
    ({ High: 'tv-prio-dot high', Medium: 'tv-prio-dot medium', Low: 'tv-prio-dot low' }[p]);

const PrioBadge: React.FC<{ p: Priority }> = ({ p }) => (
    <span className={`tv-badge ${p === 'High' ? 'tv-badge-red' : p === 'Medium' ? 'tv-badge-amber' : 'tv-badge-green'}`}>
        {p}
    </span>
);

// ─── Mock seed comments ───────────────────────────────────────────────────────

const MOCK_COMMENTS: Comment[] = [
    {
        id: '1',
        author: 'Operations Admin',
        role: 'admin',
        text: 'Please review the task details and confirm once you start working on this.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
        id: '2',
        author: 'Assigned Employee',
        role: 'employee',
        text: 'Got it! I\'ll begin shortly and update the status once in progress.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

const TaskView: React.FC<TaskViewProps> = ({ task, onEdit, onReopen, onClose }) => {
    const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
    const commentsEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const currentUser = localStorage.getItem('employeeName') ?? 'Admin';
    const od = isEffectivelyOverdue(task);
    const effectiveStatus = od ? 'Overdue' : task.taskStatus;

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments, activeTab]);

    // Auto-resize textarea
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

        // TODO: replace with API call when backend is ready
        const comment: Comment = {
            id: Date.now().toString(),
            author: currentUser,
            role: 'admin',
            text,
            timestamp: new Date().toISOString(),
        };
        setComments(prev => [...prev, comment]);
        setNewComment('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setSending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

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
                        {task.taskStatus === 'Completed' && (
                            <button className="tv-btn tv-btn-ghost-danger" onClick={onReopen}>
                                Reopen
                            </button>
                        )}
                        <button className="tv-btn tv-btn-primary" onClick={onEdit}>
                            <Pencil size={13} /> Edit
                        </button>
                        <button className="tv-icon-btn" onClick={onClose} aria-label="Close">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Mobile tab switcher (hidden on wide) ── */}
                <div className="tv-tabs">
                    <button
                        className={`tv-tab${activeTab === 'details' ? ' active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </button>
                    <button
                        className={`tv-tab${activeTab === 'comments' ? ' active' : ''}`}
                        onClick={() => setActiveTab('comments')}
                    >
                        Comments
                        <span className="tv-tab-count">{comments.length}</span>
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="tv-body">

                    {/* ── Left: Task Details ── */}
                    <div className={`tv-details${activeTab === 'details' ? ' tv-mobile-visible' : ''}`}>

                        {/* Status / Priority / Due */}
                        <div className="tv-meta-grid">
                            <div className="tv-meta-chip">
                                <span className="tv-meta-label">Status</span>
                                <span className={statusBadgeClass(effectiveStatus)}>{effectiveStatus}</span>
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
                                    : <span className="tv-empty-text">No description provided.</span>
                                }
                            </div>
                        </div>

                        {/* Remarks */}
                        {task.taskRemarks && (
                            <div className="tv-section">
                                <span className="tv-section-label">Remarks</span>
                                <div className="tv-text-box tv-text-box-remarks">
                                    {task.taskRemarks}
                                </div>
                            </div>
                        )}

                        {/* Timeline strip */}
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
                                    <span className="tv-timeline-text">
                                        Due · {fmtDateTime(task.dueAt)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Comments ── */}
                    <div className={`tv-comments${activeTab === 'comments' ? ' tv-mobile-visible' : ''}`}>

                        <div className="tv-comments-header">
                            <span className="tv-comments-title">Comments</span>
                            <span className="tv-comments-count">{comments.length}</span>
                        </div>

                        {/* Thread */}
                        <div className="tv-thread">
                            {comments.length === 0 ? (
                                <div className="tv-thread-empty">
                                    <Package size={22} strokeWidth={1.5} />
                                    <p>No comments yet.</p>
                                    <span>Start the conversation below.</span>
                                </div>
                            ) : (
                                comments.map(c => {
                                    const isMe = c.author === currentUser;
                                    return (
                                        <div key={c.id} className={`tv-msg${isMe ? ' tv-msg-mine' : ' tv-msg-theirs'}`}>
                                            {!isMe && (
                                                <div className="tv-msg-avatar">
                                                    {c.author.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="tv-msg-body">
                                                {!isMe && (
                                                    <span className="tv-msg-author">{c.author}</span>
                                                )}
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
                                })
                            )}
                            <div ref={commentsEndRef} />
                        </div>

                        {/* Input */}
                        <div className="tv-input-area">
                            <div className="tv-input-row">
                                <div className="tv-self-avatar">
                                    {currentUser.charAt(0).toUpperCase()}
                                </div>
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
                                    <button
                                        className="tv-send-btn"
                                        onClick={handleSend}
                                        disabled={!newComment.trim() || sending}
                                        aria-label="Send comment"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                            <p className="tv-input-hint">Shift + Enter for new line</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TaskView;