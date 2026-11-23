# Verify the first UI release

Use visible native agents on task/verify-ui-release, based on 21d0174. The user designated the currently open world on the project's Foundry instance.

1. Identify the active world and build. Use independent GM and player browser sessions and dedicated temporary fixtures. Run the file picker create, adjust, cancel, save and remove flow using UI controls. Check two matching tokens across scene changes and browser reloads.
2. Exercise transparent images, wildcard variants, spaces and Unicode, unrelated images, transforms, targeting, vision and occlusion. Compare the square preview with the rendered token.
3. Check missing and unsupported resources. Verify originals after disabling the module and reloading with a mask saved. Restore the world's module state and clean up dedicated fixtures.
4. Record observed results and any gaps in README.md, ROADMAP.md and relevant knowledge notes. Validate documentation, review and request merge approval.

First batch uses a standard builder for browser testing across known components. Mark acceptance items complete only with direct observations. Keep access details and temporary automation outside the module.
