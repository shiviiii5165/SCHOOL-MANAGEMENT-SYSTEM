import { v2 as cloudinary } from 'cloudinary';

// Cloudinary reads the CLOUDINARY_URL from process.env automatically if available,
// but we explicitly configure it here just to be sure.
cloudinary.config({
  secure: true,
});

export interface UploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
}

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = 'educore'
): Promise<UploadResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // Auto detects if it's image, video, or raw file (PDFs etc)
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Upload failed'));
        }
        resolve(result as UploadResponse);
      }
    );

    uploadStream.end(fileBuffer);
  });
};
