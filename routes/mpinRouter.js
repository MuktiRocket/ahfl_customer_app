const express = require("express")
const { verifyToken } = require('../middlewares/verifyToken')
const mpinController = require('../controllers/mpinController')
const validate = require("../middlewares/ValidationMiddleware")
const { setMpinSchema, mpinLoginSchema, resetMpinSchema, forgotMpinSchema } = require("../validations/mpinControllerValidation")

const router = express.Router()

router.post('/setMPIN', verifyToken, validate(setMpinSchema), mpinController.setMpin)
router.post('/MPINLogin', verifyToken, validate(mpinLoginSchema), mpinController.mpinLogin)
router.post('/resetMPIN', verifyToken, validate(resetMpinSchema), mpinController.resetMpin)
router.post('/forgotMPIN', validate(forgotMpinSchema), mpinController.forgotMpin)

module.exports = router