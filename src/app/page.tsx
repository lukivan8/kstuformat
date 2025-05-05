"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";
import { processFormDataPreview, PreviewData } from "@/processFile";
import Header from "@/components/sections/Header";
import Instructions from "@/components/sections/Instructions";
import FileUploadArea from "@/components/sections/FileUploadArea";
import StatusMessages from "@/components/sections/StatusMessages";
import Footer from "@/components/sections/Footer";
import Counter from "@/components/sections/Counter";
import SurveyPreview from "@/components/preview/SurveyPreview";
import { useCounter } from "@/hooks/useCounter";

const SurveyProcessor = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const { increment, count } = useCounter();

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setError("");
    setSuccess("");

    try {
      const preview = await processFormDataPreview(file);
      setPreviewData(preview);
    } catch (err) {
      setError(
        "Произошла непредвиденная ошибка при обработке файла: " +
          (err as Error).message
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreviewComplete = (message: string) => {
    setPreviewData(null);
    setSuccess(message);
    increment();
  };

  const handleBack = () => {
    setPreviewData(null);
  };

  // Обновленное описание приложения с упоминанием новой функциональности
  const getAppDescription = () => {
    return "Загрузите файл Excel с ответами из Google Forms для создания сводного отчета с распределением ответов, процентами и объединением вопросов на разных языках.";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Header
          title="Анализатор Опросов"
          subtitle="Преобразуйте ответы из Google Forms в удобный формат"
        />

        {previewData ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6" />
                {/* Обновленный заголовок */}
                Обработка данных опроса
              </CardTitle>
              <CardDescription>
                Объедините похожие вопросы, исправьте автоматически определенные
                варианты и добавьте отсутствующие перед получением
                отформатированного файла.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SurveyPreview
                previewData={previewData}
                onBack={handleBack}
                onComplete={handlePreviewComplete}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6" />
                Загрузите Данные Опроса
              </CardTitle>
              <CardDescription>{getAppDescription()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Обновленные инструкции с упоминанием новой функциональности */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Как это работает:
                </h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Экспортируйте ответы из Google Forms в файл Excel</li>
                  <li>Перетащите файл сюда или нажмите для загрузки</li>
                  <li>
                    Объедините вопросы на разных языках (при необходимости)
                  </li>
                  <li>Отредактируйте и проверьте ответы</li>
                  <li>Получите обработанную сводку с распределением ответов</li>
                  <li>Система поддерживает вопросы с множественным выбором</li>
                </ol>
              </div>
              <FileUploadArea
                isDragging={isDragging}
                isProcessing={isProcessing}
                setIsDragging={setIsDragging}
                onFileSelect={handleFile}
              />
              <StatusMessages error={error} success={success} />
            </CardContent>
          </Card>
        )}

        <Counter count={count} />
        <Footer />
      </div>
    </div>
  );
};

export default SurveyProcessor;
