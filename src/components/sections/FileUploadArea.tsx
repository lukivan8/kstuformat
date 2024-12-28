import { Upload } from "lucide-react";

interface FileUploadProps {
  isDragging: boolean;
  isProcessing: boolean;
  setIsDragging: (value: boolean) => void;
  onFileSelect: (file: File) => void;
}

const FileUploadArea: React.FC<FileUploadProps> = ({
  isDragging,
  isProcessing,
  setIsDragging,
  onFileSelect,
}) => (
  <div
    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
      isDragging
        ? "border-blue-500 bg-blue-50"
        : "border-gray-300 hover:border-blue-500"
    }`}
    onDragOver={(e) => {
      e.preventDefault();
      setIsDragging(true);
    }}
    onDragLeave={() => setIsDragging(false)}
    onDrop={(e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    }}
    onClick={() => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".xlsx,.xls";
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) onFileSelect(file);
      };
      input.click();
    }}
  >
    <Upload
      className={`w-12 h-12 mx-auto mb-4 ${
        isDragging ? "text-blue-500" : "text-gray-400"
      }`}
    />
    <p className="text-lg mb-2">
      {isProcessing
        ? "Обработка файла..."
        : "Перетащите файл XLSX сюда или нажмите для загрузки"}
    </p>
    <p className="text-sm text-gray-500">
      Поддерживаются файлы .xlsx и .xls из Google Forms
    </p>
  </div>
);

export default FileUploadArea;
