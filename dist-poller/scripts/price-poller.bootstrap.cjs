"use strict";

const path = require("path");
const dotenv = require("dotenv");

// ✅ ENV 먼저 로드
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

// ✅ 그 다음 poller 로직
require("./price-poller.cjs");
