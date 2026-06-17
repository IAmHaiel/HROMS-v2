/**
 * EmployeeDocumentsTab.jsx
 *
 * Drop-in replacement for the Employee Documents section inside ManageEmployeesTab.
 * Satisfies all 5 contract-repository criteria:
 *   1. Centralized repository linked to each employee's Digital 201 File
 *   2. Chronological display by Effective Start Date
 *   3. Upload requires explicit Effective Start Date
 *   4. Previous contracts auto-archived when a newer one is uploaded
 *   5. PDF-only uploads enforced (non-editable format)
 *
 * Usage inside ManageEmployeesTab (replace the existing documents branch):
 *
 *   import EmployeeDocumentsTab from './EmployeeDocumentsTab';
 *
 *   // Inside <TableCard> or wherever you render subTab === 'documents':
 *   {subTab === 'documents' && (
 *     <EmployeeDocumentsTab
 *       employees={employees}
 *       onOpenDigital201={onOpenDigital201}
 *     />
 *   )}
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FileText, Download, Eye, Upload, Search, Filter,
    CheckCircle2, Clock, Archive, AlertCircle, Loader2,
    X, Plus, Calendar, User, Hash, Tag, Info,
} from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} EmploymentContract
 * @property {string} employeeAttachmentId
 * @property {string} fileName
 * @property {string} fileUrl
 * @property {string} contentType
 * @property {number} fileSize
 * @property {number} version
 * @property {string} documentType
 * @property {boolean} isArchived
 * @property {string} uploadedAt
 * @property {string} effectiveStartDate  ← new required field
 * @property {string} employeeNumber
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} [departmentName]
 * @property {string} [jobPositionTitle]
 */

