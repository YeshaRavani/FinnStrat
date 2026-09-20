import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";
import { pathToFileURL } from "node:url";

const SKILL_DIR = "/Users/yesharavani/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations";
const TMP_DIR = "/Users/yesharavani/FinnStrat/.codex-build";
const OUT_DIR = "/Users/yesharavani/FinnStrat/presentation-output";
await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(OUT_DIR, { recursive: true });
const { resolvePresentationFont } = await import(pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href);
const font = resolvePresentationFont({ fontFamily: "Aptos" });
const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });

const C = { bg: "#0D1916", panel: "#153229", gold: "#D9AE64", text: "#F1EEE4", muted: "#A7B8AF", red: "#D88768", green: "#77D49A", line: "#345247" };
function box(slide, text, x, y, w, h, size = 22, color = C.text, bold = false, opts = {}) {
  const s = slide.shapes.add({ geometry: "textbox", position: { left: x, top: y, width: w, height: h }, fill: opts.fill ?? "none", line: opts.line ?? { fill: "none", width: 0 } });
  s.text = text; s.text.style = { typeface: font, fontSize: size, color, bold, autoFit: "shrink" };
  if (opts.align) s.text.paragraphFormat = { alignment: opts.align };
  return s;
}
function line(slide, x1, y1, x2, y2, color = C.line, width = 2) { slide.shapes.add({ geometry: "line", position: { left: Math.min(x1, x2), top: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) }, line: { fill: color, width } }); }
function pill(slide, text, x, y, w, color = C.gold) { box(slide, text, x, y, w, 34, 14, color, true, { fill: `${color}22`, line: { fill: color, width: 1 }, align: "center" }); }
function base(slide, number, title, kicker = "FINNSTRAT") { slide.background.fill = C.bg; box(slide, kicker, 64, 38, 300, 24, 13, C.gold, true); box(slide, String(number).padStart(2, "0"), 1180, 38, 40, 24, 13, C.muted, true, { align: "right" }); box(slide, title, 64, 82, 1120, 64, 34, C.text, true); }
function notes(slide, text) { slide.speakerNotes.textFrame.setText(text); }

// 1. Cover
{ const s = p.slides.add(); s.background.fill = C.bg; box(s, "FINNSTRAT", 72, 70, 300, 30, 15, C.gold, true); box(s, "Plan for the best.\nPrepare for the worst.", 72, 180, 780, 180, 60, C.text, true); box(s, "A wealth tracker and planner built around the goals people care about and the shocks they cannot predict.", 76, 405, 590, 70, 22, C.muted); line(s, 890, 160, 1090, 360, C.gold, 4); line(s, 1090, 360, 1175, 245, C.gold, 4); line(s, 1175, 245, 1210, 205, C.gold, 4); box(s, "WEALTH\nTHAT HOLDS\nUP", 920, 410, 250, 100, 21, C.gold, true); notes(s, "FinnStrat pitch deck. Tagline and product framing supplied by the user."); }

// 2. Why product
{ const s = p.slides.add(); base(s, 1, "The financial planning gap"); box(s, "People can access more financial products than ever. Many still lack a clear plan for what happens when life changes.", 64, 158, 610, 70, 25, C.muted); box(s, "27.18%", 64, 295, 430, 110, 88, C.gold, true); box(s, "of respondents crossed the minimum financial-literacy threshold in the 2019 NCFE survey", 72, 417, 430, 60, 18, C.text); box(s, "Financial literacy covers knowledge, attitude, and behaviour—not just investing.", 64, 545, 520, 55, 18, C.muted); box(s, "INCOME", 760, 190, 140, 34, 15, C.gold, true, { align: "center" }); box(s, "SPENDING", 950, 270, 140, 34, 15, C.gold, true, { align: "center" }); box(s, "DREAMS", 760, 430, 140, 34, 15, C.gold, true, { align: "center" }); box(s, "SHOCKS", 950, 510, 140, 34, 15, C.red, true, { align: "center" }); line(s, 900, 207, 950, 287, C.line, 2); line(s, 1020, 304, 830, 447, C.line, 2); line(s, 900, 447, 950, 527, C.line, 2); box(s, "The missing layer is\nresilient decision-making.", 742, 585, 410, 60, 23, C.text, true); notes(s, "Source: National Centre for Financial Education, National Strategy for Financial Education / 2019 survey. The 27.18% figure measures the minimum threshold across financial knowledge, attitude, and behaviour. Source: https://systemhealth.rbi.org.in/Scripts/PublicationReportDetails.aspx_UrlPage%3D%26ID%3D1156%281%29.html"); }

// 3. Product
{ const s = p.slides.add(); base(s, 2, "One place for spending, goals, and decisions"); const xs = [70, 355, 640, 925]; const labels = ["TRACK", "PLAN", "STRESS-TEST", "ADJUST"]; const subs = ["See where money goes", "Turn dreams into timelines", "Find the breaking point", "Improve the strategy"]; labels.forEach((t, i) => { box(s, `0${i + 1}`, xs[i], 220, 60, 42, 24, C.gold, true); box(s, t, xs[i], 300, 240, 40, 21, C.text, true); box(s, subs[i], xs[i], 350, 220, 55, 18, C.muted); if (i < 3) line(s, xs[i] + 210, 318, xs[i + 1] - 25, 318, C.gold, 3); }); box(s, "Example goal", 70, 515, 180, 28, 14, C.gold, true); box(s, "Buy a car • ₹18 lakh", 70, 552, 380, 45, 30, C.text, true); box(s, "The app compares the strongest strategies instead of giving one generic answer.", 640, 525, 500, 65, 24, C.text, true); }

