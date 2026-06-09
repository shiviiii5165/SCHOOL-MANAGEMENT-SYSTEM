"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ChevronDown, ChevronUp, Search, MoreHorizontal, 
  Edit, Eye, Trash2, CheckSquare, Square
} from "lucide-react";
import EmptyState from "./EmptyState";

interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onEdit?: (item: T) => void;
  onView?: (item: T) => void;
  onDelete?: (item: T) => void;
  emptyStateIcon?: any;
  emptyStateTitle?: string;
  emptyStateDesc?: string;
  emptyStateAction?: { label: string; onClick: () => void };
  onSearchChange?: (val: string) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onFilteredDataChange?: (filteredData: T[]) => void;
  rowClassName?: (item: T) => string;
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onEdit,
  onView,
  onDelete,
  emptyStateIcon,
  emptyStateTitle = "No data found",
  emptyStateDesc = "There are no records to display at this time.",
  emptyStateAction,
  onSearchChange,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  onFilteredDataChange,
  rowClassName,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const selectedIds = controlledSelectedIds !== undefined ? controlledSelectedIds : internalSelectedIds;

  const updateSelection = (newIds: Set<string>) => {
    if (controlledSelectedIds === undefined) {
      setInternalSelectedIds(newIds);
    }
    if (onSelectionChange) {
      onSelectionChange(newIds);
    }
  };

  // Filter
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    return Object.values(item).some((val) => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Call onFilteredDataChange whenever filteredData changes
  // We use a ref to avoid infinite loops if the parent doesn't memoize the callback
  const prevFilteredRef = useRef<T[]>([]);
  useEffect(() => {
    if (onFilteredDataChange && prevFilteredRef.current !== filteredData) {
      prevFilteredRef.current = filteredData;
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  // Sort
  const sortedData = [...filteredData].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length && paginatedData.length > 0) {
      updateSelection(new Set());
    } else {
      updateSelection(new Set(paginatedData.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    updateSelection(newSelected);
  };

  if (data.length === 0) {
    return (
      <EmptyState 
        icon={emptyStateIcon} 
        title={emptyStateTitle} 
        description={emptyStateDesc} 
        action={emptyStateAction} 
      />
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border flex flex-col max-w-full overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <span className="text-sm font-medium text-text-primary bg-primary-light px-3 py-1.5 rounded-md text-primary">
              {selectedIds.size} selected
            </span>
            <button className="text-sm bg-border hover:bg-border-strong text-text-primary px-3 py-1.5 rounded-md font-medium transition-colors">
              Bulk Action
            </button>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden divide-y divide-border">
        {paginatedData.length === 0 ? (
          <div className="p-8 text-center text-text-secondary text-sm">
            No results found for "{searchTerm}"
          </div>
        ) : paginatedData.map((item) => (
          <div key={item.id} className="p-4 hover:bg-background/60 transition-colors">
            <div className="space-y-2">
              {columns.slice(0, 4).map((col, i) => (
                <div key={i} className={i === 0 ? '' : 'flex items-center justify-between'}>
                  {i === 0 ? (
                    <div className="font-medium text-text-primary">
                      {col.cell ? col.cell(item) : (item as any)[col.accessorKey]}
                    </div>
                  ) : (
                    <>
                      <span className="text-xs text-text-muted uppercase tracking-wider">{col.header}</span>
                      <span className="text-sm text-text-primary">
                        {col.cell ? col.cell(item) : (item as any)[col.accessorKey]}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
            {(onEdit || onView || onDelete) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                {onView && (
                  <button onClick={() => onView(item)} className="flex-1 flex items-center justify-center gap-1.5 p-2 text-xs font-medium text-text-muted hover:text-primary hover:bg-primary-light rounded-lg transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                )}
                {onEdit && (
                  <button onClick={() => onEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 p-2 text-xs font-medium text-text-muted hover:text-role-teacher hover:bg-role-teacher/10 rounded-lg transition-colors">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(item)} className="flex-1 flex items-center justify-center gap-1.5 p-2 text-xs font-medium text-text-muted hover:text-status-danger-text hover:bg-status-danger-bg rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="overflow-x-auto hidden sm:block">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-background text-text-muted text-xs uppercase border-b border-border">
            <tr>
              <th className="px-4 py-3 w-10">
                <button onClick={toggleSelectAll} className="text-text-muted hover:text-text-primary transition-colors min-h-[44px] flex items-center justify-center">
                  {selectedIds.size === paginatedData.length && paginatedData.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`px-4 py-3 font-medium ${col.sortable !== false ? 'cursor-pointer hover:bg-border/50' : ''} transition-colors`}
                  onClick={() => col.sortable !== false && handleSort(col.accessorKey as string)}
                >
                  <div className="flex items-center gap-1.5 min-h-[44px]">
                    {col.header}
                    {col.sortable !== false && sortConfig?.key === col.accessorKey && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onView || onDelete) && (
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr 
                key={item.id} 
                className={`border-b border-border last:border-0 hover:bg-background/60 transition-colors group ${rowClassName ? rowClassName(item) : ''}`}
              >
                <td className="px-4 py-3">
                  <button onClick={() => toggleSelect(item.id)} className="text-text-muted hover:text-text-primary transition-colors min-h-[44px] flex items-center justify-center">
                    {selectedIds.has(item.id) ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </td>
                {columns.map((col, i) => (
                  <td key={i} className="px-4 py-3 text-text-primary">
                    {col.cell ? col.cell(item) : (item as any)[col.accessorKey]}
                  </td>
                ))}
                
                {(onEdit || onView || onDelete) && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onView && (
                        <button onClick={() => onView(item)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light rounded transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {onEdit && (
                        <button onClick={() => onEdit(item)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-role-teacher hover:bg-role-teacher/10 rounded transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(item)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-status-danger-text hover:bg-status-danger-bg rounded transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {paginatedData.length === 0 && (
          <div className="p-8 text-center text-text-secondary text-sm">
            No results found for "{searchTerm}"
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
          <div className="text-center sm:text-left">
            Showing <span className="font-medium text-text-primary">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-text-primary">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-medium text-text-primary">{filteredData.length}</span> results
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 min-h-[44px] border border-border rounded-md disabled:opacity-50 hover:bg-background transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 min-h-[44px] border border-border rounded-md disabled:opacity-50 hover:bg-background transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
