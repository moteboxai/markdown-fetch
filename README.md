# markdown-fetch

Token-efficient web content fetching via [markdown.new](https://markdown.new)

## Why?

Feeding raw HTML to AI is expensive. markdown.new converts any URL to clean markdown with **80% token reduction**.

## Usage

```javascript
const { fetchMarkdown, fetchMarkdownBatch } = require('./lib/markdown-fetch');

// Simple fetch (returns string)
const content = await fetchMarkdown('https://example.com');

// Fetch with metadata (token count, method used)
const result = await fetchMarkdown('https://example.com', { 
  includeMetadata: true 
});
// {
//   content: "# Example...",
//   tokens: 725,
//   url: "https://example.com",
//   method: "markdown.new"
// }

// Batch fetch multiple URLs
const results = await fetchMarkdownBatch([
  'https://example.com',
  'https://github.com/moteboxai',
  'https://docs.openclaw.ai'
]);
```

## Options

```javascript
fetchMarkdown(url, {
  directFallback: true,    // Fall back to direct fetch if markdown.new fails
  timeout: 10000,          // Request timeout in ms
  includeMetadata: false   // Return { content, tokens, url, method } instead of just string
})
```

## How It Works

1. **Primary**: Fetches via `markdown.new/{url}` for clean markdown
2. **Fallback**: If markdown.new fails, falls back to direct fetch (if `directFallback: true`)
3. **Error**: Throws if both methods fail

## Token Savings

```
HTML:     <h2 class="section-title" id="about">About Us</h2>  (12-15 tokens)
Markdown: ## About Us                                          (3 tokens)

Blog post:  16,180 tokens (HTML) → 3,150 tokens (Markdown)
            80% reduction
```

## Integration

Replace `web_fetch` calls with `fetchMarkdown` where you need cleaner content:

```javascript
// Before
const content = await web_fetch(url);

// After
const { fetchMarkdown } = require('./lib/markdown-fetch');
const content = await fetchMarkdown(url);
```

## Testing

```bash
node lib/test-markdown-fetch.js
```

## Cost Savings Calculator

Real savings at scale:

```bash
node examples/cost-calculator.js
```

**Example scenarios:**

| URLs/day | Model | HTML Cost | Markdown Cost | Monthly Savings |
|----------|-------|-----------|---------------|-----------------|
| 10 | GPT-4 | $24.27 | $4.72 | **$19.55** |
| 100 | Claude-3-Sonnet | $145.62 | $28.35 | **$117.27** |
| 1,000 | Grok Beta | $2,427.00 | $472.50 | **$1,954.50** |

*Based on average blog post: 16k tokens (HTML) → 3k tokens (Markdown)*

## Integration Examples

### OpenRouter (any model)

```javascript
const { fetchMarkdown } = require('markdown-fetch');

async function summarizeUrl(url, model = 'anthropic/claude-3-sonnet') {
  const content = await fetchMarkdown(url, { includeMetadata: true });
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: `Summarize: ${content.content}` }]
    })
  });
  
  return await response.json();
}

// Works with: Claude, GPT-4, Grok, Llama, Gemini, etc.
```

### Grok (x.ai)

```javascript
const { analyzeWithGrok } = require('markdown-fetch/examples/grok-example');

const result = await analyzeWithGrok(
  'https://example.com',
  'Extract key facts from this page'
);

console.log(result.analysis);
```

**Full examples:**
- `examples/openrouter-example.js` - Multi-model support
- `examples/grok-example.js` - Grok + RAG knowledge base builder
- `examples/cost-calculator.js` - ROI calculator

## Credits

Built on [markdown.new](https://markdown.new) by Cloudflare
