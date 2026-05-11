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


// IMAP Configuration for Receiving Emails
const imapConfig = {
    user: 'uppalahemanth4@gmail.com', // Replace with your admin email
    password: 'oimoftsgtwradkux', // Replace with your app password
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 30000, 
};

// Function to Fetch and Store Today's Emails for Recognized Receiver Emails
const fetchAndStoreEmails = async () => {
    return new Promise((resolve, reject) => {
        // Step 1: Get the distinct receiver emails from the database
        const receiverQuery = 'SELECT DISTINCT receiver_email FROM emails';
        db.query(receiverQuery, (err, receivers) => {
            if (err) {
                console.error('Database error fetching receivers:', err);
                return reject(err);
            }

            // Convert receiver emails into a Set for faster lookup
            const receiverSet = new Set(receivers.map(row => row.receiver_email));

            const imap = new Imap(imapConfig);

            imap.once('ready', () => {
                imap.openBox('INBOX', false, (err, box) => {
                    if (err) {
                        console.error('Error opening inbox:', err);
                        imap.end();
                        return reject(err);
                    }

                    // Get today's date in IMAP format (DD-MMM-YYYY)
                    const today = new Date();
                    const formattedDate = today.toLocaleString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    }).replace(',', '');

                    console.log(`Fetching emails for today: ${formattedDate}`);

                    // Search for today's emails
                    imap.search([['ON', formattedDate]], (err, results) => {
                        if (err) {
                            console.error('IMAP search error:', err);
                            imap.end();
                            return reject(err);
                        }

                        if (!results.length) {
                            console.log('No new emails found for today.');
                            imap.end();
                            return resolve('No new emails.');
                        }

                        const f = imap.fetch(results, { bodies: '' });

                        f.on('message', (msg) => {
                            msg.on('body', (stream) => {
                                simpleParser(stream)
                                    .then((parsed) => {
                                        const { from, subject, text, messageId } = parsed;
                                        const senderEmail = from.value[0].address; // The email of the sender

                                        // Step 2: Check if sender exists in receiverSet
                                        if (!receiverSet.has(senderEmail)) {
                                            console.log(`Ignored email from unrecognized sender: ${senderEmail}`);
                                            return;
                                        }

                                        // Step 3: Check if email already exists in the database
                                        const checkQuery = 'SELECT COUNT(*) AS count FROM emails WHERE message_id = ?';
                                        db.query(checkQuery, [messageId], (err, result) => {
                                            if (err) {
                                                console.error('Database error checking for duplicate email:', err);
                                                return;
                                            }

                                            if (result[0].count === 0) {
                                                // Step 4: Store email in MySQL with type 'received'
                                                const insertQuery =
                                                    'INSERT INTO emails (message_id, receiver_email, subject, text, type) VALUES (?, ?, ?, ?, ?)';
                                                db.query(
                                                    insertQuery,
                                                    [messageId, senderEmail, subject, text, 'received'], // Include message_id
                                                    (err) => {
                                                        if (err) console.error('Failed to store email:', err);
                                                        else console.log(`Email from ${senderEmail} stored successfully.`);
                                                    }
                                                );
                                            } else {
                                                console.log('Duplicate email ignored:', messageId);
                                            }
                                        });
                                    })
                                    .catch((err) => console.error('Error parsing email:', err));
                            });
                        });

                        f.once('error', (ex) => {
                            console.error('Fetch error:', ex);
                            reject(ex);
                        });

                        f.once('end', () => {
                            console.log('Finished fetching today’s emails.');
                            imap.end();
                        });
                    });
                });
            });

            imap.once('error', (err) => {
                console.error('IMAP error:', err);
                reject(err);
            });

            imap.connect();
        });
    });
};

// Automatically Fetch Emails Every 5 Minutes
setInterval(() => {
    console.log('Checking for new emails...');
    fetchAndStoreEmails().catch((err) => console.error('Error in automatic email fetching:', err));
}, 100000); // 5 minutes



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
        
                let nextQuotationId = "quoo1"; // Default if no valid quotation_id exists
        
                if (result.length > 0 && result[0].quotation_id) {
                    const lastQuotationId = result[0].quotation_id;
                    const match = lastQuotationId.match(/quoo(\d+)/); // Extract number
        
                    if (match) {
                        let lastNumber = parseInt(match[1], 10); // Convert extracted number to integer
                        nextQuotationId = `quoo${lastNumber + 1}`; // Increment for new ID
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
                user: "uppalahemanth4@gmail.com",
                pass: "oimoftsgtwradkux",
            },
            tls: { rejectUnauthorized: false },
        });

        let mailOptions = {
            from: "uppalahemanth4@gmail.com",
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
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    const sql = "SELECT * FROM emails WHERE receiver_email = ? ORDER BY id DESC";
    db.query(sql, [email, email], (err, results) => {
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







router.post("/post-from-email", upload.single("file"), async (req, res) => {
    const { leadid, receiver_email, subject, text, type } = req.body;
    let file_path = req.file ? path.join(__dirname, "uploads", req.file.filename) : null; // Correct absolute path

    if (!leadid || !receiver_email || !subject || !text || !type) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        // ✅ Step 1: Fetch Latest `quotation_id`
        db.query(
            "SELECT quotation_id FROM emails ORDER BY id DESC LIMIT 1",
            async (err, results) => {
                if (err) {
                    console.error("❌ Database Error (Fetching Quotation ID):", err);
                    return res.status(500).json({ error: "Database fetch error." });
                }

                let newQuotationId = "quoo1"; // Default if no quotation exists
                if (results.length > 0 && results[0].quotation_id) {
                    const lastQuotationId = results[0].quotation_id;
                    const lastNumber = parseInt(lastQuotationId.replace("quoo", ""), 10);
                    newQuotationId = `quoo${lastNumber + 1}`;
                }

                console.log("✅ Generated Quotation ID:", newQuotationId);

                // ✅ Step 2: Nodemailer Configuration
                let transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "uppalahemanth4@gmail.com", // Your Gmail
                        pass: "oimoftsgtwradkux", // Use App Password
                    },
                    tls: {
                        rejectUnauthorized: false // Ignore self-signed certificate errors
                    }
                });

                // ✅ Step 3: Send Email with Attachment
                let mailOptions = {
                    from: "uppalahemanth4@gmail.com",
                    to: receiver_email,
                    subject: subject,
                    text: text,
                    attachments: file_path ? [{ path: file_path }] : [], // Attach file if available
                };

                await transporter.sendMail(mailOptions);
                console.log("✅ Email sent successfully!");

                // ✅ Step 4: Save Data in `emails` Table
                let relativeFilePath = req.file ? `/uploads/${req.file.filename}` : null;
                const sql = `
                    INSERT INTO emails (leadid, receiver_email, subject, text, file_path, type, email_sent, quotation_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const values = [
                    leadid, receiver_email, subject, text, relativeFilePath, type, 1, newQuotationId
                ];

                db.query(sql, values, (err, result) => {
                    if (err) {
                        console.error("❌ Database Error (Inserting Email Record):", err);
                        return res.status(500).json({ error: "Database insert error." });
                    }

                    console.log("✅ Email Record Saved with Quotation ID:", newQuotationId);

                    // ✅ Step 5: Update `quotation_id` in `travel_opportunity`
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

                        res.json({ message: "Quotation email sent, stored in database, and updated successfully!", quotation_id: newQuotationId });
                    });
                });
            }
        );
    } catch (error) {
        console.error("❌ Error sending email:", error);
        res.status(500).json({ error: "Error sending email.", details: error.message });
    }
});







module.exports = router;
