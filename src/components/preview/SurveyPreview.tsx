import React, { useState } from "react";
import {
  PreviewData,
  PreviewQuestion as PreviewQuestionType,
  QuestionWithLanguage,
  generateExcelFromCorrectedData,
} from "@/processFile";
import PreviewQuestion from "./PreviewQuestion";
import CombineQuestionsModal from "./CombineQuestionsModal";
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
  const [questions, setQuestions] = useState<QuestionWithLanguage[]>(
    previewData.questions.map((q) => ({
      ...q,
      language: autoDetectLanguage(q.question),
    }))
  );

  // Состояние для модального окна объединения вопросов
  const [combineModalOpen, setCombineModalOpen] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<
    number | null
  >(null);

  // Автоматическое определение языка вопроса
  function autoDetectLanguage(
    question: string
  ): "russian" | "kazakh" | "unknown" {
    // Проверка на казахские специфические символы
    if (/[әіңғүұқөһ]/i.test(question)) {
      return "kazakh";
    }
    // Проверка на русский язык (кириллица без казахских символов)
    else if (/[а-яА-Я]/.test(question)) {
      return "russian";
    }
    return "unknown";
  }

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
    // Сохраняем язык при обновлении вопроса
    newQuestions[index] = {
      ...updatedData,
      language:
        (newQuestions[index] as QuestionWithLanguage).language || "unknown",
    };
    setQuestions(newQuestions);
  };

  const handleFinalize = () => {
    // Группируем вопросы по языку
    const russianQuestions = questions.filter((q) => q.language === "russian");
    const kazakhQuestions = questions.filter((q) => q.language === "kazakh");
    const otherQuestions = questions.filter((q) => q.language === "unknown");

    // Создаем общий файл со всеми вопросами
    generateExcelFromCorrectedData(
      questions,
      `${previewData.originalFileName}_ALL`
    );

    // Если есть вопросы на русском, создаем отдельный файл
    if (russianQuestions.length > 0) {
      generateExcelFromCorrectedData(
        russianQuestions,
        `${previewData.originalFileName}_RU`
      );
    }

    // Если есть вопросы на казахском, создаем отдельный файл
    if (kazakhQuestions.length > 0) {
      generateExcelFromCorrectedData(
        kazakhQuestions,
        `${previewData.originalFileName}_KZ`
      );
    }

    // Формируем сообщение о результате
    let message = `Файл(ы) успешно обработаны! Сохранены как "${previewData.originalFileName}_ALL.xlsx"`;
    if (russianQuestions.length > 0) {
      message += `, "${previewData.originalFileName}_RU.xlsx"`;
    }
    if (kazakhQuestions.length > 0) {
      message += `, "${previewData.originalFileName}_KZ.xlsx"`;
    }

    onComplete(message);
  };

  // Обработчик открытия модального окна объединения
  const handleCombineClick = (questionIndex: number) => {
    setSelectedQuestionIndex(questionIndex);
    setCombineModalOpen(true);
  };

  const handleCombineQuestions = (
    sourceIndex: number,
    targetIndex: number,
    answerMappings: Record<string, string>,
    newAnswers?: Array<{ sourceText: string; targetText: string }>
  ) => {
    // Получаем исходный и целевой вопросы
    const sourceQuestion = questions[sourceIndex];
    const targetQuestion = questions[targetIndex];

    // Создаем копии вопросов
    const updatedSourceQuestion = { ...sourceQuestion };
    const updatedTargetQuestion = { ...targetQuestion };

    // Сохраняем оригинальные данные в случае отмены объединения
    if (!updatedSourceQuestion.originalAnswers) {
      updatedSourceQuestion.originalAnswers = JSON.parse(
        JSON.stringify(sourceQuestion.answers)
      );
    }

    if (!updatedTargetQuestion.originalAnswers) {
      updatedTargetQuestion.originalAnswers = JSON.parse(
        JSON.stringify(targetQuestion.answers)
      );
    }

    // Суммируем общее количество респондентов
    const totalRespondents =
      sourceQuestion.totalRespondents + targetQuestion.totalRespondents;
    updatedSourceQuestion.totalRespondents = totalRespondents;
    updatedTargetQuestion.totalRespondents = totalRespondents;

    // Инициализируем массивы связанных вопросов, если их еще нет
    if (!updatedSourceQuestion.combinedWith) {
      updatedSourceQuestion.combinedWith = [];
    }
    if (!updatedTargetQuestion.combinedWith) {
      updatedTargetQuestion.combinedWith = [];
    }

    // Добавляем двустороннюю связь между вопросами
    // Проверяем, не добавлена ли уже связь
    if (
      !updatedSourceQuestion.combinedWith.some(
        (combined) => combined.questionIndex === targetIndex
      )
    ) {
      updatedSourceQuestion.combinedWith.push({
        questionIndex: targetIndex,
        questionText: targetQuestion.question,
      });
    }

    if (
      !updatedTargetQuestion.combinedWith.some(
        (combined) => combined.questionIndex === sourceIndex
      )
    ) {
      updatedTargetQuestion.combinedWith.push({
        questionIndex: sourceIndex,
        questionText: sourceQuestion.question,
      });
    }

    // Создаем копию ответов целевого вопроса
    const updatedTargetAnswers = [...targetQuestion.answers];

    // Сначала добавляем новые варианты ответов, если они есть
    if (newAnswers && newAnswers.length > 0) {
      newAnswers.forEach(({ sourceText, targetText }) => {
        // Находим исходный ответ
        const sourceAnswer = sourceQuestion.answers.find(
          (a) => a.text === sourceText
        );

        if (sourceAnswer) {
          // Добавляем новый вариант ответа в целевой вопрос с исходным количеством
          updatedTargetAnswers.push({
            text: targetText,
            count: sourceAnswer.count,
            percentage:
              ((sourceAnswer.count / totalRespondents) * 100).toFixed(2) + "%",
          });
        }
      });
    }

    // Для каждого сопоставления ответов
    Object.entries(answerMappings).forEach(
      ([sourceAnswerText, targetAnswerText]) => {
        // Если выбрано "Не объединять", пропускаем
        if (!targetAnswerText) return;

        // Находим ответ в исходном вопросе
        const sourceAnswer = sourceQuestion.answers.find(
          (a) => a.text === sourceAnswerText
        );

        if (sourceAnswer) {
          // Находим индекс соответствующего ответа в целевом вопросе
          const targetAnswerIndex = updatedTargetAnswers.findIndex(
            (a) => a.text === targetAnswerText
          );

          if (targetAnswerIndex !== -1) {
            // Обновляем количество и процент для ответа в целевом вопросе
            const targetAnswer = updatedTargetAnswers[targetAnswerIndex];
            const newCount = targetAnswer.count + sourceAnswer.count;
            const newPercentage =
              ((newCount / totalRespondents) * 100).toFixed(2) + "%";

            updatedTargetAnswers[targetAnswerIndex] = {
              ...targetAnswer,
              count: newCount,
              percentage: newPercentage,
            };
          }
        }
      }
    );

    // Обновляем исходный вопрос, копируя статистику из обновленных ответов
    const updatedSourceAnswers = sourceQuestion.answers.map((answer) => {
      // Ищем соответствующий ответ в сопоставлениях
      const targetAnswerText = answerMappings[answer.text];

      if (targetAnswerText) {
        // Находим обновленный ответ в целевом вопросе
        const targetAnswer = updatedTargetAnswers.find(
          (a) => a.text === targetAnswerText
        );
        if (targetAnswer) {
          // Копируем обновленную статистику
          return {
            ...answer,
            count: targetAnswer.count,
            percentage: targetAnswer.percentage,
          };
        }
      }

      // Если нет сопоставления, пересчитываем только процент
      return {
        ...answer,
        percentage: ((answer.count / totalRespondents) * 100).toFixed(2) + "%",
      };
    });

    // Пересчитываем проценты для всех ответов в обоих вопросах
    updatedTargetAnswers.forEach((answer) => {
      answer.percentage =
        ((answer.count / totalRespondents) * 100).toFixed(2) + "%";
    });

    // Обновляем целевой вопрос с новыми ответами
    updatedTargetQuestion.answers = updatedTargetAnswers.sort(
      (a, b) => b.count - a.count
    );
    updatedSourceQuestion.answers = updatedSourceAnswers;

    // Обновляем все вопросы
    const newQuestions = [...questions];
    newQuestions[sourceIndex] = updatedSourceQuestion;
    newQuestions[targetIndex] = updatedTargetQuestion;

    setQuestions(newQuestions);
    setCombineModalOpen(false);
  };

  const handleRemoveCombines = (questionIndex: number) => {
    const currentQuestions = [...questions];
    const questionToUpdate = currentQuestions[questionIndex];

    if (
      !questionToUpdate.combinedWith ||
      questionToUpdate.combinedWith.length === 0
    ) {
      return;
    }

    // Получаем индексы всех вопросов, с которыми текущий вопрос объединен
    const combinedQuestionIndices = questionToUpdate.combinedWith.map(
      (c) => c.questionIndex
    );

    // Восстанавливаем оригинальные ответы текущего вопроса
    if (questionToUpdate.originalAnswers) {
      questionToUpdate.answers = JSON.parse(
        JSON.stringify(questionToUpdate.originalAnswers)
      );
      delete questionToUpdate.originalAnswers;
    }

    // Восстанавливаем исходное количество респондентов
    // (если у нас нет этой информации, оставляем как есть)

    // Удаляем связь текущего вопроса со всеми объединенными
    questionToUpdate.combinedWith = [];

    // Восстанавливаем оригинальное состояние всех связанных вопросов
    combinedQuestionIndices.forEach((idx) => {
      const otherQuestion = currentQuestions[idx];

      // Восстанавливаем оригинальные ответы
      if (otherQuestion.originalAnswers) {
        otherQuestion.answers = JSON.parse(
          JSON.stringify(otherQuestion.originalAnswers)
        );
        delete otherQuestion.originalAnswers;
      }

      // Удаляем связь с текущим вопросом
      if (otherQuestion.combinedWith) {
        otherQuestion.combinedWith = otherQuestion.combinedWith.filter(
          (c) => c.questionIndex !== questionIndex
        );
      }
    });

    // Обновляем состояние
    setQuestions(currentQuestions);
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
          <li>
            Объединить ответы с другого языка для сравнительной статистики
          </li>
          <li>Добавить новые варианты ответов</li>
          <li>Указать язык вопроса для формирования отдельных отчетов</li>
        </ul>

        <div className="flex items-center mt-3 pt-3 border-t border-blue-200">
          <p className="text-sm text-blue-800 font-medium mr-2">
            Определено языков:
          </p>
          <div className="flex gap-2">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-xs text-blue-800">
                Русский:{" "}
                {questions.filter((q) => q.language === "russian").length}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs text-green-800">
                Казахский:{" "}
                {questions.filter((q) => q.language === "kazakh").length}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-gray-400 mr-1"></div>
              <span className="text-xs text-gray-800">
                Не определен:{" "}
                {questions.filter((q) => q.language === "unknown").length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        {questions.map((question, index) => (
          <PreviewQuestion
            key={index}
            data={question}
            index={index}
            onQuestionUpdate={handleQuestionUpdate}
            onCombineClick={handleCombineClick}
            onRemoveCombines={handleRemoveCombines}
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

      {/* Модальное окно объединения вопросов */}
      {selectedQuestionIndex !== null && (
        <CombineQuestionsModal
          open={combineModalOpen}
          onClose={() => setCombineModalOpen(false)}
          questions={questions}
          sourceQuestionIndex={selectedQuestionIndex}
          onCombine={handleCombineQuestions}
        />
      )}
    </div>
  );
};

export default SurveyPreview;
