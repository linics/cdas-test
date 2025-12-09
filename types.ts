export type Difficulty = 'basic' | 'challenge';

export interface Task {
  id: number;
  question: string;
  subject_focus: string;
}

export interface EvaluationCriteria {
  knowledge_points: string[];
  core_competencies: string[];
}

export interface AssignmentContent {
  title: string;
  scenario: string;
  tasks: Task[];
  evaluation_criteria: EvaluationCriteria;
}

export interface Assignment {
  id: string;
  topic: string;
  subjects: string[];
  difficulty: Difficulty;
  content: AssignmentContent;
  created_at: string;
  standards_ref?: string;
}

export interface FeedbackDimensions {
  accuracy: 'High' | 'Medium' | 'Low';
  creativity: 'High' | 'Medium' | 'Low';
  effort_detected: boolean;
}

export interface AIEvaluation {
  score: number;
  feedback_summary: string;
  dimensions: FeedbackDimensions;
  detailed_comments: string[];
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_name: string;
  content_text: string;
  image_url?: string; // In this demo, this will be a base64 string
  ai_evaluation?: AIEvaluation;
  created_at: string;
}

// New type for file staging area
export interface StagedFile {
  id: string;
  file: File;
  status: 'pending' | 'parsing' | 'success' | 'error';
  content?: string;
  errorMessage?: string;
}