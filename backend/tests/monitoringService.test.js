import { beforeAll, afterAll, describe, test, expect } from 'vitest';
const mongoose = require('mongoose');
const Monitoring = require('../models/monitoringModel');
const MonitoringService = require('../services/monitoringService');
const User = require('../models/userModel');

// parameters
const userId = "67dd633041a25940eabca458"; // UPDATE this with yours
let monitoring;

// Establish a MongoDB memory server connection
// Connect to the database before running any tests
beforeAll(async () => {
    const localUri = "mongodb://localhost:27017/test_digitaltrainingcompanion";
    await mongoose.connect(localUri);
    await User.findByIdAndUpdate(
        userId,
        {
            _id: userId,
            firstName: 'Test',
            lastName: 'User',
            email: 'test.user@example.com',
            password: 'secret',
            termsAccepted: true,
            userStatus: 'Teacher',
            isVerified: true
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // create a monitoring
    const monitoringData = {
        orderId: 1,
        userId: userId,
        name: 'Test Monitoring',
        description: 'This is a test monitoring',
        creationDate: new Date(),
        lastModification: new Date(),
    };
    monitoring = await new Monitoring(monitoringData).save();
});

// Disconnect and stop memory server
afterAll(async () => {
    await Monitoring.deleteMany({});
    await User.deleteOne({ _id: userId });
    // disconnect the db
    await mongoose.disconnect();
});


describe('Monitoring Service', () => {
    
    test('createMonitoring adds a monitoring to the database', async () => {
        const createdMonitoringData = {
            orderId: 2,
            userId: userId,
            name: 'Test Monitoring 2',
            description: 'This is another test monitoring',
            creationDate: new Date(),
            lastModification: new Date(),
        };
    
        const createdMonitoring = await MonitoringService.createMonitoring(createdMonitoringData);
        expect(createdMonitoring).toBeDefined();
        expect(createdMonitoring.name).toEqual(createdMonitoringData.name);
    });
    
    // Test for fetching monitorings by user ID
    test('getMonitoringsByUserId fetches monitorings for a specific user', async () => {
        const monitorings = await MonitoringService.getMonitoringsByUserId(userId);

        expect(monitorings).toBeDefined();
    });

    // Updating a monitoring document
    test('updateMonitoring updates a monitoring document', async () => {
        // Assume we have an existing monitoringId
        const updatedMonitoringData = { name: 'Updated Monitoring Name' };

        const updatedMonitoring = await MonitoringService.updateMonitoring(monitoring._id, updatedMonitoringData);
        expect(updatedMonitoring).toBeDefined();
        expect(updatedMonitoring.name).toBe(updatedMonitoringData.name);
    });

    // Deleting a monitoringq document
    test('deleteMonitoring deletes a monitoring document', async () => {
        // First, let's verify that the monitoring exists
        expect(monitoring).toBeDefined();

        // Then, let's delete the monitoring and verify that it was deleted successfully
        await MonitoringService.deleteMonitoring(monitoring._id);
        const monitoringPostDeletion = await Monitoring.findById(monitoring._id);
        expect(monitoringPostDeletion).toBeNull(); // This verifies the monitoring was actually deleted
    });
});