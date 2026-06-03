import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@school.com' } });
    if (!admin) return NextResponse.json({ error: 'Admin not found' });
    
    const isMatch = await bcrypt.compare('Admin@123', admin.password);
    
    return NextResponse.json({ 
      success: true, 
      adminFound: true, 
      passwordMatch: isMatch,
      env: {
         dbUrl: process.env.DATABASE_URL?.substring(0, 25) + '...',
         authSecret: !!process.env.AUTH_SECRET,
         nextAuthSecret: !!process.env.NEXTAUTH_SECRET
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack });
  }
}
