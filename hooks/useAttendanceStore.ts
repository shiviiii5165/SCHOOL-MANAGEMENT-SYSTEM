import { create } from 'zustand';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'BLOCKED';

interface Student {
  id: string;
  isSuspended: boolean;
}

interface AttendanceStore {
  selectedClass: string | null;
  selectedSection: string | null;
  selectedDate: Date;
  attendanceMap: Record<string, AttendanceStatus>;
  
  // Computed values
  presentCount: number;
  absentCount: number;
  lateCount: number;
  blockedCount: number;
  
  // Actions
  setFilters: (classId: string | null, section: string | null, date: Date) => void;
  setStatus: (studentId: string, status: AttendanceStatus) => void;
  markAllPresent: () => void;
  resetAttendance: () => void;
  initAttendance: (students: Student[], existingRecords?: Record<string, AttendanceStatus>) => void;
}

export const useAttendanceStore = create<AttendanceStore>((set, get) => ({
  selectedClass: null,
  selectedSection: null,
  selectedDate: new Date(),
  attendanceMap: {},
  
  presentCount: 0,
  absentCount: 0,
  lateCount: 0,
  blockedCount: 0,

  setFilters: (classId, section, date) => set({ selectedClass: classId, selectedSection: section, selectedDate: date }),
  
  setStatus: (studentId, status) => {
    set((state) => {
      const newMap = { ...state.attendanceMap, [studentId]: status };
      return {
        attendanceMap: newMap,
        ...calculateCounts(newMap)
      };
    });
  },

  markAllPresent: () => {
    set((state) => {
      const newMap = { ...state.attendanceMap };
      Object.keys(newMap).forEach((id) => {
        if (newMap[id] !== 'BLOCKED') {
          newMap[id] = 'PRESENT';
        }
      });
      return {
        attendanceMap: newMap,
        ...calculateCounts(newMap)
      };
    });
  },

  resetAttendance: () => set({ attendanceMap: {}, presentCount: 0, absentCount: 0, lateCount: 0, blockedCount: 0 }),

  initAttendance: (students, existingRecords) => {
    const newMap: Record<string, AttendanceStatus> = {};
    
    students.forEach((s) => {
      if (s.isSuspended) {
        newMap[s.id] = 'BLOCKED';
      } else if (existingRecords && existingRecords[s.id]) {
        newMap[s.id] = existingRecords[s.id];
      } else {
        newMap[s.id] = 'PRESENT';
      }
    });

    set({
      attendanceMap: newMap,
      ...calculateCounts(newMap)
    });
  }
}));

function calculateCounts(map: Record<string, AttendanceStatus>) {
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let blockedCount = 0;
  
  Object.values(map).forEach((status) => {
    if (status === 'PRESENT') presentCount++;
    if (status === 'ABSENT') absentCount++;
    if (status === 'LATE') lateCount++;
    if (status === 'BLOCKED') blockedCount++;
  });

  return { presentCount, absentCount, lateCount, blockedCount };
}
