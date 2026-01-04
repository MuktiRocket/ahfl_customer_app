const { pool } = require("../models/db");
const config = require("../config");
const { saveFeedback } = require("../models/userModel");

module.exports = {
  getBanner: async (req, res) => {
    try {
      const query = `SELECT * FROM banner_data`;
      const [bannerDataRows] = await pool.promise().execute(query);

      if (bannerDataRows.length > 0) {

        const filteredBanners = {
          preLogin: [],
          homepage: [],
          accountDetail: [],
          offerReferral: []
        };

        bannerDataRows.forEach(banner => {
          const updatedBanner = {
            ...banner,
            banner_image: config.imageUrl + banner.banner_image
          };

          switch (banner.banner_image_type) {
            case "preLogin":
              filteredBanners.preLogin.push(updatedBanner);
              break;
            case "homepage":
              filteredBanners.homepage.push(updatedBanner);
              break;
            case "accountDetail":
              filteredBanners.accountDetail.push(updatedBanner);
              break;
            case "offerReferral":
              filteredBanners.offerReferral.push(updatedBanner);
              break;
            default:
              break;
          }
        });

        const excludedIds = [14, 15];

        const filteredResult = {};

        for (const section in filteredBanners) {
          filteredResult[section] = filteredBanners[section].filter(
            banner => !excludedIds.includes(banner.id)
          );
        }

        // const bannersWithImageUrl = bannerDataRows.map((banner) => {
        //   return {
        //     ...banner,
        //     banner_image: config.imageUrl + banner.banner_image,
        //   };
        // });

        res.status(200).json({
          success: true,
          status: 200,
          message: "Successfully fetched banner data details",
          data: {
            filteredResult,
          },
        });
      } else {
        res.status(404).json({
          success: false,
          status: 404,
          message: "No banner data found",
          data: {
            bannerDataRows: [],
          },
        });
      }
    } catch (error) {
      // console.log(
      //   "Error in fetching fetching data from banner data route",
      //   error
      // );
      res.status(500).json({
        success: false,
        status: 500,
        message: "Internal Server error!",
        data: {},
      });
    }
  },

  getLoandata: async (req, res) => {
    try {
      const lang = req.headers['language'] || req.headers['Language'];
      //console.log({ lang })

      if (lang !== 'en') {
        const query = `SELECT * FROM loan_data_hi`;
        const [loanDataRows] = await pool.promise().execute(query);

        const loanData = loanDataRows.map((row) => {
          try {
            return {
              ...row,
              itemImage: config.imageUrl + row.itemImage,
              options: JSON.parse(row.options),
            };
          } catch (error) {
            console.error("Error parsing JSON:", error);
            return { ...row, options: {} };
          }
        });

        if (loanData.length > 0) {
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched loan data details",
            data: {
              loanData,
            },
          });
        } else {
          res.status(404).json({
            success: false,
            status: 404,
            message: "No loan data found",
            data: {
              loanDataRows: [],
            },
          });
        }
      } else {
        const query = `SELECT * FROM loan_data`;
        const [loanDataRows] = await pool.promise().execute(query);

        const loanData = loanDataRows.map((row) => {
          try {
            return {
              ...row,
              itemImage: config.imageUrl + row.itemImage,
              options: JSON.parse(row.options),
            };
          } catch (error) {
            console.error("Error parsing JSON:", error);
            return { ...row, options: {} };
          }
        });

        if (loanData.length > 0) {
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched loan data details",
            data: {
              loanData,
            },
          });
        } else {
          res.status(404).json({
            success: false,
            status: 404,
            message: "No loan data found",
            data: {
              loanDataRows: [],
            },
          });
        }

      }
    } catch (error) {
      // console.log(
      //   "Error in fetching fetching data from loan data route",
      //   error
      // );
      res.status(500).json({
        success: false,
        status: 500,
        message: "Internal Server error!",
        data: {},
      });
    }
  },

  getLoanTypeDetails: async (req, res) => {
    try {
      const id = req.query.typeId || 1;
      const lang = req.headers['language'] || req.headers['Language'];
      //console.log({ lang })

      if (lang !== 'en') {
        const query = `SELECT * FROM loan_data_hi WHERE id = ?`;
        const [loanDataRows] = await pool.promise().execute(query, [id]);

        const loanData = loanDataRows.map((row) => {
          try {
            return {
              ...row,
              itemImage: config.imageUrl + row.itemImage,
              options: JSON.parse(row.options),
            };
          } catch (error) {
            console.error("Error parsing JSON:", error);
            return { ...row, options: {} };
          }
        });

        if (loanData.length > 0) {
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched loan data details",
            data: {
              loanData: loanData[0],
            },
          });
        } else {
          res.status(404).json({
            success: false,
            status: 404,
            message: "No loan data found",
            data: {
              loanDataRows: [],
            },
          });
        }
      } else {
        const query = `SELECT * FROM loan_data WHERE id = ?`;
        const [loanDataRows] = await pool.promise().execute(query, [id]);

        const loanData = loanDataRows.map((row) => {
          try {
            return {
              ...row,
              itemImage: config.imageUrl + row.itemImage,
              options: JSON.parse(row.options),
            };
          } catch (error) {
            console.error("Error parsing JSON:", error);
            return { ...row, options: {} };
          }
        });

        if (loanData.length > 0) {
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched loan data details",
            data: {
              loanData: loanData[0],
            },
          });
        } else {
          res.status(404).json({
            success: false,
            status: 404,
            message: "No loan data found",
            data: {
              loanDataRows: [],
            },
          });
        }
      }
    } catch (error) {
      // console.log(
      //   "Error in fetching fetching data from loan data route",
      //   error
      // );
      res.status(500).json({
        success: false,
        status: 500,
        message: "Internal Server error!",
        data: {},
      });
    }
  },

  getLoanTypes: async (req, res) => {
    try {
      const lang = req.headers['language'] || req.headers['Language'];
      //console.log({ lang })

      if (lang !== 'en') {
        const query = `SELECT * FROM loan_data_hi`;
        const [loanDataRows] = await pool.promise().execute(query);

        const loanData = loanDataRows.map((row) => {
          return {
            id: row.id,
            loanType: row.loanType,
            itemImage: config.imageUrl + row.itemImage,
            color: row.color,
            url: row.url
          };
        });

        if (loanData.length > 0) {
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched loan type details",
            data: {
              loanData,
            },
          });
        } else {
          res.status(404).json({
            success: false,
            status: 404,
            message: "No loan type data found",
            data: {
              loanDataRows: [],
            },
          });
        }
      } else {
        const query = `SELECT * FROM loan_data`;
        const [loanDataRows] = await pool.promise().execute(query);

        const loanData = loanDataRows.map((row) => {
          return {
            id: row.id,
            loanType: row.loanType,
            itemImage: config.imageUrl + row.itemImage,
            color: row.color,
            url: row.url
          };
        });

        if (loanData.length > 0) {
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched loan type details",
            data: {
              loanData,
            },
          });
        } else {
          res.status(404).json({
            success: false,
            status: 404,
            message: "No loan type data found",
            data: {
              loanDataRows: [],
            },
          });
        }
      }
    } catch (error) {
      // console.log(
      //   "Error in fetching fetching data from loan type data route",
      //   error
      // );
      res.status(500).json({
        success: false,
        status: 500,
        message: "Internal Server error!",
        data: {},
      });
    }
  },

  getFaq: async (req, res) => {
    try {
      const lang = req.headers['language'] || req.headers['Language'];
      //console.log({ lang })

      if (lang !== 'en') {
        const query = `SELECT * FROM faq_hi`;
        const [faqDataRow] = await pool.promise().execute(query);

        const faqData = faqDataRow.map((row) => {
          try {
            return {
              ...row,
              answer: JSON.parse(row.answer),
            };
          } catch (error) {
            // console.log("Error parsing JSON:", error);
            return { ...row, answer: {} };
          }
        });

        if (faqData.length > 0) {
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched faq data details",
            data: {
              faqData,
            },
          });
        } else {
          res.status(404).json({
            success: false,
            status: 404,
            message: "No data found",
            data: {
              faqDataRow: [],
            },
          });
        }
      } else {
        const query = `SELECT * FROM faq`;
        const [faqDataRow] = await pool.promise().execute(query);

        const faqData = faqDataRow.map((row) => {
          try {
            return {
              ...row,
              answer: JSON.parse(row.answer),
            };
          } catch (error) {
            //console.log("Error parsing JSON:", error);
            return { ...row, answer: {} };
          }
        });

        if (faqData.length > 0) {
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched faq data details",
            data: {
              faqData,
            },
          });
        } else {
          res.status(404).json({
            success: false,
            status: 404,
            message: "No data found",
            data: {
              faqDataRow: [],
            },
          });
        }
      }
    } catch (error) {
      //console.log("Error in fetching fetching data from faq route", error);
      res.status(500).json({
        success: false,
        status: 500,
        message: "Internal Server error!",
        data: {},
      });
    }
  },

  getAboutUs: async (req, res) => {
    try {
      const lang = req.headers['language'] || req.headers['Language'];
      //console.log({ lang })

      if (lang !== 'en') {
        //hindi
        const query = `SELECT * FROM about_us_data_hi`;
        const [aboutUsRows] = await pool.promise().execute(query);

        const aboutUsDataArray = aboutUsRows.map((item) => {
          try {
            return {
              ...item,
              options: JSON.parse(item.options),
              image: config.imageUrl + item.image,
            };
          } catch (error) {
            console.error("Error parsing JSON:", error);
            return { ...item, options: {} };
          }
        });

        if (aboutUsDataArray.length > 0) {
          const aboutUsData = aboutUsDataArray[0];
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched about us data",
            data: { aboutUsData },
          });
        } else {
          res.status(404).json({
            success: false,
            status: 404,
            message: "No data found",
            data: {
              aboutUsRows: [],
            },
          });
        }
      } else {
        const query = `SELECT * FROM about_us_data`;
        const [aboutUsRows] = await pool.promise().execute(query);

        const aboutUsDataArray = aboutUsRows.map((item) => {
          try {
            return {
              ...item,
              options: JSON.parse(item.options),
              image: config.imageUrl + item.image,
            };
          } catch (error) {
            console.error("Error parsing JSON:", error);
            return { ...item, options: {} };
          }
        });

        if (aboutUsDataArray.length > 0) {
          const aboutUsData = aboutUsDataArray[0];
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched about us data",
            data: { aboutUsData },
          });
        } else {
          res.status(404).json({
            success: false,
            status: 404,
            message: "No data found",
            data: {
              aboutUsRows: [],
            },
          });
        }
      }

    } catch (error) {
      //console.log("Error in fetching fetching data from about-us route", error);
      res.status(500).json({
        success: false,
        status: 500,
        message: "Internal Server error!",
        data: {},
      });
    }
  },

  getPrivacyPolicyData: async (req, res) => {
    try {
      const lang = req.headers['language'] || req.headers['Language'];
      //console.log({ lang })

      if (lang !== 'en') {

        const query = `SELECT * FROM privacy_policy_hi`;
        const [privacyPolicyRows] = await pool.promise().execute(query);

        const privacyPolicyArray = privacyPolicyRows.map((item) => {
          try {
            return {
              ...item,
              options: JSON.parse(item.options),
              image: config.imageUrl + item.image,
            };
          } catch (error) {
            console.error("Error parsing JSON:", error);
            return { ...item, options: {} };
          }
        });

        if (privacyPolicyArray.length > 0) {
          const privacyPolicyData = privacyPolicyArray[0];
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched about us data",
            data: { privacyPolicyData },
          });
        } else {
          res.status(404).json({
            success: false,
            status: 404,
            message: "No data found",
            data: {
              privacyPolicyRows: [],
            },
          });
        }
      } else {
        const query = `SELECT * FROM privacy_policy`;
        const [privacyPolicyRows] = await pool.promise().execute(query);

        const privacyPolicyArray = privacyPolicyRows.map((item) => {
          try {
            return {
              ...item,
              options: JSON.parse(item.options),
              image: config.imageUrl + item.image,
            };
          } catch (error) {
            console.error("Error parsing JSON:", error);
            return { ...item, options: {} };
          }
        });

        if (privacyPolicyArray.length > 0) {
          const privacyPolicyData = privacyPolicyArray[0];
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched about us data",
            data: { privacyPolicyData },
          });
        } else {
          res.status(404).json({
            success: false,
            status: 404,
            message: "No data found",
            data: {
              privacyPolicyRows: [],
            },
          });
        }
      }
    } catch (error) {
      // console.log("Error in fetching fetching data from about-us route", error);
      res.status(500).json({
        success: false,
        status: 500,
        message: "Internal Server error!",
        data: {},
      });
    }
  },

  getFeeAndCharges: async (req, res) => {
    try {
      const lang = req.headers['language'] || req.headers['Language'];
      //console.log({ lang })

      if (lang !== 'en') {
        const query = `SELECT * FROM fees_and_charges_hi`;
        const [feeChargesRow] = await pool.promise().execute(query);

        const details = feeChargesRow?.[0]?.options
        const bullet = feeChargesRow?.[0]?.bullets

        if (feeChargesRow.length > 0) {
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched fee and charges data",
            data: { details, bullet }
          });
        } else {
          res.status(200).json({
            success: false,
            status: 200,
            message: "No data found",
          });
        }
      } else {
        const query = `SELECT * FROM fees_and_charges`;
        const [feeChargesRow] = await pool.promise().execute(query);

        const details = feeChargesRow?.[0]?.options
        const bullet = feeChargesRow?.[0]?.bullets

        if (feeChargesRow.length > 0) {
          res.status(200).json({
            success: true,
            status: 200,
            message: "Successfully fetched fee and charges data",
            data: { details, bullet }
          });
        } else {
          res.status(200).json({
            success: false,
            status: 200,
            message: "No data found",
          });
        }
      }

    } catch (error) {
      //console.log("Error in fetching fetching data from fee and charges route", error);
      res.status(500).json({
        success: false,
        status: 500,
        message: "Internal Server error!",
        data: {},
      });
    }
  },

  insertFeedback: async (req, res) => {
    const { uid } = req.data;
    const { rating, comment } = req.body;

    const [rows] = await pool.promise().execute(
      `SELECT * FROM user_data WHERE uid = ?`,
      [uid]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, status: 404, message: "User not found" });

    const { mobile_number } = rows[0];

    const data = saveFeedback({ uid, rating, comment, mobile_number })

    res.json(data)
  }
};
