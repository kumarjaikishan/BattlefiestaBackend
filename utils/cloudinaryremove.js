const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your cloud name, API key, and API secret
cloudinary.config({
    cloud_name: 'dusxlxlvm',
    api_key: process.env.api_key  ,
    api_secret: process.env.api_secret
});

/**
 * Remove a photo from Cloudinary by its secure URL
 * @param {string} secureUrl - The secure URL of the photo to be removed
 * @returns {Promise} A Promise that resolves with the result of the removal
 */
const removePhotoBySecureUrl = async (secureUrlArray) => {
    try {
        const deletionPromises = secureUrlArray.map(async (url) => {
            const splitted = url.split('/');
            const publicId = splitted[splitted.length - 1].split('.')[0];
            // console.log(publicId);

            const result = await cloudinary.uploader.destroy(publicId);
            return { publicId, result };
        });

        const results = await Promise.all(deletionPromises);
        return results;
    } catch (error) {
        throw error;
    }
};

module.exports = removePhotoBySecureUrl;
