import {
  Role, ClassLevel, SubjectType, Unit, Curriculum,
  ExamTerm, KnowledgeLevel, ItemFormat, CognitiveProcess,
  User, ExamConfiguration, SystemSettings, BlueprintItem,
  QuestionType,
  Blueprint,
  QuestionPaperType,
  Discourse,
  SharedBlueprint
} from './types';

// --- Seed Data Helpers ---
const createUnit = (idPrefix: string, num: number, name: string, subNames: string[], los?: string) => ({
  id: `${idPrefix}-u${num}`,
  unitNumber: num,
  name: name,
  subUnits: subNames.map((s, i) => ({ id: `${idPrefix}-u${num}-s${i + 1}`, name: s })),
  learningOutcomes: los || `Learning outcomes for ${name}`
});

// Class 10 Tamil AT
const UNITS_10_AT: Unit[] = [
  createUnit('10at', 1, 'விந்தைகள்', ['நொய்யல்', 'நிலமகள்', 'மலையகம்'], 'இயற்கை எழிலை நயம்பட உரைத்தல், செய்யுளின் மையக்கருத்தை உணர்ந்து வெளிப்படுத்துதல், சொல்லாட்சித் திறனை வளர்த்தல்.'),
  createUnit('10at', 2, 'ஒன்றெனக் கொள்', ['முதுமையில் இனிமை', 'ஒன்றே உலகம்', 'இனியொரு விதி செய்வோம்'], 'யாதும் ஊரே யாவரும் கேளிர் எனும் உலகளாவிய சிந்தனையைப் பெறுதல், சமூக நல்லிணக்கத்தின் அவசியத்தை உணர்தல்.'),
  createUnit('10at', 3, 'கலை நயம்', ['நளினம்', 'மெய்ப்பொருள்', 'கைவண்ணம்'], 'கலைகளின் சிறப்பினைப் போற்றுதல், நுண்கலைகளுக்கும் வாழ்வியலுக்கும் உள்ள தொடர்பை விளக்குதல்.'),
  createUnit('10at', 4, 'கலைத் திறன்', ['ஓவியம்', 'சிற்பம்', 'நாடகம்'], 'பல்வேறு கலை வடிவங்களை வேறுபடுத்தி அறிதல், கலை நுணுக்கங்களைச் சொந்த நடையில் விவரித்தல்.'),
  createUnit('10at', 5, 'தமிழர் பண்பாடு', ['விருந்தோம்பல்', 'வீரம்', 'கொடை'], 'தமிழர்களின் வீர மரபு, விருந்தோம்பும் பண்பு மற்றும் ஈகை ஆகியவற்றை வாழ்க்கையில் பின்பற்றுதல்.')
];

// Class 9 Tamil AT
const UNITS_9_AT: Unit[] = [
  createUnit('9at', 1, 'ஒரே ஒரு பூமி', ['இயற்கை', 'விடியலைத் தேடி', 'உயிர்த்துளி'], 'இயற்கைப் பாதுகாப்பின் இன்றியமையாமையை அறிதல், சுற்றுப்புறத் தூய்மையைக் காப்பதில் ஆர்வம் கொள்ளுதல்.'),
  createUnit('9at', 2, 'நேசமே சுவாசம்', ['உதவிக்கரம் நீட்டுவோம்', 'தன்னம்பிக்கை', 'நல்லிணக்கம்'], 'பிறருக்கு உதவும் மனப்பான்மையை வளர்த்தல், தன்னம்பிக்கையுடன் எச்செயலையும் அணுகுதல்.'),
  createUnit('9at', 3, 'நீரும் நிலமும்', ['இயற்கை விளையாட்டு', 'வெக்கை', 'கலங்கரை விளக்கம்'], 'நீர் மற்றும் நில வளங்களின் முக்கியத்துவத்தை உணர்தல், சங்க இலக்கியங்களில் கூறப்பட்டுள்ள இயற்கைச் சூழல்களைப் பதிவு செய்தல்.'),
  createUnit('9at', 4, 'இசையும் நடமும்', ['அழகோவியம்', 'தந்தனத்தோம்', 'விருந்து'], 'இசை மற்றும் நடனக் கலைகளின் தொன்மையை அறிதல், கலைகள் வழியாகப் பண்பாட்டைப் பிரதிபலித்தல்.'),
  createUnit('9at', 5, 'கூடிவாழ்', ['குடும்ப உறவு', 'இலக்கியத்தில் உறவு', 'யாதும் ஊரே'], 'உறவுகளின் மேன்மையை உணர்தல், ஒருமித்த கருத்துடன் குழுவாகச் செயல்படும் திறனைப் பெறுதல்.'),
  createUnit('9at', 6, 'உழைப்பே உயர்வு', ['வயலும் வாழ்வும்', 'மழைச்சாரல்', 'கட்டுமரம்'], 'உழைப்பின் பெருமையை அறிதல், தொழில் சார்ந்த திறன்களையும் வாழ்வாதாரத்தையும் மேம்படுத்துதல்.')
];

