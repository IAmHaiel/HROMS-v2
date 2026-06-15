import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Search, Loader2, ChevronLeft, ChevronRight, Package, MoreVertical } from 'lucide-react';
import './TableCard.css';

export interface TableCardTab {
    key: string;
    label: string;
    icon?: React.ReactNode;
    badge?: number | string;
}

export interface TableCardProps {
    // Tabs
    tabs?: readonly TableCardTab[] | TableCardTab[];
    activeTab?: string;
    onTabChange?: (key: string) => void;

    // Title / Count Info
    title?: string;
    totalResults?: number;

    // Filters & Actions
    searchQuery?: string;
    setSearchQuery?: (val: string) => void;
    searchPlaceholder?: string;
    filterElements?: React.ReactNode;
    actionButton?: {
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
    };

    // Table elements
    headers?: string[];
    loading?: boolean;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;

    // Rendering content
    customBody?: React.ReactNode;
    children?: React.ReactNode;

    // Pagination
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

function getPageNumbers(total: number, current: number): (number | '...')[] {
    const pages: (number | '...')[] = [];
    if (total <= 5) {
        for (let i = 1; i <= total; i++) pages.push(i);
    } else {
        pages.push(1);
        if (current > 3) pages.push('...');
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (current < total - 2) pages.push('...');
        pages.push(total);
    }
    return pages;
}

export const TableCard: React.FC<TableCardProps> = ({
    tabs,
    activeTab,
    onTabChange,
    title,
    totalResults,
    searchQuery,
    setSearchQuery,
    searchPlaceholder = 'Search...',
    filterElements,
    actionButton,
    headers,
    loading = false,
    emptyMessage = 'No items found',
    emptyIcon = <Package size={20} />,
    customBody,
    children,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
}) => {
    const hasSearch = setSearchQuery !== undefined;
    const hasFilters = filterElements !== undefined || hasSearch || actionButton !== undefined;

    return (
        <div className="card table-card">
            {/* ── Tabs Header ── */}
            {tabs && tabs.length > 0 && (
                <div className="table-card-tabs">
                    {tabs.map(({ key, label, icon, badge }) => (
                        <button
                            key={key}
                            onClick={() => onTabChange?.(key)}
                            className={`table-card-tab-btn${activeTab === key ? ' active' : ''}`}
                        >
                            {icon}
                            <span>{label}</span>
                            {badge !== undefined && typeof badge === 'number' && badge > 0 && (
                                <span className={`table-card-tab-badge${activeTab === key ? ' active' : ''}`}>
                                    {badge} pending
                                </span>
                            )}
                            {badge !== undefined && typeof badge === 'string' && badge !== '0' && badge !== '' && (
                                <span className={`table-card-tab-badge${activeTab === key ? ' active' : ''}`}>
                                    {badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Filter / Search Bar ── */}
            {hasFilters && (
                <div style={{ padding: '16px 20px 0' }}>
                    {totalResults !== undefined && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span className="table-card-results-info">
                                {totalResults} result{totalResults !== 1 ? 's' : ''} on this page
                            </span>
                        </div>
                    )}
                    <div className="table-card-filter-bar">
                        {hasSearch && (
                            <div className="table-card-search-input-wrap">
                                <Search size={14} className="table-card-search-icon" />
                                <input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery?.(e.target.value)}
                                    className="table-card-search-input"
                                />
                            </div>
                        )}
                        {filterElements}
                        {actionButton && (
                            <button
                                className="btn btn-primary"
                                onClick={actionButton.onClick}
                                style={{ marginLeft: 'auto' }}
                            >
                                {actionButton.icon}
                                <span>{actionButton.label}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Table / Custom Body Area ── */}
            {headers && headers.length > 0 ? (
                <div className="table-card-wrap">
                    <table className="table-card-data-table">
                        <thead>
                            <tr>
                                {headers.map((h, i) => (
                                    <th key={i}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={headers.length}>
                                        <div className="table-card-empty-state">
                                            <Loader2 size={20} className="spin" />
                                            <p>Loading...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : React.Children.count(children) === 0 ? (
                                <tr>
                                    <td colSpan={headers.length}>
                                        <div className="table-card-empty-state">
                                            {emptyIcon}
                                            <p>{emptyMessage}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                children
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-card-custom-body">
                    {loading ? (
                        <div className="table-card-empty-state">
                            <Loader2 size={20} className="spin" />
                            <p>Loading...</p>
                        </div>
                    ) : React.Children.count(children) === 0 ? (
                        <div className="table-card-empty-state">
                            {emptyIcon}
                            <p>{emptyMessage}</p>
                        </div>
                    ) : (
                        children
                    )}
                </div>
            )}

            {/* ── Pagination Bar ── */}
            {!loading && totalPages !== undefined && totalPages > 1 && onPageChange && (
                <div className="table-card-pagination-bar">
                    <span className="table-card-pagination-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="table-card-pagination-controls">
                        <button
                            className="table-card-page-btn table-card-page-btn-nav"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={15} />
                        </button>
                        {getPageNumbers(totalPages, currentPage).map((p, i) =>
                            p === '...' ? (
                                <span key={`ellipsis-${i}`} className="table-card-page-ellipsis">
                                    …
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    className={`table-card-page-btn${currentPage === p ? ' active' : ''}`}
                                    onClick={() => onPageChange(p as number)}
                                >
                                    {p}
                                </button>
                            )
                        )}
                        <button
                            className="table-card-page-btn table-card-page-btn-nav"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export interface DropdownAction {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'danger' | 'success' | 'default';
}

export interface ActionsDropdownProps {
    actions: DropdownAction[];
}

export const ActionsDropdown: React.FC<ActionsDropdownProps> = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // Check both the trigger container AND the portaled menu
            const inContainer = containerRef.current?.contains(target);
            const inMenu = menuRef.current?.contains(target);
            if (!inContainer && !inMenu) {
                setIsOpen(false);
            }
        };
        const handleScroll = () => setIsOpen(false);

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) {
            setIsOpen(false);
            return;
        }
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 4,
                left: rect.right - 160,
            });
        }
        setIsOpen(true);
    };

    // Render the menu via a portal directly under document.body so it
    // is never clipped or obscured by any ancestor stacking context.
    const menu =
        isOpen && menuPos
            ? ReactDOM.createPortal(
                  <div
                      ref={menuRef}
                      className="actions-dropdown-menu"
                      style={{ top: menuPos.top, left: menuPos.left }}
                      onClick={(e) => e.stopPropagation()}
                  >
                      {actions.map((act, index) => (
                          <button
                              key={index}
                              type="button"
                              className={`actions-dropdown-item ${act.variant ?? ''}`}
                              onClick={() => {
                                  setIsOpen(false);
                                  act.onClick();
                              }}
                          >
                              {act.icon}
                              <span>{act.label}</span>
                          </button>
                      ))}
                  </div>,
                  document.body
              )
            : null;

    return (
        <div className="actions-dropdown-container" ref={containerRef}>
            <button
                ref={triggerRef}
                type="button"
                className={`actions-dropdown-trigger${isOpen ? ' active' : ''}`}
                onClick={handleOpen}
                aria-label="Actions"
            >
                <MoreVertical size={16} />
            </button>
            {menu}
        </div>
    );
};

export default TableCard;
