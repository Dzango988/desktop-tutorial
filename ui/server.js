const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { randomUUID } = require('crypto');

const HOST = '0.0.0.0';
const PORT = process.env.UI_PORT || 3000;
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'runs-history.json');
const REPORT_DIR = path.join(ROOT, 'playwright-report');

let activeRun = null;

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, '[]', 'utf8');
  }
}

function readHistory() {
  ensureDataDir();
  return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
}

function writeHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
}


function hasHtmlReport() {
  return fs.existsSync(path.join(REPORT_DIR, 'index.html'));
}

function parseJsonReport(reportPath) {
  if (!fs.existsSync(reportPath)) {
    return { stats: null, tests: [] };
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const tests = [];

  function walkSuite(suite, titlePath = []) {
    const nextPath = suite.title ? [...titlePath, suite.title] : titlePath;

    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests || []) {
          const lastResult = (test.results || [])[test.results.length - 1] || {};
          tests.push({
            title: [...nextPath, spec.title].filter(Boolean).join(' > '),
            status: lastResult.status || test.status || 'unknown',
            durationMs: lastResult.duration || 0,
            error: lastResult.error?.message || null
          });
        }
      }
    }

    for (const child of suite.suites || []) {
      walkSuite(child, nextPath);
    }
  }

  for (const suite of report.suites || []) {
    walkSuite(suite);
  }

  return {
    stats: report.stats || null,
    tests
  };
}

function runTests() {
  if (activeRun) {
    return Promise.reject(new Error('Test run already in progress'));
  }

  ensureDataDir();
  const runId = randomUUID();
  const startAt = new Date().toISOString();
  const reportPath = path.join(DATA_DIR, `playwright-result-${runId}.json`);

  const runRecord = {
    id: runId,
    startedAt: startAt,
    finishedAt: null,
    status: 'running',
    code: null,
    stats: null,
    tests: [],
    log: '',
    logTail: '',
    reportUrl: null
  };

  activeRun = runRecord;

  const child = spawn('npx', ['playwright', 'test', '--reporter=json'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PLAYWRIGHT_JSON_OUTPUT_NAME: reportPath
    },
    shell: process.platform === 'win32'
  });

  child.stdout.on('data', (chunk) => {
    runRecord.log += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    runRecord.log += chunk.toString();
  });

  return new Promise((resolve) => {
    child.on('close', (code) => {
      const parsed = parseJsonReport(reportPath);
      runRecord.finishedAt = new Date().toISOString();
      runRecord.code = code;
      runRecord.status = code === 0 ? 'passed' : 'failed';
      runRecord.stats = parsed.stats;
      runRecord.tests = parsed.tests;
      runRecord.logTail = runRecord.log.split('\n').slice(-80).join('\n');
      runRecord.reportUrl = hasHtmlReport() ? '/report/index.html' : null;

      const history = readHistory();
      history.unshift(runRecord);
      writeHistory(history.slice(0, 30));

      activeRun = null;
      resolve(runRecord);
    });
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const reqPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(PUBLIC_DIR, reqPath);

  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = ext === '.html'
    ? 'text/html; charset=utf-8'
    : ext === '.js'
      ? 'text/javascript; charset=utf-8'
      : ext === '.css'
        ? 'text/css; charset=utf-8'
        : 'text/plain; charset=utf-8';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/runs') {
    return sendJson(res, 200, {
      activeRun,
      history: readHistory(),
      latestReportUrl: hasHtmlReport() ? '/report/index.html' : null
    });
  }

  if (req.method === 'POST' && req.url === '/api/run') {
    if (activeRun) {
      return sendJson(res, 409, { message: 'Run already in progress', activeRun });
    }

    sendJson(res, 202, { message: 'Run started' });
    runTests().catch((error) => {
      console.error('Run failed to start:', error);
      activeRun = null;
    });
    return;
  }


  if (req.method === 'GET' && req.url.startsWith('/report/')) {
    const relativePath = req.url.replace('/report/', '');
    const filePath = path.join(REPORT_DIR, relativePath);
    if (!filePath.startsWith(REPORT_DIR) || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Report file not found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = ext === '.html'
      ? 'text/html; charset=utf-8'
      : ext === '.js'
        ? 'text/javascript; charset=utf-8'
        : ext === '.css'
          ? 'text/css; charset=utf-8'
          : ext === '.json'
            ? 'application/json; charset=utf-8'
            : 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/api/runs/')) {
    const id = req.url.replace('/api/runs/', '');
    const run = readHistory().find((entry) => entry.id === id);
    if (!run) {
      return sendJson(res, 404, { message: 'Run not found' });
    }
    return sendJson(res, 200, run);
  }

  return serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  ensureDataDir();
  console.log(`UI is running at http://${HOST}:${PORT}`);
});
