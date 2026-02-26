const express = require('express');
const cookieParser = require("cookie-parser")

const app = express()

app.use(express.json())
app.use(cookieParser())

/**
 * --Routes Required
 */

const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.route")
const transactionRoutes = require("./routes/transaction.route")
/**
 * --Routes 
 */
app.get("/",(req,res)=>{
    res.status(200).json({
        messsage:"Ledger backend server is running"
    })
})
app.use("/api/auth",authRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/transactions",transactionRoutes)

module.exports =app