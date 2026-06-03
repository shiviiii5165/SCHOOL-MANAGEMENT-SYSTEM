import AdminExamDetailClient from "./AdminExamDetailClient";

export default function ExamDetailPage({ params }: { params: { examId: string } }) {
  return <AdminExamDetailClient examId={params.examId} />;
}
