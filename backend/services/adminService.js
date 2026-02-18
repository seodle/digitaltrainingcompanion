const mongoose = require("mongoose");
const Users = require('../models/userModel');
const Logs = require('../models/logModel');
const Responses = require('../models/responseModel');
const Monitorings = require('../models/monitoringModel');
const Assessments = require('../models/assessmentModel');


// Fetch user history
const fetchUserHistory = async (page, limit) => {
    const skip = parseInt(page) * parseInt(limit);
    return Responses
        .find({})
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ creationDate: -1 });
};

// Helper function to get user growth data by month
async function getUserGrowthData() {
    try {
        // Get all users and calculate registration date from _id
        const users = await Users.find({}).select('_id');

        // Calculate registration date from _id for each user and group by month/year
        const usersByMonth = {};

        users.forEach(user => {
            // Calculate registration date from MongoDB _id
            const timestamp = user._id.toString().substring(0, 8);
            const registrationDate = new Date(parseInt(timestamp, 16) * 1000);

            // Group by year-month
            const year = registrationDate.getFullYear();
            const month = registrationDate.getMonth() + 1; // getMonth() returns 0-11
            const key = `${year}-${month.toString().padStart(2, '0')}`;

            if (!usersByMonth[key]) {
                usersByMonth[key] = {
                    year,
                    month,
                    newUsers: 0
                };
            }
            usersByMonth[key].newUsers++;
        });

        // Convert to array and sort by year-month
        const result = Object.values(usersByMonth).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        // Format month names
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        return result.map(item => ({
            month: `${monthNames[item.month - 1]} ${item.year}`,
            newUsers: item.newUsers,
        }));
    } catch (error) {
        console.error('Error in getUserGrowthData:', error);
        return [];
    }
}

// Helper function to get monitoring growth data by month
async function getMonitoringGrowthData() {
    try {
        const monitorings = await Monitorings.find({}).select('_id creationDate name');

        const monitoringsByMonth = {};

        monitorings.forEach(monitoring => {
            // Use creationDate if available, otherwise calculate from _id MongoDB
            let creationDate;
            if (monitoring.creationDate) {
                creationDate = new Date(monitoring.creationDate);
            } else {
                const timestamp = monitoring._id.toString().substring(0, 8);
                creationDate = new Date(parseInt(timestamp, 16) * 1000);
            }

            const year = creationDate.getFullYear();
            const month = creationDate.getMonth() + 1;
            const key = `${year}-${month.toString().padStart(2, '0')}`;

            if (!monitoringsByMonth[key]) {
                monitoringsByMonth[key] = {
                    year,
                    month,
                    count: 0
                };
            }
            monitoringsByMonth[key].count++;
        });

        const result = Object.values(monitoringsByMonth).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        return result.map(item => ({
            month: `${monthNames[item.month - 1]} ${item.year}`,
            count: item.count,
        }));
    } catch (error) {
        console.error('Error in getMonitoringGrowthData:', error);
        return [];
    }
}

// Helper function to get assessment growth data by month
async function getAssessmentGrowthData() {
    try {
        const assessments = await Assessments.find({}).select('_id creationDate name');

        const assessmentsByMonth = {};

        assessments.forEach(assessment => {
            // Use creationDate if available, otherwise calculate from _id MongoDB
            let creationDate;
            if (assessment.creationDate) {
                creationDate = new Date(assessment.creationDate);
            } else {
                const timestamp = assessment._id.toString().substring(0, 8);
                creationDate = new Date(parseInt(timestamp, 16) * 1000);
            }

            const year = creationDate.getFullYear();
            const month = creationDate.getMonth() + 1;
            const key = `${year}-${month.toString().padStart(2, '0')}`;

            if (!assessmentsByMonth[key]) {
                assessmentsByMonth[key] = {
                    year,
                    month,
                    count: 0
                };
            }
            assessmentsByMonth[key].count++;
        });

        const result = Object.values(assessmentsByMonth).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        return result.map(item => ({
            month: `${monthNames[item.month - 1]} ${item.year}`,
            count: item.count,
        }));
    } catch (error) {
        console.error('Error in getAssessmentGrowthData:', error);
        return [];
    }
}

