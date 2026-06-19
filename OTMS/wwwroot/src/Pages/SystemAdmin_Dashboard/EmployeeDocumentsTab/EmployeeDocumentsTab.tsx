import React, { useState, useEffect } from 'react';
import {
    FileText, Download, Eye, Upload, Search,
    CheckCircle2, Clock, Archive, AlertCircle, Loader2,
    Plus, Calendar, User, Tag, Info, X, Pencil,
} from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import FormModal from '../../../components/FormModal/FormModal';
import StatusBadge from '../../../components/ui/StatusBadge';

const PAGE_SIZE = 15;

const DOC_TYPES = [
    'Resume/CV',
    'Employment Contracts',
    'Government Records',
    'Certificates',
    'Performance Evaluations',
    'Disciplinary Records',
];

const STATUS_META: Record<string, { label: string; icon: React.ReactElement }> = {
    Active: { label: 'Active', icon: <CheckCircle2 size={11} /> },
    Archived: { label: 'Archived', icon: <Archive size={11} /> },
};

const fmt = (bytes: any) => {
    if (!bytes) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const fmtDate = (d: any) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function UploadDocumentModal({ employees, onClose, onUploaded }: { employees: any[], onClose: () => void, onUploaded: () => void }) {
    const [step, setStep] = useState(1);
    const [searchEmp, setSearchEmp] = useState('');
    const [selectedEmp, setSelectedEmp] = useState<any>(null);
    const [docType, setDocType] = useState(DOC_TYPES[0]);
    const [docTitle, setDocTitle] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<any>({});
    const fileRef = React.useRef<HTMLInputElement>(null);

    const filteredEmps = employees.filter(e => {
        const name = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase();
        const num = (e.employeeNumber || '').toLowerCase();
        const q = searchEmp.toLowerCase();
        return name.includes(q) || num.includes(q);
    });

    const validateFile = (f: File) => {
        const ext = '.' + f.name.split('.').pop()?.toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return 'Invalid file format. Only PDF, JPG, and PNG are allowed.';
        }
        if (f.size > MAX_FILE_SIZE) {
            return 'File exceeds maximum allowable size of 10MB.';
        }
        return '';
    };

    const handleFileChange = (f: File | null) => {
        if (!f) return;
        const err = validateFile(f);
        if (err) {
            setFieldErrors((p: any) => ({ ...p, file: err }));
            return;
        }
        setFile(f);
        setFieldErrors((p: any) => ({ ...p, file: undefined }));
    };

    const validate = () => {
        const errs: any = {};
        if (!selectedEmp) errs.emp = 'Select an employee.';
        if (!docType) errs.docType = 'Select a document type.';
        if (!docTitle.trim()) errs.docTitle = 'Document title is required.';
        if (!issueDate) errs.issueDate = 'Issue date is required.';
        if (!file) errs.file = 'Please attach a file.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            const fd = new FormData();
            fd.append('DocumentType', docType);
            fd.append('DocumentTitle', docTitle.trim());
            fd.append('IssueDate', new Date(issueDate).toISOString());
            if (file) fd.append('File', file);

            const url = `/api/systemadmin/documents/upload?employeeNumber=${encodeURIComponent(selectedEmp.employeeNumber)}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Upload failed.');
            }
            const result = await res.json();
            if (!result.isSuccess) throw new Error(result.message || 'Upload failed.');
            onUploaded();
            onClose();
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <FormModal isOpen onClose={onClose} title="Upload Document"
            subtitle={`Step ${step} of 2 — ${step === 1 ? 'Choose employee' : 'Document details'}`} size="md" confirmOnCancel={true}
        >
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[1, 2].map(s => (
                    <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: s <= step ? 'var(--primary)' : 'var(--border)' }} />
                ))}
            </div>

            {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--status-failed-bg)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--status-failed)' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{error}</span>
                </div>
            )}

            {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input type="text" placeholder="Search by name or employee ID…" value={searchEmp} onChange={e => setSearchEmp(e.target.value)} className="fm-input" style={{ paddingLeft: 36 }} autoFocus />
                    </div>
                    {fieldErrors.emp && <span style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{fieldErrors.emp}</span>}
                    <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {filteredEmps.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: 13 }}>No employees found</div>
                        ) : filteredEmps.map(emp => {
                            const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeNumber;
                            const selected = selectedEmp?.employeeNumber === emp.employeeNumber;
                            return (
                                <div key={emp.employeeNumber} onClick={() => setSelectedEmp(emp)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${selected ? '#4318ff' : '#e2e8f0'}`, background: selected ? 'rgba(67,24,255,0.04)' : '#fff', transition: 'all 0.15s' }}>
                                    <div className="emp-avatar" style={{ flexShrink: 0, width: 36, height: 36, fontSize: 14 }}>{(emp.firstName?.[0] || emp.lastName?.[0] || '?').toUpperCase()}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>#{emp.employeeNumber} · {emp.role || '—'}</div>
                                    </div>
                                    {selected && <CheckCircle2 size={16} color="#4318ff" />}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <button className="btn btn-primary" onClick={() => { if (!selectedEmp) { setFieldErrors((p: any) => ({ ...p, emp: 'Select an employee.' })); return; } setStep(2); }} style={{ padding: '9px 24px', borderRadius: 10 }}>Continue →</button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(67,24,255,0.04)', border: '1px solid rgba(67,24,255,0.15)', borderRadius: 10, padding: '10px 14px' }}>
                        <div className="emp-avatar" style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}>{(selectedEmp.firstName?.[0] || selectedEmp.lastName?.[0] || '?').toUpperCase()}</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{`${selectedEmp.firstName || ''} ${selectedEmp.lastName || ''}`.trim() || selectedEmp.employeeNumber}</div>
                            <div style={{ fontSize: 11, color: '#4318ff' }}>#{selectedEmp.employeeNumber}</div>
                        </div>
                        <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', fontSize: 11, color: '#4318ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Change</button>
                    </div>

                    <div className="fm-field">
                        <label className="fm-label">Document Type <span style={{ color: '#ef4444' }}>*</span></label>
                        <select className="fm-select" value={docType} onChange={e => { setDocType(e.target.value); setFieldErrors((p: any) => ({ ...p, docType: undefined })); }} style={fieldErrors.docType ? { borderColor: '#ef4444' } : {}}>
                            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {fieldErrors.docType && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{fieldErrors.docType}</span>}
                    </div>

                    <div className="fm-field">
                        <label className="fm-label">Document Title <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="text" className="fm-input" placeholder="e.g. Updated Resume, 2024 Performance Review" value={docTitle} onChange={e => { setDocTitle(e.target.value); setFieldErrors((p: any) => ({ ...p, docTitle: undefined })); }} style={fieldErrors.docTitle ? { borderColor: '#ef4444' } : {}} />
                        {fieldErrors.docTitle && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{fieldErrors.docTitle}</span>}
                    </div>

                    <div className="fm-field">
                        <label className="fm-label"><Calendar size={13} /> Issue Date <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="date" className="fm-input" value={issueDate} onChange={e => { setIssueDate(e.target.value); setFieldErrors((p: any) => ({ ...p, issueDate: undefined })); }} style={fieldErrors.issueDate ? { borderColor: '#ef4444' } : {}} />
                        {fieldErrors.issueDate && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{fieldErrors.issueDate}</span>}
                    </div>

                    <div className="fm-field">
                        <label className="fm-label"><FileText size={13} /> File <span style={{ color: '#ef4444' }}>*</span></label>
                        <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${fieldErrors.file ? '#ef4444' : '#cbd5e1'}`, borderRadius: 12, padding: '24px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                            {file ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                    <FileText size={28} color="#4318ff" />
                                    <div><div style={{ fontWeight: 600, fontSize: 13 }}>{file.name}</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{fmt(file.size)}</div></div>
                                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} style={{ fontSize: 11, color: '#ee5d50', background: 'none', border: 'none', cursor: 'pointer' }}>Remove file</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                                    <Upload size={24} />
                                    <div><span style={{ fontWeight: 600, color: '#4318ff' }}>Click to browse</span> or drag & drop</div>
                                    <div style={{ fontSize: 11 }}>PDF, JPG, PNG · max 10 MB</div>
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => handleFileChange(e.target.files?.[0] || null)} />
                        {fieldErrors.file && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{fieldErrors.file}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                        <button className="btn" onClick={() => setStep(1)} disabled={submitting} style={{ padding: '9px 18px', borderRadius: 10 }}>← Back</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ padding: '9px 24px', borderRadius: 10 }}>
                            {submitting ? <><Loader2 size={13} className="fm-spin" /> Uploading…</> : <><Upload size={13} /> Upload Document</>}
                        </button>
                    </div>
                </div>
            )}
        </FormModal>
    );
}

function UpdateDocumentModal({ doc, onClose, onUpdated }: { doc: any, onClose: () => void, onUpdated: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileRef = React.useRef<HTMLInputElement>(null);

    const handleSubmit = async () => {
        if (!file) { setError('Please select a file.'); return; }
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) { setError('Invalid format. Only PDF, JPG, PNG allowed.'); return; }
        if (file.size > MAX_FILE_SIZE) { setError('File exceeds 10MB limit.'); return; }
        setSubmitting(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            const fd = new FormData();
            fd.append('File', file);
            const res = await fetch(`/api/systemadmin/documents/${doc.employeeAttachmentId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Update failed.');
            }
            const result = await res.json();
            if (!result.isSuccess) throw new Error(result.message || 'Update failed.');
            onUpdated();
            onClose();
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <FormModal isOpen onClose={onClose} title="Update Document — New Version"
            subtitle={`Upload a new version of "${doc.documentTitle || doc.fileName}"`} size="sm" confirmOnCancel={true}
        >
            {error && <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--status-failed-bg)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--status-failed)' }}><AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span></div>}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Current version</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.fileName} <span className="version-chip" style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: '#e2e8f0', marginLeft: 6 }}>v{doc.version}</span></div>
            </div>
            <div className="fm-field">
                <label className="fm-label"><FileText size={13} /> New File <span style={{ color: '#ef4444' }}>*</span></label>
                <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${error ? '#ef4444' : '#cbd5e1'}`, borderRadius: 12, padding: '24px 20px', textAlign: 'center', cursor: 'pointer' }}>
                    {file ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <FileText size={28} color="#4318ff" />
                            <div><div style={{ fontWeight: 600, fontSize: 13 }}>{file.name}</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{fmt(file.size)}</div></div>
                            <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} style={{ fontSize: 11, color: '#ee5d50', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                            <Upload size={24} />
                            <div><span style={{ fontWeight: 600, color: '#4318ff' }}>Click to browse</span></div>
                            <div style={{ fontSize: 11 }}>PDF, JPG, PNG · max 10 MB</div>
                        </div>
                    )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(''); } }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button className="btn" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10 }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ padding: '9px 24px', borderRadius: 10 }}>
                    {submitting ? <><Loader2 size={13} className="fm-spin" /> Uploading…</> : <><Upload size={13} /> Upload New Version</>}
                </button>
            </div>
        </FormModal>
    );
}

function DetailModal({ doc, onClose, onArchive, onUpdate }: { doc: any, onClose: () => void, onArchive: () => void, onUpdate: () => void }) {
    const isArchived = doc.isArchived;
    const empName = doc.employeeName || `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || '—';
    return (
        <FormModal isOpen onClose={onClose} title="Document Details" subtitle={`${doc.documentTitle || doc.documentType} — ${empName}`} size="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginBottom: 18, background: isArchived ? 'rgba(100,116,139,0.08)' : 'var(--status-active-bg)', border: `1px solid ${isArchived ? 'rgba(100,116,139,0.2)' : 'rgba(5,150,105,0.2)'}`, fontSize: 13, fontWeight: 600, color: isArchived ? 'var(--text-secondary)' : 'var(--status-active)' }}>
                {isArchived ? <Archive size={14} /> : <CheckCircle2 size={14} />}
                {isArchived ? 'This document has been archived.' : 'This document is active.'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div className="emp-avatar" style={{ width: 40, height: 40, flexShrink: 0 }}>{(doc.firstName?.[0] || doc.lastName?.[0] || '?').toUpperCase()}</div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{empName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>#{doc.employeeNumber}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 18 }}>
                {[
                    { label: 'Document Type', value: doc.documentType, icon: <Tag size={11} /> },
                    { label: 'Title', value: doc.documentTitle || '—', icon: <FileText size={11} /> },
                    { label: 'Version', value: `v${doc.version}`, icon: <Clock size={11} /> },
                    { label: 'Issue Date', value: fmtDate(doc.issueDate), icon: <Calendar size={11} /> },
                    { label: 'File Name', value: doc.fileName, icon: <FileText size={11} /> },
                    { label: 'File Size', value: fmt(doc.fileSize), icon: <Info size={11} /> },
                ].map(({ label, value, icon }) => (
                    <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{icon} {label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-word' }}>{value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10 }}>Close</button>
                <button className="btn btn-primary" onClick={() => window.open(doc.fileUrl, '_blank')} style={{ padding: '9px 20px', borderRadius: 10 }}><Download size={13} /> Download</button>
                {!isArchived && (
                    <>
                        <button className="btn" onClick={onUpdate} style={{ padding: '9px 18px', borderRadius: 10 }}><Pencil size={13} /> New Version</button>
                        <button className="btn" style={{ padding: '9px 18px', borderRadius: 10, color: 'var(--status-failed)', borderColor: 'rgba(220,38,38,0.3)' }} onClick={onArchive}><Archive size={13} /> Archive</button>
                    </>
                )}
            </div>
        </FormModal>
    );
}

export default function EmployeeDocumentsTab({ employees = [], onOpenDigital201 }: { employees?: any[], onOpenDigital201: (emp: any) => void }) {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState('');
    const [filterDocType, setFilterDocType] = useState('');
    const [filterStatus, setFilterStatus] = useState('active');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [detailDoc, setDetailDoc] = useState<any>(null);
    const [updateDoc, setUpdateDoc] = useState<any>(null);

    const fetchDocs = async (pg = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const params = new URLSearchParams({ PageNumber: String(pg), PageSize: String(PAGE_SIZE) });
            if (search) params.append('search', search);
            if (filterDocType) params.append('documentType', filterDocType);
            if (filterStatus === 'active') params.append('isArchived', 'false');
            else if (filterStatus === 'archived') params.append('isArchived', 'true');

            const res = await fetch(`/api/systemadmin/documents?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const result = await res.json();
            if (result.isSuccess && result.data) {
                const raw: any[] = Array.isArray(result.data.data) ? result.data.data : [];
                setDocs(raw);
                setTotalPages(result.data.totalPages ?? 1);
                setTotalCount(result.data.totalRecords ?? raw.length);
                setPage(pg);
            } else {
                setDocs([]);
                setTotalPages(1);
                setTotalCount(0);
            }
        } catch { setDocs([]); } finally { setLoading(false); }
    };

    useEffect(() => { fetchDocs(1); }, [search, filterDocType, filterStatus]);

    const handleArchive = async (doc: any) => {
        if (!confirm(`Archive "${doc.documentTitle || doc.fileName}"? It will be hidden from the active view but preserved.`)) return;
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`/api/systemadmin/documents/${doc.employeeAttachmentId}/archive`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Archive failed.');
            fetchDocs(page);
        } catch { alert('Failed to archive document.'); }
    };

    const activeCount = docs.filter(d => !d.isArchived).length;
    const archivedCount = docs.filter(d => d.isArchived).length;

    return (
        <>
            <style>{`
        .doc-type-pill { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background: rgba(67,24,255,0.08); color: #4318ff; }
        .version-chip { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #f1f5f9; color: #475569; }
      `}</style>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--status-active-bg)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: 'var(--status-active)' }}><CheckCircle2 size={12} /> {activeCount} active</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}><Archive size={12} /> {archivedCount} archived</div>
            </div>

            <DataTable
                searchQuery={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by employee name, title, or ID…"
                filterElements={
                    <>
                        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-main)', borderRadius: 10, padding: 3 }}>
                            {[
                                { value: 'active', label: 'Active' },
                                { value: 'archived', label: 'Archived' },
                                { value: 'all', label: 'All' },
                            ].map(opt => (
                                <button key={opt.value} onClick={() => setFilterStatus(opt.value)} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filterStatus === opt.value ? 'white' : 'transparent', color: filterStatus === opt.value ? 'var(--primary)' : 'var(--text-secondary)', boxShadow: filterStatus === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>{opt.label}</button>
                            ))}
                        </div>
                        <select value={filterDocType} onChange={e => setFilterDocType(e.target.value)} style={{ height: 36, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', padding: '0 32px 0 14px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 500, outline: 'none' }}>
                            <option value="">All Types</option>
                            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </>
                }
                actionButton={{ label: 'Upload Document', icon: <Plus size={14} />, onClick: () => setShowUploadModal(true) }}
                headers={['Employee', 'Document Type', 'Title', 'Issue Date', 'File', 'Size', 'Status', 'Actions']}
                loading={loading}
                emptyMessage="No documents match your filters."
                emptyIcon={<FileText size={24} />}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={fetchDocs}
                totalRecords={totalCount}
            >
                {docs.map(doc => {
                    const empName = doc.employeeName || `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || '—';
                    const isArchived = doc.isArchived;
                    return (
                        <tr key={doc.employeeAttachmentId} style={{ opacity: isArchived ? 0.7 : 1 }}>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                    <div className="emp-avatar" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>{(doc.firstName?.[0] || doc.lastName?.[0] || '?').toUpperCase()}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{empName}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>#{doc.employeeNumber}</div>
                                    </div>
                                </div>
                            </td>
                            <td><span className="doc-type-pill">{doc.documentType}</span></td>
                            <td style={{ fontWeight: 600, fontSize: 13 }}>{doc.documentTitle || '—'}</td>
                            <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}><Calendar size={12} style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--primary)' }} />{fmtDate(doc.issueDate)}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FileText size={13} style={{ color: 'var(--status-failed)', flexShrink: 0 }} />
                                    <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={doc.fileName}>{doc.fileName}</span>
                                </div>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmt(doc.fileSize)} <span className="version-chip" style={{ marginLeft: 4 }}>v{doc.version}</span></td>
                            <td><StatusBadge status={isArchived ? 'Archived' : 'Active'} size="sm" icon={isArchived ? <Archive size={11} /> : <CheckCircle2 size={11} />} /></td>
                            <td onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    <button className="action-icon-btn" onClick={() => setDetailDoc(doc)} title="View details"><Eye size={13} /></button>
                                    <button className="action-icon-btn" onClick={() => window.open(doc.fileUrl, '_blank')} title="Download"><Download size={13} /></button>
                                    {!isArchived && (
                                        <>
                                            <button className="action-icon-btn" onClick={() => setUpdateDoc(doc)} title="New version"><Pencil size={13} /></button>
                                            <button className="action-icon-btn" onClick={() => handleArchive(doc)} title="Archive" style={{ color: 'var(--status-failed)' }}><Archive size={13} /></button>
                                        </>
                                    )}
                                    {employees.find((e: any) => e.employeeNumber === doc.employeeNumber) && (
                                        <button className="action-icon-btn" title="Digital 201 File" onClick={() => { const emp = employees.find((e: any) => e.employeeNumber === doc.employeeNumber); if (emp) onOpenDigital201(emp); }}><User size={13} /></button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </DataTable>

            {showUploadModal && <UploadDocumentModal employees={employees} onClose={() => setShowUploadModal(false)} onUploaded={() => fetchDocs(page)} />}
            {detailDoc && <DetailModal doc={detailDoc} onClose={() => setDetailDoc(null)} onArchive={() => { setDetailDoc(null); handleArchive(detailDoc); }} onUpdate={() => { setDetailDoc(null); setUpdateDoc(detailDoc); }} />}
            {updateDoc && <UpdateDocumentModal doc={updateDoc} onClose={() => setUpdateDoc(null)} onUpdated={() => fetchDocs(page)} />}
        </>
    );
}
