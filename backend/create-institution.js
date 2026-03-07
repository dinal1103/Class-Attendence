require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./src/config');
const Tenant = require('./src/models/Tenant');
const Department = require('./src/models/Department');
const User = require('./src/models/User');

async function createInstitution() {
    await mongoose.connect(config.db.uri);
    console.log('[Setup] Connected to DB');

    // 1. Create the College (Tenant)
    const college = await Tenant.create({
        name: 'My Smart College',
        code: 'MSC2026'
    });
    console.log(`✅ Institution Created! Code: ${college.code}`);

    // 2. Create the First Department
    const dept = await Department.create({
        tenant_id: college._id,
        name: 'Computer Engineering',
        code: 'CE'
    });
    console.log(`✅ Department Created! ID: ${dept._id}`);

    // 3. Create the IT Admin Account
    const admin = await User.create({
        tenant_id: college._id,
        department_id: dept._id,
        name: 'System Admin',
        email: 'admin@ldce.ac.in',
        password: 'SecurePassword123!',
        role: 'admin'
    });
    console.log(`✅ Admin Account Created! Email: ${admin.email}`);

    process.exit(0);
}

createInstitution().catch(err => {
    console.error(err);
    process.exit(1);
});
