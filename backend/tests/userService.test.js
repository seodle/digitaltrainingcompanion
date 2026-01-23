import { beforeAll, afterAll, describe, test, expect } from 'vitest';
const mongoose = require('mongoose');
const Monitoring = require('../models/monitoringModel');
const User = require('../models/userModel');
const UserService = require('../services/userService');
const MonitoringService = require('../services/monitoringService');

const generateSharingCode = () => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };
// Existing user ID
const userId = "67dd633041a25940eabca458"; // UPDATE this with yours
const sharingCode = generateSharingCode();
let monitoring;

beforeAll(async () => {

    const localUri = "mongodb://localhost:27017/test_digitaltrainingcompanion";
    await mongoose.connect(localUri);


    // create a monitoring with a sharing code
    const monitoringData = {
        orderId: 1,
        userId: userId,
        name: 'Monitoring to share',
        description: 'This is a shared monitoring',
        creationDate: new Date(),
        lastModification: new Date(),
        sharingCode: sharingCode,
    };
    monitoring = await MonitoringService.createMonitoring(monitoringData);
});

afterAll(async () => {
    // remove the sharing code from the user if already exists
    await User.updateOne({ _id: userId }, { $set: { sharingCodeRedeemed: [] } });
    await Monitoring.deleteMany({});
    // await MonitoringService.deleteMonitoring(monitoringId);
    // remove the sharing code from the user if already exists
    // await UserService.removeSharingCodeFromUser(userId, sharingCode);

    await mongoose.disconnect();
});

describe('User Service', () => {

    test('getUserWithId retrieves an existing user', async () => {
        const user = await UserService.getUserWithId(userId);
        expect(user).toBeDefined();
        expect(user._id.toString()).toBe(userId);
    });

    test('appendSharingCodeToUser appends a new sharing code', async () => {

        // append the code to the user
        const result = await UserService.appendSharingCodeToUser(userId, sharingCode);
        
        expect(result).toBeDefined();
        expect(result.result.sharingCodeRedeemed).toContain(sharingCode);
    });

    test('appendSharingCodeToUser fails if sharing code does not exist', async () => {

        const result = await UserService.appendSharingCodeToUser(userId, "ABCD132");
        expect(result).toBeDefined();
        expect(result.error).toBe('No sharing code found in any monitoring');
        expect(result.status).toBe(404);
    });


    test('appendSharingCodeToUser does not append a duplicate code', async () => {
        console.log("######### 1 - monitoring.sharingCode", monitoring.sharingCode)
        const result1 = await UserService.appendSharingCodeToUser(userId, monitoring.sharingCode);  // Append once
        const result2 = await UserService.appendSharingCodeToUser(userId, monitoring.sharingCode); // Try to append again

        console.log("######### 2 - monitoring.sharingCode", monitoring.sharingCode)
        console.log("######### RESULT 2", result2)

        expect(result2.error).toBe('This code has already been redeemed by the user');
        expect(result2.status).toBe(409);
    });
});