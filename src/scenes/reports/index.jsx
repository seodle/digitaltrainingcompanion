import React, { useState, useEffect } from 'react';
import { InputLabel, Box, MenuItem, FormControl, Button, Typography, Tooltip, IconButton } from "@mui/material";
import { CircularProgress } from '@mui/material';
import Select from '@mui/material/Select';
import jwt_decode from "jwt-decode";
import axios from 'axios';
import saveAs from 'file-saver';
import PDFlogo from '../../assets/medias/pdf.png';
import DOClogo from '../../assets/medias/doc.png';
import CSVlogo from '../../assets/medias/csv.png';
import RefreshIcon from '@mui/icons-material/Refresh';

import Sidebar from "../../scenes/global/Sidebar";
import Topbar from "../../scenes/global/Topbar";
import AssessmentTabResult from '../../components/AssessmentTabResult';
import AssessmentTabResultWithFilter from '../../components/AssessmentTabResultWithFilter';
import { buttonStyle } from '../../components/styledComponents'
import { useMessageService } from '../../services/MessageService';
import { useAuthUser } from '../../contexts/AuthUserContext';
import { transformAssessments, formatLatestDate } from "../../utils/ObjectsUtils";
import { prepareChartData, prepareCommentData } from "../../utils/ChartDataUtils";
import { AssessmentType, UserType } from "../../utils/enums";
import { BACKEND_URL } from "../../config";
import { useLanguage } from '../../contexts/LanguageContext';
import { groupQuestionsByWorkshop, getWorkshopDetailsById } from "../../utils/SurveyUtils";

