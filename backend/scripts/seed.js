const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dummyUsers = [
  {
    fullName: 'John Doe',
    fatherName: 'Richard Doe',
    cnicNumber: '12345-6789012-3',
    gender: 'Male',
    dateOfBirth: new Date('1990-01-01'),
    email: 'john@example.com',
    phoneNumber: '03001234567',
    password: 'password123',
    city: 'Karachi',
    bio: 'Hi, I am John.',
    relationshipPreferences: {
      interestedIn: 'Female',
      minAge: 20,
      maxAge: 35
    }
  },
  {
    fullName: 'Jane Smith',
    fatherName: 'Robert Smith',
    cnicNumber: '12345-6789012-4',
    gender: 'Female',
    dateOfBirth: new Date('1992-05-15'),
    email: 'jane@example.com',
    phoneNumber: '03007654321',
    password: 'password123',
    city: 'Lahore',
    bio: 'Looking for a serious relationship.',
    relationshipPreferences: {
      interestedIn: 'Male',
      minAge: 25,
      maxAge: 40
    }
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding.');

    await User.deleteMany();
    console.log('Existing users cleared.');

    for (const userData of dummyUsers) {
      const user = new User(userData);
      await user.save();
    }
    console.log('Dummy users inserted successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
