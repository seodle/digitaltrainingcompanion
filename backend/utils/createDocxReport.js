const fs = require("fs");
const {
    Document,
    Packer,
    Paragraph,
    HeadingLevel,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    ImageRun,
    TextRun,
} = require("docx");
const { createCanvas } = require("canvas");
const axios = require('axios');
const { BACKEND_URL } = require('../config');
const { getUserWithId } = require('../services/userService');
const groupByWorkshop = require('./groupByWorkshop');

const logoPng = fs.readFileSync("./assets/logo.png");

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

// ------------------------------------------------------------------
// 1) Generate the chart image with minimal extra space & high resolution
// ------------------------------------------------------------------
async function generateChartImage(data, correctAnswer, questionType) {
    if (!Array.isArray(data) || data.length === 0) return null;

    // Convert correctAnswer to an array if it's a single string; leave null if none
    const correctAnswers = correctAnswer == null
        ? null
        : (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]);

    // Layout settings
    const minBarHeight = 30;
    const minLineHeight = 18;
    const barSpacing = 10;
    const cornerRadius = 6;

    // Temporary canvas for measuring text
    const tempCanvas = createCanvas(1, 1);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.font = "12px Arial";

    // Compute the widest label on the left and lines for each label
    let maxLabelWidth = 0;
    const labelLines = data.map(d => {
        const lines = wrapText(tempCtx, d.label, 200);
        const lineWidths = lines.map(line => tempCtx.measureText(line).width);
        maxLabelWidth = Math.max(maxLabelWidth, ...lineWidths);
        return lines;
    });
    const barHeights = labelLines.map(lines => Math.max(minBarHeight, lines.length * minLineHeight));

    // We want the final chart to appear about 800px wide in the doc
    const baseWidth = 800;

    // Margins around the bars
    const marginLeft = Math.ceil(maxLabelWidth) + 50; // space for left labels
    const margin = {
        top: 30,
        right: 10,
        bottom: 30,
        left: marginLeft
    };

    // Calculate total content height
    const contentHeight = barHeights.reduce((sum, h) => sum + h, 0) + (data.length - 1) * barSpacing;
    const baseHeight = margin.top + contentHeight + margin.bottom;

    // Create our high-resolution canvas
    const scale = 2;
    const canvas = createCanvas(baseWidth * scale, baseHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    // White background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, baseWidth * scale, baseHeight * scale);

    // Stats needed for bar length calculations
    const chartWidth = baseWidth - margin.left - margin.right;
    const totalSum = data.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const maxValue = Math.max(...data.map(d => d.value || 0)) || 1;
    const xScale = chartWidth / (maxValue * 1.2);

    // Example color palette for 'radio-ordered' questions
    const redYellowGreenPalette = [
        "#C83232", "#DC4646", "#F07850", "#FCB464", "#FEE090",
        "#FFFFBF", "#D9EF8B", "#A6D96A", "#82BE6E", "#50AA5A"
    ];

    // Text settings
    ctx.textBaseline = "middle";
    ctx.font = "bold 14px Arial";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw each bar at its own y-position
    let y = margin.top;
    for (let i = 0; i < data.length; i++) {
        const d = data[i];
        const lines = labelLines[i];
        const barHeight = barHeights[i];
        const barWidth = (d.value || 0) * xScale;

        // Determine the fill color
        let fillColor;
        if (questionType === "radio-ordered") {
            const maxIndex = data.length - 1;
            const paletteIndex = Math.round((redYellowGreenPalette.length - 1) * (i / maxIndex));
            fillColor = redYellowGreenPalette[paletteIndex];
        } else if (correctAnswers && correctAnswers.length > 0) {
            fillColor = correctAnswers.includes(d.label) ? "#4CAF50" : "#FF5252";
        } else {
            fillColor = "#C9EBF8";
        }

        // Draw rounded bar
        ctx.fillStyle = fillColor;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(margin.left, y, barWidth, barHeight, cornerRadius);
            ctx.fill();
        } else {
            drawRoundedRect(ctx, margin.left, y, barWidth, barHeight, cornerRadius);
        }

        // Labels to the left
        ctx.fillStyle = "#000";
        ctx.shadowColor = "rgba(0,0,0,0.2)";
        ctx.shadowBlur = 2;
        ctx.textAlign = "right";
        ctx.font = "12px Arial";

        const lineHeight = Math.min(minLineHeight, barHeight / lines.length);
        lines.forEach((line, idx) => {
            ctx.fillText(
                line,
                margin.left - 15,
                y + barHeight / 2 + (idx - (lines.length - 1) / 2) * lineHeight
            );
        });

        // Values and percents to the right
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";
        const pct = ((d.value / totalSum) * 100).toFixed(1);
        ctx.fillText(
            `${d.value || 0} (${pct}%)`,
            margin.left + barWidth + 15,
            y + barHeight / 2
        );

        // Move y to the next bar position
        y += barHeight + barSpacing;
    }

    // Return both the PNG buffer AND the intended display width/height
    return {
        buffer: canvas.toBuffer("image/png"),
        width: baseWidth,
        height: baseHeight
    };
}

