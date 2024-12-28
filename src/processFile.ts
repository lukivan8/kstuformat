import { read, utils, write } from "xlsx";

interface SurveyData {
  [key: string]: any;
}

interface QuestionSummary {
  [answer: string]: number;
}

interface ProcessedSummary {
  [question: string]: QuestionSummary;
}

interface AnswerRow {
  [key: string]: string | number;
  A: string; // Вопрос или ответ
  B: number | string; // Кол-во
  C: string; // Процент ответа
}

const normalizeQuestionText = (question: string): string => {
  return question.toLowerCase().replace(/\s+/g, " ").trim();
};

const standardizeAnswer = (answer: string): string => {
  return answer.trim().toUpperCase();
};

const findRelatedQuestions = (questions: string[]): Map<string, string[]> => {
  const questionGroups = new Map<string, string[]>();

  questions.forEach((question) => {
    if (
      question.toLowerCase().includes("timestamp") ||
      question.toLowerCase().includes("отметка времени")
    ) {
      return;
    }

    const normalizedQuestion = normalizeQuestionText(question);

    // Поиск или создание группы для этого вопроса
    let found = false;
    for (const [baseQuestion, group] of questionGroups.entries()) {
      if (
        normalizedQuestion.includes(normalizeQuestionText(baseQuestion)) ||
        normalizeQuestionText(baseQuestion).includes(normalizedQuestion) ||
        normalizedQuestion.replace(/[0-9.()]*/g, "") ===
          normalizeQuestionText(baseQuestion).replace(/[0-9.()]*/g, "")
      ) {
        group.push(question);
        found = true;
        break;
      }
    }

    if (!found) {
      questionGroups.set(question, [question]);
    }
  });

  return questionGroups;
};

const processFormData = async (
  file: File,
  setSuccess: (message: string) => void,
  setError: (message: string) => void
): Promise<void> => {
  try {
    // Получаем изначальное имя файла
    const originalFileName = file.name.replace(/\.[^/.]+$/, "");

    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, {
      type: "array",
      cellDates: true,
      cellFormula: true,
      cellStyles: true,
    });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json<SurveyData>(worksheet);

    if (jsonData.length === 0) {
      throw new Error("No data found in the worksheet");
    }

    const allQuestions = Object.keys(jsonData[0]);
    const questionGroups = findRelatedQuestions(allQuestions);

    // Все данные сводки собираются в этом объекте
    const summary: ProcessedSummary = {};
    questionGroups.forEach((group, baseQuestion) => {
      summary[baseQuestion] = {};
    });

    // Сама обработка ответов, подробно расписываю
    jsonData.forEach((row: SurveyData) => {
      // Для каждой группы связанных вопросов (например, вопросы с множественным выбором)
      questionGroups.forEach((relatedQuestions, baseQuestion) => {
        // Перебираем каждый связанный вопрос в группе
        relatedQuestions.forEach((question) => {
          // Получаем ответ, приводим к строке и убираем пробелы по краям
          // Если ответа нет, используем пустую строку
          const rawAnswer = (row[question]?.toString() || "").trim();

          if (rawAnswer) {
            // Разбиваем ответ на части по запятым или точкам с запятой (для вопросов с множественным выбором)
            // Приводим каждый ответ к стандартному виду (верхний регистр)
            // Удаляем пустые ответы
            const answers = rawAnswer
              .split(/[,;]/)
              .map((a: string) => standardizeAnswer(a))
              .filter((a: string) => a.length > 0);

            // Для каждого полученного ответа увеличиваем счётчик
            // Если ответ встречается впервые, начинаем с 1
            answers.forEach((answer: string) => {
              summary[baseQuestion][answer] =
                (summary[baseQuestion][answer] || 0) + 1;
            });
          }
        });
      });
    });

    const outputRows: AnswerRow[] = [];

    // Собираем обработанные данные по вопросам в XLSX документ
    questionGroups.forEach((relatedQuestions, baseQuestion) => {
      if (outputRows.length > 0) {
        outputRows.push({
          A: "",
          B: "",
          C: "",
        });
      }

      // Строка с вопросом
      outputRows.push({
        A: baseQuestion,
        B: "Кол-во",
        C: "Проценты",
      });

      const totalRespondents = jsonData.length;

      // Строки вариантов ответа
      Object.entries(summary[baseQuestion])
        .sort(([, a], [, b]) => b - a) // Сортируем по убыванию
        .forEach(([answer, count]) => {
          outputRows.push({
            A: answer,
            B: count,
            C: ((count / totalRespondents) * 100).toFixed(2) + "%",
          });
        });

      // Общее количество
      outputRows.push({
        A: "Всего записей:",
        B: totalRespondents,
        C: "",
      });
    });

    const newWorkbook = utils.book_new();
    const newSheet = utils.json_to_sheet(outputRows, {
      skipHeader: true,
    });

    newSheet["!cols"] = [
      { wch: 60 }, // Колонка с вопросом или ответом
      { wch: 10 }, // Колонка с кол-вом
      { wch: 12 }, // Колонка с процентом
    ];

    utils.book_append_sheet(newWorkbook, newSheet, "Survey Summary");

    // Генерируем и сохраняем файл
    const outFile = write(newWorkbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([outFile], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${originalFileName}_ANALYZED.xlsx`;
    link.click();
    URL.revokeObjectURL(url);

    setSuccess(
      `Файл успешно обработан! Сохранен как "${originalFileName}_ANALYZED.xlsx"`
    );
    setError("");
  } catch (err) {
    setError("Ошибка обработки файла: " + (err as Error).message);
    setSuccess("");
  }
};

export default processFormData;
