const express = require("express");
const { verifyToken } = require("../middlewares/verifyToken");
const loginController = require("../controllers/loginController");
const validate = require("../middlewares/ValidationMiddleware");
const { dobLogin, otpLogin, otpVerify } = require("../validations/loginControllerValidations");

const router = express.Router();

router.post("/otpLogin", validate(otpLogin), loginController.otpLogin);
router.post("/verify", verifyToken, validate(otpVerify), loginController.otpVerify);
router.post("/dobLogin", validate(dobLogin), loginController.dobLogin);
router.post('/logout', verifyToken, loginController.logout)

module.exports = router;