// Class 8 Tamil AT
const UNITS_8_AT: Unit[] = [
  createUnit('8at', 1, 'நீர் வளம்', ['தேனருவி', 'உயிர்நீர்', 'அலையோசை'], 'நீர்க்குடிகளின் அவசியத்தை விளக்குதல், நீர் நிலைகளைச் சீரமைப்பதன் பயன்களை அறிதல்.'),
  createUnit('8at', 2, 'மானுடம் வெல்லும்', ['ஒன்றுபடுவோம்', 'அன்பே அறம்', 'ஓருயிராய்'], 'மனிதநேயப் பண்புகளை வளர்த்தல், அறநெறிச் சிந்தனைகளைத் அன்றாட வாழ்வில் கடைப்பிடித்தல்.'),
  createUnit('8at', 3, 'வாழ்வு வளம் பெற', ['ஏர்ப்பின்னது உலகம்', 'தறியும் தடுக்கும்', 'ஆலைகள் செய்வோம்'], 'விவசாயம் மற்றும் தொழில்துறையின் வளர்ச்சியை மதிப்பிடுதல், உள்ளூர் உற்பத்திப் பொருட்களுக்கு முன்னுரிமை அளித்தல்.'),
  createUnit('8at', 4, 'அமுத ஊற்று', ['யாழினிது', 'சிப்பிக்குள் முத்து', 'முதுசொல்'], 'மொழியின் இனிமையைப் போற்றுதல், மரபுச் சொற்களைச் சரியான முறையில் கையாளுதல்.'),
  createUnit('8at', 5, 'சங்கே முழுங்கு', ['இல்லாமை இல்லாகி', 'மண்ணின் மைந்தர்கள்', 'தேன்மொழி'], 'தன்னார்வத் தொண்டுகளில் ஈடுபடுதல், நாட்டுப்பற்று மிக்க வீரர்களின் வரலாற்றை உரைத்தல்.'),
  createUnit('8at', 6, 'வானமே எல்லை', ['கார்மேகம்', 'பருவச் சுழற்சி', 'அமைதி கொள்'], 'அறிவியல் விழிப்புணர்வை மேம்படுத்துதல், புதிய கண்டுபிடிப்புகள் குறித்த தகவல்களைத் திரட்டுதல்.')
];

// Shared 8BT Units (Placeholders, can be customized per class similarly)
const UNITS_8_BT_SHARED: Unit[] = [
  createUnit('8bt', 1, 'தூய்மை வாழ்வு', ['சூழல்கள்', 'குறைவற்ற செல்வம்', 'அக அழகு'], 'தூய்மையின் சிறப்பினை உணர்தல், உடல் மற்றும் மன நலத்தைப் பேணுதல்.'),
  createUnit('8bt', 2, 'தெளிவானம்', ['விண்மீன்கள்', 'சுடர்கள்', 'நிழல்கள்'], 'வான்வெளி விந்தைகளை வியந்து போற்றுதல், அறிவியல் தேடலை வளர்த்தல்.'),
  createUnit('8bt', 3, 'கவசம', ['சாகசம்', 'வேலிகள்', 'வெள்ளம்'], 'தற்காப்புத் திறன்களைப் பெறுதல், பேரிடர் மேலாண்மை குறித்த விழிப்புணர்வு கொள்ளுதல்.')
];

// Shared 9BT Units (Placeholders, can be customized per class similarly)
const UNITS_9_BT_SHARED: Unit[] = [
  createUnit('9bt', 1, 'வருமுன் காப்போம்', ['உணவே மருந்து', 'துரிதம் தவிர்', 'நோயின்றி வாழ்'], 'நல்ல உணவு பழக்கத்தைக் கையாளும் திறன்'),
  createUnit('9bt', 2, 'சரி நிகராய்', ['விடிவெள்ளி', 'நிகரெனக் கொள்வதால்', 'சாதனைப் பெண்மணிகள்'], 'பாலினம் குறித்த தெளிவு'),
  createUnit('9bt', 3, 'விண்ணைத்தொடுவோம்', ['மனிதனைப்போல', 'உள்ளங்கையில் உலகம்', 'திரையினூடே'], 'சமூக ஊடகங்களை கையாளும் திறன்')
];
// Shared 10BT Units (Placeholders, can be customized per class similarly)
const UNITS_10_BT_SHARED: Unit[] = [
  createUnit('10bt', 1, 'நலம் விரும்பு', ['அமுதசுரபி', 'நோய் நாடி', 'டிஜிட்டல் உலகு'], 'உடல் நலம் பேணல், தொழில்நுட்ப மாற்றங்களை அறிதல்.'),
  createUnit('10bt', 2, 'துலாக்கோல்', ['எழுத்தாணி', 'தியாக மண்', 'சுடர் ஒளி'], 'நேர்மையின் வழி நிற்றல், தியாகிகளின் வரலாற்றைப் போற்றுதல்.'),
  createUnit('10bt', 3, 'ஆழிசூழ் உலகு', ['மீண்டெழுவோம்', 'புவிச்சீற்றம்', 'வியனுலகு'], 'புவி வெப்பமயமாதல் குறித்த கவலை, சுற்றுப்புறத்தைப் பாதுகாக்கும் பொறுப்பு.')
];

const INITIAL_CURRICULUM: Curriculum[] = [

  { classLevel: ClassLevel._8, subject: SubjectType.TAMIL_AT, units: UNITS_8_AT },
  { classLevel: ClassLevel._10, subject: SubjectType.TAMIL_BT, units: UNITS_8_BT_SHARED.map(u => ({ ...u, id: '10' + u.id })) }, // Unique IDs
  { classLevel: ClassLevel._9, subject: SubjectType.TAMIL_AT, units: UNITS_9_AT },
  { classLevel: ClassLevel._9, subject: SubjectType.TAMIL_BT, units: UNITS_9_BT_SHARED.map(u => ({ ...u, id: '9' + u.id })) },
  { classLevel: ClassLevel._10, subject: SubjectType.TAMIL_AT, units: UNITS_10_AT },
  { classLevel: ClassLevel._8, subject: SubjectType.TAMIL_BT, units: UNITS_10_BT_SHARED.map(u => ({ ...u, id: '8' + u.id })) },
];

