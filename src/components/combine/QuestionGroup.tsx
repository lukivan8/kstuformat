import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";

interface QuestionGroupProps {
  mainQuestion: string;
  questions: string[];
  isActive: boolean;
  onActivate: () => void;
  onRemove: (question: string) => void;
}

const QuestionGroup: React.FC<QuestionGroupProps> = ({
  mainQuestion,
  questions,
  isActive,
  onActivate,
  onRemove,
}) => {
  return (
    <Card
      className={`border-2 transition-colors ${
        isActive ? "border-blue-500" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{mainQuestion}</span>
            <Badge className="bg-blue-100 text-blue-800">
              {questions.length} {questions.length > 1 ? "вопросов" : "вопрос"}
            </Badge>
          </div>
          {questions.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(mainQuestion)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Отображаем связанные вопросы, кроме главного */}
          {questions
            .filter((q) => q !== mainQuestion)
            .map((question) => (
              <div
                key={question}
                className="flex justify-between items-center p-2 rounded bg-gray-50"
              >
                <div className="flex-1 text-sm">{question}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(question)}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
        </div>

        {/* Кнопка для активации/деактивации группы */}
        <div className="mt-3">
          <Button
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={onActivate}
            className="w-full"
          >
            {isActive ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Выбрана
              </>
            ) : (
              "Выбрать для добавления вопросов"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionGroup;
