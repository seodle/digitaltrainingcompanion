const crypto = require('crypto');

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;  // Your provided key

// Ensure that the key is exactly 32 bytes (256 bits) by hashing with SHA-256
const getValidEncryptionKey = (key) => {
    const safeKey = key || '';
    return crypto.createHash('sha256').update(safeKey).digest(); // 32 bytes
};

// AES-256-CBC requires a 32-byte key
const IV_LENGTH = 16; // For AES, this is always 16
const ALGORITHM = 'aes-256-cbc';

// Encrypt function
const encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getValidEncryptionKey(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Decrypt function
const decrypt = (text) => {
    const textParts = text.split(':');  // Split the iv and encrypted data
    const iv = Buffer.from(textParts.shift(), 'hex');  // First part is the IV (hex to buffer)
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');  // Second part is the encrypted data

    const decipher = crypto.createDecipheriv(ALGORITHM, getValidEncryptionKey(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);  // Decrypt the data
    decrypted = Buffer.concat([decrypted, decipher.final()]);  // Finalize the decryption

    return decrypted.toString();  // Return the decrypted plaintext
};

// Generate a secure API key
const generateApiKey = () => {
    const keyBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString();
    const hash = crypto.createHash('sha256')
        .update(keyBytes + timestamp)
        .digest('hex');
    return `dtc_${hash}`;
};

module.exports = {
    encrypt, decrypt, generateApiKey, getValidEncryptionKey
};
