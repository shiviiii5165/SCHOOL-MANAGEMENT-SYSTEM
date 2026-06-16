import { tool } from 'ai';
import { z } from 'zod';
import { AttendanceService } from '@/services/attendance.service';
import { AssignmentService } from '@/services/AssignmentService';
import { TimetableService } from '@/services/TimetableService';
import { DisciplineService } from '@/services/DisciplineService';
import { NoticeService } from '@/services/NoticeService';

export const buildTeacherTools = (userId: string, role: string) => {
  return {
    get_timetable: tool({
      description: 'Get the teaching schedule and timetable for the teacher.',
      parameters: z.object({}),
      execute: async () => {
        try {
          return await TimetableService.getTimetableForTeacher(userId, role);
        } catch (e: any) {
          return { error: e.message };
        }
      }
    }),

    get_class_assignments: tool({
      description: 'Get all assignments created by the teacher, including submission counts.',
      parameters: z.object({ classId: z.string().optional() }),
      execute: async ({ classId }) => {
        try {
          return await AssignmentService.getAssignments(userId, role, { classId });
        } catch (e: any) {
          return { error: e.message };
        }
      }
    }),

    file_discipline_report: tool({
      description: 'File a discipline report for a student.',
      parameters: z.object({
        studentId: z.string(),
        category: z.string(),
        severity: z.string(),
        description: z.string(),
        incidentDate: z.string().describe("ISO date string, e.g. YYYY-MM-DD")
      }),
      execute: async (args) => {
        try {
          return await DisciplineService.fileReport(userId, args);
        } catch (e: any) {
          return { error: e.message };
        }
      }
    }),

    get_notices: tool({
      description: 'Get active school notices and announcements.',
      parameters: z.object({}),
      execute: async () => {
        try {
          return await NoticeService.getActiveNotices(userId, role);
        } catch (e: any) {
          return { error: e.message };
        }
      }
    }),
  };
}
