const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const accountControlller = require("../controllers/account.controller")


const router = express.Router()

/** 
 * --POST /api/accounts
 * --Create a new account
 * --Protected Route
 */ 

router.post("/",authMiddleware.authMiddleware,accountControlller.creteAccountController)

/** 
 * --GET /api/accounts
 * --Get all accounts of the logged-in user
 * --Protected Route
 */ 
router.get("/",authMiddleware.authMiddleware,accountControlller.getUserAccountController)

/** 
 * --Get /api/accounts/balance/:accountId
 */ 
router.get("/balance/:accountId",authMiddleware.authMiddleware,accountControlller.getAccountBalanceController)
module.exports = router