import React, { useState } from "react";
import { PreviewQuestion as PreviewQuestionType } from "@/processFile";
import {
  Plus,
  Save,
  Trash,
  Edit,
  Check,
  X,
  AlertCircle,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreviewQuestionProps {
  data: PreviewQuestionType;
  index: number;
  onQuestionUpdate: (index: number, updatedData: PreviewQuestionType) => void;
}

const PreviewQuestion: React.FC<PreviewQuestionProps> = ({
  data,
  index,
  onQuestionUpdate,
}) => {
  const [editingAnswerIndex, setEditingAnswerIndex] = useState<number | null>(
    null
  );
  const [editValue, setEditValue] = useState("");
  const [newAnswerValue, setNewAnswerValue] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [dismissedGroups, setDismissedGroups] = useState<string[]>([]);

  // Функция для создания уникального идентификатора группы
  const getGroupId = (group: typeof data.answers): string => {
    // Создаем идентификатор на основе количества ответов и отсортированных текстов ответов
    const count = group[0].count;
    const texts = group
      .map((a) => a.text)
      .sort()
      .join("|");
    return `${count}-${texts}`;
  };

  // Группировка ответов по количеству для выделения потенциальных проблемных ответов
  const answersByCount = data.answers.reduce((acc, answer) => {
    if (!acc[answer.count]) {
      acc[answer.count] = [];
    }
    acc[answer.count].push(answer);
    return acc;
  }, {} as Record<number, typeof data.answers>);

  // Определяем потенциально проблемные ответы и сортируем группы в соответствии с порядком в списке
  const allPotentialIssueGroups = Object.entries(answersByCount)
    .filter(([count, group]) => group.length > 1 && parseInt(count) > 0)
    .map(([count, group]) => ({
      count: parseInt(count),
      answers: group,
      id: getGroupId(group),
      // Находим минимальный индекс элемента группы в исходном массиве
      firstIndex: Math.min(
        ...group.map((a) =>
          data.answers.findIndex((ans) => ans.text === a.text)
        )
      ),
    }))
    // Сортируем группы по первому появлению варианта в исходном списке
    .sort((a, b) => a.firstIndex - b.firstIndex);

  // Фильтруем игнорируемые группы
  const potentialIssueGroups = allPotentialIssueGroups
    .filter((group) => !dismissedGroups.includes(group.id))
    .map((group) => group.answers);

  // Начать редактирование ответа
  const startEditing = (answerIndex: number) => {
    setEditingAnswerIndex(answerIndex);
    setEditValue(data.answers[answerIndex].text);
  };

  // Сохранение отредактированного ответа
  const saveEdit = () => {
    if (editingAnswerIndex === null) return;

    const updatedAnswers = [...data.answers];
    updatedAnswers[editingAnswerIndex] = {
      ...updatedAnswers[editingAnswerIndex],
      text: editValue,
    };

    onQuestionUpdate(index, {
      ...data,
      answers: updatedAnswers,
    });

    setEditingAnswerIndex(null);
    setEditValue("");
  };

  const deleteAnswer = (answerIndex: number) => {
    const updatedAnswers = data.answers.filter((_, i) => i !== answerIndex);
    onQuestionUpdate(index, {
      ...data,
      answers: updatedAnswers,
    });
  };

  // Интеллектуальное объединение ответов с сохранением порядка
  const mergeAnswers = (answerIndex1: number, answerIndex2: number) => {
    const answer1 = data.answers[answerIndex1];
    const answer2 = data.answers[answerIndex2];

    const needsComma =
      !answer1.text.trim().endsWith(",") &&
      !answer1.text.trim().endsWith(" ") &&
      !answer1.text.trim().endsWith(")") &&
      answer1.text.trim().length > 0;

    const mergedAnswer = {
      text: `${answer1.text}${needsComma ? ", " : " "}${answer2.text}`,
      count: answer1.count,
      percentage: answer1.percentage,
    };

    const updatedAnswers = data.answers.filter(
      (_, i) => i !== answerIndex1 && i !== answerIndex2
    );

    updatedAnswers.splice(
      Math.min(answerIndex1, answerIndex2),
      0,
      mergedAnswer
    );

    onQuestionUpdate(index, {
      ...data,
      answers: updatedAnswers,
    });
  };

  const mergeEntireGroup = (group: typeof data.answers) => {
    const sortedIndices = group
      .map((answer) => data.answers.findIndex((a) => a.text === answer.text))
      .sort((a, b) => a - b);

    if (sortedIndices.length < 2) return;

    let baseAnswer = { ...data.answers[sortedIndices[0]] };
    let baseIndex = sortedIndices[0];

    const indicesToRemove = sortedIndices.slice(1);

    for (const idx of indicesToRemove) {
      const nextAnswer = data.answers[idx];

      const needsComma =
        !baseAnswer.text.trim().endsWith(",") &&
        !baseAnswer.text.trim().endsWith(" ") &&
        !baseAnswer.text.trim().endsWith(")") &&
        baseAnswer.text.trim().length > 0;

      baseAnswer.text = `${baseAnswer.text}${needsComma ? ", " : " "}${
        nextAnswer.text
      }`;
    }

    const updatedAnswers = data.answers.filter(
      (_, i) => !sortedIndices.includes(i)
    );

    updatedAnswers.splice(baseIndex, 0, baseAnswer);

    onQuestionUpdate(index, {
      ...data,
      answers: updatedAnswers,
    });
  };

  // Добавление нового ответа
  const addNewAnswer = () => {
    if (!newAnswerValue.trim()) return;

    const updatedAnswers = [
      ...data.answers,
      {
        text: newAnswerValue,
        count: 0,
        percentage: "0.00%",
      },
    ];

    onQuestionUpdate(index, {
      ...data,
      answers: updatedAnswers,
    });

    setNewAnswerValue("");
    setIsAddingNew(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          <p>{data.question}</p>
          <Badge className="bg-blue-100 text-blue-800">
            {data.answers.length} вариантов
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {potentialIssueGroups.length > 0 && (
          <div className="mb-4 p-3 pt-1 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
            <AlertCircle className="text-yellow-500 mr-2 h-5 w-5 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-medium">
                Обнаружены потенциальные проблемы с ответами
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Найдены ответы с одинаковым количеством (
                {potentialIssueGroups
                  .flat()
                  .map((a) => a.count)
                  .join(", ")}
                ), которые могли быть разделены из-за запятых. Проверьте и
                объедините их при необходимости.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="ml-2 text-yellow-700 bg-white hover:bg-yellow-100"
              onClick={() => {
                // Игнорируем все группы
                const allIds = allPotentialIssueGroups.map((group) => group.id);
                setDismissedGroups(allIds);
              }}
            >
              Игнорировать все
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {data.answers.map((answer, answerIndex) => (
            <div
              key={answerIndex}
              className={`flex items-center p-2 rounded-md ${
                potentialIssueGroups.flat().some((a) => a.text === answer.text)
                  ? "bg-yellow-50 border border-yellow-200"
                  : "hover:bg-gray-50"
              }`}
            >
              {editingAnswerIndex === answerIndex ? (
                <div className="flex-1 flex space-x-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="sm" variant="outline" onClick={saveEdit}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingAnswerIndex(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">{answer.text}</div>
                  <div className="px-2 text-right w-20">{answer.count}</div>
                  <div className="px-2 text-right w-20">
                    {answer.percentage}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(answerIndex)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAnswer(answerIndex)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Интерфейс для объединения ответов */}
        {potentialIssueGroups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-md"
          >
            <p className="text-sm font-medium text-blue-800 mb-2">
              Предлагаемое объединение для ответов с {group[0].count} ответами:
            </p>
            <div className="space-y-2">
              {group.map((answer, i) => (
                <div key={i} className="text-sm">
                  {answer.text}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white"
                onClick={() => {
                  const indices = group
                    .map((a) =>
                      data.answers.findIndex((ans) => ans.text === a.text)
                    )
                    .sort((a, b) => a - b);

                  if (indices.length >= 2) {
                    mergeAnswers(indices[0], indices[1]);
                  }
                }}
              >
                Объединить первые 2 ответа
              </Button>

              {group.length > 2 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white"
                  onClick={() => mergeEntireGroup(group)}
                >
                  Объединить все ответы
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="text-gray-500"
                onClick={() => {
                  const groupId = getGroupId(group);
                  setDismissedGroups([...dismissedGroups, groupId]);
                }}
              >
                Игнорировать
              </Button>
            </div>
          </div>
        ))}

        {/* Добавление нового ответа */}
        {isAddingNew ? (
          <div className="mt-4 flex space-x-2">
            <Input
              value={newAnswerValue}
              onChange={(e) => setNewAnswerValue(e.target.value)}
              placeholder="Введите новый вариант ответа"
              className="flex-1"
            />
            <Button variant="outline" onClick={addNewAnswer}>
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingNew(false);
                setNewAnswerValue("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsAddingNew(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить новый вариант
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PreviewQuestion;
