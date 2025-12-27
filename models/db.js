const mysql = require("mysql2");
const fs = require("fs");

//const sslOptions = {
//    key: fs.readFileSync('../SSL/private.key'), // Your private key
//    cert: fs.readFileSync('../SSL/star_aadharhousing_com_2048.cer'), // Your SSL certificate
//    ca: fs.readFileSync('../SSL/chain.cer'), // The certificate chain (optional)
//};


//database connection
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || "10.120.2.12",
  user: process.env.DB_USER || "cmsdbadmin",
  password: process.env.DB_PASSWORD || "Cmsprod@123",
  database: process.env.DB_DATABASE || "ahfl_prod_db",
  //ssl : sslOptions
});

pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    } else if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    } else {
      console.error('Database connection failed: ', err);
    }
  }

  if (connection) {
    //console.log('Successfully connected to the database.');
    connection.release();
  }
});

module.exports = { pool, promise: pool.promise() };







