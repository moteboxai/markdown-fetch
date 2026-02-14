/**
 * Grok Integration Example
 * Scrape web content and analyze with Grok (x.ai)
 */

const { fetchMarkdown } = require('../markdown-fetch');

async function analyzeWithGrok(url, prompt = 'Summarize this in 3 bullet points') {
  // 1. Fetch content as markdown
  const content = await fetchMarkdown(url, { includeMetadata: true });
  
  console.log(`📄 Fetched: ${url}`);
  console.log(`   Method: ${content.method}`);
  console.log(`   Tokens: ${content.tokens || 'N/A'}`);
  console.log(`   Size: ${content.content.length} chars\n`);
  
  // 2. Send to Grok via x.ai API
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: 'You are Grok, a helpful AI assistant analyzing web content.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nContent:\n${content.content}`
        }
      ],
      model: 'grok-beta',
      stream: false,
      temperature: 0
    })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Grok API error: ${result.error?.message || response.statusText}`);
  }
  
  return {
    url,
    tokensIn: content.tokens,
    analysis: result.choices[0].message.content,
    usage: result.usage,
    model: result.model
  };
}

// RAG example: Build knowledge base from multiple URLs
async function buildKnowledgeBase(urls) {
  console.log('🔨 Building knowledge base from URLs...\n');
  
  const knowledge = [];
  
  for (const url of urls) {
    try {
      const analysis = await analyzeWithGrok(url, 'Extract key facts and concepts from this page');
      knowledge.push({
        url,
        facts: analysis.analysis,
        tokens: analysis.tokensIn
      });
      console.log(`✓ Processed: ${url}\n`);
    } catch (error) {
      console.error(`✗ Failed: ${url}`, error.message);
    }
  }
  
  // Now ask Grok to synthesize
  const combined = knowledge.map(k => `Source: ${k.url}\n${k.facts}`).join('\n\n---\n\n');
  
  const synthesis = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: `Synthesize these sources into a comprehensive overview:\n\n${combined}`
        }
      ],
      model: 'grok-beta'
    })
  });
  
  const result = await synthesis.json();
  
  return {
    sources: knowledge.length,
    totalTokens: knowledge.reduce((sum, k) => sum + (k.tokens || 0), 0),
    synthesis: result.choices[0].message.content
  };
}

// Example usage
if (require.main === module) {
  const XAI_API_KEY = process.env.XAI_API_KEY;
  
  if (!XAI_API_KEY) {
    console.error('Error: Set XAI_API_KEY environment variable');
    console.log('Get your key at: https://console.x.ai');
    process.exit(1);
  }
  
  (async () => {
    // Single URL analysis
    console.log('Example 1: Single URL Analysis\n');
    const result = await analyzeWithGrok('https://github.com/moteboxai/markdown-fetch');
    console.log('🤖 Grok says:');
    console.log(result.analysis);
    console.log(`\n📊 Tokens: ${result.usage.total_tokens}\n`);
    
    // Multi-URL RAG
    console.log('\nExample 2: Multi-URL Knowledge Base\n');
    const kb = await buildKnowledgeBase([
      'https://example.com',
      'https://github.com/moteboxai'
    ]);
    console.log('\n📚 Synthesized Knowledge:');
    console.log(kb.synthesis);
    console.log(`\n📊 Total sources: ${kb.sources}, Total tokens: ${kb.totalTokens}`);
  })();
}

module.exports = { analyzeWithGrok, buildKnowledgeBase };
