const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');

router.post('/opportunities/create', opportunityController.createOpportunity);
router.get('/get-lead-data/:leadid', opportunityController.fetchLeadWithOpportunity);
router.delete('/opportunity/:leadid', opportunityController.deleteOpportunityByLeadId);
router.put('/update-status/:leadId', opportunityController.updateOpportunityStatus);

module.exports = router;
