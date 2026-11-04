import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const HOST = '127.0.0.1';
const START_PORT = Number(process.env.FMA_LOCAL_PORT || 8123);
let activePort = START_PORT;
const OPEN_BROWSER = process.argv.includes('--open');

const APP_ROUTE = /^\/(login|admin|giao-vien|phu-huynh|demo|dashboard|tong-quan|hoc-sinh|students|quan-ly-hoc-sinh|thoi-khoa-bieu|timetable|lich-hoc|diem-danh|attendance|quan-ly-diem|diem|scores|nhap-diem-bo-mon|subject-scores|diem-bo-mon|tai-chinh|dong-tien|finance|hoc-phi|nguoi-dung|users|tai-khoan|hoc-ba|hocba|tong-ket-nam-hoc|yearend|cai-dat-nam-hoc|schoolyear|thong-bao|notifications|tin-tuc|news|phieu-lien-lac|phieulienlac|danh-gia|evaluations|bieu-mau|ke-hoach|plans|kehoach|thong-tin-con|child-info)(\/.*)?$/i;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
};

function openBrowser() {
    const url = `http://${HOST}:${activePort}/login`;
    if (process.platform === 'win32') {
        spawn('cmd.exe', ['/d', '/s', '/c', `start "" "${url}"`], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
        }).unref();
    }
}

function sendText(response, statusCode, message) {
    response.writeHead(statusCode, {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
    });
    response.end(message);
}

async function resolveFile(urlPath) {
    if (urlPath === '/') return path.join(ROOT, 'index.html');

    const decoded = decodeURIComponent(urlPath);
    const relative = decoded.replace(/^\/+/, '');
    const candidate = path.resolve(ROOT, relative);
    const rootPrefix = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
    if (candidate !== ROOT && !candidate.startsWith(rootPrefix)) return null;

    try {
        if ((await stat(candidate)).isFile()) return candidate;
    } catch {}

    if (!path.extname(decoded) && APP_ROUTE.test(decoded)) {
        return path.join(ROOT, 'login.html');
    }
    return null;
}

const server = http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
        sendText(response, 405, 'Method Not Allowed');
        return;
    }

    try {
        const requestUrl = new URL(request.url || '/', `http://${HOST}:${activePort}`);
        const filePath = await resolveFile(requestUrl.pathname);
        if (!filePath) {
            sendText(response, 404, 'Not Found');
            return;
        }

        const body = await readFile(filePath);
        response.writeHead(200, {
            'content-type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'content-length': body.length,
            'cache-control': 'no-store',
            'x-content-type-options': 'nosniff',
        });
        response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
        console.error(error);
        sendText(response, 500, 'Internal Server Error');
    }
});

server.on('error', error => {
    if (error?.code === 'EADDRINUSE' && activePort < START_PORT + 10) {
        activePort += 1;
        console.log(`Cổng đang bận, thử cổng ${activePort}...`);
        server.listen(activePort, HOST);
        return;
    }
    console.error('Không khởi động được máy chủ:', error);
    process.exit(1);
});

server.listen(activePort, HOST, () => {
    console.log(`FMA Nam Hòa đang chạy tại http://${HOST}:${activePort}/login`);
    console.log('Nhấn Ctrl+C để dừng máy chủ.');
    if (OPEN_BROWSER) openBrowser();
});
