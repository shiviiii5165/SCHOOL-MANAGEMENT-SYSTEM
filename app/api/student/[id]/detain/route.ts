export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/security/apiGuard';
import { handleApiError } from '@/lib/security/errorHandler';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: authError } = await requireAuth(['ADMIN']);
    if (authError) return authError;

    const { id } = params;
    
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const { reason } = body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        examEligible: false,
        detainedAt: new Date(),
        detainedReason: reason || "Low attendance",
        detainedBy: session.user.id,
      },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json({
      success: true,
      message: `${student.user?.name} has been detained`,
    });
  } catch (error) {
    return handleApiError(error, 'student/[id]/detain');
  }
}
