import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: npm run sync:levels -- <internal-run-output.json>");
  process.exit(1);
}

const resolvedInput = path.resolve(inputPath);
const output = JSON.parse(fs.readFileSync(resolvedInput, "utf8"));
const state = output.final_state ?? output;
const reviewPacket = state.boss_review_packet;

if (!reviewPacket?.level_result_system || !reviewPacket?.visual_scene_map) {
  console.error("Input does not contain boss_review_packet level data.");
  process.exit(1);
}

if (reviewPacket.visual_scene_map.parked_future_scenes) {
  console.error("Refusing to sync parked future scenes into the active level page.");
  process.exit(1);
}

const levelSystem = reviewPacket.level_result_system;
const data = {
  source_output: resolvedInput,
  generated_at: new Date().toISOString(),
  level_result_system: levelSystem,
  visual_scene_map: reviewPacket.visual_scene_map,
  run_receipt_summary: {
    dry_run_id: output.summary?.dry_run_id ?? state.run_receipt?.receipt_type ?? null,
    status: output.summary?.status ?? state.status,
    project_name: output.summary?.project_name ?? state.project_name,
    project_slug: state.project_slug,
    current_shape: reviewPacket.project_compass_strip?.current_shape ?? null,
    executed_node_count: output.summary?.executed_node_count ?? null,
    no_action_proof_line: state.run_receipt?.no_action_proof_line ?? null,
  },
};

if (levelSystem.level_count !== levelSystem.levels?.length) {
  console.error("Level count does not match levels array length.");
  process.exit(1);
}

if (levelSystem.level_count !== levelSystem.doors?.length) {
  console.error("Level count does not match doors array length.");
  process.exit(1);
}

const outputPath = path.resolve("src/data/level-system.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2) + "\n");

console.log(
  JSON.stringify(
    {
      synced: outputPath,
      status: levelSystem.status,
      project_name: data.run_receipt_summary.project_name,
      project_type: data.run_receipt_summary.current_shape,
      levels: levelSystem.level_count,
      doors: levelSystem.doors.length,
    },
    null,
    2,
  ),
);
