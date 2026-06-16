
import { z } from 'zod';
import { NoticeService } from '@/services/NoticeService';
import { AdminAnalyticsService } from '@/services/AdminAnalyticsService';

export const buildAdminTools = (userId: string, role: string) => {
  return {
    get_revenue_analytics: {
      description: 'Get school-wide revenue analytics and fee defaulters.',
      parameters: z.object({}),
      execute: async () => {
        try {
          return await AdminAnalyticsService.getRevenueAnalytics(userId, role);
        } catch (e: any) {
          return { error: e.message };
        }
      }
    },

    get_ai_analytics: {
      description: 'Get AI chatbot usage analytics, token usage, and cost estimates.',
      parameters: z.object({}),
      execute: async () => {
        try {
          return await AdminAnalyticsService.getAIAnalytics(userId, role);
        } catch (e: any) {
          return { error: e.message };
        }
      }
    },

    broadcast_notice: {
      description: 'Broadcast a new notice or announcement to the school.',
      parameters: z.object({
        title: z.string(),
        content: z.string(),
        targetAudience: z.enum(['ALL', 'STUDENT', 'TEACHER', 'PARENT'])
      }),
      execute: async (args: any) => {
        try {
          return await NoticeService.broadcastNotice(userId, args);
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
