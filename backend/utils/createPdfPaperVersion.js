const PDFDocument = require('pdfkit');
const fs = require('fs');
const SVGtoPDF = require('svg-to-pdfkit');
const QRCode = require('qrcode');
const logoSvg = fs.readFileSync('./assets/logo.svg', 'utf8');
const groupByWorkshop = require('./groupByWorkshop');

const FRONTEND_URL = process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL_PRODUCTION : process.env.FRONTEND_URL_DEVELOPMENT;

async function createPdfPaperVersion(userId, monitoringId, assessmentIds, isLinked, lng, sandbox, assessments, filePath, monitoringName) {
    const assessmentsQuery = assessmentIds.map(id => `assessment[]=${id}`).join('&');
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    const qrCodeDataUrl = await QRCode.toDataURL(`${FRONTEND_URL}/reporting?user=${userId}&monitoring=${monitoringId}&${assessmentsQuery}&link=${isLinked}&lng=${lng}&sandbox=${sandbox}`);

    console.log(`${FRONTEND_URL}/reporting?user=${userId}&monitoring=${monitoringId}&${assessmentsQuery}&link=${isLinked}&lng=${lng}&sandbox=${sandbox}`);

    const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    return new Promise((resolve, reject) => {
        doc.pipe(stream);

        const logoWidth = 150;
        const logoX = 20;
        const logoY = 20;
        SVGtoPDF(doc, logoSvg, logoX, logoY - 350, { width: logoWidth });

        const qrCodeSize = 100;
        const qrCodeX = doc.page.width - qrCodeSize - 10;
        const qrCodeY = 15;
        doc.image(qrCodeBuffer, qrCodeX, qrCodeY, { width: qrCodeSize, height: qrCodeSize });

        const qrCodeTextY = qrCodeSize + 15;
        doc.fontSize(8).font('Helvetica').fillColor('black').text("Reserved for reporting answers", qrCodeX, qrCodeTextY, { width: qrCodeSize, align: 'center' });

        doc.moveDown(5);
        doc.fontSize(25).font('Helvetica-Bold').fillColor('black').text(`${monitoringName}`, 50, 170, { align: 'center' });
        doc.moveDown(1);

        assessments.forEach((assessment, index) => {
            if (index > 0) {
                doc.addPage();
            }

            doc.fontSize(20).font('Helvetica-Bold').fillColor('black').text(`${assessment.name}`, { align: 'left' });
            doc.moveDown(0.5);

            const workshopsOrdered = groupByWorkshop(assessment.workshops, assessment.questions, (q) => q.workshopId ? q.workshopId.toString() : null);

            workshopsOrdered.forEach(({ label, questions }) => {
                if (label) {
                    doc.fontSize(18).font('Helvetica-Bold').fillColor('black').text(label, { align: 'left' });
                    doc.moveDown(0.3);
                }

                let questionCounter = 1;

                questions.forEach((question, qIndex) => {
                    // Skip matrix questions that are not the first one in their group
                    if (question.matrixId && question.matrixPosition !== 0) {
                        return;
                    }

                    const isTextOnly = question.questionType === 'single-text';

                    // Handle matrix questions
                    if (question.matrixId && question.matrixPosition === 0) {
                        // Gather all questions with the same matrixId
                        const matrixQuestions = questions
                            .filter(q => q.matrixId === question.matrixId)
                            .sort((a, b) => a.matrixPosition - b.matrixPosition);

                        const questionText = `Q${questionCounter}: ${question.matrixTitle}`;
                        const requiredHeight = calculateRequiredHeight({
                            ...question,
                            isMatrix: true,
                            items: matrixQuestions.map(q => q.question)
                        });

                        if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
                            doc.addPage();
                        }

                        doc.fontSize(16).font('Helvetica-Bold').fillColor('black').text(questionText, { align: 'left' });
                        doc.moveDown(0.5);

                        // Draw matrix table
                        drawMatrixTable(doc, {
                            items: matrixQuestions.map(q => q.question),
                            choices: question.choices || [],
                            questionType: question.questionType
                        });

                        questionCounter++;
                    } else {
                        // Handle regular questions
                        const questionText = isTextOnly
                            ? question.question
                            : `Q${questionCounter}: ${question.question}`;
                        const requiredHeight = calculateRequiredHeight(question);

                        if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
                            doc.addPage();
                        }

                        doc.fontSize(16).font('Helvetica-Bold').fillColor('black').text(questionText, { align: 'left' });
                        doc.moveDown(0.5);

                        if (['checkbox', 'radio-ordered', 'radio-unordered'].includes(question.questionType)) {
                            question.choices.forEach((choice, optIndex) => {
                                doc.fontSize(14).font('Helvetica').fillColor('black').text(`  ${String.fromCharCode(65 + optIndex)}. ${choice}`, { align: 'left' });
                                doc.moveDown(0.5);
                            });
                        } else if (question.questionType === 'text') {
                            const responseBoxHeight = 100;
                            const responseBoxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
                            const boxY = doc.y;

                            doc.rect(doc.page.margins.left, boxY, responseBoxWidth, responseBoxHeight)
                                .fillAndStroke('#f0f0f0', '#9F9F9F');
                            doc.moveDown(responseBoxHeight / 10 + 1.5);
                        }

                        if (!isTextOnly) {
                            questionCounter++;
                        }
                    }

                    doc.moveDown(0.5);
                });

                doc.moveDown(0.5);
            });
        });

        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', error => reject(new Error(`Error writing PDF file: ${error.message}`)));
    });
}

