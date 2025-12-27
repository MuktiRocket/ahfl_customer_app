const express = require("express");
const utilityController = require("../controllers/utilityController");

const router = express.Router();

router.get("/bannerData", utilityController.getBanner);
router.get("/loanData", utilityController.getLoandata);
router.get("/loanTypeDetails", utilityController.getLoanTypeDetails);
router.get("/loanTypes", utilityController.getLoanTypes);
router.get("/faq", utilityController.getFaq);
router.get("/aboutUs", utilityController.getAboutUs);
router.get("/privacyPolicy", utilityController.getPrivacyPolicyData);
router.get("/feeCharges", utilityController.getFeeAndCharges);

module.exports = [router];
