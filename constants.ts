
import { ClassGrade, CognitiveLevel, KnowledgeLevel, ItemFormat, User, UserRole } from './types';

export const MOCK_USERS: User[] = [
  { username: 'admin', password: 'password123', role: UserRole.ADMIN, fullName: 'System Administrator' },
];

export const COGNITIVE_PROCESSES: CognitiveLevel[] = [
  { id: 'cp1', code: 'CP1', name: 'Conceptual Clarity' },
  { id: 'cp2', code: 'CP2', name: 'Application Skill' },
  { id: 'cp3', code: 'CP3', name: 'Computational Thinking' },
  { id: 'cp4', code: 'CP4', name: 'Analytical Thinking' },
  { id: 'cp5', code: 'CP5', name: 'Critical Thinking' },
  { id: 'cp6', code: 'CP6', name: 'Creative Thinking' },
  { id: 'cp7', code: 'CP7', name: 'Values/Attitude' },
];

export const KNOWLEDGE_LEVELS: KnowledgeLevel[] = [
  { id: 'b', code: 'B', name: 'Basic Level' },
  { id: 'a', code: 'A', name: 'Average Level' },
  { id: 'p', code: 'P', name: 'Profound Level' },
];

export const ITEM_FORMATS: ItemFormat[] = [
  { id: 'sr1', code: 'SR1', type: 'SR', name: 'Selected Response - Multiple Choice', abbreviation: 'MCI' },
  { id: 'sr2', code: 'SR2', type: 'SR', name: 'Selected Response - Matching Item', abbreviation: 'MI' },
  { id: 'crs1', code: 'CRS1', type: 'CRS', name: 'Constructed Response - Very Short Answer', abbreviation: 'VSA' },
  { id: 'crs2', code: 'CRS2', type: 'CRS', name: 'Constructed Response - Short Answer', abbreviation: 'SA' },
  { id: 'crl', code: 'CRL', type: 'CRL', name: 'Constructed Response - Long Answer', abbreviation: 'E' },
];

export const INITIAL_CLASSES: ClassGrade[] = [
  {
    id: 'c10',
    name: 'Class X',
    subjects: [
      {
        id: 'tam_bt',
        name: 'Tamil BT',
        units: [
          { 
            id: 'u1', 
            name: 'நலம் விரும்பு', 
            subUnits: [
              { id: 's1', name: 'அமுதசுரபி', learningObjective: 'ஆரோக்கியமான உணவு' },
              { id: 's2', name: 'நோய் நாடி', learningObjective: 'சித்த மருத்துவத்தின் சிறப்புகள்' },
              { id: 's3', name: 'டிஜிட்டல் உலகு', learningObjective: 'இணைய அடிமை தனம்' }
            ] 
          }
        ]
      }
    ]
  }
];
