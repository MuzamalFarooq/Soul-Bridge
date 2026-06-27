const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All user routes are JWT protected
router.use(protect);

// Standard social actions
router.get('/', getMembers);
router.get('/profile/:id', getProfile);
router.put(
  '/profile',
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
  ]),
  updateProfile
);
router.get('/suggestions', getMatchSuggestions);

// Photo gallery
router.post('/photos', upload.single('photo'), uploadPhoto);
router.delete('/photos/:photoId', deletePhoto);

// Friend requests / mutual matches
router.post('/friend-request/send/:id', sendFriendRequest);
router.post('/friend-request/accept/:id', acceptFriendRequest);
router.post('/friend-request/reject/:id', rejectFriendRequest);

// Moderation / Security
router.post('/block/:id', blockUser);
router.post('/report/:id', reportUser);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsRead);

// Administrator panel
router.get('/admin/dashboard', adminOnly, getAdminDashboardData);
router.delete('/admin/user/:id', adminOnly, deleteUser);

module.exports = router;
