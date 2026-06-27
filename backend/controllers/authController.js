const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const {
      fullName,
      fatherName,
      cnicNumber,
      gender,
      dateOfBirth,
      email,
      phoneNumber,
      password,
      city,
      bio,
      relationshipPreferences
    } = req.body;

    // Defensive input check
    if (!email || !password || !fullName || !fatherName || !cnicNumber || !gender || !dateOfBirth || !phoneNumber || !city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { cnicNumber }]
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this Email or CNIC number already exists'
      });
    }

    // Set profile picture path if uploaded
    let profilePicture = '/uploads/default-avatar.svg';
    if (req.file) {
      profilePicture = `/uploads/${req.file.filename}`;
    }

    // Handle relationshipPreferences parsing if sent as JSON string
    let parsedPreferences = { interestedIn: 'All', minAge: 18, maxAge: 100 };
    if (relationshipPreferences) {
      try {
        parsedPreferences = typeof relationshipPreferences === 'string' 
          ? JSON.parse(relationshipPreferences) 
          : relationshipPreferences;
      } catch (e) {
        console.error('Error parsing relationshipPreferences:', e);
      }
    }

    // Create User
    const user = await User.create({
      fullName,
      fatherName,
      cnicNumber,
      gender,
      dateOfBirth: new Date(dateOfBirth),
      profilePicture,
      email: email.toLowerCase(),
      phoneNumber,
      password,
      city,
      bio: bio || '',
      relationshipPreferences: parsedPreferences
    });

    if (user) {
      // Fetch the saved user excluding sensitive fields for a clean full response
      const savedUser = await User.findById(user._id).select('-password -cnicNumber');
      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: savedUser
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data provided' });
    }
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, usernameOrEmail, password } = req.body;
    const loginIdentifier = usernameOrEmail || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/name and password' });
    }

    // Find User by email or case-insensitive full name
    const isEmail = loginIdentifier.includes('@');
    const query = isEmail
      ? { email: loginIdentifier.toLowerCase() }
      : { fullName: { $regex: new RegExp(`^${loginIdentifier.trim()}$`, 'i') } };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email/name or password' });
    }

    // Check Password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Set online status
    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    // Return full user object (minus password and CNIC) so the frontend has all fields
    const fullUser = await User.findById(user._id).select('-password -cnicNumber');
    res.json({
      success: true,
      token: generateToken(user._id),
      user: fullUser
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // req.user is populated by protect middleware
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Log user out (sets offline)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.isOnline = false;
      user.lastActive = new Date();
      await user.save();
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

module.exports = {
  signup,
  login,
  getMe,
  logout
};
