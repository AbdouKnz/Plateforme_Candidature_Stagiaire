import type { Table } from "@tanstack/react-table";
import { type ReactNode } from "react";
import { DataTableViewOptions } from "./data-table-view-options";
import DataTableSearch from "./data-table-search";
import DataTableAdd from "./data-table-add";
import { DataTableExport } from "./data-table-export";
import type { ToolbarProps } from "@/models/table-model";
import { DataTableFilter } from "./data-table-filter";
import DataTableExtra from "./data-table-extra";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  toolbarProps?: ToolbarProps;
  toolbarCenter?: ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  toolbarProps,
  toolbarCenter,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="relative flex items-center justify-between gap-3 p-4">
      <div className="flex flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        {toolbarProps?.tableSearchProps && (
          <DataTableSearch tableSearchProps={toolbarProps?.tableSearchProps} />
        )}
        <DataTableViewOptions table={table} />
      </div>

      {toolbarCenter && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="pointer-events-auto">{toolbarCenter}</div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {toolbarProps?.extraAction && (
          <DataTableExtra tableExtraActionProps={toolbarProps.extraAction} />
        )}

        {toolbarProps?.exportFunction && (
          <DataTableExport exportFn={toolbarProps.exportFunction} />
        )}

        {toolbarProps?.tableFilterProps && (
          <DataTableFilter
            tableFilterProps={toolbarProps?.tableFilterProps!}
          />
        )}
        {toolbarProps?.tableAddProps && (
          <DataTableAdd tableAddProps={toolbarProps.tableAddProps} />
        )}
      </div>
    </div>
  );
}