const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', password: 'admin', role: Role.ADMIN, name: 'Super Admin' },
  { id: '2', username: 'user', password: 'user', role: Role.USER, name: 'Staff Member' },
  { id: '3', username: 'user1', password: 'user1', role: Role.USER, name: 'Teacher 1' },
  { id: '4', username: 'user2', password: 'user2', role: Role.USER, name: 'Teacher 2' }
];

const INITIAL_PAPER_TYPES: QuestionPaperType[] = [
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
  },
];

// Seed Exam Configurations (replacing hardcoded logic)
const INITIAL_EXAM_CONFIGS: ExamConfiguration[] = [
  // --- Tamil AT - Class 10 ---
  // Term 1: Unit 1 (50%), Unit 2 (50%)
  {
    id: 'at-t1', classLevel: ClassLevel._10, subject: SubjectType.TAMIL_AT, term: ExamTerm.FIRST,
    weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }]
  },
  // Term 2: Unit 1 (10%), Unit 2 (10%), Unit 3 (40%), Unit 4 (40%)
  {
    id: 'at-t2', classLevel: ClassLevel._10, subject: SubjectType.TAMIL_AT, term: ExamTerm.SECOND,
    weightages: [
      { unitNumber: 1, percentage: 10 }, { unitNumber: 2, percentage: 10 },
      { unitNumber: 3, percentage: 40 }, { unitNumber: 4, percentage: 40 }
    ]
  },
  // Term 3: Class 10 specialized 20% x 5 units
  {
    id: 'at-t3-10', classLevel: ClassLevel._10, subject: SubjectType.TAMIL_AT, term: ExamTerm.THIRD,
    weightages: [
      { unitNumber: 1, percentage: 20 }, { unitNumber: 2, percentage: 20 },
      { unitNumber: 3, percentage: 20 }, { unitNumber: 4, percentage: 20 },
      { unitNumber: 5, percentage: 20 }
    ]
  },

  {
    id: 'at-t1', classLevel: ClassLevel._9, subject: SubjectType.TAMIL_AT, term: ExamTerm.FIRST,
    weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }]
  },
  // Term 2: Unit 1 (10%), Unit 2 (10%), Unit 3 (40%), Unit 4 (40%)
  {
    id: 'at-t2', classLevel: ClassLevel._9, subject: SubjectType.TAMIL_AT, term: ExamTerm.SECOND,
    weightages: [
      { unitNumber: 1, percentage: 10 }, { unitNumber: 2, percentage: 10 },
      { unitNumber: 3, percentage: 40 }, { unitNumber: 4, percentage: 40 }
    ]
  },
  // Term 3: Class 9 specialized 20% x 5 units
  {
    id: 'at-t3-9', classLevel: ClassLevel._9, subject: SubjectType.TAMIL_AT, term: ExamTerm.THIRD,
    weightages: [
      { unitNumber: 1, percentage: 5 }, { unitNumber: 2, percentage: 5 },
      { unitNumber: 3, percentage: 10 }, { unitNumber: 4, percentage: 10 },
      { unitNumber: 5, percentage: 35 }, { unitNumber: 5, percentage: 35 }
    ]
  },

  {
    id: 'at-t1', classLevel: ClassLevel._8, subject: SubjectType.TAMIL_AT, term: ExamTerm.FIRST,
    weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }]
  },
  // Term 2: Unit 1 (10%), Unit 2 (10%), Unit 3 (40%), Unit 4 (40%)
  {
    id: 'at-t2', classLevel: ClassLevel._8, subject: SubjectType.TAMIL_AT, term: ExamTerm.SECOND,
    weightages: [
      { unitNumber: 1, percentage: 10 }, { unitNumber: 2, percentage: 10 },
      { unitNumber: 3, percentage: 40 }, { unitNumber: 4, percentage: 40 }
    ]
  },
  // Term 3: Class 8 specialized 20% x 5 units
  {
    id: 'at-t3-8', classLevel: ClassLevel._8, subject: SubjectType.TAMIL_AT, term: ExamTerm.THIRD,
    weightages: [
      { unitNumber: 1, percentage: 5 }, { unitNumber: 2, percentage: 5 },
      { unitNumber: 3, percentage: 10 }, { unitNumber: 4, percentage: 10 },
      { unitNumber: 5, percentage: 35 }, { unitNumber: 5, percentage: 35 }
    ]
  },

  // --- Tamil BT - Class 10 ---
  // Term 1: Unit 1 (100%)
  {
    id: 'bt-t1', classLevel: ClassLevel._10, subject: SubjectType.TAMIL_BT, term: ExamTerm.FIRST,
    weightages: [{ unitNumber: 1, percentage: 100 }]
  },
  // Term 2: Unit 1 (20%), Unit 2 (80%)
  {
    id: 'bt-t2', classLevel: ClassLevel._10, subject: SubjectType.TAMIL_BT, term: ExamTerm.SECOND,
    weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }]
  },
  // Term 3: Unit 1 (30%), Unit 2 (34%), Unit 3 (36%) - Specialized for Class 10
  {
    id: 'bt-t3-10', classLevel: ClassLevel._10, subject: SubjectType.TAMIL_BT, term: ExamTerm.THIRD,
    weightages: [{ unitNumber: 1, percentage: 30 }, { unitNumber: 2, percentage: 34 }, { unitNumber: 3, percentage: 36 }]
  },
  // Class 10 BT Term 1
  { id: 'bt-t1-10', classLevel: ClassLevel._10, subject: SubjectType.TAMIL_BT, term: ExamTerm.FIRST, weightages: [{ unitNumber: 1, percentage: 100 }] },
  // Class 10 BT Term 2
  { id: 'bt-t2-10', classLevel: ClassLevel._10, subject: SubjectType.TAMIL_BT, term: ExamTerm.SECOND, weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }] },
  // BT Class 10 Term 3 (Already handled above, but keeping unique IDs for Clarity if needed. Wait, I replaced at-t3-10 and bt-t3-10 above.)

  // --- Tamil BT - Class 9 ---
  { id: 'bt-t1-9', classLevel: ClassLevel._9, subject: SubjectType.TAMIL_BT, term: ExamTerm.FIRST, weightages: [{ unitNumber: 1, percentage: 100 }] },
  { id: 'bt-t2-9', classLevel: ClassLevel._9, subject: SubjectType.TAMIL_BT, term: ExamTerm.SECOND, weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }] },
  { id: 'bt-t3-9', classLevel: ClassLevel._9, subject: SubjectType.TAMIL_BT, term: ExamTerm.THIRD, weightages: [{ unitNumber: 1, percentage: 30 }, { unitNumber: 2, percentage: 34 }, { unitNumber: 3, percentage: 36 }] },

  // --- Tamil BT - Class 8 ---
  { id: 'bt-t1-8', classLevel: ClassLevel._8, subject: SubjectType.TAMIL_BT, term: ExamTerm.FIRST, weightages: [{ unitNumber: 1, percentage: 100 }] },
  { id: 'bt-t2-8', classLevel: ClassLevel._8, subject: SubjectType.TAMIL_BT, term: ExamTerm.SECOND, weightages: [{ unitNumber: 1, percentage: 50 }, { unitNumber: 2, percentage: 50 }] },
  { id: 'bt-t3-8', classLevel: ClassLevel._8, subject: SubjectType.TAMIL_BT, term: ExamTerm.THIRD, weightages: [{ unitNumber: 1, percentage: 30 }, { unitNumber: 2, percentage: 34 }, { unitNumber: 3, percentage: 36 }] },
];

