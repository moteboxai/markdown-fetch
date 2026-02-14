/**
 * Cost Calculator: See real savings from markdown vs HTML
 */

const PRICING = {
  // Per million tokens (input)
  'gpt-4': 5.00,
  'gpt-4-turbo': 10.00,
  'claude-3-opus': 15.00,
  'claude-3-sonnet': 3.00,
  'grok-beta': 5.00,
  'openrouter/anthropic/claude-3-opus': 15.00,
  'openrouter/anthropic/claude-3-sonnet': 3.00,
  'openrouter/openai/gpt-4': 5.00,
  'openrouter/x-ai/grok-beta': 5.00,
};

const AVG_TOKENS = {
  html: 16180,      // Average blog post as HTML
  markdown: 3150    // Same content as Markdown (80% reduction)
};

function calculateSavings(urlsPerDay, daysPerMonth = 30, model = 'gpt-4') {
  const totalUrls = urlsPerDay * daysPerMonth;
  
  const htmlTokens = totalUrls * AVG_TOKENS.html;
  const markdownTokens = totalUrls * AVG_TOKENS.markdown;
  const tokensSaved = htmlTokens - markdownTokens;
  
  const pricePerMillion = PRICING[model] || 5.00;
  
  const htmlCost = (htmlTokens / 1_000_000) * pricePerMillion;
  const markdownCost = (markdownTokens / 1_000_000) * pricePerMillion;
  const moneySaved = htmlCost - markdownCost;
  
  return {
    totalUrls,
    htmlTokens: htmlTokens.toLocaleString(),
    markdownTokens: markdownTokens.toLocaleString(),
    tokensSaved: tokensSaved.toLocaleString(),
    reductionPercent: ((tokensSaved / htmlTokens) * 100).toFixed(1),
    htmlCost: htmlCost.toFixed(2),
    markdownCost: markdownCost.toFixed(2),
    moneySaved: moneySaved.toFixed(2),
    model
  };
}

// Example usage
if (require.main === module) {
  console.log('📊 Markdown.new Cost Savings Calculator\n');
  
  const scenarios = [
    { urlsPerDay: 10, model: 'gpt-4' },
    { urlsPerDay: 100, model: 'claude-3-sonnet' },
    { urlsPerDay: 1000, model: 'openrouter/x-ai/grok-beta' },
  ];
  
  scenarios.forEach(({ urlsPerDay, model }) => {
    const savings = calculateSavings(urlsPerDay, 30, model);
    console.log(`Scenario: ${urlsPerDay} URLs/day on ${model}`);
    console.log(`  Total URLs:      ${savings.totalUrls.toLocaleString()}/month`);
    console.log(`  HTML tokens:     ${savings.htmlTokens}`);
    console.log(`  Markdown tokens: ${savings.markdownTokens}`);
    console.log(`  Tokens saved:    ${savings.tokensSaved} (${savings.reductionPercent}%)`);
    console.log(`  HTML cost:       $${savings.htmlCost}`);
    console.log(`  Markdown cost:   $${savings.markdownCost}`);
    console.log(`  💰 Monthly savings: $${savings.moneySaved}`);
    console.log('');
  });
}

module.exports = { calculateSavings, PRICING };
