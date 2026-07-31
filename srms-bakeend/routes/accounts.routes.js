const express = require('express')
const router = express.Router()
const { getAccountsQueue, getAccountsCompleted, acceptPayment, acceptPaymentBySr } = require('../controllers/accounts.controller')
const { protect, authorizeCapability } = require('../middleware/auth.middleware')

router.use(protect)

// Accounts sub-role (plus Files Controller / Director via '*')
router.get('/queue',      authorizeCapability('accounts_manage'), getAccountsQueue)
router.get('/completed',  authorizeCapability('accounts_manage'), getAccountsCompleted)
router.patch('/:id/accept', authorizeCapability('accounts_manage'), acceptPayment)
router.post('/accept-by-sr', authorizeCapability('accounts_manage'), acceptPaymentBySr)

module.exports = router
