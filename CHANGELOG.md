# Changelog

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
