import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role   = session.user.role as string
    const myId   = session.user.id
    const online = (global as any)._onlineUsers as Map<string, Set<string>> ?? new Map()

    const fmt = (u: any) => u ? {
      id:       u.id,
      name:     u.name,
      role:     u.role,
      avatar:   u.avatar,
      isOnline: online.has(u.id),
      subtitle: u._subtitle ?? null,
    } : null

    if (role === 'STUDENT' || role === 'PARENT') {
      const teachers = await prisma.user.findMany({ where: { role: 'TEACHER', isActive: true }, select: { id:true, name:true, role:true, avatar:true } })
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN',   isActive: true }, select: { id:true, name:true, role:true, avatar:true } })
      
      return NextResponse.json({
        sections: [
          { id: 'teachers', label: 'Teachers', isGroupAction: false, items: teachers.map(fmt).filter(Boolean) },
          { id: 'admins',   label: 'Admin',    isGroupAction: false, items: admins.map(fmt).filter(Boolean)   },
        ]
      })
    }

    if (role === 'TEACHER') {
      const allTeachers = await prisma.user.findMany({ where: { role: 'TEACHER', isActive: true, NOT: { id: myId } }, select: { id:true, name:true, role:true, avatar:true } })
      const students = await prisma.student.findMany({ include: { user: { select: { id:true, name:true, role:true, avatar:true } }, class: { select: { name:true, section:true } } } })
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id:true, name:true, role:true, avatar:true } })
      const myClasses = await prisma.class.findMany({ where: { teacher: { userId: myId } }, select: { id:true, name:true, section:true, _count: { select: { students: true } } } })

      return NextResponse.json({
        sections: [
          {
            id: 'groups', label: 'Groups', isGroupAction: true,
            items: [
              { id: 'group:all-teachers', name: 'All Teachers', role: 'GROUP',
                subtitle: `Message all ${allTeachers.length + 1} teachers`, isOnline: false },
              ...myClasses.map(c => ({
                id: `group:class:${c.id}`, name: `Class ${c.name}-${c.section}`,
                role: 'GROUP', subtitle: `${c._count.students} students`, isOnline: false,
                classId: c.id,
              }))
            ]
          },
          { id: 'teachers', label: 'Teachers', isGroupAction: false, items: allTeachers.map(fmt).filter(Boolean) },
          {
            id: 'students', label: 'Students', isGroupAction: false,
            items: students.filter(s => s.user).map(s => ({ ...fmt(s.user), subtitle: `Class ${s.class?.name || 'Unknown'}-${s.class?.section || ''}` }))
          },
          { id: 'admins', label: 'Admin', isGroupAction: false, items: admins.map(fmt).filter(Boolean) },
        ]
      })
    }

    // ADMIN — full access
    const teachers = await prisma.user.findMany({ where: { role: 'TEACHER', isActive: true }, select: { id:true, name:true, role:true, avatar:true } })
    const students = await prisma.student.findMany({ include: { user: { select: { id:true, name:true, role:true, avatar:true } }, class: { select: { name:true, section:true } } } })
    const parents = await prisma.user.findMany({ where: { role: 'PARENT', isActive: true }, select: { id:true, name:true, role:true, avatar:true } })
    const allUsersCount = await prisma.user.count({ where: { isActive: true } })
    const classes = await prisma.class.findMany({ select: { id:true, name:true, section:true, _count: { select: { students: true } } } })

    return NextResponse.json({
      sections: [
        {
          id: 'broadcast', label: 'Broadcast', isGroupAction: true,
          items: [
            { id: 'broadcast:school', name: 'Whole School', role: 'BROADCAST',
              subtitle: `Reach all ${allUsersCount} users`, isOnline: false },
            { id: 'broadcast:teachers', name: 'All Teachers', role: 'BROADCAST',
              subtitle: `${teachers.length} teachers`, isOnline: false },
          ]
        },
        {
          id: 'class-groups', label: 'Class Groups', isGroupAction: true,
          items: classes.map(c => ({
            id: `group:class:${c.id}`, name: `Class ${c.name}-${c.section}`,
            role: 'GROUP', subtitle: `${c._count.students} students`, isOnline: false, classId: c.id,
          }))
        },
        { id: 'teachers', label: 'Teachers', isGroupAction: false, items: teachers.map(fmt).filter(Boolean) },
        {
          id: 'students', label: 'Students', isGroupAction: false,
          items: students.filter(s => s.user).map(s => ({ ...fmt(s.user), subtitle: `Class ${s.class?.name || 'Unknown'}-${s.class?.section || ''}` }))
        },
        { id: 'parents', label: 'Parents', isGroupAction: false, items: parents.map(fmt).filter(Boolean) },
      ]
    })
  } catch (error: any) {
    console.error("Contacts route error:", error)
    return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 })
  }
}
