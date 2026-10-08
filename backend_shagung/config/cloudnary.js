import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || 'dsgktwwae',
  api_key: process.env.API_KEY || '628182455436232',
  api_secret: process.env.API_SECRET || 'U74VI2v2IXtxLw6aT9onk5w16hE',
  secure: true
});

export default cloudinary;