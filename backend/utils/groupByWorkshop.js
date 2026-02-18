// Single helper to group items by workshop ordering using workshopId only
// - workshops: array of workshop objects ({ _id, label, workshopPosition })
// - items: array of items (questions or aggregated question objects)
// - getWorkshopId: function that returns a workshopId string from an item
// Returns: [{ workshopId, label, questions }], ordered by workshopPosition; unassigned appended at end
function groupByWorkshop(workshops = [], items = [], getWorkshopId = () => null) {
    const list = Array.isArray(workshops) ? [...workshops] : [];

    // Initialize groups by known workshop ids
    const groupedById = new Map();
    list.forEach(w => groupedById.set(w?._id ? String(w._id) : null, []));

    // Split items into mapped and unassigned buckets
    const unassigned = [];
    (items || []).forEach(item => {
        const wid = getWorkshopId(item);
        const key = wid ? String(wid) : null;
        if (key && groupedById.has(key)) {
            groupedById.get(key).push(item);
        } else {
            unassigned.push(item);
        }
    });

    // Order groups by workshopPosition and attach questions
    const ordered = list
        .slice()
        .sort((a, b) => (a?.workshopPosition ?? 0) - (b?.workshopPosition ?? 0))
        .map(w => ({
            workshopId: w?._id ? String(w._id) : null,
            label: w?.label ?? null,
            questions: groupedById.get(w?._id ? String(w._id) : null) || []
        }));

    if (unassigned.length > 0) {
        ordered.push({ workshopId: 'unassigned', label: null, questions: unassigned });
    }

    return ordered;
}

module.exports = groupByWorkshop;


