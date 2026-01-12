const { pool } = require("../models/db");
const config = require("../config");
const { saveFeedback } = require("../models/userModel");
const { logger } = require("../utils/logger");

module.exports = {
  getBanner: async (req, res) => {
    try {
      // 1️⃣ Fetch banner data
      const [bannerRows] = await pool.promise().execute("SELECT * FROM banner_data");

      // 2️⃣ If no data found
      if (!bannerRows.length)
        return res.status(404).json({ success: false, status: 404, message: "No banner data found", data: { bannerDataRows: [] }, });


      // 3️⃣ Banner sections
      const bannersBySection = {
        preLogin: [],
        homepage: [],
        accountDetail: [],
        offerReferral: [],
      };

      // 4️⃣ IDs to exclude
      const excludedIds = [14, 15];

      // 5️⃣ Process each banner
      for (const banner of bannerRows) {
        // Add full image URL
        const bannerWithImage = {
          ...banner,
          banner_image: `${config.imageUrl}${banner.banner_image}`,
        };

        const section = banner.banner_image_type;

        // Push only if section exists
        if (bannersBySection[section]) {
          bannersBySection[section].push(bannerWithImage);
        }
      }

      // 6️⃣ Remove excluded banners from each section
      Object.keys(bannersBySection).forEach(section => {
        bannersBySection[section] = bannersBySection[section].filter(
          banner => !excludedIds.includes(banner.id)
        );
      });

      // 7️⃣ Success response
      return res.status(200).json({ success: true, status: 200, message: "Successfully fetched banner data details", data: { filteredResult: bannersBySection }, });
    } catch (error) {
      logger.error(`Error in getBanner :: ${error}`)
      return res.status(500).json({ success: false, status: 500, message: "Internal Server error!", data: {}, });
    }
  },

  getLoandata: async (req, res) => {
    try {
      // 1️⃣ Get language
      const lang = req.headers["language"] || req.headers["Language"];

      // 2️⃣ Decide table based on language
      const tableName = lang === "en" ? "loan_data" : "loan_data_hi";

      // 3️⃣ Fetch loan data
      const [rows] = await pool.promise().execute(`SELECT * FROM ${tableName}`);

      // 4️⃣ If no data found
      if (!rows.length)
        return res.status(404).json({ success: false, status: 404, message: "No loan data found", data: { loanDataRows: [] }, });

      // 5️⃣ Transform loan data
      const loanData = rows.map(row => {
        let parsedOptions = {};

        parsedOptions = JSON.parse(row.options);
        return {
          ...row,
          itemImage: `${config.imageUrl}${row.itemImage}`,
          options: parsedOptions,
        };
      });

      // 6️⃣ Success response
      return res.status(200).json({ success: true, status: 200, message: "Successfully fetched loan data details", data: { loanData }, });
    } catch (error) {
      logger.error(`Error in getLoandata :: ${error}`);
      return res.status(500).json({ success: false, status: 500, message: "Internal Server error!", data: {}, });
    }
  },

  getLoanTypeDetails: async (req, res) => {
    try {
      // 1️⃣ Get inputs
      const id = req.query.typeId || 1;
      const lang = req.headers["language"] || req.headers["Language"];

      // 2️⃣ Decide table based on language
      const tableName = lang === "en" ? "loan_data" : "loan_data_hi";

      // 3️⃣ Fetch loan type data
      const [rows] = await pool.promise().execute(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);

      // 4️⃣ If no data found
      if (!rows.length)
        return res.status(404).json({ success: false, status: 404, message: "No loan data found", data: { loanDataRows: [] }, });


      // 5️⃣ Transform loan data (single record)
      const loanData = rows.map(row => {
        let parsedOptions = {};
        parsedOptions = JSON.parse(row.options);

        return {
          ...row,
          itemImage: `${config.imageUrl}${row.itemImage}`,
          options: parsedOptions,
        };
      });

      // 6️⃣ Success response
      return res.status(200).json({ success: true, status: 200, message: "Successfully fetched loan data details", data: { loanData: loanData[0] }, });
    } catch (error) {
      logger.error(`Error in getLoanTypeDetails :: ${error}`);
      return res.status(500).json({ success: false, status: 500, message: "Internal Server error!", data: {}, });
    }
  },

  getLoanTypes: async (req, res) => {
    try {
      // 1️⃣ Get language
      const lang = req.headers["language"] || req.headers["Language"];

      // 2️⃣ Decide table based on language
      const tableName = lang === "en" ? "loan_data" : "loan_data_hi";

      // 3️⃣ Fetch loan types
      const [rows] = await pool.promise().execute(`SELECT * FROM ${tableName}`);

      // 4️⃣ If no data found
      if (!rows.length)
        return res.status(404).json({ success: false, status: 404, message: "No loan type data found", data: { loanDataRows: [] }, });


      // 5️⃣ Map required fields only
      const loanData = rows.map(row => ({
        id: row.id,
        loanType: row.loanType,
        itemImage: `${config.imageUrl}${row.itemImage}`,
        color: row.color,
        url: row.url,
      }));

      // 6️⃣ Success response
      return res.status(200).json({ success: true, status: 200, message: "Successfully fetched loan type details", data: { loanData }, });
    } catch (error) {
      logger.error(`Error in getLoanTypes :: ${error}`);
      return res.status(500).json({ success: false, status: 500, message: "Internal Server error!", data: {}, });
    }
  },

  getFaq: async (req, res) => {
    try {
      // 1️⃣ Get language
      const lang = req.headers["language"] || req.headers["Language"];

      // 2️⃣ Decide table based on language
      const tableName = lang === "en" ? "faq" : "faq_hi";

      // 3️⃣ Fetch FAQ data
      const [rows] = await pool.promise().execute(`SELECT * FROM ${tableName}`);

      // 4️⃣ If no data found
      if (!rows.length)
        return res.status(404).json({ success: false, status: 404, message: "No data found", data: { faqDataRow: [] }, });

      // 5️⃣ Parse answer JSON safely
      const faqData = rows.map(row => {
        let parsedAnswer = {};
        parsedAnswer = JSON.parse(row.answer);

        return {
          ...row,
          answer: parsedAnswer,
        };
      });

      // 6️⃣ Success response
      return res.status(200).json({ success: true, status: 200, message: "Successfully fetched faq data details", data: { faqData }, });
    } catch (error) {
      logger.error(`Error in getFaq :: ${error}`);
      return res.status(500).json({ success: false, status: 500, message: "Internal Server error!", data: {}, });
    }
  },

  getAboutUs: async (req, res) => {
    try {
      // 1️⃣ Get language
      const lang = req.headers["language"] || req.headers["Language"];

      // 2️⃣ Decide table based on language
      const tableName = lang === "en" ? "about_us_data" : "about_us_data_hi";

      // 3️⃣ Fetch about-us data
      const [rows] = await pool.promise().execute(`SELECT * FROM ${tableName}`);

      // 4️⃣ If no data found
      if (!rows.length)
        return res.status(404).json({ success: false, status: 404, message: "No data found", data: { aboutUsRows: [] }, });

      // 5️⃣ Parse options JSON and append image URL
      const aboutUsDataArray = rows.map(item => {
        let parsedOptions = {};
        parsedOptions = JSON.parse(item.options);

        return {
          ...item,
          options: parsedOptions,
          image: `${config.imageUrl}${item.image}`,
        };
      });

      // 6️⃣ Use first record (single entry table)
      const aboutUsData = aboutUsDataArray[0];

      // 7️⃣ Success response
      return res.status(200).json({ success: true, status: 200, message: "Successfully fetched about us data", data: { aboutUsData }, });
    } catch (error) {
      logger.error(`Error in getAboutUs :: ${error}`);
      return res.status(500).json({ success: false, status: 500, message: "Internal Server error!", data: {}, });
    }
  },

  getPrivacyPolicyData: async (req, res) => {
    try {
      // 1️⃣ Get language
      const lang = req.headers["language"] || req.headers["Language"];

      // 2️⃣ Decide table based on language
      const tableName = lang === "en" ? "privacy_policy" : "privacy_policy_hi";

      // 3️⃣ Fetch privacy policy data
      const [rows] = await pool.promise().execute(`SELECT * FROM ${tableName}`);

      // 4️⃣ If no data found
      if (!rows.length)
        return res.status(404).json({ success: false, status: 404, message: "No data found", data: { privacyPolicyRows: [] }, });

      // 5️⃣ Parse options JSON and append image URL
      const privacyPolicyArray = rows.map(item => {
        let parsedOptions = {};
        parsedOptions = JSON.parse(item.options);
        return {
          ...item,
          options: parsedOptions,
          image: `${config.imageUrl}${item.image}`,
        };
      });

      // 6️⃣ Use first record (single entry table)
      const privacyPolicyData = privacyPolicyArray[0];

      // 7️⃣ Success response
      return res.status(200).json({ success: true, status: 200, message: "Successfully fetched about us data", data: { privacyPolicyData }, });
    } catch (error) {
      logger.error(`Error in getPrivacyPolicyData :: ${error}`);
      return res.status(500).json({ success: false, status: 500, message: "Internal Server error!", data: {}, });
    }
  },

  getFeeAndCharges: async (req, res) => {
    try {
      // 1️⃣ Get language
      const lang = req.headers["language"] || req.headers["Language"];

      // 2️⃣ Decide table based on language
      const tableName = lang === "en" ? "fees_and_charges" : "fees_and_charges_hi";

      // 3️⃣ Fetch fee & charges data
      const [rows] = await pool.promise().execute(`SELECT * FROM ${tableName}`);

      // 4️⃣ Extract required fields (single row)
      const details = rows?.[0]?.options;
      const bullet = rows?.[0]?.bullets;

      // 5️⃣ If data exists
      if (rows.length > 0)
        return res.status(200).json({ success: true, status: 200, message: "Successfully fetched fee and charges data", data: { details, bullet }, });

      // 6️⃣ No data found
      return res.status(200).json({ success: false, status: 200, message: "No data found", });
    } catch (error) {
      logger.error(`Error in getFeeAndCharges :: ${error}`);
      return res.status(500).json({ success: false, status: 500, message: "Internal Server error!", data: {}, });
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
