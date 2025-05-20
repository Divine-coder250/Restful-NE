const nodemailer = require('nodemailer');

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  logger: true,
  debug: true,
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', {
      error: error.message,
      stack: error.stack,
    });
  } else {
    console.log('SMTP connection verified successfully');
  }
});

const sendApprovalEmail = async (to, slotNumber, vehicle, location) => {
  if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASS) {
    throw new Error('Nodemailer credentials not configured in .env');
  }

  console.log('Sending approval email:', { to, slotNumber, plate_number: vehicle.plate_number, location });

  const mailOptions = {
    from: `"Vehicle Parking System" <${process.env.NODEMAILER_EMAIL}>`,
    to,
    subject: 'Parking Slot Approval',
    text: `Your parking slot request for vehicle ${vehicle.plate_number} has been approved. Assigned slot: ${slotNumber}. Location: ${location}.`,
    html: `
      <h2>Parking Slot Approval</h2>
      <p>Your parking slot request for vehicle <strong>${vehicle.plate_number}</strong> has been approved.</p>
      <p><strong>Assigned Slot:</strong> ${slotNumber}</p>
      <p><strong>Location:</strong> ${location}</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Approval email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending approval email:', {
      error: error.message,
      stack: error.stack,
      to,
      slotNumber,
      plate_number: vehicle.plate_number,
      location
    });
    throw error;
  }
};

const sendRejectionEmail = async (to, vehicle, location, reason) => {
  if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASS) {
    throw new Error('Nodemailer credentials not configured in .env');
  }

  console.log('Sending rejection email:', { to, plate_number: vehicle.plate_number, location, reason });

  const mailOptions = {
    from: `"Vehicle Parking System" <${process.env.NODEMAILER_EMAIL}>`,
    to,
    subject: 'Parking Slot Request Rejected',
    text: `Your parking slot request for vehicle ${vehicle.plate_number} at ${location} has been rejected. Reason: ${reason}.`,
    html: `
      <h2>Parking Slot Request Rejected</h2>
      <p>Your parking slot request for vehicle <strong>${vehicle.plate_number}</strong> at <strong>${location}</strong> has been rejected.</p>
      <p><strong>Reason:</strong> ${reason}</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending rejection email:', {
      error: error.message,
      stack: error.stack,
      to,
      plate_number: vehicle.plate_number,
      location,
      reason
    });
    throw error;
  }
};

const sendPaymentSuccessEmail = async (to, vehicle, slotNumber, location, amount) => {
  if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASS) {
    throw new Error('Nodemailer credentials not configured in .env');
  }

  console.log('Sending payment success email:', { to, slotNumber, plate_number: vehicle.plate_number, location, amount });

  const mailOptions = {
    from: `"Vehicle Parking System" <${process.env.NODEMAILER_EMAIL}>`,
    to,
    subject: 'Parking Payment Successful',
    text: `Your payment of ${amount} for parking slot ${slotNumber} at ${location} for vehicle ${vehicle.plate_number} has been processed successfully. You may now enter the parking area.`,
    html: `
      <h2>Parking Payment Successful</h2>
      <p>Your payment of <strong>${amount}</strong> for parking slot <strong>${slotNumber}</strong> at <strong>${location}</strong> for vehicle <strong>${vehicle.plate_number}</strong> has been processed successfully.</p>
      <p>You may now enter the parking area.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Payment success email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending payment success email:', {
      error: error.message,
      stack: error.stack,
      to,
      slotNumber,
      plate_number: vehicle.plate_number,
      location,
      amount
    });
    throw error;
  }
};

const sendOtpEmail = async (to, otpCode) => {
  if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASS) {
    throw new Error('Nodemailer credentials not configured in .env');
  }

  console.log('Sending OTP email:', { to, otpCode });

  const mailOptions = {
    from: `"Vehicle Parking System" <${process.env.NODEMAILER_EMAIL}>`,
    to,
    subject: 'Your OTP for Account Verification',
    text: `Your OTP code for account verification is ${otpCode}. It is valid for 5 minutes.`,
    html: `
      <h2>Your OTP for Account Verification</h2>
      <p>Your OTP code is <strong>${otpCode}</strong>.</p>
      <p>It is valid for 5 minutes.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', {
      error: error.message,
      stack: error.stack,
      to,
      otpCode
    });
    throw error;
  }
};

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail,
  sendPaymentSuccessEmail,
  sendOtpEmail
};