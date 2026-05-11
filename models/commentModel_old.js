const db = require('../config/db');

const Comment = {
  fetchCommentsByLeadId: (leadid, callback) => {
    const query = 'SELECT * FROM comments WHERE leadid = ? ORDER BY timestamp DESC';
    db.query(query, [leadid], callback);
  },

  addComment: (data, callback) => {
    const query = 'INSERT INTO comments (name, leadid, timestamp, text) VALUES (?, ?, ?, ?)';
    db.query(query, data, callback);
  },
};

module.exports = Comment;
