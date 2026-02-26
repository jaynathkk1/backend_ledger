const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware")
const transactionRoutes = Router();
const transactionController = require("../controllers/transaction.controller")


/** 
 * --POST /api/transaction/
 * --Create a new transaction
 */
transactionRoutes.post("/",authMiddleware.authMiddleware,transactionController.createTransaction)
/** 
 * - POST /api/transactions/system/initial-funds
 * -Create initial funds transaction from system
 */

transactionRoutes.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes