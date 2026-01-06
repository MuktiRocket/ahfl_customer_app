const express = require("express");
const PaytmController = require("../controllers/paytmController");
const { verifyToken } = require("../middlewares/verifyToken");
const { validateCreatePaytmPayment, validatePaytmTransactionResponse } = require("../validations/paymentControllerValidations");
const validate = require("../middlewares/ValidationMiddleware")

const router = express.Router();

router.post("/generateChecksum", verifyToken, validate(validateCreatePaytmPayment), PaytmController.createPaytmPayment)
router.post("/saveTransaction", verifyToken, validate(validatePaytmTransactionResponse), PaytmController.postResponsePayment)
router.get("/getTransactionDetails", verifyToken, PaytmController.getTransactionHistory)
router.get("/getPaymentStatus", PaytmController.getPaymentStatus)
// router.post("/paytm/callback", PaytmController.handleCallback);

module.exports = [router];