function calculateRequiredHeight(question) {
    let height = 40;

    if (question.isMatrix) {
        // For matrix questions, calculate height based on number of items and header
        const headerHeight = 30;
        const rowHeight = 25;
        height = headerHeight + (question.items.length * rowHeight) + 20;
    } else if (question.questionType === 'text') {
        height += 100;
    } else if (question.choices) {
        height += question.choices.length * 20;
    }

    return height;
}

function drawMatrixTable(doc, question) {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const cellPadding = {
        horizontal: 5,
        verticalQuestion: 5,
        verticalHeader: 2,
        verticalOption: 1
    };
    const maxItemWidth = pageWidth * 0.3;
    const minChoiceWidth = 60;
    const isCheckbox = question.questionType === 'checkbox';

    const itemWidth = Math.min(
        Math.max(...question.items.map(item => doc.widthOfString(item, { fontSize: 12 }) + cellPadding.horizontal * 2)),
        maxItemWidth
    );
    const remainingWidth = pageWidth - itemWidth;
    const choiceWidth = Math.max(
        Math.min(remainingWidth / question.choices.length, 120),
        minChoiceWidth
    );

    // Function to draw checkbox or radio button
    function drawInputElement(x, y, size, isCheckbox) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;

        if (isCheckbox) {
            // Draw checkbox (square)
            doc.rect(x, y, size, size)
                .stroke('#333333');
        } else {
            // Draw radio button (circle)
            doc.circle(centerX, centerY, size / 2)
                .stroke('#333333');
        }
    }

    function drawCell(x, y, width, height, text, options = {}) {
        const { fontSize = 12, font = 'Helvetica', align = 'left', valign = 'top', backgroundColor = '#ffffff', borderColor = '#808080', isQuestion = false, isHeader = false, isChoiceCell = false } = options;

        doc.rect(x, y, width, height).fillAndStroke(backgroundColor, borderColor);

        if (isChoiceCell && !text) {
            // Draw checkbox or radio button in choice cells
            const inputSize = 12;
            const inputX = x + (width - inputSize) / 2;
            const inputY = y + (height - inputSize) / 2;
            drawInputElement(inputX, inputY, inputSize, isCheckbox);
        } else if (text) {
            doc.font(font).fontSize(fontSize).fillColor('black');
            const textOptions = {
                width: width - cellPadding.horizontal * 2,
                align: align,
                lineBreak: true
            };

            let verticalPadding = isQuestion ? cellPadding.verticalQuestion :
                isHeader ? cellPadding.verticalHeader :
                    cellPadding.verticalOption;

            let textY = y + verticalPadding;
            if (valign === 'middle') {
                const textHeight = doc.heightOfString(text, { ...textOptions, fontSize });
                textY = y + (height - textHeight) / 2;
            }

            doc.text(text, x + cellPadding.horizontal, textY, textOptions);
        }
    }

    function drawHeader(y) {
        const maxHeaderHeight = Math.max(
            ...question.choices.map(choice =>
                doc.heightOfString(choice, { width: choiceWidth - cellPadding.horizontal * 2, lineBreak: true, fontSize: 12 })
            )
        );
        const headerHeight = Math.max(20, maxHeaderHeight + cellPadding.verticalHeader * 2);

        drawCell(doc.page.margins.left, y, itemWidth, headerHeight, '', { backgroundColor: '#f0f0f0', fontSize: 12, font: 'Helvetica-Bold', isHeader: true });
        question.choices.forEach((choice, index) => {
            drawCell(
                doc.page.margins.left + itemWidth + choiceWidth * index,
                y,
                choiceWidth,
                headerHeight,
                choice,
                { backgroundColor: '#f0f0f0', fontSize: 12, font: 'Helvetica-Bold', align: 'center', valign: 'middle', isHeader: true }
            );
        });
        return headerHeight;
    }

    let currentY = doc.y;
    const headerHeight = drawHeader(currentY);
    currentY += headerHeight;

    question.items.forEach((item, itemIndex) => {
        if (currentY + 20 > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            currentY = doc.page.margins.top;
            currentY += drawHeader(currentY);
        }

        const backgroundColor = itemIndex % 2 === 0 ? '#ffffff' : '#f9f9f9';
        const textHeight = doc.heightOfString(item, { width: itemWidth - cellPadding.horizontal * 2, fontSize: 12 });
        const rowHeight = Math.max(textHeight + cellPadding.verticalQuestion * 2, 25);

        drawCell(doc.page.margins.left, currentY, itemWidth, rowHeight, item, { backgroundColor, valign: 'middle', fontSize: 12, isQuestion: true });

        question.choices.forEach((_, choiceIndex) => {
            drawCell(
                doc.page.margins.left + itemWidth + choiceWidth * choiceIndex,
                currentY,
                choiceWidth,
                rowHeight,
                '',
                { backgroundColor, align: 'center', valign: 'middle', fontSize: 12, isChoiceCell: true }
            );
        });

        currentY += rowHeight;
    });

    doc.y = currentY + 15;
}

module.exports = createPdfPaperVersion;