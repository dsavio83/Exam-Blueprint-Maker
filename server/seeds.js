const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  INITIAL_PAPER_TYPES,
  INITIAL_EXAM_CONFIGS,
  INITIAL_DISCOURSES
} = require('./seed-master-data');
const {
  User, Curriculum, ExamConfig, Blueprint, PaperType,
  Discourse, SystemSettings, SharedBlueprint
} = require('./models');

const MONGO_URI = process.env.MONGO_URI;

// --- Data from db.ts ---
const createUnit = (idPrefix, num, name, subNames, los) => ({
  id: `${idPrefix}-u${num}`,
  unitNumber: num,
  name: name,
  subUnits: subNames.map((s, i) => ({ id: `${idPrefix}-u${num}-s${i + 1}`, name: s })),
  learningOutcomes: los || `Learning outcomes for ${name}`
});

const UNITS_10_AT = [
  createUnit('10at', 1, 'விந்தைகள்', ['நொய்யல்', 'நிலமகள்', 'மலையகம்'], 'இயற்கை எழிலை நயம்பட உரைத்தல், செய்யுளின் மையக்கருத்தை உணர்ந்து வெளிப்படுத்துதல், சொல்லாட்சித் திறனை வளர்த்தல்.'),
  createUnit('10at', 2, 'ஒன்றெனக் கொள்', ['முதுமையில் இனிமை', 'ஒன்றே உலகம்', 'இனியொரு விதி செய்வோம்'], 'யாதும் ஊரே யாவரும் கேளிர் எனும் உலகளாவிய சிந்தனையைப் பெறுதல், சமூக நல்லிணக்கத்தின் அவசியத்தை உணர்தல்.'),
  createUnit('10at', 3, 'கலை நயம்', ['நளினம்', 'மெய்ப்பொருள்', 'கைவண்ணம்'], 'கலைகளின் சிறப்பினைப் போற்றுதல், நுண்கலைகளுக்கும் வாழ்வியலுக்கும் உள்ள தொடர்பை விளக்குதல்.'),
  createUnit('10at', 4, 'கலைத் திறன்', ['ஓவியம்', 'சிற்பம்', 'நாடகம்'], 'பல்வேறு கலை வடிவங்களை வேறுபடுத்தி அறிதல், கலை நுணுக்கங்களைச் சொந்த நடையில் விவரித்தல்.'),
  createUnit('10at', 5, 'தமிழர் பண்பாடு', ['விருந்தோம்பல்', 'வீரம்', 'கொடை'], 'தமிழர்களின் வீர மரபு, விருந்தோம்பும் பண்பு மற்றும் ஈகை ஆகியவற்றை வாழ்க்கையில் பின்பற்றுதல்.')
];

const UNITS_9_AT = [
  createUnit('9at', 1, 'ஒரே ஒரு பூமி', ['இயற்கை', 'விடியலைத் தேடி', 'உயிர்த்துளி'], 'இயற்கைப் பாதுகாப்பின் இன்றியமையாமையை அறிதல், சுற்றுப்புறத் தூய்மையைக் காப்பதில் ஆர்வம் கொள்ளுதல்.'),
  createUnit('9at', 2, 'நேசமே சுவாசம்', ['உதவிக்கரம் நீட்டுவோம்', 'தன்னம்பிக்கை', 'நல்லிணக்கம்'], 'பிறருக்கு உதவும் மனப்பான்மையை வளர்த்தல், தன்னம்பிக்கையுடன் எச்செயலையும் அணுகுதல்.'),
  createUnit('9at', 3, 'நீரும் நிலமும்', ['இயற்கை விளையாட்டு', 'வெக்கை', 'கலங்கரை விளக்கம்'], 'நீர் மற்றும் நில வளங்களின் முக்கிய성을 உணர்த்தல், சங்க இலக்கியங்களில் கூறப்பட்டுள்ள இயற்கைச் சூழல்களைப் பதிவு செய்தல்.'),
  createUnit('9at', 4, 'இசையும் நடமும்', ['அழகோவியம்', 'தந்தனத்தோம்', 'விருந்து'], 'இசை மற்றும் நடனக் கலைகளின் தொன்மையை அறிதல், கலைகள் வழியாகப் பண்பாட்டைப் பிரதிபலித்தல்.'),
  createUnit('9at', 5, 'கூடிவாழ்', ['குடும்ப உறவு', 'இலக்கியத்தில் உறவு', 'யாதும் ஊரே'], 'உறவுகளின் மேன்மையை உணர்தல், ஒருமித்த கருத்துடன் குழுவாகச் செயல்படும் திறனைப் பெறுதல்.'),
  createUnit('9at', 6, 'உழைப்பே உயர்வு', ['வயலும் வாழ்வும்', 'மழைச்சாரல்', 'கட்டுமரம்'], 'உழைப்பின் பெருமையை அறிதல், தொழில் சார்ந்த திறன்களையும் வாழ்வாதாரத்தையும் மேம்படுத்துதல்.')
];

