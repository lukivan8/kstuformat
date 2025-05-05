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

export interface PreviewAnswer {
  text: string;
  count: number;
  percentage: string;
}

export interface PreviewQuestion {
  question: string;
  answers: PreviewAnswer[];
  totalRespondents: number;
  language?: "russian" | "kazakh" | "unknown";
  combinedWith?: {
    questionIndex: number;
    questionText: string;
  }[];
}

export type Language = "russian" | "kazakh" | "unknown";

export type QuestionWithLanguage = PreviewQuestion & {
  language?: Language;
  originalAnswers?: PreviewAnswer[];
  combinedWith?: { questionIndex: number; questionText: string }[];
};

export interface PreviewData {
  questions: PreviewQuestion[];
  originalFileName: string;
  rawData: {
    summary: ProcessedSummary;
    totalRespondents: number;
    relatedQuestions: Map<string, string[]>;
  };
}

const normalizeQuestionText = (question: string): string => {
  return question.toLowerCase().replace(/\s+/g, " ").trim();
};

const standardizeAnswer = (answer: string): string => {
  return answer.trim().toUpperCase();
};

const excelToTSV = (workbook: any): string => {
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Используем опцию FS: "\t" для создания TSV вместо CSV
  return utils.sheet_to_csv(worksheet, { FS: "\t" });
};

// Функция для парсинга TSV данных в структурированные данные
const parseTSVData = (tsvData: string): SurveyData[] => {
  const rows = tsvData.split(/\r?\n/).filter((row) => row.trim() !== "");

  if (rows.length === 0) {
    throw new Error("Файл не содержит данных");
  }

  const headers = rows[0].split("\t");

  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const rowData: SurveyData = {};
    const columns = rows[i].split("\t");

    for (let j = 0; j < headers.length; j++) {
      if (headers[j].trim() !== "") {
        rowData[headers[j]] = columns[j] || "";
      }
    }

    data.push(rowData);
  }

  return data;
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

    if (!question || question.trim() === "") {
      return;
    }

    const normalizedQuestion = normalizeQuestionText(question);

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

