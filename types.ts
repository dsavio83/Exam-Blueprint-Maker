
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER'
}

export interface User {
  username: string;
  password?: string; // Added for auth logic
  role: UserRole;
  fullName: string;
}

export interface CognitiveLevel {
  id: string;
  name: string;
  description: string;
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
  type?: 'AT' | 'BT' | 'GENERAL'; // To handle specific Tamil AT/BT logic
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
  questionTypes: QuestionType[];
  savedBlueprints: Record<string, BlueprintEntry[]>;
}
