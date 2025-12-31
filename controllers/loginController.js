const { generateRandomOtp } = require("../utils/generateOtp");
const jwt = require("jsonwebtoken");
const { saveUserData } = require("../models/userModel");
const { pool } = require("../models/db");
const uuid = require("uuid");
const { sendOTP } = require("../utils/sendOtpViaGupshup");
const apiFetcher = require("../utils/apiFetcher");
const thirdPartyApi = require("../utils/thirdPartyApi");
const request = require("request");
const { sendRequest } = require("../utils/thirdPartyApiService");
const { logger } = require("../utils/logger");

module.exports = {
  otpLogin: async (req, res) => {
    const { mobileNumber, isDeveloped } = req.body;

    try {
      if (!mobileNumber)
        return res.status(400).json({ success: false, status: 400, message: "Mobile number is required", data: {} });

      const payload = {
        method: thirdPartyApi.getCustomerDetailsUsingMobile.method,
        url: thirdPartyApi.getCustomerDetailsUsingMobile.endpoint,
        headers: thirdPartyApi.getCustomerDetailsUsingMobile.headers,
        data: JSON.stringify({ mobileNo: mobileNumber }),
      };
      const result = await sendRequest(payload);

      if (!result || result?.Message)
        return res.status(200).json({ success: false, status: 200, message: result?.Message || "Invalid Mobile Number" });

      const customerDataArray = Array.isArray(result?.customerDetails) ? result.customerDetails : [result?.customerDetails];

      if (!customerDataArray?.length)
        return res.status(200).json({ success: false, status: 200, message: "Invalid User! Not registered yet", data: {} });

      const { applicantMobileNo, customerNumber, loanAccountNumber } = customerDataArray[0];

      if (!applicantMobileNo || !customerNumber)
        return res.status(401).json({ success: false, status: 401, message: "User not exists", data: {} });

      const isBypass = mobileNumber == process.env.BYPASS_MOBILE
      const otp = isBypass ? process.env.TESTING_OTP_UAT : generateRandomOtp();

      const [[existingUser]] = await pool
        .promise()
        .execute(`SELECT uid FROM user_data WHERE mobile_number = ?`, [applicantMobileNo]);

      const uid = existingUser?.uid || uuid.v4();

      // ---------- BYPASS OTP ----------
      if (isBypass) {
        await saveUserData({ mobileNumber, otp, customerDataArray, uid, loanAccountNumber });

        const otpToken = jwt.sign({ uid }, process.env.SECRET_KEY, { expiresIn: "5m" });

        return res.status(200).json({ success: true, status: 200, message: "OTP sent successfully!!", data: { token: otpToken, otp, mobileNumber }, });
      }

      // ---------- NORMAL OTP ----------
      const otpResponse = await sendOTP(applicantMobileNo, otp);

      if (!otpResponse.success)
        return res.status(500).json({ success: false, status: 500, message: "Failed to send OTP", data: {} });

      await saveUserData({ mobileNumber, otp, customerDataArray, uid, loanAccountNumber, dob: null });

      const otpToken = jwt.sign({ uid }, process.env.SECRET_KEY, { expiresIn: "5m" });

      return res.status(200).json({ success: true, status: 200, message: "OTP sent successfully!!", data: { token: otpToken, otp }, });

    } catch (error) {
      logger.error("Error in OTP Login:", error);
      return res.status(500).json({ success: false, status: 500, message: "Error in processing OTP login", data: {}, });
    }
  },


  otpVerify: async (req, res) => {
    try {
      const lang = req.headers["language"] || req.headers["Language"];
      const otpToken = req.headers.authorization?.split(" ")[1];

      const { enteredOtp, isDOB } = req.body;

      jwt.verify(otpToken, process.env.SECRET_KEY, async (err, decoded) => {
        if (err)
          return res.status(401).json({ success: false, status: 401, message: "Invalid OTP token!", data: {} });

        const { uid, randomOtp, mobileNumber } = decoded;

        // ---------- TOKEN BASED OTP (NO DB) ----------
        if (randomOtp && mobileNumber) {
          if (randomOtp !== enteredOtp)
            return res.status(200).json({ success: false, status: 200, message: "Otp mismatch!" });

          const authToken = jwt.sign({ mobileNumber }, process.env.SECRET_KEY, { expiresIn: "2d" });

          return res.status(200).json({ success: true, status: 200, message: "Successfully verified mobile number", data: { token: authToken, isMpin: false }, });
        }

        // ---------- DB BASED OTP ----------
        const [userDataRows] = await pool
          .promise()
          .execute(`SELECT * FROM user_data WHERE uid = ? AND otp_expiry > NOW()`, [uid]);

        if (!userDataRows.length)
          return res.json({ success: false, status: 401, message: "Invalid OTP token or OTP expired", data: {} });

        const { otp, mpin } = userDataRows[0];
        const isOTPValid = enteredOtp === otp;

        if (!isOTPValid)
          return res.json({ success: false, status: 401, message: lang !== "en" ? "अमान्य ओटीपी" : "Invalid OTP", data: {}, });

        const authToken = jwt.sign({ uid }, process.env.SECRET_KEY, { expiresIn: "2d" });

        await pool
          .promise()
          .execute(`UPDATE user_data SET auth_token = ? WHERE uid = ?`, [authToken, uid]);

        return res.json({
          success: true,
          status: 200,
          message:
            lang !== "en"
              ? isDOB
                ? "बधाई हो, खाता सत्यापन सफलतापूर्वक हो गया है"
                : "OTP सफलतापूर्वक सत्यापित हो जाता है"
              : isDOB
                ? "Congratulations, Account verification successfully done"
                : "OTP verified successfully",
          data: { token: authToken, isMPIN: !!mpin },
        });
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server errror from verify OTP" });
    }
  },


  dobLogin: async (req, res) => {
    try {
      const { loanAccountNumber, dob, isUAT } = req.body;

      const BYPASS_LOAN_ACCOUNT = "18300000257";
      const BYPASS_DOB = "1996-03-05";
      const BYPASS_OTP = "123456";

      if (!loanAccountNumber && !dob)
        return res.status(400).json({ success: false, status: 400, message: "Missing details", data: {} });

      const payload = {
        method: thirdPartyApi.getCustomerDetailsUsingMobile.method,
        url: thirdPartyApi.getCustomerDetailsUsingMobile.endpoint,
        headers: thirdPartyApi.getCustomerDetailsUsingMobile.headers,
        data: JSON.stringify({ loanAccountNumber, dob }),
      };

      const result = await sendRequest(payload);

      if (!result || result?.Message)
        return res.status(200).json({ success: false, status: 200, message: result?.Message || "Invalid Mobile Number" });

      const customerDataArray = Array.isArray(result?.customerDetails) ? result.customerDetails : [result?.customerDetails];

      if (!customerDataArray?.length)
        return res.status(500).json({ success: false, status: 500, message: "Invalid User! Not registered yet", data: {} });

      const { applicantMobileNo, customerNumber } = customerDataArray[0];

      if (!applicantMobileNo || !customerNumber)
        return res.status(401).json({ success: false, status: 401, message: "User not exists", data: {} });

      const isBypass = loanAccountNumber === BYPASS_LOAN_ACCOUNT && dob === BYPASS_DOB;
      const otp = isBypass ? BYPASS_OTP : (isUAT ? process.env.TESTING_OTP_UAT : generateRandomOtp());

      const [[existingUser]] = await pool.promise().execute(`SELECT uid FROM user_data WHERE mobile_number = ?`, [applicantMobileNo]);

      const uid = existingUser?.uid || uuid.v4();
      const shouldSendOtp = !isBypass;

      if (shouldSendOtp && !(await sendOTP(applicantMobileNo, otp)))
        return res.status(500).json({ success: false, status: 500, message: "Failed to send OTP", data: {} });

      await saveUserData({ mobileNumber: applicantMobileNo, otp, customerDataArray, uid, loanAccountNumber, dob });

      const otpToken = jwt.sign({ uid }, process.env.SECRET_KEY, { expiresIn: "5m" });

      return res.status(200).json({ success: true, status: 200, message: "OTP sent successfully!!", data: { token: otpToken, otp: shouldSendOtp ? otp : BYPASS_OTP }, });

    } catch (error) {
      return res.status(500).json({ success: false, status: 500, message: "Error in processing OTP login", data: {} });
    }

  },

  logout: async (req, res) => {
    try {
      const { uid } = req.data;

      const deleteTokenQuery = `UPDATE user_data SET auth_token = NULL WHERE uid = ?`;
      await pool.promise().execute(deleteTokenQuery, [uid]);

      res.status(200).json({
        success: true,
        status: 200,
        message: "Successfully Logged Out!!",
      });
    } catch (error) {
      //console.log(error);
      res.status(500).json({
        success: false,
        status: 500,
        msg: "Internal server errror from Logout route",
      });
    }
  },

  dobLoginUpdated: async (req, res) => {
    try {
      const { dob, loanAccountNumber, isUAT } = req.body;
      const customerData = req?.apiData;
      //console.log({ customerData });

      if (
        !customerData ||
        customerData.status === "Failure" ||
        customerData.status === "failed"
      ) {
        return res.status(200).json({
          success: false,
          status: 200,
          message: apiData?.message || "Incorrect DOB or Account Number",
        });
      }

      if (!loanAccountNumber || !dob) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: "User Credentials are required",
          data: {},
        });
      }

      let dobThirdPartyResponseArray = [];

      if (!Array.isArray(customerData?.customerDetails)) {
        dobThirdPartyResponseArray.push(customerData?.customerDetails);
      } else {
        dobThirdPartyResponseArray = customerData?.customerDetails;
      }
      //console.log({ dobThirdPartyResponseArray });

      if (dobThirdPartyResponseArray && dobThirdPartyResponseArray.length > 0) {
        // Check for user existence
        const { applicantMobileNo } = dobThirdPartyResponseArray[0];
        const otp = generateRandomOtp();
        const uid = uuid.v4();
        let customerDataArray = [];

        for (const customerObject of dobThirdPartyResponseArray) {
          console.log({ customerObject });
          const { applicantMobileNo } = customerObject;

          const requestData = JSON.stringify({
            mobileNo: applicantMobileNo,
          });
          const result = await apiFetcher({
            url: thirdPartyApi.getCustomerDetailsUsingMobile.endpoint,
            method: thirdPartyApi.getCustomerDetailsUsingMobile.method,
            headers: thirdPartyApi.getCustomerDetailsUsingMobile.headers,
            data: requestData,
          });
          //console.log({ result })
          customerDataArray.push(result?.customerDetails?.[0]);
          //console.log({ customerDataArray })
        }

        if (isUAT) {
          // For testing purpose need to change while going in UAT -> await sendOTP(applicantMobileNo, otp)
          const devMobileNumber = [
            "7030528541",
            "9763798262",
            "7003765564",
            "7003092937",
            "9830440111",
          ];
          for (const number of devMobileNumber) {
            await sendOTP(number, otp)
              .then(() => {
                console.log(`OTP sent successfully to ${number}`);
              })
              .catch((error) => {
                console.error(`Failed to send OTP to ${number}:`, error);
              });
          }

          //console.log({ applicantMobileNo, customerDataArray })
          await saveUserData({
            applicantMobileNo,
            otp,
            customerDataArray,
            uid,
            loanAccountNumber,
            dob,
          });

          const otpToken = jwt.sign({ uid }, process.env.SECRET_KEY, {
            expiresIn: "5m",
          });

          res.json({
            success: true,
            status: 200,
            message: "OTP sent successfully!!",
            data: {
              token: otpToken,
              otp: otp,
            },
          });
        } else {
          //console.log("Mobile Number from DOB Login resposnse:", applicantMobileNo)
          await sendOTP(applicantMobileNo, otp);
          await saveUserData({
            applicantMobileNo,
            otp,
            customerDataArray,
            uid,
            loanAccountNumber,
            dob,
          });

          const otpToken = jwt.sign({ uid }, process.env.SECRET_KEY, {
            expiresIn: "5m",
          });

          res.json({
            success: true,
            status: 200,
            message: "OTP sent successfully!!",
            data: {
              token: otpToken,
              otp: otp,
            },
          });
        }
      } else {
        res.status(200).json({
          success: false,
          status: 200,
          message: "User not found",
          data: {},
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        status: 500,
        message: "Error in processing DOB Account Number login",
      });
    }
  },
};
