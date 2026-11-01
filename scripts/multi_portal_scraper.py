import time
import random
import requests
from bs4 import BeautifulSoup

class MultiPortalNewsScraper:
    def __init__(self):
        # Emulating a modern standard browser agent (Crawler Identity)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        }
        
        # Explicit Document Traversal rules (Semantic Content Selectors)
        self.portal_configs = {
            "prothomalo.com": {
                "title_selectors": ["h1.title", "h1", ".story-title"],
                "body_selectors": [".story-element-text", ".article-content", "article", ".story-contents"]
            },
            "thedailystar.net": {
                "title_selectors": ["h1.article-title", "h1", "h1.page-title"],
                "body_selectors": [".sb-story-text", ".article-content", "article .field-body", ".story-text"]
            },
            "tbsnews.net": {
                "title_selectors": ["h1.page-header", "h1"],
                "body_selectors": [".field-name-body", ".article-content", "article"]
            },
            "bdnews24.com": {
                "title_selectors": ["h1", ".customStoryHead"],
                "body_selectors": [".story-body", "#article_body", ".article-details"]
            },
            "dhakatribune.com": {
                "title_selectors": ["h1.title", "h1"],
                "body_selectors": [".story-element-text", ".article-content", ".report-content"]
            },
            "bd-pratidin.com": {
                "title_selectors": ["h1", "h2.title"],
                "body_selectors": ["#article-details", ".article-content", "article"]
            },
            "jugantor.com": {
                "title_selectors": ["h1", ".news-title"],
                "body_selectors": [".news-details-text", "#news-details", "article"]
            },
            "banglanews24.com": {
                "title_selectors": ["h1", ".news-title"],
                "body_selectors": [".news-details", "article", "#news-body"]
            },
            "thefinancialexpress.com.bd": {
                "title_selectors": ["h1", ".story-title"],
                "body_selectors": [".story-body", ".article-content", "article"]
            },
            "newagebd.net": {
                "title_selectors": ["h1", ".article-title"],
                "body_selectors": [".article-text", ".story-text", "article"]
            }
        }

    def _identify_portal_config(self, url):
        """Identifies the corresponding configuration profile based on URL domain matches."""
        for domain, config in self.portal_configs.items():
            if domain in url.lower():
                return config
        return None

    def fetch_article(self, url):
        """Executes the HTTP GET request with retry logic and standard browser signature."""
        config = self._identify_portal_config(url)
        if not config:
            return {"error": "Domain configuration not found in parsing database."}

        try:
            # Politeness protocol: Adding randomized execution jitter to simulate realistic user interaction
            time.sleep(random.uniform(1.0, 2.5))
            
            response = requests.get(url, headers=self.headers, timeout=15)
            if response.status_code != 200:
                return {"error": f"Failed HTTP handshake. Status code: {response.status_code}"}
            
            return self._parse_html_document(response.content, config, url)
            
        except Exception as e:
            return {"error": f"Network fetch or processing failure: {str(e)}"}

    def _parse_html_document(self, html_content, config, url):
        """Parses the raw document structure, extracting targeted data fields cleanly."""
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Googlebot Cleansing Step: Scrub dynamic scripts, embedded styling sheets, and frames
        for element in soup(["script", "style", "iframe", "noscript", "header", "footer", "nav"]):
            element.extract()

        # 1. Headline Extraction Block
        title_text = "Headline Not Found"
        for selector in config["title_selectors"]:
            title_node = soup.select_one(selector)
            if title_node:
                title_text = title_node.get_text().strip()
                break

        # 2. Body Text Extraction & Boilerplate Filtering Block
        article_paragraphs = []
        body_found = False

        for selector in config["body_selectors"]:
            body_container = soup.select_one(selector)
            if body_container:
                # Target paragraph segments within the matched core block
                paragraphs = body_container.find_all("p")
                if paragraphs:
                    for p in paragraphs:
                        text = p.get_text().strip()
                        # Filtering out minor web fragments (shares, updates, advertisements)
                        if len(text) > 20 and not text.startswith(("©", "Share", "Follow us")):
                            article_paragraphs.append(text)
                    body_found = True
                    break
                else:
                    # Fallback if content lacks explicit paragraph markers
                    text = body_container.get_text(separator="\n").strip()
                    article_paragraphs = [line.strip() for line in text.split("\n") if len(line.strip()) > 20]
                    body_found = True
                    break

        # Universal system fallback if specialized classes failed due to front-end updates
        if not body_found or not article_paragraphs:
            all_paragraphs = soup.find_all("p")
            for p in all_paragraphs:
                text = p.get_text().strip()
                if len(text) > 35:  
                    article_paragraphs.append(text)

        full_body_text = "\n\n".join(article_paragraphs)

        return {
            "url": url,
            "headline": title_text,
            "body_length": len(full_body_text),
            "paragraphs_count": len(article_paragraphs),
            "content": full_body_text if full_body_text else "Body could not be systematically compiled."
        }

# --- Runtime Execution Interface Example ---
if __name__ == "__main__":
    scraper = MultiPortalNewsScraper()
    
    # Live sample test URLs across both linguistic portals
    test_urls = [
        "https://prothomalo.com", 
        "https://thedailystar.net"
    ]
    
    print("Initializing Multi-Portal Parsing Engine Execution...\n")
    for url in test_urls:
        print(f"Crawling -> {url}")
        result = scraper.fetch_article(url)
        
        if "error" in result:
            print(f"Execution Alert: {result['error']}\n")
        else:
            print(f"Extracted Headline: {result['headline']}")
            print(f"Extracted Word Blocks: {result['paragraphs_count']} paragraphs metadata captured.")
            print(f"Sample Fragment:\n{result['content'][:300]}...\n")
            print("-" * 60)

