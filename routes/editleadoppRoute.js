const express = require("express");
const router = express.Router();
const { updateLeadById, updateOpportunityById } = require("../controllers/editleadopportunitycontroller");

router.put("/leads/:leadid", updateLeadById);
router.put("/opportunities/:leadid", updateOpportunityById);

module.exports = router;