// ─── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const DOC_TYPES = [
    'Employment Contract',
    'Contract Amendment',
    'NDA',
    'Job Description',
    'Probationary Agreement',
    'Other',
];

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactElement }> = {
    Active: { label: 'Active', cls: 'doc-badge doc-badge--active', icon: <CheckCircle2 size={11} /> },
    Archived: { label: 'Archived', cls: 'doc-badge doc-badge--archived', icon: <Archive size={11} /> },
    'Pending Activation': { label: 'Pending Activation', cls: 'doc-badge doc-badge--pending', icon: <Clock size={11} /> },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (bytes: any) => {
    if (!bytes) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const fmtDate = (d: any) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

const buildName = (first: any, last: any) =>
    [first, last].filter(Boolean).join(' ') || '—';

const getInitial = (first: any, last: any) =>
    (first?.[0] || last?.[0] || '?').toUpperCase();

// ─── Upload Modal ────────────────────────────────────────────────────────────

function UploadContractModal({ employees, onClose, onUploaded }: { employees: any[], onClose: () => void, onUploaded: (doc: any) => void }) {
    const [step, setStep] = useState(1); // 1 = select employee, 2 = file details
    const [searchEmp, setSearchEmp] = useState('');
    const [selectedEmp, setSelectedEmp] = useState<any>(null);
    const [docType, setDocType] = useState('Employment Contract');
    const [effectiveDate, setEffectiveDate] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<any>({});
    const fileRef = useRef<HTMLInputElement>(null);

    const filteredEmps = employees.filter(e => {
        const name = buildName(e.firstName, e.lastName).toLowerCase();
        const num = (e.employeeNumber || '').toLowerCase();
        const q = searchEmp.toLowerCase();
        return name.includes(q) || num.includes(q);
    });

    const handleDrop = (e: any) => {
        e.preventDefault();
        setDragActive(false);
        const dropped = e.dataTransfer.files[0];
        validateAndSetFile(dropped);
    };

    const validateAndSetFile = (f: any) => {
        if (!f) return;
        if (f.type !== 'application/pdf') {
            setFieldErrors((p: any) => ({ ...p, file: 'Only PDF files are accepted to maintain legal document integrity.' }));
            return;
        }
        if (f.size > 20 * 1024 * 1024) {
            setFieldErrors((p: any) => ({ ...p, file: 'File must be under 20 MB.' }));
            return;
        }
        setFile(f);
        setFieldErrors((p: any) => ({ ...p, file: undefined }));
    };

    const validate = () => {
        const errs: any = {};
        if (!selectedEmp) errs.emp = 'Select an employee.';
        if (!docType) errs.docType = 'Select a document type.';
        if (!effectiveDate) errs.effectiveDate = 'Effective Start Date is required.';
        if (!file) errs.file = 'Please attach a PDF file.';
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
            // ContractType maps to UploadEmploymentContractDTO.ContractType
            fd.append('ContractType', docType);
            fd.append('EffectiveStartDate', new Date(effectiveDate).toISOString());
            if (file) fd.append('File', file);

            // employeeNumber is a [FromQuery] param on the backend
            const url = `/api/systemadmin/contracts/upload?employeeNumber=${encodeURIComponent(selectedEmp.employeeNumber)}`;

            const res = await fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Upload failed. Please try again.');
            }
            const result = await res.json();
            if (!result.isSuccess) {
                throw new Error(result.message || 'Upload failed. Please try again.');
            }
            onUploaded(result.data ?? result);
            onClose();
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Upload Contract"
            subtitle={`Step ${step} of 2 — ${step === 1 ? 'Choose employee' : 'Document details'}`} size="md"
        >
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[1, 2].map(s => (
                    <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: s <= step ? 'var(--primary)' : 'var(--border)', transition: 'background 0.2s' }} />
                ))}
            </div>

            {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--status-failed-bg)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--status-failed)' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{error}</span>
                </div>
            )}

                {/* ── Step 1: Employee picker ── */}
                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                placeholder="Search by name or employee ID…"
                                value={searchEmp}
                                onChange={e => setSearchEmp(e.target.value)}
                                className="fm-input"
                                style={{ paddingLeft: 36 }}
                                autoFocus
                            />
                        </div>

                        {fieldErrors.emp && (
                            <span style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <AlertCircle size={11} /> {fieldErrors.emp}
                            </span>
                        )}

                        <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {filteredEmps.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                                    No employees found
                                </div>
                            ) : filteredEmps.map(emp => {
                                const name = buildName(emp.firstName, emp.lastName);
                                const selected = selectedEmp?.employeeNumber === emp.employeeNumber;
                                return (
                                    <div
                                        key={emp.employeeNumber}
                                        onClick={() => setSelectedEmp(emp)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                                            border: `1.5px solid ${selected ? '#4318ff' : '#e2e8f0'}`,
                                            background: selected ? 'rgba(67,24,255,0.04)' : 'var(--bg-primary, #fff)',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <div className="emp-avatar" style={{ flexShrink: 0, width: 36, height: 36, fontSize: 14 }}>
                                            {getInitial(emp.firstName, emp.lastName)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                                #{emp.employeeNumber} · {emp.role || '—'}
                                            </div>
                                        </div>
                                        {selected && <CheckCircle2 size={16} color="#4318ff" />}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => { if (!selectedEmp) { setFieldErrors((p: any) => ({ ...p, emp: 'Select an employee.' })); return; } setStep(2); }}
                                style={{ padding: '9px 24px', borderRadius: 10 }}
                            >
                                Continue →
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Document details ── */}
                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Selected employee recap */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(67,24,255,0.04)', border: '1px solid rgba(67,24,255,0.15)', borderRadius: 10, padding: '10px 14px' }}>
                            <div className="emp-avatar" style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}>
                                {getInitial(selectedEmp.firstName, selectedEmp.lastName)}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{buildName(selectedEmp.firstName, selectedEmp.lastName)}</div>
                                <div style={{ fontSize: 11, color: '#4318ff' }}>#{selectedEmp.employeeNumber}</div>
                            </div>
                            <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', fontSize: 11, color: '#4318ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                Change
                            </button>
                        </div>

                        {/* Document type */}
                        <div className="fm-field">
                            <label className="fm-label">
                                Document Type <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                className="fm-select"
                                value={docType}
                                onChange={e => { setDocType(e.target.value); setFieldErrors((p: any) => ({ ...p, docType: undefined })); }}
                                style={fieldErrors.docType ? { borderColor: '#ef4444' } : {}}
                            >
                                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            {fieldErrors.docType && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{fieldErrors.docType}</span>}
                        </div>

                        {/* Effective Start Date — REQUIRED per criteria #3 */}
                        <div className="fm-field">
                            <label className="fm-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={13} />
                                Effective Start Date <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="date"
                                className="fm-input"
                                value={effectiveDate}
                                onChange={e => { setEffectiveDate(e.target.value); setFieldErrors((p: any) => ({ ...p, effectiveDate: undefined })); }}
                                style={fieldErrors.effectiveDate ? { borderColor: '#ef4444' } : {}}
                            />
                            {fieldErrors.effectiveDate
                                ? <span style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{fieldErrors.effectiveDate}</span>
                                : <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                                    When this contract takes effect. Any prior contract will be automatically archived.
                                </span>
                            }
                        </div>

                        {/* PDF drop zone — criteria #5: PDF only */}
                        <div className="fm-field">
                            <label className="fm-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FileText size={13} />
                                Contract File <span style={{ color: '#ef4444' }}>*</span>
                                <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, background: 'rgba(67,24,255,0.1)', color: '#4318ff', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>PDF only</span>
                            </label>

                            <div
                                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                                style={{
                                    border: `2px dashed ${fieldErrors.file ? '#ef4444' : dragActive ? '#4318ff' : '#cbd5e1'}`,
                                    borderRadius: 12,
                                    padding: '24px 20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: dragActive ? 'rgba(67,24,255,0.03)' : 'transparent',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {file ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                        <FileText size={28} color="#4318ff" />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{file.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{fmt(file.size)}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); setFile(null); }}
                                            style={{ fontSize: 11, color: '#ee5d50', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                                        <Upload size={24} />
                                        <div>
                                            <span style={{ fontWeight: 600, color: '#4318ff' }}>Click to browse</span> or drag & drop
                                        </div>
                                        <div style={{ fontSize: 11 }}>PDF only · max 20 MB</div>
                                    </div>
                                )}
                            </div>
                            <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => validateAndSetFile(e.target.files?.[0])} />
                            {fieldErrors.file && (
                                <span style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertCircle size={11} /> {fieldErrors.file}
                                </span>
                            )}
                        </div>

                        {/* Legal notice */}
                        <div style={{ display: 'flex', gap: 8, background: 'rgba(255,181,71,0.08)', border: '1px solid rgba(255,181,71,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--text-primary)' }}>
                            <Info size={14} style={{ flexShrink: 0, marginTop: 1, color: '#ffb547' }} />
                            <span>
                                Uploading this contract will automatically archive the employee's previous contract version, preserving it for audit purposes.
                                Only PDF format is accepted to maintain legal document integrity.
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                            <button className="btn" onClick={() => setStep(1)} disabled={submitting} style={{ padding: '9px 18px', borderRadius: 10 }}>
                                ← Back
                            </button>
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ padding: '9px 24px', borderRadius: 10 }}>
                                {submitting
                                    ? <><Loader2 size={13} className="fm-spin" /> Uploading…</>
                                    : <><Upload size={13} /> Upload Contract</>}
                            </button>
                        </div>
                    </div>
                )}
        </Modal>
    );
}

