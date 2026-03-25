const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const PUBLIC_DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function readDb() { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function writeDb(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
function nextId(items) { return items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1; }

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.normalize(filePath).replace(/^\.+/, '');
  const fullPath = path.join(PUBLIC_DIR, filePath);
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsed.pathname;

  try {
    if (req.method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, { ok: true, service: 'UniWork.kz API' });
    }

    if (req.method === 'GET' && pathname === '/api/projects') {
      const db = readDb();
      const q = (parsed.searchParams.get('q') || '').toLowerCase();
      const category = parsed.searchParams.get('category') || '';
      const projects = db.projects
        .filter((p) => {
          const text = `${p.title} ${p.description} ${p.customer}`.toLowerCase();
          const okQ = !q || text.includes(q);
          const okC = !category || p.category === category;
          return okQ && okC;
        })
        .map((p) => ({ ...p, applicationsCount: db.applications.filter((a) => a.projectId === p.id).length }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return sendJson(res, 200, projects);
    }

    if (req.method === 'POST' && pathname === '/api/projects') {
      const body = await parseBody(req);
      const { title, description, budget, category, customer, deadline } = body;
      if (!title || !description || !budget || !category || !customer || !deadline) {
        return sendJson(res, 400, { error: 'Заполните все поля проекта.' });
      }
      const db = readDb();
      const project = {
        id: nextId(db.projects),
        title: String(title).trim(),
        description: String(description).trim(),
        budget: Number(budget),
        category: String(category).trim(),
        customer: String(customer).trim(),
        deadline,
        createdAt: new Date().toISOString(),
      };
      db.projects.push(project);
      writeDb(db);
      return sendJson(res, 201, project);
    }

    const applyMatch = pathname.match(/^\/api\/projects\/(\d+)\/apply$/);
    if (req.method === 'POST' && applyMatch) {
      const projectId = Number(applyMatch[1]);
      const body = await parseBody(req);
      const { studentName, skills, coverLetter } = body;
      if (!studentName || !skills || !coverLetter) {
        return sendJson(res, 400, { error: 'Заполните все поля отклика.' });
      }
      const db = readDb();
      if (!db.projects.some((p) => p.id === projectId)) {
        return sendJson(res, 404, { error: 'Проект не найден.' });
      }
      const application = {
        id: nextId(db.applications),
        projectId,
        studentName: String(studentName).trim(),
        skills: String(skills).trim(),
        coverLetter: String(coverLetter).trim(),
        status: 'new',
        createdAt: new Date().toISOString(),
      };
      db.applications.push(application);
      writeDb(db);
      return sendJson(res, 201, application);
    }

    if (req.method === 'GET' && pathname === '/api/applications') {
      const db = readDb();
      const projectId = Number(parsed.searchParams.get('projectId'));
      let apps = db.applications.map((a) => ({
        ...a,
        projectTitle: db.projects.find((p) => p.id === a.projectId)?.title || 'Unknown',
      }));
      if (projectId) apps = apps.filter((a) => a.projectId === projectId);
      apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return sendJson(res, 200, apps);
    }

    const msgMatch = pathname.match(/^\/api\/projects\/(\d+)\/messages$/);
    if (msgMatch && req.method === 'GET') {
      const db = readDb();
      const projectId = Number(msgMatch[1]);
      const messages = db.messages.filter((m) => m.projectId === projectId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return sendJson(res, 200, messages);
    }

    if (msgMatch && req.method === 'POST') {
      const db = readDb();
      const projectId = Number(msgMatch[1]);
      const body = await parseBody(req);
      const { author, text } = body;
      if (!author || !text) return sendJson(res, 400, { error: 'Нужны author и text.' });
      if (!db.projects.some((p) => p.id === projectId)) return sendJson(res, 404, { error: 'Проект не найден.' });

      const message = {
        id: nextId(db.messages),
        projectId,
        author: String(author).trim(),
        text: String(text).trim(),
        createdAt: new Date().toISOString(),
      };
      db.messages.push(message);
      writeDb(db);
      return sendJson(res, 201, message);
    }

    if (req.method === 'GET' && pathname === '/api/stats') {
      const db = readDb();
      const activeStudents = new Set(db.applications.map((a) => a.studentName)).size;
      const activeCustomers = new Set(db.projects.map((p) => p.customer)).size;
      const completedOrders = db.applications.filter((a) => a.status === 'completed').length;
      return sendJson(res, 200, {
        projects: db.projects.length,
        activeStudents,
        activeCustomers,
        completedOrders,
        repeatOrdersRate: db.projects.length ? Math.round((completedOrders / db.projects.length) * 100) : 0,
      });
    }

    serveStatic(req, res, pathname);
  } catch (error) {
    sendJson(res, 500, { error: 'Server error', details: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`UniWork.kz server started on http://localhost:${PORT}`);
});
