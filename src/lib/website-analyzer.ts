export interface WebsiteContent {
  url: string;
  title: string;
  description: string;
  headings: string[];
  links: string[];
  textContent: string;
  keywords: string[];
  lastModified?: string;
}

export async function fetchWebsiteContent(url: string): Promise<WebsiteContent> {
  try {
    // Validate URL
    const urlObj = new URL(url);
    
    // Fetch the website content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentAnalyzer/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract content using regex (basic HTML parsing)
    const title = extractTitle(html);
    const description = extractDescription(html);
    const headings = extractHeadings(html);
    const links = extractLinks(html, urlObj.origin);
    const textContent = extractTextContent(html);
    const keywords = extractKeywords(textContent);

    return {
      url,
      title,
      description,
      headings,
      links,
      textContent,
      keywords,
      lastModified: response.headers.get('last-modified') || undefined,
    };

  } catch (error) {
    console.error('Error fetching website content:', error);
    throw new Error(`Failed to fetch website content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export interface SitemapAnalysis {
  sitemapUrl: string;
  urls: string[];
  titles: string[];
}

export async function fetchSitemapPosts(sitemapUrl: string, maxUrls: number = 100): Promise<SitemapAnalysis> {
  try {
    const res = await fetch(sitemapUrl, { headers: { 'Accept': 'application/xml,text/xml,*/*', 'User-Agent': 'Mozilla/5.0 (compatible; ContentAnalyzer/1.0)' }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    // Extract <loc> tags
    const locMatches = xml.match(/<loc>([^<]+)<\/loc>/gi) || [];
    const urls = locMatches.map(m => {
      const mm = m.match(/<loc>([^<]+)<\/loc>/i);
      return mm ? mm[1].trim() : '';
    }).filter(Boolean).slice(0, maxUrls);

    // Derive titles from URL slugs; optionally fetch a few titles
    const titles: string[] = [];
    const slugToTitle = (u: string) => {
      try {
        const { pathname } = new URL(u);
        const parts = pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1] || '';
        return decodeURIComponent(last.replace(/[-_]+/g, ' ')).trim();
      } catch {
        return '';
      }
    };
    urls.forEach(u => {
      const t = slugToTitle(u);
      if (t) titles.push(t);
    });

    // Best-effort: fetch a handful of pages to refine titles
    const sample = urls.slice(0, Math.min(6, urls.length));
    await Promise.all(sample.map(async (u) => {
      try {
        const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContentAnalyzer/1.0)' }, signal: AbortSignal.timeout(8000) });
        if (r.ok) {
          const html = await r.text();
          const title = extractTitle(html);
          if (title) titles.push(title);
        }
      } catch {}
    }));

    // De-duplicate titles
    const uniqueTitles = Array.from(new Set(titles.map(t => t.toLowerCase())));
    return { sitemapUrl, urls, titles: uniqueTitles };
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    throw new Error(`Failed to fetch sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function fetchSitemapDeep(sitemapUrl: string, maxUrlsTotal: number = 300): Promise<SitemapAnalysis> {
  try {
    const res = await fetch(sitemapUrl, { headers: { 'Accept': 'application/xml,text/xml,*/*', 'User-Agent': 'Mozilla/5.0 (compatible; ContentAnalyzer/1.0)' }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const childMatches = xml.match(/<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi) || [];
    if (childMatches.length === 0) {
      return fetchSitemapPosts(sitemapUrl, maxUrlsTotal);
    }
    const childUrls = childMatches.map(m => {
      const mm = m.match(/<loc>([^<]+)<\/loc>/i);
      return mm ? mm[1].trim() : '';
    }).filter(Boolean);
    const urls: string[] = [];
    const titles: string[] = [];
    let remaining = maxUrlsTotal;
    for (const child of childUrls) {
      if (remaining <= 0) break;
      try {
        const childRes = await fetchSitemapPosts(child, remaining);
        urls.push(...childRes.urls);
        titles.push(...childRes.titles);
        remaining = Math.max(0, maxUrlsTotal - urls.length);
      } catch {}
    }
    const uniqueTitles = Array.from(new Set(titles.map(t => t.toLowerCase())));
    const uniqueUrls = Array.from(new Set(urls));
    return { sitemapUrl, urls: uniqueUrls, titles: uniqueTitles };
  } catch (error) {
    console.error('Error fetching sitemap index:', error);
    throw new Error(`Failed to fetch sitemap index: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : '';
}

function extractDescription(html: string): string {
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  return descMatch ? descMatch[1].trim() : '';
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi);
  const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi);
  const h3Matches = html.match(/<h3[^>]*>([^<]+)<\/h3>/gi);
  
  if (h1Matches) {
    h1Matches.forEach(h1 => {
      const text = h1.replace(/<[^>]+>/g, '').trim();
      if (text) headings.push(text);
    });
  }
  
  if (h2Matches) {
    h2Matches.forEach(h2 => {
      const text = h2.replace(/<[^>]+>/g, '').trim();
      if (text) headings.push(text);
    });
  }
  
  if (h3Matches) {
    h3Matches.forEach(h3 => {
      const text = h3.replace(/<[^>]+>/g, '').trim();
      if (text) headings.push(text);
    });
  }
  
  return headings;
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);
  
  if (linkMatches) {
    linkMatches.forEach(link => {
      const hrefMatch = link.match(/href=["']([^"']+)["']/i);
      if (hrefMatch) {
        let href = hrefMatch[1];
        
        // Skip external links, anchors, and non-HTTP links
        if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
          return;
        }
        
        // Convert relative URLs to absolute
        if (href.startsWith('/')) {
          href = baseUrl + href;
        } else if (!href.startsWith('http')) {
          href = baseUrl + '/' + href;
        }
        
        // Only include links from the same domain
        if (href.includes(baseUrl)) {
          links.push(href);
        }
      }
    });
  }
  
  return [...new Set(links)]; // Remove duplicates
}

function extractTextContent(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Limit to reasonable length
  return text.substring(0, 50000);
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction - remove common stop words and short words
  const stopWords = new Set([
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can'
  ]);
  
  // Convert to lowercase and split into words
  const words = text.toLowerCase().split(/\s+/);
  
  // Filter out stop words and short words
  const keywords = words.filter(word => 
    word.length > 3 && !stopWords.has(word)
  );
  
  // Get unique keywords and sort by frequency
  const keywordFreq: { [key: string]: number } = {};
  keywords.forEach(word => {
    keywordFreq[word] = (keywordFreq[word] || 0) + 1;
  });
  
  return Object.entries(keywordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 50)
    .map(([word]) => word);
}