import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search } from "lucide-react";

interface ProductHeaderProps {
  onSearch?: (searchTerm: string) => void;
  title?: string;
  description?: string;
}

const ProductHeader = ({
  onSearch = () => {},
  title = "OleOle.pl Product Price Extractor",
  description = "View and compare outlet product prices from OleOle.pl in a clean, sortable format",
}: ProductHeaderProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full bg-slate-50 p-6 border-b border-slate-200">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-600 mb-6">{description}</p>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 w-full"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
          <Button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductHeader;
