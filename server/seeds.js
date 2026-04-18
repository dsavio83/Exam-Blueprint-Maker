const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  INITIAL_PAPER_TYPES,
  INITIAL_EXAM_CONFIGS,
  INITIAL_DISCOURSES
} = require('./seed-master-data');
const { INITIAL_CURRICULUM } = require('./seed-curriculum');
const {
  User, Curriculum, ExamConfig, Blueprint, PaperType,
  Discourse, SystemSettings, SharedBlueprint
} = require('./models');

const MONGO_URI = process.env.MONGO_URI;

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
