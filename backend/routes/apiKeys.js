const router = require("express").Router();
const ApiKey = require('../models/apiKeysModel');
const { generateApiKey } = require('../services/apiKeyService');
const { requireApiKeyOwner } = require('../middleware/authorization');

// List current user's API keys
router.get('/', async (req, res) => {
    try {
        const apiKeys = await ApiKey.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        const formattedKeys = apiKeys.map(key => {
            const keyObj = key.toObject();
            try {
                const fullKey = keyObj.key;
                return {
                    ...keyObj,
                    displayKey: `${fullKey.substring(0, 8)}...${fullKey.substring(fullKey.length - 4)}`,
                    key: fullKey
                };
            } catch (error) {
                console.error('Error getting key:', error);
                return {
                    ...keyObj,
                    displayKey: 'Error getting key',
                    key: null
                };
            }
        });

        res.json(formattedKeys);
    } catch (error) {
        console.error('Error fetching API keys:', error);
        res.status(500).json({ error: 'Error fetching API keys' });
    }
});

// Create new API key
router.post('/', async (req, res) => {
    try {
        // Check if user already has an API key
        const keyCount = await ApiKey.countDocuments({ userId: req.user._id });
        if (keyCount > 0) {
            return res.status(400).json({ error: 'You can only have one API key at a time' });
        }

        if (!req.body.name) {
            return res.status(400).json({ error: 'Key name is required' });
        }

        // Generate and encrypt the API key
        const plainKey = generateApiKey();

        const apiKey = new ApiKey({
            userId: req.user._id,
            name: req.body.name.trim(),
            key: plainKey,
            permissions: 'restricted'
        });

        const savedKey = await apiKey.save();

        // Return the unencrypted key only during creation
        res.status(201).json({
            ...savedKey.toObject(),
            key: plainKey // Send the unencrypted key only once
        });
    } catch (error) {
        console.error('Error creating API key:', error);
        if (error.code === 11000) {
            res.status(400).json({ error: 'A key with this name already exists' });
        } else {
            res.status(500).json({ error: 'Error creating API key' });
        }
    }
});

// Delete API key
router.delete('/:apiKeyId', requireApiKeyOwner('apiKeyId'), async (req, res) => {
    try {
        const apiKey = await ApiKey.findOneAndDelete({ _id: req.params.apiKeyId });

        if (!apiKey) {
            return res.status(404).json({ error: 'API key not found' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting API key:', error);
        res.status(500).json({ error: 'Error deleting API key' });
    }
});

module.exports = router;