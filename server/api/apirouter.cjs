const express = require('express');
const router = express.Router();
const paymentsRouter = require('../routes/payments.cjs');

router.use('/payments', paymentsRouter);

module.exports = router;