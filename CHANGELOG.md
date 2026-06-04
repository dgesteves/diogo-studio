# Changelog

## [1.2.2](https://github.com/dgesteves/diogo-studio/compare/v1.2.1...v1.2.2) (2026-06-04)


### Code Refactoring

* decompose career-graph SVG into defs/axis/node modules (rules-alignment Phase 3/4) ([ef8684c](https://github.com/dgesteves/diogo-studio/commit/ef8684c3e1bb3cc59d07f866fc49e07b4f6e191d))
* decompose inspector overlay into atoms/format/motion-panel (rules-alignment Phase 3/4) ([e6e6844](https://github.com/dgesteves/diogo-studio/commit/e6e68443fa78ef3980b73c3efe23ec65aaddbb89))


### Documentation

* mark file-size rule complete and document Phase 3 decomposition pass ([3e5e670](https://github.com/dgesteves/diogo-studio/commit/3e5e670bca845cb7fe6c09e775a28d58ca182827))

## [1.2.1](https://github.com/dgesteves/diogo-studio/compare/v1.2.0...v1.2.1) (2026-06-04)


### Code Refactoring

* add explicit return types and drop non-null assertions for lint cleanup ([31cbf3b](https://github.com/dgesteves/diogo-studio/commit/31cbf3b59e58bbfd70eaf2cc677b96f37a41d57a))


### Miscellaneous Chores

* remove unused Next.js default assets ([ccb035a](https://github.com/dgesteves/diogo-studio/commit/ccb035aa3727ea2b173d26dae923d524bebf1d30))

## [1.2.0](https://github.com/dgesteves/diogo-studio/compare/v1.1.8...v1.2.0) (2026-06-04)


### Features

* wire error boundaries to Sentry and harden observability (rules-alignment Phase 1) ([0fdebf0](https://github.com/dgesteves/diogo-studio/commit/0fdebf0dba1a4f3be07a5bcf4bee1b8a8322ef81))

## [1.1.8](https://github.com/dgesteves/diogo-studio/compare/v1.1.7...v1.1.8) (2026-06-04)


### Documentation

* add rules-alignment-plan.md — complete codebase audit against .devin/rules/ ([979e577](https://github.com/dgesteves/diogo-studio/commit/979e577fa4c610e5ea7864353c8deb9633b5d513))

## [1.1.7](https://github.com/dgesteves/diogo-studio/compare/v1.1.6...v1.1.7) (2026-06-03)


### Code Refactoring

* clarify no-magic-values rule, promote colocation for tests ([837a351](https://github.com/dgesteves/diogo-studio/commit/837a351d57c43f62155fe0a9973e82b822ecac1c))
* extract home page sections to features/home/, move to (marketing) group ([9180e73](https://github.com/dgesteves/diogo-studio/commit/9180e7306c254f8130d029d95156642697dc3cc0))
* migrate chrome components to components/layout/ ([782628d](https://github.com/dgesteves/diogo-studio/commit/782628d7067125aa321b788362b3c3d593f9dddf))
* migrate easter-egg to features/, move shared components to components/common/ ([f231fff](https://github.com/dgesteves/diogo-studio/commit/f231fff8e3defdadccee184f94e368941e07658d))
* migrate inspector to features/ with shared provider pattern ([796abe7](https://github.com/dgesteves/diogo-studio/commit/796abe7d90427ecb67ff8be3480ba7d5977a32c3))
* organize routes into (marketing) and (legal) groups, update ADR 4a ([2cce45d](https://github.com/dgesteves/diogo-studio/commit/2cce45d611dea6d49c6d2455e065d00ee5d5bc0e))
* soften no-comments rule, move resume to docs/ ([32df411](https://github.com/dgesteves/diogo-studio/commit/32df4118f3130ef319f19d13977ef6b20989f7e3))


### Documentation

* update architecture.md to reflect completed migration, remove .gitkeep files ([ea639da](https://github.com/dgesteves/diogo-studio/commit/ea639dabf08c8ec9f2f706251f7ee57899af38d4))


### Miscellaneous Chores

* remove .gitkeep placeholders, update architecture.md to discourage empty folders ([a68dd80](https://github.com/dgesteves/diogo-studio/commit/a68dd80b0b19237f66e0cdd5e88aaf30cbdbc9d4))

## [1.1.6](https://github.com/dgesteves/diogo-studio/compare/v1.1.5...v1.1.6) (2026-06-03)


### Code Refactoring

* migrate command-menu to features/ with shared provider pattern ([0ce080a](https://github.com/dgesteves/diogo-studio/commit/0ce080a6473bf8cf7d0d701ad7870ac26afa02e6))

## [1.1.5](https://github.com/dgesteves/diogo-studio/compare/v1.1.4...v1.1.5) (2026-06-03)


### Code Refactoring

* migrate studio to features/ with curated index.ts ([19a87d1](https://github.com/dgesteves/diogo-studio/commit/19a87d1f1bd1f1f6777ea50d57bd4bebf5b487c4))

## [1.1.4](https://github.com/dgesteves/diogo-studio/compare/v1.1.3...v1.1.4) (2026-06-03)


### Code Refactoring

* migrate career-graph to features/ and extract shared R3F util ([6f034ce](https://github.com/dgesteves/diogo-studio/commit/6f034ce9a6213d1277dd04ca4f7967d1255568cc))

## [1.1.3](https://github.com/dgesteves/diogo-studio/compare/v1.1.2...v1.1.3) (2026-06-03)


### Code Refactoring

* move AI agent code to server/ and types to types/ following architecture guidelines ([3ff7494](https://github.com/dgesteves/diogo-studio/commit/3ff74949d5672e33887e4de9781f229646ef310e))


### Documentation

* mark slice 2 (server/ai) complete in ADR 0001 and add vitest stub for server-only ([94b0767](https://github.com/dgesteves/diogo-studio/commit/94b0767c11e0a4feb904a584a4b379cb8cfe3069))

## [1.1.2](https://github.com/dgesteves/diogo-studio/compare/v1.1.1...v1.1.2) (2026-06-03)


### Code Refactoring

* reorganize project structure to match architecture guidelines ([bc13e66](https://github.com/dgesteves/diogo-studio/commit/bc13e6661e808b945081317676f77c689d6dd87f))


### Documentation

* add ADR 0001 for bottom-up migration sequencing and update imports to new config/seo structure ([5014aed](https://github.com/dgesteves/diogo-studio/commit/5014aed0f7a1c4029b8ece378fd02f7396210306))

## [1.1.1](https://github.com/dgesteves/diogo-studio/compare/v1.1.0...v1.1.1) (2026-06-03)


### Documentation

* add comprehensive architecture guide and scaffold target folder structure ([5ab93c9](https://github.com/dgesteves/diogo-studio/commit/5ab93c9fe8c75ae3034a7d9bb246cc024ab2ec24))


### Miscellaneous Chores

* add Windsurf AI rules for Next.js development standards ([8b37a34](https://github.com/dgesteves/diogo-studio/commit/8b37a34c22639ef89947cb840d0ebd49edb57d17))
* configure changelog sections and update favicon styling ([62165b9](https://github.com/dgesteves/diogo-studio/commit/62165b944afa9186e7cfbb78cbdf3dbbaa9bf81d))
* refine Windsurf rules for file size limits and app/ routing boundaries ([7e5b129](https://github.com/dgesteves/diogo-studio/commit/7e5b1290059b9bceb34dab5d6376f7fd7510e6ea))
* switch release-please to config files and refine commit type guidelines ([d5d04cd](https://github.com/dgesteves/diogo-studio/commit/d5d04cd12ff234801deb0207b4c31be1709d3f53))

## [1.1.0](https://github.com/dgesteves/diogo-studio/compare/v1.0.1...v1.1.0) (2026-06-03)


### Features

* add contact form, inspector overlay, OG images, and JSON-LD ([fd4e9f9](https://github.com/dgesteves/diogo-studio/commit/fd4e9f93feadce97914a091b2a58b7739ac45f32))

## [1.0.1](https://github.com/dgesteves/diogo-studio/compare/v1.0.0...v1.0.1) (2026-06-02)


### Bug Fixes

* resolve e2e failures (a11y + command-menu dismiss) ([f0ed92a](https://github.com/dgesteves/diogo-studio/commit/f0ed92accc651aa5340222730133dd9cd085c572))

## 1.0.0 (2026-05-21)


### Features

* add e2e, env validation, bundle analyzer, release-please, app essentials ([a7c2214](https://github.com/dgesteves/diogo-studio/commit/a7c221403e6f4deda1efb3f344bed88272d41824))
* portfolio metadata, OG/icons, Vercel Analytics, Sentry observability ([e7ca548](https://github.com/dgesteves/diogo-studio/commit/e7ca548b909396cec1fd239bbd6363e7e6d70de9))


### Bug Fixes

* **ci:** bootstrap Node 22 before installing pnpm 11 ([9ed1b40](https://github.com/dgesteves/diogo-studio/commit/9ed1b40dce4db3e180ac57cd378154410d3deb0b))
* **ci:** install pnpm as standalone binary to bypass Node engine check ([71526c5](https://github.com/dgesteves/diogo-studio/commit/71526c5b09a483da1be1223e35dbeaeabf8e77aa))
* **dependabot:** drop semver-tier cooldown keys unsupported by github-actions ecosystem ([a65881d](https://github.com/dgesteves/diogo-studio/commit/a65881d15f0363d7feed9240e286ca0cab78f8c5))
