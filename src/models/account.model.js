const mongoose = require("mongoose");
const ledgerModel = require("../models/ledger.model");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: [true, "Account must be associated with user"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        message: "Status can be either ACTIVE,FROZEN or CLOSED",
      },
      default: "ACTIVE",
    },
    currency: {
      type: String,
      required: [true, "Currency is required for an account"],
      default: "INR",
    },
    systemUser: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

accountSchema.index({ user: 1, status: 1 });
accountSchema.index({ user: 1, systemUser: 1 }); 

accountSchema.methods.getBalance = async function () {

 const Ledger = mongoose.model("ledger"); 

  const balanceData = await ledgerModel.aggregate([
    { $match: { account: this._id } },
    {
      $group: {
        _id: null,
        totalDebit: {
          $sum: {
            $cond: [
              {
                $eq: ["$type", "DEBIT"],
              },
              "$amount",
              0,
            ],
          },
        },
        totalCredit: {
          $sum: {
            $cond: [
              {
                $eq: ["$type", "CREDIT"],
              },
              "$amount",
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        balance: { $subtract: ["$totalCredit", "$totalDebit"] },
      },
    },
  ]);

  
  return balanceData.length === 0 ? 0 : balanceData[0].balance;
};

const accountModel = mongoose.model("account", accountSchema);

module.exports = accountModel;
