import { useEffect, useState } from "react";
import { TableSearchProps } from "@/models/table-model";
import { Search } from "lucide-react";
import { useDebounce } from "@/lib/utils";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

interface DataTableSearchProps {
  tableSearchProps?: TableSearchProps;
}

const DataTableSearch = ({ tableSearchProps }: DataTableSearchProps) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 150) || "";

  useEffect(() => {
    if (tableSearchProps?.setQueryParams) {
      tableSearchProps.setQueryParams({ 
        search: debouncedSearchTerm,
        page: 1 
      });
    }
  }, [debouncedSearchTerm, tableSearchProps?.setQueryParams]);

  return (
    <InputGroup className="h-9 w-[150px] lg:w-[200px]">
      <InputGroupInput
        placeholder={tableSearchProps?.placeholder || "Search..."}
        onChange={(e) => setSearchTerm?.(e.target.value)}
      />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  );
};

export default DataTableSearch;
