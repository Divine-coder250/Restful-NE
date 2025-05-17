const { sendOtpEmail } = require('../utils/email');

sendOtpEmail('giselemigisha53@gmail.com', '123456')
  .then(() => console.log('OTP email sent'))
  .catch(err => console.error('OTP failed:', err));
