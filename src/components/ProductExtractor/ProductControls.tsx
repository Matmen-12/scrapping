import React, { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PercentIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type SortOption = "price-high-low" | "price-low-high" | "discount";

interface ProductControlsProps {
  onSortChange?: (sortOption: SortOption) => void;
  selectedSort?: SortOption;
}

const ProductControls = ({
  onSortChange = () => {},
  selectedSort = "price-high-low",
}: ProductControlsProps) => {
  const [sortOption, setSortOption] = useState<SortOption>(selectedSort);

  const handleSortChange = (value: SortOption) => {
    setSortOption(value);
    onSortChange(value);
  };

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-md flex flex-col sm:flex-row items-center gap-4">
      <div className="text-sm text-gray-500">
        <span>Sort products by:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={sortOption}
          onValueChange={(value) => handleSortChange(value as SortOption)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price-high-low">
              <div className="flex items-center gap-2">
                <ArrowDownIcon className="h-4 w-4" />
                <span>Price: High to Low</span>
              </div>
            </SelectItem>
            <SelectItem value="price-low-high">
              <div className="flex items-center gap-2">
                <ArrowUpIcon className="h-4 w-4" />
                <span>Price: Low to High</span>
              </div>
            </SelectItem>
            <SelectItem value="discount">
              <div className="flex items-center gap-2">
                <PercentIcon className="h-4 w-4" />
                <span>Discount %</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2 sm:hidden md:flex">
          <Button
            variant={sortOption === "price-high-low" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange("price-high-low")}
            className="flex items-center gap-1"
          >
            <ArrowDownIcon className="h-4 w-4" />
            <span className="hidden md:inline">Price: High to Low</span>
          </Button>
          <Button
            variant={sortOption === "price-low-high" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange("price-low-high")}
            className="flex items-center gap-1"
          >
            <ArrowUpIcon className="h-4 w-4" />
            <span className="hidden md:inline">Price: Low to High</span>
          </Button>
          <Button
            variant={sortOption === "discount" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange("discount")}
            className="flex items-center gap-1"
          >
            <PercentIcon className="h-4 w-4" />
            <span className="hidden md:inline">Discount %</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductControls;
