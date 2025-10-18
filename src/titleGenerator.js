export function generateTitles(summary, customInstructions = '') {
  const titles = [];

  const instructions = `
Generate 4 distinct titles (maximum 25 words each) for a 1000-word summary.
Each title MUST include:
- Company name
- The action or product
- Important statistics/metrics

${customInstructions ? `Additional requirements: ${customInstructions}` : ''}

Summary: ${summary}
  `.trim();

  for (let i = 1; i <= 4; i++) {
    const title = extractKeyInfo(summary, i, customInstructions);
    titles.push({
      title_number: i,
      title_text: title
    });
  }

  return titles;
}

function extractKeyInfo(summary, titleNumber, customInstructions) {
  const words = summary.split(/\s+/);
  const patterns = {
    company: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|Corp|LLC|Ltd|Company|Co))?)\b/g,
    numbers: /\b\d+(?:[.,]\d+)?(?:\s*(?:%|percent|million|billion|thousand|years?|months?))?\b/gi,
    actions: /\b(?:launched?|released?|announced?|acquired?|merged?|expanded?|grew|increased?|decreased?|reported?|achieved?|reached?)\b/gi
  };

  const companies = [...new Set(summary.match(patterns.company) || [])];
  const stats = [...new Set(summary.match(patterns.numbers) || [])].slice(0, 3);
  const actions = [...new Set(summary.match(patterns.actions) || [])];

  const shouldExcludeExecutives = customInstructions.toLowerCase().includes('exclude executive') ||
                                   customInstructions.toLowerCase().includes('no executive');

  let title = '';

  if (companies.length > 0 && stats.length > 0 && actions.length > 0) {
    const company = companies[Math.min(titleNumber - 1, companies.length - 1)];
    const action = actions[Math.min(titleNumber - 1, actions.length - 1)];
    const stat = stats[Math.min(titleNumber - 1, stats.length - 1)];

    const variations = [
      `${company} ${action} with ${stat} in key metrics`,
      `${company}'s ${action} drives ${stat} growth`,
      `${stat} milestone: ${company} ${action} successfully`,
      `${company} achieves ${stat} through strategic ${action}`
    ];

    title = variations[(titleNumber - 1) % variations.length];
  } else {
    const snippet = words.slice((titleNumber - 1) * 10, (titleNumber - 1) * 10 + 15).join(' ');
    title = `Summary ${titleNumber}: ${snippet}${snippet.length < summary.length ? '...' : ''}`;
  }

  if (title.split(/\s+/).length > 25) {
    title = title.split(/\s+/).slice(0, 25).join(' ') + '...';
  }

  return title;
}
