"use client";

import { useState, useEffect } from "react";
import { BookOpen, Calendar as CalendarIcon, Download, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { formatExamDate } from "@/lib/examUtils";
import jsPDF from "jspdf";
import QRCode from "qrcode";

export default function StudentExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/exams")
      .then(res => res.json())
      .then(data => {
        if (data.exams) setExams(data.exams);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const downloadAdmitCard = async (examId: string, examName: string) => {
    setDownloadingId(examId);
    try {
      const res = await fetch(`/api/student/exams/${examId}/admit-card`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to fetch admit card");
      if (data.isBlocked) throw new Error(data.blockReason || "Admit card blocked");

      // Generate PDF
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(37, 99, 235); // primary color
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("EduCore School", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Hall Ticket / Admit Card", 105, 30, { align: "center" });

      // Student Details
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${data.examName} (${data.academicYear})`, 20, 55);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Student Name: ${data.studentName}`, 20, 70);
      doc.text(`Roll No: ${data.rollNo}`, 120, 70);
      doc.text(`Class: ${data.className}`, 20, 80);
      doc.text(`Reg ID: ${data.regId}`, 120, 80);
      doc.text(`Father's Name: ${data.fatherName}`, 20, 90);
      
      // QR Code
      try {
        const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
          reg: data.regId,
          exam: data.examName,
          roll: data.rollNo
        }));
        doc.addImage(qrDataUrl, "PNG", 160, 50, 30, 30);
      } catch (e) {
        console.error("QR Code generation failed");
      }

      // Timetable Table
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(20, 110, 170, 10, "F");
      doc.rect(20, 110, 170, 10);
      
      doc.setFont("helvetica", "bold");
      doc.text("Date", 25, 117);
      doc.text("Time", 65, 117);
      doc.text("Subject", 110, 117);
      doc.text("Room", 165, 117);

      let yPos = 120;
      doc.setFont("helvetica", "normal");
      data.slots.forEach((slot: any) => {
        doc.rect(20, yPos, 170, 10);
        doc.text(formatExamDate(slot.date), 25, yPos + 7);
        doc.text(`${slot.startTime} - ${slot.endTime}`, 65, yPos + 7);
        doc.text(slot.subject, 110, yPos + 7);
        doc.text(slot.room, 165, yPos + 7);
        yPos += 10;
      });

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Instructions:", 20, yPos + 20);
      doc.text("1. Students must carry this hall ticket to the examination hall.", 20, yPos + 27);
      doc.text("2. Electronic gadgets are strictly prohibited.", 20, yPos + 33);
      doc.text("3. Arrive at least 15 minutes before the scheduled start time.", 20, yPos + 39);
      
      doc.setLineWidth(0.5);
      doc.line(140, yPos + 40, 190, yPos + 40);
      doc.text("Controller of Examinations", 145, yPos + 45);

      doc.save(`Admit_Card_${data.rollNo}_${examName.replace(/ /g, '_')}.pdf`);
      toast.success("Admit card downloaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to download admit card");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-text-secondary animate-pulse">Loading upcoming exams...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My Examinations</h1>
        <p className="text-sm text-text-secondary">View upcoming exam schedules and download admit cards.</p>
      </div>

      {exams.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">No Upcoming Exams</h3>
          <p className="text-text-secondary max-w-sm mb-6">There are no exams scheduled for your class at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {exams.map(exam => (
            <div key={exam.id} className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-6 border-b border-border bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-text-primary text-xl">{exam.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">{exam.academicYear} • {exam.type.replace(/_/g, ' ')}</p>
                </div>
                
                {/* Eligibility Banner inside header */}
                <div className="flex-shrink-0">
                  {exam.isBlocked ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg max-w-xs">
                      <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-bold">Not Eligible</p>
                        <p className="text-xs leading-tight opacity-90 mt-0.5">{exam.blockReason}</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => downloadAdmitCard(exam.id, exam.name)}
                      disabled={downloadingId === exam.id}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
                    >
                      {downloadingId === exam.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download Admit Card
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <h4 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-text-muted" />
                  Examination Timetable
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {exam.slots.map((slot: any) => (
                    <div key={slot.id} className="border border-border rounded-lg p-4 bg-background">
                      <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">{formatExamDate(slot.date)}</div>
                      <h5 className="font-bold text-text-primary mb-2 text-lg">{slot.subjectName}</h5>
                      <div className="space-y-1.5 text-sm text-text-secondary">
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span className="font-medium text-text-primary">{slot.startTime} - {slot.endTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Room:</span>
                          <span className="font-medium text-text-primary">{slot.room}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Marks:</span>
                          <span className="font-medium text-text-primary">{slot.maxMarks}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
