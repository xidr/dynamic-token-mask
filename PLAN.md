# Portrait mask editor

Visible native agents. Branch `task/portrait-mask-editor`, based on main d4abbbb. Milestone 2 only.

1. Begin with the three existing live-checkout drafts. Implement a GM-only ApplicationV2 editor entry point, load an exact static image path, initialize from the saved circle, constrain dragging and numeric controls, and show a transparency-preserving checkerboard crop matching the renderer.
2. Keep changes local until Save or Remove, describe world-wide effects before committing, preserve the mask on cancel or failure, provide actionable errors and English/Russian controls. Steps 1 and 2 form one Standard builder batch across scripts/main.js, editor and geometry modules, template, styles, translations and targeted Node tests.
3. Run full Node suite, syntax, manifest paths and translation checks. Independently review committed code and correct findings. Finish documentation and record pending test-world checks. After separate merge approval, verify preview against wide off-center and transparent 1×1 token examples in the designated world, including persistence and Cancel.