const INITIAL_SETTINGS: SystemSettings = {
  cognitiveProcesses: Object.entries(CognitiveProcess).map(([k, v]) => ({ code: k, name: (v as string).split(' ')[0], description: v })),
  knowledgeLevels: Object.entries(KnowledgeLevel).map(([k, v]) => ({ code: k, name: v, description: v })),
  itemFormats: Object.entries(ItemFormat).map(([k, v]) => ({ code: k, name: v, description: v }))
};

// --- Seed Discourses ---
const createDiscourse = (id: string, subject: SubjectType, marks: number, name: string): Discourse => ({
  id, subject, marks, name, description: name, cognitiveProcess: CognitiveProcess.CP1, rubrics: []
});

const INITIAL_DISCOURSES: Discourse[] = [
  // Tamil AT - 3 Marks
  createDiscourse('at-3-1', SubjectType.TAMIL_AT, 3, 'அறிவிப்பு'),
  createDiscourse('at-3-2', SubjectType.TAMIL_AT, 3, 'தூய தமிழ் நடை'),
  createDiscourse('at-3-3', SubjectType.TAMIL_AT, 3, 'தன்விவரப்பட்டியல்'),
  createDiscourse('at-3-4', SubjectType.TAMIL_AT, 3, 'சுற்றறிக்கை'),
  createDiscourse('at-3-5', SubjectType.TAMIL_AT, 3, 'விமர்சனக் குறிப்பு'),
  createDiscourse('at-3-6', SubjectType.TAMIL_AT, 3, 'சிறு குறிப்பு'),
  createDiscourse('at-3-7', SubjectType.TAMIL_AT, 3, 'இலக்கணம்'),
  createDiscourse('at-3-8', SubjectType.TAMIL_AT, 3, 'அகர வரிசைப்படுத்தி பொருள் எழுதுதல்'),

  // Tamil AT - 5 Marks
  createDiscourse('at-5-1', SubjectType.TAMIL_AT, 5, 'அலுவலகக் கடிதம்'),
  createDiscourse('at-5-2', SubjectType.TAMIL_AT, 5, 'சொற்பொழிவு உரை'),
  createDiscourse('at-5-3', SubjectType.TAMIL_AT, 5, 'விளக்கக் குறிப்பு'),
  createDiscourse('at-5-4', SubjectType.TAMIL_AT, 5, 'நயம் பாராட்டுதல்'),
  createDiscourse('at-5-5', SubjectType.TAMIL_AT, 5, 'ஒப்பிட்டுக் குறிப்பு'),

  // Tamil AT - 6 Marks
  createDiscourse('at-6-1', SubjectType.TAMIL_AT, 6, 'கட்டுரை'),
  createDiscourse('at-6-2', SubjectType.TAMIL_AT, 6, 'தலையங்கம்'),
  createDiscourse('at-6-3', SubjectType.TAMIL_AT, 6, 'விமர்சனம்'),

  // Tamil BT - 3 Marks
  createDiscourse('bt-3-1', SubjectType.TAMIL_BT, 3, 'துண்டுப்பிரசுரம்'),
  createDiscourse('bt-3-2', SubjectType.TAMIL_BT, 3, 'வாழ்க்கை குறிப்பு'),
  createDiscourse('bt-3-3', SubjectType.TAMIL_BT, 3, 'விமர்சனக் குறிப்பு'),
  createDiscourse('bt-3-4', SubjectType.TAMIL_BT, 3, 'சிறுகுறிப்பு'),
  createDiscourse('bt-3-5', SubjectType.TAMIL_BT, 3, 'சுற்றறிக்கை'),
  createDiscourse('bt-3-6', SubjectType.TAMIL_BT, 3, 'நூலடைவு'),
  createDiscourse('bt-3-7', SubjectType.TAMIL_BT, 3, 'பத்திரிகை செய்தி'),
  createDiscourse('bt-3-8', SubjectType.TAMIL_BT, 3, 'வரவேற்புரை'),

  // Tamil BT - 5 Marks
  createDiscourse('bt-5-1', SubjectType.TAMIL_BT, 5, 'உறவுக்கடிதம்'),
  createDiscourse('bt-5-2', SubjectType.TAMIL_BT, 5, 'விளக்கக் குறிப்பு'),
  createDiscourse('bt-5-3', SubjectType.TAMIL_BT, 5, 'பட்டிமன்றஉரை'),
  createDiscourse('bt-5-4', SubjectType.TAMIL_BT, 5, 'ஒப்பிட்டுக் குறிப்பு'),
  createDiscourse('bt-5-5', SubjectType.TAMIL_BT, 5, 'பத்தி வாசித்து வினா விடை'),

  // Tamil BT - 6 Marks
  createDiscourse('bt-6-1', SubjectType.TAMIL_BT, 6, 'கதை விமர்சனம்'),
  createDiscourse('bt-6-2', SubjectType.TAMIL_BT, 6, 'தலையங்கம்'),
  createDiscourse('bt-6-3', SubjectType.TAMIL_BT, 6, 'கட்டுரை'),
];

