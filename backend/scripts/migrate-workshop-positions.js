// README
// This script is used to migrate the workshop positions from the old to the new schema.
// RUN THE SCRIPT FROM A MONGOSH SHELL AND IN SEPARATE STEPS: 
// first for assessments (step 1 , step 2), then for responses (step 1, step 2).

// ************ ASSESSMENTS ************

// Step 1: Update current collections with new fields
const assessments = db.assessments.find({ "questions.workshop": { $exists: true } });
const bulkOperations = [];
assessments.forEach(assessment => {
    // Collect all distinct workshop labels from questions
    const workshopLabels = [...new Set(
        (assessment.questions || [])
            .map(question => (question.workshop || "").trim())
            .filter(label => label && typeof label === "string")
    )];

    // Build the new workshops array
    const newWorkshops = workshopLabels.map((label, index) => ({
        _id: new ObjectId(),
        label,
        workshopPosition: index + 1
    }));

    // Map label -> _id for quick lookup
    const workshopIdByLabel = Object.fromEntries(
    newWorkshops.map(workshop => [workshop.label, workshop._id])
    );

    // Update each question with the new workshopId
    const updatedQuestions = (assessment.questions || []).map(question => {
        const label = (question.workshop || "").trim();
        const workshopId = label ? (workshopIdByLabel[label] || null) : null;
        return { ...question, workshopId };
    });

    // Add to bulk operation list
    bulkOperations.push({
        updateOne: {
            filter: { _id: assessment._id },
            update: { $set: { workshops: newWorkshops, questions: updatedQuestions } }
        }
    });

    // Execute periodically in batches of 500
    if (bulkOperations.length >= 500) {
        db.assessments.bulkWrite(bulkOperations);
        bulkOperations.length = 0;
    }
});
if (bulkOperations.length) db.assessments.bulkWrite(bulkOperations);

// Step 2: Delete old fields
db.assessments.updateMany(
{ "questions.workshop": { $exists: true } },
{ $unset: { "questions.$[].workshop": "" } }
);
  
// ************ RESPONSES ************

// Step 1: Update current collections with new fields
const responses = db.response.find({ "survey.workshop": { $exists: true } });
const bulkOperations = [];

responses.forEach(response => {
    // Load linked assessment
    const assessment = response.assessmentId
    ? db.assessments.findOne({ _id: response.assessmentId })
    : null;

    // Build label -> _id map from assessment.workshops
    const workshopIdByLabel = {};
    if (assessment && Array.isArray(assessment.workshops)) {
    assessment.workshops.forEach(workshop => {
        if (workshop && typeof workshop.label === "string") {
        // normalize to trimmed label
        workshopIdByLabel[workshop.label.trim()] = workshop._id;
        }
    });
    }

    // Update each survey question with workshopId (defensive against null/undefined/non-objects)
    const updatedSurvey = Array.isArray(response.survey)
    ? response.survey.map(question => {
        if (!question || typeof question !== "object") return question; // leave as-is
        const rawLabel = (typeof question.workshop === "string") ? question.workshop : "";
        const normalizedLabel = rawLabel.trim();
        const workshopId = (normalizedLabel && Object.prototype.hasOwnProperty.call(workshopIdByLabel, normalizedLabel))
            ? workshopIdByLabel[normalizedLabel]
            : null;
        return { ...question, workshopId };
        })
    : response.survey;

    bulkOperations.push({
    updateOne: {
        filter: { _id: response._id },
        update: { $set: { survey: updatedSurvey } }
    }
    });

    if (bulkOperations.length >= 500) {
    db.response.bulkWrite(bulkOperations);
    bulkOperations.length = 0;
    }
});
if (bulkOperations.length) db.response.bulkWrite(bulkOperations);

// Step 2: Delete old fields
db.response.updateMany(
    { "survey.workshop": { $exists: true } },
    { $unset: { "survey.$[].workshop": "" } }
);
  
