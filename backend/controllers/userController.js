const User = require('../models/User');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Helper to calculate age from Date of Birth
const calculateAge = (dob) => {
  const diffMs = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// @desc    Get all members with filters (excluding current user and blocked accounts)
// @route   GET /api/users
// @access  Private
const getMembers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { gender, city, search, minAge, maxAge } = req.query;

    // Base query: exclude self and anyone on block list
    const excludedIds = [currentUserId, ...currentUser.blockedUsers];

    const query = {
      _id: { $nin: excludedIds },
      blockedUsers: { $ne: currentUserId } // Exclude users who have blocked the current user
    };

    // Apply Filters
    if (gender && gender !== 'All') {
      query.gender = gender;
    }
    if (city && city.trim() !== '') {
      query.city = { $regex: new RegExp(city.trim(), 'i') };
    }
    if (search && search.trim() !== '') {
      query.fullName = { $regex: new RegExp(search.trim(), 'i') };
    }

    let members = await User.find(query).select('-password -cnicNumber -fatherName').lean();

    // Age filtering (if requested)
    if (minAge || maxAge) {
      const min = parseInt(minAge) || 18;
      const max = parseInt(maxAge) || 100;
      members = members.filter((member) => {
        const age = calculateAge(member.dateOfBirth);
        return age >= min && age <= max;
      });
    }

    // Add virtual age field and match status flag
    const formattedMembers = members.map((member) => {
      // Find friendship relation status
      let relationStatus = 'none';
      const outgoingReq = currentUser.friendRequests.find(
        (req) => req.user.toString() === member._id.toString()
      );
      const incomingReq = member.friendRequests?.find(
        (req) => req.user.toString() === currentUserId.toString()
      );

      if (currentUser.friends.some((fId) => fId.toString() === member._id.toString())) {
        relationStatus = 'matched';
      } else if (outgoingReq && outgoingReq.status === 'pending') {
        relationStatus = 'incoming_request'; // This member requested current user
      } else if (incomingReq && incomingReq.status === 'pending') {
        relationStatus = 'outgoing_request'; // Current user requested this member
      }

      return {
        ...member,
        age: calculateAge(member.dateOfBirth),
        relationStatus
      };
    });

    res.json({ success: true, count: formattedMembers.length, members: formattedMembers });
  } catch (error) {
    console.error('GetMembers Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Get single user profile
// @route   GET /api/users/profile/:id
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -cnicNumber -fatherName')
      .populate('friends', 'fullName profilePicture city isOnline');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }

    // Prevent viewing if blocked
    const currentUser = await User.findById(req.user._id);
    if (
      currentUser.blockedUsers.includes(user._id) ||
      user.blockedUsers.includes(currentUser._id)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied: Profile is unavailable' });
    }

    // Check relationship state
    let relationStatus = 'none';
    const outgoingReq = currentUser.friendRequests.find(
      (r) => r.user.toString() === user._id.toString()
    );
    const incomingReq = user.friendRequests.find(
      (r) => r.user.toString() === currentUser._id.toString()
    );

    if (currentUser.friends.some((fId) => fId.toString() === user._id.toString())) {
      relationStatus = 'matched';
    } else if (outgoingReq && outgoingReq.status === 'pending') {
      relationStatus = 'incoming_request';
    } else if (incomingReq && incomingReq.status === 'pending') {
      relationStatus = 'outgoing_request';
    }

    const profileData = user.toObject();
    profileData.age = calculateAge(user.dateOfBirth);
    profileData.relationStatus = relationStatus;

    res.json({ success: true, user: profileData });
  } catch (error) {
    console.error('GetProfile Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      fullName,
      bio,
      city,
      phoneNumber,
      interestedIn,
      minAge,
      maxAge
    } = req.body;

    // Update basic fields
    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (city) user.city = city;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    // Update preferences
    if (interestedIn) user.relationshipPreferences.interestedIn = interestedIn;
    if (minAge) user.relationshipPreferences.minAge = parseInt(minAge);
    if (maxAge) user.relationshipPreferences.maxAge = parseInt(maxAge);

    // Profile picture and banner image upload
    if (req.file) {
      user.profilePicture = `/uploads/${req.file.filename}`;
    }
    if (req.files) {
      if (req.files['profilePicture'] && req.files['profilePicture'][0]) {
        user.profilePicture = `/uploads/${req.files['profilePicture'][0].filename}`;
      }
      if (req.files['bannerImage'] && req.files['bannerImage'][0]) {
        user.bannerImage = `/uploads/${req.files['bannerImage'][0].filename}`;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        gender: user.gender,
        profilePicture: user.profilePicture,
        bannerImage: user.bannerImage,
        city: user.city,
        bio: user.bio,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        relationshipPreferences: user.relationshipPreferences,
        isAdmin: user.isAdmin,
        photos: user.photos,
        friends: user.friends,
        friendRequests: user.friendRequests
      }
    });
  } catch (error) {
    console.error('UpdateProfile Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Get match suggestions based on user location and dating preferences
// @route   GET /api/users/suggestions
// @access  Private
const getMatchSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const prefs = currentUser.relationshipPreferences || {};
    const interestedIn = prefs.interestedIn || 'All';
    const minAge = prefs.minAge ?? 18;
    const maxAge = prefs.maxAge ?? 100;
    const excludedIds = [currentUser._id, ...currentUser.friends, ...currentUser.blockedUsers];

    const query = {
      _id: { $nin: excludedIds },
      blockedUsers: { $ne: currentUser._id }
    };

    // Filter by Gender preference
    if (interestedIn !== 'All') {
      query.gender = interestedIn;
    }

    // Initial fetch of prospects
    let prospects = await User.find(query).select('-password -cnicNumber -fatherName').lean();

    // Map ages and filter within preferred range
    const filteredProspects = prospects
      .map((p) => ({
        ...p,
        age: calculateAge(p.dateOfBirth)
      }))
      .filter((p) => p.age >= minAge && p.age <= maxAge);

    // Score suggestions: 
    // +3 points if in same city
    // +2 points if age matches closely
    const scoredSuggestions = filteredProspects.map((p) => {
      let score = 0;
      if (p.city && currentUser.city && p.city.toLowerCase() === currentUser.city.toLowerCase()) {
        score += 3;
      }
      
      const ageDiff = Math.abs(p.age - calculateAge(currentUser.dateOfBirth));
      if (ageDiff <= 5) {
        score += 2;
      } else if (ageDiff <= 10) {
        score += 1;
      }

      // Check if there's already a pending relationship req
      let relationStatus = 'none';
      const outgoingReq = currentUser.friendRequests.find(
        (r) => r.user.toString() === p._id.toString()
      );
      const incomingReq = p.friendRequests?.find(
        (r) => r.user.toString() === currentUser._id.toString()
      );

      if (outgoingReq && outgoingReq.status === 'pending') {
        relationStatus = 'incoming_request';
      } else if (incomingReq && incomingReq.status === 'pending') {
        relationStatus = 'outgoing_request';
      }

      return { ...p, score, relationStatus };
    });

    // Sort by descending score
    scoredSuggestions.sort((a, b) => b.score - a.score);

    res.json({ success: true, suggestions: scoredSuggestions.slice(0, 10) });
  } catch (error) {
    console.error('Suggestions Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Send Friend Request (Initiates interest)
// @route   POST /api/users/friend-request/send/:id
// @access  Private
const sendFriendRequest = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot send a friend request to yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    // Check if blocked
    if (targetUser.blockedUsers.includes(currentUserId) || currentUser.blockedUsers.includes(targetUserId)) {
      return res.status(403).json({ success: false, message: 'Action not allowed' });
    }

    // Check if already friends/matches
    if (currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: 'You are already matches' });
    }

    // Check if there is already an incoming request from them (if so, auto-accept)
    const existingIncoming = currentUser.friendRequests.find(
      (r) => r.user.toString() === targetUserId && r.status === 'pending'
    );

    if (existingIncoming) {
      return acceptFriendRequest(req, res); // Chain to accept immediately
    }

    // Check if already sent a pending request
    const existingOutgoing = targetUser.friendRequests.find(
      (r) => r.user.toString() === currentUserId.toString() && r.status === 'pending'
    );

    if (existingOutgoing) {
      return res.status(400).json({ success: false, message: 'Friend request already sent' });
    }

    // Register incoming friend request in the TARGET user's list
    targetUser.friendRequests.push({ user: currentUserId, status: 'pending' });
    await targetUser.save();

    // Create notification for target user
    await Notification.create({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'friend_request',
      content: `${currentUser.fullName} sent you a friend request!`
    });

    res.json({ success: true, message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('SendFriendRequest Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Accept Friend Request (Establishes "True Love" Match)
// @route   POST /api/users/friend-request/accept/:id
// @access  Private
const acceptFriendRequest = async (req, res) => {
  try {
    const senderUserId = req.params.id; // User who originally sent the request
    const currentUserId = req.user._id; // User accepting the request

    const currentUser = await User.findById(currentUserId);
    const senderUser = await User.findById(senderUserId);

    if (!senderUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify request exists
    const requestIndex = currentUser.friendRequests.findIndex(
      (r) => r.user.toString() === senderUserId && r.status === 'pending'
    );

    if (requestIndex === -1) {
      // Check if they are already friends (mutual match)
      if (currentUser.friends.includes(senderUserId)) {
        return res.json({ success: true, message: 'Already matched' });
      }
      return res.status(400).json({ success: false, message: 'No pending friend request from this user' });
    }

    // Update status to accepted
    currentUser.friendRequests[requestIndex].status = 'accepted';

    // Add to mutual friends list (Match completed!)
    currentUser.friends.push(senderUserId);
    if (!senderUser.friends.includes(currentUserId)) {
      senderUser.friends.push(currentUserId);
    }

    // Clean request from sender's incoming requests if they had one
    senderUser.friendRequests = senderUser.friendRequests.filter(
      (r) => r.user.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await senderUser.save();

    // Create match notifications
    await Notification.create({
      recipient: senderUserId,
      sender: currentUserId,
      type: 'match',
      content: `It's a Match! You and ${currentUser.fullName} are now matched. Start chatting!`
    });

    await Notification.create({
      recipient: currentUserId,
      sender: senderUserId,
      type: 'match',
      content: `It's a Match! You and ${senderUser.fullName} are now matched. Start chatting!`
    });

    // Automatically check or create chat conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, senderUserId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, senderUserId]
      });
    }

    res.json({ success: true, message: 'Match established successfully', conversationId: conversation._id });
  } catch (error) {
    console.error('AcceptFriendRequest Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Reject Friend Request
// @route   POST /api/users/friend-request/reject/:id
// @access  Private
const rejectFriendRequest = async (req, res) => {
  try {
    const senderUserId = req.params.id;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify request exists
    const requestIndex = currentUser.friendRequests.findIndex(
      (r) => r.user.toString() === senderUserId && r.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(400).json({ success: false, message: 'No pending request found' });
    }

    // Remove from request queue
    currentUser.friendRequests.splice(requestIndex, 1);
    await currentUser.save();

    res.json({ success: true, message: 'Friend request rejected' });
  } catch (error) {
    console.error('RejectFriendRequest Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Block a user
// @route   POST /api/users/block/:id
// @access  Private
const blockUser = async (req, res) => {
  try {
    const blockUserId = req.params.id;
    const currentUserId = req.user._id;

    if (blockUserId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(blockUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add to block list if not already present
    if (!currentUser.blockedUsers.includes(blockUserId)) {
      currentUser.blockedUsers.push(blockUserId);
    }

    // Break mutual friend connections if present
    currentUser.friends = currentUser.friends.filter((fId) => fId.toString() !== blockUserId);
    targetUser.friends = targetUser.friends.filter((fId) => fId.toString() !== currentUserId.toString());

    // Clean up friend requests
    currentUser.friendRequests = currentUser.friendRequests.filter(
      (r) => r.user.toString() !== blockUserId
    );
    targetUser.friendRequests = targetUser.friendRequests.filter(
      (r) => r.user.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await targetUser.save();

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    console.error('BlockUser Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Report a user
// @route   POST /api/users/report/:id
// @access  Private
const reportUser = async (req, res) => {
  try {
    const reportUserId = req.params.id;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a reason for reporting' });
    }

    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(reportUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Register report on target user
    targetUser.reportedUsers.push({
      user: currentUser._id,
      reason: reason.trim()
    });

    await targetUser.save();

    // Create system notification for administration tracking
    await Notification.create({
      recipient: targetUser._id, // Set recipient as target, but flag type as report
      sender: currentUser._id,
      type: 'report',
      content: `User reported: ${targetUser.fullName} was reported by ${currentUser.fullName} for: ${reason}`
    });

    // Auto block reported user as a safety preference
    if (!currentUser.blockedUsers.includes(reportUserId)) {
      currentUser.blockedUsers.push(reportUserId);
      currentUser.friends = currentUser.friends.filter((fId) => fId.toString() !== reportUserId);
      await currentUser.save();
    }

    res.json({ success: true, message: 'User reported successfully. They have been blocked for your safety.' });
  } catch (error) {
    console.error('ReportUser Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'fullName profilePicture')
      .sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Notifications Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/users/notifications/read
// @access  Private
const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('MarkNotificationsRead Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Get Admin Dashboard Stats & Reports
// @route   GET /api/users/admin/dashboard
// @access  Private/Admin
const getAdminDashboardData = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const reportsList = await User.find({ 'reportedUsers.0': { $exists: true } })
      .select('fullName email profilePicture reportedUsers city isOnline')
      .populate('reportedUsers.user', 'fullName email')
      .lean();

    const activeOnlineUsers = await User.countDocuments({ isOnline: true });
    
    // Total connections/matches counts
    const users = await User.find().select('friends').lean();
    let totalMatchesCombined = 0;
    users.forEach(u => {
      totalMatchesCombined += u.friends ? u.friends.length : 0;
    });
    const totalMutualMatches = Math.floor(totalMatchesCombined / 2);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeOnlineUsers,
        totalMutualMatches,
        totalReports: reportsList.reduce((acc, curr) => acc + curr.reportedUsers.length, 0)
      },
      reports: reportsList
    });
  } catch (error) {
    console.error('AdminDashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Delete User Account (Admin feature or self account cancellation)
// @route   DELETE /api/users/admin/user/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const userIdToDelete = req.params.id;

    // Check target user
    const targetUser = await User.findById(userIdToDelete);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clean relations: remove from other users' friends and request queues
    await User.updateMany(
      { friends: userIdToDelete },
      { $pull: { friends: userIdToDelete } }
    );

    await User.updateMany(
      { 'friendRequests.user': userIdToDelete },
      { $pull: { friendRequests: { user: userIdToDelete } } }
    );

    // Clear notifications and conversations relating to this user
    await Notification.deleteMany({
      $or: [{ recipient: userIdToDelete }, { sender: userIdToDelete }]
    });

    const userConversations = await Conversation.find({ participants: userIdToDelete });
    const convoIds = userConversations.map(c => c._id);

    await Message.deleteMany({ conversationId: { $in: convoIds } });
    await Conversation.deleteMany({ _id: { $in: convoIds } });

    // Finally delete the user profile
    await User.findByIdAndDelete(userIdToDelete);

    res.json({ success: true, message: 'User account and associated chat assets deleted successfully' });
  } catch (error) {
    console.error('DeleteUser Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Upload a photo to the user's gallery
// @route   POST /api/users/photos
// @access  Private
const uploadPhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    if (user.photos.length >= 12) {
      return res.status(400).json({ success: false, message: 'Maximum of 12 photos allowed. Delete one to upload more.' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    user.photos.push({ url: photoUrl });
    await user.save();

    res.json({ success: true, message: 'Photo uploaded successfully', photos: user.photos });
  } catch (error) {
    console.error('UploadPhoto Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Delete a photo from the user's gallery
// @route   DELETE /api/users/photos/:photoId
// @access  Private
const deletePhoto = async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const photo = user.photos.id(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    // Remove file from disk
    const filePath = path.join(__dirname, '..', photo.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    user.photos.pull({ _id: req.params.photoId });
    await user.save();

    res.json({ success: true, message: 'Photo deleted successfully', photos: user.photos });
  } catch (error) {
    console.error('DeletePhoto Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

module.exports = {
  getMembers,
  getProfile,
  updateProfile,
  getMatchSuggestions,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  blockUser,
  reportUser,
  getNotifications,
  markNotificationsRead,
  getAdminDashboardData,
  deleteUser,
  uploadPhoto,
  deletePhoto
};
