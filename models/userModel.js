const { pool } = require("../models/db");
const { logger } = require("../utils/logger");

async function saveUserData({ mobileNumber, otp, customerDataArray, uid, loanAccountNumber, dob }) {
  try {
    const customerDataJson = JSON.stringify(customerDataArray);

    const [existingUser] = await pool
      .promise()
      .query("SELECT * FROM user_data WHERE mobile_number = ?", [mobileNumber]);

    // ---------- UPDATE EXISTING USER ----------
    if (existingUser.length > 0) {
      const updateQuery = `
        UPDATE user_data
        SET
          otp = ?,
          customer_data = ?,
          uid = ?,
          dob = ?,
          loanAccountNumber = ?,
          otp_expiry = NOW() + INTERVAL 30 MINUTE
        WHERE mobile_number = ?
      `;

      const updateValues = [
        otp || null,
        customerDataJson,
        uid,
        dob || null,
        loanAccountNumber || null,
        mobileNumber || null,
      ];

      try {
        await pool.promise().execute(updateQuery, updateValues);
      } catch (error) {
        logger.error("Error in running query of update in database");
      }

      return;
    }

    // ---------- INSERT NEW USER ----------
    const insertQuery = `
      INSERT INTO user_data (
        mobile_number,
        otp,
        customer_data,
        uid,
        loanAccountNumber,
        dob,
        otp_expiry
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW() + INTERVAL 30 MINUTE)
    `;

    const insertValues = [
      mobileNumber || null,
      otp || null,
      customerDataJson,
      uid,
      loanAccountNumber || null,
      dob || null,
    ];

    await pool.promise().execute(insertQuery, insertValues);

  } catch (error) {
    throw error;
  }
}


async function saveTransactionDetails({
  transactionId,
  amount,
  status,
  paymentMode,
  loanAccountNumber,
  customerNumber,
}) {
  try {
    const insertQuery = `
        INSERT INTO transaction (amount, status, payment_mode, transaction_id, loanAccountNumber, customerNumber, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, NOW())`;

    const insertValues = [
      amount || null,
      status || null,
      paymentMode,
      transactionId,
      loanAccountNumber || null,
      customerNumber || null,
    ];

    // Execute the insert query using the MySQL connection pool
    await pool.promise().execute(insertQuery, insertValues);
    //console.log("Transaction data inserted successfully");

    // Check if the user with the given transactionId is present or not
    // const [existingUser] = await pool
    //   .promise()
    //   .query("SELECT * FROM transaction WHERE loanAccountNumber = ?", [
    //     loanAccountNumber,
    //   ]);

    // if (existingUser.length > 0) {
    //   //update transaction details with same trnasaction id
    //   const updateQuery = `
    //     UPDATE transaction
    //     SET amount = ?, status = ?, paymentMode = ?, trnasactionId = ?, customerNumber = ?, timestamp = NOW()
    //     WHERE loanAccountNumber = ?
    //   `;

    //   const updateValues = [
    //     amount || null,
    //     status || null,
    //     paymentMode || null,
    //     trnasactionId || null,
    //     customerNumber || null,
    //     loanAccountNumber || null,
    //   ];
    //   await pool.promise().execute(updateQuery, updateValues);
    //   console.log("Transaction data updated successfully");
    // } else {
    //   const insertQuery = `
    //     INSERT INTO transaction (amount, status, payment_mode, trnasaction_id, loanAccountNumber, customerNumber, timestamp)
    //     VALUES (?, ?, ?, ?, ?, ?, NOW())
    //   `;

    //   const insertValues = [
    //     amount || null,
    //     status || null,
    //     paymentMode,
    //     trnasactionId,
    //     loanAccountNumber || null,
    //     customerNumber || null,
    //   ];

    //   // Execute the insert query using the MySQL connection pool
    //   await pool.promise().execute(insertQuery, insertValues);
    //   console.log("Transaction data inserted successfully");
    // }
  } catch (error) {
    console.error("Error saving Transaction data:", error);
    throw error;
  }
}