// Fallback for roundRect
function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

// Simple text-wrapping for labels
function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = `${currentLine} ${word}`;
        if (ctx.measureText(testLine).width < maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// ------------------------------------------------------------------
// 2) The main DOCX generation code, using generateChartImage()
// ------------------------------------------------------------------
async function createDocxResults(
    assessments,
    filePath,
    monitoringName,
    selectedDay,
    language,
    status,
    userId,
    sandbox
) {
    const aggregatedData = await aggregateResponses(assessments);
    const children = [];

    // Insert the logo
    children.push(
        new Paragraph({
            children: [
                new ImageRun({
                    data: logoPng,
                    transformation: {
                        width: 255,
                        height: 113,
                    },
                    type: "png",
                }),
            ],
            alignment: AlignmentType.CENTER,
        })
    );

    // Document title
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: monitoringName || "Monitoring Report",
                    font: "Arial",
                    color: "000000",
                    bold: true,
                    size: 48, // bigger text
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: {
                before: 5000,
            },
        }),
        new Paragraph({ children: [] })
    );

    // Build content by iterating aggregated data
    let isFirstQuestionAfterSection = true;

    // Sort assessment types by their defined order
    const sortedAssessmentTypes = Object.keys(aggregatedData).sort((a, b) => {
        const orderA = ASSESSMENT_TYPE_ORDER[a] || 999; // Default to end if type not found
        const orderB = ASSESSMENT_TYPE_ORDER[b] || 999;
        return orderA - orderB;
    });

    for (const assessmentType of sortedAssessmentTypes) {
        for (const assessmentName in aggregatedData[assessmentType]) {
            const items = aggregatedData[assessmentType][assessmentName];
            const assessmentData = items.questions;

            const hasRenderableContent = Object.values(assessmentData).some(item => {
                if (!item) return false;

                const hasText = item.questionType === 'text' && Array.isArray(item.chartData) && item.chartData.some(x => x);
                const hasChart = ['radio-ordered', 'checkbox', 'radio-unordered'].includes(item.questionType)
                    && item.chartData && (Array.isArray(item.chartData) ? item.chartData.length > 0 : Object.keys(item.chartData).length > 0);
                const hasCompetencies = Array.isArray(item.competencies) && item.competencies.length > 0;

                return hasText || hasChart || hasCompetencies;
            });

            if (!hasRenderableContent) continue;

            // Add an assessment title
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: assessmentName,
                            font: "Arial",
                            color: "000000",
                            bold: true,
                            size: 28,
                        }),
                    ],
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    pageBreakBefore: true,
                    spacing: { after: 100 },
                })
            );

            // Add owner's name if available
            if (items.ownerId) {
                try {
                    const owner = await getUserWithId(items.ownerId);
                    if (owner && owner.firstName && owner.lastName) {
                        children.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `${owner.firstName} ${owner.lastName}`,
                                        font: "Arial",
                                        color: "000000",
                                        italics: true,
                                        size: 20,
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 300 },
                            })
                        );
                    }
                } catch (error) {
                    console.error("Error fetching owner information:", error);
                    // Continue without owner name if there's an error
                }
            }

            isFirstQuestionAfterSection = true;

            const workshopsOrdered = groupByWorkshop(
                (assessments.find(a => a.name === assessmentName && a.type === assessmentType) || {}).workshops,
                Object.values(assessmentData),
                (qd) => qd.workshopId || null
            );

            for (const { label, questions } of workshopsOrdered) {
                if (label) {
                    isFirstQuestionAfterSection = true;
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: label,
                                    font: "Arial",
                                    color: "000000",
                                    bold: true,
                                    size: 24,
                                }),
                            ],
                            heading: HeadingLevel.HEADING_2,
                        })
                    );
                }

                for (const questionData of questions) {
                    // Page break if needed
                    if (!isFirstQuestionAfterSection) {
                        children.push(
                            new Paragraph({
                                children: [],
                                pageBreakBefore: true,
                            })
                        );
                    }

                    // Question text
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: questionData.questionType === 'single-text'
                                        ? questionData.questionText
                                        : `${questionData.questionText} (N = ${questionData.respondentCount})`,
                                    font: "Arial",
                                    color: "000000",
                                    bold: true,
                                    size: 20,
                                }),
                            ],
                            heading: HeadingLevel.HEADING_3,
                            spacing: { after: 300 },
                        })
                    );

                    isFirstQuestionAfterSection = false;

                    // Handle text questions with summarization
                    if (questionData.questionType === "text") {
                        let textAnalysis = "";
                        if (questionData.chartData && questionData.chartData.length > 0) {
                            const allResponsesNull = questionData.chartData.every(
                                response => response === null
                            );
                            if (!allResponsesNull) {
                                // Use the new dedicated endpoint for text summarization
                                try {
                                    const response = await axios.post(`${BACKEND_URL}/api/generate-text-summary`, {
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
                                    const response = await axios.post(`${BACKEND_URL}/api/generate-text-summary`, {
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

                        children.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: textAnalysis,
                                        font: "Arial",
                                        color: "000000",
                                        italics: true,
                                    }),
                                ],
                                spacing: { after: 300 },
                            })
                        );

                        // Optionally list raw text responses
                        questionData.chartData.forEach(responseText => {
                            if (responseText) {
                                children.push(
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: responseText,
                                                font: "Arial",
                                                color: "000000",
                                            }),
                                        ],
                                    })
                                );
                            }
                        });
                    }

                    // Handle radio/checkbox/matrix with a chart
                    if (["radio-ordered", "checkbox", "radio-unordered"].includes(questionData.questionType)) {
                        try {

                            // generateChartImage now returns { buffer, width, height }
                            const result = await generateChartImage(
                                questionData.chartData,
                                questionData.correctAnswer,
                                questionData.questionType
                            );
                            if (!result) {
                                console.warn(`No chart generated for: ${questionData.questionText}`);
                                continue;
                            }
                            const { buffer: imageBuffer, width: chartW, height: chartH } = result;

                            // ---- NEW PART: clamp the final displayed width in doc ----
                            const maxPageWidth = 600; // or whatever fits your page
                            let displayWidth = chartW;
                            let displayHeight = chartH;

                            if (chartW > maxPageWidth) {
                                const ratio = maxPageWidth / chartW;
                                displayWidth = maxPageWidth;
                                displayHeight = Math.round(chartH * ratio);
                            }

                            // Insert the image at the possibly reduced size
                            children.push(
                                new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: imageBuffer,
                                            type: "png",
                                            transformation: {
                                                width: displayWidth,
                                                height: displayHeight,
                                            }
                                        })
                                    ]
                                })
                            );
                        } catch (error) {
                            console.error(`Error generating chart for: ${questionData.questionText}`, error);
                            children.push(createStyledParagraph("Error generating chart"));
                        }
                    }

                    // If there are competencies, render them in a table
                    if (questionData.competencies && questionData.competencies.length > 0) {
                        const table = new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: "single", size: 1, color: "CCCCCC" },
                                bottom: { style: "single", size: 1, color: "CCCCCC" },
                                left: { style: "single", size: 1, color: "CCCCCC" },
                                right: { style: "single", size: 1, color: "CCCCCC" },
                                insideHorizontal: { style: "single", size: 1, color: "CCCCCC" },
                            },
                            rows: questionData.competencies.map(c => {
                                return new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: c,
                                                            font: "Arial",
                                                            size: 20
                                                        })
                                                    ]
                                                })
                                            ],
                                            margins: {
                                                top: 100,
                                                bottom: 100,
                                                left: 200,
                                                right: 200
                                            }
                                        })
                                    ]
                                });
                            })
                        });

                        children.push(new Paragraph({ spacing: { before: 0 } }));
                        children.push(table);
                        children.push(new Paragraph({ spacing: { after: 400 } }));
                    }
                }
            }
        }
    }

    // Create and write the doc
    const doc = new Document({
        creator: "Digital Training Companion",
        title: monitoringName || "Exported Results",
        description: "Assessment results exported from the application.",
        sections: [{ children }],
        styles: {
            paragraphStyles: [
                {
                    id: "default",
                    name: "Default",
                    run: { font: "Arial" },
                },
            ],
        },
    });

    try {
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(filePath, buffer);
        console.log(`DOCX file saved to: ${filePath}`);
    } catch (error) {
        console.error("Error saving DOCX file:", error);
    }
}

// ------------------------------------------------------------------
// 3) Aggregate responses (unchanged logic)
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

function createStyledParagraph(text, options = {}) {
    return new Paragraph({
        children: [
            new TextRun({
                text,
                font: "Arial",
                color: "000000",
                ...options
            })
        ],
        spacing: {
            before: 200,
            after: 200,
            line: 360,
            lineRule: "auto"
        },
        ...options
    });
}

module.exports = createDocxResults;
