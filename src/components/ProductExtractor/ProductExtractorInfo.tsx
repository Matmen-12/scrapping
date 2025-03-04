import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const ProductExtractorInfo = () => {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <InfoIcon className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">About This Demo</AlertTitle>
      <AlertDescription className="text-blue-700">
        <p className="mb-2">
          This application attempts to extract product data from OleOle.pl using
          multiple CORS proxy methods. The app will try several public CORS
          proxies to bypass restrictions and fetch real data.
        </p>
        <p>
          Click the "Sync Data" button to attempt fetching real-time data from
          OleOle.pl. If all proxies fail, the application will fall back to mock
          data.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default ProductExtractorInfo;
