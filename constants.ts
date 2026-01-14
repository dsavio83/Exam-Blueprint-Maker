
import { ClassGrade, CognitiveLevel, DifficultyLevel, QuestionType, User, UserRole } from './types';

export const MOCK_USERS: User[] = [
  { username: 'admin', password: 'password123', role: UserRole.ADMIN, fullName: 'System Administrator' },
  { username: 'teacher', password: 'password123', role: UserRole.TEACHER, fullName: 'Senior Teacher' },
];

export const COGNITIVE_LEVELS: CognitiveLevel[] = [
  { id: 'sr1', name: 'SR1', description: 'Simple Recall 1' },
  { id: 'sr2', name: 'SR2', description: 'Simple Recall 2' },
  { id: 'crs1', name: 'CRS1', description: 'Complex Recall 1' },
  { id: 'crs2', name: 'CRS2', description: 'Complex Recall 2' },
  { id: 'crl', name: 'CRL', description: 'Critical Reasoning Level' },
];

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { id: 'diff_basic', name: 'Basic' },
  { id: 'diff_avg', name: 'Average' },
  { id: 'diff_prof', name: 'Profound' },
];

export const QUESTION_TYPES: QuestionType[] = [
  { id: 'qt_1m', marks: 1, maxQuestions: 4 }, 
  { id: 'qt_2m', marks: 2, maxQuestions: 3 }, 
  { id: 'qt_3m', marks: 3, maxQuestions: 3 }, 
  { id: 'qt_5m', marks: 5, maxQuestions: 3 }, 
  { id: 'qt_6m', marks: 6, maxQuestions: 1 }, 
];

// Helper to generate subunits
const genSub = (prefix: string, count: number) => 
  Array.from({ length: count }, (_, i) => ({ id: `${prefix}_s${i+1}`, name: `Topic ${i+1}` }));

export const INITIAL_CLASSES: ClassGrade[] = [
  {
    id: 'c8',
    name: 'Class 8',
    subjects: [
      {
        id: 'tam_at_8',
        name: 'Tamil AT',
        type: 'AT',
        units: [
          { id: 'u1', name: 'Unit 1 (Term 1)', subUnits: genSub('u1', 2) },
          { id: 'u2', name: 'Unit 2 (Term 1)', subUnits: genSub('u2', 2) },
          { id: 'u3', name: 'Unit 3 (Term 2)', subUnits: genSub('u3', 2) },
        ]
      }
    ]
  }
];
