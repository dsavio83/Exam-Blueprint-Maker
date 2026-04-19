const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const resetUsers = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({
            username: String,
            password: String
        }, { strict: false }));

        const adminHash = await bcrypt.hash('admin', 10);
        const userHash = await bcrypt.hash('user', 10);

        await User.findOneAndUpdate({ username: 'admin' }, { password: adminHash });
        await User.findOneAndUpdate({ username: 'user' }, { password: userHash });

        console.log('Credentials reset to admin/admin and user/user');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

resetUsers();
