import React from "react";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Language = "russian" | "kazakh" | "unknown";

interface LanguageBadgeProps {
  language: Language;
  onChange: (language: Language) => void;
  className?: string;
}

const LanguageBadge: React.FC<LanguageBadgeProps> = ({
  language,
  onChange,
  className = "",
}) => {
  const getLanguageLabel = (lang: Language) => {
    switch (lang) {
      case "russian":
        return "Русский";
      case "kazakh":
        return "Казахский";
      default:
        return "Язык не определен";
    }
  };

  const getLanguageColor = (lang: Language) => {
    switch (lang) {
      case "russian":
        return "bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200";
      case "kazakh":
        return "bg-green-100 hover:bg-green-200 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200";
    }
  };

  // Список всех возможных языков
  const languages: Language[] = ["russian", "kazakh", "unknown"];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          className={`cursor-pointer ${getLanguageColor(
            language
          )} ${className}`}
        >
          <Globe className="h-3 w-3 mr-1" />
          {getLanguageLabel(language)}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <div className="py-1">
          {languages.map((lang) => (
            <div
              key={lang}
              className={`px-4 py-2 text-sm cursor-pointer ${
                lang === language
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => onChange(lang)}
            >
              {getLanguageLabel(lang)}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LanguageBadge;
