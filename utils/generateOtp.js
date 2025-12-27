// Generate a random 4-digit OTP
function generateRandomOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


//format loanaccountnumber to 11 digit
function formatLoanAccountNumber(accountNumber) {

  let accountStr = accountNumber.toString();

  if (accountStr.length > 11) {
    accountStr = accountStr.slice(-11);
  }

  // If the length is less than 11, pad with leading zeros
  while (accountStr.length < 11) {
    accountStr = '0' + accountStr;
  }

  return accountStr;
}

module.exports = { generateRandomOtp, formatLoanAccountNumber };
