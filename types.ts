
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER'
}

export interface User {
  username: string;
  password?: string;
  role: UserRole;
  fullName: string;
}

export interface CognitiveLevel {
  id: string;
  code: string; // CP1, CP2...
  name: string;
}

export interface KnowledgeLevel {
  id: string;
  code: string; // B, A, P
  name: string;
}

export interface ItemFormat {
  id: string;
  code: string; // SR1, SR2, CRS1, CRS2, CRL
  type: 'SR' | 'CRS' | 'CRL';
  name: string;
  abbreviation: string; // MCI, MI, VSA, SA, E
}

export interface SubUnit {
  id: string;
  name: string;
  learningObjective: string;
}

export interface Unit {
  id: string;
  name: string;
  subUnits: SubUnit[];
}

export interface Subject {
  id: string;
  name: string;
  units: Unit[];
}

export interface ClassGrade {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface BlueprintEntry {
  unitId: string;
  subUnitId: string;
  formatId: string; // Links to ItemFormat
  numQuestions: number;
  marksPerItem: number;
  cognitiveId: string; // CP1-CP7
  knowledgeId: string; // B, A, P
  estimatedTime: number; // in minutes
}

export interface SavedBlueprint {
  id: string;
  name: string;
  timestamp: number;
  classId: string;
  subjectId: string;
  examType: string;
  paperTypeId: string;
  maxScore: number;
  timeAllotted: number; // total exam time in min
  entries: BlueprintEntry[];
  // Overrides for inline edits within this blueprint
  topicNameOverrides: Record<string, string>;
  objectiveOverrides: Record<string, string>;
}

/**
 * QuestionType defines the structure of a specific marks category within a paper.
 */
export interface QuestionType {
  id: string;
  marks: number;
  maxQuestions: number;
}

/**
 * PaperType represents a specific exam format configuration.
 */
export interface PaperType {
  id: string;
  name: string;
  questionTypes: QuestionType[];
}

/**
 * DifficultyLevel is used for weightage summaries and taxonomy management.
 */
export interface DifficultyLevel {
  id: string;
  name: string;
}
