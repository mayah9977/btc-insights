// lib/vip/vipPriceExperiment.ts
import fs from 'fs';
import path from 'path';

export type PriceGroup = 'A' | 'B';

type Experiment = {
  userId: string;
  group: PriceGroup;
  at: number;
};

const FILE = path.join(
  process.cwd(),
  'data',
  'vip-price-exp.json'
);

function ensure() {
  if (!fs.existsSync(path.dirname(FILE))) {
    fs.mkdirSync(path.dirname(FILE));
  }
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, '[]');
  }
}

export function assignPriceGroup(
  userId: string
): PriceGroup {
  ensure();
  const arr: Experiment[] = JSON.parse(
    fs.readFileSync(FILE, 'utf-8')
  );

  const existing = arr.find(
    (e) => e.userId === userId
  );
  if (existing) return existing.group;

  const group: PriceGroup =
    Math.random() < 0.5 ? 'A' : 'B';

  arr.push({ userId, group, at: Date.now() });
  fs.writeFileSync(FILE, JSON.stringify(arr, null, 2));

  return group;
}
