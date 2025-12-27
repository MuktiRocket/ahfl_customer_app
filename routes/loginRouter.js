const express = require("express");
const fetchLoanAccountDOB = require("../middlewares/fetchLoanAccountDOB");
const { verifyToken } = require("../middlewares/verifyToken");
const loginController = require("../controllers/loginController");

const router = express.Router();

router.post("/otpLogin", loginController.otpLogin);

router.post("/verify", loginController.otpVerify);

// router.post("/dobLogin", fetchLoanAccountDOB, loginController.dobLoginUpdated);
router.post("/dobLogin", loginController.dobLogin);

router.post('/logout', verifyToken, loginController.logout)

module.exports = router;