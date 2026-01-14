
import { ClassGrade, CognitiveLevel, QuestionType, User, UserRole } from './types';

export const MOCK_USERS: User[] = [
  { username: 'admin', password: 'password123', role: UserRole.ADMIN, fullName: 'System Administrator' },
  { username: 'teacher', password: 'password123', role: UserRole.TEACHER, fullName: 'Senior Teacher' },
  { username: 'ravi', password: '123', role: UserRole.TEACHER, fullName: 'Ravi Kumar' },
];

export const COGNITIVE_LEVELS: CognitiveLevel[] = [
  { id: 'sr1', name: 'SR1', description: 'Simple Recall 1' },
  { id: 'sr2', name: 'SR2', description: 'Simple Recall 2' },
  { id: 'crs1', name: 'CRS1', description: 'Complex Recall 1' },
  { id: 'crs2', name: 'CRS2', description: 'Complex Recall 2' },
  { id: 'crl', name: 'CRL', description: 'Critical Reasoning Level' },
  { id: 'as1', name: 'AS1', description: 'Analysis and Synthesis 1' },
];

export const QUESTION_TYPES: QuestionType[] = [
  { id: 'qt_1m', marks: 1, maxQuestions: 10 },
  { id: 'qt_2m', marks: 2, maxQuestions: 8 },
  { id: 'qt_3m', marks: 3, maxQuestions: 6 },
  { id: 'qt_5m', marks: 5, maxQuestions: 4 },
  { id: 'qt_8m', marks: 8, maxQuestions: 2 },
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
          { id: 'u4', name: 'Unit 4 (Term 2)', subUnits: genSub('u4', 2) },
          { id: 'u5', name: 'Unit 5 (Term 3)', subUnits: genSub('u5', 2) },
          { id: 'u6', name: 'Unit 6 (Term 3)', subUnits: genSub('u6', 2) },
        ]
      },
       {
        id: 'tam_bt_8',
        name: 'Tamil BT',
        type: 'BT',
        units: [
          { id: 'u1_bt', name: 'Unit 1 (Term 1)', subUnits: genSub('u1bt', 2) },
          { id: 'u2_bt', name: 'Unit 2 (Term 2)', subUnits: genSub('u2bt', 2) },
          { id: 'u3_bt', name: 'Unit 3 (Term 3)', subUnits: genSub('u3bt', 2) },
        ]
      }
    ]
  },
  {
    id: 'c9',
    name: 'Class 9',
    subjects: [
      {
        id: 'eng_9',
        name: 'English',
        type: 'GENERAL',
        units: [
          { id: 'u1_9', name: 'Unit 1', subUnits: genSub('u1_9', 3) },
          { id: 'u2_9', name: 'Unit 2', subUnits: genSub('u2_9', 3) },
          { id: 'u3_9', name: 'Unit 3', subUnits: genSub('u3_9', 3) },
          { id: 'u4_9', name: 'Unit 4', subUnits: genSub('u4_9', 3) },
          { id: 'u5_9', name: 'Unit 5', subUnits: genSub('u5_9', 3) },
          { id: 'u6_9', name: 'Unit 6', subUnits: genSub('u6_9', 3) },
        ]
      }
    ]
  },
  {
    id: 'c10',
    name: 'Class 10 (SSLC)',
    subjects: [
      {
        id: 'mat_10',
        name: 'Mathematics',
        type: 'GENERAL',
        units: [
          { id: 'u1_10', name: 'Relations', subUnits: genSub('u1_10', 2) },
          { id: 'u2_10', name: 'Numbers', subUnits: genSub('u2_10', 2) },
          { id: 'u3_10', name: 'Algebra', subUnits: genSub('u3_10', 2) },
          { id: 'u4_10', name: 'Geometry', subUnits: genSub('u4_10', 2) },
          { id: 'u5_10', name: 'Coordinates', subUnits: genSub('u5_10', 2) },
          { id: 'u6_10', name: 'Trigonometry', subUnits: genSub('u6_10', 2) },
          { id: 'u7_10', name: 'Mensuration', subUnits: genSub('u7_10', 2) },
        ]
      }
    ]
  }
];
