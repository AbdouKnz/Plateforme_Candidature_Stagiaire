import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconUpload,
  IconFileTypeXls,
  IconFileTypePdf,
} from "@tabler/icons-react";
import { FileTypeOptions } from "@/models/export-model";
import { TableExportFnProps } from "@/models/table-model";
import { useTranslation } from "react-i18next";

interface DataTableExportProps {
  exportFn: TableExportFnProps;
}

export function DataTableExport({ exportFn }: DataTableExportProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden h-9 lg:flex hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary/90"
          >
            <IconUpload className="mr-2 h-4 w-4" size={18} />
            <span>{t("export")}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              exportFn({ fileType: FileTypeOptions.PDF })
            }
          >
            <IconFileTypePdf className="h-4 w-4 text-red-500 mr-2" />
            <span>{t("pdf")}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              exportFn({ fileType: FileTypeOptions.EXCEL })
            }
          >
            <IconFileTypeXls className="h-4 w-4 text-green-600 mr-2" />
            <span>{t("excel")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}