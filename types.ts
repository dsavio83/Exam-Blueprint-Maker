export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum ClassLevel {
  _8 = 8,
  _9 = 9,
  _10 = 10,
  _11 = 'SSLC',
}

export enum SubjectType {
  TAMIL_AT = 'Tamil AT',
  TAMIL_BT = 'Tamil BT'
}

export enum ExamTerm {
  FIRST = 'First Term Exam',
  SECOND = 'Second Term Exam',
  THIRD = 'Third Term Exam'
}

export enum KnowledgeLevel {
  BASIC = 'Basic',
  AVERAGE = 'Average',
  PROFOUND = 'Profound'
}

export enum CognitiveProcess {
  CP1 = 'Conceptual Clarity',
  CP2 = 'Application Skill',
  CP3 = 'Computational Thinking',
  CP4 = 'Analytical Thinking',
  CP5 = 'Critical Thinking',
  CP6 = 'Creative Thinking',
  CP7 = 'Values/Attitudes'
}

export enum ItemFormat {
  SR1 = 'MCI', // Multiple Choice
  SR2 = 'MI',  // Matching
  CRS1 = 'VSA', // Very Short Answer
  CRS2 = 'SA', // Short Answer
  CRS3 = 'SE', // Short Essay
  CRL = 'E'    // Essay
}

export enum QuestionType {
  SR1 = 'SR1',
  SR2 = 'SR2',
  CRS1 = 'CRS1',
  CRS2 = 'CRS2',
  CRS3 = 'CRS3',
  CRL = 'CRL'
}

export interface SubUnit {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  unitNumber: number;
  name: string;
  subUnits: SubUnit[];
  learningOutcomes?: string; // Added field for Learning Outcomes (LOs)
}

export interface Curriculum {
  classLevel: ClassLevel;
  subject: SubjectType;
  units: Unit[];
}

export interface BlueprintItem {
  id: string;
  unitId: string;
  subUnitId: string;
  knowledgeLevel: KnowledgeLevel;
  cognitiveProcess: CognitiveProcess;
  itemFormat: ItemFormat;
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  sectionId?: string; // To link back to paper type section
  questionText?: string; // Added
  answerText?: string;   // Added
  questionType?: QuestionType; // Added new field
  hasInternalChoice?: boolean; // Toggle for "Either/Or" options
  questionTextB?: string; // For Option B
  answerTextB?: string;   // For Option B
  knowledgeLevelB?: KnowledgeLevel; // Metadata for Option B
  cognitiveProcessB?: CognitiveProcess; // Metadata for Option B
  itemFormatB?: ItemFormat; // Metadata for Option B
}

export interface QuestionPatternSection {
  id: string;
  marks: number;
  count: number;
  instruction?: string; // Direction for the user (e.g., 'Answer any 5')
  massViewHeader?: string; // Optional header for Mass View
  optionCount?: number; // Number of questions in this section that should have internal choice
}

export interface QuestionPaperType {
  id: string;
  name: string;
  totalMarks: number; // Computed from sections
  description: string;
  sections: QuestionPatternSection[];
}

export interface Blueprint {
  id: string;
  examTerm: ExamTerm;
  classLevel: ClassLevel;
  subject: SubjectType;
  questionPaperTypeId: string;
  questionPaperTypeName: string;
  totalMarks: number;
  items: BlueprintItem[];
  createdAt: string;
  setId?: string;
  academicYear?: string;
  ownerId?: string; // User ID of the creator
  sharedWith?: string[]; // Array of user IDs who have access
  isLocked?: boolean; // Admin can lock a blueprint
  isHidden?: boolean; // Admin can hide a blueprint from the user
  isConfirmed?: boolean; // User has confirmed the pattern
}

export interface SharedBlueprint {
  id: string;
  blueprintId: string;
  ownerId: string;
  sharedWithUserId: string;
  sharedAt: string;
  canEdit: boolean;
}

export interface User {
  id: string;
  username: string;
  password?: string; // For simple auth demo
  role: Role;
  name: string;
  email?: string;
}

// Configuration for Exam Weightage
export interface UnitWeightage {
  unitNumber: number;
  percentage: number; // 0.0 to 1.0
}

export interface ExamConfiguration {
  id: string;
  classLevel: ClassLevel;
  subject: SubjectType;
  term: ExamTerm;
  weightages: UnitWeightage[];
}

export interface DiscourseScores {
  point: string;
  marks: number;
}

export interface Discourse {
  id: string;
  subject: SubjectType;
  marks: number;
  name: string;
  description: string;
  cognitiveProcess?: CognitiveProcess; // Added cognitive process
  rubrics: DiscourseScores[];
}

// Master Data definition (for dynamic labels if needed)
export interface MasterDataCode {
  code: string;
  name: string;
  description: string;
}

export interface SystemSettings {
  cognitiveProcesses: MasterDataCode[];
  knowledgeLevels: MasterDataCode[];
  itemFormats: MasterDataCode[];
}