// --- DB Operations ---

const DB_KEY = 'exam_bp_db_v12';

interface DB {
  curriculums: Curriculum[];
  users: User[];
  examConfigs: ExamConfiguration[];
  settings: SystemSettings;
  blueprints: Blueprint[];
  questionPaperTypes: QuestionPaperType[];
  discourses: Discourse[];
  sharedBlueprints: SharedBlueprint[];
}

export const getDB = (): DB => {
  const stored = localStorage.getItem(DB_KEY);
  if (stored) {
    const db: DB = JSON.parse(stored);

    // Migration: ensure all existing blueprints have isConfirmed = true if missing
    if (db.blueprints) {
      db.blueprints = db.blueprints.map(bp => ({
        ...bp,
        isConfirmed: bp.isConfirmed === undefined ? true : bp.isConfirmed
      }));
    }

    // Migration: Update existing paper types with instructions from seed data
    if (db.questionPaperTypes) {
      db.questionPaperTypes = db.questionPaperTypes.map(pt => {
        const seedPt = INITIAL_PAPER_TYPES.find(p => p.id === pt.id || p.name === pt.name);
        if (seedPt) {
          return {
            ...pt,
            sections: pt.sections.map(sec => {
              const seedSec = seedPt.sections.find(s => s.id === sec.id);
              if (seedSec && !sec.instruction) {
                return { ...sec, instruction: seedSec.instruction };
              }
              return sec;
            })
          };
        }
        return pt;
      });
    }

    // Migration: Update existing curriculum units with LOs from seed data if they are empty
    if (db.curriculums) {
      db.curriculums = db.curriculums.map(curr => {
        const seedCurr = INITIAL_CURRICULUM.find(c => c.classLevel === curr.classLevel && c.subject === curr.subject);
        if (seedCurr) {
          return {
            ...curr,
            units: curr.units.map(unit => {
              const seedUnit = seedCurr.units.find(u => u.unitNumber === unit.unitNumber);
              // Only overwrite if learningOutcomes is missing or a generic placeholder
              if (!unit.learningOutcomes || unit.learningOutcomes.startsWith('Learning outcomes for')) {
                return { ...unit, learningOutcomes: seedUnit?.learningOutcomes || unit.learningOutcomes };
              }
              return unit;
            })
          };
        }
        return curr;
      });
      // Save the migrated data back to localStorage
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }

    return db;
  }
  return {
    curriculums: INITIAL_CURRICULUM,
    users: INITIAL_USERS,
    examConfigs: INITIAL_EXAM_CONFIGS,
    settings: INITIAL_SETTINGS,
    blueprints: [],
    questionPaperTypes: INITIAL_PAPER_TYPES,
    discourses: INITIAL_DISCOURSES,
    sharedBlueprints: []
  };
};

export const saveDB = (data: DB) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// --- Helpers ---

export const getCurriculum = (cls: ClassLevel, sub: SubjectType) => {
  const db = getDB();
  return db.curriculums.find((c: Curriculum) => c.classLevel === cls && c.subject === sub);
};

export const saveCurriculum = (curr: Curriculum) => {
  const db = getDB();
  const idx = db.curriculums.findIndex((c: Curriculum) => c.classLevel === curr.classLevel && c.subject === curr.subject);
  if (idx >= 0) {
    db.curriculums[idx] = curr;
  } else {
    db.curriculums.push(curr);
  }
  saveDB(db);
};

