const { pool } = require("../models/db");

async function saveCRMRequestData(payload) {
  try {
    const {
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
      firstName,
      source_AppId,
      probItem,
      changedMobile,
    } = payload;

    const insertQuery = `
        INSERT INTO crm_request_data (
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
        firstName,
        source_AppId,
        probItem,
        changedMobile,
        created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    const insertValues = [
      lastName,
      clientId || null,
      contactEmailId || null,
      probCategory || null,
      contactMobileNo || null,
      description || null,
      source,
      type,
      probType || null,
      probSummary || null,
      firstName || null,
      source_AppId || null,
      probItem || null,
      changedMobile || null,
    ];

    const [result] = await pool.promise().execute(insertQuery, insertValues);

    return result.insertId;
  } catch (error) {
    console.error("Error saving response payment data:", error);
    throw new Error(error);
  }
}

async function updateCRMRequestDataByTicketId(payload) {
  try {
    const { ticketId, id } = payload;

    const updateQuery = `
      UPDATE crm_request_data
      SET ticketId = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const updateValues = [ticketId ?? null, id];

    const [result] = await pool.promise().execute(updateQuery, updateValues);

    return {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
    };
  } catch (error) {
    console.error("Error updating CRM request data:", error);
    throw error;
  }
}

module.exports = {
  saveCRMRequestData,
  updateCRMRequestDataByTicketId,
};