const Reports = () => {

    const [monitorings, setMonitorings] = useState([]);
    const [selectedMonitoring, setSelectedMonitoring] = useState('');
    const [selectedMonitoringId, setSelectedMonitoringId] = useState('');
    const [assessments, setAssessments] = useState([]);
    const [currentUserId, setCurrentUserId] = useState('');
    const { languageCode } = useLanguage();

    const [selectedUser, setSelectedUser] = useState('');
    const [allUsers, setAllUsers] = useState('');

    const [days, setDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedDayAssessments, setSelectedDayAssessments] = useState([]);

    const [totalAssessments, setTotalAssessments] = useState(0)
    const [latestResponseDate, setLatestResponseDate] = useState('');

    const [valuesTabOne, setValuesTabOne] = useState(0);
    const [valuesTabTwo, setValuesTabTwo] = useState(0);
    const [valuesTabThree, setValuesTabThree] = useState(0);
    const [valuesTabFour, setValuesTabFour] = useState(0);
    const [chartData, setChartData] = useState([]);
    const [commentData, setCommentData] = useState([]);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isExportingDOCX, setIsExportingDOCX] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    //AI summary states
    const [aiSummaries, setAiSummaries] = useState({});
    const [loadingSummaries, setLoadingSummaries] = useState({});

    // for i18n
    const { getMessage } = useMessageService();
    const { currentUser } = useAuthUser();

    // DEBUG
    useEffect(() => {

        console.log("Assessments for this monitoring", assessments);
        console.log("days", days);

    }, [assessments, days]);

    useEffect(() => {
    console.log("Updating selectedDay based on days:", days);
    if (days.length === 0) {
        setSelectedDay('');
        console.log("Resetting selectedDay to empty string");
    } else if (!days.includes(selectedDay)) {
        setSelectedDay(days[0]);
        console.log("Setting selectedDay to first day:", days[0]);
    }
}, [days, selectedDay]);


    // fetch the assessments for a the selected monitoring
    useEffect(() => {

        if (selectedMonitoring){
            console.log("fetching for:", selectedMonitoring._id);

            const fetchAssessments = async () => {
    
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('No token found');
                    return;
                }
        
                try {
                    const response = await axios.get(`${BACKEND_URL}/assessments/monitoring/${selectedMonitoring._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
        
                    if (response.data && response.data.length > 0) {
                        const transformedAssessments = transformAssessments(response.data);
                        // Spread transformed assessments into the main assessments array
                        setAssessments(transformedAssessments);

                        // extract the days from the assessments
                        const days = transformedAssessments.map(assessment => assessment.day);

                        // convert to a set to remove duplicates, then convert back to array
                        setDays(Array.from(new Set(days)));
                    }

                } catch (error) {
                    console.error('Failed to fetch assessments:', error);
                }
            };

            fetchAssessments();
        }
    }, [selectedMonitoring]);


    useEffect(() => {

        if (selectedDay && selectedMonitoring){
            filterAssessmentsByDay();
        }
    }, [selectedDay]);

    // fetch all the monitorings of the current user when the page loads
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found');
            return;
        }

        const decodedToken = jwt_decode(token);
        setCurrentUserId(decodedToken._id);

        const fetchMonitorings = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/monitorings`, {
                    headers: {Authorization: `Bearer ${token}`}
                });

                setMonitorings(response.data.monitorings);
            } catch (error) {
                console.error('Failed to fetch monitorings:', error);
            }
        };

        fetchMonitorings();
    }, []);

    // Add this useEffect hook right after the other useEffect hooks in the component
    useEffect(() => {
        const fetchLastResponse = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No token found');
                return;
            }

            try {
                const response = await axios.get(`${BACKEND_URL}/responses/last`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data) {
                    const lastResponse = response.data;
                    const monitoringId = lastResponse.monitoringId;
                    const assessmentId = lastResponse.assessmentId;

                    // Find the monitoring from monitorings
                    const monitoring = monitorings.find(m => m._id === monitoringId);
                    if (monitoring) {
                        setSelectedMonitoring(monitoring);
                        setSelectedMonitoringId(monitoringId);

                        // Fetch assessments for this monitoring to get the day
                        const assessmentsResponse = await axios.get(`${BACKEND_URL}/assessments/monitoring/${monitoringId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (assessmentsResponse.data && assessmentsResponse.data.length > 0) {
                            const transformedAssessments = transformAssessments(assessmentsResponse.data);
                            const assessment = transformedAssessments.find(a => a._id === assessmentId);
                            if (assessment) {
                                setSelectedDay(assessment.day);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch last response:', error);
            }
        };

        if (currentUser && currentUser._id && monitorings.length > 0) {
            fetchLastResponse();
        }
    }, [currentUser, monitorings]);

    const handleChangeTabsOne = (event, newValue) => {
        setValuesTabOne(newValue);
    };

    const handleChangeTabsTwo = (event, newValue) => {
        setValuesTabTwo(newValue);
    };

    const handleChangeTabsThree = (event, newValue) => {
        setValuesTabThree(newValue);
    };

    const handleChangeTabsFour = (event, newValue) => {
        setValuesTabFour(newValue);
    };

    const filterAssessmentsByDay = async () => {

        if (!assessments) return;

       let filteredAssessments = assessments;

        // If the current user is a Teacher, filter assessments by type and user
        if (currentUser.userStatus === 'Teacher') {
            filteredAssessments = filteredAssessments.filter(assessment =>
                assessment.type === 'Student characteristics' || assessment.type === 'Student learning outcomes'
            );
        }

        // Further filter assessments based on the selected day
        filteredAssessments = filteredAssessments.filter(assessment =>
            assessment.day === selectedDay
        );

        // Create an array with essential details from filtered assessments
        const assessmentsInfo = filteredAssessments.map(({ _id, type, name, workshops, position }) => ({ _id, type, name, workshops, position }));

        // Fetch and attach responses for each assessment
        let assessmentsWithResponses = await Promise.all(
            assessmentsInfo.map(async ({ _id, type, name, workshops, position }) => {
                const responses = await fetchResponsesByAssessment(_id);

                return {
                    _id,
                    name,
                    type,
                    position,
                    workshops: workshops || [],
                    responses: (responses || []).map(r => ({
                        ...r,
                        survey: (workshops && workshops.length > 0)
                            ? groupQuestionsByWorkshop(workshops, r.survey).flatMap(w => w.questions || [])
                            : (r.survey || [])
                    }))
                };
            })
        );

        // get all user full names
        let userMap = new Map();

        assessmentsWithResponses.forEach(assessment => {
            assessment.responses.forEach(response => {
                const user = response.userId;
                if (user && user._id && !userMap.has(user._id)) {
                    userMap.set(user._id, user);
                }
            });
        });

        const uniqueUsers = Array.from(userMap.values());
        setAllUsers(uniqueUsers);

        setSelectedDayAssessments(assessmentsWithResponses);
        setTotalAssessments(assessmentsWithResponses.length);

        // Prepare and set chart and comment data
        const chartDataByType = handlePrepareChartData(assessmentsWithResponses);
        const commentDataByType = handlePrepareCommentData(assessmentsWithResponses);
        setChartData(chartDataByType);
        setCommentData(commentDataByType);

        // Calculate and set the latest response date with formatting
        const allResponses = assessmentsWithResponses.flatMap(assessment => assessment.responses);
        const latestDate = getLatestResponseDate(allResponses);

        if (latestDate) {
            setLatestResponseDate(formatLatestDate(latestDate));
        } else {
            setLatestResponseDate(null);
        }
    }

    // Generate AI summaries when comment data changes
    useEffect(() => {
        if (commentData && Object.keys(commentData).length > 0) {
            generateAllAiSummaries(commentData);
        }
    }, [commentData]);

    // Reset AI summaries when monitoring or day changes
    useEffect(() => {
        setAiSummaries({});
        setLoadingSummaries({});
    }, [selectedMonitoring, selectedDay]);

    /**
     * Handles the change of the selected user.
     * @param {Event} event - The event object from the user selection input.
    */
    const handleChangeUser = (event) => {

        let selectedUser = event.target.value;
        setSelectedUser(selectedUser);

        
        // Filter the response by removing the userId not selected
        const filteredSelectedDayAssessments = (selectedDayAssessments, userId) => {
            return selectedDayAssessments.map(item => {

                if (item.type === AssessmentType.STUDENT_CHARACTERISTICS || item.type === AssessmentType.STUDENT_LEARNING_OUTCOMES) {

                    // If no user is selected (userId is empty), include all responses
                    const filteredResponses = userId ? 
                        item.responses.filter(response => response.userId._id === userId) :
                        item.responses;
                    
                    // Create a new object with the same properties as the original item
                    // but with filtered responses
                    return {
                        ...item,
                        responses: filteredResponses
                    };
                }
                
                return item;
            });
        };
    
        // Call the function with selectedDayAssessments and the selected userId
        const filteredAssessments = filteredSelectedDayAssessments(selectedDayAssessments, event.target.value);
    
        // Prepare and set chart and comment data
        const chartDataByType = handlePrepareChartData(filteredAssessments);
        const commentDataByType = handlePrepareCommentData(filteredAssessments);
        setChartData(chartDataByType);
        setCommentData(commentDataByType);
    
        // Calculate and set the latest response date with formatting
        const allResponses = filteredAssessments.flatMap(assessment => assessment.responses);
        const latestDate = getLatestResponseDate(allResponses);
    
        if (latestDate) {
            setLatestResponseDate(formatLatestDate(latestDate));
        } else {
            setLatestResponseDate(null);
        }
    };

    /**
     * Handles the change of the selected day for assessments.
     * @param {Event} event - The event object from the day selection input.
    */
    const handleChangeDay = (event) => {
        setSelectedDay(event.target.value);
    };

    /**
     * Handle the selection change of a monitoring
    */
    const handleChangeMonitoring = (event) => {
        setSelectedMonitoring(monitorings.find(monitoring => monitoring._id === event.target.value));
        setSelectedMonitoringId(event.target.value);

        // Reset the form and assessments related state
        setValuesTabOne(0);
        setValuesTabTwo(0);
        setValuesTabThree(0);
        setValuesTabFour(0);
        setAssessments([]);
        setDays([]);
        setSelectedDay('');
        setSelectedDayAssessments([]);
        setTotalAssessments(0);
        setLatestResponseDate('');
        setChartData([]);
        setCommentData([]);
    };

    /**
     * Retrieves all responses for a specific assessment by its ID.
     * @param {string} assessmentId - The unique identifier of the assessment.
     * @returns {Object[]} - The array of response objects returned from the server.
     */
    const fetchResponsesByAssessment = async (assessmentId) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(`${BACKEND_URL}/responses/assessment/${assessmentId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            console.error(`Error fetching responses: ${error}`);
        }
    }

    

    /**
     * Determines the most recent response date from an array of responses.
     * @param {Array} responses - The array of response objects, each containing a 'date' field.
     * @return {Date|null} - The latest date found in the responses, or null if no responses are provided.
    */
    const getLatestResponseDate = (responses) => {

        if (responses.length === 0) return null;

        let latest = new Date(responses[responses.length-1].completionDate); // Assuming each response object has a "date" field.
        responses.forEach(response => {
            const responseDate = new Date(response.date);
            if (responseDate > latest) latest = responseDate;
        });

        return latest;
    }

    /**
     * Converts an array of assessment data into a CSV format string.
     * Includes fixed headers for general assessment information, question details, and response data.
     * The function handles various question types and includes a column for proposed choices.
     * It also includes detailed logging for debugging purposes.
     * 
     * @param {Array} data - The data to be converted to CSV format. Each item in the array should be an object
     *                       representing a single response to a question, with properties matching the headers.
     * @returns {string} A string formatted as CSV content, with headers and data rows separated by newlines.
     *                   Returns an empty string if the input data is invalid.
     */
    const convertToCSV = (data) => {
        const escapeCSVValue = (value) => {
            if (value == null) return '';
            value = value.toString();
            if (value.includes(',') || value.includes('\n') || value.includes('\r') || value.includes('"')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        if (!data || !Array.isArray(data) || data.length === 0) {
            console.error('convertToCSV: Invalid data array');
            return '';
        }

        const headers = [
            "Assessment Name", "Assessment Type", "Linking ID", 
            "Display Name", "Completion Date", "Question Short Name", "Section", 
            "Question Type", "Question Item", "Matrix ID", "Matrix Title", "Proposed Choices", "Response", "Correct Answer"
        ];

        console.log('Headers:', headers);
        console.log('First data item:', data[0]);

        const csvContent = [
            headers.join(','),
            ...data.map(item => {
                const row = headers.map(header => {
                    // Convert header to camelCase for object key matching
                    const key = header.toLowerCase().split(' ').map((word, index) => 
                        index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)
                    ).join('');
                    const value = item[key];
                    console.log(`Field: ${key}, Value: ${value}`);
                    return escapeCSVValue(value);
                });
                console.log('Row:', row);
                return row.join(',');
            })
        ];

        console.log('CSV Content (first 3 lines):', csvContent.slice(0, 3));

        return csvContent.join('\n');
    };

    /**
     * Exports assessment data as a single CSV file in long format.
     * This function handles the entire export process, including data conversion, CSV creation, and file download.
     * 
     * The process includes the following steps:
     * 1. Converts selected day assessments to a long format.
     * 2. Converts the long format data to CSV.
     * 3. Creates a Blob with the CSV data.
     * 4. Initiates a download of the CSV file.
     * @throws {Error} If there's an issue during the export process, it will be caught and logged.
     */
    const handleExportData = () => {
        console.log('Starting export process...');
        console.log('Selected day assessments:', selectedDayAssessments);

        try {
            // Convert the data to long format
            const longFormatData = convertToLongFormat(selectedDayAssessments);

            if (longFormatData.length === 0) {
                console.error('No data to export after conversion to long format');
                // You might want to show an error message to the user here
                return;
            }

            // Convert the long format data to CSV
            const csvData = convertToCSV(longFormatData);

            // Create a Blob with the CSV data
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });

            // Create a link element, use it to download the csv file
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "raw_data.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                console.log('CSV file download initiated');
            } else {
                console.error('Browser does not support downloading');
            }
        } catch (error) {
            console.error('Error in export process:', error);
        }
    };


   /**
     * Converts a nested structure of assessment data into a flat, long format array.
     * This function processes assessment data, including responses and survey items,
     * and transforms it into a format suitable for CSV export.
     *
     * @param {Array} data - An array of assessment objects. Each assessment object should contain:
     *   - name: string (assessment name)
     *   - type: string (assessment type)
     *   - responses: Array of response objects, each containing:
     *     - linkingId: string
     *     - displayName: string
     *     - completionDate: string (ISO date string)
     *     - survey: Array of survey item objects, each containing:
     *       - shortName: string
     *       - workshopId: string (optional)
     *       - questionType: string
     *       - question: string
     *       - matrixId: string (optional, for matrix questions)
     *       - matrixTitle: string (optional, for matrix questions)
     *       - items: Array (for matrix questions)
     *       - choices: Array or Object of proposed choices
     *       - response: string or Array
     *       - correctAnswer: string or Array (optional)
     *
     * @returns {Array} A flat array where each item represents a single response to a question,
     *                  including all relevant metadata. Returns an empty array if input is invalid.
     */
    const convertToLongFormat = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
        console.error('Invalid or empty data array passed to convertToLongFormat');
        return [];
    }

    return data.flatMap(assessment => {
        if (!assessment || !Array.isArray(assessment.responses)) {
            console.warn('Invalid assessment object:', assessment);
            return [];
        }

        return assessment.responses.flatMap(response => {
            if (!response || !Array.isArray(response.survey)) {
                console.warn('Invalid response object:', response);
                return [];
            }

            return response.survey
                // Filter out single-text questions
                .filter(surveyItem => surveyItem.questionType !== 'single-text')
                .flatMap(surveyItem => {
                    if (!surveyItem) {
                        console.warn('Invalid survey item:', surveyItem);
                        return [];
                    }

                    const baseData = {
                        assessmentName: assessment.name || '',
                        assessmentType: assessment.type || '',
                        linkingId: surveyItem.linkingId || '',
                        displayName: response.displayName || '',
                        completionDate: response.completionDate ? new Date(response.completionDate).toISOString().split('T')[0] : '',
                        questionShortName: surveyItem.shortName || '',
                        workshopId: surveyItem.workshopId || '',
                        questionType: surveyItem.questionType || '',
                        matrixId: surveyItem.matrixId || '',
                        matrixTitle: surveyItem.matrixTitle || '',
                    };

                    const getProposedChoices = (choices) => {
                        if (Array.isArray(choices)) {
                            return choices.join(';');
                        } else if (typeof choices === 'object') {
                            return Object.values(choices).join(';');
                        }
                        return '';
                    };

                    if (surveyItem.questionType === 'checkbox' || surveyItem.questionType === 'radio-unordered') {
                        return [{
                            ...baseData,
                            questionItem: surveyItem.question || '',
                            proposedChoices: getProposedChoices(surveyItem.choices),
                            response: Array.isArray(surveyItem.response) ? surveyItem.response.join(';') : (surveyItem.response || ''),
                            correctAnswer: Array.isArray(surveyItem.correctAnswer) ? surveyItem.correctAnswer.join(';') : (surveyItem.correctAnswer || '')
                        }];
                    } else {
                        return [{
                            ...baseData,
                            questionItem: surveyItem.question || '',
                            proposedChoices: getProposedChoices(surveyItem.choices),
                            response: Array.isArray(surveyItem.response) ? surveyItem.response.join(";") : (surveyItem.response || ''),
                            correctAnswer: surveyItem.correctAnswer || ''
                        }];
                    }
                });
            });
        });
    };

    /**
     * Initiates the export of a PDF report based on a selected monitoring and day. It sends a request to the server to generate the PDF, then downloads it.
     * This function assumes the presence of a selected monitoring and day; it checks and aborts if either is missing.
     * @throws {Error} If the PDF export fails, it logs the error.
     */
    const handleExportPdfReport = async () => {
        try {
            setIsExportingPDF(true);

            // Check if a monitoring is selected
            if (!selectedMonitoring || !selectedDay) {
                console.error('No monitoring selected');
                return;
            }
            const token = localStorage.getItem("token");

            // Send a POST request to your backend endpoint
            const response = await axios.post(`${BACKEND_URL}/export/pdf`, 
                { 
                    assessments: selectedDayAssessments,
                    monitoring: selectedMonitoring, 
                    selectedDay: selectedDay,
                    status: currentUser.userStatus,
                    userId: currentUser._id,
                    language: languageCode,
                    sandbox: currentUser.sandbox
                }, 
                {
                    responseType: 'blob',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Create a Blob from the PDF Stream
            const file = new Blob([response.data], { type: 'application/pdf' });

            // Use file-saver to save the file on the client's machine
            saveAs(file, 'report.pdf');
        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            setIsExportingPDF(false);
        }
    };

    /**
     * Initiates the export of a DOCX report based on a selected monitoring and day. It sends a request to the server to generate the DOCX, then downloads it.
     * This function assumes the presence of a selected monitoring and day; it checks and aborts if either is missing.
     * @throws {Error} If the DOCX export fails, it logs the error.
     */
    const handleExportDocxReport = async () => {
        try {
            setIsExportingDOCX(true);

            // Check if a monitoring is selected
            if (!selectedMonitoring || !selectedDay) {
                console.error('No monitoring selected');
                return;
            }
            const token = localStorage.getItem("token");

            // Send a POST request to your backend endpoint
            const response = await axios.post(`${BACKEND_URL}/export/docx`, 
                { 
                    assessments: selectedDayAssessments,
                    monitoring: selectedMonitoring, 
                    selectedDay: selectedDay,
                    status: currentUser.userStatus,
                    userId: currentUser._id,
                    language: languageCode,
                    sandbox: currentUser.sandbox
                }, 
                {
                    responseType: 'blob',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Create a Blob from the PDF Stream
            const file = new Blob([response.data], { type: 'application/docx' });

            // Use file-saver to save the file on the client's machine
            saveAs(file, 'report.docx');
        } catch (error) {
            console.error('Error exporting DOCX:', error);
        } finally {
            setIsExportingDOCX(false);
        }
    };

    /**
     * Organizes chart data by type, using a mapping to specific processing functions.
     * Defaults to an empty array for unhandled types.
     * @param {Array} data - The dataset to process.
     * @returns {Object} - Chart data organized by type.
     */
    const handlePrepareChartData = (data) => {
        let chartDataByType = {};
    
        // Get all unique types from the data
        const uniqueTypes = Array.from(new Set(data.map(item => item.type)));
    
        // Prepare chart data for each unique type using the prepareChartData function
        uniqueTypes.forEach(type => {
            chartDataByType[type] = prepareChartData(data, type);
        });
    
        return chartDataByType;
    };

    /**
     * Organizes comment data by type, applying specific processing functions dynamically.
     * Defaults to an empty array for types without a specific function.
     * @param {Array} data - The dataset to process.
     * @returns {Object} - Processed data organized by type.
     */
    const handlePrepareCommentData = (data) => {
        let commentDataByType = {};

        // Get all unique types from the data
        const uniqueTypes = Array.from(new Set(data.map(item => item.type)));

        // Prepare comment data for each unique type using the prepareCommentData function
        uniqueTypes.forEach(type => {
            commentDataByType[type] = prepareCommentData(data, type);
        });

        return commentDataByType;
    };

    /**
     * Groups chart data by assessment type and workshop, aggregating related items under their specific assessment and workshop categories.
     * @param {string} assessmentType - The type of assessment to filter and group data by.
     * @returns {Object} An object with nested structure where each key is an assessment name, containing objects that represent workshops, which in turn hold arrays of related chart items.
    */
    const groupChartData = (assessmentType) => {
        let groupedData = {};

        if (chartData[assessmentType]) {
            const allWorkshops = (selectedDayAssessments || []).flatMap(a => a.workshops || []);

            Object.keys(chartData[assessmentType]).forEach(workshopKey => {

                chartData[assessmentType][workshopKey].forEach(item => {

                    const assessmentKey = item.assessmentName || "default";
                    const label = workshopKey === 'default'
                        ? 'default'
                        : (getWorkshopDetailsById(allWorkshops, workshopKey)?.label || 'default');

                    if (!groupedData[assessmentKey]) {
                        groupedData[assessmentKey] = {};
                    }
                    if (!groupedData[assessmentKey][label]) {
                        groupedData[assessmentKey][label] = [];
                    }

                    groupedData[assessmentKey][label].push(item);
                });
            });
        }
        
        // Reorder assessments strictly by position (ascending) like /dashboard
        if (Object.keys(groupedData).length > 0) {
            // Names of assessments to display, ordered by their position
            const assessmentNamesInPositionOrder = (selectedDayAssessments || [])
                .filter(assessment => assessment.type === assessmentType)
                .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER))
                .map(assessment => assessment.name);

            // Rebuild the grouped result using the position order
            const groupedByAssessmentThenWorkshopInPositionOrder = {};
            assessmentNamesInPositionOrder.forEach(assessmentName => {
                if (groupedData[assessmentName]) {
                    groupedByAssessmentThenWorkshopInPositionOrder[assessmentName] = groupedData[assessmentName];
                }
            });

            // Add any remaining assessments that were not in the ordered list (if any)
            Object.keys(groupedData).forEach(assessmentName => {
                if (!groupedByAssessmentThenWorkshopInPositionOrder[assessmentName]) {
                    groupedByAssessmentThenWorkshopInPositionOrder[assessmentName] = groupedData[assessmentName];
                }
            });

            return groupedByAssessmentThenWorkshopInPositionOrder;
        }
        
        return groupedData;
    };

    /**
     * Groups comment data by assessment type and workshop, organizing items under their respective
     * assessment names and workshops. This structure facilitates easy access to comments related
     * to specific workshops within each assessment.
     * 
     * @param {string} assessmentType - The type of assessment to categorize comments by.
     * @returns {Object} - A nested object with assessment names as keys, each containing workshop keys that map to arrays of related items.
     */
    const groupCommentData = (assessmentType) => {
        let groupedData = {};

        if (commentData[assessmentType]) {
            const allWorkshops = (selectedDayAssessments || []).flatMap(a => a.workshops || []);

            Object.entries(commentData[assessmentType]).forEach(([workshopKey, items]) => {
                items.forEach(item => {
                    const assessmentKey = item.assessmentName || 'default';
                    const label = workshopKey === 'default'
                        ? 'default'
                        : (getWorkshopDetailsById(allWorkshops, workshopKey)?.label || 'default');

                    if (!groupedData[assessmentKey]) {
                        groupedData[assessmentKey] = {};
                    }
                    if (!groupedData[assessmentKey][label]) {
                        groupedData[assessmentKey][label] = [];
                    }
                    groupedData[assessmentKey][label].push(item);
                });
            });
        }
        
        // Reorder assessments strictly by position (ascending) like /dashboard
        if (Object.keys(groupedData).length > 0) {
            const ordering = (selectedDayAssessments || [])
                .filter(a => a.type === assessmentType)
                .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER))
                .map(a => a.name);

            const ordered = {};
            ordering.forEach(name => {
                if (groupedData[name]) ordered[name] = groupedData[name];
            });
            Object.keys(groupedData).forEach(name => {
                if (!ordered[name]) ordered[name] = groupedData[name];
            });
            return ordered;
        }
        
        return groupedData;
    };

    const handleRefresh = async () => {
        if (!selectedMonitoring || !selectedDay) return;
        
        setIsRefreshing(true);
        try {
            await filterAssessmentsByDay();
        } catch (error) {
            console.error('Failed to refresh assessments:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    /**
     * Generates AI summary for text question responses via backend endpoint
     * @param {Array} responses - Array of response strings
     * @param {string} questionText - The question text
     * @param {string} questionKey - Unique key for the question
     * @returns {Promise<string>} - AI generated summary
     */
    const generateAiSummary = async (responses, questionText, questionKey) => {
        // Filter out null/empty responses
        const validResponses = responses.filter(r => r !== null && r !== '');
        
        // Si aucune réponse valide, ne rien faire
        if (validResponses.length === 0) {
            return null;
        }

        try {
            // Indiquer que ce résumé est en cours de chargement
            setLoadingSummaries(prev => ({ ...prev, [questionKey]: true }));

            // Appeler l'API backend
            const response = await axios.post(
                `${BACKEND_URL}/ai-tools/generate-text-summary`,
                { 
                    responses: validResponses,
                    questionText: questionText,
                    language: languageCode,
                    sandbox: currentUser?.sandbox || false
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            // Récupérer le résumé de la réponse
            const summary = response.data?.summary || null;
            
            // Stocker le résumé dans l'état
            setAiSummaries(prev => ({ ...prev, [questionKey]: summary }));
            
            // Indiquer que le chargement est terminé
            setLoadingSummaries(prev => ({ ...prev, [questionKey]: false }));
            
            return summary;
        } catch (error) {
            console.error('Error generating AI summary:', error);
            // En cas d'erreur, arrêter le loading
            setLoadingSummaries(prev => ({ ...prev, [questionKey]: false }));
            return null;
        }
    };

    /**
     * Generate AI summaries for all text questions in the comment data
     */
    const generateAllAiSummaries = async (commentDataByType) => {
        const summaryPromises = [];

        // Parcourir tous les types d'assessment
        Object.keys(commentDataByType).forEach(assessmentType => {
            // Parcourir tous les workshops
            Object.keys(commentDataByType[assessmentType]).forEach(workshopKey => {
                // Parcourir toutes les questions
                commentDataByType[assessmentType][workshopKey].forEach(item => {
                    const questionKey = item.uniqueQuestionKey;
                    const questionText = item.question;
                    const responses = item.responses || [];
                    
                    // Ne générer le résumé que si on ne l'a pas déjà
                    if (!aiSummaries[questionKey] && !loadingSummaries[questionKey]) {
                        summaryPromises.push(
                            generateAiSummary(responses, questionText, questionKey)
                        );
                    }
                });
            });
        });

        // Attendre que tous les résumés soient générés
        if (summaryPromises.length > 0) {
            await Promise.all(summaryPromises);
        }
    };

    return (
    <Box display="flex" backgroundColor="white" style={{ height: '100vh', overflow: 'auto' }}>
        <Sidebar/>

        <Box flex={1}>

            { /* Title */}
            <Box mt="10px" ml="10px">
                <Topbar title = {getMessage("label_my_results")} />
            </Box>


            <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gridTemplateRows={`4vh ${currentUser.userStatus === UserType.TEACHER_TRAINER ? "39vh 39vh" : "78vh"}`} gap="20px" ml="20px" mr="20px">   

                { /* Block choose monitoring and session */}
                <Box gridColumn="span 12" gridRow="1" display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center">
                        <FormControl variant="outlined" size="small" sx={{ minWidth: 220, marginRight: '20px'}}>
                            <InputLabel id="monitoring">{getMessage("label_choose_monitoring")}</InputLabel>

                            <Select
                                labelId="monitoring"
                                id="monitoring"
                                value={selectedMonitoringId}
                                onChange={handleChangeMonitoring}
                                autoWidth
                                label={getMessage("label_choose_monitoring")}
                            >

                                {monitorings && monitorings.map((monitoring) => (
                                    <MenuItem key={monitoring._id} value={monitoring._id}>
                                        {monitoring.name} 
                                    </MenuItem>
                                ))}
                            </Select>   
                        </FormControl>

                        <FormControl variant="outlined" size="small" sx={{ minWidth: 220, marginRight: '10px' }}>
                            <InputLabel id="day">{getMessage("label_choose_session")}</InputLabel>
                
                            <Select
                                labelId="day"
                                id="day"
                                value={(days.length === 0 && selectedDay !== '') ? '' : selectedDay}
                                onChange={handleChangeDay}
                                autoWidth
                                label={getMessage("label_choose_session")}
                            >
                                {days.length > 0 ? (
                                    days.map((day, index) => (
                                        <MenuItem key={index} value={day}>
                                            {day}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem value="" disabled>
                                        {getMessage("label_no_sessions_available")}
                                    </MenuItem>
                                )}
                            </Select>
                        </FormControl>

                        <Tooltip title={getMessage("label_refresh_answers")}>
                            <span>
                                <IconButton 
                                    onClick={handleRefresh}
                                    disabled={!selectedDay || isRefreshing}
                                    sx={{
                                        backgroundColor: 'white',
                                        '&:hover': {
                                            backgroundColor: '#f5f5f5'
                                        }
                                    }}
                                >
                                    {isRefreshing ? (
                                        <CircularProgress size={24} />
                                    ) : (
                                        <RefreshIcon />
                                    )}
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                <Box>

                { /* Block buttons export pdf, docx and csv */}
                <Box display="flex">
                    <Button
                        onClick={handleExportDocxReport}
                        variant="contained"
                        sx={{
                            ...buttonStyle,
                            minWidth: 'unset',
                            width: '48px',
                            height: '48px',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'white',
                            '&:hover': {
                                backgroundColor: '#f5f5f5'
                            }
                        }}
                        disabled={!selectedDayAssessments || selectedDayAssessments.length === 0}
                    >
                        {isExportingDOCX ? (
                            <CircularProgress size={28} />
                        ) : (
                            <img 
                                src={DOClogo} 
                                alt="DOCX"
                                style={{ 
                                    width: '28px', 
                                    height: '28px'
                                }}
                            />
                        )}
                    </Button>
                    
                    <Button
                        onClick={handleExportPdfReport}
                        variant="contained"
                        sx={{
                            ...buttonStyle,
                            minWidth: 'unset',
                            width: '48px',
                            height: '48px',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'white',
                            '&:hover': {
                                backgroundColor: '#f5f5f5'
                            }
                        }}
                        disabled={!selectedDayAssessments || selectedDayAssessments.length === 0}
                    >
                        {isExportingPDF ? (
                            <CircularProgress size={28} />
                        ) : (
                            <img 
                                src={PDFlogo} 
                                alt="PDF"
                                style={{ 
                                    width: '28px', 
                                    height: '28px'
                                }}
                            />
                        )}
                    </Button>
                

                    <Button
                        onClick={handleExportData}
                        variant="contained"
                        sx={{
                            ...buttonStyle,
                            minWidth: 'unset',
                            width: '48px',
                            height: '48px',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'white',
                            '&:hover': {
                                backgroundColor: '#f5f5f5'
                            }
                        }}
                        disabled={!selectedDayAssessments || selectedDayAssessments.length === 0}
                    >
                        <img 
                            src={CSVlogo} 
                            alt="CSV"
                            style={{ 
                                width: '28px', 
                                height: '28px'
                            }}
                        />
                    </Button>
                </Box>
                </Box>

            {/* The 4 blocks of assessment */}
            </Box>
                
                {currentUser && currentUser.userStatus === UserType.TEACHER_TRAINER && (
                    <>
                        <AssessmentTabResult
                            categories={[AssessmentType.TRAINEE_CHARACTERISTICS, AssessmentType.TRAINING_CHARACTERISTICS]}
                            gridRow="2"
                            data={valuesTabOne}
                            onChange={handleChangeTabsOne}
                            groupChartData={groupChartData}
                            groupCommentData={groupCommentData}
                            aiSummaries={aiSummaries}
                            loadingSummaries={loadingSummaries}
                        />

                        <AssessmentTabResult
                            categories={[AssessmentType.IMMEDIATE_REACTIONS, AssessmentType.LEARNING]}
                            gridRow="2"
                            data={valuesTabTwo}
                            onChange={handleChangeTabsTwo}
                            groupChartData={groupChartData}
                            groupCommentData={groupCommentData}
                            aiSummaries={aiSummaries}
                            loadingSummaries={loadingSummaries}
                        />
                        
                        <AssessmentTabResult
                            categories={[AssessmentType.ORGANIZATIONAL_CONDITIONS ,AssessmentType.BEHAVIORAL_CHANGES, AssessmentType.SUSTAINABILITY_CONDITIONS]}
                            gridRow="3"
                            data={valuesTabThree}
                            onChange={handleChangeTabsThree}
                            groupChartData={groupChartData}
                            groupCommentData={groupCommentData}
                            aiSummaries={aiSummaries}
                            loadingSummaries={loadingSummaries}
                        />

                        <AssessmentTabResultWithFilter
                            categories={[AssessmentType.STUDENT_CHARACTERISTICS, AssessmentType.STUDENT_LEARNING_OUTCOMES]}
                            gridRow="3"
                            data={valuesTabFour}
                            onChange={handleChangeTabsFour}
                            groupChartData={groupChartData}
                            groupCommentData={groupCommentData}
                            allUsers={allUsers}
                            selectedUser={selectedUser}
                            handleChangeUser={handleChangeUser}
                            aiSummaries={aiSummaries}
                            loadingSummaries={loadingSummaries}
                        />
                    </>
                )}

                {currentUser && currentUser.userStatus === UserType.TEACHER && (
                    <>
                        <AssessmentTabResult
                            categories={[AssessmentType.STUDENT_CHARACTERISTICS, AssessmentType.STUDENT_LEARNING_OUTCOMES]}
                            data={valuesTabFour}
                            onChange={handleChangeTabsFour}
                            groupChartData={groupChartData}
                            groupCommentData={groupCommentData}
                            fullScreen={true}
                            aiSummaries={aiSummaries}
                            loadingSummaries={loadingSummaries}
                        />
                    </>
                )}
            </Box>
        </Box>
    </Box>);
};

export default Reports;