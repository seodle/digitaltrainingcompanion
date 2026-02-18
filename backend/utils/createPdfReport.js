const PDFDocument = require('pdfkit');
const fs = require('fs');
const D3Node = require('d3-node');
const SVGtoPDF = require('svg-to-pdfkit');
const logoSvg = fs.readFileSync('./assets/logo.svg', 'utf8');
const axios = require('axios');
const { BACKEND_URL } = require('../config');
const { getUserWithId } = require('../services/userService');
const groupByWorkshop = require('./groupByWorkshop');

// Assessment type order mapping
const ASSESSMENT_TYPE_ORDER = {
    'Trainee characteristics': 1,
    'Training characteristics': 2,
    'Immediate reactions': 3,
    'Learning': 4,
    'Organizational conditions': 5,
    'Behavioral changes': 6,
    'Sustainability conditions': 7,
    'Student characteristics': 8,
    'Student learning outcomes': 9
};

async function createPdfReport(assessments, filePath, monitoringName, selectedDay, language, status, userId, sandbox) {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add the logo as the first item in the PDF
    const pageWidth = doc.page.width;
    const logoWidth = 200;
    const centerX = (pageWidth - logoWidth) / 2;
    SVGtoPDF(doc, logoSvg, centerX, -300, { width: logoWidth });
    doc.moveDown(15);

    doc.fontSize(25).font('Helvetica-Bold').text(`${monitoringName}`, { align: 'center' });
    doc.moveDown(25); // Move down to give some space

    const aggregatedData = await aggregateResponses(assessments);

    let lastWorkshop = null;
    let graphCounter = 0; // Counter to keep track of graphs per page

    // Sort assessment types by their defined order
    const sortedAssessmentTypes = Object.keys(aggregatedData).sort((a, b) => {
        const orderA = ASSESSMENT_TYPE_ORDER[a] || 999; // Default to end if type not found
        const orderB = ASSESSMENT_TYPE_ORDER[b] || 999;
        return orderA - orderB;
    });

    for (const assessmentType of sortedAssessmentTypes) {
        doc.addPage(); // Start each new assessment type on a new page
        graphCounter = 0; // Reset graph counter for each new page

        for (const assessmentName in aggregatedData[assessmentType]) {
            const items = aggregatedData[assessmentType][assessmentName];
            const assessmentData = items.questions;

            // ⛔ Skip if all items are empty
            const hasRenderableContent = Object.values(assessmentData).some(item => {
                if (!item) return false;

                const hasText = item.questionType === 'text' && Array.isArray(item.chartData) && item.chartData.some(x => x);
                const hasChart = ['radio-ordered', 'checkbox', 'radio-unordered'].includes(item.questionType)
                    && item.chartData && (Array.isArray(item.chartData) ? item.chartData.length > 0 : Object.keys(item.chartData).length > 0);
                const hasCompetencies = Array.isArray(item.competencies) && item.competencies.length > 0;

                return hasText || hasChart || hasCompetencies;
            });

            if (!hasRenderableContent) {
                continue; // ✅ Skip this assessment
            }

            doc.moveDown();
            doc.fontSize(14).font('Helvetica-Bold').text(`${assessmentName}`, { align: 'center' });

            // Add owner's name if available
            if (items.ownerId) {
                try {
                    const owner = await getUserWithId(items.ownerId);
                    if (owner && owner.firstName && owner.lastName) {
                        doc.fontSize(10).font('Helvetica-Oblique').text(`${owner.firstName} ${owner.lastName}`, { align: 'center' });
                    }
                } catch (error) {
                    console.error("Error fetching owner information:", error);
                    // Continue without owner name if there's an error
                }
            }

            doc.moveDown();

            const workshopsOrdered = groupByWorkshop(
                (assessments.find(a => a.name === assessmentName && a.type === assessmentType) || {}).workshops,
                Object.values(assessmentData),
                (qd) => qd.workshopId || null
            );

            for (const { label, questions } of workshopsOrdered) {
                if (label) {
                    if (doc.y > doc.page.height - 300) {
                        doc.addPage();
                        graphCounter = 0;
                    }
                    doc.moveDown();
                    doc.fontSize(14).font('Helvetica-Bold').text(`${label}`, { align: 'center' });
                    doc.moveDown();
                }

                for (const questionData of questions) {

                    // Check if we need to add a new page before adding content
                    if (doc.y > doc.page.height - 300) { // Adjust this value as needed
                        doc.addPage();
                        graphCounter = 0;
                    }

                    // Only show N = X for non-single-text questions
                    const questionText = questionData.questionType === 'single-text'
                        ? questionData.questionText
                        : `${questionData.questionText} (N = ${questionData.respondentCount})`;
                    doc.fontSize(12).font('Helvetica-Bold').text(questionText, { align: 'left' });
                    doc.moveDown();

                    // ------------------
                    // Handle text questions with summarization
                    // ------------------
                    if (questionData.questionType === 'text') {
                        let textAnalysis = "";

                        if (questionData.chartData && questionData.chartData.length > 0) {
                            const allResponsesNull = questionData.chartData.every(response => response === null);

                            if (!allResponsesNull) {
                                // Use the new dedicated endpoint for text summarization
                                try {
                                    const response = await axios.post(`${BACKEND_URL}/ai-tools/generate-text-summary`, {
                                        responses: questionData.chartData,
                                        questionText: questionData.questionText,
                                        language: language,
                                        sandbox: sandbox
                                    });
                                    textAnalysis = response.data.summary || "";
                                } catch (error) {
                                    console.error("Error calling text summary API:", error);
                                    // Don't set textAnalysis - it will remain empty string
                                }
                            } else {
                                // For when there are no responses - the API handles this now
                                try {
                                    const response = await axios.post(`${BACKEND_URL}/ai-tools/generate-text-summary`, {
                                        responses: questionData.chartData,
                                        questionText: questionData.questionText,
                                        language: language,
                                        sandbox: sandbox
                                    });
                                    textAnalysis = response.data.summary || "";
                                } catch (error) {
                                    console.error("Error calling text summary API:", error);
                                }
                            }
                        }

                        // Only display analysis if we have content
                        if (textAnalysis) {
                            doc.fontSize(10).font('Helvetica-Oblique').text(textAnalysis, { align: 'left' });
                            doc.moveDown(1);
                        }

                        questionData.chartData.forEach(textResponse => {
                            if (textResponse) {
                                doc.fontSize(10).font('Helvetica').text(textResponse, { align: 'left', continued: false });
                            }
                        });
                        doc.moveDown();
                    }

                    // ------------------
                    // Handle "radio"/"checkbox"/"matrix" question types
                    // ------------------
                    let svgString;
                    if (['radio-ordered', 'checkbox', 'radio-unordered'].includes(questionData.questionType)) {
                        // Normal single bar chart
                        try {
                            svgString = await generateBarChartSVG(questionData.chartData, questionData.correctAnswer, questionData.questionType);
                            if (svgString) {
                                SVGtoPDF(doc, svgString, 0, doc.y, { width: 500, height: 300 });
                                graphCounter++;
                                doc.moveDown(12);
                            }
                        } catch (error) {
                            console.error(`Error generating chart:`, error);
                            doc.text(`Error generating chart. Please check the data.`);
                            doc.moveDown();
                        }
                    }

                    // ------------------
                    // Handle competencies with a table
                    // ------------------
                    if (questionData.competencies && questionData.competencies.length > 0) {
                        const tableTop = doc.y + 10;
                        const tableLeft = doc.page.margins.left;
                        const tableRight = doc.page.width - doc.page.margins.right;
                        const tableWidth = tableRight - tableLeft;
                        const cellPadding = 5;
                        const fontSize = 10;

                        doc.fontSize(fontSize);

                        let rowTop = tableTop;
                        questionData.competencies.forEach((competency, index) => {
                            const rowHeight = doc.heightOfString(competency, {
                                width: tableWidth - 2 * cellPadding,
                                align: 'left'
                            }) + 2 * cellPadding;

                            // Check if we need to start a new page
                            if (rowTop + rowHeight > doc.page.height - doc.page.margins.bottom) {
                                doc.addPage();
                                rowTop = doc.page.margins.top;
                            }

                            const [competenceCode, competenceDescription] = competency.split(':');

                            // Alternate row background
                            doc.rect(tableLeft, rowTop, tableWidth, rowHeight)
                                .fill(index % 2 === 0 ? '#ffffff' : '#f9f9f9')
                                .stroke();

                            // Add competency code in bold and description in normal font
                            doc.font('Helvetica-Bold').fillColor('black').text(
                                (competenceCode || '') + ':',
                                tableLeft + cellPadding,
                                rowTop + cellPadding,
                                { continued: true }
                            );

                            doc.font('Helvetica').fillColor('black').text(competenceDescription || '', {
                                continued: false
                            });

                            rowTop += rowHeight;
                        });

                        doc.y = rowTop + 10;
                    }

                    doc.moveDown(5);
                }
            }
        }
    }

    doc.end();
    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}