async function saveRequestPaymentDetails(finalEncryptedData) {
  try {

    const { applicationId, paymentAmount, paymentType, paymentDesc, loanAccountNumber, customerNumber, dob, customerName, mobileNumber, orderId, crmClientID, salt } = finalEncryptedData

    //console.log(finalEncryptedData.dob, finalEncryptedData.paymentAmounts)
    const insertQuery = `
        INSERT INTO request_payment (application_id, dob, customer_name, loan_account_no, mobile, order_id, payment_amount, payment_type, payment_desc, crm_client_id, salt, inserted_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    const insertValues = [
      applicationId || null,
      dob || null,
      customerName || null,
      loanAccountNumber || null,
      mobileNumber || null,
      orderId,
      paymentAmount,
      paymentType || null,
      paymentDesc || null,
      crmClientID || null,
      salt || null
    ];
    //console.log(insertValues)
    await pool.promise().execute(insertQuery, insertValues);
    //console.log("Request payment data inserted successfully");

  } catch (error) {
    console.error("Error saving request payment data:", error);
    throw error;
  }
}

async function saveResponsePaymentDetails(finalEncryptedData) {
  try {

    const { responseCode, responseMsg, responseStatus, bankName, bankTransactionId, currency, deviceId, gatewayName, orderId, mode, transactionAmount, transactionId, salt } = finalEncryptedData

    // console.log({ responseCode, responseMsg, responseStatus, bankName, bankTransactionId, currency, deviceId, gatewayName, orderId, mode, transactionAmount, transactionId, salt })

    const insertQuery = `
        INSERT INTO response_payment (request_id, response_code, response_msg, response_status, bank_name, bank_txn_id, currency, device_id, gateway_name, order_id, mode, txn_amount, txn_id, salt, inserted_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    const [requestRow] = await pool.promise().query('SELECT id FROM request_payment WHERE order_id = ?', [orderId]);

    if (requestRow.length === 0) {
      throw new Error(`Request not found for orderId: ${orderId}`);
    }

    const requestId = requestRow[0].id;

    const insertValues = [
      requestId,
      responseCode || null,
      responseMsg || null,
      responseStatus || null,
      bankName || null,
      bankTransactionId || null,
      currency,
      deviceId,
      gatewayName || null,
      orderId || null,
      mode || null,
      transactionAmount || null,
      transactionId || null,
      salt || null
    ];

    await pool.promise().execute(insertQuery, insertValues);
    //console.log("Response payment data inserted successfully");

  } catch (error) {
    console.error("Error saving response payment data:", error);
    throw error;
  }
}

async function insertPaymentDetails(payload) {
  try {

    const { customerId, mobile, orderId, responseCode, responseMsg, responseStatus, mode, amount, txnId, loanAccountNumber } = payload

    const insertQuery = `
        INSERT INTO payment_details (customerId, mobile, orderId, amount, responseCode, responseMsg, responseStatus, mode, txnId, loanAccountNumber, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    const insertValues = [
      customerId,
      mobile,
      orderId,
      amount,
      responseCode,
      responseMsg,
      responseStatus,
      mode,
      txnId,
      loanAccountNumber
    ];

    await pool.promise().execute(insertQuery, insertValues);
    //console.log("Response payment data inserted successfully");

  } catch (error) {
    console.error("Error saving response payment data:", error);
    throw error;
  }
}

async function updatePaymentDetailsByOrderId(payload) {
  try {
    const { orderId, responseCode, responseMsg, responseStatus, txnId, mode } = payload;
    console.log('adfdsaf', { orderId, responseCode, responseMsg, responseStatus, txnId, mode })
    const updateQuery = `
            UPDATE payment_details
            SET responseCode = ?, responseMsg = ?, responseStatus = ?, txnId = ?, mode = ?, updatedAt = NOW()
            WHERE orderId = ?
        `;

    const updateValues = [
      responseCode ?? null,
      responseMsg ?? null,
      responseStatus ?? null,
      txnId ?? null,
      mode ?? null,
      orderId ?? null
    ];

    const [result] = await pool.promise().execute(updateQuery, updateValues);

    return result;
  } catch (error) {
    console.error("Error updating payment details:", error);
    throw error;
  }
}

async function getCustomerDetails(uid) {

  const query = `SELECT * FROM user_data WHERE uid = ?`;
  const [userDataRows] = await pool.promise().execute(query, [uid]);

  // if (userDataRows.length === 0) {
  //   return res.json({
  //     success: false,
  //     status: 401,
  //     message: "Invalid creadentials",
  //     data: {},
  //   });
  // }
  //console.log({ userDataRows })
  const { customer_data } = userDataRows[0];
  return JSON.parse(customer_data)[0]
  // const customerNumber = JSON.parse(customer_data)[0].customerNumber;
}

async function saveApplyLoanData(payload) {
  try {

    const { firstName, lastName, clientId, contactEmailId, probCategory, contactMobileNo, description, source, type, probType, probSummary, probItem, source_AppId, lead_id } = payload;

    const insertQuery = `
      INSERT INTO apply_loan_data (
        firstName,
        lastName,
        clientId,
        contactEmailId,
        probCategory,
        contactMobileNo,
        description,
        source,
        type,
        probType,
        probSummary,
        probItem,
        source_AppId,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const insertValues = [
      firstName || null,
      lastName || null,
      clientId || null,
      contactEmailId || null,
      probCategory || null,
      contactMobileNo || null,
      description || null,
      source || null,
      type || null,
      probType || null,
      probSummary || null,
      probItem || null,
      source_AppId || null,
    ];

    const [result] = await pool.promise().execute(insertQuery, insertValues);

    return result.insertId;

  } catch (error) {
    console.error("Error saving apply loan data:", error);
    throw error;
  }
}

async function updateApplyLoanLeadId({ id, lead_id }) {
  try {
    const updateQuery = `
      UPDATE apply_loan_data
      SET lead_id = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const updateValues = [lead_id || null, id];

    await pool.promise().execute(updateQuery, updateValues);

    return true;

  } catch (error) {
    console.error("Error updating apply loan lead_id:", error);
    throw error;
  }
}



module.exports = { saveUserData, saveTransactionDetails, saveRequestPaymentDetails, saveResponsePaymentDetails, getCustomerDetails, insertPaymentDetails, updatePaymentDetailsByOrderId, saveApplyLoanData, updateApplyLoanLeadId };
