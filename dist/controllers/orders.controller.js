"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = express_1.Router();
router.get('/', (req, res) => {
    res.send('{}');
});
router.get('/:orders', (req, res) => {
    // Extract the name from the request parameters
    let { orders } = req.params;
    console.log(req.params);
    res.send(`Hello, ${orders}`);
});
// Export the express.Router() instance to be used by server.ts
exports.OrderController = router;