export const getUsers = () => getDB().users;
export const saveUsers = (users: User[]) => {
  const db = getDB();
  db.users = users;
  saveDB(db);
};

export const getExamConfigs = () => getDB().examConfigs;
export const saveExamConfigs = (configs: ExamConfiguration[]) => {
  const db = getDB();
  db.examConfigs = configs;
  saveDB(db);
};

export const getSettings = () => getDB().settings;

export const getTermConfiguration = (term: ExamTerm, subject: SubjectType, classLevel: ClassLevel) => {
  const db = getDB();
  // Find config for specific class/subject/term
  const config = db.examConfigs.find(c => c.classLevel === classLevel && c.subject === subject && c.term === term);

  // Fallback
  if (!config) {
    return [];
  }
  return config.weightages.map(w => ({ u: w.unitNumber, w: w.percentage / 100 }));
};

// Blueprint persistence
export const getBlueprints = () => getDB().blueprints;
export const saveBlueprint = (bp: Blueprint) => {
  const db = getDB();
  const index = db.blueprints.findIndex(b => b.id === bp.id);
  if (index >= 0) {
    db.blueprints[index] = bp;
  } else {
    db.blueprints.push(bp);
  }
  saveDB(db);
};
export const deleteBlueprint = (id: string) => {
  const db = getDB();
  db.blueprints = db.blueprints.filter(b => b.id !== id);
  saveDB(db);
};

export const toggleBlueprintLock = (id: string) => {
  const db = getDB();
  const index = db.blueprints.findIndex(b => b.id === id);
  if (index >= 0) {
    db.blueprints[index].isLocked = !db.blueprints[index].isLocked;
    saveDB(db);
  }
};

export const toggleBlueprintHidden = (id: string) => {
  const db = getDB();
  const index = db.blueprints.findIndex(b => b.id === id);
  if (index >= 0) {
    db.blueprints[index].isHidden = !db.blueprints[index].isHidden;
    saveDB(db);
  }
};

export const resetBlueprintConfirmation = (id: string) => {
  const db = getDB();
  const index = db.blueprints.findIndex(b => b.id === id);
  if (index >= 0) {
    db.blueprints[index].isConfirmed = false;
    saveDB(db);
  }
};

// Paper Types persistence
export const getQuestionPaperTypes = () => getDB().questionPaperTypes;
export const saveQuestionPaperTypes = (types: QuestionPaperType[]) => {
  const db = getDB();
  db.questionPaperTypes = types;
  saveDB(db);
};

// Discourse persistence
export const getDiscourses = () => getDB().discourses || [];
export const saveDiscourses = (discourses: Discourse[]) => {
  const db = getDB();
  db.discourses = discourses;
  saveDB(db);
};


// --- Helpers ---

export const getDefaultFormat = (marks: number): ItemFormat => {
  if (marks === 1) return ItemFormat.SR1;
  if (marks === 2) return ItemFormat.CRS1;
  if (marks === 3) return ItemFormat.CRS2;
  if (marks === 4) return ItemFormat.CRS3;
  if (marks >= 5) return ItemFormat.CRL;
  return ItemFormat.CRS1;
};

export const getDefaultKnowledge = (marks: number): KnowledgeLevel => {
  if (marks === 1) return KnowledgeLevel.BASIC;
  if (marks === 2) return KnowledgeLevel.AVERAGE;
  return KnowledgeLevel.PROFOUND;
};

// --- New Robust Generation Logic ---

const shuffle = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Partition tokens among units based on their target marks
const partitionTokensToUnits = (
  tokens: { mark: number, sectionId: string }[],
  unitTargets: { unit: Unit, target: number }[]
): { unit: Unit, tokens: { mark: number, sectionId: string }[] }[] | null => {

  const solve = (
    tokenIdx: number,
    deficits: number[]
  ): { mark: number, sectionId: string }[][] | null => {
    if (tokenIdx === tokens.length) {
      return deficits.every(d => Math.abs(d) < 0.1) ? deficits.map(() => []) : null;
    }

    const token = tokens[tokenIdx];
    // Try to put this token in each unit that has enough deficit
    const unitIndices = shuffle(Array.from({ length: deficits.length }, (_, i) => i));

    for (const uIdx of unitIndices) {
      if (deficits[uIdx] >= token.mark - 0.1) {
        deficits[uIdx] -= token.mark;
        const result = solve(tokenIdx + 1, deficits);
        if (result) {
          result[uIdx].push(token);
          return result;
        }
        deficits[uIdx] += token.mark; // Backtrack
      }
    }
    return null;
  };

  const initialDeficits = unitTargets.map(ut => ut.target);
  const shuffledTokens = shuffle(tokens);
  const allocation = solve(0, initialDeficits);

  if (!allocation) return null;

  return unitTargets.map((ut, i) => ({
    unit: ut.unit,
    tokens: allocation[i]
  }));
};

// Partition total items among Knowledge Levels
const assignKnowledgeLevels = (
  items: BlueprintItem[],
  targets: Record<KnowledgeLevel, number>
): boolean => {
  const klOrder = [KnowledgeLevel.BASIC, KnowledgeLevel.AVERAGE, KnowledgeLevel.PROFOUND];

  const solve = (idx: number, currentDeficits: Record<string, number>): boolean => {
    if (idx === items.length) {
      return Object.values(currentDeficits).every(d => Math.abs(d) < 0.1);
    }

    const item = items[idx];
    // Shuffle KL options for randomization
    const options = shuffle(klOrder);

    for (const kl of options) {
      if (currentDeficits[kl] >= item.totalMarks - 0.1) {
        currentDeficits[kl] -= item.totalMarks;
        item.knowledgeLevel = kl;
        // Keep Option B in sync with Option A
        if (item.hasInternalChoice) {
          item.knowledgeLevelB = kl;
        }
        if (solve(idx + 1, currentDeficits)) return true;
        currentDeficits[kl] += item.totalMarks; // Backtrack
      }
    }
    return false;
  };

  return solve(0, { ...targets });
};

