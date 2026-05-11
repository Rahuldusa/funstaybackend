const db = require("../config/db");
const nodemailer = require("nodemailer");
const Imap = require("imap");
const { simpleParser } = require("mailparser");

// exports.uploadQuotation = (req, res) => {
//   const { leadid, email, name } = req.body;
//   const file = req.file;

//   if (!file) {
//     return res.status(400).json({ error: "No file uploaded!" });
//   }

//   const filePath = `/uploads/${file.filename}`;

//   // Insert into quotations table
//   const insertSql =
//     "INSERT INTO quotations (leadid, quotation_file, email, name) VALUES (?, ?, ?, ?)";
//   db.query(insertSql, [leadid, filePath, email, name], (err, result) => {
//     if (err) {
//       return res.status(500).json({ error: "Database error", details: err });
//     }

//     const quotationId = result.insertId; // Get inserted quotation ID

//     const updateSql = "UPDATE travel_opportunity SET quotation_id = ? WHERE leadid = ?";
//     db.query(updateSql, [quotationId, leadid], (updateErr, updateResult) => {
//       if (updateErr) {
//         console.error("Failed to update travel_opportunity:", updateErr);
//         return res.status(500).json({ error: "Failed to update travel_opportunity", details: updateErr });
//       }
//       console.log("Update Result:", updateResult);


//       const fetchSql = "SELECT quotation_id FROM travel_opportunity WHERE leadid = ?";
//       db.query(fetchSql, [leadid], (fetchErr, fetchResult) => {
//         if (fetchErr) {
//           console.error("Failed to fetch updated travel_opportunity:", fetchErr);
//           return res.status(500).json({ error: "Failed to fetch updated travel_opportunity", details: fetchErr });
//         }

//         console.log("Fetch Result:", fetchResult);

//         const updatedQuotationId = fetchResult.length > 0 ? fetchResult[0].quotation_id : null;

//         res.json({
//           message: "Quotation uploaded, email sent, and travel_opportunity updated!",
//           file: filePath,
//           quotationId: updatedQuotationId, // Ensure this is included
//         });
        
//       // Send Email with Attachment
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: "iiiqbetsvarnaaz@gmail.com",
//           pass: "rbdy vard mzit ybse",
//         },
//       });

//       const mailOptions = {
//         from: "iiiqbetsvarnaaz@gmail.com",
//         to: email,
//         subject: "New Quotation Attached",
//         text: "Please find the attached quotation.",
//         attachments: [{ filename: file.filename, path: `./uploads/${file.filename}` }],
//       };

//       transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//           return res.status(500).json({ error: "Email sending failed", details: error });
//         }

//         res.json({
//           message: "Quotation uploaded, email sent, and travel_opportunity updated!",
//           file: filePath,
//           quotationId: updatedQuotationId, // Ensure this is returned
//         });
//       });
//     });
//   });
// });
// };


exports.uploadQuotation = (req, res) => {
  const { leadid, email, name } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded!" });
  }

  const filePath = `/uploads/${file.filename}`;

  // Insert into quotations table
  const insertSql =
    "INSERT INTO quotations (leadid, quotation_file, email, name) VALUES (?, ?, ?, ?)";
  db.query(insertSql, [leadid, filePath, email, name], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err });
    }

    const quotationId = result.insertId; // Get inserted quotation ID

    const updateSql = "UPDATE travel_opportunity SET quotation_id = ? WHERE leadid = ?";
    db.query(updateSql, [quotationId, leadid], (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Failed to update travel_opportunity:", updateErr);
        return res.status(500).json({ error: "Failed to update travel_opportunity", details: updateErr });
      }

      const fetchSql = "SELECT quotation_id FROM travel_opportunity WHERE leadid = ?";
      db.query(fetchSql, [leadid], (fetchErr, fetchResult) => {
        if (fetchErr) {
          console.error("Failed to fetch updated travel_opportunity:", fetchErr);
          return res.status(500).json({ error: "Failed to fetch updated travel_opportunity", details: fetchErr });
        }

        const updatedQuotationId = fetchResult.length > 0 ? fetchResult[0].quotation_id : null;

    
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: "iiiqbetsvarnaaz@gmail.com",
              pass: "rbdy vard mzit ybse", // Use App Password, NOT Gmail password
            },
            tls: {
              rejectUnauthorized: false, // **Fix self-signed certificate issue**
            },
          });

        const mailOptions = {
          from: "iiiqbetsvarnaaz@gmail.com",
          to: email,
          subject: "New Quotation Attached",
          text: "Please find the attached quotation.",
          attachments: [{ filename: file.filename, path: `./uploads/${file.filename}` }],
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Email sending failed:", error);
            return res.status(500).json({ error: "Email sending failed", details: error });
          }

          console.log("Email sent successfully:", info.response);

          // Send the final response only after email is sent
          res.json({
            message: "Quotation uploaded, email sent, and travel_opportunity updated!",
            file: filePath,
            quotationId: updatedQuotationId,
          });
        });
      });
    });
  });
};


