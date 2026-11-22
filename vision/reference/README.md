# Reference Photographs & Visual Benchmarks

This directory houses user-provided reference images, design mockups, and visual targets.

## Naming Convention
Name reference images after the feature or component being developed:
- `<target_name>.<ext>` (e.g., `hud.png`, `camera_studio.png`, `jump_ramp.jpg`, `character_model.png`)

## Agent Usage
When initiating a visual task:
1. Place reference image here: `vision/reference/<target_name>.png`.
2. The agent will target `<target_name>` during captures.
3. The agent inspects `vision/reference/<target_name>.png` alongside `vision/screenshots/<target_name>_latest.png`.
