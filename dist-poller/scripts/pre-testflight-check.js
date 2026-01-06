"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/pre-testflight-check.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ROOT = process.cwd();
/**
 * 검사 대상 디렉터리 (UI/문구 영역만)
 */
const TARGET_DIRS = ['app', 'components', 'lib', 'docs'];
/**
 * 제외 디렉터리
 */
const IGNORE_DIRS = [
    'node_modules',
    '.next',
    'scripts'
];
/**
 * App Store 승인 위험 단어 (UI 기준)
 */
const FORBIDDEN_WORDS = [
    '매수',
    '매도',
    '수익',
    '보장',
    '추천',
    '확정',
    '투자'
];
function shouldIgnore(filePath) {
    return IGNORE_DIRS.some((dir) => filePath.includes(path_1.default.sep + dir + path_1.default.sep));
}
function scan(dir, results) {
    const files = fs_1.default.readdirSync(dir);
    for (const file of files) {
        const full = path_1.default.join(dir, file);
        if (shouldIgnore(full))
            continue;
        const stat = fs_1.default.statSync(full);
        if (stat.isDirectory()) {
            scan(full, results);
            continue;
        }
        // UI 관련 파일만 검사
        if (!file.endsWith('.ts') &&
            !file.endsWith('.tsx') &&
            !file.endsWith('.md')) {
            continue;
        }
        // 타입 정의 제외
        if (file.endsWith('.d.ts'))
            continue;
        const content = fs_1.default.readFileSync(full, 'utf-8');
        for (const word of FORBIDDEN_WORDS) {
            if (content.includes(word)) {
                results.push(`${full} → "${word}"`);
            }
        }
    }
}
const hits = [];
for (const dir of TARGET_DIRS) {
    const targetPath = path_1.default.join(ROOT, dir);
    if (fs_1.default.existsSync(targetPath)) {
        scan(targetPath, hits);
    }
}
if (hits.length === 0) {
    console.log('✅ TestFlight 사전 점검 통과');
}
else {
    console.log('❌ 승인 위험 UI 문구 발견');
    hits.forEach((h) => console.log(h));
    process.exit(1);
}
