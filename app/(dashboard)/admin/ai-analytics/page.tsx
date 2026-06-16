import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminAnalyticsService } from "@/services/AdminAnalyticsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Bot, Coins, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Analytics | EduCore Dashboard",
  description: "Monitor AI Assistant usage, tokens, and costs",
};

export default async function AIAnalyticsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  let analyticsData;
  try {
    analyticsData = await AdminAnalyticsService.getAIAnalytics(session.user.id, "ADMIN");
  } catch (e) {
    analyticsData = { totalQueries: 0, totalTokens: 0, estimatedCostUSD: 0 };
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">AI Assistant Analytics</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalQueries}</div>
            <p className="text-xs text-muted-foreground">Successful chat completions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Prompt + Completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.estimatedCostUSD.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">Based on GPT-4o-mini pricing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Online</div>
            <p className="text-xs text-muted-foreground">Provider: {process.env.AI_PROVIDER || 'GEMINI'}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Chatbot Budget Configuration</h3>
        <p className="text-sm text-gray-500 mb-4">
          Enable or disable the chatbot globally using the <code>ENABLE_CHATBOT</code> environment variable. 
          Cost monitoring is strictly enforced via token logging in the <code>AITokenUsage</code> database table.
        </p>
        <div className="flex gap-4">
          <div className="p-4 bg-gray-50 rounded-lg flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Global Feature Flag</span>
            <div className="mt-1 font-mono text-sm">{process.env.ENABLE_CHATBOT === 'true' ? 'ENABLED' : 'DISABLED / NOT SET'}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current Provider</span>
            <div className="mt-1 font-mono text-sm">{process.env.AI_PROVIDER || 'GEMINI'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
