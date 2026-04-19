const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: String,
  username: { type: String, unique: true },
  password: { type: String, required: true },
  role: String,
  name: String,
  email: String
}, { strict: false });

const curriculumSchema = new mongoose.Schema({
  classLevel: mongoose.Schema.Types.Mixed,
  subject: String,
  units: Array
}, { strict: false });

const examConfigSchema = new mongoose.Schema({
  id: String,
  classLevel: mongoose.Schema.Types.Mixed,
  subject: String,
  term: String,
  weightages: Array
}, { strict: false });

const blueprintSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  examTerm: String,
  classLevel: mongoose.Schema.Types.Mixed,
  subject: String,
  questionPaperTypeId: String,
  questionPaperTypeName: String,
  totalMarks: Number,
  items: Array,
  createdAt: String,
  setId: String,
  academicYear: String,
  ownerId: String,
  sharedWith: [String],
  isLocked: Boolean,
  isHidden: Boolean,
  isConfirmed: Boolean,
  isAdminAssigned: Boolean
}, { strict: false });

const paperTypeSchema = new mongoose.Schema({
  id: String,
  name: String,
  totalMarks: Number,
  description: String,
  sections: Array
}, { strict: false });

const discourseSchema = new mongoose.Schema({
  id: String,
  subject: String,
  marks: Number,
  name: String,
  description: String,
  cognitiveProcess: String,
  rubrics: Array
}, { strict: false });

const systemSettingsSchema = new mongoose.Schema({
  cognitiveProcesses: Array,
  knowledgeLevels: Array,
  itemFormats: Array
}, { strict: false });

const sharedBlueprintSchema = new mongoose.Schema({
  id: String,
  blueprintId: String,
  ownerId: String,
  sharedWithUserId: String,
  sharedAt: String,
  canEdit: Boolean
}, { strict: false });

module.exports = {
  User: mongoose.model('User', userSchema),
  Curriculum: mongoose.model('Curriculum', curriculumSchema),
  ExamConfig: mongoose.model('ExamConfig', examConfigSchema),
  Blueprint: mongoose.model('Blueprint', blueprintSchema),
  PaperType: mongoose.model('PaperType', paperTypeSchema),
  Discourse: mongoose.model('Discourse', discourseSchema),
  SystemSettings: mongoose.model('SystemSettings', systemSettingsSchema),
  SharedBlueprint: mongoose.model('SharedBlueprint', sharedBlueprintSchema)
};