// Helper function to get unique monitoring names with creator information
async function getMonitoringNames() {
    try {
        const monitorings = await Monitorings.find({})
            .select('name userId')
            .lean();

        // Get all unique user IDs
        const userIds = [...new Set(monitorings.map(m => m.userId).filter(id => id))];

        // Fetch users separately
        const users = await Users.find({ _id: { $in: userIds } })
            .select('firstName lastName email')
            .lean();

        // Create a map for quick user lookup
        const userMap = new Map();
        users.forEach(user => {
            userMap.set(user._id.toString(), user);
        });

        // Group by monitoring name and collect creator information
        const monitoringMap = new Map();

        monitorings.forEach(monitoring => {
            if (!monitoring.name) return;

            let creatorName = 'Unknown';
            if (monitoring.userId) {
                const user = userMap.get(monitoring.userId.toString());
                if (user) {
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    creatorName = fullName || user.email || 'Unknown';
                }
            }

            if (!monitoringMap.has(monitoring.name)) {
                monitoringMap.set(monitoring.name, {
                    name: monitoring.name,
                    creators: new Set()
                });
            }

            monitoringMap.get(monitoring.name).creators.add(creatorName);
        });

        // Convert to array format
        const result = Array.from(monitoringMap.values()).map(item => ({
            name: item.name,
            creators: Array.from(item.creators).sort()
        }));

        // Sort by monitoring name
        return result.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('Error in getMonitoringNames:', error);
        return [];
    }
}

// Helper function to get unique assessment names
async function getAssessmentNames() {
    try {
        const assessments = await Assessments.find({}).select('name');
        const uniqueNames = [...new Set(assessments.map(a => a.name).filter(name => name))];
        return uniqueNames.sort();
    } catch (error) {
        console.error('Error in getAssessmentNames:', error);
        return [];
    }
}

