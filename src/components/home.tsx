import React, { useState, useEffect } from "react";
import ProductHeader from "./ProductExtractor/ProductHeader";
import ProductControls from "./ProductExtractor/ProductControls";
import ProductTable from "./ProductExtractor/ProductTable";
import LoadingState from "./ProductExtractor/LoadingState";
import ErrorState from "./ProductExtractor/ErrorState";
import SyncButton from "./ProductExtractor/SyncButton";
import ProductExtractorInfo from "./ProductExtractor/ProductExtractorInfo";
import {
  fetchProducts,
  searchProducts,
  sortProducts,
  getPhoneAndGPSProducts,
  type Product,
} from "@/services/productScraper";

// Define the SortOption type locally
type SortOption = "price-high-low" | "price-low-high" | "discount";

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("discount");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    const getProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get all mock products directly to ensure we have the full dataset
        const productData = getPhoneAndGPSProducts();
        setProducts(productData);
        setFilteredProducts(sortProducts(productData, sortOption));
        setIsLoading(false);
        setLastSynced(new Date());
      } catch (err) {
        setError("Failed to fetch product data. Please try again later.");
        setIsLoading(false);
      }
    };

    getProducts();
  }, []);

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    const searchResults = searchProducts(products, searchTerm);
    setFilteredProducts(sortProducts(searchResults, sortOption));
  };

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    setFilteredProducts(
      sortProducts(searchProducts(products, searchQuery), option),
    );
  };

  // Handle retry on error
  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const productData = await fetchProducts();
      setProducts(productData);
      setFilteredProducts(sortProducts(productData, sortOption));
      setIsLoading(false);
      setLastSynced(new Date());
    } catch (err) {
      setError("Failed to fetch product data. Please try again later.");
      setIsLoading(false);
    }
  };

  // Handle manual sync
  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      // Clear any previous data to show loading state
      setProducts([]);
      setFilteredProducts([]);

      // Show a temporary message that we're trying to fetch real data
      setError(
        "Attempting to fetch real data from OleOle.pl using CORS proxies...",
      );

      // Fetch fresh data
      const productData = await fetchProducts();

      // Clear the temporary message
      setError(null);

      // Update state with new data
      setProducts(productData);
      setFilteredProducts(
        sortProducts(searchProducts(productData, searchQuery), sortOption),
      );
      setIsSyncing(false);
      setLastSynced(new Date());
    } catch (err) {
      setError(
        "Failed to sync product data. All CORS proxies failed. Using mock data instead.",
      );

      // Fall back to mock data
      try {
        const mockData = getPhoneAndGPSProducts();
        setProducts(mockData);
        setFilteredProducts(
          sortProducts(searchProducts(mockData, searchQuery), sortOption),
        );
      } catch (mockError) {
        console.error("Error loading mock data:", mockError);
      }

      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <ProductHeader
        onSearch={handleSearch}
        title="OleOle.pl Phone & GPS Outlet Extractor"
        description="View and compare outlet prices for phones and GPS navigation from OleOle.pl in a clean, sortable format"
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <ProductExtractorInfo />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <ProductControls
            onSortChange={handleSortChange}
            selectedSort={sortOption}
          />
          <SyncButton
            onSync={handleSync}
            isSyncing={isSyncing}
            lastSynced={lastSynced}
          />
        </div>

        {isLoading ? (
          <LoadingState message="Fetching phone and GPS outlet data from OleOle.pl..." />
        ) : error ? (
          <ErrorState
            title="Error Loading Products"
            message={error}
            onRetry={handleRetry}
          />
        ) : (
          <ProductTable
            products={filteredProducts}
            searchQuery={searchQuery}
            sortBy={sortOption}
          />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>
            Product data is extracted from OleOle.pl outlet section for
            demonstration purposes only.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} Product Price Extractor
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
