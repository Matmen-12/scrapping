import { supabase } from "@/lib/supabase";

export interface Product {
  id: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  savingsPercentage: number;
  image: string;
}

// Function to parse price strings from the format "1 234,56zł" to number 1234.56
const parsePrice = (priceStr: string): number => {
  // Remove currency symbol, replace comma with dot, and remove spaces
  const cleanedPrice = priceStr
    .replace("zł", "")
    .replace(",", ".")
    .replace(/\s/g, "");
  return parseFloat(cleanedPrice);
};

// Calculate savings percentage
const calculateSavings = (
  originalPrice: number,
  discountedPrice: number,
): number => {
  if (originalPrice <= 0) return 0;
  const savings = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(savings); // Round to nearest integer
};

import { fetchWithCorsProxy } from "./corsProxyService";

// Function to fetch products from the API or database
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    // URL for all outlet products
    const url = "https://www.oleole.pl/search.bhtml?keyword=outlet";

    console.log("Attempting to fetch data from OleOle.pl...");

    try {
      // First try the Netlify serverless function proxy
      try {
        const proxyUrl = import.meta.env.PROD
          ? "/.netlify/functions/proxy"
          : "/api/proxy";

        const response = await fetch(
          `${proxyUrl}?url=${encodeURIComponent(url)}`,
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
            "Successfully fetched HTML content via serverless proxy, length:",
            html.length,
          );

          const products = parseHtmlContent(html);
          if (products.length > 0) {
            console.log(
              "Successfully parsed products from HTML:",
              products.length,
            );
            return products;
          }
        }
      } catch (localProxyError) {
        console.warn("Serverless proxy failed:", localProxyError);
      }

      // If local proxy fails, try public CORS proxies
      console.log("Trying public CORS proxies...");

      // Initialize products array
      let allProducts: Product[] = [];
      let currentUrl = url;
      let pageCount = 1;

      // Fetch first page
      const html = await fetchWithCorsProxy(currentUrl);

      // Parse the HTML content
      const parser = new DOMParser();
      let doc = parser.parseFromString(html, "text/html");

      // Get products from first page
      const products = parseHtmlContent(html);
      allProducts = [...products];

      console.log(`Parsed ${products.length} products from page 1`);

      // Check if there are more pages and fetch them
      while (pageCount < 5) {
        // Limit to 5 pages to avoid too many requests
        const nextPageUrl = getNextPageUrl(doc, currentUrl);
        if (!nextPageUrl) {
          console.log(`No more pages found after page ${pageCount}`);
          break;
        }

        console.log(`Fetching page ${pageCount + 1}: ${nextPageUrl}`);
        try {
          const nextPageHtml = await fetchWithCorsProxy(nextPageUrl);
          const nextPageProducts = parseHtmlContent(nextPageHtml);

          console.log(
            `Parsed ${nextPageProducts.length} products from page ${pageCount + 1}`,
          );

          // Add products from next page
          allProducts = [...allProducts, ...nextPageProducts];

          // Update current URL for next iteration
          currentUrl = nextPageUrl;
          pageCount++;

          // Update document for next page check
          doc = parser.parseFromString(nextPageHtml, "text/html");
        } catch (pageError) {
          console.error(`Error fetching page ${pageCount + 1}:`, pageError);
          break;
        }
      }

      if (allProducts.length > 0) {
        console.log(
          "Successfully parsed products from HTML via CORS proxy:",
          allProducts.length,
          `from ${pageCount} pages`,
        );
        return allProducts;
      } else {
        console.warn("Could not parse products from HTML, using mock data");
        return getPhoneAndGPSProducts();
      }
    } catch (fetchError) {
      console.error("Could not fetch from website:", fetchError);
      console.log("Using mock data instead");
      return getPhoneAndGPSProducts();
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// Function to check if there are more pages
const hasNextPage = (doc: Document): boolean => {
  const paginationLinks = doc.querySelectorAll(".pagination-item");
  for (const link of paginationLinks) {
    if (link.textContent?.includes("Następna")) {
      return true;
    }
  }
  return false;
};

// Function to get the next page URL
const getNextPageUrl = (doc: Document, baseUrl: string): string | null => {
  const paginationLinks = doc.querySelectorAll(".pagination-item");
  for (const link of paginationLinks) {
    if (link.textContent?.includes("Następna")) {
      const href = link.getAttribute("href");
      if (href) {
        // If it's a relative URL, make it absolute
        if (href.startsWith("/")) {
          return `https://www.oleole.pl${href}`;
        }
        return href;
      }
    }
  }
  return null;
};

// Function to parse HTML content and extract product information
const parseHtmlContent = (html: string): Product[] => {
  try {
    const products: Product[] = [];

    // Log the first 200 characters of HTML to debug
    console.log("HTML preview:", html.substring(0, 200));

    // Check if we received actual HTML content
    if (!html || html.trim().length === 0 || !html.includes("<html")) {
      console.warn("Received empty or invalid HTML");
      return [];
    }

    // Create a temporary DOM element to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Find product elements - try different selectors that might be on the page
    let productElements = doc.querySelectorAll(".product-medium-box");

    // If no elements found with the first selector, try alternative selectors
    if (productElements.length === 0) {
      productElements = doc.querySelectorAll(".product-box");
    }

    if (productElements.length === 0) {
      productElements = doc.querySelectorAll(".product-item");
    }

    if (productElements.length === 0) {
      console.warn("No product elements found in HTML using any selector");
      // Log some of the document structure to debug
      console.log(
        "Document body preview:",
        doc.body.innerHTML.substring(0, 500),
      );
      return [];
    }

    console.log(`Found ${productElements.length} product elements in HTML`);

    // Extract product information from each element
    productElements.forEach((element, index) => {
      try {
        // Extract product name - try different possible selectors
        let nameElement = element.querySelector(
          ".product-medium-box-intro__title",
        );
        if (!nameElement) {
          nameElement = element.querySelector(".product-name");
        }
        if (!nameElement) {
          nameElement =
            element.querySelector("h3") || element.querySelector("h4");
        }

        const name = nameElement
          ? nameElement.textContent.trim()
          : `Unknown Product ${index + 1}`;

        // Extract outlet price - try different possible selectors
        let priceElement = element.querySelector(".parted-price-total");
        if (!priceElement) {
          priceElement =
            element.querySelector(".price") ||
            element.querySelector(".product-price") ||
            element.querySelector(".current-price");
        }

        let discountedPrice = 0;
        if (priceElement) {
          const priceText = priceElement.textContent.trim();
          // Extract numbers from the price text
          const priceMatch = priceText.match(/[\d\s,.]+/);
          if (priceMatch) {
            // Convert "1 234,56" format to 1234.56
            const normalizedPrice = priceMatch[0]
              .replace(/\s/g, "")
              .replace(",", ".");
            discountedPrice = parseFloat(normalizedPrice) || 0;
          }
        }

        // Extract original price - try different possible selectors
        let originalPriceElement = element.querySelector(
          ".product-medium-box-purchase__new-product-text",
        );
        if (!originalPriceElement) {
          originalPriceElement =
            element.querySelector(".old-price") ||
            element.querySelector(".regular-price") ||
            element.querySelector(".original-price");
        }

        let originalPrice = 0;
        if (originalPriceElement) {
          const priceText = originalPriceElement.textContent
            .replace(/Nowy produkt:|Cena regularna:|Było:/i, "")
            .trim();

          // Extract numbers from the price text
          const priceMatch = priceText.match(/[\d\s,.]+/);
          if (priceMatch) {
            // Convert "1 234,56" format to 1234.56
            const normalizedPrice = priceMatch[0]
              .replace(/\s/g, "")
              .replace(",", ".");
            originalPrice = parseFloat(normalizedPrice) || 0;
          }
        }

        // If original price is not found or is less than discounted price, estimate it
        if (originalPrice <= discountedPrice) {
          originalPrice = discountedPrice * 1.3; // Estimate 30% higher than discounted
        }

        // Calculate savings percentage
        const savingsPercentage = calculateSavings(
          originalPrice,
          discountedPrice,
        );

        // Extract image URL - try different possible selectors
        let imgElement = element.querySelector("img");
        if (!imgElement) {
          imgElement =
            element.querySelector(".product-image img") ||
            element.querySelector(".product-img");
        }

        let image = "";
        if (imgElement) {
          // Try different attribute names for the image URL
          image =
            imgElement.getAttribute("src") ||
            imgElement.getAttribute("data-src") ||
            imgElement.getAttribute("data-lazy-src") ||
            "";
        }

        // Add product to array
        products.push({
          id: `scraped-${index + 1}`,
          name: name + " (Outlet)",
          originalPrice: originalPrice,
          discountedPrice: discountedPrice || 0,
          savingsPercentage: savingsPercentage,
          image:
            image ||
            "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=200&q=80",
        });
      } catch (parseError) {
        console.error("Error parsing product element:", parseError);
      }
    });

    return products;
  } catch (error) {
    console.error("Error parsing HTML content:", error);
    return [];
  }
};

// Mock data function - this simulates what would come from the Python scraper
const getMockProducts = (): Product[] => {
  return [
    {
      id: "1",
      name: "Telewizor Samsung QLED QE55Q80C",
      originalPrice: 4999.99,
      discountedPrice: 3799.99,
      savingsPercentage: 24,
      image:
        "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=200&q=80",
    },
    {
      id: "2",
      name: "Laptop ASUS ROG Strix G15",
      originalPrice: 5699.99,
      discountedPrice: 4599.99,
      savingsPercentage: 19,
      image:
        "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=200&q=80",
    },
    {
      id: "3",
      name: "Smartfon Apple iPhone 13 128GB",
      originalPrice: 3999.99,
      discountedPrice: 3299.99,
      savingsPercentage: 18,
      image:
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&q=80",
    },
    {
      id: "4",
      name: "Słuchawki Sony WH-1000XM4",
      originalPrice: 1499.99,
      discountedPrice: 999.99,
      savingsPercentage: 33,
      image:
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&q=80",
    },
    {
      id: "5",
      name: "Ekspres do kawy Philips EP2231/40",
      originalPrice: 2299.99,
      discountedPrice: 1799.99,
      savingsPercentage: 22,
      image:
        "https://images.unsplash.com/photo-1585592049155-6399fc5de1c4?w=200&q=80",
    },
    {
      id: "6",
      name: "Odkurzacz automatyczny iRobot Roomba i7+",
      originalPrice: 2999.99,
      discountedPrice: 2299.99,
      savingsPercentage: 23,
      image:
        "https://images.unsplash.com/photo-1589923188651-268a357a1a48?w=200&q=80",
    },
    {
      id: "7",
      name: "Konsola PlayStation 5 Digital Edition",
      originalPrice: 1999.99,
      discountedPrice: 1799.99,
      savingsPercentage: 10,
      image:
        "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=200&q=80",
    },
    {
      id: "8",
      name: 'Monitor Dell Ultrasharp U2720Q 27"',
      originalPrice: 2499.99,
      discountedPrice: 1899.99,
      savingsPercentage: 24,
      image:
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200&q=80",
    },
    {
      id: "9",
      name: "Kamera GoPro HERO10 Black",
      originalPrice: 1899.99,
      discountedPrice: 1499.99,
      savingsPercentage: 21,
      image:
        "https://images.unsplash.com/photo-1625014618427-fbc980b974f5?w=200&q=80",
    },
    {
      id: "10",
      name: 'Tablet Apple iPad Air 10.9" 64GB',
      originalPrice: 2699.99,
      discountedPrice: 2299.99,
      savingsPercentage: 15,
      image:
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&q=80",
    },
  ];
};

// Mock data function specifically for phones and GPS navigation in outlet condition
export const getPhoneAndGPSProducts = (): Product[] => {
  return [
    {
      id: "1",
      name: "Smartfon Apple iPhone 13 128GB (Outlet - Stan Dobry)",
      originalPrice: 3999.99,
      discountedPrice: 2899.99,
      savingsPercentage: 28,
      image:
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&q=80",
    },
    {
      id: "2",
      name: "Smartfon Samsung Galaxy S21 5G 128GB (Outlet - Stan Doskonały)",
      originalPrice: 3499.99,
      discountedPrice: 2499.99,
      savingsPercentage: 29,
      image:
        "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200&q=80",
    },
    {
      id: "3",
      name: "Smartfon Xiaomi Redmi Note 10 Pro 6/128GB (Outlet - Stan Dobry)",
      originalPrice: 1299.99,
      discountedPrice: 899.99,
      savingsPercentage: 31,
      image:
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200&q=80",
    },
    {
      id: "4",
      name: "Smartfon OnePlus 9 Pro 5G 12/256GB (Outlet - Stan Doskonały)",
      originalPrice: 4299.99,
      discountedPrice: 2999.99,
      savingsPercentage: 30,
      image:
        "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=200&q=80",
    },
    {
      id: "5",
      name: "Smartfon Google Pixel 6 128GB (Outlet - Stan Dobry)",
      originalPrice: 2999.99,
      discountedPrice: 2199.99,
      savingsPercentage: 27,
      image:
        "https://images.unsplash.com/photo-1598965402089-897c69523374?w=200&q=80",
    },
    {
      id: "6",
      name: "Nawigacja GPS Garmin DriveSmart 65 (Outlet - Stan Doskonały)",
      originalPrice: 1299.99,
      discountedPrice: 899.99,
      savingsPercentage: 31,
      image:
        "https://images.unsplash.com/photo-1581688669862-2a364f1bd6c1?w=200&q=80",
    },
    {
      id: "7",
      name: "Smartfon Motorola Edge 20 Pro 12/256GB (Outlet - Stan Dostateczny)",
      originalPrice: 2699.99,
      discountedPrice: 1699.99,
      savingsPercentage: 37,
      image:
        "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=200&q=80",
    },
    {
      id: "8",
      name: "Smartfon Apple iPhone 12 Mini 64GB (Outlet - Stan Dobry)",
      originalPrice: 3299.99,
      discountedPrice: 2399.99,
      savingsPercentage: 27,
      image:
        "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=200&q=80",
    },
    {
      id: "9",
      name: 'Nawigacja GPS TomTom GO Premium 6" (Outlet - Stan Doskonały)',
      originalPrice: 1499.99,
      discountedPrice: 1099.99,
      savingsPercentage: 27,
      image:
        "https://images.unsplash.com/photo-1527853787696-f7be74f2e39a?w=200&q=80",
    },
    {
      id: "10",
      name: "Smartfon Samsung Galaxy Z Flip3 5G 128GB (Outlet - Stan Dobry)",
      originalPrice: 4499.99,
      discountedPrice: 3199.99,
      savingsPercentage: 29,
      image:
        "https://images.unsplash.com/photo-1633053699034-459674b01ed6?w=200&q=80",
    },
    {
      id: "11",
      name: "Smartfon Oppo Find X3 Pro 12/256GB (Outlet - Stan Dostateczny)",
      originalPrice: 3999.99,
      discountedPrice: 2499.99,
      savingsPercentage: 38,
      image:
        "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=200&q=80",
    },
    {
      id: "12",
      name: "Smartwatch Apple Watch Series 7 GPS 45mm (Outlet - Stan Doskonały)",
      originalPrice: 1999.99,
      discountedPrice: 1599.99,
      savingsPercentage: 20,
      image:
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=200&q=80",
    },
  ];
};

// Function to search products
export const searchProducts = (
  products: Product[],
  query: string,
): Product[] => {
  if (!query.trim()) return products;

  const lowerCaseQuery = query.toLowerCase();
  return products.filter((product) =>
    product.name.toLowerCase().includes(lowerCaseQuery),
  );
};

// Function to sort products
export const sortProducts = (
  products: Product[],
  sortBy: string,
): Product[] => {
  const sortedProducts = [...products];

  switch (sortBy) {
    case "price-high-low":
      return sortedProducts.sort(
        (a, b) => b.discountedPrice - a.discountedPrice,
      );
    case "price-low-high":
      return sortedProducts.sort(
        (a, b) => a.discountedPrice - b.discountedPrice,
      );
    case "discount":
      return sortedProducts.sort(
        (a, b) => b.savingsPercentage - a.savingsPercentage,
      );
    default:
      return sortedProducts;
  }
};