// ─── Contract Detail Modal ───────────────────────────────────────────────────

function ContractDetailModal({ doc, onClose }: { doc: any, onClose: () => void }) {
    const name = buildName(doc.firstName, doc.lastName);
    const contractStatus: string = doc.contractStatus ?? (doc.isArchived ? 'Archived' : 'Active');
    const isArchived = contractStatus === 'Archived';

    return (
        <Modal isOpen onClose={onClose} title="Document Details" subtitle="Contract record information" size="md">
            {/* Status banner */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10, marginBottom: 18,
                background: isArchived ? 'rgba(100,116,139,0.08)' : 'var(--status-active-bg)',
                border: `1px solid ${isArchived ? 'rgba(100,116,139,0.2)' : 'rgba(5,150,105,0.2)'}`,
                fontSize: 13, fontWeight: 600,
                color: isArchived ? 'var(--text-secondary)' : 'var(--status-active)',
            }}>
                {isArchived ? <Archive size={14} /> : <CheckCircle2 size={14} />}
                {isArchived ? 'This contract has been archived (superseded by a newer version).' : 'This is the current active contract.'}
            </div>

                {/* Employee */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <div className="emp-avatar" style={{ width: 40, height: 40, flexShrink: 0 }}>
                        {getInitial(doc.firstName, doc.lastName)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            #{doc.employeeNumber}
                            {doc.departmentName && ` · ${doc.departmentName}`}
                        </div>
                    </div>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 18 }}>
                    {[
                        { label: 'Document Type', value: doc.documentType, icon: <Tag size={11} /> },
                        { label: 'Version', value: `v${doc.version}`, icon: <Hash size={11} /> },
                        { label: 'Effective Start Date', value: fmtDate(doc.effectiveStartDate), icon: <Calendar size={11} /> },
                        { label: 'Uploaded At', value: fmtDate(doc.uploadedAt), icon: <Clock size={11} /> },
                        { label: 'File Name', value: doc.fileName, icon: <FileText size={11} /> },
                        { label: 'File Size', value: fmt(doc.fileSize), icon: <Info size={11} /> },
                    ].map(({ label, value, icon }) => (
                        <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                                {icon} {label}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-word' }}>{value || '—'}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10 }}>Close</button>
                    <button className="btn btn-primary" onClick={() => window.open(doc.fileUrl, '_blank')} style={{ padding: '9px 20px', borderRadius: 10 }}>
                        <Download size={13} /> Download PDF
                    </button>
                </div>
        </Modal>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function EmployeeDocumentsTab({ employees = [], onOpenDigital201 }: { employees?: any[], onOpenDigital201: (emp: any) => void }) {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [search, setSearch] = useState('');
    const [filterDocType, setFilterDocType] = useState(''); // kept for UI; filtering happens client-side on documentTitle
    const [filterStatus, setFilterStatus] = useState('active'); // 'active' | 'archived' | 'all'

    // UI state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [detailDoc, setDetailDoc] = useState<any>(null);

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchContracts = useCallback(async (pg = 1, overrides: any = {}) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            // Backend accepts: PageNumber, PageSize, search, isArchived
            const params = new URLSearchParams({
                PageNumber: String(pg),
                PageSize: String(PAGE_SIZE),
            });

            const s = overrides.search ?? search;
            const st = overrides.filterStatus ?? filterStatus;

            if (s) params.append('search', s);
            // Map filterStatus to the isArchived bool the backend expects
            if (st === 'active') params.append('isArchived', 'false');
            else if (st === 'archived') params.append('isArchived', 'true');
            // 'all' → omit isArchived so backend returns everything

            const res = await fetch(`/api/systemadmin/contracts?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const result = await res.json();

            if (result.isSuccess && result.data) {
                const raw: any[] = Array.isArray(result.data.data) ? result.data.data : [];
                // Sort chronologically by issueDate (= effectiveStartDate on backend) — newest first
                raw.sort((a, b) => new Date(b.issueDate ?? b.uploadedAt).getTime() - new Date(a.issueDate ?? a.uploadedAt).getTime());
                setContracts(raw);
                setTotalPages(result.data.totalPages ?? 1);
                setTotalCount(result.data.totalRecords ?? raw.length);
                setPage(pg);
            } else {
                setContracts([]);
                setTotalPages(1);
                setTotalCount(0);
            }
        } catch {
            setContracts([]);
        } finally {
            setLoading(false);
        }
    }, [search, filterStatus]);

    useEffect(() => {
        fetchContracts(1);
    }, [search, filterStatus]);

    const handleUploaded = (newDoc: any) => {
        // Backend has already archived the superseded contract.
        // Refresh from server to get the accurate contractStatus values.
        fetchContracts(1);
    };

    // ── Pagination pages ───────────────────────────────────────────────────────

    const pageNumbers = (() => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    })();

    // ── Render ─────────────────────────────────────────────────────────────────

    const activeCount = contracts.filter(d => (d.contractStatus ?? (d.isArchived ? 'Archived' : 'Active')) === 'Active').length;
    const archivedCount = contracts.filter(d => (d.contractStatus ?? (d.isArchived ? 'Archived' : 'Active')) === 'Archived').length;
    // Client-side filter by contract type (documentTitle)
    const displayedContracts = filterDocType
        ? contracts.filter(d => (d.documentTitle || d.documentType || '') === filterDocType)
        : contracts;

    return (
        <>
            <style>{`
        .doc-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }
        .doc-badge--active {
          background: rgba(5,205,153,0.1);
          color: #059669;
          border: 1px solid rgba(5,205,153,0.25);
        }
        .doc-badge--archived {
          background: rgba(100,116,139,0.1);
          color: #64748b;
          border: 1px solid rgba(100,116,139,0.2);
        }
        .doc-badge--pending {
          background: rgba(245,158,11,0.1);
          color: #d97706;
          border: 1px solid rgba(245,158,11,0.2);
        }
        .doc-type-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          background: rgba(67,24,255,0.08);
          color: #4318ff;
        }
        .version-chip {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          background: #f1f5f9;
          color: #475569;
        }
        .doc-row:hover { background: rgba(67,24,255,0.02); }
        .doc-row.archived-row { opacity: 0.72; }
        .filter-tab-btn {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid transparent;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          background: transparent;
          color: var(--text-secondary);
        }
        .filter-tab-btn.active {
          background: #4318ff;
          color: white;
          border-color: #4318ff;
        }
        .filter-tab-btn:not(.active):hover {
          background: #f4f7fe;
          border-color: #e2e8f0;
          color: var(--text-primary);
        }
        .doc-table-wrap { overflow-x: auto; }
        .doc-table { width: 100%; border-collapse: collapse; }
        .doc-table th {
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          padding: 10px 14px;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
          text-transform: uppercase;
        }
        .doc-table td {
          padding: 12px 14px;
          font-size: 13px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .doc-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 7px;
          border: 1px solid #e2e8f0;
          background: transparent;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.12s;
        }
        .doc-action-btn:hover { background: #f4f7fe; border-color: #c7d2e1; color: var(--text-primary); }
        .doc-action-btn.primary { color: #4318ff; border-color: rgba(67,24,255,0.25); background: rgba(67,24,255,0.04); }
        .doc-action-btn.primary:hover { background: rgba(67,24,255,0.08); }
        .doc-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px 20px; gap: 12px; color: var(--text-secondary); }
        .doc-empty svg { opacity: 0.35; }
        .doc-empty p { font-size: 14px; margin: 0; }
        .doc-page-btn {
          min-width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: transparent;
          font-size: 13px; font-weight: 600;
          cursor: pointer; display: inline-flex;
          align-items: center; justify-content: center;
          color: var(--text-secondary);
          transition: all 0.12s;
        }
        .doc-page-btn:hover:not(:disabled) { background: #f4f7fe; }
        .doc-page-btn.current { background: #4318ff; color: white; border-color: #4318ff; }
        .doc-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .chronology-line {
          position: absolute;
          left: 19px;
          top: 44px;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #e2e8f0 0%, transparent 100%);
          pointer-events: none;
        }
      `}</style>

            {/* ── Summary chips ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--status-active-bg)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: 'var(--status-active)' }}>
                    <CheckCircle2 size={12} /> {activeCount} active
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    <Archive size={12} /> {archivedCount} archived
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> Sorted by Effective Start Date (newest first)
                </div>
            </div>

            {/* ── Criteria #2 notice ── */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--status-new-bg)', border: '1px solid rgba(79,70,229,0.12)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-primary)' }}>
                <Info size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--primary)' }} />
                <span>
                    Contracts are displayed in chronological order by their <strong>Effective Start Date</strong>.
                    Previous versions are preserved as archived records for audit purposes.
                    Only PDF files can be uploaded to maintain legal document integrity.
                </span>
            </div>

            {/* ── DataTable ── */}
            <DataTable
                searchQuery={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by employee name or ID…"
                filterElements={
                    <>
                        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-main)', borderRadius: 10, padding: 3 }}>
                            {[
                                { value: 'active', label: 'Active' },
                                { value: 'archived', label: 'Archived' },
                                { value: 'all', label: 'All' },
                            ].map(opt => (
                                <button key={opt.value}
                                    className={`filter-tab-btn${filterStatus === opt.value ? ' active' : ''}`}
                                    onClick={() => setFilterStatus(opt.value)}
                                    style={{ padding: '4px 10px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filterStatus === opt.value ? 'white' : 'transparent', color: filterStatus === opt.value ? 'var(--primary)' : 'var(--text-secondary)', boxShadow: filterStatus === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <select value={filterDocType} onChange={e => setFilterDocType(e.target.value)}
                            style={{ height: 36, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', padding: '0 32px 0 14px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 500, outline: 'none' }}>
                            <option value="">All Contract Types</option>
                            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </>
                }
                actionButton={{ label: 'Upload Contract', icon: <Plus size={14} />, onClick: () => setShowUploadModal(true) }}
                headers={['Employee', 'Document Type', 'Effective Start Date', 'File', 'Version', 'Uploaded', 'Status', 'Actions']}
                loading={loading}
                emptyMessage="No contracts match your filters."
                emptyIcon={<FileText size={24} />}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => fetchContracts(p)}
                totalRecords={totalCount}
            >
                {displayedContracts.map((doc) => {
                    const name = buildName(doc.firstName, doc.lastName);
                    const contractStatus: string = doc.contractStatus ?? (doc.isArchived ? 'Archived' : 'Active');
                    const statusMeta = STATUS_META[contractStatus] ?? STATUS_META['Active'];
                    return (
                        <tr key={doc.employeeAttachmentId} onClick={() => setDetailDoc(doc)} style={{ cursor: 'pointer', opacity: contractStatus === 'Archived' ? 0.7 : 1 }}>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                    <div className="emp-avatar" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>{getInitial(doc.firstName, doc.lastName)}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>#{doc.employeeNumber}</div>
                                    </div>
                                </div>
                            </td>
                            <td><span className="doc-type-pill">{doc.documentTitle || doc.documentType}</span></td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Calendar size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                    <span style={{ fontWeight: 600 }}>{fmtDate(doc.issueDate)}</span>
                                </div>
                            </td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FileText size={13} style={{ color: 'var(--status-failed)', flexShrink: 0 }} />
                                    <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={doc.fileName}>{doc.fileName}</span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{fmt(doc.fileSize)}</div>
                            </td>
                            <td><span className="version-chip">v{doc.version}</span></td>
                            <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(doc.uploadedAt)}</td>
                            <td>
                                <span className={statusMeta.cls}>{statusMeta.icon}{statusMeta.label}</span>
                            </td>
                            <td onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    <button className="action-icon-btn" onClick={() => setDetailDoc(doc)} title="View details"><Eye size={13} /></button>
                                    <button className="action-icon-btn" onClick={() => window.open(doc.fileUrl, '_blank')} title="Download PDF"><Download size={13} /></button>
                                    {employees.find(e => e.employeeNumber === doc.employeeNumber) && (
                                        <button className="action-icon-btn" title="Open Digital 201 File" onClick={() => { const emp = employees.find(e => e.employeeNumber === doc.employeeNumber); if (emp) onOpenDigital201(emp); }}><User size={13} /></button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </DataTable>

            {/* ── Modals ── */}
            {showUploadModal && (
                <UploadContractModal
                    employees={employees}
                    onClose={() => setShowUploadModal(false)}
                    onUploaded={handleUploaded}
                />
            )}

            {detailDoc && (
                <ContractDetailModal
                    doc={detailDoc}
                    onClose={() => setDetailDoc(null)}
                />
            )}
        </>
    );
}