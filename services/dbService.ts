import { Assignment, Submission } from "../types";

// Key constants
const STORAGE_KEY_ASSIGNMENTS = "cdas_assignments";
const STORAGE_KEY_SUBMISSIONS = "cdas_submissions";
const STORAGE_KEY_CUSTOM_KB = "cdas_custom_knowledge_base"; // New key for KB

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

// --- Custom Knowledge Base Persistence ---

export const saveCustomKnowledgeBase = (content: string, fileName: string): void => {
  // Simple compression by limiting length if needed, but for now assuming users don't upload books.
  // In a real heavy app, we'd use IndexedDB.
  const data = { content, fileName, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_KB, JSON.stringify(data));
  } catch (e) {
    console.error("Storage limit reached", e);
    alert("知识库内容过大，无法保存到本地缓存。建议减少文件数量。");
  }
};

export const getCustomKnowledgeBase = (): { content: string; fileName: string; updatedAt: string } | null => {
  const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_KB);
  return stored ? JSON.parse(stored) : null;
};

export const clearCustomKnowledgeBase = (): void => {
  localStorage.removeItem(STORAGE_KEY_CUSTOM_KB);
};