const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Route to fetch data from addleads and travel_opportunity tables
router.get("/fetch-data", (req, res) => {
    const query = `
    SELECT a.*, t.destination AS travel_destination,t.quotation_id, t.created_at AS travel_created_at, t.origincity AS travel_origincity, t.start_date, t.end_date, t.duration, t.adults_count, t.children_count, t.child_ages, t.approx_budget, t.description AS travel_description,t.email_sent
    FROM addleads a 
    LEFT JOIN travel_opportunity t 
    ON a.leadid = t.leadid
     WHERE a.archive IS NULL
    ORDER BY t.leadid DESC`; // Ordering by travel_created_at in descending order

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching data: ", err);
            return res.status(500).json({ error: "Database query failed" });
        }
        // Check if results are empty
        if (results.length === 0) {
            return res.status(404).json({ message: "No data found" });
        }
        res.json(results);
    });
});

router.get("/fetch-data-notadmin", (req, res) => {
  const query = `
    SELECT a.leadid, a.name, a.email, a.phone_number, a.sources,
        a.opportunity_status1, a.opportunity_status2,a.primarySource, a.secondarysource,
        a.assignedSalesId, a.assignedSalesName,
        a.assign_to_manager, a.managerid,
        a.adminAssign, a.managerAssign, a.archive,
        t.destination AS travel_destination
    FROM addleads a
    LEFT JOIN travel_opportunity t ON a.leadid = t.leadid
    WHERE 
      a.archive IS NULL
      AND (a.adminAssign <> 'admin' OR a.adminAssign IS NULL OR a.adminAssign = '')
      AND a.status = 'opportunity'
    ORDER BY t.leadid DESC;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data: ", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});


router.get("/fetch-data-admin", (req, res) => {
  const query = `
    SELECT a.leadid, a.name, a.email, a.phone_number, a.sources,
        a.opportunity_status1, a.opportunity_status2,a.primarySource, a.secondarysource,
        a.assignedSalesId, a.assignedSalesName,
        a.assign_to_manager, a.managerid,
        a.adminAssign, a.managerAssign, a.archive,
        t.destination AS travel_destination
    FROM addleads a
    LEFT JOIN travel_opportunity t ON a.leadid = t.leadid
    WHERE 
      a.archive IS NULL
      AND a.adminAssign = 'admin'
      AND a.status = 'opportunity'
    ORDER BY t.leadid DESC;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data: ", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});


router.get("/fetch-data-notmanager", (req, res) => {
  const userId = req.query.userId;

const query = `
  SELECT 
   a.leadid, a.name, a.email, a.phone_number, a.sources,
        a.opportunity_status1, a.opportunity_status2,a.primarySource, a.secondarysource,
        a.assignedSalesId, a.assignedSalesName,
        a.assign_to_manager, a.managerid,
        a.adminAssign, a.managerAssign, a.archive,
        t.destination AS travel_destination
  FROM addleads a
  LEFT JOIN travel_opportunity t 
    ON a.leadid = t.leadid
  WHERE 
    a.archive IS NULL
    AND a.managerid = ?
    AND a.status = 'opportunity'
  ORDER BY t.leadid DESC
`;


  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

router.get("/fetch-data-yesmanager", (req, res) => {
  const userId = req.query.userId;

  const query = `
    SELECT a.leadid, a.name, a.email, a.phone_number, a.sources,
        a.opportunity_status1, a.opportunity_status2,a.primarySource, a.secondarysource,
        a.assignedSalesId, a.assignedSalesName,
        a.assign_to_manager, a.managerid,
        a.adminAssign, a.managerAssign, a.archive,
        t.destination AS travel_destination
    FROM addleads a
    LEFT JOIN travel_opportunity t ON a.leadid = t.leadid
    WHERE 
      a.archive IS NULL
      AND a.status = 'opportunity'
      AND a.managerid = ?
      AND a.managerAssign = ?
    ORDER BY t.leadid DESC;
  `;

  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

router.get("/fetch-data-salesman", (req, res) => {
  const userId = req.query.userId;

  const query = `
    SELECT a.leadid, a.name, a.email, a.phone_number, a.sources,
        a.opportunity_status1, a.opportunity_status2,a.primarySource, a.secondarysource,
        a.assignedSalesId, a.assignedSalesName,
        a.assign_to_manager, a.managerid,
        a.adminAssign, a.managerAssign, a.archive,
        t.destination AS travel_destination
    FROM addleads a
    LEFT JOIN travel_opportunity t ON a.leadid = t.leadid
    WHERE 
      a.archive IS NULL
      AND a.status = 'opportunity'
      AND a.assignedSalesId = ?
    ORDER BY t.leadid DESC;
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching data: ", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

router.get("/most-fetch-data", (req, res) => {
    const query = `
    SELECT 
        a.*, 
        t.destination AS travel_destination,
        t.quotation_id, 
        t.created_at AS travel_created_at, 
        t.origincity AS travel_origincity, 
        t.start_date, 
        t.end_date, 
        t.duration, 
        t.adults_count, 
        t.children_count, 
        t.child_ages, 
        t.approx_budget, 
        t.description AS travel_description,
        t.email_sent,
        -- Fetching the most recent updated_at for each leadid from different tables
        GREATEST(
            IFNULL(MAX(a.updated_at), '1970-01-01'),
            IFNULL(MAX(t.updated_at), '1970-01-01'),
            IFNULL(MAX(p.updatedAt), '1970-01-01'),
            IFNULL(MAX(r.updated_at), '1970-01-01')
        ) AS most_recent_updated_at
    FROM addleads a 
    LEFT JOIN travel_opportunity t 
        ON a.leadid = t.leadid
    LEFT JOIN payment_log p 
        ON a.leadid = p.leadid
    LEFT JOIN receivables r 
        ON a.leadid = r.leadid
    WHERE a.archive IS NULL
    AND a.status = 'opportunity'
    GROUP BY a.leadid
    ORDER BY t.leadid DESC`;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching data: ", err);
            return res.status(500).json({ error: "Database query failed" });
        }
        // Check if results are empty
        if (results.length === 0) {
            return res.status(404).json({ message: "No data found" });
        }
        res.json(results);
    });
});





router.put("/update-lead-customer/:leadid", (req, res) => {
    console.log("Request Body:", req.body);
    const leadid = req.params.leadid;

    const {
        lead_type, name, country_code, another_country_code, phone_number, email, sources, description, 
        another_name, another_email, another_phone_number, origincity, destination, 
        corporate_id, primaryStatus, secondaryStatus, primarySource, secondarysource
    } = req.body;

    // Step 1: Update the addleads table
    const updateLeadQuery = `
      UPDATE addleads 
      SET lead_type = ?, name = ?, country_code = ?, another_country_code = ?, phone_number = ?, email = ?, sources = ?, 
          description = ?, another_name = ?, another_email = ?, another_phone_number = ?, 
          origincity = ?, destination = ?, corporate_id = ?, primaryStatus = ?, 
          secondaryStatus = ?, primarySource = ?, secondarysource = ?
      WHERE leadid = ?`;

    db.query(updateLeadQuery, [
        lead_type, name, country_code, another_country_code, phone_number, email, sources, description, 
        another_name, another_email, another_phone_number, origincity, destination, corporate_id, 
        primaryStatus, secondaryStatus, primarySource, secondarysource, leadid
    ], (err, result) => {
        if (err) {
            console.error("Error updating addleads: ", err);
            return res.status(500).json({ error: "Failed to update addleads" });
        }

        // Step 2: Get the customer ID from the addleads table
        const getCustomerIdQuery = `SELECT customerid FROM addleads WHERE leadid = ?`;

        db.query(getCustomerIdQuery, [leadid], (err, leadResults) => {
            if (err) {
                console.error("Error fetching customer ID: ", err);
                return res.status(500).json({ error: "Failed to fetch customer ID" });
            }

            if (leadResults.length === 0) {
                return res.status(404).json({ error: "No lead found with the given leadid" });
            }

            const customerid = leadResults[0].customerid;

            if (customerid) {
                // Step 3: Update only the origincity in customers table
                const updateCustomerCityQuery = `UPDATE customers SET origincity = ? WHERE id = ?`;

                db.query(updateCustomerCityQuery, [origincity, customerid], (err, customerUpdateResult) => {
                    if (err) {
                        console.error("Error updating customer origincity: ", err);
                        return res.status(500).json({ error: "Failed to update customer origincity" });
                    }
                    console.log("Customer origincity updated successfully.");

                    // Step 4: Check if the customer is 'new' and update other details
                    const checkCustomerQuery = `SELECT customer_status FROM customers WHERE id = ?`;

                    db.query(checkCustomerQuery, [customerid], (err, customerResults) => {
                        if (err) {
                            console.error("Error fetching customer status: ", err);
                            return res.status(500).json({ error: "Failed to fetch customer data" });
                        }

                        if (customerResults.length > 0 && customerResults[0].customer_status === "new") {
                            const updateCustomerQuery = `
                              UPDATE customers 
                              SET name = ?, country_code = ?, phone_number = ?, email = ?
                              WHERE id = ?`;

                            db.query(updateCustomerQuery, [name, country_code, phone_number, email, customerid], (err, customerUpdateResult) => {
                                if (err) {
                                    console.error("Error updating customers: ", err);
                                    return res.status(500).json({ error: "Failed to update customers" });
                                }
                                return res.json({ message: "Lead and Customer updated successfully" });
                            });
                        } else {
                            return res.json({ message: "Lead updated successfully, customer city updated if necessary" });
                        }
                    });
                });
            } else {
                return res.json({ message: "Lead updated successfully, no customer update needed" });
            }
        });
    });
});

router.get("/sales-leadid/leads/:leadid/:userId", async (req, res) => {
    const { leadid, userId } = req.params;

    try {
        const query = "SELECT leadid FROM addleads WHERE leadid = ? AND assignedSalesId = ?";
        db.query(query, [leadid, userId], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }

            if (results.length > 0) {
                return res.json({ message: "Exists" });
            } else {
                return res.status(404).json({ error: "Data not found" });
            }
        });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/manager-leadid/leads/:leadid/:userId", async (req, res) => {
    const { leadid, userId } = req.params;

    try {
        const query = "SELECT leadid FROM addleads WHERE leadid = ? AND managerid = ?";
        db.query(query, [leadid, userId], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }

            if (results.length > 0) {
                return res.json({ message: "Exists" });
            } else {
                return res.status(404).json({ error: "Data not found" });
            }
        });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/sales-customers/:customerid/:userId", async (req, res) => {
    const { customerid, userId } = req.params;

    try {
        const query = "SELECT customerid FROM addleads WHERE customerid = ? AND assignedSalesId = ?";
        db.query(query, [customerid, userId], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }

            if (results.length > 0) {
                return res.json({ message: "Exists" });
            } else {
                return res.status(404).json({ error: "Customer not found" });
            }
        });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/manager-customers/:customerid/:userId", async (req, res) => {
    const { customerid, userId } = req.params;

    try {
        const query = "SELECT customerid FROM addleads WHERE customerid = ? AND managerid = ?";
        db.query(query, [customerid, userId], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }

            if (results.length > 0) {
                return res.json({ message: "Exists" });
            } else {
                return res.status(404).json({ error: "Customer not found" });
            }
        });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Server error" });
    }
});


module.exports = router;
