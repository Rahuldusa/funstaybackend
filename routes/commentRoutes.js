const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.get('/comments/:leadid', commentController.fetchCommentsByLeadId);
router.post('/comments/add', commentController.addComment);

module.exports = router;
