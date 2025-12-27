const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const saltRounds = 10;

const generateToken = (data) => {
  try {
    const token = jwt.sign(data, process.env.SECRET_KEY, { expiresIn: "1h" });
    return token;
  } catch (error) {
    console.log("Error in generating JWT token :", error);
  }
};

const hashing = async (data) => {
  try {
    const hashedData = await bcrypt.hash(data, saltRounds);
    return hashedData;
  } catch (error) {
    console.log("Error in hash the data:", error);
  }
};

module.exports = { generateToken, hashing };