export const processFormDataPreview = async (
  file: File
): Promise<PreviewData> => {
  const originalFileName = file.name.replace(/\.[^/.]+$/, "");

  const buffer = await file.arrayBuffer();

  const workbook = read(buffer, {
    type: "array",
    cellDates: true,
    cellFormula: true,
    cellStyles: true,
    cellNF: true,
    cellText: true,
    codepage: 65001, // Указываем UTF-8 кодировку
  });

  // Преобразуем Excel в TSV для лучшей обработки многоязычного контента
  const tsvData = excelToTSV(workbook);

  const jsonData = parseTSVData(tsvData);

  if (jsonData.length === 0) {
    throw new Error("Данные в файле не найдены");
  }

  console.log("Parsed headers:", Object.keys(jsonData[0]));

  const allQuestions = Object.keys(jsonData[0]);
  const questionGroups = findRelatedQuestions(allQuestions);

  const summary: ProcessedSummary = {};
  questionGroups.forEach((group, baseQuestion) => {
    summary[baseQuestion] = {};
  });

  jsonData.forEach((row: SurveyData) => {
    // Для каждой группы связанных вопросов (например, вопросы с множественным выбором)
    questionGroups.forEach((relatedQuestions, baseQuestion) => {
      // Перебираем каждый связанный вопрос в группе
      relatedQuestions.forEach((question) => {
        // Получаем ответ, приводим к строке и убираем пробелы по краям
        // Если ответа нет, используем пустую строку
        if (row[question] === undefined) {
          console.warn(`Missing answer for question: ${question}`);
          return;
        }

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

  const totalRespondents = jsonData.length;
  const questions: PreviewQuestion[] = [];

  questionGroups.forEach((relatedQuestions, baseQuestion) => {
    const answersArray = Object.entries(summary[baseQuestion])
      .sort(([, a], [, b]) => b - a)
      .map(([answer, count]) => ({
        text: answer,
        count,
        percentage: ((count / totalRespondents) * 100).toFixed(2) + "%",
      }));

    questions.push({
      question: baseQuestion,
      answers: answersArray,
      totalRespondents,
    });
  });

  return {
    questions,
    originalFileName,
    rawData: {
      summary,
      totalRespondents,
      relatedQuestions: questionGroups,
    },
  };
};

export const detectLanguage = (
  text: string
): "russian" | "kazakh" | "unknown" => {
  // Проверка на казахские специфические символы
  if (/[әіңғүұқөһ]/i.test(text)) {
    return "kazakh";
  }
  // Проверка на русский язык (кириллица без казахских символов)
  else if (/[а-яА-Я]/.test(text)) {
    return "russian";
  }
  return "unknown";
};

export const generateExcelFromCorrectedData = (
  correctedData: PreviewQuestion[],
  originalFileName: string
): void => {
  const outputRows: AnswerRow[] = [];

  // Отфильтруем вопросы - берем только вопросы указанного языка или все, если язык не указан
  // Для общего отчета (ALL) берем все вопросы
  let dataToProcess = [...correctedData];

  // Сначала сгруппируем вопросы по языку для отчетов
  if (originalFileName.endsWith("_RU")) {
    dataToProcess = dataToProcess.filter((q) => q.language === "russian");
  } else if (originalFileName.endsWith("_KZ")) {
    dataToProcess = dataToProcess.filter((q) => q.language === "kazakh");
  }

  dataToProcess.forEach((questionData, index) => {
    if (index > 0) {
      outputRows.push({
        A: "",
        B: "",
        C: "",
      });
    }

    // Строка с вопросом и языком (если определен)
    const languageLabels = {
      russian: "[RU]",
      kazakh: "[KZ]",
      unknown: "",
    };

    const languagePrefix = questionData.language
      ? languageLabels[questionData.language] + " "
      : "";

    // Добавляем индикатор объединения
    const combinedSuffix =
      questionData.combinedWith && questionData.combinedWith.length > 0
        ? ` [Объединен с ${questionData.combinedWith.length} вопр.]`
        : "";

    outputRows.push({
      A: languagePrefix + questionData.question + combinedSuffix,
      B: "Кол-во",
      C: "Проценты",
    });

    // Строки вариантов ответа - сортируем по количеству ответов
    const sortedAnswers = [...questionData.answers].sort(
      (a, b) => b.count - a.count
    );

    sortedAnswers.forEach((answer) => {
      outputRows.push({
        A: answer.text,
        B: answer.count,
        C: answer.percentage,
      });
    });

    // Общее количество
    outputRows.push({
      A: "Всего записей:",
      B: questionData.totalRespondents,
      C: "",
    });
  });

  const newWorkbook = utils.book_new();
  const newSheet = utils.json_to_sheet(outputRows, {
    skipHeader: true,
  });

  // Устанавливаем ширину столбцов
  newSheet["!cols"] = [
    { wch: 60 }, // Колонка с вопросом или ответом
    { wch: 10 }, // Колонка с кол-вом
    { wch: 12 }, // Колонка с процентом
  ];

  utils.book_append_sheet(newWorkbook, newSheet, "Survey Summary");

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
  link.download = `${originalFileName}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};

const processFormData = async (
  file: File,
  setSuccess: (message: string) => void,
  setError: (message: string) => void
): Promise<void> => {
  try {
    const previewData = await processFormDataPreview(file);
    generateExcelFromCorrectedData(
      previewData.questions,
      previewData.originalFileName
    );

    setSuccess(
      `Файл успешно обработан! Сохранен как "${previewData.originalFileName}_ANALYZED.xlsx"`
    );
    setError("");
  } catch (err) {
    console.error("Error processing file:", err);
    setError("Ошибка обработки файла: " + (err as Error).message);
    setSuccess("");
  }
};

export default processFormData;
