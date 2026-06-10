# Changelog

## [1.4.4](https://github.com/dgesteves/diogo-studio/compare/v1.4.3...v1.4.4) (2026-06-10)


### Code Refactoring

* dissolve src/content into feature-owned content and src/data ([a3254ea](https://github.com/dgesteves/diogo-studio/commit/a3254ea45c27b4cb500aa160c72e3a75c8f0fbbf))
* dissolve src/server into src/lib server-only modules ([dba6875](https://github.com/dgesteves/diogo-studio/commit/dba68755d75290dc8c0c42ff6373b828b95067db))
* enforce contact feature public API and fix lib-to-feature dependency ([21ac5cb](https://github.com/dgesteves/diogo-studio/commit/21ac5cb6b2f2fbbdb00f43d2367ab0ae07f2f2cb))
* extract shared hooks, providers, and global stores to top level ([b0aa8fa](https://github.com/dgesteves/diogo-studio/commit/b0aa8fa4a00f7e4b610f6e64e7e356f476a5f7db))
* migrate from Velite MDX to typed TypeScript content blocks ([f4540c0](https://github.com/dgesteves/diogo-studio/commit/f4540c00510109b9cfc101489035878d5de33c0b))
* move Playwright suite to tests/e2e ([1b8cac5](https://github.com/dgesteves/diogo-studio/commit/1b8cac5be0a3fd834ffe135375e6eb891cfe2f86))
* move typed route map to src/constants/routes.ts ([6624817](https://github.com/dgesteves/diogo-studio/commit/6624817abb7fafe8b6c3933dcb4dfe39c6fbbb75))
* move validated env to src/config/env.ts ([654f207](https://github.com/dgesteves/diogo-studio/commit/654f20793998fb68d020ea6cff0714201a5a3843))
* remove unused content utilities (toc, article-text, parse-inline, reading-stats) ([14c9b28](https://github.com/dgesteves/diogo-studio/commit/14c9b28fa575e77aa3b25e935a528f85aa7f8e6b))
* rename mdx/ to article/ and remove unused agent-index frontmatter parser ([be30c90](https://github.com/dgesteves/diogo-studio/commit/be30c902f657b9ab5bf3e3548e485f8975880d35))
* tighten and consolidate .devin rules for clarity and consistency ([e641bc9](https://github.com/dgesteves/diogo-studio/commit/e641bc9f2c875f1ca90c041adbe4789d39fa538f))


### Documentation

* consolidate architecture around feature-first structure with lib/ as infrastructure layer ([24543d4](https://github.com/dgesteves/diogo-studio/commit/24543d49e3f76afe47b120c1521a19cdefe54e66))
* mark structure migration complete in architecture blueprint ([0ad18de](https://github.com/dgesteves/diogo-studio/commit/0ad18de21dbe5987dd0cc19e532e2703dab6d9e2))
* update architecture docs to reflect TSX article migration ([fe3cc87](https://github.com/dgesteves/diogo-studio/commit/fe3cc8772c3e7b31af0997ca585ea7fba1b60918))

## [1.4.3](https://github.com/dgesteves/diogo-studio/compare/v1.4.2...v1.4.3) (2026-06-09)


### Documentation

* remove completed SRP refactor plan after finishing 11/14 sections ([10b25ff](https://github.com/dgesteves/diogo-studio/commit/10b25ff024c6ba00e6ca4e0e64db9afb54d7eec5))

## [1.4.2](https://github.com/dgesteves/diogo-studio/compare/v1.4.1...v1.4.2) (2026-06-09)


### Documentation

* add SRP refactor plan tracking document for codebase-wide single responsibility review ([c9fc615](https://github.com/dgesteves/diogo-studio/commit/c9fc61599d4ee3ee1221269f4cedaee04d33eee4))
* complete SRP review for section 8 (command-menu) and update refactor plan tracking ([def02c3](https://github.com/dgesteves/diogo-studio/commit/def02c3e75d513248a02369edac2e02b001dbcb9))
* complete SRP review for sections 2-7 and update refactor plan tracking ([49d2250](https://github.com/dgesteves/diogo-studio/commit/49d225056bb83ac4cce587147f9253a22981b721))
* complete SRP review for sections 9-11 (contact, career-graph, studio) ([71cac0e](https://github.com/dgesteves/diogo-studio/commit/71cac0e0d5521a8689e13d6c296470802150bda1))

## [1.4.1](https://github.com/dgesteves/diogo-studio/compare/v1.4.0...v1.4.1) (2026-06-08)


### Code Refactoring

* extract reusable article and agent components to reduce duplication ([21b5e51](https://github.com/dgesteves/diogo-studio/commit/21b5e51a349ca30be1ab870b8f87f09dc260a6da))


### Documentation

* tighten file length limit to 100 lines and expand single-responsibility guidance ([66034ba](https://github.com/dgesteves/diogo-studio/commit/66034ba30d15693933613819bd6889af986c40a4))

## [1.4.0](https://github.com/dgesteves/diogo-studio/compare/v1.3.0...v1.4.0) (2026-06-08)


### Features

* add desk accessories, lighting enhancements, and silence THREE.Clock deprecation ([923057b](https://github.com/dgesteves/diogo-studio/commit/923057b32ae05e85f30344dba679c3dd0e8a49d1))


### Code Refactoring

* extract magic numbers to constants and improve scene measurements ([ca265ac](https://github.com/dgesteves/diogo-studio/commit/ca265acdb7f9285e3959d6d95d41ce495a6e6024))
* simplify desk positioning by removing DESK_GROUP_Y constant ([a7f6469](https://github.com/dgesteves/diogo-studio/commit/a7f646995c5f9140e5789b86236a4cc4d95afec0))


### Miscellaneous Chores

* change license from MIT to proprietary all rights reserved ([f378677](https://github.com/dgesteves/diogo-studio/commit/f3786779adcc49ecd497fe53122cac3e9ae2596c))
* **deps-dev:** bump @types/node in the types group across 1 directory ([#44](https://github.com/dgesteves/diogo-studio/issues/44)) ([e28c994](https://github.com/dgesteves/diogo-studio/commit/e28c99413d27c15c54a60386e5b9b9b4ea2dd207))
* **deps-dev:** bump knip from 6.15.0 to 6.16.1 ([#57](https://github.com/dgesteves/diogo-studio/issues/57)) ([fe51543](https://github.com/dgesteves/diogo-studio/commit/fe5154350965d58bb0e8f96fdcf37e93e7d3133a))
* **deps-dev:** bump the testing group across 1 directory with 2 updates ([#43](https://github.com/dgesteves/diogo-studio/issues/43)) ([c70109e](https://github.com/dgesteves/diogo-studio/commit/c70109eafcd47607e7ae3f2a20e4ce2a5bff4bf6))
* **deps:** bump @ai-sdk/openai from 3.0.65 to 3.0.68 ([#51](https://github.com/dgesteves/diogo-studio/issues/51)) ([607c352](https://github.com/dgesteves/diogo-studio/commit/607c35268474b72202610d00622bb943435a18c3))
* **deps:** bump @radix-ui/react-accordion from 1.2.12 to 1.2.13 ([#56](https://github.com/dgesteves/diogo-studio/issues/56)) ([576fddd](https://github.com/dgesteves/diogo-studio/commit/576fdddb665d80503281f9db3c317daaa2c2bb97))
* **deps:** bump @radix-ui/react-dialog from 1.1.15 to 1.1.16 ([#50](https://github.com/dgesteves/diogo-studio/issues/50)) ([102b7bd](https://github.com/dgesteves/diogo-studio/commit/102b7bd480dbbe127cebe108b1aa808208fe0b9b))
* **deps:** bump @radix-ui/react-dropdown-menu from 2.1.16 to 2.1.17 ([#45](https://github.com/dgesteves/diogo-studio/issues/45)) ([35ad849](https://github.com/dgesteves/diogo-studio/commit/35ad8496e41468d2cb75a8a54ad63b7077613969))
* **deps:** bump @radix-ui/react-popover from 1.1.15 to 1.1.16 ([#46](https://github.com/dgesteves/diogo-studio/issues/46)) ([26ab127](https://github.com/dgesteves/diogo-studio/commit/26ab1271327da919e0d1b9e23f92bc9be5f145f3))
* **deps:** bump @radix-ui/react-slot from 1.2.4 to 1.2.5 ([#47](https://github.com/dgesteves/diogo-studio/issues/47)) ([1c6228f](https://github.com/dgesteves/diogo-studio/commit/1c6228f5d413d9b7d84702f9d02beda84257db63))
* **deps:** bump @radix-ui/react-tabs from 1.1.13 to 1.1.14 ([#59](https://github.com/dgesteves/diogo-studio/issues/59)) ([4a59132](https://github.com/dgesteves/diogo-studio/commit/4a591320fed73be8d86522d0ffbc253cade42846))
* **deps:** bump @radix-ui/react-visually-hidden from 1.2.4 to 1.2.5 ([#49](https://github.com/dgesteves/diogo-studio/issues/49)) ([0b5cd0c](https://github.com/dgesteves/diogo-studio/commit/0b5cd0c25e3c4544634c69a8ee6223ebef21a816))
* **deps:** bump @sentry/nextjs from 10.55.0 to 10.56.0 ([#48](https://github.com/dgesteves/diogo-studio/issues/48)) ([3e16077](https://github.com/dgesteves/diogo-studio/commit/3e16077362f9d6d7bab2881e73f34250bb5affe0))
* **deps:** bump @xyflow/react from 12.10.2 to 12.11.0 ([#53](https://github.com/dgesteves/diogo-studio/issues/53)) ([7d3954a](https://github.com/dgesteves/diogo-studio/commit/7d3954a2711adf709ab660bf142678600a3ef850))
* **deps:** bump ai from 6.0.190 to 6.0.197 ([#55](https://github.com/dgesteves/diogo-studio/issues/55)) ([6993165](https://github.com/dgesteves/diogo-studio/commit/6993165f214dce060532c923664071a7df4c4d5b))
* **deps:** bump lucide-react from 1.16.0 to 1.17.0 ([#54](https://github.com/dgesteves/diogo-studio/issues/54)) ([643d253](https://github.com/dgesteves/diogo-studio/commit/643d253dbb990b81f39f23821cfc0d45cf467373))
* **deps:** bump shiki from 4.1.0 to 4.2.0 ([#58](https://github.com/dgesteves/diogo-studio/issues/58)) ([c6b58a3](https://github.com/dgesteves/diogo-studio/commit/c6b58a3734464f931fdadddc719a44938e5609c9))
* **deps:** bump the next group with 3 updates ([#41](https://github.com/dgesteves/diogo-studio/issues/41)) ([51d5f32](https://github.com/dgesteves/diogo-studio/commit/51d5f32dc6d3344ee41f4d40ce7939a9d4b7dfa4))
* **deps:** bump the react group across 1 directory with 3 updates ([#42](https://github.com/dgesteves/diogo-studio/issues/42)) ([8fc9a0b](https://github.com/dgesteves/diogo-studio/commit/8fc9a0b9f0716fe0d23e4ba70119bdce4e8c274f))
* **deps:** bump three from 0.182.0 to 0.184.0 ([#52](https://github.com/dgesteves/diogo-studio/issues/52)) ([627d32d](https://github.com/dgesteves/diogo-studio/commit/627d32d4462ce34013f27822c5dd5806a78a1d0a))

## [1.3.0](https://github.com/dgesteves/diogo-studio/compare/v1.2.5...v1.3.0) (2026-06-07)


### Features

* add interactive pixelated about portrait and widen pages to max-w-6xl ([3733629](https://github.com/dgesteves/diogo-studio/commit/3733629d32f9848a8b7d9ef608ce008ad8953fed))
* commit downscaled about portrait and serve it from public/images ([9fe4a94](https://github.com/dgesteves/diogo-studio/commit/9fe4a9433f46e19950fa2b409e11c7d2e7a00f80))


### Documentation

* add CI, CodeQL, OpenSSF Scorecard, Release Please, and Dependabot auto-merge badges to README ([6e6d8d8](https://github.com/dgesteves/diogo-studio/commit/6e6d8d8d9fc4befd4afbd87f18f0c8bbc2f3c7bf))


### Miscellaneous Chores

* raise size-limit budget to 1.3 MB for the about portrait feature ([38f7fc0](https://github.com/dgesteves/diogo-studio/commit/38f7fc0b8d3a8cef00a5578928182e0bd34f9305))

## [1.2.5](https://github.com/dgesteves/diogo-studio/compare/v1.2.4...v1.2.5) (2026-06-07)


### Miscellaneous Chores

* add pretest:coverage script to run velite before coverage tests ([7109652](https://github.com/dgesteves/diogo-studio/commit/7109652d0a32f4b3b59a231f63a66a79bcbe54a7))

## [1.2.4](https://github.com/dgesteves/diogo-studio/compare/v1.2.3...v1.2.4) (2026-06-04)


### Code Refactoring

* fix smooth scroll conflicts between Lenis and ReactFlow ([2879ffc](https://github.com/dgesteves/diogo-studio/commit/2879ffcfc39502cb3d8757fd328bb0ed28327224))


### Miscellaneous Chores

* update components.json CSS path and remove completed rules-alignment-plan.md ([d19c3d5](https://github.com/dgesteves/diogo-studio/commit/d19c3d56663ac8906ba06b3e884ea6427982f6f2))

## [1.2.3](https://github.com/dgesteves/diogo-studio/compare/v1.2.2...v1.2.3) (2026-06-04)


### Miscellaneous Chores

* remove all explanatory comments across codebase (rules-alignment Phase 4/4) ([594935e](https://github.com/dgesteves/diogo-studio/commit/594935e5b295f8a821114a3f52d17504c913d188))

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
