/**
 * markdown-fetch: Token-efficient web content fetching via markdown.new
 * 
 * Automatically routes web fetches through markdown.new for 80% token reduction.
 * Falls back to direct fetch if markdown.new fails.
 * 
 * Usage:
 *   const { fetchMarkdown } = require('./lib/markdown-fetch');
 *   const content = await fetchMarkdown('https://example.com');
 */

const https = require('https');
const http = require('http');

/**
 * Fetch URL content as clean markdown via markdown.new
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {boolean} options.directFallback - If true, falls back to direct fetch on failure (default: true)
 * @param {number} options.timeout - Request timeout in ms (default: 10000)
 * @param {boolean} options.includeMetadata - Include x-markdown-tokens header info (default: false)
 * @returns {Promise<string|Object>} Markdown content, or object with content + metadata if includeMetadata=true
 */
async function fetchMarkdown(url, options = {}) {
  const {
    directFallback = true,
    timeout = 10000,
    includeMetadata = false
  } = options;

  // Validate URL
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided');
  }

  // Ensure URL has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Construct markdown.new URL
  const markdownUrl = `https://markdown.new/${url}`;

  try {
    const result = await fetch_with_timeout(markdownUrl, timeout);
    
    if (includeMetadata) {
      return {
        content: result.content,
        tokens: result.tokens,
        url: url,
        method: 'markdown.new'
      };
    }
    
    return result.content;
    
  } catch (error) {
    // If markdown.new fails and fallback enabled, try direct fetch
    if (directFallback) {
      console.warn(`markdown.new failed for ${url}, falling back to direct fetch:`, error.message);
      
      try {
        const directResult = await fetch_with_timeout(url, timeout);
        
        if (includeMetadata) {
          return {
            content: directResult.content,
            tokens: null, // No token count from direct fetch
            url: url,
            method: 'direct'
          };
        }
        
        return directResult.content;
        
      } catch (directError) {
        throw new Error(`Both markdown.new and direct fetch failed: ${directError.message}`);
      }
    }
    
    throw error;
  }
}

/**
 * Internal: Fetch URL with timeout
 */
function fetch_with_timeout(url, timeout) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, {
      headers: {
        'User-Agent': 'mote/markdown-fetch'
      },
      timeout: timeout
    }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch_with_timeout(res.headers.location, timeout)
          .then(resolve)
          .catch(reject);
      }
      
      // Handle errors
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      
      // Collect response
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          content: data,
          tokens: res.headers['x-markdown-tokens'] ? parseInt(res.headers['x-markdown-tokens']) : null
        });
      });
      res.on('error', reject);
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });
  });
}

/**
 * Batch fetch multiple URLs
 * @param {string[]} urls - Array of URLs to fetch
 * @param {Object} options - Same as fetchMarkdown options
 * @returns {Promise<Array>} Array of results (or errors)
 */
async function fetchMarkdownBatch(urls, options = {}) {
  const promises = urls.map(url => 
    fetchMarkdown(url, options)
      .then(content => ({ url, content, error: null }))
      .catch(error => ({ url, content: null, error: error.message }))
  );
  
  return Promise.all(promises);
}

module.exports = {
  fetchMarkdown,
  fetchMarkdownBatch
};
