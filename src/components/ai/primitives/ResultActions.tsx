import React from "react";
import { Button } from "../../ui/button";

interface ResultActionsProps {
  onNew: () => void;
  newLabel?: string;
  onClear?: () => void;
  clearLabel?: string;
}

export const ResultActions: React.FC<ResultActionsProps> = ({
  onNew,
  newLabel = "New Run",
  onClear,
  clearLabel = "Clear All",
}) => {
  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={onNew} className="border-gray-700">
        {newLabel}
      </Button>
      {onClear && (
        <Button onClick={onClear} variant="ghost">
          {clearLabel}
        </Button>
      )}
    </div>
  );
};
