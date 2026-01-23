// Renumber assessment positions per monitoring to 1..N.
// Sort by position ASC; if equal, by creationDate ASC, then _id ASC.

const monitoringIdsToProcess = db.assessments.distinct("monitoringId", { monitoringId: { $exists: true, $ne: null } });
let totalAssessmentsUpdated = 0;

monitoringIdsToProcess.forEach(monitoringId => {
  const assessmentsInMonitoring = db.assessments.find(
    { monitoringId },
    { _id: 1, position: 1, creationDate: 1 }
  ).toArray();

  if (!assessmentsInMonitoring.length) return;

  const sortedAssessmentsInMonitoring = assessmentsInMonitoring.sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    const aCreationTs = a.creationDate ? new Date(a.creationDate).getTime() : 0;
    const bCreationTs = b.creationDate ? new Date(b.creationDate).getTime() : 0;
    if (aCreationTs !== bCreationTs) return aCreationTs - bCreationTs;
    return String(a._id).localeCompare(String(b._id));
  });

  const bulkWriteRequests = sortedAssessmentsInMonitoring.map((assessment, index) => ({
    updateOne: {
      filter: { _id: assessment._id },
      update: { $set: { position: index + 1 } }
    }
  }));

  db.assessments.bulkWrite(bulkWriteRequests);
  totalAssessmentsUpdated += bulkWriteRequests.length;
  print(`Monitoring ${monitoringId}: updated ${bulkWriteRequests.length} assessments`);
});

print(`Done. Total assessments updated: ${totalAssessmentsUpdated}`);


