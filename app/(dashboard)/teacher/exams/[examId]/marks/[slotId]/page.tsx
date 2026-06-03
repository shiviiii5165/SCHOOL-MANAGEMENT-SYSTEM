import TeacherMarksEntryClient from "./TeacherMarksEntryClient";

export default function TeacherMarksEntryPage({ params }: { params: { examId: string; slotId: string } }) {
  return <TeacherMarksEntryClient examId={params.examId} slotId={params.slotId} />;
}
