
import { z } from 'zod';
import { AttendanceService } from '@/services/attendance.service';
import { FeeService } from '@/services/FeeService';
import { AssignmentService } from '@/services/AssignmentService';
import { ExamService } from '@/services/ExamService';
import { NoticeService } from '@/services/NoticeService';
import { TimetableService } from '@/services/TimetableService';
import { DisciplineService } from '@/services/DisciplineService';

export const buildStudentTools = (userId: string, role: string) => {
  return {
    get_attendance_summary: {
      description: 'Get the attendance summary for a specific student.',
      parameters: z.object({
        studentId: z.string().optional().describe('Optional. The ID of the student. If the user is a student, you do not need to provide this.'),
      }),
      execute: async ({ studentId }: any) => {
        try {
          return await AttendanceService.getStudentSummary(userId, role, studentId);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    },
    get_attendance_history: {
      description: 'Get recent attendance history for a specific student.',
      parameters: z.object({
        studentId: z.string().optional().describe('Optional. The ID of the student.'),
        limit: z.number().optional().describe('Number of recent records to fetch. Default is 10.'),
      }),
      execute: async ({ studentId, limit }: any) => {
        try {
          return await AttendanceService.getStudentHistory(userId, role, studentId, limit);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    },
    get_notices: {
      description: 'Get current active notices and announcements for the user.',
      parameters: z.object({}),
      execute: async () => {
        try {
          return await NoticeService.getActiveNotices(userId, role);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    },
  };
};
