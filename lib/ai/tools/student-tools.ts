import { tool } from 'ai';
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
    get_attendance_summary: tool({
      description: 'Get the attendance summary for a specific student.',
      parameters: z.object({
        studentId: z.string().describe('The ID of the student to fetch attendance for.'),
      }),
      execute: async ({ studentId }) => {
        try {
          return await AttendanceService.getStudentSummary(userId, role, studentId);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    }),
    get_attendance_history: tool({
      description: 'Get recent attendance history for a specific student.',
      parameters: z.object({
        studentId: z.string().describe('The ID of the student.'),
        limit: z.number().optional().describe('Number of recent records to fetch. Default is 10.'),
      }),
      execute: async ({ studentId, limit }) => {
        try {
          return await AttendanceService.getStudentHistory(userId, role, studentId, limit);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    }),
    // Additional student tools (getFees, getExams) will go here
  };
};
