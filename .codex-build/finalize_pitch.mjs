import path from "node:path";
import { pathToFileURL } from "node:url";
import { PresentationFile } from "@oai/artifact-tool";

const SKILL_DIR = "/Users/yesharavani/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations";
const workspaceDir = "/Users/yesharavani/FinnStrat";
const candidatePath = path.join(workspaceDir, ".codex-build/finnstrat-pitch-draft.pptx");
const finalPath = path.join(workspaceDir, "presentation-output/finnstrat-pitch-deck.pptx");
const { finalizePresentation } = await import(pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href);
const presentation = await PresentationFile.importPptx(await (await import("node:fs/promises")).readFile(candidatePath));
const result = await finalizePresentation({
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable: "/Users/yesharavani/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3",
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-heading-fit"],
  fontPolicy: { basis: "design", families: ["Aptos"] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(workspaceDir, ".codex-build/finnstrat-pitch-deck.validation.json"),
});
console.log(JSON.stringify(result));
