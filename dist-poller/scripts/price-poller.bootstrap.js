"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// ✅ dotenv를 가장 먼저 실행
dotenv_1.default.config({
    path: path_1.default.resolve(process.cwd(), '.env.local'),
});
// ✅ 그 다음에 poller 로직 로드
require("./price-poller");
