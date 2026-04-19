const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const resetAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({
            username: String,
            password: String
        }, { strict: false }));

        const hashedPassword = await bcrypt.hash('admin', 10);
        const result = await User.findOneAndUpdate(
            { username: 'admin' },
            { password: hashedPassword },
            { upsert: true, new: true }
        );
        console.log('Admin password reset to "admin"');
        console.log('User:', result.username, 'Password hash:', result.password);
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

resetAdmin();
