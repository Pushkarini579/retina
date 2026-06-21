const fs = require('fs');
const path = require('path');

// Path to the uploads folder (server/uploads)
const uploadsDir = path.join(__dirname, '..', 'uploads');

// How old a file must be before we delete it (in milliseconds)
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function cleanupOldUploads() {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error('❌ Cleanup: failed to read uploads directory:', err.message);
            return;
        }

        const now = Date.now();

        files.forEach((file) => {
            const filePath = path.join(uploadsDir, file);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`❌ Cleanup: failed to stat file ${file}:`, err.message);
                    return;
                }

                const fileAge = now - stats.mtimeMs;

                if (fileAge > MAX_AGE_MS) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error(`❌ Cleanup: failed to delete ${file}:`, err.message);
                        } else {
                            console.log(`🗑️ Cleanup: deleted old file ${file}`);
                        }
                    });
                }
            });
        });
    });
}

module.exports = cleanupOldUploads;