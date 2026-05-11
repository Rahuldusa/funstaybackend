const cron = require("node-cron");
const nodemailer = require("nodemailer");
const mysql = require("mysql2/promise");
const axios = require("axios");

// Database Connection
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "funstay",
};

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "manitejavadnala@gmail.com",
    pass: "fppo lbmw edaf macr",
  },
});

// Base API URL for fetching lead data
const baseURL = "http://localhost:5000"; 

// Function to fetch Sales Executives and their leads data
const fetchSalesExecutivesAndLeads = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Get all sales executives (employees with role 'employee')
    const [salesExecutives] = await connection.execute(
      "SELECT id, email FROM employees WHERE role = 'employee'"
    );

    let salesReports = [];

    // Loop through each Sales Executive to fetch their lead data
    for (const salesExecutive of salesExecutives) {
      const userId = salesExecutive.id;

      // API Endpoints for fetching lead data
      const endpoints = [
        `${baseURL}/lead/today/${userId}`,
        `${baseURL}/lead/confirmed/${userId}`,
        `${baseURL}/lead/in-progress/${userId}`,
        `${baseURL}/lead/yesterday/${userId}`,
        `${baseURL}/lead/confirmed/yesterday/${userId}`,
        `${baseURL}/lead/in-progress/yesterday/${userId}`,
        `${baseURL}/lead/facebook/${userId}`,
        `${baseURL}/lead/referral/${userId}`,
        `${baseURL}/lead/campaign/${userId}`,
        `${baseURL}/lead/google/${userId}`,
        `${baseURL}/lead/others/${userId}`,
      ];

      const responses = await Promise.all(
        endpoints.map(url => axios.get(url).catch(() => ({ data: { count: 0 } }))) // Handle API failures gracefully
      );

      // Create report object
      const report = {
        salesExecutiveEmail: salesExecutive.email,
        leadsToday: responses[0].data.count,
        confirmedToday: responses[1].data.count,
        inProgressToday: responses[2].data.count,
        leadsYesterday: responses[3].data.count,
        confirmedYesterday: responses[4].data.count,
        inProgressYesterday: responses[5].data.count,
        facebookCount: responses[6].data.count,
        referralCount: responses[7].data.count,
        campaignCount: responses[8].data.count,
        googleCount: responses[9].data.count,
        othersCount: responses[10].data.count,
      };

      salesReports.push(report);
    }

    await connection.end();
    return salesReports;
  } catch (error) {
    console.error("Error fetching sales executives' reports:", error);
    return [];
  }
};

// Function to send Sales Executive Reports via email
const sendSalesExecutiveReports = async () => {
  const reports = await fetchSalesExecutivesAndLeads();
  if (!reports.length) return;

  for (const report of reports) {
    const emailBody = `
        <h1> Testing Emails</h1>
      <h2>Sales Executive Lead Report</h2>
      <p><strong>Leads Today:</strong> ${report.leadsToday}</p>
      <p><strong>Confirmed Today:</strong> ${report.confirmedToday}</p>
      <p><strong>In Progress Today:</strong> ${report.inProgressToday}</p>
      <p><strong>Leads Yesterday:</strong> ${report.leadsYesterday}</p>
      <p><strong>Confirmed Yesterday:</strong> ${report.confirmedYesterday}</p>
      <p><strong>In Progress Yesterday:</strong> ${report.inProgressYesterday}</p>
      <h3>Leads by Source:</h3>
      <p><strong>Facebook:</strong> ${report.facebookCount}</p>
      <p><strong>Referral:</strong> ${report.referralCount}</p>
      <p><strong>Campaign:</strong> ${report.campaignCount}</p>
      <p><strong>Google:</strong> ${report.googleCount}</p>
      <p><strong>Others:</strong> ${report.othersCount}</p>
    `;

    const mailOptions = {
      from: "manitejavadnala@gmail.com",
      to: report.salesExecutiveEmail, // Send to individual Sales Executive
      subject: "Daily Lead Report for Sales Executives",
      html: emailBody,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(`Error sending email to ${report.salesExecutiveEmail}:`, err);
      } else {
        console.log(`Email sent to ${report.salesExecutiveEmail}:`, info.response);
      }
    });
  }
};

// Schedule cron job to run at 9:30 AM and 9:30 PM daily
cron.schedule("11 19 * * *", () => {
  console.log("Running daily sales executive report...");
  sendSalesExecutiveReports();
});

console.log("Cron job scheduled: Daily sales executive report at 9:30 AM and 9:30 PM.");