// Simple utility to truncate labels if needed
function truncateLabel(label, maxWidth, charWidth) {
    if (typeof label !== 'string' || label === null) {
        return '';
    }

    const ellipsis = '...';
    const maxChars = Math.floor(maxWidth / charWidth);
    return label.length > maxChars ? label.substring(0, maxChars - ellipsis.length) + ellipsis : label;
}

// ------------------------------------------------------------------
// The updated generateBarChartSVG with corner radius & multi-answer
// ------------------------------------------------------------------
async function generateBarChartSVG(data, correctAnswer, questionType) {
    // Convert any single-string correctAnswer to an array
    // If there's no correct answer, keep it null
    const correctAnswers = correctAnswer
        ? (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer])
        : null;

    // Check if data is valid and not empty
    if (!Array.isArray(data) || data.length === 0) {
        console.error('Invalid or empty data provided to generateBarChartSVG');
        return null;
    }

    const d3n = new D3Node();
    const d3 = d3n.d3;
    const margin = { top: 20, right: 20, bottom: 20, left: 300 };

    const totalSum = data.reduce((acc, curr) => acc + (curr.value || 0), 0);

    // Dimensions for the graph
    const width = 700;
    const height = 150;

    const svg = d3n.createSVG(width, height + margin.top)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .range([0, width])
        .domain([0, d3.max(data, d => d.value || 0) * 2.5])
        .nice();

    const y = d3.scaleBand()
        .range([height, 0])
        .domain(data.map(d => d.label).filter(Boolean))
        .paddingInner(0.1);

    const redYellowGreenPalette = [
        '#C83232', '#DC4646', '#F07850', '#FCB464', '#FEE090',
        '#FFFFBF', '#D9EF8B', '#A6D96A', '#82BE6E', '#50AA5A'
    ];

    // For 'radio-ordered', use a color scale by index
    let colorScale;
    if (questionType === 'radio-ordered') {
        colorScale = d3.scaleQuantize()
            .domain([0, data.length - 1])
            .range(redYellowGreenPalette);
    } else {
        // Default color if not 'radio-ordered'
        colorScale = () => "#ADD8E6";
    }

    // Determine font size based on number of choices
    const fontSizeBarText = data.length > 9 ? 10 : 14;
    const fontSizeLabelText = data.length > 9 ? 8 : 12;

    // Create bars with corner radius
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => y(d.label) || 0)
        .attr('width', d => x(d.value || 0))
        .attr('height', y.bandwidth())
        .attr('rx', 6) // Rounded corners
        .attr('ry', 6) // Rounded corners
        .attr('fill', (d, i) => {
            // If we have correctAnswers and they are not empty, color green or red
            if (correctAnswers && correctAnswers.length > 0) {
                return correctAnswers.includes(d.label) ? 'green' : 'red';
            }

            // Otherwise, if questionType is radio-ordered, use the color scale
            if (questionType === 'radio-ordered') {
                return colorScale(i);
            }

            // Fallback color - pastel blue for questions without correct answers
            return "#ADD8E6";
        });

    // The bar text showing counts/percentages
    svg.selectAll('.bar-text')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'bar-text')
        .attr('x', d => x(Math.max(d.value || 0, 0)) + 5)
        .attr('y', d => (y(d.label) || 0) + y.bandwidth() / 2)
        .attr('dy', '.35em')
        .attr('text-anchor', 'start')
        .style('fill', 'black')
        .style('font-family', 'Poppins')
        .style('font-weight', 'bold')
        .style('font-size', `${fontSizeBarText}px`)
        .text(d => {
            const pct = ((d.value / totalSum) * 100 || 0).toFixed(1);
            return `${d.value || 0} (${pct}%)`;
        });

    // Labels on the left
    svg.selectAll('.label-text')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'label-text')
        .attr('x', -10)
        .attr('y', d => (y(d.label) || 0) + y.bandwidth() / 2)
        .attr('dy', '.35em')
        .attr('text-anchor', 'end')
        .style('fill', 'black')
        .style('font-family', 'Poppins')
        .style('font-size', `${fontSizeLabelText}px`)
        .text(d => truncateLabel(d.label, 300, 6));

    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-family", "Poppins")
        .style("font-size", "16px");

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(d3.max(data, d => d.value || 0)).tickFormat(d3.format('d')))
        .style("font-size", "16px");

    return d3n.svgString();
}

