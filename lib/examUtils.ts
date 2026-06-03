/**
 * Examination Utility Functions
 * Centralized grade calculation and exam summary computation.
 * ALL grade calculations across the system MUST use these functions — never inline.
 */

export function calculateGrade(marks: number, maxMarks: number): string {
  if (maxMarks <= 0) return 'F'
  const pct = (marks / maxMarks) * 100
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 33) return 'D'
  return 'F'
}

export function getGradeColor(grade: string): string {
  const map: Record<string, string> = {
    'A+': 'text-emerald-600 bg-emerald-50',
    'A':  'text-green-600 bg-green-50',
    'B+': 'text-blue-600 bg-blue-50',
    'B':  'text-blue-500 bg-blue-50',
    'C':  'text-amber-600 bg-amber-50',
    'D':  'text-orange-600 bg-orange-50',
    'F':  'text-red-600 bg-red-50',
    'AB': 'text-slate-500 bg-slate-100',
  }
  return map[grade] ?? 'text-slate-500 bg-slate-100'
}

export function computeExamSummary(results: { marks: number | null; isAbsent: boolean; maxMarks: number }[]) {
  const valid = results.filter(r => !r.isAbsent && r.marks !== null)
  const totalMarks = valid.reduce((s, r) => s + r.marks!, 0)
  const maxMarks   = results.reduce((s, r) => s + r.maxMarks, 0)
  const pct        = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0
  return {
    totalMarks,
    maxMarks,
    percentage: Math.round(pct * 10) / 10,
    grade:      calculateGrade(totalMarks, maxMarks),
    isPassed:   pct >= 33,
  }
}

/** Human-readable exam type label */
export function examTypeLabel(type: string): string {
  const map: Record<string, string> = {
    UNIT_TEST_1: 'Unit Test 1',
    UNIT_TEST_2: 'Unit Test 2',
    MID_TERM:    'Mid Term',
    PRE_BOARD:   'Pre Board',
    FINAL:       'Final',
    PRACTICAL:   'Practical',
  }
  return map[type] ?? type
}

/** Format date for display */
export function formatExamDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
