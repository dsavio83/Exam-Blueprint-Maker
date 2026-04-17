const INITIAL_PAPER_TYPES = [
  {
    id: 'pt1', name: 'Type 1', totalMarks: 40, description: 'Variation A',
    sections: [
      { id: 's1', marks: 1, count: 4, optionCount: 0, instruction: 'I. 1 முதல் 4 வரையுள்ள அனைத்து வினாக்களுக்கும் சரியான விடையைத் தேர்ந்தெடுத்து எழுதுக. (1 மதிப்பெண் வீதம்) (4 x 1 = 4)' },
      { id: 's2', marks: 2, count: 4, optionCount: 0, instruction: 'II. 5 முதல் 8 வரையுள்ள அனைத்து வினாக்களுக்கு ஓரிரு வரிகளில் விடையளிக்க. (2 மதிப்பெண் வீதம்) (4 x 2 = 8)' },
      { id: 's3', marks: 3, count: 4, optionCount: 4, instruction: 'III. 9 முதல் 12 வரையுள்ள அனைத்து வினாக்களுக்கும் விடையளிக்கவும். (3 மதிப்பெண் வீதம்) (4 x 3 = 12)' },
      { id: 's4', marks: 5, count: 2, optionCount: 2, instruction: 'IV. 13, 14 ஆகிய வினாக்களுக்கு விடையளிக்கவும். (5 மதிப்பெண் வீதம்) (2 x 5 = 10)' },
      { id: 's5', marks: 6, count: 1, optionCount: 1, instruction: 'V. பின்வரும் வினாவிற்கு விடையளிக்கவும். (6 மதிப்பெண் வீதம்) (1 x 6 = 6)' }
    ]
  },
  {
    id: 'pt2', name: 'Type 2', totalMarks: 40, description: 'Variation B',
    sections: [
      { id: 's1', marks: 1, count: 2, optionCount: 0, instruction: 'I. 1 முதல் 2 வரையுள்ள அனைத்து வினாக்களுக்கும் சரியான விடையைத் தேர்ந்தெடுத்து எழுதுக. (1 மதிப்பெண் வீதம்) (2 x 1 = 2)' },
      { id: 's2', marks: 2, count: 2, optionCount: 0, instruction: 'II. 3 முதல் 4 வரையுள்ள அனைத்து வினாக்களுக்கு ஓரிரு வரிகளில் விடையளிக்க. (2 மதிப்பெண் வீதம்) (2 x 2 = 4)' },
      { id: 's3', marks: 3, count: 6, optionCount: 6, instruction: 'III. 5 முதல் 10 வரையுள்ள அனைத்து வினாக்களுக்கும் விடையளிக்கவும். (3 மதிப்பெண் வீதம்)  (3 x 6 = 18)' },
      { id: 's4', marks: 5, count: 2, optionCount: 2, instruction: 'IV. 11, 12 ஆகிய வினாக்களுக்கு விடையளிக்கவும். (5 மதிப்பெண் வீதம்) (5 x 2 = 10)' },
      { id: 's5', marks: 6, count: 1, optionCount: 1, instruction: 'V. பின்வரும் வினாவிற்கு விடையளிக்கவும். (6 மதிப்பெண் வீதம்) (1 x 6 = 6)' }
    ]
  },
  {
    id: 'pt3', name: 'Type 3', totalMarks: 40, description: 'Variation C',
    sections: [
      { id: 's1', marks: 1, count: 4, optionCount: 0, instruction: 'I. 1 முதல் 4 வரையுள்ள அனைத்து வினாக்களுக்கும் சரியான விடையைத் தேர்ந்தெடுத்து எழுதுக. (1 மதிப்பெண் வீதம்) (4 x 1 = 4)' },
      { id: 's2', marks: 2, count: 3, optionCount: 0, instruction: 'II. 5 முதல் 7 வரையுள்ள அனைத்து வினாக்களுக்கு ஓரிரு வரிகளில் விடையளிக்க. (2 மதிப்பெண் வீதம்) (2 x 3 = 6)' },
      { id: 's3', marks: 3, count: 3, optionCount: 3, instruction: 'III. 8 முதல் 10 வரையுள்ள அனைத்து வினாக்களுக்கும் விடையளிக்கவும். (3 மதிப்பெண் வீதம்) (3 x 3 = 9)' },
      { id: 's4', marks: 5, count: 3, optionCount: 3, instruction: 'IV. 11 முதல் 13 வரையுள்ள வினாக்களுக்கு விடையளிக்கவும். (5 மதிப்பெண் வீதம்) (5 x 3 = 15)' },
      { id: 's5', marks: 6, count: 1, optionCount: 1, instruction: 'V. பின்வரும் வினாவிற்கு விடையளிக்கவும். (6 மதிப்பெண் வீதம்) (1 x 6 = 6)' }
    ]
  }
];

