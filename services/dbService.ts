import { Assignment, Submission } from "../types";

// Key constants
const STORAGE_KEY_ASSIGNMENTS = "cdas_assignments";
const STORAGE_KEY_SUBMISSIONS = "cdas_submissions";

// --- Mock Assignments Table ---

export const saveAssignment = (assignment: Assignment): void => {
  const current = getAssignments();
  current.push(assignment);
  localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(current));
};

export const getAssignments = (): Assignment[] => {
  const stored = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
  return stored ? JSON.parse(stored) : [];
};

export const getAssignmentById = (id: string): Assignment | undefined => {
  const assignments = getAssignments();
  return assignments.find((a) => a.id === id);
};

// --- Mock Submissions Table ---

export const saveSubmission = (submission: Submission): void => {
  const current = getSubmissions();
  // Upsert logic for simplicity (replace if exists for same assignment/student)
  const existingIndex = current.findIndex(s => s.id === submission.id);
  
  if (existingIndex >= 0) {
    current[existingIndex] = submission;
  } else {
    current.push(submission);
  }
  
  localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(current));
};

export const getSubmissions = (): Submission[] => {
  const stored = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
  return stored ? JSON.parse(stored) : [];
};

export const getSubmissionsByAssignmentId = (assignmentId: string): Submission[] => {
  const submissions = getSubmissions();
  return submissions.filter((s) => s.assignment_id === assignmentId);
};
