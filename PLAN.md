# Scene-token preview redraw

Use visible native agents on task/scene-preview-redraw. Base the repair on 6505b71.

1. Reproduce a stale scene-token preview on rapid portrait changes with a failing regression test. The selected and original paths return to A while the rendered clone still shows C.
2. Repair native scene-sheet preview synchronization. Limit the repair to eligible previews, handle repeated input and preserve existing prototype, ring and drag behavior. Inspect the sheet integration, renderer and associated tests.
3. Run Node tests, syntax and applicable repository checks. Independently review the committed fix, update project records and request merge approval.
4. Verify the same rapid sequence on the live GM sheet after an approved merge. Confirm Cancel, Apply and the owning player's placed token.
