require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const DPR = require('../models/DPR');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');

const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Operations'];
const designations = ['Recruiter', 'Senior Recruiter', 'HR Executive', 'Team Lead', 'Associate'];
const jobRoles = ['Software Engineer', 'Product Manager', 'Data Analyst', 'UX Designer', 'DevOps Engineer', 'QA Engineer', 'Business Analyst', 'Project Manager'];

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for seeding');
};

const clearData = async () => {
  await Promise.all([
    User.deleteMany({}),
    Candidate.deleteMany({}),
    Assignment.deleteMany({}),
    Attendance.deleteMany({}),
    DPR.deleteMany({}),
    Settings.deleteMany({}),
    Notification.deleteMany({}),
    Activity.deleteMany({}),
  ]);
};

const seed = async () => {
  try {
    await connectDB();
    await clearData();

    const admin = await User.create({
      fullName: 'System Administrator',
      employeeId: 'ADM001',
      email: 'admin@dprsystem.com',
      password: 'admin123',
      department: 'Administration',
      designation: 'System Admin',
      mobileNumber: '9876543210',
      role: 'admin',
      status: 'active',
    });

    const employees = [];
    for (let i = 1; i <= 10; i++) {
      const emp = await User.create({
        fullName: `Employee ${i}`,
        employeeId: `EMP${String(i).padStart(3, '0')}`,
        email: `employee${i}@dprsystem.com`,
        password: 'employee123',
        department: departments[i % departments.length],
        designation: designations[i % designations.length],
        mobileNumber: `98765432${String(i).padStart(2, '0')}`,
        role: 'employee',
        status: i <= 8 ? 'active' : 'pending',
        lastLogin: i <= 5 ? new Date() : undefined,
      });
      employees.push(emp);
    }

    const candidates = [];
    for (let i = 1; i <= 20; i++) {
      const candidate = await Candidate.create({
        name: `Candidate ${i}`,
        jobRole: jobRoles[i % jobRoles.length],
        status: i % 5 === 0 ? 'placed' : 'active',
        remarks: `Candidate profile for position ${i}`,
        createdBy: admin._id,
      });
      candidates.push(candidate);
    }

    const assignments = [];
    for (let i = 0; i < employees.length; i++) {
      const empCandidates = candidates.slice(i * 2, i * 2 + 3);
      for (const candidate of empCandidates) {
        if (candidate) {
          const assignment = await Assignment.create({
            candidate: candidate._id,
            employee: employees[i]._id,
            assignedBy: admin._id,
          });
          assignments.push(assignment);
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      for (let j = 0; j < 6; j++) {
        const checkHour = 8 + Math.floor(Math.random() * 3);
        const checkMin = Math.floor(Math.random() * 60);
        await Attendance.create({
          employee: employees[j]._id,
          date,
          checkInTime: `${String(checkHour).padStart(2, '0')}:${String(checkMin).padStart(2, '0')}`,
          status: checkHour > 9 ? 'late' : 'present',
          remarks: '',
          ipAddress: '127.0.0.1',
          device: 'Desktop',
          browser: 'Chrome',
        });
      }
    }

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      for (const assignment of assignments.slice(0, 15)) {
        await DPR.create({
          employee: assignment.employee,
          candidate: assignment.candidate,
          date,
          longApp: Math.floor(Math.random() * 5),
          shortApp: Math.floor(Math.random() * 3),
          availability: Math.floor(Math.random() * 2),
          screening: Math.floor(Math.random() * 2),
          assessment: Math.floor(Math.random() * 2),
          remarks: 'Daily progress update',
        });
      }
    }

    await Settings.create({
      companyName: 'DPR Management System',
      officeIP: '',
      workStartTime: '07:00',
      workEndTime: '16:30',
      lateMinutes: 10,
      theme: 'light',
    });

    await Notification.create({
      user: admin._id,
      title: 'Welcome to DPR System',
      message: 'System has been seeded successfully with sample data.',
      type: 'success',
    });

    await Activity.create({
      user: admin._id,
      action: 'SEED_DATA',
      details: 'Database seeded with sample data',
      ipAddress: '127.0.0.1',
    });

    console.log('Seed completed successfully!');
    console.log('Admin: admin@dprsystem.com / admin123');
    console.log('Employee: employee1@dprsystem.com / employee123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
