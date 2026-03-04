function getDateRange(range) {
  const now = new Date();
  let from;
  switch (range) {
    case 'daily':
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
    case 'week': {
      const day = now.getDay();
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      break;
    }
    case '4weeks': {
      from = new Date(now);
      from.setDate(from.getDate() - 28);
      from.setHours(0, 0, 0, 0);
      break;
    }
    case 'monthly':
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
    case 'year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
    default:
      return { from: null, to: null };
  }
  return { from: from.toISOString(), to: now.toISOString() };
}
function parseDateParams(query) {
  if (query.from && query.to) {
    return { from: query.from, to: query.to };
  }
  if (query.range) {
    return getDateRange(query.range);
  }
  return { from: null, to: null };
}
module.exports = { getDateRange, parseDateParams };
