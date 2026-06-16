
import { z } from 'zod';
import { AttendanceService } from '@/services/attendance.service';
import { FeeService } from '@/services/FeeService';
import { AssignmentService } from '@/services/AssignmentService';
import { ExamService } from '@/services/ExamService';
import { NoticeService } from '@/services/NoticeService';
import { TimetableService } from '@/services/TimetableService';
import { prisma } from '@/lib/prisma';

// Helper to auto-resolve studentId from session
async function resolveStudentId(userId: string, role: string, providedStudentId?: string): Promise<string> {
  if (providedStudentId) return providedStudentId;

  if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new Error('Student record not found');
    return student.id;
  }

  if (role === 'PARENT') {
    const parent = await prisma.parent.findUnique({ where: { userId }, include: { students: true } });
    if (!parent || parent.students.length === 0) throw new Error('No students found');
    if (parent.students.length === 1) return parent.students[0].id;
    throw new Error('Multiple children found. Please specify which child.');
  }

  throw new Error('studentId is required for this role');
}

export const buildStudentTools = (userId: string, role: string) => {
  return {
    get_attendance_summary: {
      description: 'Get the attendance summary (present count, absent count, percentage) for the current student.',
      parameters: z.object({
        studentId: z.string().optional().describe('Optional. Auto-resolved for students/parents.'),
      }),
      execute: async ({ studentId }: any) => {
        try {
          const sid = await resolveStudentId(userId, role, studentId);
          return await AttendanceService.getStudentSummary(userId, role, sid);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    },

    get_attendance_history: {
      description: 'Get recent attendance records showing date-wise present/absent status.',
      parameters: z.object({
        studentId: z.string().optional().describe('Optional. Auto-resolved for students/parents.'),
        limit: z.number().optional().describe('Number of recent records. Default 10.'),
      }),
      execute: async ({ studentId, limit }: any) => {
        try {
          const sid = await resolveStudentId(userId, role, studentId);
          return await AttendanceService.getStudentHistory(userId, role, sid, limit);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    },

    get_fees: {
      description: 'Get the fee dashboard data including pending fees, paid fees, outstanding amounts, and payment history.',
      parameters: z.object({}),
      execute: async () => {
        try {
          return await FeeService.getDashboardData(userId, role);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    },

    get_pending_fees: {
      description: 'Get only the pending/unpaid fee records for the current student.',
      parameters: z.object({
        studentId: z.string().optional().describe('Optional. Auto-resolved for students/parents.'),
      }),
      execute: async ({ studentId }: any) => {
        try {
          const sid = await resolveStudentId(userId, role, studentId);
          return await FeeService.getPendingFees(userId, role, sid);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    },

    get_upcoming_exams: {
      description: 'Get upcoming exams including subjects, dates, times, and rooms.',
      parameters: z.object({
        studentId: z.string().optional().describe('Optional. Auto-resolved for students/parents.'),
      }),
      execute: async ({ studentId }: any) => {
        try {
          const sid = await resolveStudentId(userId, role, studentId);
          return await ExamService.getUpcomingExams(userId, role, sid);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    },

    get_exam_results: {
      description: 'Get published exam results including marks, percentage, grade, and rank.',
      parameters: z.object({
        studentId: z.string().optional().describe('Optional. Auto-resolved for students/parents.'),
      }),
      execute: async ({ studentId }: any) => {
        try {
          const sid = await resolveStudentId(userId, role, studentId);
          return await ExamService.getExamResults(userId, role, sid);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    },

    get_notices: {
      description: 'Get current active notices and announcements.',
      parameters: z.object({}),
      execute: async () => {
        try {
          return await NoticeService.getActiveNotices(userId, role);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    },

    get_timetable: {
      description: 'Get the class timetable/schedule showing subjects, teachers, and timings for each day.',
      parameters: z.object({
        studentId: z.string().optional().describe('Optional. Auto-resolved for students/parents.'),
      }),
      execute: async ({ studentId }: any) => {
        try {
          const sid = await resolveStudentId(userId, role, studentId);
          return await TimetableService.getTimetableForStudent(userId, role, sid);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    },

    get_pending_assignments: {
      description: 'Get pending (unsubmitted) assignments along with counts of completed vs pending.',
      parameters: z.object({
        studentId: z.string().optional().describe('Optional. Auto-resolved for students/parents.'),
      }),
      execute: async ({ studentId }: any) => {
        try {
          const sid = await resolveStudentId(userId, role, studentId);
          return await AssignmentService.getPendingAssignments(userId, role, sid);
        } catch (error: any) {
          return { error: error.message };
        }
      },
    },
  };
};
