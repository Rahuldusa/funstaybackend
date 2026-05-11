const express = require('express');
const router = express.Router();
const db = require('../config/db');

// router.put('archiveByLeadId/:leadid', async (req, res) => {
//     try {
//         const { leadid } = req.params;
//         await LeadModel.findOneAndUpdate({ leadid }, { archived: true });
//         res.status(200).json({ message: "Lead archived successfully" });
//     } catch (error) {
//         res.status(500).json({ message: "Error archiving lead" });
//     }
// });

router.get('/getArchivedLeads', async (req, res) => {
    try {
        const query = 'SELECT * FROM addleads WHERE archive = "archived"'; // Fetch only archived leads
        db.query(query, (err, results) => {
            if (err) {
                res.status(500).json({ message: "Error fetching archived leads." });
            } else {
                res.status(200).json(results);
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Unexpected error occurred." });
    }
});


router.put('/opportunity/archive/:leadid', async (req, res) => {
    try {
        const { leadid } = req.params;
        const query = 'UPDATE addleads SET archive = "archived" WHERE leadid = ?'; // Change status to archived

        db.query(query, [leadid], (err, result) => {
            if (err) {
                res.status(500).json({ message: "Error archiving opportunity." });
            } else if (result.affectedRows === 0) {
                res.status(404).json({ message: "Opportunity not found." });
            } else {
                res.status(200).json({ message: "Opportunity archived successfully." });
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Unexpected error occurred." });
    }
});

router.put('/restoreByLeadId/:leadid', async (req, res) => {
    try {
        const { leadid } = req.params;
        const query = 'UPDATE addleads SET archive = NULL WHERE leadid = ?'; // Set archive to NULL when restoring

        db.query(query, [leadid], (err, result) => {
            if (err) {
                console.error("Error restoring lead:", err);
                res.status(500).json({ message: "Error restoring lead." });
            } else if (result.affectedRows === 0) {
                res.status(404).json({ message: "Lead not found." });
            } else {
                res.status(200).json({ message: "Lead restored successfully." });
            }
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ message: "Unexpected error occurred." });
    }
});






module.exports = router; 
