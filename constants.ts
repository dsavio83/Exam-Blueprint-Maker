
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
  { id: 'sr1', code: 'SR1', type: 'SR', name: 'Selected Response 1 (Objective)', abbreviation: 'SR1' },
  { id: 'sr2', code: 'SR2', type: 'SR', name: 'Selected Response 2 (Objective)', abbreviation: 'SR2' },
  { id: 'crs1', code: 'CRS1', type: 'CRS', name: 'Short Answer (2M - 1/2 lines)', abbreviation: 'CRS1' },
  { id: 'crs2', code: 'CRS2', type: 'CRS', name: 'Medium Answer (3-4M)', abbreviation: 'CRS2' },
  { id: 'crl', code: 'CRL', type: 'CRL', name: 'Essay Type (5-6M)', abbreviation: 'CRL' },
];

export const INITIAL_CLASSES: ClassGrade[] = [
  {
    id: 'c8',
    name: 'Class VIII',
    subjects: [
      { id: 'tam_at_8', name: 'Tamil AT', units: Array.from({length: 6}, (_, i) => ({ 
        id: `u${i+1}`, 
        name: `Unit ${i+1}`, 
        subUnits: [
          {id: `s${i+1}_1`, name: `Topic ${i+1}.1`, learningObjective: 'Objective 1'},
          {id: `s${i+1}_2`, name: `Topic ${i+1}.2`, learningObjective: 'Objective 2'}
        ] 
      })) },
      { id: 'tam_bt_8', name: 'Tamil BT', units: Array.from({length: 3}, (_, i) => ({ 
        id: `u${i+1}`, 
        name: `Unit ${i+1}`, 
        subUnits: [
          {id: `s${i+1}_1`, name: `Topic ${i+1}.1`, learningObjective: 'Objective 1'},
          {id: `s${i+1}_2`, name: `Topic ${i+1}.2`, learningObjective: 'Objective 2'}
        ] 
      })) }
    ]
  },
  {
    id: 'c9',
    name: 'Class IX',
    subjects: [
      { id: 'tam_at_9', name: 'Tamil AT', units: Array.from({length: 6}, (_, i) => ({ 
        id: `u${i+1}`, 
        name: `Unit ${i+1}`, 
        subUnits: [
          {id: `s${i+1}_1`, name: `Topic ${i+1}.1`, learningObjective: 'Objective 1'}
        ] 
      })) },
      { id: 'tam_bt_9', name: 'Tamil BT', units: Array.from({length: 3}, (_, i) => ({ 
        id: `u${i+1}`, 
        name: `Unit ${i+1}`, 
        subUnits: [
          {id: `s${i+1}_1`, name: `Topic ${i+1}.1`, learningObjective: 'Objective 1'}
        ] 
      })) }
    ]
  },
  {
    id: 'c10',
    name: 'Class X',
    subjects: [
      { id: 'tam_at_10', name: 'Tamil AT', units: Array.from({length: 6}, (_, i) => ({ 
        id: `u${i+1}`, 
        name: `Unit ${i+1}`, 
        subUnits: [
          {id: `s${i+1}_1`, name: `Topic ${i+1}.1`, learningObjective: 'Objective 1'}
        ] 
      })) },
      { id: 'tam_bt_10', name: 'Tamil BT', units: Array.from({length: 3}, (_, i) => ({ 
        id: `u${i+1}`, 
        name: `Unit ${i+1}`, 
        subUnits: [
          {id: `s${i+1}_1`, name: `Topic ${i+1}.1`, learningObjective: 'Objective 1'}
        ] 
      })) }
    ]
  }
];
