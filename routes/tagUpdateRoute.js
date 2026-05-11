// const express = require("express");
// const router = express.Router();
// const db = require("../config/db");

// // Update travel_opportunity table with selected tag and update tagged_date
// router.put("/travel_opportunity/:id", (req, res) => {
//     const { id } = req.params;
//     const { tag } = req.body;

//     if (!tag) {
//         return res.status(400).json({ error: "Tag is required" });
//     }

//     const sql = `
//         UPDATE travel_opportunity 
//         SET tag = ?, tagged_date = NOW() 
//         WHERE id = ?
//     `;

//     db.query(sql, [tag, id], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: "Database error", details: err.message });
//         }
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: "No record found with this ID" });
//         }
//         res.json({ message: "Tag and tagged_date updated successfully" });
//     });
// });


// module.exports = router;


const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Update customer table with tags
router.put("/customers/:id/tags", async (req, res) => {
    const { id } = req.params;
    const { tagIds } = req.body;

    if (!tagIds || !Array.isArray(tagIds)) {
        return res.status(400).json({ error: "Tag IDs array is required" });
    }

    try {
        // First verify all tag IDs exist
        const [existingTags] = await db.promise().query(
            "SELECT id FROM tags WHERE id IN (?)", 
            [tagIds]
        );
        
        const existingTagIds = existingTags.map(tag => tag.id);
        const invalidTagIds = tagIds.filter(id => !existingTagIds.includes(id));
        
        if (invalidTagIds.length > 0) {
            return res.status(400).json({ 
                error: "Some tag IDs don't exist", 
                invalidTagIds 
            });
        }

        // Update customer with valid tag IDs
        const [result] = await db.promise().query(
            "UPDATE customers SET tags = ? WHERE id = ?",
            [JSON.stringify(tagIds), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No customer found with this ID" });
        }

        // Get the updated customer with populated tags
        const [customer] = await db.promise().query(
            "SELECT * FROM customers WHERE id = ?",
            [id]
        );
        
        // Get full tag details
        const [tags] = await db.promise().query(
            "SELECT id, value, label FROM tags WHERE id IN (?)",
            [tagIds]
        );

        res.json({ 
            ...customer[0],
            tags: tags || [] // Ensure tags is always an array
        });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ 
            error: "Database error", 
            details: err.message 
        });
    }
});
module.exports = router;