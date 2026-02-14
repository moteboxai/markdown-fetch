/**
 * OpenRouter Integration Example
 * Scrape web content and send to any LLM via OpenRouter
 */

const { fetchMarkdown } = require('../markdown-fetch');

async function summarizeUrl(url, model = 'anthropic/claude-3-sonnet') {
  // 1. Fetch content as markdown (80% token reduction)
  const content = await fetchMarkdown(url, { includeMetadata: true });
  
  console.log(`Fetched ${url}`);
  console.log(`Method: ${content.method}`);
  console.log(`Tokens: ${content.tokens || 'N/A'}`);
  console.log(`Content length: ${content.content.length} chars\n`);
  
  // 2. Send to OpenRouter
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/moteboxai/markdown-fetch',
      'X-Title': 'markdown-fetch example'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: `Summarize this web page in 3 bullet points:\n\n${content.content}`
        }
      ]
    })
  });
  
  const result = await response.json();
  
  return {
    url,
    model,
    tokensIn: content.tokens,
    summary: result.choices[0].message.content,
    usage: result.usage
  };
}

// Example usage
if (require.main === module) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    console.error('Error: Set OPENROUTER_API_KEY environment variable');
    console.log('Get your key at: https://openrouter.ai/keys');
    process.exit(1);
  }
  
  // Try different models via OpenRouter
  const examples = [
    { url: 'https://example.com', model: 'anthropic/claude-3-sonnet' },
    { url: 'https://github.com/moteboxai', model: 'x-ai/grok-beta' },
  ];
  
  (async () => {
    for (const { url, model } of examples) {
      console.log(`\n🔍 Summarizing with ${model}...\n`);
      const result = await summarizeUrl(url, model);
      console.log('Summary:');
      console.log(result.summary);
      console.log(`\nTokens used: ${result.usage.total_tokens}`);
      console.log('---');
    }
  })();
}

module.exports = { summarizeUrl };
