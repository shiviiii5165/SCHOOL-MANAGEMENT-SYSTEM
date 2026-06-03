import { prisma } from "@/lib/prisma";
import AdminTeachersClient from "./AdminTeachersClient";

export default async function AdminTeachersPage() {
  const teachers = await prisma.teacher.findMany({
    include: {
      user: true,
      subjects: true,
      classes: true,
    },
    orderBy: { joinDate: 'desc' }
  });

  const data = teachers.map(teacher => {
    return {
      id: teacher.id,
      name: teacher.user.name,
      avatar: teacher.user.avatar || "",
      regId: teacher.user.regId,
      subjects: teacher.subjects.map(s => s.name),
      classes: teacher.classes.map(c => `${c.name}-${c.section}`),
      joinDate: teacher.joinDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: teacher.user.isActive ? "ACTIVE" : "ON LEAVE",
    };
  });

  return <AdminTeachersClient data={data} />;
}
