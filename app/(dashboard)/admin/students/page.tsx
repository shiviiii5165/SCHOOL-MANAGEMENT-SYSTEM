import { prisma } from "@/lib/prisma";
import AdminStudentsClient from "./AdminStudentsClient";

export default async function AdminStudentsPage() {
  const [students, classes] = await Promise.all([
    prisma.student.findMany({
      include: {
        user: true,
        class: true,
        attendanceSummary: true,
        parent: { include: { user: true } },
        disciplineReports: {
          where: { actionType: "SUSPENSION" },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { rollNo: 'asc' }
    }),
    prisma.class.findMany({
      select: { id: true, name: true, section: true },
      orderBy: [{ name: 'asc' }, { section: 'asc' }]
    })
  ]);

  const data = students.map(student => {
    return {
      id: student.id,
      name: student.user.name,
      avatar: student.user.avatar || "",
      regId: student.user.regId,
      classId: student.classId,
      classInfo: student.class ? `${student.class.name} - ${student.class.section}` : "Unassigned",
      rollNo: student.rollNo,
      attendance: student.attendanceSummary?.attendancePercentage || 100,
      feeStatus: "PAID", // Placeholder until FeeRecord integration
      status: student.isSuspended ? "INACTIVE" : "ACTIVE",
      dateOfBirth: student.dateOfBirth.toISOString(),
      gender: student.gender || "Other",
      bloodGroup: student.bloodGroup || null,
      parentName: student.fatherName || "",
      parentPhone: student.fatherPhone || "",
      address: student.address || "",
      hasTransport: student.hasTransport,
      transportZone: student.transportZone,
    };
  });

  return <AdminStudentsClient data={data} classes={classes} />;
}
