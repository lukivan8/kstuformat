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
import processFormData from "@/processFile";
import Header from "@/components/sections/Header";
import Instructions from "@/components/sections/Instructions";
import FileUploadArea from "@/components/sections/FileUploadArea";
import StatusMessages from "@/components/sections/StatusMessages";
import Footer from "@/components/sections/Footer";
import Counter from "@/components/sections/Counter";
import { useCounter } from "@/hooks/useCounter";

const SurveyProcessor = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { increment, count } = useCounter();

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setError("");
    setSuccess("");
    try {
      await processFormData(file, setSuccess, setError);
      increment();
    } catch (err) {
      setError("Произошла непредвиденная ошибка при обработке файла.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Header
          title="Анализатор Опросов"
          subtitle="Преобразуйте ответы из Google Forms в удобный формат"
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6" />
              Загрузите Данные Опроса
            </CardTitle>
            <CardDescription>
              Загрузите файл Excel с ответами из Google Forms для создания
              сводного отчета с распределением ответов и процентами.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Instructions />
            <FileUploadArea
              isDragging={isDragging}
              isProcessing={isProcessing}
              setIsDragging={setIsDragging}
              onFileSelect={handleFile}
            />
            <StatusMessages error={error} success={success} />
          </CardContent>
        </Card>
        <Counter count={count} />
        <Footer />
      </div>
    </div>
  );
};

export default SurveyProcessor;