export const getFilteredCurriculum = (curriculum: Curriculum | null, term: ExamTerm): Curriculum | null => {
  if (!curriculum) return null;
  const weightages = getTermConfiguration(term, curriculum.subject, curriculum.classLevel);
  
  // If no weightages found for this term, return the full curriculum as fallback
  if (weightages.length === 0) return curriculum;

  const activeUnitNumbers = weightages.map(w => w.u);
  return {
    ...curriculum,
    units: curriculum.units.filter(u => activeUnitNumbers.includes(u.unitNumber))
  };
};

export const generateBlueprintTemplate = (
  curriculum: Curriculum,
  term: ExamTerm,
  paperTypeId: string
): BlueprintItem[] => {
  const db = getDB();
  const paperType = db.questionPaperTypes.find((p: any) => p.id === paperTypeId);
  if (!paperType) return [];

  // Filter curriculum to only include units relevant for this term
  const filteredCurriculum = getFilteredCurriculum(curriculum, term) || curriculum;
  const weightages = getTermConfiguration(term, curriculum.subject, curriculum.classLevel);

  // 1. Calculate Unit Targets
  const unitTargets: { unit: Unit, target: number }[] = [];
  const activeWeightages = weightages.length > 0
    ? weightages
    : filteredCurriculum.units.map(u => ({ u: u.unitNumber, w: 1 / filteredCurriculum.units.length }));

  activeWeightages.forEach(w => {
    const unit = filteredCurriculum.units.find(u => u.unitNumber === w.u);
    if (unit) {
      unitTargets.push({ unit, target: paperType.totalMarks * w.w });
    }
  });


  // 2. Create and Shuffle Token Pool
  const tokenPool: { mark: number, sectionId: string }[] = [];
  paperType.sections.forEach(section => {
    for (let i = 0; i < section.count; i++) {
      tokenPool.push({ mark: section.marks, sectionId: section.id });
    }
  });

  // 3. Partition Tokens into Units
  let unitAllocation = partitionTokensToUnits(tokenPool, unitTargets);

  if (!unitAllocation) {
    console.warn("Could not find an exact partition for weightages. Falling back to greedy allocation.");
    // Greedy fallback: Assign each token to the unit with the highest remaining deficit
    const deficits = unitTargets.map(ut => ut.target);
    const allocation: { mark: number, sectionId: string }[][] = unitTargets.map(() => []);

    shuffle(tokenPool).forEach(token => {
      let maxDeficitIdx = 0;
      for (let i = 1; i < deficits.length; i++) {
        if (deficits[i] > deficits[maxDeficitIdx]) maxDeficitIdx = i;
      }
      allocation[maxDeficitIdx].push(token);
      deficits[maxDeficitIdx] -= token.mark;
    });

    unitAllocation = unitTargets.map((ut, i) => ({
      unit: ut.unit,
      tokens: allocation[i]
    }));
  }

  // 4. Create initial Blueprint Items
  const items: BlueprintItem[] = [];
  const usageTracker: Record<string, number> = {};

  unitAllocation.forEach(alloc => {
    alloc.tokens.forEach(token => {
      if (!usageTracker[alloc.unit.id]) usageTracker[alloc.unit.id] = 0;
      const subUnitId = alloc.unit.subUnits.length > 0
        ? alloc.unit.subUnits[usageTracker[alloc.unit.id] % alloc.unit.subUnits.length].id
        : 'general';
      usageTracker[alloc.unit.id]++;

      // Handle internal choice based on section definition
      const section = paperType.sections.find(s => s.id === token.sectionId);
      const sectionOptionCount = section?.optionCount || 0;
      const currentSectionCount = items.filter(i => i.sectionId === token.sectionId && i.hasInternalChoice).length;
      const hasInternalChoice = currentSectionCount < sectionOptionCount;

      items.push({
        id: Math.random().toString(36).substr(2, 9),
        unitId: alloc.unit.id,
        subUnitId: subUnitId,
        marksPerQuestion: token.mark,
        totalMarks: token.mark,
        questionCount: 1,
        sectionId: token.sectionId,
        knowledgeLevel: KnowledgeLevel.BASIC, // Placeholder
        cognitiveProcess: CognitiveProcess.CP2,
        itemFormat: getDefaultFormat(token.mark),
        questionType: assignQuestionType(token.mark),
        hasInternalChoice: hasInternalChoice,
        knowledgeLevelB: KnowledgeLevel.BASIC,
        cognitiveProcessB: CognitiveProcess.CP2,
        itemFormatB: getDefaultFormat(token.mark),
        questionText: '',
        answerText: ''
      });
    });
  });

  // 5. Strict Knowledge Level Allocation (30% / 50% / 20%)
  const klTargets = {
    [KnowledgeLevel.BASIC]: Math.round(paperType.totalMarks * 0.3),
    [KnowledgeLevel.AVERAGE]: Math.round(paperType.totalMarks * 0.5),
    [KnowledgeLevel.PROFOUND]: paperType.totalMarks - Math.round(paperType.totalMarks * 0.3) - Math.round(paperType.totalMarks * 0.5)
  };

  // Pre-assign 1-mark questions (option questions) to KnowledgeLevel.BASIC as per user requirement
  const optionQuestions = items.filter(item => item.marksPerQuestion === 1);
  const remainingQuestions = items.filter(item => item.marksPerQuestion !== 1);

  optionQuestions.forEach(item => {
    item.knowledgeLevel = KnowledgeLevel.BASIC;
    if (item.hasInternalChoice) {
      item.knowledgeLevelB = KnowledgeLevel.BASIC;
    }
    klTargets[KnowledgeLevel.BASIC] -= item.totalMarks;
  });

  // Ensure target doesn't go below 0 (if 1-mark questions exceed 30% marks, we cap it and prioritize user requirement)
  if (klTargets[KnowledgeLevel.BASIC] < 0) {
    klTargets[KnowledgeLevel.BASIC] = 0;
  }

  const klSuccess = assignKnowledgeLevels(remainingQuestions, klTargets);
  if (!klSuccess) {
    console.error("Could not satisfy KL weightage constraints!");
  }

  return items;
};

