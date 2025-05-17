require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { sendApprovalEmail } = require('../utils/email')

async function testEmail() {
   console.log(process.env.NODEMAILER_EMAIL, process.env.NODEMAILER_PASS
    )
  try {
    await sendApprovalEmail('rutaganir33@gmail.com', 'A3', { plate_number: 'RAH412U' });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email error:', error);
  }
}

testEmail();