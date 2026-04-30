const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function run() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('Connected!');

        const blueprints = await mongoose.connection.db.collection('blueprints').find({ ownerId: '1' }).toArray();
        const users = [
            { id: 'zxkphd55e', name: 'Dominic Savio J' },
            { id: '92ofgdpou', name: 'Vijaya Kumar' },
            { id: 'au2rcz0an', name: 'Vijila Rani' }
        ];

        for (let i = 0; i < Math.min(blueprints.length, users.length); i++) {
            const bp = blueprints[i];
            const user = users[i];
            console.log(`Updating blueprint ${bp.id} to owner ${user.id} (${user.name})`);
            await mongoose.connection.db.collection('blueprints').updateOne(
                { _id: bp._id },
                { $set: { ownerId: user.id } }
            );
        }

        await mongoose.disconnect();
        console.log('Done!');
    } catch (err) {
        console.error(err);
    }
}

run();
