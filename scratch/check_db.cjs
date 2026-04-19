const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const checkDb = async () => {
    if (!MONGO_URI) {
        console.error('MONGO_URI not found');
        process.exit(1);
    }
    console.log('Connecting to:', MONGO_URI);
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Blueprint = mongoose.model('Blueprint', new mongoose.Schema({}, { strict: false }));
        const Curriculum = mongoose.model('Curriculum', new mongoose.Schema({}, { strict: false }));
        const PaperType = mongoose.model('PaperType', new mongoose.Schema({}, { strict: false }));
        const Discourse = mongoose.model('Discourse', new mongoose.Schema({}, { strict: false }));

        const userCount = await User.countDocuments();
        const blueprintCount = await Blueprint.countDocuments();
        const curriculumCount = await Curriculum.countDocuments();
        const paperTypeCount = await PaperType.countDocuments();
        const discourseCount = await Discourse.countDocuments();

        console.log('--- Counts ---');
        console.log('Users:', userCount);
        console.log('Blueprints:', blueprintCount);
        console.log('Curriculums:', curriculumCount);
        console.log('PaperTypes:', paperTypeCount);
        console.log('Discourses:', discourseCount);

        if (paperTypeCount > 0) {
            const pts = await PaperType.find({});
            console.log('Paper Types:', JSON.stringify(pts, null, 2));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

checkDb();
