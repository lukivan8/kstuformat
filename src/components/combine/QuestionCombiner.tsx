import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Plus, X, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PreviewQuestion } from "@/processFile";
import QuestionGroup from "./QuestionGroup";
import { Separator } from "@/components/ui/separator";

interface QuestionCombinerProps {
  questions: PreviewQuestion[];
  onBack: () => void;
  onComplete: (combinedQuestions: PreviewQuestion[]) => void;
}

type QuestionGroups = {
  [key: string]: string[]; // mainQuestion -> [related questions]
};

const QuestionCombiner: React.FC<QuestionCombinerProps> = ({
  questions,
  onBack,
  onComplete,
}) => {
  // Изначально каждый вопрос в своей собственной группе
  const [groups, setGroups] = useState<QuestionGroups>({});
  // Оставшиеся вопросы, которые еще не сгруппированы
  const [remainingQuestions, setRemainingQuestions] = useState<string[]>([]);
  // Текущая активная группа (для которой выбираем вопросы)
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Инициализация данных при загрузке компонента
  useEffect(() => {
    const initialGroups: QuestionGroups = {};
    const questionTexts = questions.map((q) => q.question);

    // Создаем автоматические группы на основе схожести вопросов
    const autoGroups = autoGroupSimilarQuestions(questionTexts);

    // Если автоматические группы найдены, используем их
    if (Object.keys(autoGroups).length > 0) {
      setGroups(autoGroups);

      // Определяем оставшиеся вопросы
      const groupedQuestions = new Set(Object.values(autoGroups).flat());
      setRemainingQuestions(
        questionTexts.filter((q) => !groupedQuestions.has(q)),
      );
    } else {
      // Если автоматические группы не найдены, все вопросы остаются несгруппированными
      setRemainingQuestions(questionTexts);
    }
  }, [questions]);

  // Автоматическое группирование похожих вопросов с улучшенными эвристиками
  const autoGroupSimilarQuestions = (
    questionTexts: string[],
  ): QuestionGroups => {
    const result: QuestionGroups = {};
    const processed = new Set<string>();

    // Создаем нормализованные версии вопросов для сравнения
    const normalizedQuestions = questionTexts.map((q) => ({
      original: q,
      normalized: q.toLowerCase().replace(/\s+/g, " ").trim(),
      // Определение языка (для казахского и русского)
      isKazakh: /[әіңғүұқөһ]/i.test(q),
      isRussian: /[а-яА-Я]/.test(q) && !/[әіңғүұқөһ]/i.test(q),
    }));

    // Сначала пытаемся найти пары вопросов на разных языках
    for (let i = 0; i < normalizedQuestions.length; i++) {
      const q1 = normalizedQuestions[i];
      if (processed.has(q1.original)) continue;

      // Для каждого русского вопроса ищем похожий казахский и наоборот
      if (q1.isRussian || q1.isKazakh) {
        const similarQuestions = [q1.original];

        for (let j = 0; j < normalizedQuestions.length; j++) {
          if (i === j) continue;

          const q2 = normalizedQuestions[j];
          if (processed.has(q2.original)) continue;

          // Проверяем, что вопросы на разных языках
          const differentLanguages =
            (q1.isRussian && q2.isKazakh) || (q1.isKazakh && q2.isRussian);

          if (differentLanguages) {
            // Проверка на схожесть вопросов по длине
            const lengthSimilar =
              Math.abs(q1.normalized.length - q2.normalized.length) /
                Math.max(q1.normalized.length, q2.normalized.length) <
              0.4;

            // Проверка на схожие числовые значения в вопросах (например, номера вопросов)
            const numbers1 = q1.normalized.match(/\d+/g) || [];
            const numbers2 = q2.normalized.match(/\d+/g) || [];
            const hasCommonNumbers =
              // @ts-ignore
              numbers1.some((n) => numbers2.includes(n)) && numbers1.length > 0;

            // Проверка на схожую позицию в списке вопросов
            const positionSimilar = Math.abs(i - j) <= 2;

            // Если вопросы похожи по критериям, добавляем в группу
            if ((lengthSimilar && positionSimilar) || hasCommonNumbers) {
              similarQuestions.push(q2.original);
              processed.add(q2.original);
              break; // Для каждого вопроса находим только одну пару
            }
          }
        }

        // Если нашли похожие вопросы, создаем группу
        if (similarQuestions.length > 1) {
          result[q1.original] = similarQuestions;
          similarQuestions.forEach((q) => processed.add(q));
        }
      }
    }

    // Затем ищем похожие вопросы по содержанию (на одном языке)
    for (let i = 0; i < normalizedQuestions.length; i++) {
      const q1 = normalizedQuestions[i];
      if (processed.has(q1.original)) continue;

      const similarQuestions = [q1.original];

      for (let j = i + 1; j < normalizedQuestions.length; j++) {
        const q2 = normalizedQuestions[j];
        if (processed.has(q2.original)) continue;

        // Проверка на схожесть вопросов по длине
        const lengthSimilar =
          Math.abs(q1.normalized.length - q2.normalized.length) /
            Math.max(q1.normalized.length, q2.normalized.length) <
          0.3;

        // Проверка на схожие слова
        const words1 = new Set(q1.normalized.split(/\s+/));
        const words2 = new Set(q2.normalized.split(/\s+/));
        const commonWords = [...words1].filter((word) => words2.has(word));
        const wordSimilarity =
          commonWords.length / Math.max(words1.size, words2.size);

        // Если вопросы похожи, добавляем в группу
        if (lengthSimilar && wordSimilarity > 0.2) {
          similarQuestions.push(q2.original);
          processed.add(q2.original);
        }
      }

      // Если нашли похожие вопросы, создаем группу
      if (similarQuestions.length > 1) {
        result[q1.original] = similarQuestions;
        similarQuestions.forEach((q) => processed.add(q));
      }
    }

    return result;
  };

  // Добавление вопроса в активную группу
  const addQuestionToGroup = (questionText: string) => {
    if (!activeGroup) return;

    setGroups((prev) => ({
      ...prev,
      [activeGroup]: [...prev[activeGroup], questionText],
    }));

    setRemainingQuestions((prev) => prev.filter((q) => q !== questionText));
  };

  // Удаление вопроса из группы
  const removeQuestionFromGroup = (groupKey: string, questionText: string) => {
    // Если это главный вопрос группы, удаляем всю группу
    if (groupKey === questionText) {
      const groupQuestions = groups[groupKey] || [];

      // Возвращаем все вопросы из группы обратно в список оставшихся
      setRemainingQuestions((prev) => [...prev, ...groupQuestions]);

      // Удаляем группу
      setGroups((prev) => {
        const newGroups = { ...prev };
        delete newGroups[groupKey];
        return newGroups;
      });

      // Если это активная группа, сбрасываем активную группу
      if (activeGroup === groupKey) {
        setActiveGroup(null);
      }
    } else {
      // Удаляем вопрос из группы
      setGroups((prev) => ({
        ...prev,
        [groupKey]: prev[groupKey].filter((q) => q !== questionText),
      }));

      // Возвращаем вопрос в список оставшихся
      setRemainingQuestions((prev) => [...prev, questionText]);
    }
  };

  // Создание новой группы из оставшегося вопроса
  const createNewGroup = (questionText: string) => {
    setGroups((prev) => ({
      ...prev,
      [questionText]: [questionText],
    }));

    setRemainingQuestions((prev) => prev.filter((q) => q !== questionText));
    setActiveGroup(questionText);
  };

  // Объединение статистики вопросов из групп
  const combineQuestions = () => {
    const combinedQuestions: PreviewQuestion[] = [];

    // Обрабатываем сгруппированные вопросы
    Object.entries(groups).forEach(([mainQuestion, groupQuestions]) => {
      // Находим соответствующие вопросы в исходных данных
      const questionObjects = questions.filter((q) =>
        groupQuestions.includes(q.question),
      );

      if (questionObjects.length === 0) return;

      // Берем первый вопрос как основу
      const baseQuestion = { ...questionObjects[0] };

      // Объединяем ответы всех вопросов в группе
      const allAnswers = new Map<
        string,
        { count: number; percentage: string }
      >();
      const totalRespondents = Math.max(
        ...questionObjects.map((q) => q.totalRespondents),
      );

      // Сначала собираем все ответы
      questionObjects.forEach((q) => {
        q.answers.forEach((answer) => {
          const normalizedText = answer.text.toLowerCase().trim();
          if (allAnswers.has(normalizedText)) {
            // Если ответ уже есть, суммируем количество
            const existing = allAnswers.get(normalizedText)!;
            existing.count += answer.count;
          } else {
            // Если ответа еще нет, добавляем
            allAnswers.set(normalizedText, {
              count: answer.count,
              percentage: "", // Пересчитаем позже
            });
          }
        });
      });

      // Пересчитываем проценты на основе общего количества респондентов
      allAnswers.forEach((value, key) => {
        value.percentage =
          ((value.count / totalRespondents) * 100).toFixed(2) + "%";
      });

      // Преобразуем Map обратно в массив и сортируем по количеству ответов
      const combinedAnswers = Array.from(allAnswers.entries())
        .map(([text, data]) => ({
          text,
          count: data.count,
          percentage: data.percentage,
        }))
        .sort((a, b) => b.count - a.count);

      // Создаем объединенный вопрос
      combinedQuestions.push({
        question: mainQuestion,
        answers: combinedAnswers,
        totalRespondents,
        // Сохраняем информацию о связанных вопросах
        relatedQuestions: groupQuestions.filter((q) => q !== mainQuestion),
      } as PreviewQuestion & { relatedQuestions: string[] });
    });

    // Добавляем оставшиеся несгруппированные вопросы
    const remainingQuestionsObjects = questions.filter((q) =>
      remainingQuestions.includes(q.question),
    );

    combinedQuestions.push(...remainingQuestionsObjects);

    // Отправляем объединенные вопросы дальше
    onComplete(combinedQuestions);
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
        <Button
          onClick={() => {
            if (step === 1) {
              setStep(2);
            } else {
              combineQuestions();
            }
          }}
          className="flex items-center"
        >
          {step === 2 ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Завершить объединение
            </>
          ) : (
            <>
              Далее
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {step === 1 && (
        <>
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              <div className="flex justify-between items-center">
                <div>
                  Объедините похожие вопросы для создания общей статистики.
                  Выберите главный вопрос и добавьте к нему аналогичные вопросы
                  на другом языке.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white ml-4"
                  onClick={() => {
                    // Автоматическое обновление групп на основе более глубокого анализа
                    const autoGroups = autoGroupSimilarQuestions(
                      questions.map((q) => q.question),
                    );

                    if (Object.keys(autoGroups).length > 0) {
                      setGroups(autoGroups);

                      // Определяем оставшиеся вопросы
                      const groupedQuestions = new Set(
                        Object.values(autoGroups).flat(),
                      );
                      setRemainingQuestions(
                        questions
                          .map((q) => q.question)
                          .filter((q) => !groupedQuestions.has(q)),
                      );
                    }
                  }}
                >
                  Автоматическое объединение
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {/* Отображение существующих групп */}
            {Object.entries(groups).map(([mainQuestion, groupQuestions]) => (
              <QuestionGroup
                key={mainQuestion}
                mainQuestion={mainQuestion}
                questions={groupQuestions}
                isActive={activeGroup === mainQuestion}
                onActivate={() => setActiveGroup(mainQuestion)}
                onRemove={(question) =>
                  removeQuestionFromGroup(mainQuestion, question)
                }
              />
            ))}

            {/* Разделитель между группами и оставшимися вопросами */}
            {remainingQuestions.length > 0 &&
              Object.keys(groups).length > 0 && <Separator className="my-6" />}

            {/* Заголовок для оставшихся вопросов */}
            {remainingQuestions.length > 0 && (
              <div className="text-sm font-medium text-gray-500 mb-2">
                Оставшиеся вопросы:
              </div>
            )}

            {/* Отображение оставшихся вопросов */}
            <div className="space-y-2">
              {remainingQuestions.map((question) => (
                <Card key={question} className="p-2">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">{question}</div>
                    <div className="flex space-x-2">
                      {activeGroup && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addQuestionToGroup(question)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Добавить
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => createNewGroup(question)}
                      >
                        Создать группу
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              Для каждой группы вопросов укажите, какие из них на русском языке,
              а какие на казахском. Это поможет правильно структурировать отчет.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {Object.entries(groups).map(([mainQuestion, groupQuestions]) => (
              <Card key={mainQuestion} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-2">
                  <CardTitle className="text-lg font-medium">
                    {mainQuestion}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {groupQuestions
                    .filter((q) => q !== mainQuestion)
                    .map((question) => (
                      <div
                        key={question}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div>{question}</div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant={
                              question === mainQuestion ? "default" : "outline"
                            }
                            className="text-xs h-8"
                          >
                            Русский
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                          >
                            Казахский
                          </Button>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default QuestionCombiner;
