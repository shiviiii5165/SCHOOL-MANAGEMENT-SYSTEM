import { useState } from "react";
import { X, Check } from "lucide-react";

interface FilterPanelProps {
  classes: { id: string; name: string; section: string }[];
  filters: any;
  setFilters: (filters: any) => void;
  onClose: () => void;
}

export default function FilterPanel({ classes, filters, setFilters, onClose }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const applyFilters = () => {
    setFilters(localFilters);
    onClose();
  };

  const clearAll = () => {
    const cleared = {
      classId: "",
      feeStatus: "",
      attendance: "",
      status: "",
      transport: ""
    };
    setLocalFilters(cleared);
    setFilters(cleared);
    onClose();
  };

  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-border z-50 p-4">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
        <h3 className="font-semibold text-text-primary">Filters</h3>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Class Filter */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Class</label>
          <select 
            className="w-full text-sm border-border rounded-md"
            value={localFilters.classId}
            onChange={(e) => setLocalFilters({ ...localFilters, classId: e.target.value })}
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
            ))}
          </select>
        </div>

        {/* Fee Status */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Fee Status</label>
          <select 
            className="w-full text-sm border-border rounded-md"
            value={localFilters.feeStatus}
            onChange={(e) => setLocalFilters({ ...localFilters, feeStatus: e.target.value })}
          >
            <option value="">All</option>
            <option value="PAID">PAID</option>
            <option value="UNPAID">UNPAID</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="PARTIAL">PARTIAL</option>
          </select>
        </div>

        {/* Attendance */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Attendance</label>
          <select 
            className="w-full text-sm border-border rounded-md"
            value={localFilters.attendance}
            onChange={(e) => setLocalFilters({ ...localFilters, attendance: e.target.value })}
          >
            <option value="">All</option>
            <option value="GOOD">Above 75% (Good)</option>
            <option value="WARNING">50-75% (Warning)</option>
            <option value="CRITICAL">Below 50% (Critical)</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
          <select 
            className="w-full text-sm border-border rounded-md"
            value={localFilters.status}
            onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {/* Transport */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Transport</label>
          <select 
            className="w-full text-sm border-border rounded-md"
            value={localFilters.transport}
            onChange={(e) => setLocalFilters({ ...localFilters, transport: e.target.value })}
          >
            <option value="">All</option>
            <option value="true">With Transport</option>
            <option value="false">Without Transport</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
        <button 
          onClick={clearAll}
          className="flex-1 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-surface hover:bg-background rounded-md transition-colors"
        >
          Clear All
        </button>
        <button 
          onClick={applyFilters}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
