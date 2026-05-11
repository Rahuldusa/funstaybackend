const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const router = express.Router();
const db = require('../config/db');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Multer Configuration (Ensure file is saved with correct format)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Extract the original file extension
        const ext = path.extname(file.originalname);
        const filename = `${file.fieldname}-${Date.now()}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({ storage });



const fetchAndStoreEmailsForAllUsers = async () => {
    return new Promise((resolve, reject) => {
        db.query('SELECT DISTINCT receiver_email FROM emails WHERE type = "sent"', (err, receivers) => {
            if (err) return reject(err);

            const knownReceivers = new Set(receivers.map(r => r.receiver_email.toLowerCase().trim()));

            db.query('SELECT * FROM email_credentials', async (err, credentials) => {
                if (err) return reject(err);
                if (!credentials.length) return resolve('No email credentials found');

                for (const cred of credentials) {
                    const isTitan = cred.sender_email.endsWith("@iiiqai.com");
          
                    const imapConfig = isTitan
                      ? {
                          user: cred.sender_email,
                          password: cred.app_password,
                          host: "imap.titan.email",
                          port: 993,
                          tls: true,
                          tlsOptions: { rejectUnauthorized: false },
                          authTimeout: 30000,
                          autotls: "never",
                          connTimeout: 30000,
                        }
                      : {
                          user: cred.sender_email,
                          password: cred.app_password,
                          host: "imap.gmail.com",
                          port: 993,
                          tls: true,
                          tlsOptions: { rejectUnauthorized: false },
                          authTimeout: 30000,
                          autotls: "never",
                          connTimeout: 30000,
                        };
          
                    await fetchAndStoreEmailsForUser(imapConfig, knownReceivers);
                  }
          
                resolve('All email accounts processed');
            });
        });
    });
};

const fetchAndStoreEmailsForUser = (imapConfig, knownReceivers) => {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);

        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err) => {
                if (err) return reject(err);

                const today = new Date();
                const searchDate = today.toISOString().split('T')[0];

                imap.search([['SINCE', searchDate]], (err, uids) => {
                    if (err || !uids.length) {
                        imap.end();
                        return resolve('No new emails');
                    }

                    const fetch = imap.fetch(uids, { bodies: '' });
                    let processedCount = 0;

                    fetch.on('message', (msg) => {
                        let emailData = {};

                        msg.on('body', (stream) => {
                            simpleParser(stream, (err, parsed) => {
                                if (err) return console.error('Parse error:', err);

                                const sender = parsed.from?.value?.[0]?.address;
                                if (!sender || !knownReceivers.has(sender.toLowerCase().trim())) {
                                    processedCount++;
                                    if (processedCount === uids.length) imap.end();
                                    return;
                                }

                                let cleanText = parsed.text || parsed.html?.replace(/<[^>]+>/g, '') || '[No text content]';

                                emailData = {
                                    message_id: parsed.messageId,
                                    receiver_email: sender,
                                    subject: parsed.subject || '(No subject)',
                                    text: cleanText.trim(),
                                    type: 'received'
                                };

                                db.query('SELECT COUNT(*) AS count FROM emails WHERE message_id = ?', [emailData.message_id], (err, result) => {
                                    if (err) return console.error('DB check error:', err);

                                    if (result[0].count === 0) {
                                        // First look for the leadid from previous sent emails
                                        db.query(
                                            `SELECT leadid FROM emails 
                                             WHERE receiver_email = ? 
                                             AND type = 'sent' 
                                             ORDER BY created_at DESC 
                                             LIMIT 1`,
                                            [emailData.receiver_email],
                                            (err, sentEmails) => {
                                                if (err) {
                                                    console.error('Error finding lead ID:', err);
                                                    processedCount++;
                                                    if (processedCount === uids.length) imap.end();
                                                    return;
                                                }

                                                if (sentEmails.length > 0) {
                                                    const leadId = sentEmails[0].leadid;
                                                    emailData.leadid = leadId;

                                                    // Get assignedSalesId and managerid
                                                    db.query('SELECT assignedSalesId, managerid FROM addleads WHERE leadid = ?', [leadId], (err, leadDetails) => {
                                                        if (err) {
                                                            console.error('Error fetching lead details:', err);
                                                            processedCount++;
                                                            if (processedCount === uids.length) imap.end();
                                                            return;
                                                        }

                                                        // Fallback if lead is not found
                                                        const recipients = [{ adminid: 'admin' }];
                                                        if (leadDetails.length > 0) {
                                                            const { assignedSalesId, managerid } = leadDetails[0];
                                                            if (assignedSalesId) recipients.push({ employeeId: assignedSalesId });
                                                            if (managerid) recipients.push({ managerid });
                                                        }

                                                        // Insert email into emails table
                                                        db.query('INSERT INTO emails SET ?', emailData, (err) => {
                                                            if (err) console.error('Store error:', err);
                                                            else console.log('Stored email from:', emailData.receiver_email);

                                                            // Insert notifications for all recipients
                                                            let inserted = 0;
                                                            recipients.forEach((recipient) => {
                                                                const notification = {
                                                                    leadid: leadId,
                                                                    email: emailData.receiver_email,
                                                                    subject: emailData.subject,
                                                                    text: emailData.text,
                                                                    created_at: new Date(),
                                                                    ...recipient
                                                                };

                                                                db.query('INSERT INTO email_notifications SET ?', notification, (err) => {
                                                                    if (err) console.error('Notification insert error:', err);
                                                                    else console.log('Notification stored for lead:', leadId);

                                                                    inserted++;
                                                                    if (inserted === recipients.length) {
                                                                        processedCount++;
                                                                        if (processedCount === uids.length) imap.end();
                                                                    }
                                                                });
                                                            });
                                                        });
                                                    });
                                                } else {
                                                    // No related sent email, insert without lead ID
                                                    db.query('INSERT INTO emails SET ?', emailData, (err) => {
                                                        if (err) console.error('Store error:', err);
                                                        else console.log('Stored email from:', emailData.receiver_email);
                                                        processedCount++;
                                                        if (processedCount === uids.length) imap.end();
                                                    });
                                                }
                                            }
                                        );
                                    } else {
                                        processedCount++;
                                        if (processedCount === uids.length) imap.end();
                                    }
                                });
                            });
                        });
                    });

                    fetch.once('end', () => {
                        if (processedCount === uids.length) imap.end();
                        resolve('Done fetching emails');
                    });

                    fetch.once('error', reject);
                });
            });
        });

        imap.once('error', (err) => {
            console.error(`IMAP error for ${imapConfig.user}:`, err.message);
            resolve(); // Don't break loop
        });

        imap.connect();
    });
};

// Run periodically
setInterval(() => {
    console.log('Checking for new emails...');
    fetchAndStoreEmailsForAllUsers().catch((err) => console.error('Error in email fetching:', err));
}, 100000); // every 5 minutes

// POST route to upload file, send email, and store in DB
router.post("/upload-quotation", upload.single("file"), async (req, res) => {
    const { email, leadid } = req.body;
    const file = req.file;

    if (!file || !email || !leadid) {
        return res.status(400).json({ error: "Missing file, email, or leadid." });
    }

    const filePath = `/uploads/${file.filename}`;
    console.log("File stored at:", filePath);

    try {
        // ✅ Fetch latest quotation_id from emails table
        const newQuotationId = await new Promise((resolve, reject) => {
            const fetchQuotationQuery = `
                SELECT quotation_id 
                FROM emails 
                WHERE quotation_id IS NOT NULL 
                ORDER BY id DESC 
                LIMIT 1
            `;

            db.query(fetchQuotationQuery, (err, result) => {
                if (err) {
                    console.error("❌ Database Error (Fetching Quotation ID):", err);
                    return reject("Database error.");
                }

                let nextQuotationId = "Qu001"; // Default if no valid quotation_id exists

                if (result.length > 0 && result[0].quotation_id) {
                    const lastQuotationId = result[0].quotation_id;
                    const match = lastQuotationId.match(/Qu00(\d+)/); // Extract number

                    if (match) {
                        let lastNumber = parseInt(match[1], 10); // Convert extracted number to integer
                        nextQuotationId = `Qu00${lastNumber + 1}`; // Increment for new ID
                    }
                }

                resolve(nextQuotationId);
            });
        });


        console.log("✅ Generated Quotation ID:", newQuotationId);
        
        // ✅ Nodemailer Configuration
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "iiiqbetsvarnaaz@gmail.com",
                pass: "rbdy vard mzit ybse",
            },
            tls: { rejectUnauthorized: false },
        });

        let mailOptions = {
            from: "iiiqbetsvarnaaz@gmail.com",
            to: email,
            subject: `Quotation #${newQuotationId}`,
            text: "Please find the attached quotation.",
            attachments: [{ filename: file.originalname, path: path.join(uploadDir, file.filename) }],
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully with attachment:", filePath);

        // ✅ Store Email Details in MySQL
        const insertQuery = `
    INSERT INTO emails (leadid, receiver_email, subject, \`text\`, file_path, type, email_sent, quotation_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

        const values = [leadid, email, mailOptions.subject, mailOptions.text, filePath, "sent", 1, newQuotationId];

        db.query(insertQuery, values, (err, result) => {
            if (err) {
                console.error("❌ Database Error (Inserting Email Record):", err);
                return res.status(500).json({ error: "Database insert error." });
            }

            console.log("✅ Email Record Saved with Quotation ID:", newQuotationId);

            // ✅ Update `quotation_id` in `travel_opportunity`
            const updateQuery = `
        UPDATE travel_opportunity 
        SET quotation_id = ? 
        WHERE leadid = ?
    `;

            db.query(updateQuery, [newQuotationId, leadid], (err, result) => {
                if (err) {
                    console.error("❌ Database Error (Updating Travel Opportunity):", err);
                    return res.status(500).json({ error: "Database update error." });
                }

                if (result.affectedRows > 0) {
                    console.log("✅ Quotation ID Updated in Travel Opportunity for LeadID:", leadid);
                } else {
                    console.log("⚠️ No Matching LeadID Found in Travel Opportunity.");
                }

                res.json({ message: "Quotation uploaded, email sent, and data updated successfully!" });
            });
        });
    } catch (error) {
        console.error("❌ Email Sending Error:", error);
        res.status(500).json({ error: "Error sending email." });
    }
}
);


// Get Email History by Email
router.get("/email-history", (req, res) => {
    const { leadid } = req.query;
    if (!leadid) {
        return res.status(400).json({ error: "Lead ID is required." });
    }

    const sql = "SELECT * FROM emails WHERE leadid = ? ORDER BY id DESC";
    db.query(sql, [leadid], (err, results) => {
        if (err) {
            console.error("Error fetching email history:", err);
            return res.status(500).json({ error: "Database error." });
        }
        res.json(results);
    });
});


  
// Update email status using leadid
router.post("/update-email-status", (req, res) => {
    const { leadid } = req.body;
    if (!leadid) {
        return res.status(400).json({ success: false, message: "Lead ID is required" });
    }

    db.query("UPDATE travel_opportunity SET email_sent = 1 WHERE leadid = ?", [leadid], (error, results) => {
        if (error) {
            console.error("Database error:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
        res.status(200).json({ success: true, message: "Email status updated successfully" });
    });
});

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "iiiqbetsvarnaaz@gmail.com",
        pass: "rbdy vard mzit ybse",// Use App Password
    },
    tls: { rejectUnauthorized: false },
});





router.get("/latest-quotation", async (req, res) => {
    try {
        db.query(
            `SELECT quotation_id FROM emails WHERE quotation_id IS NOT NULL ORDER BY id DESC LIMIT 1`,
            (err, results) => {
                if (err) {
                    console.error("Database Error:", err);
                    return res.status(500).json({ error: "Database fetch error." });
                }

                let newQuotationId = "Qu001"; // Default if no valid quotation_id exists

                if (results.length > 0 && results[0].quotation_id) {
                    const lastQuotationId = results[0].quotation_id;
                    const lastNumber = parseInt(lastQuotationId.replace("Qu00", ""), 10);
                    newQuotationId = `Qu00${lastNumber + 1}`;
                }

                res.json({ quotation_id: newQuotationId });
            }
        );
    } catch (error) {
        console.error("Error fetching latest quotation:", error);
        res.status(500).json({ error: "Failed to fetch latest quotation." });
    }
});







// router.post("/send-bulk-emails", upload.single("file"), async (req, res) => {
//     const {
//       leadid,
//       subject,
//       text,
//       type,
//       is_plain_text,
//       sender_email,
//     } = req.body;
//     console.log("REQ BODY:", req.body);
  
//     const receiver_emails = JSON.parse(req.body.receiver_emails || "[]");
//     const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  
//     if (!leadid || receiver_emails.length === 0 || (!text && !file_path) || !type || !sender_email) {
//       return res.status(400).json({ error: "Missing required fields." });
//     }
  
//     try {
//       const [credentials] = await new Promise((resolve, reject) => {
//         db.query(
//           `SELECT sender_email, app_password FROM email_credentials WHERE sender_email = ? LIMIT 1`,
//           [sender_email],
//           (err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//           }
//         );
//       });
  
//       if (!credentials) {
//         return res.status(403).json({ error: "Invalid sender email or credentials not found." });
//       }
  
//       let transporter = credentials.sender_email.endsWith("@iiiqai.com")
//         ? nodemailer.createTransport({
//             host: "smtp.titan.email",
//             port: 465,
//             secure: true,
//             auth: { user: credentials.sender_email, pass: credentials.app_password },
//             tls: { rejectUnauthorized: false },
//           })
//         : nodemailer.createTransport({
//             service: "gmail",
//             auth: { user: credentials.sender_email, pass: credentials.app_password },
//             tls: { rejectUnauthorized: false },
//           });
  
//       const results = [];
  
//       for (const receiver_email of receiver_emails) {
//         const mailOptions = {
//           from: credentials.sender_email,
//           to: receiver_email,
//           subject: subject,
//           ...(is_plain_text === "true" ? { text: text } : { html: text }),
//           attachments: file_path ? [{ path: path.join(uploadDir, req.file.filename) }] : [],
//         };
  
//         try {
//           const info = await transporter.sendMail(mailOptions);
//           console.log(`Email sent to ${receiver_email}: ${info.messageId}`);
  
//           // Insert into DB
//           await new Promise((resolve, reject) => {
//             db.query(
//               `INSERT INTO emails (leadid, receiver_email, subject, text, file_path, type, email_sent, message_id, sender_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//               [leadid, receiver_email, subject, text || "", file_path, type, 1, info.messageId, sender_email],
//               (err, result) => (err ? reject(err) : resolve(result))
//             );
//           });
  
//           results.push({ email: receiver_email, success: true });
//         } catch (err) {
//           console.error(`Failed to send email to ${receiver_email}`, err);
//           results.push({ email: receiver_email, success: false, error: err.message });
//         }
//       }
  
//       res.json({ message: "Bulk email sending complete", results });
//     } catch (error) {
//       console.error("Bulk Send Error:", error);
//       res.status(500).json({ error: "Server error", details: error.message });
//     }
//   });
  
router.post("/send-bulk-emails", upload.single("file"), async (req, res) => {
    const {
      leadid,
      subject,
      text,
      type,
      is_plain_text,
      sender_email,
      cc_emails, // Receive CC emails
      bcc_emails, // Receive BCC emails
    } = req.body;

    console.log("REQ BODY:", req.body);

    const receiver_emails = JSON.parse(req.body.receiver_emails || "[]");
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    const ccEmails = JSON.parse(cc_emails || "[]");  // Parse CC emails
    const bccEmails = JSON.parse(bcc_emails || "[]");  // Parse BCC emails

    if (!leadid || receiver_emails.length === 0 || (!text && !file_path) || !type || !sender_email) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    try {
      const [credentials] = await new Promise((resolve, reject) => {
        db.query(
          `SELECT sender_email, app_password FROM email_credentials WHERE sender_email = ? LIMIT 1`,
          [sender_email],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      if (!credentials) {
        return res.status(403).json({ error: "Invalid sender email or credentials not found." });
      }

      let transporter = credentials.sender_email.endsWith("@iiiqai.com")
        ? nodemailer.createTransport({
            host: "smtp.titan.email",
            port: 465,
            secure: true,
            auth: { user: credentials.sender_email, pass: credentials.app_password },
            tls: { rejectUnauthorized: false },
          })
        : nodemailer.createTransport({
            service: "gmail",
            auth: { user: credentials.sender_email, pass: credentials.app_password },
            tls: { rejectUnauthorized: false },
          });

      const results = [];

      for (const receiver_email of receiver_emails) {
        const mailOptions = {
          from: credentials.sender_email,
          to: receiver_email,
          cc: ccEmails.join(", "),  // Include CC emails
          bcc: bccEmails.join(", "),  // Include BCC emails
          subject: subject,
          ...(is_plain_text === "true" ? { text: text } : { html: text }),
          attachments: file_path ? [{ path: path.join(uploadDir, req.file.filename) }] : [],
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          console.log(`Email sent to ${receiver_email}: ${info.messageId}`);

          // Insert into DB
          await new Promise((resolve, reject) => {
            db.query(
              `INSERT INTO emails (leadid, receiver_email, subject, text, file_path, type, email_sent, message_id, sender_email, cc_emails, bcc_emails) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [leadid, receiver_email, subject, text || "", file_path, type, 1, info.messageId, sender_email, JSON.stringify(ccEmails), JSON.stringify(bccEmails)],
              (err, result) => (err ? reject(err) : resolve(result))
            );
          });

          results.push({ email: receiver_email, success: true });
        } catch (err) {
          console.error(`Failed to send email to ${receiver_email}`, err);
          results.push({ email: receiver_email, success: false, error: err.message });
        }
      }

      res.json({ message: "Bulk email sending complete", results });
    } catch (error) {
      console.error("Bulk Send Error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
});

  router.post('/credentials', (req, res) => {
    const { sender_email, app_password } = req.body;
  
    // Insert the data into the MySQL database
    const query = 'INSERT INTO email_credentials (sender_email, app_password) VALUES (?, ?)';
    db.query(query, [sender_email, app_password], (err, result) => {
      if (err) {
        console.error('Error inserting data into database: ', err);
        return res.status(500).json({ message: 'Failed to insert credentials' });
      }
      console.log('Data inserted successfully: ', result);
      res.status(200).json({ message: 'Credential saved successfully!' });
    });
  });



  router.get('/get-credentials', (req, res) => {
    const query = 'SELECT * FROM email_credentials';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching credentials:', err);
        return res.status(500).json({ message: 'Failed to fetch credentials' });
      }
      res.status(200).json(results);
    });
  });
  
  // ✅ READ ONE - Get a specific credential by ID
  router.get('/getcredentials/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM email_credentials WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error fetching credential:', err);
        return res.status(500).json({ message: 'Failed to fetch credential' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Credential not found' });
      }
      res.status(200).json(results[0]);
    });
  });
  
  // ✅ UPDATE - Edit credential
  router.put('/getcredentials/:id', (req, res) => {
    const { id } = req.params;
    const { sender_email, app_password } = req.body;
  
    const query = 'UPDATE email_credentials SET sender_email = ?, app_password = ? WHERE id = ?';
    db.query(query, [sender_email, app_password, id], (err, result) => {
      if (err) {
        console.error('Error updating credential:', err);
        return res.status(500).json({ message: 'Failed to update credential' });
      }
      res.status(200).json({ message: 'Credential updated successfully!' });
    });
  });
  
  // ✅ DELETE - Remove credential
  router.delete('/delete-credentials/:id', (req, res) => {
    const { id } = req.params;
  
    const query = 'DELETE FROM email_credentials WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('Error deleting credential:', err);
        return res.status(500).json({ message: 'Failed to delete credential' });
      }
      res.status(200).json({ message: 'Credential deleted successfully!' });
    });
  });



module.exports = router;