const assignQuestionType = (marks: number): QuestionType => {
  if (marks === 1) return QuestionType.SR1;
  if (marks === 2) return QuestionType.CRS1;
  if (marks === 3) return QuestionType.CRS2;
  if (marks === 4) return QuestionType.CRS3;
  return QuestionType.CRL;
};

// --- Blueprint Sharing Functions ---

export const shareBlueprint = (blueprintId: string, fromUserId: string, toUserId: string): boolean => {
  const db = getDB();

  // Check if blueprint exists
  const blueprint = db.blueprints.find(b => b.id === blueprintId);
  if (!blueprint) return false;

  // Initialize sharedBlueprints if undefined
  if (!db.sharedBlueprints) db.sharedBlueprints = [];

  // Check if already shared
  const existingShare = db.sharedBlueprints.find(
    s => s.blueprintId === blueprintId && s.sharedWithUserId === toUserId
  );
  if (existingShare) return false;

  // Create share record
  const share: SharedBlueprint = {
    id: Math.random().toString(36).substr(2, 9),
    blueprintId,
    ownerId: fromUserId,
    sharedWithUserId: toUserId,
    sharedAt: new Date().toISOString(),
    canEdit: true
  };

  db.sharedBlueprints.push(share);

  // Update blueprint's sharedWith array
  if (!blueprint.sharedWith) {
    blueprint.sharedWith = [];
  }
  if (!blueprint.sharedWith.includes(toUserId)) {
    blueprint.sharedWith.push(toUserId);
  }

  saveDB(db);
  return true;
};

export const getSharedBlueprints = (userId: string): Blueprint[] => {
  const db = getDB();
  const sharedRecords = (db.sharedBlueprints || []).filter(s => s.sharedWithUserId === userId);
  const blueprintIds = sharedRecords.map(s => s.blueprintId);
  return db.blueprints.filter(b => blueprintIds.includes(b.id));
};

export const getUserBlueprints = (userId: string): Blueprint[] => {
  const db = getDB();
  return db.blueprints.filter(b => b.ownerId === userId);
};

export const getAllAccessibleBlueprints = (userId: string): Blueprint[] => {
  const db = getDB();
  const owned = db.blueprints.filter(b => b.ownerId === userId);
  const sharedRecords = (db.sharedBlueprints || []).filter(s => s.sharedWithUserId === userId);
  const sharedIds = sharedRecords.map(s => s.blueprintId);
  const shared = db.blueprints.filter(b => sharedIds.includes(b.id));

  // Combine and remove duplicates
  const allBlueprints = [...owned, ...shared];
  const uniqueBlueprints = allBlueprints.filter((bp, index, self) =>
    index === self.findIndex(b => b.id === bp.id)
  );

  return uniqueBlueprints;
};

export const removeShare = (blueprintId: string, userId: string): boolean => {
  const db = getDB();

  // Remove from sharedBlueprints
  if (!db.sharedBlueprints) db.sharedBlueprints = [];
  const initialLength = db.sharedBlueprints.length;
  db.sharedBlueprints = db.sharedBlueprints.filter(
    s => !(s.blueprintId === blueprintId && s.sharedWithUserId === userId)
  );

  // Update blueprint's sharedWith array
  const blueprint = db.blueprints.find(b => b.id === blueprintId);
  if (blueprint && blueprint.sharedWith) {
    blueprint.sharedWith = blueprint.sharedWith.filter(id => id !== userId);
  }

  saveDB(db);
  return db.sharedBlueprints.length < initialLength;
};

export const canUserEditBlueprint = (blueprintId: string, userId: string): boolean => {
  const db = getDB();
  const blueprint = db.blueprints.find(b => b.id === blueprintId);

  if (!blueprint) return false;

  // Owner can always edit
  if (blueprint.ownerId === userId) return true;

  // Check if shared with edit permission
  const share = (db.sharedBlueprints || []).find(
    s => s.blueprintId === blueprintId && s.sharedWithUserId === userId
  );

  return share ? share.canEdit : false;
};

export const getSharedWithUsers = (blueprintId: string): User[] => {
  const db = getDB();
  const blueprint = db.blueprints.find(b => b.id === blueprintId);

  if (!blueprint || !blueprint.sharedWith) return [];

  return db.users.filter(u => blueprint.sharedWith?.includes(u.id));
};
