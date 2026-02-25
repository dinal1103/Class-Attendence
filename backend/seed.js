require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./src/config');
const Tenant = require('./src/models/Tenant');
const Department = require('./src/models/Department');
const User = require('./src/models/User');

async function seed() {
    await mongoose.connect(config.db.uri);
    console.log('Connected to DB');

    // Clear existing
    await Tenant.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    // 1. Create Tenant
    const tenant = await Tenant.create({
        name: 'Demo University',
        code: 'DEMO'
    });
    console.log('Created Tenant:', tenant.code);

    // 2. Create Department
    const dept = await Department.create({
        tenant_id: tenant._id,
        name: 'Computer Science',
        code: 'CS'
    });
    console.log('Created Dept:', dept.code);

    // 3. Create Users
    const student = await User.create({
        tenant_id: tenant._id,
        department_id: dept._id,
        name: 'Student One',
        email: 'student@demo.edu',
        password: 'password123',
        role: 'student',
        enrollmentId: 'CS001'
    });

    const faculty = await User.create({
        tenant_id: tenant._id,
        department_id: dept._id,
        name: 'Faculty One',
        email: 'faculty@demo.edu',
        password: 'password123',
        role: 'faculty'
    });

    const admin = await User.create({
        tenant_id: tenant._id,
        department_id: dept._id,
        name: 'Admin One',
        email: 'admin@demo.edu',
        password: 'password123',
        role: 'admin'
    });

    console.log('Created users: student@demo.edu, faculty@demo.edu, admin@demo.edu (pw: password123)');
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
