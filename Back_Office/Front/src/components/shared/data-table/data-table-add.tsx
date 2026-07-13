import { Button } from "@/components/ui/button";
import { TableAddProps } from "@/models/table-model";
import { IconPlus } from "@tabler/icons-react";
import React from "react";

interface DataTableAddProps {tableAddProps:TableAddProps}

export const DataTableAdd: React.FC<DataTableAddProps> = ({ tableAddProps }) => {
  return (
    <Button
      size="sm"
      variant="custom"
      className="ml-auto hidden h-9 lg:flex"
      onClick={tableAddProps.addFunction}
    >
     <IconPlus  size={10}/>
      <span>{tableAddProps.addButtonLabel}</span>
    </Button>
  );
};

export default DataTableAdd;
