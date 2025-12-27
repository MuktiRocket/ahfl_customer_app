const express = require("express")
const { verifyToken } = require('../middlewares/verifyToken')
const mpinController = require('../controllers/mpinController')

const router = express.Router()

router.post('/setMPIN', verifyToken, mpinController.setMpin)
router.post('/MPINLogin', verifyToken, mpinController.mpinLogin)
router.post('/resetMPIN', verifyToken, mpinController.resetMpin)
router.post('/forgotMPIN', mpinController.forgotMpin)

module.exports = router