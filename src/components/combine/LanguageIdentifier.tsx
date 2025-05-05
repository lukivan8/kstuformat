import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Globe, ArrowLeft } from "lucide-react";
import { PreviewQuestion } from "@/processFile";

interface LanguageIdentifierProps {
  combinedQuestions: (PreviewQuestion & { relatedQuestions?: string[] })[];
  onComplete: (
    russianQuestions: { [key: string]: string[] },
    kazakhQuestions: { [key: string]: string[] }
  ) => void;
  onBack: () => void;
}

type QuestionLanguage = {
  [key: string]: "russian" | "kazakh" | "";
};

const LanguageIdentifier: React.FC<LanguageIdentifierProps> = ({
  combinedQuestions,
  onComplete,
  onBack,
}) => {
  // Инициализация состояния языков для всех вопросов (и связанных с ними)
  const [questionLanguages, setQuestionLanguages] = useState<QuestionLanguage>(
    () => {
      const initial: QuestionLanguage = {};

      combinedQuestions.forEach((question) => {
        // Главный вопрос
        initial[question.question] = "";

        // Связанные вопросы
        if (question.relatedQuestions) {
          question.relatedQuestions.forEach((relatedQ) => {
            initial[relatedQ] = "";
          });
        }
      });

      return initial;
    }
  );

  // Установка языка для вопроса
  const setQuestionLanguage = (
    question: string,
    language: "russian" | "kazakh"
  ) => {
    setQuestionLanguages((prev) => ({
      ...prev,
      [question]: language,
    }));
  };

  // Проверка, все ли вопросы имеют назначенный язык
  const allQuestionsHaveLanguage = () => {
    return Object.values(questionLanguages).every((lang) => lang !== "");
  };

  // Автоматическое определение языка (простая эвристика)
  const autoDetectLanguages = () => {
    const newLanguages = { ...questionLanguages };

    Object.keys(newLanguages).forEach((question) => {
      // Проверка на кириллицу (русский)
      const hasCyrillic = /[а-яА-Я]/.test(question);

      // Проверка на казахские специфические символы
      const hasKazakhSpecific = /[әіңғүұқөһ]/i.test(question);

      if (hasKazakhSpecific) {
        newLanguages[question] = "kazakh";
      } else if (hasCyrillic) {
        newLanguages[question] = "russian";
      }
    });

    setQuestionLanguages(newLanguages);
  };

  // Завершение и отправка результатов
  const handleComplete = () => {
    const russianQuestions: { [key: string]: string[] } = {};
    const kazakhQuestions: { [key: string]: string[] } = {};

    combinedQuestions.forEach((question) => {
      const mainQuestion = question.question;
      const relatedQuestions = question.relatedQuestions || [];

      // Определяем русские вопросы в этой группе
      const russianGroup = [mainQuestion, ...relatedQuestions].filter(
        (q) => questionLanguages[q] === "russian"
      );

      // Определяем казахские вопросы в этой группе
      const kazakhGroup = [mainQuestion, ...relatedQuestions].filter(
        (q) => questionLanguages[q] === "kazakh"
      );

      // Если есть русские вопросы, добавляем их в соответствующую группу
      if (russianGroup.length > 0) {
        russianQuestions[russianGroup[0]] = russianGroup;
      }

      // Если есть казахские вопросы, добавляем их в соответствующую группу
      if (kazakhGroup.length > 0) {
        kazakhQuestions[kazakhGroup[0]] = kazakhGroup;
      }
    });

    onComplete(russianQuestions, kazakhQuestions);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <Button
          variant="default"
          onClick={handleComplete}
          disabled={!allQuestionsHaveLanguage()}
          className="flex items-center"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Сформировать отчет
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Определение языка вопросов</h2>
        <Button
          variant="outline"
          onClick={autoDetectLanguages}
          className="flex items-center"
        >
          <Globe className="h-4 w-4 mr-2" />
          Автоопределение
        </Button>
      </div>

      <div className="space-y-4">
        {combinedQuestions.map((question, index) => {
          const relatedQuestions = question.relatedQuestions || [];
          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">
                  Группа вопросов {index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Главный вопрос */}
                  <div className="p-3 border rounded-md bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>{question.question}</div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={
                            questionLanguages[question.question] === "russian"
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setQuestionLanguage(question.question, "russian")
                          }
                        >
                          Русский
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            questionLanguages[question.question] === "kazakh"
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setQuestionLanguage(question.question, "kazakh")
                          }
                        >
                          Казахский
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Связанные вопросы */}
                  {relatedQuestions.map((relatedQ, idx) => (
                    <div key={idx} className="p-3 border rounded-md">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>{relatedQ}</div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={
                              questionLanguages[relatedQ] === "russian"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              setQuestionLanguage(relatedQ, "russian")
                            }
                          >
                            Русский
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              questionLanguages[relatedQ] === "kazakh"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              setQuestionLanguage(relatedQ, "kazakh")
                            }
                          >
                            Казахский
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!allQuestionsHaveLanguage() && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
          Пожалуйста, определите язык для всех вопросов, чтобы продолжить.
        </div>
      )}
    </div>
  );
};

export default LanguageIdentifier;
