import { Spinner } from "@/components/ui/shadcn-io/spinner";

const DataTableLoading = () => {
  return (
    <div className="flex l items-center justify-center ">
      <div className="flex flex-col items-center space-y-4">
        <Spinner variant="circle" className="text-primary" />{" "}
      </div>
    </div>
  );
};

export default DataTableLoading;
