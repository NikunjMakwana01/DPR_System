const DPR_TOTAL_KEYS = ['longApp', 'shortApp', 'availability', 'screening', 'assessment'];

const emptyTotals = () => ({
  longApp: 0,
  shortApp: 0,
  availability: 0,
  screening: 0,
  assessment: 0,
});

const normalizeDPR = (report) => {
  const r = report?.toObject ? report.toObject() : { ...report };

  return {
    ...r,
    longApp: r.longApp ?? r.applicationsSubmitted ?? 0,
    shortApp: r.shortApp ?? r.rejected ?? 0,
    availability: r.availability ?? r.offers ?? 0,
    screening: r.screening ?? r.joined ?? 0,
    assessment: r.assessment ?? r.interviewsScheduled ?? 0,
  };
};

const pickDPRPayload = (body) => ({
  longApp: Number(body.longApp) || 0,
  shortApp: Number(body.shortApp) || 0,
  availability: Number(body.availability) || 0,
  screening: Number(body.screening) || 0,
  assessment: Number(body.assessment) || 0,
  remarks: body.remarks || '',
});

const addToTotals = (totals, report) => {
  const r = normalizeDPR(report);
  DPR_TOTAL_KEYS.forEach((key) => {
    totals[key] += r[key] || 0;
  });
  return totals;
};

module.exports = {
  DPR_TOTAL_KEYS,
  emptyTotals,
  normalizeDPR,
  pickDPRPayload,
  addToTotals,
};
