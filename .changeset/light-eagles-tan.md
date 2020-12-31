---
"@pnpm/config": minor
"@pnpm/headless": minor
"supi": minor
---

New option added: writeModulesDir. When `false`, pnpm will not write any files to the modules directory. This is useful for when you want to mount the modules directory with FUSE.
