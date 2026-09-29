import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('leaderboard endpoints exist and require login to submit', () => {
  const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
  assert.match(worker, /\/api\/scores\/submit/);
  assert.match(worker, /login_required/);
  assert.match(worker, /ON CONFLICT\(x_id\) DO UPDATE SET/);
  assert.match(worker, /ORDER BY score DESC, updated_at ASC/);
  assert.match(worker, /LEFT JOIN x_users xu ON xu\.x_id = s\.x_id/);
  assert.match(worker, /AS verified/);
  assert.match(worker, /PARTITION BY verified ORDER BY score DESC, updated_at ASC/);
  assert.match(worker, /AS prizeRank/);
  assert.match(worker, /LIMIT \?1 OFFSET \?2/);
});

test('score submission requires a short-lived server run ticket', () => {
  const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(worker, /path === '\/api\/runs\/start'/);
  assert.match(worker, /run_required/);
  assert.match(worker, /run_expired/);
  assert.match(worker, /score_rate_invalid/);
  assert.match(worker, /run_used/);
  assert.match(html, /fetch\('\/api\/runs\/start'/);
  assert.match(html, /runToken/);
});

test('daily leaderboard records each account best score for the current UTC day', () => {
  const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
  const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../public/leaderboard.html', import.meta.url), 'utf8');
  assert.match(schema, /CREATE TABLE IF NOT EXISTS daily_scores/);
  assert.match(worker, /url\.searchParams\.get\('board'\) === 'daily'/);
  assert.match(worker, /INSERT INTO daily_scores/);
  assert.match(html, /id="dailyBoard"/);
  assert.match(html, /\/api\/scores\?board=daily&limit=50/);
});

test('game page shows daily missions and unlocked title', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /DAILY MISSIONS/);
  assert.match(html, /id="missionCrystals"/);
  assert.match(html, /id="missionDodges"/);
  assert.match(html, /id="missionQuizzes"/);
  assert.match(html, /id="playerTitle"/);
  assert.match(html, /DAILY ACE/);
});

test('game page shows top three leaderboard entries with a full-board link', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /GLOBAL LEADERBOARD/);
  assert.match(html, /refreshBoard/);
  assert.match(html, /fetch\('\/api\/scores\?limit=3'\)/);
  assert.match(html, /href="\/leaderboard\.html"[^>]*>VIEW ALL<\/a>/);
  assert.match(html, /TOP 3 VERIFIED RUNNERS WILL RECEIVE PRIZES FROM DEVELOPER\./);
  assert.match(html, /x\.verified\?' ✓':''/);
  assert.match(html, /medals\[x\.prizeRank\]/);
  assert.match(html, /\/api\/scores\/submit/);
  assert.ok(html.indexOf('<section class="board"') > html.indexOf('<section class="below"'));
});

test('full leaderboard page renders all available scores', () => {
  const html = readFileSync(new URL('../public/leaderboard.html', import.meta.url), 'utf8');
  assert.match(html, /GLOBAL LEADERBOARD/);
  assert.match(html, /TOP 3 VERIFIED RUNNERS WILL RECEIVE PRIZES FROM DEVELOPER\./);
  assert.match(html, /x\.verified\?' ✓':''/);
  assert.match(html, /medals\[x\.prizeRank\]/);
  assert.match(html, /fetch\(`\/api\/scores\?limit=50&offset=\$\{offset\}`\)/);
  assert.match(html, /id="loadMore"[^>]*>LOAD MORE<\/button>/);
  assert.match(html, /href="\/game\.html"[^>]*>BACK TO RUN<\/a>/);
});

test('best run comes from current account and referrals require X login', () => {
  const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(worker, /bestScore/);
  assert.match(worker, /guest: !!session\.guest/);
  assert.match(html, /high=Number\(d\.bestScore\|\|0\)/);
  assert.match(html, /if\(!d\.user\.guest\)/);
  assert.match(html, /LOG IN WITH X FOR REFERRALS/);
  assert.match(worker, /path === '\/api\/referral'/);
  assert.match(worker, /referral_requires_x/);
  assert.match(worker, /INSERT OR IGNORE INTO referrals/);
  assert.match(worker, /code: `@\$\{session\.username\}`/);
  assert.match(worker, /SELECT x_id FROM x_users WHERE username = \?1/);
  assert.match(html, /fetch\('\/api\/referral'/);
  assert.match(html, /fetch\('\/api\/referral\/apply'/);
  assert.match(html, /\/game\?ref=\$\{x\.code\}/);
});

test('best-run panel saves the account best score banner', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /score-banner-template\.png/);
  assert.match(html, /id="bestBanner"[^>]*>SAVE SCORE<\/button>/);
  assert.match(html, /bestBanner'\)\.onclick=\(\)=>saveBanner\(high\)/);
  assert.match(html, /x\.drawImage\(img,0,0,b\.width,b\.height\)/);
});

test('end-run save button writes the current run score instead of best score', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /function saveBanner\(score\)/);
  assert.match(html, /x\.fillText\(String\(score\),1175,1168\)/);
  assert.match(html, /banner'\)\.onclick=\(\)=>saveBanner\(game\.score\)/);
});

test('referral panel posts a Super Dili invitation instead of showing a raw link', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /id="refPost"[^>]*>POST ON X<\/button>/);
  assert.doesNotMatch(html, /INVITE LINK:/);
  assert.match(html, /My best score as Super Dili: \$\{high\}\. Let's run faster with me and save the Dili World!/);
});

test('guest referral CTA starts X login instead of remaining disabled', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /refPost\.disabled=false;refPost\.textContent='LOG IN WITH X FOR REFERRALS';refPost\.onclick=\(\)=>\{location\.href='\/auth\/x'\}/);
});

test('post score uses current score and the account referral URL', () => {
  const html = readFileSync(new URL('../public/game.html', import.meta.url), 'utf8');
  assert.match(html, /I scored \$\{game\.score\} in DILI-RUN\. Be faster and catch me if you can!/);
  assert.match(html, /referralUrl/);
});

test('d1 schema has unique x_id and descending score index', () => {
  const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  assert.match(schema, /x_id TEXT NOT NULL UNIQUE/);
  assert.match(schema, /idx_scores_score ON scores\(score DESC\)/);
});
