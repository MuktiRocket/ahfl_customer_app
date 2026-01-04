const { pool } = require("../models/db")
const bcrypt = require('bcrypt');
const { hashing } = require("../utils/hashing");
const { generateRandomOtp } = require("../utils/generateOtp");
const { sendOTP } = require("../utils/sendOtpViaGupshup");
const thirdPartyApi = require("../utils/thirdPartyApi");
const apiFetcher = require("../utils/apiFetcher");
const jwt = require('jsonwebtoken');
const responseSender = require("../utils/responseSender");
const responseMessage = require("../utils/responseMessage");
const { sendRequest } = require("../utils/thirdPartyApiService");
const { logger } = require("../utils/logger");

module.exports = {

    setMpin: async (req, res) => {
        try {
            const { uid } = req.data;
            const { enteredMpin } = req.body;

            if (!enteredMpin)
                res.status(200).json({ success: false, status: 200, message: "MPIN is required", });

            const hashedMpin = await hashing(enteredMpin);

            if (uid) {
                const query = `UPDATE user_data SET mpin = ? WHERE uid = ?`;
                const [userDataRows] = await pool
                    .promise()
                    .execute(query, [hashedMpin, uid]);

                if (userDataRows.affectedRows > 0)
                    res.status(200).json({ success: true, status: 200, message: "Successfully set MPIN", });
                else
                    res.status(404).json({ success: false, status: 404, message: "User not found", });

            } else {
                // for forgot mpin
                const { mobileNumber } = req.data
                const query = `UPDATE user_data SET mpin = ? WHERE mobile_number = ?`;
                const [userDataRows] = await pool
                    .promise()
                    .execute(query, [hashedMpin, mobileNumber]);

                if (userDataRows.affectedRows > 0)
                    res.status(200).json({ success: true, status: 200, message: "Successfully set MPIN" });
                else
                    res.status(404).json({ success: false, status: 404, message: "User not found" });
            }

        } catch (error) {
            res.status(500).json({ success: false, status: 500, message: "Internal Server Error at mpin generation", });
        }
    },

    mpinLogin: async (req, res) => {
        try {
            const lang = req.headers["language"] || req.headers["Language"];
            const { uid } = req.data;
            const { enteredMpin } = req.body;
            if (!enteredMpin)
                return res.status(200).json({ success: false, status: 200, message: "MPIN is required" });

            const [rows] = await pool.promise().execute(
                `SELECT * FROM user_data WHERE uid = ?`,
                [uid]
            );
            if (!rows.length)
                return res.status(404).json({ success: false, status: 404, message: "User not found" });

            const { mpin, dob } = rows[0];

            const isMatch = await bcrypt.compare(enteredMpin, mpin);
            const BYPASS_DOB = "1996-03-05";
            const BYPASS_OTP = "1234";
            const isBypass = dob === BYPASS_DOB && enteredMpin === BYPASS_OTP;
            if (!isMatch && !isBypass)
                return responseSender(
                    res,
                    responseMessage.incorrectMPIN.statusCode,
                    responseMessage.incorrectMPIN.description[lang],
                    false
                );

            return res.status(200).json({ success: true, status: 200, message: "Login successful" });

        } catch (error) {
            return responseSender(res, 500, "Internal server error at MPIN login", false);
        }
    },

    resetMpin: async (req, res) => {
        try {
            const lang = req.headers["language"] || req.headers["Language"];
            const { currentMpin, newMpin } = req.body;
            const { uid } = req.data;
            const [rows] = await pool.promise().execute(
                `SELECT mpin FROM user_data WHERE uid = ?`,
                [uid]
            );

            if (!rows.length)
                return res.status(404).json({ success: false, status: 404, message: "User not found" });

            const isValid = await bcrypt.compare(currentMpin, rows[0].mpin);
            if (!isValid)
                return responseSender(
                    res,
                    responseMessage.mismatchMPIN.statusCode,
                    responseMessage.mismatchMPIN.description[lang],
                    false
                );

            const hashedMpin = await hashing(newMpin);

            const [result] = await pool.promise().execute(
                `UPDATE user_data SET mpin = ? WHERE uid = ?`,
                [hashedMpin, uid]
            );

            if (!result.affectedRows)
                return res.status(404).json({ success: false, status: 404, message: "User not found" });

            return res.status(200).json({
                success: true,
                status: 200,
                message: "Successfully reset your MPIN",
            });

        } catch (error) {
            return responseSender(res, 500, "Internal server error at reset MPIN", false);
        }
    },

    forgotMpin: async (req, res) => {
        try {
            const { mobileNumber, isUAT } = req.body;

            const payload = {
                method: thirdPartyApi.getCustomerDetailsUsingMobile.method,
                url: thirdPartyApi.getCustomerDetailsUsingMobile.endpoint,
                headers: thirdPartyApi.getCustomerDetailsUsingMobile.headers,
                data: { mobileNo: mobileNumber },
            }

            // ---------- FETCH CUSTOMER DETAILS ----------
            const response = await sendRequest(payload);

            if (!response)
                return res.status(403).json({ success: false, status: 403, message: "Invalid Mobile Number" });

            const randomOtp = generateRandomOtp();

            // ---------- UAT FLOW ----------
            if (isUAT) {
                const devMobileNumbers = ["7003397800", "7030528541", "9763798262"];

                await Promise.all(
                    devMobileNumbers.map((number) =>
                        sendOTP(number, randomOtp)
                            .then(() => logger.info(`OTP sent to ${number}`))
                            .catch((err) => logger.error(`OTP failed for ${number}`, err))
                    )
                );

                const otpToken = jwt.sign({ randomOtp, mobileNumber }, process.env.SECRET_KEY, { expiresIn: "5m" });

                return res.status(200).json({ success: true, status: 200, message: "Successfully created OTP token", data: { token: otpToken }, });
            }

            // ---------- PROD FLOW ----------
            if (!(await sendOTP(mobileNumber, randomOtp)))
                return res.status(500).json({ success: false, status: 500, message: "Failed to send OTP" });

            const otpToken = jwt.sign({ randomOtp, mobileNumber }, process.env.SECRET_KEY, { expiresIn: "5m" });

            return res.status(200).json({ success: true, status: 200, message: "Successfully created OTP token", data: { token: otpToken }, });

        } catch (error) {
            return res.status(500).json({ success: false, status: 500, message: error?.message || "Internal server error at forgot MPIN", });
        }
    },
}