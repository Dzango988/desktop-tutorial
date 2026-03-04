const runBtn = document.getElementById('runBtn');
const statusNode = document.getElementById('status');
const lastRunNode = document.getElementById('lastRun');
const historyNode = document.getElementById('history');
const logTailNode = document.getElementById('logTail');
const latestReportLinkNode = document.getElementById('latestReportLink');

function formatRun(run) {
  if (!run) {
    return 'Нет данных';
  }

  const stats = run.stats
    ? `
Всего: ${run.stats.expected + run.stats.unexpected}
Успешно: ${run.stats.expected}
Падений: ${run.stats.unexpected}
Время: ${run.stats.duration}ms`
    : '\nСтатистика недоступна';

  const failed = (run.tests || []).filter((t) => t.status !== 'passed');
  let failedText = '';
  if (run.status === 'failed' && (!run.tests || run.tests.length === 0)) {
    failedText = '\nЗапуск завершился с ошибкой, но тестовый отчет не был сформирован. Проверьте лог ниже (возможны проблемы окружения: браузеры Playwright не установлены, сеть, права, и т.д.).';
  } else if (failed.length) {
    failedText = `\nУпавшие тесты:\n${failed.map((t) => `- ${t.title}: ${t.error || t.status}`).join('\n')}`;
  } else {
    failedText = '\nВсе тесты прошли.';
  }

  return `ID: ${run.id}
Статус: ${run.status}
Код процесса: ${run.code}
Старт: ${run.startedAt}
Финиш: ${run.finishedAt}${stats}${failedText}`;
}

async function loadRuns() {
  const response = await fetch('/api/runs');
  const data = await response.json();

  if (data.activeRun) {
    statusNode.textContent = 'Состояние: тесты выполняются...';
    runBtn.disabled = true;
  } else {
    statusNode.textContent = 'Состояние: ожидание';
    runBtn.disabled = false;
  }

  const [latest] = data.history;
  lastRunNode.textContent = formatRun(latest);
  logTailNode.textContent = latest?.logTail || 'Нет данных';

  if (data.latestReportUrl) {
    latestReportLinkNode.href = data.latestReportUrl;
    latestReportLinkNode.style.display = 'inline-flex';
  } else {
    latestReportLinkNode.style.display = 'none';
  }

  historyNode.innerHTML = '';
  data.history.forEach((run) => {
    const li = document.createElement('li');
    const text = document.createElement('span');
    text.textContent = `${run.startedAt} — ${run.status} (code ${run.code})`;
    li.appendChild(text);

    if (run.reportUrl) {
      const reportLink = document.createElement('a');
      reportLink.href = run.reportUrl;
      reportLink.target = '_blank';
      reportLink.rel = 'noreferrer';
      reportLink.textContent = ' открыть отчёт';
      li.appendChild(reportLink);
    }

    historyNode.appendChild(li);
  });
}

runBtn.addEventListener('click', async () => {
  runBtn.disabled = true;
  statusNode.textContent = 'Состояние: запуск...';
  await fetch('/api/run', { method: 'POST' });
  setTimeout(loadRuns, 1000);
});

setInterval(loadRuns, 3000);
loadRuns().catch((error) => {
  statusNode.textContent = `Ошибка загрузки: ${error.message}`;
});