const INITIAL_EXAM_CONFIGS = [
  { id: 'at-t1-10', classLevel: 10, subject: 'Tamil AT', term: 'First Term Summative', weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }] },
  { id: 'at-t2-10', classLevel: 10, subject: 'Tamil AT', term: 'Second Term Summative', weightages: [{ unitNumber: 1, percentage: 10 }, { unitNumber: 2, percentage: 10 }, { unitNumber: 3, percentage: 40 }, { unitNumber: 4, percentage: 40 }] },
  { id: 'at-t3-10', classLevel: 10, subject: 'Tamil AT', term: 'Third Term Summative', weightages: [{ unitNumber: 1, percentage: 20 }, { unitNumber: 2, percentage: 20 }, { unitNumber: 3, percentage: 20 }, { unitNumber: 4, percentage: 20 }, { unitNumber: 5, percentage: 20 }] },
  { id: 'at-t1-9', classLevel: 9, subject: 'Tamil AT', term: 'First Term Summative', weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }] },
  { id: 'at-t2-9', classLevel: 9, subject: 'Tamil AT', term: 'Second Term Summative', weightages: [{ unitNumber: 1, percentage: 10 }, { unitNumber: 2, percentage: 10 }, { unitNumber: 3, percentage: 40 }, { unitNumber: 4, percentage: 40 }] },
  { id: 'at-t3-9', classLevel: 9, subject: 'Tamil AT', term: 'Third Term Summative', weightages: [{ unitNumber: 1, percentage: 5 }, { unitNumber: 2, percentage: 5 }, { unitNumber: 3, percentage: 10 }, { unitNumber: 4, percentage: 10 }, { unitNumber: 5, percentage: 35 }, { unitNumber: 6, percentage: 35 }] },
  { id: 'at-t1-8', classLevel: 8, subject: 'Tamil AT', term: 'First Term Summative', weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }] },
  { id: 'at-t2-8', classLevel: 8, subject: 'Tamil AT', term: 'Second Term Summative', weightages: [{ unitNumber: 1, percentage: 10 }, { unitNumber: 2, percentage: 10 }, { unitNumber: 3, percentage: 40 }, { unitNumber: 4, percentage: 40 }] },
  { id: 'at-t3-8', classLevel: 8, subject: 'Tamil AT', term: 'Third Term Summative', weightages: [{ unitNumber: 1, percentage: 5 }, { unitNumber: 2, percentage: 5 }, { unitNumber: 3, percentage: 10 }, { unitNumber: 4, percentage: 10 }, { unitNumber: 5, percentage: 35 }, { unitNumber: 6, percentage: 35 }] },
  { id: 'bt-t1-10', classLevel: 10, subject: 'Tamil BT', term: 'First Term Summative', weightages: [{ unitNumber: 1, percentage: 100 }] },
  { id: 'bt-t2-10', classLevel: 10, subject: 'Tamil BT', term: 'Second Term Summative', weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }] },
  { id: 'bt-t3-10', classLevel: 10, subject: 'Tamil BT', term: 'Third Term Summative', weightages: [{ unitNumber: 1, percentage: 30 }, { unitNumber: 2, percentage: 34 }, { unitNumber: 3, percentage: 36 }] },
  { id: 'bt-t1-9', classLevel: 9, subject: 'Tamil BT', term: 'First Term Summative', weightages: [{ unitNumber: 1, percentage: 100 }] },
  { id: 'bt-t2-9', classLevel: 9, subject: 'Tamil BT', term: 'Second Term Summative', weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }] },
  { id: 'bt-t3-9', classLevel: 9, subject: 'Tamil BT', term: 'Third Term Summative', weightages: [{ unitNumber: 1, percentage: 30 }, { unitNumber: 2, percentage: 34 }, { unitNumber: 3, percentage: 36 }] },
  { id: 'bt-t1-8', classLevel: 8, subject: 'Tamil BT', term: 'First Term Summative', weightages: [{ unitNumber: 1, percentage: 100 }] },
  { id: 'bt-t2-8', classLevel: 8, subject: 'Tamil BT', term: 'Second Term Summative', weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }] },
  { id: 'bt-t3-8', classLevel: 8, subject: 'Tamil BT', term: 'Third Term Summative', weightages: [{ unitNumber: 1, percentage: 30 }, { unitNumber: 2, percentage: 34 }, { unitNumber: 3, percentage: 36 }] }
];

