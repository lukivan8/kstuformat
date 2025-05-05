// Итоговый код CombineQuestionsModal.tsx с объяснениями улучшений

/*
Основные изменения:

1. Компактный первый шаг - после выбора вопроса первый шаг сворачивается до компактного вида

2. Скрытие уже использованных вариантов ответов:
   - Когда вариант из второго вопроса уже сопоставлен с каким-то вариантом первого,
     он больше не показывается в списке для выбора

3. Добавление новых вариантов ответа:
   - Если вариантов не хватает, можно добавить новый вариант ответа прямо на месте
   - Новый вариант будет добавлен к целевому вопросу при объединении

4. Визуальные улучшения:
   - Компактный вид выбранного вопроса
   - Выделение состояния, когда нет оставшихся вариантов для сопоставления
   - Более наглядное отображение связей между ответами
*/

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Link, X, Plus, AlertCircle } from "lucide-react";
import { PreviewQuestion } from "@/processFile";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CombineQuestionsModalProps {
  open: boolean;
  onClose: () => void;
  questions: PreviewQuestion[];
  sourceQuestionIndex: number;
  onCombine: (
    sourceIndex: number,
    targetIndex: number,
    answerMappings: Record<string, string>,
    newAnswers?: Array<{ sourceText: string; targetText: string }>
  ) => void;
}

