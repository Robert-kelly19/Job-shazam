import {v2 as cloudinary} from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const CloudinaryStore = new CloudinaryStorage({
    cloudinary,
    params : async (req, file) => ({
        folder: 'cvs',
        resource_type : 'raw',
        format :  file.originalname.split('.').pop(),
        public_id : `${Date.now()}-${file.originalname}`,
    }),
})