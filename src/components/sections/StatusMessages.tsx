import { AlertCircle, CheckCircle2, FileDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StatusProps {
  error: string;
  success: string;
}

const StatusMessages: React.FC<StatusProps> = ({ error, success }) => (
  <>
    {error && (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}

    {success && (
      <Alert className="bg-green-50 text-green-900 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle>Готово!</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          <span>{success}</span>
          <FileDown className="w-4 h-4" />
        </AlertDescription>
      </Alert>
    )}
  </>
);

export default StatusMessages;
