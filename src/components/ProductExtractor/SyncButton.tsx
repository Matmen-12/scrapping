import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface SyncButtonProps {
  onSync: () => void;
  isSyncing?: boolean;
  lastSynced?: Date | null;
}

const SyncButton = ({
  onSync,
  isSyncing = false,
  lastSynced = null,
}: SyncButtonProps) => {
  const formatLastSynced = () => {
    if (!lastSynced) return "Never synced";

    // Format with hours, minutes, seconds and date
    return `Last synced: ${lastSynced.toLocaleTimeString()} (${lastSynced.toLocaleDateString()})`;
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onSync}
        disabled={isSyncing}
        variant="outline"
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Syncing..." : "Sync Data"}
      </Button>
      <span className="text-sm text-muted-foreground">
        {formatLastSynced()}
      </span>
    </div>
  );
};

export default SyncButton;
