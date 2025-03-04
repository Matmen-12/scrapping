# Python Integration for OleOle.pl Phone & GPS Outlet Scraper

This document explains how to integrate the Python scraping script with the React application.

## Setup Instructions

### 1. Create a Backend Service

To use the Python script for scraping OleOle.pl, you'll need to set up a simple backend service. Here are two options:

#### Option A: Simple Express Server

```javascript
// server.js
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/products', (req, res) => {
  exec('python scraper.py "https://www.oleole.pl/search/telefony-i-nawigacja-gps,stan-outlet-doskonaly:outlet-dobry:outlet-dostateczny,d10.bhtml?keyword=outlet&searchType=tag"', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: 'Failed to run scraper' });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: 'Error in scraper execution' });
    }
    
    try {
      const products = JSON.parse(stdout);
      return res.json(products);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse scraper output' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
```

#### Option B: Serverless Function

You could also deploy the Python script as a serverless function using services like AWS Lambda, Vercel, or Netlify Functions.

### 2. Modify the Python Script

Update your Python script to output JSON instead of CSV:

```python
import json
import sys
import requests
from bs4 import BeautifulSoup
import pandas as pd
import random

# Get URL from command line argument
url = sys.argv[1] if len(sys.argv) > 1 else "https://www.oleole.pl/search/telefony-i-nawigacja-gps,stan-outlet-doskonaly:outlet-dobry:outlet-dostateczny,d10.bhtml?keyword=outlet&searchType=tag"

# Fetch HTML content from URL
response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
html_content = response.text

# Parsuj HTML za pomocą BeautifulSoup
soup = BeautifulSoup(html_content, "html.parser")

# Znajdź wszystkie elementy zawierające informacje o produktach
product_elements = soup.find_all("div", class_="product-medium-box")

# Przygotuj listę do przechowywania danych produktów
products = []

# Funkcja do parsowania ceny
def parse_price(price_str):
    # Usuń symbol waluty, zamień przecinek na kropkę i usuń spacje
    cleaned_price = price_str.replace('zł', '').replace(',', '.').replace(' ', '')
    try:
        return float(cleaned_price)
    except ValueError:
        return 0.0

# Iteruj po elementach produktów i wydobądź potrzebne informacje
for i, product_element in enumerate(product_elements):
    # Nazwa produktu
    name_element = product_element.find("h4", class_="product-medium-box-intro__title")
    product_name = name_element.text.strip() if name_element else "Brak nazwy"

    # Cena outletowa
    price_outlet_span = product_element.find('span', attrs={'class':'parted-price-total'})
    price_outlet_text = ""
    if price_outlet_span:
        price_outlet_text = price_outlet_span.text.strip() + "," + \
                           product_element.find('span', attrs={'class':'parted-price-decimal'}).text.strip() + \
                           product_element.find('span', attrs={'class':'parted-price-currency'}).text.strip()
    else:
        price_outlet_text = "Brak ceny"

    # Cena regularna
    price_regular_element = product_element.find("p", class_="product-medium-box-purchase__new-product-text")
    price_regular_text = price_regular_element.text.replace("Nowy produkt: ", "").strip() if price_regular_element else "Brak ceny"

    # Parsuj ceny do liczb
    original_price = parse_price(price_regular_text)
    discounted_price = parse_price(price_outlet_text)
    
    # Oblicz procent oszczędności
    savings_percentage = 0
    if original_price > 0 and discounted_price > 0:
        savings_percentage = round(((original_price - discounted_price) / original_price) * 100)

    # Znajdź obrazek produktu (jeśli istnieje)
    img_element = product_element.find("img")
    image_url = img_element.get("src") if img_element else ""

    # Dodaj produkt do listy
    products.append({
        "id": str(i + 1),
        "name": product_name,
        "originalPrice": original_price,
        "discountedPrice": discounted_price,
        "savingsPercentage": savings_percentage,
        "image": image_url
    })

# Wydrukuj dane w formacie JSON
print(json.dumps(products))
```

### 3. Update the Frontend Service

Modify the `fetchProducts` function in `src/services/productScraper.ts` to call your backend API:

```typescript
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch('http://localhost:3001/api/products');
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};
```

## Running the Integration

1. Start your backend server: `node server.js`
2. Start your React app: `npm run dev`
3. The React app will now fetch real data from OleOle.pl through your Python scraper

## Notes

- This integration requires CORS to be properly configured on your backend
- For production, consider implementing proper error handling and rate limiting
- You may want to add caching to avoid scraping the website too frequently
- Make sure to respect OleOle.pl's terms of service regarding web scraping
