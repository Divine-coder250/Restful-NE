const result = require('dotenv').config({path:'C:/Users/linca/OneDrive/Documents/NE/restful/vehicle_pms_with_no_tailwind_conflicts_npm/backend/.env'});
if(result.error){
    console.error('Error loading .env file:', result.error);
} else {
    console.log('.env file loaded successfully');
}
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('NODEMAILER_EMAIL:', process.env.NODEMAILER_EMAIL);
console.log('NODEMAILER_PASS:', process.env.NODEMAILER_PASS);