// Helper function to get assessment types distribution
async function getAssessmentTypesDistribution() {
    try {
        const result = await Assessments.aggregate([
            {
                $match: { type: { $exists: true, $ne: null, $ne: '' } }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $project: {
                    type: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);
        return result;
    } catch (error) {
        console.error('Error in getAssessmentTypesDistribution:', error);
        return [];
    }
}

// Helper function to get response growth data by month
async function getResponseGrowthData() {
    try {
        const responses = await Responses.find({}).select('_id completionDate');

        const responsesByMonth = {};

        responses.forEach(response => {
            // Use completionDate if available, otherwise calculate from _id MongoDB
            let completionDate;
            if (response.completionDate) {
                completionDate = new Date(response.completionDate);
            } else {
                const timestamp = response._id.toString().substring(0, 8);
                completionDate = new Date(parseInt(timestamp, 16) * 1000);
            }

            const year = completionDate.getFullYear();
            const month = completionDate.getMonth() + 1;
            const key = `${year}-${month.toString().padStart(2, '0')}`;

            if (!responsesByMonth[key]) {
                responsesByMonth[key] = {
                    year,
                    month,
                    count: 0
                };
            }
            responsesByMonth[key].count++;
        });

        const result = Object.values(responsesByMonth).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        return result.map(item => ({
            month: `${monthNames[item.month - 1]} ${item.year}`,
            count: item.count,
        }));
    } catch (error) {
        console.error('Error in getResponseGrowthData:', error);
        return [];
    }
}

const fetchAdminStats = async () => {
    try {
        const [users, logs, responses, monitorings, assessments] = await Promise.all([
            Users.find({}),
            Logs.find({}),
            Responses.find({}),
            Monitorings.find({}),
            Assessments.find({})
        ]);

        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        // Calculate active users (users who have responses in the last 2 months)
        const activeUserIds = await Responses.distinct('userId', {
            completionDate: { $gte: twoMonthsAgo }
        });
        const activeUsersCount = activeUserIds.length;

        // Get active users details
        const activeUsers = await Users.find({ _id: { $in: activeUserIds } })
            .select('firstName lastName email sandbox userStatus')
            .lean();

        // Format active users with registration date from _id
        const activeUsersWithDate = activeUsers.map(user => {
            const timestamp = user._id.toString().substring(0, 8);
            const registrationDate = new Date(parseInt(timestamp, 16) * 1000);
            return {
                ...user,
                registrationDate: registrationDate
            };
        }).sort((a, b) => b.registrationDate - a.registrationDate); // Sort by most recent first

        const [userGrowth, responseGrowth, monitoringGrowth, assessmentGrowth, monitoringNames, assessmentNames, assessmentTypesDistribution] = await Promise.all([
            getUserGrowthData(),
            getResponseGrowthData(),
            getMonitoringGrowthData(),
            getAssessmentGrowthData(),
            getMonitoringNames(),
            getAssessmentNames(),
            getAssessmentTypesDistribution()
        ]);

        return {
            totalUsers: users.length,
            totalResponses: responses.length,
            totalMonitorings: monitorings.length,
            totalAssessments: assessments.length,
            activeUsers: activeUsersCount,
            activeUsersList: activeUsersWithDate,
            newUsersDay: users.filter(u => u.creationDate >= todayStart).length,
            newUsersWeek: users.filter(u => u.creationDate >= weekAgo).length,
            newUsersMonth: users.filter(u => u.creationDate >= monthAgo).length,
            userGrowth,
            responseGrowth,
            monitoringGrowth,
            assessmentGrowth,
            monitoringNames,
            assessmentNames,
            assessmentTypesDistribution,
            userStatusPie: [
                { name: 'Regular', value: users.filter(u => u.sandbox === false).length },
                { name: 'Sandbox', value: users.filter(u => u.sandbox === true).length }
            ]
        };
    } catch (error) {
        console.error('Error in fetchAdminStats:', error);
        return {
            totalUsers: 0,
            totalResponses: 0,
            totalMonitorings: 0,
            totalAssessments: 0,
            activeUsers: 0,
            activeUsersList: [],
            newUsersDay: 0,
            newUsersWeek: 0,
            newUsersMonth: 0,
            deletedAccounts: 0,
            userGrowth: [],
            responseGrowth: [],
            monitoringGrowth: [],
            assessmentGrowth: [],
            monitoringNames: [],
            assessmentNames: [],
            assessmentTypesDistribution: [],
            userStatusPie: []
        };
    }
};


// Fetch database records with pagination and filtering
const fetchDatabaseRecords = async (page, limit, filter = "") => {
    const skip = parseInt(page) * parseInt(limit);

    const query = filter
        ? { answer: { $regex: filter, $options: "i" } }
        : {};

    return Responses.find(query).skip(skip).limit(parseInt(limit));
};

// Delete a specific record from the database
const deleteRecord = async (id) => {
    return Responses.findByIdAndDelete(id) !== null;
};

// Fetch users with registration date calculated from MongoDB _id
const fetchUsersWithRegistrationDate = async (page, limit) => {
    try {
        // Get all users first to calculate registration date and sort properly
        const allUsers = await Users.find({})
            .select('firstName lastName email sandbox userStatus')
            .lean();

        // Calculate registration date from _id and sort by most recent first
        const usersWithDate = allUsers.map(user => {
            const timestamp = user._id.toString().substring(0, 8);
            const registrationDate = new Date(parseInt(timestamp, 16) * 1000);
            return {
                ...user,
                registrationDate: registrationDate
            };
        }).sort((a, b) => b.registrationDate - a.registrationDate); // Sort by most recent first

        // Apply pagination after sorting
        const skip = parseInt(page) * parseInt(limit);
        const paginatedUsers = usersWithDate.slice(skip, skip + parseInt(limit));

        return paginatedUsers;
    } catch (error) {
        console.error('Error in fetchUsersWithRegistrationDate:', error);
        throw error;
    }
};

// Get total count of users for pagination
const getUsersCount = async () => {
    try {
        return await Users.countDocuments({});
    } catch (error) {
        console.error('Error in getUsersCount:', error);
        throw error;
    }
};

// Fetch monitorings with owner, creation date, and response count
const fetchMonitoringsWithDetails = async (page, limit) => {
    try {
        const skip = parseInt(page) * parseInt(limit);

        // Get monitorings with pagination
        const monitorings = await Monitorings.find({})
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ creationDate: -1 })
            .select('name userId creationDate')
            .lean();

        // Get all unique user IDs
        const userIds = [...new Set(monitorings.map(m => m.userId).filter(id => id))];
        const users = await Users.find({ _id: { $in: userIds } })
            .select('firstName lastName email')
            .lean();

        // Create user map
        const userMap = new Map();
        users.forEach(user => {
            userMap.set(user._id.toString(), user);
        });

        // Get monitoring IDs to count responses
        const monitoringIds = monitorings.map(m => m._id);

        // Count responses per monitoring
        const responseCounts = await Responses.aggregate([
            { $match: { monitoringId: { $in: monitoringIds } } },
            { $group: { _id: '$monitoringId', count: { $sum: 1 } } }
        ]);

        const responseCountMap = new Map();
        responseCounts.forEach(item => {
            responseCountMap.set(item._id.toString(), item.count);
        });

        // Build result with owner info and response count
        const result = monitorings.map(monitoring => {
            const user = monitoring.userId ? userMap.get(monitoring.userId.toString()) : null;
            const ownerName = user
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown'
                : 'Unknown';

            // Calculate creation date from creationDate or _id
            let creationDate;
            if (monitoring.creationDate) {
                creationDate = new Date(monitoring.creationDate);
            } else {
                const timestamp = monitoring._id.toString().substring(0, 8);
                creationDate = new Date(parseInt(timestamp, 16) * 1000);
            }

            return {
                _id: monitoring._id,
                name: monitoring.name || 'Unnamed',
                owner: ownerName,
                creationDate: creationDate,
                responseCount: responseCountMap.get(monitoring._id.toString()) || 0
            };
        });

        return result;
    } catch (error) {
        console.error('Error in fetchMonitoringsWithDetails:', error);
        throw error;
    }
};

// Get total count of monitorings
const getMonitoringsCount = async () => {
    try {
        return await Monitorings.countDocuments({});
    } catch (error) {
        console.error('Error in getMonitoringsCount:', error);
        throw error;
    }
};

// Fetch assessments with owner, creation date, and response count
const fetchAssessmentsWithDetails = async (page, limit) => {
    try {
        const skip = parseInt(page) * parseInt(limit);

        // Get assessments with pagination
        const assessments = await Assessments.find({})
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ creationDate: -1 })
            .select('name userId creationDate')
            .lean();

        // Get all unique user IDs
        const userIds = [...new Set(assessments.map(a => a.userId).filter(id => id))];
        const users = await Users.find({ _id: { $in: userIds } })
            .select('firstName lastName email')
            .lean();

        // Create user map
        const userMap = new Map();
        users.forEach(user => {
            userMap.set(user._id.toString(), user);
        });

        // Get assessment IDs to count responses
        const assessmentIds = assessments.map(a => a._id);

        // Count responses per assessment
        const responseCounts = await Responses.aggregate([
            { $match: { assessmentId: { $in: assessmentIds } } },
            { $group: { _id: '$assessmentId', count: { $sum: 1 } } }
        ]);

        const responseCountMap = new Map();
        responseCounts.forEach(item => {
            responseCountMap.set(item._id.toString(), item.count);
        });

        // Build result with owner info and response count
        const result = assessments.map(assessment => {
            const user = assessment.userId ? userMap.get(assessment.userId.toString()) : null;
            const ownerName = user
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown'
                : 'Unknown';

            // Calculate creation date from creationDate or _id
            let creationDate;
            if (assessment.creationDate) {
                creationDate = new Date(assessment.creationDate);
            } else {
                const timestamp = assessment._id.toString().substring(0, 8);
                creationDate = new Date(parseInt(timestamp, 16) * 1000);
            }

            return {
                _id: assessment._id,
                name: assessment.name || 'Unnamed',
                owner: ownerName,
                creationDate: creationDate,
                responseCount: responseCountMap.get(assessment._id.toString()) || 0
            };
        });

        return result;
    } catch (error) {
        console.error('Error in fetchAssessmentsWithDetails:', error);
        throw error;
    }
};

// Get total count of assessments
const getAssessmentsCount = async () => {
    try {
        return await Assessments.countDocuments({});
    } catch (error) {
        console.error('Error in getAssessmentsCount:', error);
        throw error;
    }
};

module.exports = {
    fetchAdminStats,
    fetchDatabaseRecords,
    deleteRecord,
    fetchUserHistory,
    fetchUsersWithRegistrationDate,
    getUsersCount,
    fetchMonitoringsWithDetails,
    getMonitoringsCount,
    fetchAssessmentsWithDetails,
    getAssessmentsCount
};