const UNITS_8_AT = [
  createUnit('8at', 1, 'நீர் வளம்', ['தேனருவி', 'உயிர்நீர்', 'அலையோசை'], 'நீர்க்குடிகளின் அவசியத்தை விளக்குதல், நீர் நிலைகளைச் சீரமைப்பதன் பயன்களை அறிதல்.'),
  createUnit('8at', 2, 'மானுடம் வெல்லும்', ['ஒன்றுபடுவோம்', 'அன்பே அறம்', 'ஓருயிராய்'], 'மனிதநேயப் பண்புகளை வளர்த்தல், அறநெறிச் சிந்தனைகளைத் அன்றாட வாழ்வில் கடைப்பிடித்தல்.'),
  createUnit('8at', 3, 'வாழ்வு வளம் பெற', ['ஏர்ப்பின்னது உலகம்', 'தறியும் தடுக்கும்', 'ஆலைகள் செய்வோம்'], 'விவசாயம் மற்றும் தொழில்துறையின் வளர்ச்சியை மதிப்பிடுதல், உள்ளூர் உற்பத்திப் பொருட்களுக்கு முன்னுரிமை அளித்தல்.'),
  createUnit('8at', 4, 'அமுத ஊற்று', ['யாழினிது', 'சிப்பிக்குள் முத்து', 'முதுசொல்'], 'மொழியின் இனிமையைப் போற்றுதல், மரபுச் சொற்களைச் சரியான முறையில் கையாளுதல்.'),
  createUnit('8at', 5, 'சங்கே முழுங்கு', ['இல்லாமை இல்லாகி', 'மண்ணின் மைந்தர்கள்', 'தேன்மொழி'], 'தன்னார்வத் தொண்டுகளில் ஈடுபடுதல், நாட்டுப்பற்று மிக்க வீரர்களின் வரலாற்றை உரைத்தல்.'),
  createUnit('8at', 6, 'வானமே எல்லை', ['கார்மேகம்', 'பருவச் சுழற்சி', 'அமைதி கொள்'], 'அறிவியல் விழிப்புணர்வை மேம்படுத்துதல், புதிய கண்டுபிடிப்புகள் குறித்த தகவல்களைத் திரட்டுதல்.')
];

const UNITS_8_BT_SHARED = [
  createUnit('8bt', 1, 'தூய்மை வாழ்வு', ['சூழல்கள்', 'குறைவற்ற செல்வம்', 'அக அழகு'], 'தூய்மையின் சிறப்பினை உணர்தல், உடல் மற்றும் மன நலத்தைப் பேணுதல்.'),
  createUnit('8bt', 2, 'தெளிவானம்', ['விண்மீன்கள்', 'சுடர்கள்', 'நிழல்கள்'], 'வான்வெளி விந்தைகளை வியந்து போற்றுதல், அறிவியல் தேடலை வளர்த்தல்.'),
  createUnit('8bt', 3, 'கவசம', ['சாகசம்', 'வேலிகள்', 'வெள்ளம்'], 'தற்காப்புத் திறன்களைப் பெறுதல், பேரிடர் மேலாண்மை குறித்த விழிப்புணர்வு கொள்ளுதல்.')
];