exports.getEmailChatByLeadId = (req, res) => {
  const leadId = req.params.leadId;

  if (!leadId) {
    return res.status(400).json({ error: "Lead ID is required" });
  }

  const query = `
    SELECT ec.* 
    FROM quotations ec 
    WHERE ec.leadid = ? 
    ORDER BY ec.created_at DESC`;

  db.query(query, [leadId], async (err, results) => {
    if (err) {
      console.error("Error fetching email chat:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "No email chat found for this lead" });
    }

    // Extract the lead's email from the first result
    const leadEmail = results[0].email;
    console.log("Lead Email:", leadEmail);

    try {
      // Fetch email replies from Gmail
      const emailReplies = await fetchEmailReplies(leadEmail);

      // Example: Send a reply to the lead's email
      const replyMessage = "Thank you for your email. We will get back to you shortly.";
      await sendEmailReply(leadEmail, replyMessage);

      res.status(200).json({ quotations: results, emailReplies });
    } catch (emailError) {
      console.error("Error fetching email replies:", emailError);
      res.status(500).json({ error: "Failed to fetch email replies" });
    }
  });
};

// Fetch Email Replies from Gmail IMAP
const fetchEmailReplies = async (leadEmail) => {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: "iiiqbetsvarnaaz@gmail.com",
      password: "rbdy vard mzit ybse",
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    let emailThread = [];

    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err) => {
        if (err) {
          reject(`Error opening inbox: ${err}`);
          imap.end();
          return;
        }

        // Search for emails related to the lead's email
        imap.search(["ALL"], (err, results) => {
          if (err) {
            reject(`Error searching emails: ${err}`);
            imap.end();
            return;
          }

          if (!results || results.length === 0) {
            resolve([]);
            imap.end();
            return;
          }

          const f = imap.fetch(results, { bodies: "" });

          f.on("message", (msg) => {
            msg.on("body", (stream) => {
              simpleParser(stream)
                .then((parsed) => {
                  if (
                    parsed.from.text.includes(leadEmail) ||
                    parsed.to.text.includes(leadEmail)
                  ) {
                    emailThread.push({
                      from: parsed.from.text,
                      subject: parsed.subject,
                      date: parsed.date,
                      body: parsed.text,
                      replies: extractReplies(parsed.text),
                    });
                  }
                })
                .catch((err) => reject(`Error parsing email: ${err}`));
            });
          });

          f.once("end", () => {
            imap.end();
            resolve(emailThread);
          });
        });
      });
    });

    imap.once("error", (err) => reject(`IMAP error: ${err}`));
    imap.connect();
  });
};

// Extract Replies from Email Body
const extractReplies = (emailBody) => {
  let replies = [];
  let replySections = emailBody.split(/On .* wrote:/); // Split by reply markers

  if (replySections.length > 1) {
    for (let i = 1; i < replySections.length; i++) {
      replies.push(replySections[i].trim());
    }
  }

  return replies;
};


const sendEmailReply = async (leadEmail, replyMessage) => {
  // Create a transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "iiiqbetsvarnaaz@gmail.com", // Your Gmail address
      pass: "rbdy vard mzit ybse", // Your Gmail password or app-specific password
    },
  });

  // Email options
  let mailOptions = {
    from: '"Your Name" <iiiqbetsvarnaaz@gmail.com>', // Sender address
    to: leadEmail, // Recipient address (lead's email)
    subject: "Re: Your Subject Here", // Subject line (you can customize this)
    text: replyMessage, // Plain text body
    // html: "<b>Your HTML content here</b>", // Optional HTML body
  };

  try {
    // Send the email
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};


