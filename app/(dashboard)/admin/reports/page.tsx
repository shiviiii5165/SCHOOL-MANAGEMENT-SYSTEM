"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, Calendar, Filter, Download, 
  Users, IndianRupee, GraduationCap, ShieldAlert 
} from "lucide-react";
import TopAnalyticsCards from "@/components/reports/TopAnalyticsCards";
import AttendanceAnalytics from "@/components/reports/AttendanceAnalytics";
import FinancialAnalytics from "@/components/reports/FinancialAnalytics";
import AcademicAnalytics from "@/components/reports/AcademicAnalytics";
import DisciplineAnalytics from "@/components/reports/DisciplineAnalytics";
import { exportToPDF } from "@/lib/exportUtils";

type ReportTab = "attendance" | "fees" | "academic" | "discipline";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("attendance");
  const [dateRange, setDateRange] = useState("This Month");
  
  // Fetch top-level analytics
  const { data: topAnalytics, isLoading: isLoadingTop } = useQuery({
    queryKey: ["reports-top"],
    queryFn: async () => {
      const res = await fetch("/api/reports/analytics");
      return res.json();
    }
  });

  // Fetch tab specific data
  const { data: tabData, isLoading: isLoadingTab } = useQuery({
    queryKey: [`reports-${activeTab}`],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${activeTab}`);
      return res.json();
    }
  });

  const handleExportPDF = () => {
    // A simplified generic export for demonstration
    // Real implementation would have specific data fetching/formatting per tab
    const columns = ["Metric", "Value"];
    const data = [
      ["Export Date", new Date().toLocaleDateString()],
      ["Report Type", activeTab.toUpperCase()],
      ["Date Range", dateRange],
    ];
    
    exportToPDF(
      `${activeTab.toUpperCase()} REPORT`,
      columns,
      data,
      `School_Report_${activeTab}_${new Date().getTime()}`
    );
  };

  const tabs = [
    { id: "attendance", label: "Attendance", icon: Users },
    { id: "fees", label: "Financial", icon: IndianRupee },
    { id: "academic", label: "Academic", icon: GraduationCap },
    { id: "discipline", label: "Discipline", icon: ShieldAlert },
  ] as const;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Reports & Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">School-wide academic, attendance, and financial insights</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface border border-border px-3 py-2 rounded-lg">
            <Calendar className="w-4 h-4 text-text-muted" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none text-sm font-medium focus:outline-none text-text-primary"
            >
              <option>This Week</option>
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Term</option>
              <option>Academic Year</option>
            </select>
          </div>
          
          <button className="flex items-center gap-2 bg-surface border border-border px-3 py-2 rounded-lg hover:bg-background transition-colors">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium">Filters</span>
          </button>
          
          <div className="flex items-center gap-2 ml-2">
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Top Analytics Cards */}
      <TopAnalyticsCards data={topAnalytics} isLoading={isLoadingTop} />

      {/* Main Content Area */}
      <div className="mt-8">
        {/* Custom Tab Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar border-b border-border mb-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary hover:bg-surface/50"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-primary" : "text-text-muted"}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "attendance" && (
            <AttendanceAnalytics data={tabData} isLoading={isLoadingTab} />
          )}
          {activeTab === "fees" && (
            <FinancialAnalytics data={tabData} isLoading={isLoadingTab} />
          )}
          {activeTab === "academic" && (
            <AcademicAnalytics data={tabData} isLoading={isLoadingTab} />
          )}
          {activeTab === "discipline" && (
            <DisciplineAnalytics data={tabData} isLoading={isLoadingTab} />
          )}
        </div>
      </div>
    </div>
  );
}
