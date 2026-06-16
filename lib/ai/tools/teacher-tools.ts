
import { z } from 'zod';
import { AttendanceService } from '@/services/attendance.service';
import { AssignmentService } from '@/services/AssignmentService';
import { TimetableService } from '@/services/TimetableService';
import { DisciplineService } from '@/services/DisciplineService';
import { NoticeService } from '@/services/NoticeService';

export const buildTeacherTools = (userId: string, role: string) => {
  return {
    get_timetable: {
      description: 'Get the teaching schedule and timetable for the teacher.',
      parameters: z.object({}),
      execute: async () => {
        try {
          return await TimetableService.getTimetableForTeacher(userId, role);
        } catch (e: any) {
          return { error: e.message };
        }
      }
    },

    get_class_assignments: {
      description: 'Get all assignments created by the teacher, including submission counts.',
      parameters: z.object({ classId: z.string().optional() }),
      execute: async ({ classId }: any) => {
        try {
          return await AssignmentService.getAssignments(userId, role, { classId });
        } catch (e: any) {
          return { error: e.message };
        }
      }
    },

    file_discipline_report: {
      description: 'File a discipline report for a student.',
      parameters: z.object({
        studentId: z.string(),
        category: z.string(),
        description: z.string(),
      }),
      execute: async (args: any) => {
        try {
          return await DisciplineService.fileReport(userId, args);
        } catch (e: any) {
          return { error: e.message };
        }
      }
    },

    get_notices: {
      description: 'Get active school notices and announcements.',
      parameters: z.object({}),
      execute: async () => {
        try {
          return await NoticeService.getActiveNotices(userId, role);
        } catch (e: any) {
          return { error: e.message };
        }
      }
    },
  };
}
