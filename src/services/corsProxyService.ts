// Service to handle CORS proxy requests

// List of public CORS proxies to try
const corsProxies = [
  "https://corsproxy.io/?url=",
  "https://api.allorigins.win/raw?url=",
  "https://api.codetabs.com/v1/proxy?quest=",
  "https://cors-anywhere.herokuapp.com/",
  "https://cors-proxy.htmldriven.com/?url=",
  "https://thingproxy.freeboard.io/fetch/",
];

export const fetchWithCorsProxy = async (url: string): Promise<string> => {
  // First try our own Netlify function if in production
  if (import.meta.env.PROD) {
    try {
      console.log("Trying Netlify serverless function proxy");
      const response = await fetch(
        `/.netlify/functions/proxy?url=${encodeURIComponent(url)}`,
        {
          headers: {
            Accept: "text/html,application/xhtml+xml,application/xml",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        },
      );

      if (response.ok) {
        const html = await response.text();
        console.log(
          `Successfully fetched HTML with Netlify function, length: ${html.length}`,
        );
        return html;
      }
    } catch (error) {
      console.warn("Error with Netlify function proxy:", error);
    }
  }

  // Try each public proxy in sequence until one works
  for (const proxy of corsProxies) {
    try {
      console.log(`Trying CORS proxy: ${proxy}`);
      const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept-Language": "pl,en-US;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        console.warn(`Proxy ${proxy} failed with status: ${response.status}`);
        continue; // Try next proxy
      }

      const html = await response.text();
      console.log(
        `Successfully fetched HTML with proxy ${proxy}, length: ${html.length}`,
      );
      return html;
    } catch (error) {
      console.warn(`Error with proxy ${proxy}:`, error);
      // Continue to next proxy
    }
  }

  // If all proxies fail, throw an error
  throw new Error("All CORS proxies failed");
};
