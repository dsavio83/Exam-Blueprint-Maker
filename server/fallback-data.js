const {
  INITIAL_PAPER_TYPES,
  INITIAL_EXAM_CONFIGS,
  INITIAL_DISCOURSES
} = require('./seed-master-data');
const { INITIAL_CURRICULUM } = require('./seed-curriculum');

const fallbackData = {
  users: [
    { id: '1', username: 'admin', password: 'admin', role: 'ADMIN', name: 'Super Admin' },
    { id: '2', username: 'user', password: 'user', role: 'USER', name: 'Staff Member' }
  ],
  curriculums: INITIAL_CURRICULUM,
  examConfigs: INITIAL_EXAM_CONFIGS,
  blueprints: [],
  questionPaperTypes: INITIAL_PAPER_TYPES,
  discourses: INITIAL_DISCOURSES,
  sharedBlueprints: [],
  settings: {
    cognitiveProcesses: [
      { code: 'CP1', name: 'Conceptual', description: 'Conceptual Clarity' },
      { code: 'CP2', name: 'Application', description: 'Application Skill' },
      { code: 'CP3', name: 'Computational', description: 'Computational Thinking' },
      { code: 'CP4', name: 'Analytical', description: 'Analytical Thinking' },
      { code: 'CP5', name: 'Critical', description: 'Critical Thinking' },
      { code: 'CP6', name: 'Creative', description: 'Creative Thinking' },
      { code: 'CP7', name: 'Values/Attitudes', description: 'Values/Attitudes' }
    ],
    knowledgeLevels: [
      { code: 'BASIC', name: 'Basic', description: 'Basic Knowledge' },
      { code: 'AVERAGE', name: 'Average', description: 'Average Knowledge' },
      { code: 'PROFOUND', name: 'Profound', description: 'Profound Knowledge' }
    ],
    itemFormats: [
      { code: 'SR1', name: 'MCI', description: 'Multiple Choice' },
      { code: 'SR2', name: 'MI', description: 'Matching' },
      { code: 'CRS1', name: 'VSA', description: 'Very Short Answer' },
      { code: 'CRS2', name: 'SA', description: 'Short Answer' },
      { code: 'CRS3', name: 'SE', description: 'Short Essay' },
      { code: 'CRL', name: 'E', description: 'Essay' }
    ]
  }
};

module.exports = { fallbackData };
