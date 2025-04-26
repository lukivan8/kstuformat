import React, { useState } from "react";
import {
  PreviewData,
  PreviewQuestion as PreviewQuestionType,
} from "@/processFile";
import { generateExcelFromCorrectedData } from "@/processFile";
import PreviewQuestion from "./PreviewQuestion";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ArrowLeft, AlertCircle, Check } from "lucide-react";

interface SurveyPreviewProps {
  previewData: PreviewData;
  onBack: () => void;
  onComplete: (message: string) => void;
}

const SurveyPreview: React.FC<SurveyPreviewProps> = ({
  previewData,
  onBack,
  onComplete,
}) => {
  const [questions, setQuestions] = useState<PreviewQuestionType[]>(
    previewData.questions
  );

  const remainingIssuesCount = questions.reduce((total, question) => {
    const answersByCount = question.answers.reduce((acc, answer) => {
      if (!acc[answer.count]) {
        acc[answer.count] = [];
      }
      acc[answer.count].push(answer);
      return acc;
    }, {} as Record<number, typeof question.answers>);

    const potentialIssues = Object.values(answersByCount).filter(
      (group) => group.length > 1 && group[0].count > 0
    );

    return total + potentialIssues.length;
  }, 0);

  const handleQuestionUpdate = (
    index: number,
    updatedData: PreviewQuestionType
  ) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedData;
    setQuestions(newQuestions);
  };

  const handleFinalize = () => {
    generateExcelFromCorrectedData(questions, previewData.originalFileName);
    onComplete(
      `Файл успешно обработан! Сохранен как "${previewData.originalFileName}_ANALYZED.xlsx"`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <Button onClick={handleFinalize} className="flex items-center">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Сформировать Excel файл
        </Button>
      </div>

      <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
        <h3 className="text-md font-medium text-blue-800 mb-2">
          Проверка и корректировка данных
        </h3>
        <p className="text-sm text-blue-700">
          Пожалуйста, проверьте варианты ответов для каждого вопроса. Вы можете:
        </p>
        <ul className="text-sm text-blue-700 mt-1 list-disc pl-5 space-y-1">
          <li>Отредактировать текст ответа</li>
          <li>Объединить ответы, которые были разделены запятыми</li>
          <li>Добавить новые варианты ответов</li>
          <li>Удалить ненужные варианты</li>
        </ul>
        <p className="text-sm text-blue-700 mt-2">
          Варианты, выделенные желтым цветом, могут требовать проверки. Система
          автоматически определяет потенциальные проблемы по одинаковому
          количеству ответов.
        </p>
      </div>

      <div>
        {questions.map((question, index) => (
          <PreviewQuestion
            key={index}
            data={question}
            index={index}
            onQuestionUpdate={handleQuestionUpdate}
          />
        ))}
      </div>

      <div className="flex flex-col space-y-4 justify-end">
        {remainingIssuesCount > 0 ? (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Обнаружено {remainingIssuesCount} групп
              {remainingIssuesCount > 1 ? "" : "а"} ответов с возможными
              проблемами. Рекомендуется проверить и объединить их перед
              формированием файла.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 flex items-center">
              <Check className="h-4 w-4 mr-2" />
              Все потенциальные проблемы решены. Файл готов к формированию.
            </p>
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={handleFinalize} className="flex items-center">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Сформировать Excel файл
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SurveyPreview;
