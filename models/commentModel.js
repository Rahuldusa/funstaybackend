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

  addNotification: (data, callback) => {
    // Note: the column name `read` is a reserved word in many SQL dialects.
    // Enclose it in backticks (`) if necessary.
    const query = `
      INSERT INTO notifications (employeeId, managerid, leadid, email, message, createdAt, \`read\`)
      VALUES (?, ?, ?, ?, ?, NOW(), 0)
    `;
    db.query(query, data, callback);
  },
};

module.exports = Comment;
