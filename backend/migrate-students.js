require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('./src/config');
const Tenant = require('./src/models/Tenant');
const Department = require('./src/models/Department');
const User = require('./src/models/User');
const { encrypt } = require('./src/utils/crypto');

async function migrate() {
    console.log('[Migration] Connecting to DB...');
    await mongoose.connect(config.db.uri);
    console.log('[Migration] Connected');

    // 1. Ensure Tenant exists
    const tenant = await Tenant.findOneAndUpdate(
        { code: 'MSC2026' },
        { 
            name: 'My Smart College',
            code: 'MSC2026'
        },
        { upsert: true, new: true }
    );
    console.log(`[Migration] Tenant: ${tenant.name} (${tenant._id})`);

    // 2. Ensure Department exists
    const dept = await Department.findOneAndUpdate(
        { tenant_id: tenant._id, code: 'CE' },
        {
            tenant_id: tenant._id,
            name: 'Computer Engineering',
            code: 'CE'
        },
        { upsert: true, new: true }
    );
    console.log(`[Migration] Department: ${dept.name} (${dept._id})`);

    // 3. Load Data
    // Fixed path for container and local run consistency
    const dataPath = fs.existsSync(path.join(__dirname, 'scratch/data_dump.json')) 
        ? path.join(__dirname, 'scratch/data_dump.json')
        : path.join(__dirname, '../scratch/data_dump.json');
        
    if (!fs.existsSync(dataPath)) {
        console.error(`[Error] Data file not found. Checked: 
            - ${path.join(__dirname, 'scratch/data_dump.json')}
            - ${path.join(__dirname, '../scratch/data_dump.json')}`);
        process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const students = data.Student || [];
    const embeddings = data.embeddings || {};

    console.log(`[Migration] Found ${students.length} students in SQLite data`);

    let successCount = 0;

    for (const student of students) {
        const enrollmentId = student.enrollment_number;
        const name = student.name;
        const email = `${enrollmentId}@ldce.ac.in`;
        const password = 'Student@123';

        // Find embedding
        const embeddingData = embeddings[enrollmentId];
        let encryptedEmbedding = null;
        if (embeddingData && embeddingData.embedding) {
            encryptedEmbedding = encrypt(embeddingData.embedding);
        } else {
            console.warn(`[Warning] No embedding found for student ${name} (${enrollmentId})`);
        }

        try {
            // Find existing user or create a new one
            let user = await User.findOne({ tenant_id: tenant._id, enrollmentId: enrollmentId });
            
            if (!user) {
                user = new User({
                    tenant_id: tenant._id,
                    department_id: dept._id,
                    enrollmentId: enrollmentId,
                    role: 'student'
                });
            }

            // Update fields
            user.name = name;
            user.email = email;
            user.password = password; // pre-save hook will hash this
            user.embedding = encryptedEmbedding;
            user.isEnrolled = !!encryptedEmbedding;
            user.isActive = true;

            await user.save();
            successCount++;
        } catch (err) {
            console.error(`[Error] Failed to migrate student ${name}:`, err.message);
        }
    }

    console.log(`\n[Migration] Completed!`);
    console.log(`[Migration] Successfully migrated/updated: ${successCount}`);
    console.log(`[Migration] Failed: ${students.length - successCount}`);

    process.exit(0);
}

migrate().catch(err => {
    console.error('[Migration] Fatal Error:', err);
    process.exit(1);
});