const CombineQuestionsModal: React.FC<CombineQuestionsModalProps> = ({
  open,
  onClose,
  questions,
  sourceQuestionIndex,
  onCombine,
}) => {
  // Выбранный целевой вопрос
  const [targetQuestionIndex, setTargetQuestionIndex] = useState<number | null>(
    null
  );

  // Соответствие ответов (ключ - ответ из исходного вопроса, значение - ответ из целевого вопроса)
  const [answerMappings, setAnswerMappings] = useState<Record<string, string>>(
    {}
  );

  // Состояние для добавления нового варианта ответа
  const [newAnswerText, setNewAnswerText] = useState("");
  const [isAddingNewFor, setIsAddingNewFor] = useState<string | null>(null);

  // Сбрасываем состояние при открытии модального окна
  useEffect(() => {
    if (open) {
      setTargetQuestionIndex(null);
      setAnswerMappings({});
      setNewAnswerText("");
      setIsAddingNewFor(null);
    }
  }, [open]);

  // Исходный вопрос
  const sourceQuestion = questions[sourceQuestionIndex];

  // Целевой вопрос
  const targetQuestion =
    targetQuestionIndex !== null ? questions[targetQuestionIndex] : null;

  // Обработчик изменения сопоставления ответов
  const handleAnswerMappingChange = (
    sourceAnswer: string,
    targetAnswer: string
  ) => {
    setAnswerMappings((prev) => ({
      ...prev,
      [sourceAnswer]: targetAnswer,
    }));
  };

  const availableQuestions = questions
    .map((question, index) => ({ question, index }))
    .filter(
      ({ index, question }) =>
        // Исключаем исходный вопрос
        index !== sourceQuestionIndex &&
        // Исключаем уже объединенные вопросы
        (!sourceQuestion.combinedWith ||
          !sourceQuestion.combinedWith.some(
            (combined) => combined.questionIndex === index
          )) &&
        // Исключаем вопросы, которые уже объединены с другими
        (!question.combinedWith || question.combinedWith.length === 0)
    );

  // Отображаем сообщение, если нет доступных вопросов

  // Функция для автоматического сопоставления ответов
  const autoMapAnswers = () => {
    if (!targetQuestion) return;

    const mappings: Record<string, string> = {};

    // Сопоставляем ответы, которые полностью совпадают
    sourceQuestion.answers.forEach((sourceAnswer) => {
      const sourceText = sourceAnswer.text.toLowerCase().trim();

      // Ищем точное совпадение
      const exactMatch = targetQuestion.answers.find(
        (targetAnswer) => targetAnswer.text.toLowerCase().trim() === sourceText
      );

      if (exactMatch) {
        mappings[sourceAnswer.text] = exactMatch.text;
        return;
      }

      // Ищем частичное совпадение (если один ответ содержит другой)
      const partialMatches = targetQuestion.answers.filter((targetAnswer) => {
        const targetText = targetAnswer.text.toLowerCase().trim();
        return (
          sourceText.includes(targetText) || targetText.includes(sourceText)
        );
      });

      if (partialMatches.length === 1) {
        mappings[sourceAnswer.text] = partialMatches[0].text;
      }
    });

    setAnswerMappings(mappings);
  };

  // Функция для подготовки данных перед объединением
  const handleCombineCompleted = () => {
    if (targetQuestionIndex === null || targetQuestion === null) return;

    // Список новых вариантов ответов для добавления в целевой вопрос
    const newAnswers = Object.entries(answerMappings)
      .filter(
        ([_, targetText]) =>
          // Выбираем только те сопоставления, где целевой ответ не существует в целевом вопросе
          targetText &&
          !targetQuestion.answers.some((a) => a.text === targetText)
      )
      .map(([sourceText, targetText]) => ({
        sourceText,
        targetText,
      }));

    // Передаем данные об объединении вместе с новыми вариантами ответов
    onCombine(
      sourceQuestionIndex,
      targetQuestionIndex,
      answerMappings,
      newAnswers
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <ScrollArea className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Объединение вопросов</DialogTitle>
            <DialogDescription>
              Выберите вопрос для объединения и сопоставьте варианты ответов
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex-1 overflow-hidden flex flex-col">
            <div
              className={`${targetQuestionIndex !== null ? "mb-3" : "mb-6"}`}
            >
              <h3 className="text-lg font-medium mb-2">
                Шаг 1: Выберите вопрос для объединения
              </h3>

              {/* Исходный вопрос */}
              <div className="p-4 bg-blue-50 rounded-md mb-3">
                <p className="font-medium text-blue-800 mb-1">
                  Исходный вопрос:
                </p>
                <p className="text-blue-900">{sourceQuestion.question}</p>
                <div className="mt-2 text-sm text-blue-700">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 mr-2">
                    {sourceQuestion.answers.length} вариантов
                  </span>
                  {sourceQuestion.language && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      {sourceQuestion.language === "russian"
                        ? "Русский"
                        : sourceQuestion.language === "kazakh"
                        ? "Казахский"
                        : "Язык не определен"}
                    </span>
                  )}
                </div>
              </div>

              {/* Если целевой вопрос уже выбран - показываем компактный вид */}
              {targetQuestionIndex !== null ? (
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
                  <div className="flex-1">
                    <div className="text-sm text-blue-800">
                      Выбранный вопрос:
                    </div>
                    <div className="font-medium text-blue-900">
                      {questions[targetQuestionIndex].question}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTargetQuestionIndex(null)}
                    className="shrink-0"
                  >
                    Изменить выбор
                  </Button>
                </div>
              ) : (
                /* Список вопросов для выбора */
                <div className="mb-4">
                  <ScrollArea className="h-64 border rounded-md">
                    <div className="p-2 space-y-2">
                      {/* Сначала выводим вопросы с таким же количеством вариантов ответа */}
                      {availableQuestions.length === 0 && (
                        <div className="p-4 text-center">
                          <div className="text-amber-500 mb-2">
                            <AlertCircle className="h-8 w-8 mx-auto" />
                          </div>
                          <h4 className="text-lg font-medium mb-2">
                            Нет доступных вопросов для объединения
                          </h4>
                          <p className="text-gray-500 text-sm mb-4">
                            Все вопросы уже объединены или недоступны для
                            объединения.
                          </p>
                          <Button variant="outline" onClick={onClose}>
                            Закрыть
                          </Button>
                        </div>
                      )}
                      {questions
                        .map((question, index) => ({ question, index }))
                        .filter(
                          ({ index, question }) =>
                            // Исключаем исходный вопрос
                            index !== sourceQuestionIndex &&
                            // Исключаем уже объединенные вопросы
                            (!sourceQuestion.combinedWith ||
                              !sourceQuestion.combinedWith.some(
                                (combined) => combined.questionIndex === index
                              )) &&
                            // Исключаем вопросы, которые уже объединены с другими
                            (!question.combinedWith ||
                              question.combinedWith.length === 0)
                        )
                        .sort((a, b) => {
                          // Сортировка: сначала с таким же количеством ответов
                          const sourceAnswersCount =
                            sourceQuestion.answers.length;
                          const aMatchesCount =
                            a.question.answers.length === sourceAnswersCount;
                          const bMatchesCount =
                            b.question.answers.length === sourceAnswersCount;

                          if (aMatchesCount && !bMatchesCount) return -1;
                          if (!aMatchesCount && bMatchesCount) return 1;
                          return 0;
                        })
                        .map(({ question, index }) => (
                          <Button
                            key={index}
                            variant={
                              targetQuestionIndex === index
                                ? "default"
                                : "outline"
                            }
                            className="w-full justify-start font-normal text-left h-auto py-3 px-4"
                            onClick={() => {
                              setTargetQuestionIndex(index);
                              setAnswerMappings({}); // Сбрасываем сопоставления при смене вопроса
                            }}
                          >
                            <div className="flex flex-col items-start">
                              <div className="line-clamp-2">
                                {question.question}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {question.answers.length} вариантов
                                {question.answers.length ===
                                  sourceQuestion.answers.length &&
                                  " (совпадает с исходным)"}
                              </div>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            {targetQuestionIndex !== null && targetQuestion !== null && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex flex-wrap justify-between items-center mb-4 border-t pt-4">
                  <h3 className="text-lg font-medium">
                    Шаг 2: Сопоставьте варианты ответов
                  </h3>
                  <div className="flex gap-2 items-center">
                    <div className="text-sm text-gray-500 mr-1">
                      {Object.keys(answerMappings).length} из{" "}
                      {sourceQuestion.answers.length} сопоставлено
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={autoMapAnswers}
                      className="flex items-center"
                    >
                      <Link className="h-4 w-4 mr-1" />
                      Автосопоставление
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-md mb-4">
                  <p className="text-sm text-blue-800">
                    Выбранный вопрос:{" "}
                    <span className="font-medium">
                      {targetQuestion.question}
                    </span>
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 mr-2">
                      {targetQuestion.answers.length} вариантов
                    </span>
                    {targetQuestion.language && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        {targetQuestion.language === "russian"
                          ? "Русский"
                          : targetQuestion.language === "kazakh"
                          ? "Казахский"
                          : "Язык не определен"}
                      </span>
                    )}
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-4 px-1 py-2">
                    {sourceQuestion.answers.map((sourceAnswer, index) => {
                      // Найдем сопоставленный ответ, если он есть
                      const mappedAnswerText =
                        answerMappings[sourceAnswer.text];
                      const mappedAnswer = targetQuestion.answers.find(
                        (a) => a.text === mappedAnswerText
                      );

                      // Получаем список всех использованных ответов
                      const usedAnswerTexts =
                        Object.values(answerMappings).filter(Boolean);

                      // Проверяем, добавляется ли новый вариант для этого ответа
                      const isAddingNewForThis =
                        isAddingNewFor === sourceAnswer.text;

                      return (
                        <div key={index} className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 p-3 bg-gray-50 rounded-md border">
                              <div className="font-medium">
                                {sourceAnswer.text}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                {sourceAnswer.count} ответов (
                                {sourceAnswer.percentage})
                              </div>
                            </div>

                            <div className="text-gray-400 flex flex-col items-center">
                              <Link className="h-4 w-4" />
                              <div className="text-xs mt-1">объединить с</div>
                            </div>
                          </div>

                          {/* Отображаем кнопку добавления сопоставления, если оно еще не выбрано */}
                          {!mappedAnswerText ? (
                            <div className="ml-6">
                              {isAddingNewForThis ? (
                                <div className="mb-2">
                                  <div className="flex gap-2 mb-2">
                                    <Input
                                      value={newAnswerText}
                                      onChange={(e) =>
                                        setNewAnswerText(e.target.value)
                                      }
                                      placeholder="Введите новый вариант ответа"
                                      className="flex-1"
                                      autoFocus
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (newAnswerText.trim()) {
                                          // Добавляем новый вариант и сопоставляем с ним текущий ответ
                                          handleAnswerMappingChange(
                                            sourceAnswer.text,
                                            newAnswerText
                                          );
                                          setNewAnswerText("");
                                          setIsAddingNewFor(null);
                                        }
                                      }}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setNewAnswerText("");
                                        setIsAddingNewFor(null);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Новый вариант будет добавлен к целевому
                                    вопросу
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  {/* Фильтруем уже использованные варианты */}
                                  {targetQuestion.answers
                                    .filter(
                                      (targetAnswer) =>
                                        !usedAnswerTexts.includes(
                                          targetAnswer.text
                                        )
                                    )
                                    .map((targetAnswer, idx) => (
                                      <Button
                                        key={idx}
                                        variant="outline"
                                        size="sm"
                                        className="justify-start h-auto py-2 px-3 text-left"
                                        onClick={() =>
                                          handleAnswerMappingChange(
                                            sourceAnswer.text,
                                            targetAnswer.text
                                          )
                                        }
                                      >
                                        <div className="w-full">
                                          <div className="line-clamp-2 text-sm">
                                            {targetAnswer.text}
                                          </div>
                                          <div className="text-gray-500 text-xs mt-1">
                                            {targetAnswer.count} ответов (
                                            {targetAnswer.percentage})
                                          </div>
                                        </div>
                                      </Button>
                                    ))}

                                  {/* Показываем сообщение, если не осталось вариантов */}
                                  {targetQuestion.answers.filter(
                                    (a) => !usedAnswerTexts.includes(a.text)
                                  ).length === 0 && (
                                    <div className="col-span-2 text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                      Все варианты ответов уже использованы.
                                      Добавьте новый вариант или отмените одно
                                      из сопоставлений.
                                    </div>
                                  )}

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start text-gray-500"
                                    onClick={() =>
                                      handleAnswerMappingChange(
                                        sourceAnswer.text,
                                        ""
                                      )
                                    }
                                  >
                                    Не объединять
                                  </Button>

                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="justify-start text-white"
                                    onClick={() =>
                                      setIsAddingNewFor(sourceAnswer.text)
                                    }
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Добавить новый вариант
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="ml-6 flex items-center gap-2">
                              <div className="flex-1 p-3 bg-blue-50 rounded-md border border-blue-100">
                                <div className="font-medium">
                                  {mappedAnswerText}
                                </div>
                                {mappedAnswer && (
                                  <div className="text-blue-700 text-xs mt-1">
                                    {mappedAnswer.count} ответов (
                                    {mappedAnswer.percentage})
                                  </div>
                                )}
                                {!mappedAnswer && (
                                  <div className="text-blue-700 text-xs mt-1">
                                    Новый вариант ответа
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                onClick={() => {
                                  const newMappings = { ...answerMappings };
                                  delete newMappings[sourceAnswer.text];
                                  setAnswerMappings(newMappings);
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Отменить
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="w-full flex justify-between">
              <Button
                variant="outline"
                size="lg"
                onClick={onClose}
                className="px-6"
              >
                Отмена
              </Button>
              <Button
                variant="default"
                size="lg"
                disabled={
                  targetQuestionIndex === null ||
                  Object.keys(answerMappings).length === 0
                }
                onClick={handleCombineCompleted}
                className="px-6"
              >
                <Check className="h-4 w-4 mr-2" />
                Объединить вопросы
              </Button>
            </div>
          </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CombineQuestionsModal;
