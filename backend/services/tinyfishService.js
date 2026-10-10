const axios = require('axios');

const SEARCH_URL   = 'https://api.search.tinyfish.ai';
const AGENT_URL    = 'https://agent.tinyfish.ai/v1/automation/run';
const RESEARCH_URL = 'https://agent.tinyfish.ai/v1/automation/run-research';

function apiHeaders() {
  return {
    'X-API-Key': process.env.TINYFISH_API_KEY,
    'Content-Type': 'application/json',
  };
}

// -------- GEAR SEARCH via TinyFish Search API (fast, free) --------
async function searchGearPrices(productName, maxPrice) {
  const priceClause = maxPrice ? (' under ' + maxPrice + ' rupees') : '';
  const query = 'buy ' + productName + priceClause + ' price India site:flipkart.com OR site:amazon.in OR site:decathlon.in';

  try {
    const response = await axios.get(SEARCH_URL, {
      params: { query: query, location: 'IN', language: 'en' },
      headers: apiHeaders(),
      timeout: 20000,
    });

    const raw = (response.data && response.data.results) ? response.data.results : [];

    const results = raw.slice(0, 8).map((r) => {
      // Try to extract a price like "Rs. 2,499" or "₹2,499" from title/snippet
      const text = (r.title || '') + ' ' + (r.snippet || '');
      const match = text.match(/(?:Rs\.?|INR|\u20B9)\s*([0-9,]{2,7})/i);
      const price = match ? Number(match[1].replace(/,/g, '')) : 0;
      return {
        name:   r.title || 'Unknown product',
        price:  price,
        source: r.site_name || 'web',
        url:    r.url || '',
        image:  '',
        snippet: r.snippet || '',
      };
    });

    return results;
  } catch (err) {
    const detail = (err.response && err.response.data) || err.message;
    console.error('[TinyFish] gear search failed:', detail);
    return [];
  }
}

// -------- DYNAMIC QUESTS via TinyFish Search API (same reasoning) --------
async function startEventResearch(city, webhookUrl) {
  // We now use Search API synchronously and return the results directly.
  // The webhook flow is dropped - faster and more reliable.
  const query = 'running marathon cycling race fitness event ' + city + ' India 2026 register';

  try {
    const response = await axios.get(SEARCH_URL, {
      params: { query: query, location: 'IN', language: 'en' },
      headers: apiHeaders(),
      timeout: 20000,
    });

    const raw = (response.data && response.data.results) ? response.data.results : [];
    const events = raw.slice(0, 10).map((r) => ({
      name:     r.title || 'Event',
      date:     r.date || null,
      location: city,
      url:      r.url || '',
      snippet:  r.snippet || '',
    }));

    return { events: events, source: 'search-api' };
  } catch (err) {
    const detail = (err.response && err.response.data) || err.message;
    console.error('[TinyFish] event research failed:', detail);
    return { events: [] };
  }
}

module.exports = { searchGearPrices, startEventResearch };