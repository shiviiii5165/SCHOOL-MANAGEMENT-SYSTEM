import { streamText, stepCountIs } from 'ai';
import { getAIProvider } from '@/lib/ai/provider-factory';
import { buildStudentTools } from '@/lib/ai/tools/student-tools';
import { buildTeacherTools } from '@/lib/ai/tools/teacher-tools';
import { buildAdminTools } from '@/lib/ai/tools/admin-tools';
import { auth } from '@/lib/auth';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();

    // Context & History limitation (last 10 messages)
    const recentMessages = messages.slice(-10);

    const userId = session.user.id;
    const role = session.user.role || 'STUDENT';

    // Build the system prompt
    const systemPrompt = `
      You are the EduCore AI Assistant — a smart, friendly school management assistant.
      You are speaking to a ${role}.
      
      AVAILABLE TOOLS:
      - get_attendance_summary: Get attendance stats (present/absent/percentage)
      - get_attendance_history: Get date-wise attendance records
      - get_fees / get_pending_fees: Get fee dashboard or pending fee details
      - get_upcoming_exams: Get upcoming exam schedule with dates/subjects/rooms
      - get_exam_results: Get published exam results with marks/grades/rank
      - get_notices: Get current school announcements and notices
      - get_timetable: Get class timetable/schedule
      - get_pending_assignments: Get pending assignments and submission status
      
      RULES:
      1. Use the tools above to fetch real data. NEVER invent or hallucinate data.
      2. CRITICAL: After calling a tool and receiving data, YOU MUST immediately write a helpful text response summarizing the data. DO NOT call the same tool again. DO NOT loop.
      3. If a tool returns an error, explain it politely and suggest alternatives.
      4. Format responses in clean Markdown with headers, bullet points, and emoji where appropriate.
      5. Be concise but thorough. Students should feel helped, not overwhelmed.
      6. For general education questions (what is Python, who invented zero, etc.), answer directly without tools.
      7. Politely decline questions completely unrelated to education or EduCore.
    `;

    // Inject appropriate tools based on role
    let tools = {};
    if (role === 'STUDENT' || role === 'PARENT') {
      tools = buildStudentTools(userId, role);
    } else if (role === 'TEACHER') {
      tools = buildTeacherTools(userId, role);
    } else if (role === 'ADMIN') {
      tools = buildAdminTools(userId, role);
    }

    // Initialize provider
    const model = getAIProvider();

    // Stream text using Vercel AI SDK v6
    const result = streamText({
      model,
      system: systemPrompt,
      messages: recentMessages,
      tools,
      stopWhen: stepCountIs(3),
      abortSignal: AbortSignal.timeout(25000),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
