# Vision-Based UI Verification Pipeline

Automated visual feedback, verification, and regression comparison loop for agentic workflows.

## Directory Structure
- `vision/reference/`: Target mockups and user reference assets (`<target_name>.<ext>`).
- `vision/screenshots/`: Automated captures structured by target and iteration (`<target_name>_v<N>.png` & `<target_name>_latest.png`).
- `vision/capture.mjs`: Headless browser capture pipeline with automatic Vite lifecycle management and WebGL support.

## Execution Syntax
```bash
# Default capture (writes default_v<N>.png and default_latest.png)
npm run vision:capture

# Targeted feature capture (e.g. for target matching vision/reference/hud.png)
node vision/capture.mjs --target hud

# Explicit scenario or camera teleport (1-6)
node vision/capture.mjs --target slopestyle --scenario teleport_3

# Full multi-angle resort sweep
node vision/capture.mjs --target resort_sweep --scenario all
```

## Agent Verification Protocol
1. **Identify Target:** Identify reference asset name in `vision/reference/<target_name>.<ext>`.
2. **Implement Change:** Apply surgical code changes.
3. **Capture:** Execute `node vision/capture.mjs --target <target_name>`.
4. **Inspect:**
   - Call `read_file` on `vision/screenshots/<target_name>_latest.png`.
   - Call `read_file` on `vision/reference/<target_name>.<ext>`.
5. **Verify & Iterate:** Compare elements, typography, spatial positioning, colors, and 3D rendering. Repeat until acceptance criteria are satisfied.
