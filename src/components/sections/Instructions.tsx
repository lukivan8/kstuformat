const Instructions = () => (
  <div className="bg-blue-50 p-4 rounded-lg">
    <h3 className="font-semibold text-blue-900 mb-2">Как это работает:</h3>
    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
      <li>Экспортируйте ответы из Google Forms в файл Excel</li>
      <li>Перетащите файл сюда или нажмите для загрузки</li>
      <li>Получите обработанную сводку с распределением ответов</li>
      <li>
        Поддерживаются вопросы с множественным выбором, без учета регистра
      </li>
    </ol>
  </div>
);

export default Instructions;
