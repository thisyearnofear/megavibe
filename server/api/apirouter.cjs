const express = require('express');
const router = express.Router();
const tipRouter = require('./api/tipRouter.cjs');

router.use('/tips', tipRouter);

module.exports = router;