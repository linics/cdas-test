import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AssignmentContent, AIEvaluation } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Agent A: The Architect (作业架构师) ---

const assignmentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Title of the assignment in Chinese" },
    scenario: { type: Type.STRING, description: "The phenomenon-based scenario context in Chinese" },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          question: { type: Type.STRING, description: "The specific task question in Chinese" },
          subject_focus: { type: Type.STRING, description: "The academic subject this task relates to" },
        },
        required: ["id", "question", "subject_focus"],
      },
    },
    evaluation_criteria: {
      type: Type.OBJECT,
      properties: {
        knowledge_points: { type: Type.ARRAY, items: { type: Type.STRING } },
        core_competencies: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["knowledge_points", "core_competencies"],
    },
  },
  required: ["title", "scenario", "tasks", "evaluation_criteria"],
};

export const generateAssignment = async (
  topic: string,
  subjects: string[],
  difficulty: string
): Promise<AssignmentContent> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Role: You are an expert educational designer specializing in Phenomenon-based Learning (PBL).
    Task: Create a cross-disciplinary homework assignment.
    
    Inputs:
    - Topic: ${topic}
    - Subjects: ${subjects.join(", ")}
    - Difficulty: ${difficulty}

    Requirements:
    1. Language: All generated content (Title, Scenario, Tasks, Criteria) MUST be in Simplified Chinese (zh-CN).
    2. Deep Integration: Do not just list questions. Create a scenario that requires knowledge from all selected subjects to solve.
    3. Difficulty: If 'challenge', include open-ended inquiry tasks. If 'basic', focus on foundational concepts.
    4. Output: Return ONLY valid JSON adhering to the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: assignmentSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AssignmentContent;
  } catch (error) {
    console.error("Agent A Error:", error);
    throw error;
  }
};

// --- Agent B: The Mentor (评估导师) ---

const evaluationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Score from 0-100" },
    feedback_summary: { type: Type.STRING, description: "Encouraging summary in Chinese" },
    dimensions: {
      type: Type.OBJECT,
      properties: {
        accuracy: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
        creativity: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
        effort_detected: { type: Type.BOOLEAN },
      },
      required: ["accuracy", "creativity", "effort_detected"],
    },
    detailed_comments: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: "Specific comments in Chinese" },
    },
  },
  required: ["score", "feedback_summary", "dimensions", "detailed_comments"],
};

export const evaluateSubmission = async (
  assignmentContext: AssignmentContent,
  studentText: string,
  imageBase64?: string
): Promise<AIEvaluation> => {
  const model = "gemini-2.5-flash"; // Excellent multimodal capabilities

  const parts: any[] = [];
  
  parts.push({
    text: `
      Role: You are an empathetic teacher focusing on both academic accuracy and student psychological growth.
      
      Assignment Context (JSON):
      ${JSON.stringify(assignmentContext)}

      Student Submission Text:
      "${studentText}"

      Requirements:
      1. Language: All feedback, comments, and summaries MUST be in Simplified Chinese (zh-CN).
      2. Multi-modal: If an image is provided, analyze the image as part of the answer.
      3. Psychological Support: Detect frustration or effort. If the work is poor but shows effort, use "Encouraging Feedback". If good, use "Challenge Feedback".
      4. Output: Return ONLY valid JSON adhering to the schema.
    `
  });

  if (imageBase64) {
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
        temperature: 0.5,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AIEvaluation;
  } catch (error) {
    console.error("Agent B Error:", error);
    throw error;
  }
};

// --- Agent C: The Tutor (AI 助教 - 新增功能) ---

export const generateHint = async (
  assignmentContext: AssignmentContent,
  currentInput: string
): Promise<string> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    Role: You are a helpful tutor (Agent C) assisting a student with a cross-disciplinary assignment.
    
    Context:
    Title: ${assignmentContext.title}
    Scenario: ${assignmentContext.scenario}
    Tasks: ${JSON.stringify(assignmentContext.tasks)}
    
    Student's Current Input (Draft): "${currentInput}"

    Task: Provide a helpful, short hint (max 50 words) in Chinese.
    Constraint: DO NOT give the answer directly. Guide the student to think about the connection between the subjects or the scenario.
    Tone: Encouraging and Socratic.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "请再读一遍题目背景，尝试将不同学科的知识联系起来思考。";
  } catch (error) {
    console.error("Agent C Error:", error);
    return "AI 助教暂时掉线了，请稍后再试。";
  }
};