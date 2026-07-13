import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TableExtraActionButton } from "@/models/table-model";
import React from "react";

interface DataTableExtraActionProps {
  tableExtraActionProps: TableExtraActionButton;
}

export const DataTableExtra: React.FC<DataTableExtraActionProps> = ({
  tableExtraActionProps,
}) => {
  const Icon = tableExtraActionProps.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant={tableExtraActionProps.variant}
          className={tableExtraActionProps.className}
          onClick={tableExtraActionProps.onClick}
          disabled={tableExtraActionProps.isPending}
        >
          {tableExtraActionProps.isPending ? (
            <>
              <Spinner variant="circle" />
              <span>{tableExtraActionProps.pendingLabel}</span>
            </>
          ) : (
            <>
              {Icon && <Icon size={10} />}
              <span>{tableExtraActionProps.label}</span>
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tableExtraActionProps.tooltip}</TooltipContent>
    </Tooltip>
  );
};

export default DataTableExtra;
