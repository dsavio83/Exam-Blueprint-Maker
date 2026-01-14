
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
  name: string; // e.g., SR1, CRS2
  description: string;
}

export interface DifficultyLevel {
  id: string;
  name: string; // Basic, Average, Profound
}

export interface SubUnit {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
  subUnits: SubUnit[];
}

export interface Subject {
  id: string;
  name: string;
  type?: 'AT' | 'BT' | 'GENERAL';
  units: Unit[];
}

export interface ClassGrade {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface QuestionType {
  id: string;
  marks: number;
  maxQuestions: number;
}

export interface PaperType {
  id: string;
  name: string; // e.g., "Type 1", "Type 2"
  questionTypes: QuestionType[];
}

export interface BlueprintEntry {
  unitId: string;
  subUnitId: string;
  marksCategory: number;
  numQuestions: number;
  levelId: string;
}

export interface AppState {
  classes: ClassGrade[];
  cognitiveLevels: CognitiveLevel[];
  difficultyLevels: DifficultyLevel[];
  paperTypes: PaperType[];
  savedBlueprints: Record<string, BlueprintEntry[]>;
}