// ------------------------------------------------------------------
// aggregator logic (unchanged)
// ------------------------------------------------------------------
async function aggregateResponses(assessments) {
    const aggregatedData = {};
    assessments.forEach(assessment => {
        if (!aggregatedData[assessment.type]) {
            aggregatedData[assessment.type] = {};
        }
        if (!aggregatedData[assessment.type][assessment.name]) {
            aggregatedData[assessment.type][assessment.name] = {
                ownerId: null, // Add ownerId field
                questions: {}
            };
        }

        // Store the userId from the first response if available
        if (assessment.responses && assessment.responses.length > 0) {
            aggregatedData[assessment.type][assessment.name].ownerId = assessment.responses[0].userId;
        }

        assessment.responses.forEach(response => {
            response.survey.forEach(question => {
                if (!question.questionType) return;

                const key = question.workshopId
                    ? `${String(question.workshopId)}-${String(question.questionId)}`
                    : String(question.questionId);
                const correctAnswer = question.correctAnswer || null;

                // Initialize if needed
                if (!aggregatedData[assessment.type][assessment.name].questions[key]) {
                    aggregatedData[assessment.type][assessment.name].questions[key] = {
                        questionText: question.question,
                        questionType: question.questionType,
                        correctAnswer,
                        competencies: question.competencies,
                        workshopId: question.workshopId,
                        chartData:
                            question.questionType !== "text"
                                ? question.choices.map(choice => ({ label: choice, value: 0 }))
                                : [],
                        respondentCount: 0,
                    };
                }

                const qData = aggregatedData[assessment.type][assessment.name].questions[key];
                qData.respondentCount++;

                if (["radio-ordered", "radio-unordered", "checkbox"].includes(question.questionType)) {
                    question.response.forEach(answer => {
                        const idx = qData.chartData.findIndex(c => c.label === answer);
                        if (idx !== -1) qData.chartData[idx].value++;
                    });
                } else if (question.questionType === "text") {
                    // Just push the text
                    qData.chartData.push(question.response[0]);
                }
            });
        });
    });

    return aggregatedData;
}

module.exports = createPdfReport;