const UNITS_9_BT_SHARED = [
  createUnit('9bt', 1, 'வருமுன் காப்போம்', ['உணவே மருந்து', 'துரிதம் தவிர்', 'நோயின்றி வாழ்'], 'நல்ல உணவு பழக்கத்தைக் கையாளும் திறன்'),
  createUnit('9bt', 2, 'சரி நிகராய்', ['விடிவெள்ளி', 'நிகரெனக் கொள்வதால்', 'சாதனைப் பெண்மணிகள்'], 'பாலினம் குறித்த தெளிவு'),
  createUnit('9bt', 3, 'விண்ணைத்தொடுவோம்', ['மனிதனைப்போல', 'உள்ளங்கையில் உலகம்', 'திரையினூடே'], 'சமூக ஊடகங்களை கையாளும் திறன்')
];

const UNITS_10_BT_SHARED = [
  createUnit('10bt', 1, 'நலம் விரும்பு', ['அமுதசுரபி', 'நோய் நாடி', 'டிஜிட்டல் உலகு'], 'உடல் நலம் பேணல், தொழில்நுட்ப மாற்றங்களை அறிதல்.'),
  createUnit('10bt', 2, 'துலாக்கோல்', ['எழுத்தாணி', 'தியாக மண்', 'சுடர் ஒளி'], 'நேர்மையின் வழி நிற்றல், தியாகிகளின் வரலாற்றைப் போற்றுதல்.'),
  createUnit('10bt', 3, 'ஆழிசூழ் உலகு', ['மீண்டெழுவோம்', 'புவிச்சீற்றம்', 'வியனுலகு'], 'புவி வெப்பமயமாதல் குறித்த கவலை, சுற்றுப்புறத்தைப் பாதுகாக்கும் பொறுப்பு.')
];

const INITIAL_CURRICULUM = [
  { classLevel: 8, subject: 'Tamil AT', units: UNITS_8_AT },
  { classLevel: 10, subject: 'Tamil BT', units: UNITS_8_BT_SHARED.map(u => ({ ...u, id: '10' + u.id })) },
  { classLevel: 9, subject: 'Tamil AT', units: UNITS_9_AT },
  { classLevel: 9, subject: 'Tamil BT', units: UNITS_9_BT_SHARED.map(u => ({ ...u, id: '9' + u.id })) },
  { classLevel: 10, subject: 'Tamil AT', units: UNITS_10_AT },
  { classLevel: 8, subject: 'Tamil BT', units: UNITS_10_BT_SHARED.map(u => ({ ...u, id: '8' + u.id })) },
];

const INITIAL_USERS = [
  { id: '1', username: 'admin', password: 'admin', role: 'ADMIN', name: 'Super Admin' },
  { id: '2', username: 'user', password: 'user', role: 'USER', name: 'Staff Member' }
];

const INITIAL_SETTINGS = {
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
};

const seedDB = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for seeding.");

        console.log("Clearing existing core collections...");
        await User.deleteMany({});
        await Curriculum.deleteMany({});
        await ExamConfig.deleteMany({});
        await PaperType.deleteMany({});
        await Discourse.deleteMany({});
        await SystemSettings.deleteMany({});

        console.log("Seeding System Settings...");
        await SystemSettings.create(INITIAL_SETTINGS);

        console.log("Seeding Users...");
        for (const u of INITIAL_USERS) {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            await User.create({
                id: u.id,
                username: u.username,
                password: hashedPassword,
                role: u.role,
                name: u.name
            });
        }

        console.log("Seeding Paper Types...");
        await PaperType.insertMany(INITIAL_PAPER_TYPES);

        console.log("Seeding Exam Configurations...");
        await ExamConfig.insertMany(INITIAL_EXAM_CONFIGS);

        console.log("Seeding Discourses...");
        await Discourse.insertMany(INITIAL_DISCOURSES);

        console.log("Seeding Curriculums...");
        await Curriculum.insertMany(INITIAL_CURRICULUM);

        console.log("Database seeding completed successfully.");
    } catch (e) {
        console.error("Seeding failed:", e);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
};

seedDB();
