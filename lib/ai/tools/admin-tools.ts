import { tool } from 'ai';
import { z } from 'zod';
import { NoticeService } from '@/services/NoticeService';
import { AdminAnalyticsService } from '@/services/AdminAnalyticsService';

export const buildAdminTools = (userId: string, role: string) => {
  return {
    get_revenue_analytics: tool({
      description: 'Get school-wide revenue analytics and fee defaulters.',
      parameters: z.object({}),
      execute: async () => {
        try {
          return await AdminAnalyticsService.getRevenueAnalytics(userId, role);
        } catch (e: any) {
          return { error: e.message };
        }
      }
    }),

    get_ai_analytics: tool({
      description: 'Get AI chatbot usage analytics, token usage, and cost estimates.',
      parameters: z.object({}),
      execute: async () => {
        try {
          return await AdminAnalyticsService.getAIAnalytics(userId, role);
        } catch (e: any) {
          return { error: e.message };
        }
      }
    }),

    broadcast_notice: tool({
      description: 'Broadcast a new notice or announcement to the school.',
      parameters: z.object({
        title: z.string(),
        content: z.string(),
        targetAudience: z.enum(['ALL', 'STUDENT', 'TEACHER', 'PARENT'])
      }),
      execute: async (args) => {
        try {
          return await NoticeService.broadcastNotice(userId, args);
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
