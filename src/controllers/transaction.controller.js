const transactionModel = require("../models/transaction.model");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.service");

/**
 * --Create a new transaction
 * The 10-STEP TRANSFER FLOW:
 * 1.Validate request
 * 2.Validate idempotencyKey
 * 3.Check account status
 * 4.Derive sender balance from lenger
 * 5.Create transaction (PENDING)
 * 6.Create DEBIT ledger entry
 * 7.Create CREDIT ledger entry
 * 8.Mark transaction COMPLETED
 * 9.Commit MongoDB session
 * 10.Send email notification
 */

async function createTransaction(req, res) {
  /**
   * 1. validate request
   */
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "FromAccount,ToAccount,amount and idempotencyKey are requirred",
    });
  }

  const fromUserAccount = await accountModel.findOne({ _id: fromAccount });
  const toUserAccount = await accountModel.findOne({ _id: toAccount });

  if (!fromAccount || !toAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount",
    });
  }

  /**
   * 2. validate idempontency Key
   */
  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({
        message:
          "Transaction already processed , and Duplicate idempontency Key",
        transaction: isTransactionAlreadyExists,
      });
    }

    if (isTransactionAlreadyExists.status === "PENDING") {
      return res.status(200).json({
        message: "Transaction is still processing",
      });
    }
    if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(500).json({
        message: "Transaction processing failed, please retry",
      });
    }
    if (isTransactionAlreadyExists.status === "REVERSED") {
      return res.status(200).json({
        message: "Transaction was reversed, please retry",
      });
    }
  }
  /**
   * 3. Check Account status
   */
  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message:
        "Both fromAccount and toAccount must be ACTIVE to preccess transaction",
    });
  }
  /**
   * 4. Dirive sender balence from ledger
   */

  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance in fromAccount. Current balance is ${balance} Requested amount is ${amount}`,
    });
  }

  let transaction;
  const session = await mongoose.startSession();

  try {
    /**
     * 5.Create transaction (PENDING)
     */

    session.startTransaction();

    // transaction = await transactionModel.create(
    //   [
    //     {
    //       fromAccount: fromUserAccount._id,
    //       toAccount,
    //       amount: amount,
    //       idempotencyKey,
    //       status: "PENDING",
    //     },
    //   ],
    //   { session },
    // )[0];

    transaction = new transactionModel({
      fromAccount: fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING",
    });
    await transaction.save({ session });
    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );

    await (() => {
      return new Promise((resolve) => setTimeout(resolve, 1000 * 100));
    });
    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    await transactionModel.findByIdAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session },
    );
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction failed:", error);
    return res.status(500).json({
      // Use 500 for server error
      message: "Transaction failed due to internal error, please retry",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
    // return res.status(400).json({
    //   message:
    //     "Transaction is pending due to some issue, please retry after some time",
    // });
  } finally {
    session.endSession();
  }

  /**
   * 10.Send email notification
   */

  await emailService.sendTransactionEmail(
    req.user.email,
    req.user.name,
    amount,
    toAccount,
  );

  return res.status(200).json({
    message: "Transaction completed successfully!",
    transaction: transaction,
  });
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res
      .status(400)
      .json({ message: "toAccount,amount or idempontency Key are required" });
  }
  const toUserAccount = await accountModel.findOne({ _id: toAccount });

  if (!toUserAccount) {
    return res.status(400).json({ message: "Invalid toAccount" });
  }

  const fromUserAccount = await accountModel.findOne({
    systemUser: true,
    user: req.user._id,
  });

  // console.log(fromUserAccount.systemUser)
  // console.log(req.user._id)
  if (!fromUserAccount) {
    return res.status(400).json({ message: "System account not found" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount: amount,
    idempotencyKey,
    status: "PENDING",
  });

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );

  transaction.status = "COMPLETED";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();
  return res.status(201).json({
    message: "Initial funds transaction completed successfully!",
    transaction: transaction,
  });
}

module.exports = { createTransaction, createInitialFundsTransaction };