// 4. Target user
{ const s = p.slides.add(); base(s, 3, "The user has a dream and a monthly reality"); box(s, "Young working Indians and families who earn, save, spend, and invest—but do not have a personal financial planner.", 64, 160, 760, 65, 25, C.muted); pill(s, "FIRST JOB", 70, 295, 150); pill(s, "NEW FAMILY", 240, 295, 175); pill(s, "SIDE HUSTLE", 435, 295, 175); pill(s, "BIG PURCHASE", 630, 295, 180); box(s, "“I earn reasonably well.\nI just don’t know if I can\nsafely afford my next move.”", 70, 420, 500, 155, 32, C.text, true); box(s, "FINNSTRAT FIT", 790, 400, 220, 28, 14, C.gold, true); box(s, "Goal-driven\nDigital-first\nWants clarity\nNeeds flexibility", 790, 440, 330, 135, 27, C.text, true); }

// 5. USP
{ const s = p.slides.add(); base(s, 4, "The difference is resilience"); box(s, "Most tools show a projection. FinnStrat shows the consequences of a decision under pressure.", 64, 155, 780, 60, 25, C.muted); box(s, "Highest return", 100, 315, 260, 42, 23, C.muted, true, { align: "center" }); box(s, "Highest survivability", 850, 315, 330, 42, 23, C.gold, true, { align: "center" }); line(s, 390, 337, 820, 337, C.line, 3); box(s, "FinnStrat", 540, 280, 170, 115, 25, C.text, true, { fill: C.panel, line: { fill: C.gold, width: 2 }, align: "center" }); box(s, "The strategy a person can sustain when income drops, markets fall, or expenses spike.", 220, 490, 820, 70, 30, C.text, true, { align: "center" }); pill(s, "GOAL-BASED", 330, 620, 170); pill(s, "STRESS-TESTED", 550, 620, 200); pill(s, "EXPLAINABLE", 800, 620, 170); }

// 6. failure
{ const s = p.slides.add(); base(s, 5, "When a strategy fails, the app explains what to change"); const steps = [["01", "BREAKING POINT", "Emergency reserve breached"], ["02", "DIAGNOSIS", "EMI is too high for income"], ["03", "RECOVERY", "Reduce loan or delay purchase"], ["04", "RERUN", "Compare the safer outcome"]]; steps.forEach((a, i) => { const x = 70 + i * 290; box(s, a[0], x, 225, 60, 40, 24, i === 0 ? C.red : C.gold, true); box(s, a[1], x, 295, 235, 35, 15, C.gold, true); box(s, a[2], x, 345, 220, 75, 22, C.text, true); if (i < 3) line(s, x + 220, 245, x + 270, 245, C.line, 3); }); box(s, "A failed plan is not the end of the journey. It is a signal to redesign the plan.", 160, 545, 960, 70, 30, C.text, true, { align: "center" }); }

// 7. revenue + MVP
{ const s = p.slides.add(); base(s, 6, "A simple path from trust to paid value"); box(s, "FREE CORE", 80, 190, 250, 40, 21, C.gold, true); box(s, "Build the habit", 80, 250, 250, 38, 25, C.text, true); box(s, "Track spending\nSet goals\nCompare basic plans", 80, 315, 270, 115, 21, C.muted); line(s, 370, 290, 470, 290, C.gold, 3); box(s, "₹19 / WEEK", 500, 190, 250, 50, 29, C.gold, true); box(s, "Premium planning", 500, 250, 280, 38, 25, C.text, true); box(s, "Advanced stress tests\nFamily planning\nAI explanations", 500, 315, 280, 115, 21, C.muted); line(s, 820, 290, 920, 290, C.gold, 3); box(s, "TRUSTED PARTNERS", 950, 190, 250, 40, 19, C.gold, true); box(s, "Transparent value", 950, 250, 250, 38, 25, C.text, true); box(s, "Financial wellness\nCarefully selected products\nVisible savings protected", 950, 315, 260, 115, 21, C.muted); line(s, 80, 500, 1200, 500, C.line, 2); box(s, "MVP", 80, 535, 90, 32, 15, C.gold, true); box(s, "Profile → Goal → Strategy shortlist → Stress test → Breaking point → Recovery plan", 200, 530, 980, 40, 24, C.text, true); notes(s, "Revenue model and MVP framing supplied by the user. ₹19/week is a proposed price, not a validated market price."); }

const draft = path.join(TMP_DIR, "finnstrat-pitch-draft.pptx");
await (await PresentationFile.exportPptx(p)).save(draft);
for (let i = 0; i < p.slides.items.length; i++) { const img = await p.slides.items[i].export({ format: "png", scale: 1 }); await fs.writeFile(path.join(TMP_DIR, `slide-${i + 1}.png`), new Uint8Array(await img.arrayBuffer())); }
console.log(draft);
