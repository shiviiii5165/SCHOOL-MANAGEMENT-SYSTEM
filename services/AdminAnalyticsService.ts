import { prisma } from '@/lib/prisma';

export class AdminAnalyticsService {
  static async validateAdmin(userId: string, role: string) {
    if (role !== 'ADMIN') throw new Error("Unauthorized");
    return true;
  }

  static async getRevenueAnalytics(userId: string, role: string) {
    await this.validateAdmin(userId, role);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const paidRecords = await prisma.feeRecord.findMany({
      where: { status: 'PAID', paidDate: { gte: startOfMonth } }
    });

    const totalCollectedThisMonth = paidRecords.reduce((sum: number, r: any) => sum + r.paidAmount, 0);

    const defaulters = await prisma.feeRecord.findMany({
      where: { status: { in: ['OVERDUE', 'PARTIAL'] }, dueDate: { lt: now } },
      include: { student: { include: { user: true } } },
      orderBy: { amount: 'desc' },
      take: 10
    });

    return {
      totalCollectedThisMonth,
      topDefaulters: defaulters.map((d: any) => ({
        studentName: d.student.user.name,
        amountDue: d.amount - d.paidAmount,
        dueDate: d.dueDate
      }))
    };
  }

  static async getAIAnalytics(userId: string, role: string) {
    await this.validateAdmin(userId, role);

    const usage = await prisma.aITokenUsage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    const totalPromptTokens = usage.reduce((sum: number, u: any) => sum + u.promptTokens, 0);
    const totalCompletionTokens = usage.reduce((sum: number, u: any) => sum + u.completionTokens, 0);
    const totalTokens = totalPromptTokens + totalCompletionTokens;

    // GPT-4o-mini pricing: $0.15 per 1M input, $0.60 per 1M output
    const estimatedCost = (totalPromptTokens / 1000000) * 0.15 + (totalCompletionTokens / 1000000) * 0.60;

    return {
      totalQueries: usage.length,
      totalTokens,
      estimatedCostUSD: estimatedCost,
    };
  }
}
