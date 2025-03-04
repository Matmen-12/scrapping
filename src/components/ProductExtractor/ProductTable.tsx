import React, { useState } from "react";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  id: string;
  image: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  savingsPercentage: number;
}

interface ProductTableProps {
  products?: Product[];
  searchQuery?: string;
  sortBy?: "price-high-low" | "price-low-high" | "discount";
  isLoading?: boolean;
  error?: string | null;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products = [],
  searchQuery = "",
  sortBy = "discount",
  isLoading = false,
  error = null,
}) => {
  // Format price to PLN currency format
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Filter products based on search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Sort products based on selected sort option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-high-low") {
      return b.discountedPrice - a.discountedPrice;
    } else if (sortBy === "price-low-high") {
      return a.discountedPrice - b.discountedPrice;
    } else {
      // Default: sort by discount percentage (highest first)
      return b.savingsPercentage - a.savingsPercentage;
    }
  });

  return (
    <div className="w-full bg-white rounded-md shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>OleOle.pl Phone & GPS Outlet Products</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead className="min-w-[200px]">Product Name</TableHead>
              <TableHead className="text-right">Original Price</TableHead>
              <TableHead className="text-right">Discounted Price</TableHead>
              <TableHead className="text-right">Savings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="h-16 w-16 overflow-hidden rounded-md">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right line-through text-muted-foreground">
                  {formatPrice(product.originalPrice)}
                </TableCell>
                <TableCell className="text-right font-bold text-red-600">
                  {formatPrice(product.discountedPrice)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-green-700">
                    -{product.savingsPercentage}%
                  </span>
                </TableCell>
              </TableRow>
            ))}

            {sortedProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No products found matching your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductTable;
