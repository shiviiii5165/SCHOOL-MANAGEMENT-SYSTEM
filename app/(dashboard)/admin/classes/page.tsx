import { prisma } from "@/lib/prisma";
import AdminClassesClient from "./AdminClassesClient";

export default async function AdminClassesPage() {
  const classes = await prisma.class.findMany({
    include: {
      teacher: {
        include: {
          user: true
        }
      },
      _count: {
        select: { students: true }
      }
    },
    orderBy: [
      { name: 'asc' },
      { section: 'asc' }
    ]
  });

  const data = classes.map(c => {
    return {
      id: c.id,
      name: c.name,
      section: c.section,
      classTeacher: c.teacher?.user?.name || "Unassigned",
      totalStudents: c._count.students,
      roomNo: "N/A", // Room is not currently in the schema
    };
  });

  return <AdminClassesClient data={data} />;
}
