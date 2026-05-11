const Comment = require('../models/commentModel');

exports.fetchCommentsByLeadId = (req, res) => {
  const { leadid } = req.params;

  Comment.fetchCommentsByLeadId(leadid, (err, results) => {
    if (err) {
      console.error('Error fetching comments:', err);
      return res.status(500).json({ message: 'Failed to fetch comments.' });
    }

    res.status(200).json(results);
  });
};

exports.addComment = (req, res) => {
  const {name, leadid, timestamp, text } = req.body;

  if (!leadid || !timestamp || !text) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const commentData = [name, leadid, timestamp, text];

  Comment.addComment(commentData, (err, result) => {
    if (err) {
      console.error('Error adding comment:', err);
      return res.status(500).json({ message: 'Failed to add comment.' });
    }

    res.status(201).json({
      id: result.insertId,
      name,
      leadid,
      timestamp,
      text,
    });
  });
};
