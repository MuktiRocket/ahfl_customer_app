const crypto = require('crypto');

module.exports = {
    encrypt: (message, salt) => {
        const algorithm = process.env.ENCRYPTION_ALGO
        const encryptKey = crypto.scryptSync(salt, 'salt', 32); // 32 bytes key for AES-256
        const iv = crypto.randomBytes(12); // 12 bytes IV for AES-GCM
        //console.log({ message })

        const encryptedData = {}
        for (const [key, value] of Object.entries(message)) {
            if (value == null) {
                encryptedData[key] = null;
                continue;
            }
            const cipher = crypto.createCipheriv(algorithm, encryptKey, iv)

            let encryptedValue = cipher.update(value, 'utf-8', 'hex')
            encryptedValue += cipher.final('hex')

            const authTag = cipher.getAuthTag().toString('hex')

            encryptedData[key] = `${iv.toString('hex')}:${authTag}:${encryptedValue}`

        }

        //console.log(encryptedData)
        return encryptedData
    },

    decryptData: (message, salt) => {
        const algorithm = process.env.ENCRYPTION_ALGO
        const key = crypto.scryptSync(salt, 'salt', 32);

        const decryptedData = {};
        for (const [field, value] of Object.entries(message)) {
            if (!value) {
                decryptedData[field] = value;
                //console.log(`Skipping field ${field} as it contains null or undefined`);
                continue;
            }

            try {
                const [ivHex, authTagHex, encryptedData] = value.split(':');

                if (!ivHex || !authTagHex || !encryptedData) {
                    //console.log(`Invalid data format for field ${field}`);
                    decryptedData[field] = null; // Or handle as you prefer
                    continue;
                }

                const iv = Buffer.from(ivHex, 'hex');
                const authTag = Buffer.from(authTagHex, 'hex');
                const decipher = crypto.createDecipheriv(algorithm, key, iv);
                decipher.setAuthTag(authTag);

                let decData = decipher.update(encryptedData, 'hex', 'utf-8');
                decData += decipher.final('utf-8');
                decryptedData[field] = decData;
                //console.log(`Decrypted data for field ${field}:`, decData);
            } catch (error) {
                //console.log(`Decryption failed for field ${field}:`, error.message);
                decryptedData[field] = null;
            }
        }

        //console.log('Final decrypted data:', decryptedData);
        return decryptedData;

    }

}
