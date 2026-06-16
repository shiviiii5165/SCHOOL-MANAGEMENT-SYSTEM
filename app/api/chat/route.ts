import { streamText } from 'ai';
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
      You are the EduCore AI Assistant.
      You are speaking to a ${role}.
      Always provide helpful, concise answers.
      If you need to fetch data, use the provided tools.
      Do not invent or hallucinate data, especially regarding attendance, fees, or grades.
      Always format your responses nicely in Markdown.
      Refuse to answer questions unrelated to EduCore or education.
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
      abortSignal: AbortSignal.timeout(25000),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
