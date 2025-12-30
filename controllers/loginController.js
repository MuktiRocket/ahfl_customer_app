const { generateRandomOtp } = require("../utils/generateOtp");
const jwt = require("jsonwebtoken");
const { saveUserData } = require("../models/userModel");
const { pool } = require("../models/db");
const uuid = require("uuid");
const { sendOTP } = require("../utils/sendOtpViaGupshup");
const apiFetcher = require("../utils/apiFetcher");
const thirdPartyApi = require("../utils/thirdPartyApi");
const request = require("request");

module.exports = {
  otpLogin: async (req, res) => {
    const { mobileNumber, isDeveloped } = req.body;

    try {
      if (!mobileNumber) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: "Mobile number is required",
          data: {},
        });
      }

      const requesData = JSON.stringify({
        mobileNo: mobileNumber,
      });
      console.log({
        url: thirdPartyApi.getCustomerDetailsUsingMobile.endpoint,
        method: thirdPartyApi.getCustomerDetailsUsingMobile.method,
        headers: thirdPartyApi.getCustomerDetailsUsingMobile.headers,
        data: requesData,
      });
      const result = await apiFetcher({
        url: thirdPartyApi.getCustomerDetailsUsingMobile.endpoint,
        method: thirdPartyApi.getCustomerDetailsUsingMobile.method,
        headers: thirdPartyApi.getCustomerDetailsUsingMobile.headers,
        data: requesData,
      });
      console.log(result);
      if (!result || result?.Message) {
        console.log("This issue occurs from third party APIs", result);
        return res.status(200).json({
          success: false,
          status: 200,
          message: result?.Message || "Invalid Mobile Number",
        });
      }
      //console.log(123456)
      let customerDataArray = [];
      const customerData = result;
      console.log(customerData?.customerDetails);
      /*customerData?.customerDetails?.forEach((details) => {
				//console.log("4646466", details)
				if(!details?.crmClientIDs){
					console.log('clientId is null for loan account number = '+ details?.loanAccountNumber)
				}else{
					console.log('clientID = ', details?.crmClientID)
				}
			});*/
      //console.log(124578)
      // Checking response to be in array or not
      if (!Array.isArray(customerData?.customerDetails)) {
        customerDataArray.push(customerData?.customerDetails);
      } else {
        customerDataArray = customerData?.customerDetails;
      }

      // checking customerdatails exists or not
      if (customerDataArray && customerDataArray.length > 0) {
        const { applicantMobileNo, customerNumber, loanAccountNumber } =
          customerDataArray[0];

        // console.log({ applicantMobileNo, customerNumber })

        if (applicantMobileNo && customerNumber) {
          // const otp = generateRandomOtp();
          // bypass otp
          const otp =
            mobileNumber == process.env.BYPASS_MOBILE
              ? process.env.TESTING_OTP_UAT
              : generateRandomOtp();

          //generating random unique id
          const query = `SELECT * FROM user_data WHERE mobile_number = ?`;
          const [userDataRows] = await pool
            .promise()
            .execute(query, [applicantMobileNo]);
          let uid;
          if (userDataRows.length === 0) {
            //console.log(userDataRows)
            uid = uuid.v4();
          } else {
            uid = userDataRows[0].uid;
          }

          if (mobileNumber == process.env.BYPASS_MOBILE) {
            //bypass otp sender
            await saveUserData({
              mobileNumber,
              otp,
              customerDataArray,
              uid,
              loanAccountNumber,
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
                mobileNumber: mobileNumber,
              },
            });
          } else {
            const otpResponse = await sendOTP(applicantMobileNo, otp);
            //if (await sendOTP(applicantMobileNo, otp)) {
            if (otpResponse.success) {
              //await saveUserData({ applicantMobileNo, otp, customerDataArray, uid, loanAccountNumber, dob })

              const payload = {
                mobileNumber: mobileNumber,
                otp: otp,
                customerDataArray: customerDataArray,
                uid: uid,
                loanAccountNumber: loanAccountNumber,
                dob: null,
              };
              await saveUserData(payload);

              const otpToken = jwt.sign({ uid }, process.env.SECRET_KEY, {
                expiresIn: "5m",
              });

              res.json({
                success: true,
                status: 200,
                message: "OTP sent successfully!!",
                data: { token: otpToken, otp: otp },
              });
            } else {
              res
                .status(500)
                .json({
                  success: false,
                  status: 500,
                  message: "Failed to send OTP",
                  data: {},
                });
            }
          }
        } else {
          res
            .status(401)
            .json({
              success: false,
              status: 401,
              message: "User not exists",
              data: {},
            });
        }
      } else {
        res.status(200).json({
          success: false,
          status: 200,
          message: "Invalid User! Not registered yet",
          data: {},
        });
      }
    } catch (error) {
      console.error("Error in OTP Login:", error);
      res.status(500).json({
        success: false,
        status: 500,
        message: "Error in processing OTP login",
        data: {},
      });
    }
  },

  otpVerify: async (req, res) => {
    try {
      const lang = req.headers["language"] || req.headers["Language"];
      const otpToken =
        req.headers.authorization && req.headers.authorization.split(" ")[1];

      if (lang !== "en") {
        if (!otpToken) {
          return res.status(401).json({
            success: false,
            status: 401,
            message: "Unauthorized: No token provided",
          });
        }

        const { enteredOtp, isDOB } = req.body;

        jwt.verify(otpToken, process.env.SECRET_KEY, async (err, decoded) => {
          if (err) {
            return res.status(401).json({
              success: false,
              status: 401,
              message: "Invalid OTP token!",
              data: {},
            });
          }

          //database concept
          const { uid, randomOtp, mobileNumber } = decoded;
          //console.log({ uid, randomOtp, mobileNumber })

          if (randomOtp && mobileNumber) {
            if (randomOtp !== enteredOtp) {
              return res.status(200).json({
                success: false,
                status: 200,
                message: "Otp mismatch!",
              });
            }

            const authToken = jwt.sign(
              { mobileNumber },
              process.env.SECRET_KEY,
              {
                expiresIn: "2d",
              }
            );

            res.status(200).json({
              success: true,
              status: 200,
              message: "Successfully verified mobile number",
              data: {
                token: authToken,
                isMpin: false,
              },
            });
          } else {
            const query = `SELECT * FROM user_data WHERE uid = ? AND otp_expiry > NOW()`;
            const [userDataRows] = await pool.promise().execute(query, [uid]);

            if (userDataRows.length === 0) {
              return res.json({
                success: false,
                status: 401,
                message: "Invalid OTP token or OTP expired",
                data: {},
              });
            }

            const { otp, mpin } = userDataRows[0];

            const isOTPValid = enteredOtp === otp;

            if (isOTPValid) {
              //auth token to pass throughout the applications
              const authToken = jwt.sign({ uid }, process.env.SECRET_KEY, {
                expiresIn: "2d",
              });

              // Store the new access token in the database
              const updateTokenQuery = `UPDATE user_data SET auth_token = ? WHERE uid = ?`;
              await pool.promise().execute(updateTokenQuery, [authToken, uid]);

              res.json({
                success: true,
                status: 200,
                message: isDOB
                  ? "बधाई हो, खाता सत्यापन सफलतापूर्वक हो गया है"
                  : "OTP सफलतापूर्वक सत्यापित हो जाता है",
                data: {
                  token: authToken,
                  isMPIN: mpin ? true : false,
                },
              });
            } else {
              res.json({
                success: false,
                status: 401,
                message: "अमान्य ओटीपी",
                data: {},
              });
            }
          }
        });
      } else {
        if (!otpToken) {
          return res.status(401).json({
            success: false,
            status: 401,
            message: "Unauthorized: No token provided",
          });
        }

        const { enteredOtp, isDOB } = req.body;

        jwt.verify(otpToken, process.env.SECRET_KEY, async (err, decoded) => {
          if (err) {
            return res.status(401).json({
              success: false,
              status: 401,
              message: "Invalid OTP token!",
              data: {},
            });
          }

          //database concept
          const { uid, randomOtp, mobileNumber } = decoded;
          //console.log({ uid, randomOtp, mobileNumber })

          if (randomOtp && mobileNumber) {
            if (randomOtp !== enteredOtp) {
              return res.status(200).json({
                success: false,
                status: 200,
                message: "Otp mismatch!",
              });
            }

            const authToken = jwt.sign(
              { mobileNumber },
              process.env.SECRET_KEY,
              {
                expiresIn: "2d",
              }
            );

            res.status(200).json({
              success: true,
              status: 200,
              message: "Successfully verified mobile number",
              data: {
                token: authToken,
                isMpin: false,
              },
            });
          } else {
            const query = `SELECT * FROM user_data WHERE uid = ? AND otp_expiry > NOW()`;
            const [userDataRows] = await pool.promise().execute(query, [uid]);

            if (userDataRows.length === 0) {
              return res.json({
                success: false,
                status: 401,
                message: "Invalid OTP token or OTP expired",
                data: {},
              });
            }

            const { otp, mpin } = userDataRows[0];

            //verify otp
            const isOTPValid = enteredOtp === otp;

            if (isOTPValid) {
              //auth token to pass throughout the applications
              const authToken = jwt.sign({ uid }, process.env.SECRET_KEY, {
                expiresIn: "2d",
              });

              // Store the new access token in the database
              const updateTokenQuery = `UPDATE user_data SET auth_token = ? WHERE uid = ?`;
              await pool.promise().execute(updateTokenQuery, [authToken, uid]);

              res.json({
                success: true,
                status: 200,
                message: isDOB
                  ? "Congratulations, Account verification successfully done"
                  : "OTP verified successfully",
                data: {
                  token: authToken,
                  isMPIN: mpin ? true : false,
                },
              });
            } else {
              res.json({
                success: false,
                status: 401,
                message: "Invalid OTP",
                data: {},
              });
            }
          }
        });
      }
    } catch (error) {
      //console.log(error);
      res.status(500).json({ error: "Internal server errror from verify OTP" });
    }
  },

  dobLogin: async (req, res) => {
    try {
      const { loanAccountNumber, dob, isUAT } = req.body;

      const BYPASS_LOAN_ACCOUNT = "18300000257";
      const BYPASS_DOB = "1996-03-05";
      const BYPASS_OTP = "123456";

      if (!loanAccountNumber && !dob) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: "Missing details",
          data: {},
        });
      }

      const requesData = JSON.stringify({
        loanAccountNumber: loanAccountNumber,
        dob: dob,
        //date_of_birth: dob
      });

      console.log(requesData);
      console.log({
        url: thirdPartyApi.getCustomerDetailsUsingMobile.endpoint,
        method: thirdPartyApi.getCustomerDetailsUsingMobile.method,
        headers: thirdPartyApi.getCustomerDetailsUsingMobile.headers,
        data: requesData,
      });
      const result = await apiFetcher({
        url: thirdPartyApi.getCustomerDetailsUsingMobile.endpoint,
        method: thirdPartyApi.getCustomerDetailsUsingMobile.method,
        headers: thirdPartyApi.getCustomerDetailsUsingMobile.headers,
        data: requesData,
      });
      console.log(5555, result);
      if (!result || result?.Message) {
        console.log("This issue occurs from third party APIs", result);
        return res.status(200).json({
          success: false,
          status: 200,
          message: result?.Message || "Invalid Mobile Number",
        });
      }

      let customerDataArray = [];
      const customerData = result;

      // Checking response to be in array or not
      if (!Array.isArray(customerData?.customerDetails)) {
        customerDataArray.push(customerData?.customerDetails);
      } else {
        customerDataArray = customerData?.customerDetails;
      }

      // checking customerdatails exists or not
      if (customerDataArray && customerDataArray.length > 0) {
        const { applicantMobileNo, customerNumber } = customerDataArray[0];

        //console.log({ applicantMobileNo, customerNumber })
        // Check if applicantMobileNo exists
        if (applicantMobileNo && customerNumber) {
          //const otp = isUAT ? process.env.TESTING_OTP_UAT : generateRandomOtp();
          console.log(
            loanAccountNumber === BYPASS_LOAN_ACCOUNT && dob === BYPASS_DOB,
            loanAccountNumber,
            BYPASS_DOB,
            dob
          );
          let otp;

          if (loanAccountNumber === BYPASS_LOAN_ACCOUNT && dob === BYPASS_DOB) {
            otp = BYPASS_OTP; // hard bypass
            console.log("⚠️ OTP bypass applied for test credentials");
          } else {
            otp = isUAT ? process.env.TESTING_OTP_UAT : generateRandomOtp();
          }
          console.log(123132123132, otp);
          //const otp = process.env.TESTING_OTP_UAT

          const query = `SELECT * FROM user_data WHERE mobile_number = ?`;
          const [userDataRows] = await pool
            .promise()
            .execute(query, [applicantMobileNo]);
          let uid;
          if (userDataRows.length === 0) {
            uid = uuid.v4();
          } else {
            uid = userDataRows[0].uid;
          }

          const shouldSendOtp = !(
            loanAccountNumber === BYPASS_LOAN_ACCOUNT && dob === BYPASS_DOB
          );

          //bypass otp sender
          if (shouldSendOtp && (await sendOTP(applicantMobileNo, otp))) {
            //storing data into database
            //await saveUserData({ applicantMobileNo, otp, customerDataArray, uid, loanAccountNumber, dob })
            const mobileNumber = applicantMobileNo;
            await saveUserData({
              mobileNumber,
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
            if (!shouldSendOtp) {
              console.log(123456);
              const mobileNumber = applicantMobileNo;
              await saveUserData({
                mobileNumber,
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
                  otp: BYPASS_OTP,
                },
              });
            }

            res.status(500).json({
              success: false,
              status: 500,
              message: "Failed to send OTP",
              data: {},
            });
          }

          /*const mobileNumber = applicantMobileNo
                    await saveUserData({ mobileNumber, otp, customerDataArray, uid, loanAccountNumber, dob })

                    const otpToken = jwt.sign({ uid }, process.env.SECRET_KEY, {
                        expiresIn: "5m",
                    });

                    res.json({
                        success: true,
                        status: 200,
                        message: "OTP sent successfully!!",
                        data: {
                            token: otpToken,
                            otp: otp
                        },
                    });*/
        } else {
          res.status(401).json({
            success: false,
            status: 401,
            message: "User not exists",
            data: {},
          });
        }
      } else {
        res.status(500).json({
          success: false,
          status: 500,
          message: "Invalid User! Not registered yet",
          data: {},
        });
      }
    } catch (error) {
      // console.error("Error in OTP Login:", error);
      res.status(500).json({
        success: false,
        status: 500,
        message: "Error in processing OTP login",
        data: {},
      });
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
