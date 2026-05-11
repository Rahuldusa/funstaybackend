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
  const { name, leadid, timestamp, text, userId, managerId, email, notificationmessage } = req.body;
  console.log("Received request body:", req.body);

  if (!leadid || !timestamp || !text) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const commentData = [name, leadid, timestamp, text];

  // Insert the comment
  Comment.addComment(commentData, (err, result) => {
    if (err) {
      console.error('Error adding comment:', err);
      return res.status(500).json({ message: 'Failed to add comment.' });
    }

    // Send the response for the comment insertion
    res.status(201).json({
      id: result.insertId,
      name,
      leadid,
      timestamp,
      text,
    });

    const notificationMessage = notificationmessage;

    // Insert Row 1: userId only
    Comment.addNotification([userId, null, leadid, null, notificationMessage], (err1, result1) => {
      if (err1) {
        console.error('Error adding notification for userId:', err1);
      }
    });

    // Insert Row 2: email only
    Comment.addNotification([null, null, leadid, email, notificationMessage], (err2, result2) => {
      if (err2) {
        console.error('Error adding notification for email:', err2);
      }
    });

    // Insert Row 3: managerId only
    Comment.addNotification([null, managerId, leadid, null, notificationMessage], (err3, result3) => {
      if (err3) {
        console.error('Error adding notification for managerId:', err3);
      }
    });
  });
};