const createDiscourse = (id, subject, marks, name) => ({
  id,
  subject,
  marks,
  name,
  description: name,
  cognitiveProcess: 'Conceptual Clarity',
  rubrics: []
});

const INITIAL_DISCOURSES = [
  createDiscourse('at-3-1', 'Tamil AT', 3, 'அறிவிப்பு'),
  createDiscourse('at-3-2', 'Tamil AT', 3, 'தூய தமிழ் நடை'),
  createDiscourse('at-3-3', 'Tamil AT', 3, 'தன்விவரப்பட்டியல்'),
  createDiscourse('at-3-4', 'Tamil AT', 3, 'சுற்றறிக்கை'),
  createDiscourse('at-3-5', 'Tamil AT', 3, 'விமர்சனக் குறிப்பு'),
  createDiscourse('at-3-6', 'Tamil AT', 3, 'சிறு குறிப்பு'),
  createDiscourse('at-3-7', 'Tamil AT', 3, 'இலக்கணம்'),
  createDiscourse('at-3-8', 'Tamil AT', 3, 'அகர வரிசைப்படுத்தி பொருள் எழுதுதல்'),
  createDiscourse('at-5-1', 'Tamil AT', 5, 'அலுவலகக் கடிதம்'),
  createDiscourse('at-5-2', 'Tamil AT', 5, 'சொற்பொழிவு உரை'),
  createDiscourse('at-5-3', 'Tamil AT', 5, 'விளக்கக் குறிப்பு'),
  createDiscourse('at-5-4', 'Tamil AT', 5, 'நயம் பாராட்டுதல்'),
  createDiscourse('at-5-5', 'Tamil AT', 5, 'ஒப்பிட்டுக் குறிப்பு'),
  createDiscourse('at-6-1', 'Tamil AT', 6, 'கட்டுரை'),
  createDiscourse('at-6-2', 'Tamil AT', 6, 'தலையங்கம்'),
  createDiscourse('at-6-3', 'Tamil AT', 6, 'விமர்சனம்'),
  createDiscourse('bt-3-1', 'Tamil BT', 3, 'துண்டுப்பிரசுரம்'),
  createDiscourse('bt-3-2', 'Tamil BT', 3, 'வாழ்க்கை குறிப்பு'),
  createDiscourse('bt-3-3', 'Tamil BT', 3, 'விமர்சனக் குறிப்பு'),
  createDiscourse('bt-3-4', 'Tamil BT', 3, 'சிறுகுறிப்பு'),
  createDiscourse('bt-3-5', 'Tamil BT', 3, 'சுற்றறிக்கை'),
  createDiscourse('bt-3-6', 'Tamil BT', 3, 'நூலடைவு'),
  createDiscourse('bt-3-7', 'Tamil BT', 3, 'பத்திரிகை செய்தி'),
  createDiscourse('bt-3-8', 'Tamil BT', 3, 'வரவேற்புரை'),
  createDiscourse('bt-5-1', 'Tamil BT', 5, 'உறவுக்கடிதம்'),
  createDiscourse('bt-5-2', 'Tamil BT', 5, 'விளக்கக் குறிப்பு'),
  createDiscourse('bt-5-3', 'Tamil BT', 5, 'பட்டிமன்றஉரை'),
  createDiscourse('bt-5-4', 'Tamil BT', 5, 'ஒப்பிட்டுக் குறிப்பு'),
  createDiscourse('bt-5-5', 'Tamil BT', 5, 'பத்தி வாசித்து வினா விடை'),
  createDiscourse('bt-6-1', 'Tamil BT', 6, 'கதை விமர்சனம்'),
  createDiscourse('bt-6-2', 'Tamil BT', 6, 'தலையங்கம்'),
  createDiscourse('bt-6-3', 'Tamil BT', 6, 'கட்டுரை')
];

module.exports = {
  INITIAL_PAPER_TYPES,
  INITIAL_EXAM_CONFIGS,
  INITIAL_DISCOURSES
};
