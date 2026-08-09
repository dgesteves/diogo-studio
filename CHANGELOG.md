# Changelog

## [1.12.1](https://github.com/dgesteves/diogo-studio/compare/v1.12.0...v1.12.1) (2026-08-09)


### Bug Fixes

* **lint:** scope React rules to src/ instead of renaming a Playwright fixture ([cedb711](https://github.com/dgesteves/diogo-studio/commit/cedb711543bef6d6109a8ca6fb5b94137df22cf9))
* **world:** degrade the scene when the renderer cannot hold a frame rate ([17eb481](https://github.com/dgesteves/diogo-studio/commit/17eb481dd3bc8049ac378bf48fd38bd323da4f50))


### Documentation

* add comprehensive testing plan for restructure safety ([38373cf](https://github.com/dgesteves/diogo-studio/commit/38373cf9c6071f8d6d74a68018475a3c48fb595d))
* block restructure on testing-plan.md and tighten testing rules ([ef0045a](https://github.com/dgesteves/diogo-studio/commit/ef0045a0dee6718e93c46ed796b0104f8fdd62d1))
* clarify file-size guidance and restructure-plan authority ([14e1fec](https://github.com/dgesteves/diogo-studio/commit/14e1fecf35fd23328713d8d08e466fa6c808db80))
* correct the boot-gate diagnosis and record the quality tiers ([6cd0846](https://github.com/dgesteves/diogo-studio/commit/6cd0846ccf65f047315e13e5a57f2924ff5c87c4))
* correct three unfollowable claims in the rule set ([fac89f4](https://github.com/dgesteves/diogo-studio/commit/fac89f4a0d0ebb0ca523012ed0fde0bdd1f8f7be))
* correct two unfollowable claims in the App Router rule ([13be837](https://github.com/dgesteves/diogo-studio/commit/13be837ad4064709e645ca6de395a9611b37ddcd))
* **decisions:** record the RTTR adoption and the changelog gap ([0477850](https://github.com/dgesteves/diogo-studio/commit/0477850b382f499a64c9cb78ddcdd911b5fc4cb2))
* re-measure the figures the restructure block rests on ([633a263](https://github.com/dgesteves/diogo-studio/commit/633a263009b6826a0685b3567d2bbb70b9b67759))
* **readme:** document the CI-equivalent e2e commands ([fb61a04](https://github.com/dgesteves/diogo-studio/commit/fb61a04b50ff6615cfc859a14e9235d54d97aac0))
* record the dual-motion E2E split and its measured cost ([0c1423b](https://github.com/dgesteves/diogo-studio/commit/0c1423b5ccbfe02617bfdc031df6defd6508dd3b))
* remove career-graph feature and consolidate career data ([b72c1e5](https://github.com/dgesteves/diogo-studio/commit/b72c1e5fdaf20b632247e391b095243346ce4f3f))
* replace stale test and coverage figures with re-measured values ([9809bf1](https://github.com/dgesteves/diogo-studio/commit/9809bf1febcfbf2c7f69c0900456471ab3fc066a))
* standardize on US English (en-US) across all human-readable text ([4f6a182](https://github.com/dgesteves/diogo-studio/commit/4f6a182c0c8f09fc1124f9d8b83b49dfc9117307))
* **testing:** add local CI reproduction with constrained containers ([664e6b9](https://github.com/dgesteves/diogo-studio/commit/664e6b9dce890253a8f94b45df65df63f40ec6cd))
* **testing:** expand rules with layer-specific guidance and the boot-gate lesson ([2775c57](https://github.com/dgesteves/diogo-studio/commit/2775c57dce37a88568e5e4eee2b8e914e9399bce))
* tighten rules with reality checks and remove stale references ([cc48418](https://github.com/dgesteves/diogo-studio/commit/cc484185494e6ddac813232c259b25d487283ce5))
* update rules to reflect Phase 0 landing and current enforcement state ([ce66ecc](https://github.com/dgesteves/diogo-studio/commit/ce66ecc8368249e6ba8db979c2fe3868a0e7b1c2))


### Tests

* **e2e:** dismiss the boot gate with an ordinary click ([10e83f9](https://github.com/dgesteves/diogo-studio/commit/10e83f93fb3700ff2eda2846a37cdba02d496d4c))
* **e2e:** extract openInspector fixture to handle the toggle race ([b50bf2f](https://github.com/dgesteves/diogo-studio/commit/b50bf2f83f261fdfbd8fee8d5dff82654c61f94c))
* **e2e:** open the inspector through a hydration-safe helper ([aea5b0a](https://github.com/dgesteves/diogo-studio/commit/aea5b0a1debcb73154bc056318a4e33f2fc5b782))
* **e2e:** restore Next.js cache in CI to skip the cold build ([46ef084](https://github.com/dgesteves/diogo-studio/commit/46ef0849faacc370a5829628965bc80bc076a778))
* **e2e:** run every spec in both motion modes ([239821e](https://github.com/dgesteves/diogo-studio/commit/239821ecf4551de5e2522bd271b5ac4d6805c491))
* **studio:** assert the scene graph with RTTR ([eb039d4](https://github.com/dgesteves/diogo-studio/commit/eb039d47e12c9e33c79f273df41d13744ff177a5))
* **world:** force the boot dismiss click through the stability wait ([755c9b2](https://github.com/dgesteves/diogo-studio/commit/755c9b25e4770199d927982d177eec3a7e55243a))
* **world:** move the boot gate off E2E onto fake timers ([f1c33bb](https://github.com/dgesteves/diogo-studio/commit/f1c33bb5bcc1bb4fdabcbf194c13d3a6082a199e))


### Miscellaneous Chores

* **deps:** bump lockfile dependencies ([2e853e9](https://github.com/dgesteves/diogo-studio/commit/2e853e92c5fe34c52294f9899d09ad83e612eb90))

## [1.12.0](https://github.com/dgesteves/diogo-studio/compare/v1.11.2...v1.12.0) (2026-08-07)


### Features

* **studio:** add ceiling light fixtures with day/night intensity control ([e12acfd](https://github.com/dgesteves/diogo-studio/commit/e12acfdcc5c5265a2d38ce0cea0a01c31eb64129))
* **studio:** add detailed desk hardware with Mac Studio, server node, and USB hub ([4dbe889](https://github.com/dgesteves/diogo-studio/commit/4dbe8894cdf5b975323ff181114f6e44e2339956))
* **world:** add detailed contact door with frame and pull handle ([4594a74](https://github.com/dgesteves/diogo-studio/commit/4594a74fb769479a78421d100f6392ce58005d72))


### Code Refactoring

* **env:** drop Resend and contact vars for a feature that no longer exists ([5f8084a](https://github.com/dgesteves/diogo-studio/commit/5f8084a5b931930be78980bfe9cabf3fadb79468))
* **studio:** extract room dimensions to shared constants and add ceiling ([7248584](https://github.com/dgesteves/diogo-studio/commit/7248584c15755d4ee5798b844fe25a1756271a4d))
* **studio:** redesign desk props with improved detail and organization ([77a9561](https://github.com/dgesteves/diogo-studio/commit/77a9561db2a56668749941ff8614c55289ee558b))
* **studio:** redesign mouse with parametric geometry and enhanced lighting ([971940c](https://github.com/dgesteves/diogo-studio/commit/971940ca310b9149aed801e41b8a903a801714e6))
* **studio:** remove unused dust motes effect and clean up desk hardware layout ([d00686f](https://github.com/dgesteves/diogo-studio/commit/d00686f57f08959006e250709cfe38fc67a732cc))
* **world:** extract dark metal material to shared config for reuse ([77bf529](https://github.com/dgesteves/diogo-studio/commit/77bf529461f19962d2105090efec92d674db84d6))
* **world:** remove waypoints navigation from command deck ([f609517](https://github.com/dgesteves/diogo-studio/commit/f6095177c868a8ddeaa6e2f500f0f961c906f8a7))
* **world:** reorient wall screens to hang on right wall facing into room ([a69c7c7](https://github.com/dgesteves/diogo-studio/commit/a69c7c7be5eca368b144e64ad4b39d473b07d5f9))
* **world:** update lighting to use cool tones from brand config ([b82c121](https://github.com/dgesteves/diogo-studio/commit/b82c1210d312172c18ec0ccc3c6ea06a622bc32b))


### Documentation

* correct architecture drift and record the private-repo constraints ([17560bf](https://github.com/dgesteves/diogo-studio/commit/17560bffd7c9e088353a7a811a646280c3a70aab))
* drop public-repo scaffolding and rewrite the README ([0d1d8fd](https://github.com/dgesteves/diogo-studio/commit/0d1d8fd924f65c37ac993d80b3f763674e58fbfe))


### Build System

* declare minimumReleaseAge so the supply-chain policy is enforced ([feb42c7](https://github.com/dgesteves/diogo-studio/commit/feb42c7c07b7c706905f04ccc120725d0f9a9ae8))


### Continuous Integration

* remove workflows that cannot run on a private repo ([46e43e9](https://github.com/dgesteves/diogo-studio/commit/46e43e9ddc1ae25ab9796b33d8233481f3d9cd70))
* stop spending the artifact quota on reports nobody reads ([0a6b0f0](https://github.com/dgesteves/diogo-studio/commit/0a6b0f05d8d4b4df38b16c5a973cd5c7fea5747f))


### Miscellaneous Chores

* **deps-dev:** bump the development-minor-patch group across 1 directory with 5 updates ([#206](https://github.com/dgesteves/diogo-studio/issues/206)) ([013ce66](https://github.com/dgesteves/diogo-studio/commit/013ce669210761ff89a58041a2c5aba19bb35ebb))
* **deps-dev:** bump tsx from 4.23.1 to 4.23.4 in the development-minor-patch group ([#202](https://github.com/dgesteves/diogo-studio/issues/202)) ([e573704](https://github.com/dgesteves/diogo-studio/commit/e573704df4257908d7f4f9d12966b062d8b2af0c))
* **deps:** bump ai from 7.0.47 to 7.0.48 in the production-minor-patch group ([#201](https://github.com/dgesteves/diogo-studio/issues/201)) ([33c3d4e](https://github.com/dgesteves/diogo-studio/commit/33c3d4ef48fde4d3c38a6cdee4a08140a543de1b))
* **deps:** bump motion from 12.43.0 to 13.0.0 ([#207](https://github.com/dgesteves/diogo-studio/issues/207)) ([30bd74a](https://github.com/dgesteves/diogo-studio/commit/30bd74abbdf6c5d9414a469a6f9fd8942b26a632))
* **deps:** bump the next group with 2 updates ([#204](https://github.com/dgesteves/diogo-studio/issues/204)) ([2220e12](https://github.com/dgesteves/diogo-studio/commit/2220e123d4cc61cc2a33d5cf205ac569db7f72c4))
* **deps:** bump the production-minor-patch group across 1 directory with 7 updates ([#205](https://github.com/dgesteves/diogo-studio/issues/205)) ([419621d](https://github.com/dgesteves/diogo-studio/commit/419621d35d9eab0501178091231f85ee9ca7a8f1))
* point .prettierignore at paths that still exist ([819681a](https://github.com/dgesteves/diogo-studio/commit/819681a786298fc08ac245a75d707b703de61b55))

## [1.11.2](https://github.com/dgesteves/diogo-studio/compare/v1.11.1...v1.11.2) (2026-08-02)


### Bug Fixes

* **ci:** stop dependabot branches from creating vercel deployments ([#198](https://github.com/dgesteves/diogo-studio/issues/198)) ([80a659a](https://github.com/dgesteves/diogo-studio/commit/80a659a4ac364b1c0833dc0438feab695d15158d))
* **deps:** resolve high-severity next and brace-expansion advisories ([#188](https://github.com/dgesteves/diogo-studio/issues/188)) ([85f8697](https://github.com/dgesteves/diogo-studio/commit/85f869716068fa50b215bc5036d182ba8e0b785b))


### Performance Improvements

* optimize 3D scene rendering and shader compilation ([4f38302](https://github.com/dgesteves/diogo-studio/commit/4f38302e8eff6b0216298f8bbbdf932fc1e462a4))


### Continuous Integration

* **deps:** bump actions/checkout from 6.1.0 to 7.0.1 ([#167](https://github.com/dgesteves/diogo-studio/issues/167)) ([e0f9691](https://github.com/dgesteves/diogo-studio/commit/e0f96911770f0f572b944ec13be951a982545c70))
* **deps:** bump github/codeql-action/upload-sarif from 4.37.1 to 4.37.3 ([#171](https://github.com/dgesteves/diogo-studio/issues/171)) ([8784006](https://github.com/dgesteves/diogo-studio/commit/878400644b91e7c261a4d8be52e7d1af8152390d))
* **deps:** bump ossf/scorecard-action from 2.4.3 to 2.4.4 ([#166](https://github.com/dgesteves/diogo-studio/issues/166)) ([e584acb](https://github.com/dgesteves/diogo-studio/commit/e584acb102366014bc9eaed4101efba87e25492d))
* **deps:** bump the codeql-action group with 3 updates ([#196](https://github.com/dgesteves/diogo-studio/issues/196)) ([bc30c83](https://github.com/dgesteves/diogo-studio/commit/bc30c83f9f1fb9694a84930052a60ece0c094755))
* pair codeql-action bumps and adopt knip 6.31 ([#193](https://github.com/dgesteves/diogo-studio/issues/193)) ([2cfe143](https://github.com/dgesteves/diogo-studio/commit/2cfe143bbe13cbaf40a7cfeadd77736b14a59402))
* reduce dependabot PR failure surface ([#194](https://github.com/dgesteves/diogo-studio/issues/194)) ([fdffb25](https://github.com/dgesteves/diogo-studio/commit/fdffb2556ef4f6f3a4504fc6d6fcf37b5d8e80fd))


### Miscellaneous Chores

* **deps-dev:** bump @playwright/test from 1.61.1 to 1.62.1 ([#186](https://github.com/dgesteves/diogo-studio/issues/186)) ([a623953](https://github.com/dgesteves/diogo-studio/commit/a623953cf447c0fb5b439499c5619f888eba42db))
* **deps-dev:** bump jsdom from 29.1.1 to 30.0.1 in the testing group across 1 directory ([#200](https://github.com/dgesteves/diogo-studio/issues/200)) ([883f00f](https://github.com/dgesteves/diogo-studio/commit/883f00f4ae7f23c50d937c32b937cd68dfc28ff0))
* **deps-dev:** bump size-limit and @size-limit/file ([#190](https://github.com/dgesteves/diogo-studio/issues/190)) ([694f198](https://github.com/dgesteves/diogo-studio/commit/694f198f5d88b460947f60e48ed4fc1208078dcb))
* **deps-dev:** bump the development-minor-patch group across 1 directory with 3 updates ([#199](https://github.com/dgesteves/diogo-studio/issues/199)) ([fb09975](https://github.com/dgesteves/diogo-studio/commit/fb09975d19fc21345d00ce932775a2debabc21a5))
* **deps-dev:** bump the linting group across 1 directory with 2 updates ([#173](https://github.com/dgesteves/diogo-studio/issues/173)) ([99d769e](https://github.com/dgesteves/diogo-studio/commit/99d769e874802e8cb86472e73f35aec19fd8843f))
* **deps:** bump @ai-sdk/openai from 4.0.16 to 4.0.26 ([#177](https://github.com/dgesteves/diogo-studio/issues/177)) ([ba45980](https://github.com/dgesteves/diogo-studio/commit/ba459808221b1a67ec3be4b350ddc157ffb445e8))
* **deps:** bump @radix-ui/react-dialog from 1.1.20 to 1.1.23 ([#178](https://github.com/dgesteves/diogo-studio/issues/178)) ([5ab304d](https://github.com/dgesteves/diogo-studio/commit/5ab304ddd9da05f8551a0b057a8c2205508b0020))
* **deps:** bump @radix-ui/react-visually-hidden from 1.2.8 to 1.2.11 ([#180](https://github.com/dgesteves/diogo-studio/issues/180)) ([def560f](https://github.com/dgesteves/diogo-studio/commit/def560f36082d46ad40a3a80ddc23b064ef218e2))
* **deps:** bump @sentry/nextjs from 10.67.0 to 10.69.0 ([#179](https://github.com/dgesteves/diogo-studio/issues/179)) ([f53ea78](https://github.com/dgesteves/diogo-studio/commit/f53ea78cb0bf0305c052037fdaa2378462445bdb))
* **deps:** bump ai from 7.0.32 to 7.0.46 ([#182](https://github.com/dgesteves/diogo-studio/issues/182)) ([daef88f](https://github.com/dgesteves/diogo-studio/commit/daef88ff0b2033cb77104459016a10c9ac8099c4))
* **deps:** bump lucide-react from 1.25.0 to 1.28.0 ([#176](https://github.com/dgesteves/diogo-studio/issues/176)) ([1018f8e](https://github.com/dgesteves/diogo-studio/commit/1018f8e280e66ead9eb12044ab30ba4d93c5d9f5))
* **deps:** bump the react group across 1 directory with 4 updates ([#191](https://github.com/dgesteves/diogo-studio/issues/191)) ([c0c083f](https://github.com/dgesteves/diogo-studio/commit/c0c083f26934d1cb317670a503a2db489f76360f))
* **deps:** bump web-vitals from 5.3.0 to 6.0.1 ([#185](https://github.com/dgesteves/diogo-studio/issues/185)) ([f6e360e](https://github.com/dgesteves/diogo-studio/commit/f6e360e59298c5e1d69e99da915825492165b0df))

## [1.11.1](https://github.com/dgesteves/diogo-studio/compare/v1.11.0...v1.11.1) (2026-07-21)


### Build System

* **deps:** override sharp and fast-uri to patched versions ([73001da](https://github.com/dgesteves/diogo-studio/commit/73001daba70e98612d313ce73c87e3f6bb16ae50))


### Continuous Integration

* **deps:** bump actions/setup-node from 6 to 7 ([#150](https://github.com/dgesteves/diogo-studio/issues/150)) ([af9bbbe](https://github.com/dgesteves/diogo-studio/commit/af9bbbe153a300b2cf5757b99a2a2d98bc501b98))
* **deps:** bump github/codeql-action from 4 to 4.37.1 ([#160](https://github.com/dgesteves/diogo-studio/issues/160)) ([f63dc7e](https://github.com/dgesteves/diogo-studio/commit/f63dc7e1fe48e6a3672e3a9ab9ebe5a599f5dca9))
* **deps:** ignore typescript major bumps until eslint toolchain supports ts 7 ([20095aa](https://github.com/dgesteves/diogo-studio/commit/20095aa9198025f6572f2800fd3ebac5096f88e4))
* pin actions to commit shas and scope workflow token permissions ([919efcf](https://github.com/dgesteves/diogo-studio/commit/919efcfd9b23faa2b5e9cf6cd3f18054903dbfb3))


### Miscellaneous Chores

* **deps-dev:** bump @testing-library/jest-dom from 6.9.1 to 7.0.0 in the testing group across 1 directory ([#161](https://github.com/dgesteves/diogo-studio/issues/161)) ([38c4192](https://github.com/dgesteves/diogo-studio/commit/38c419277efd80589de5fb27ece0300ccb92e13f))
* **deps-dev:** bump knip from 6.24.0 to 6.27.0 ([#155](https://github.com/dgesteves/diogo-studio/issues/155)) ([2fb0af5](https://github.com/dgesteves/diogo-studio/commit/2fb0af597184bc17a616a76ff40b8281b0b8f8c1))
* **deps-dev:** bump the linting group across 1 directory with 4 updates ([#152](https://github.com/dgesteves/diogo-studio/issues/152)) ([6f9f910](https://github.com/dgesteves/diogo-studio/commit/6f9f9105b9545ce2f55c0888cf7d1dd33bac7afb))
* **deps-dev:** bump the tailwind group with 3 updates ([#151](https://github.com/dgesteves/diogo-studio/issues/151)) ([4801ce2](https://github.com/dgesteves/diogo-studio/commit/4801ce27cf2cb7c59f78e844043b1c77240b8a14))
* **deps-dev:** bump the testing group with 2 updates ([#140](https://github.com/dgesteves/diogo-studio/issues/140)) ([b684829](https://github.com/dgesteves/diogo-studio/commit/b68482922dc1dca052282124c6755b28d0768204))
* **deps-dev:** bump the types group across 1 directory with 2 updates ([#142](https://github.com/dgesteves/diogo-studio/issues/142)) ([cd57611](https://github.com/dgesteves/diogo-studio/commit/cd57611fc66177bf534ca9edab17b672e7323f65))
* **deps-dev:** bump tsx from 4.23.0 to 4.23.1 ([#153](https://github.com/dgesteves/diogo-studio/issues/153)) ([b780e66](https://github.com/dgesteves/diogo-studio/commit/b780e66d5e4efec2355c58fc40285ddcf9a5abbc))
* **deps:** bump @ai-sdk/openai from 3.0.75 to 4.0.8 ([#138](https://github.com/dgesteves/diogo-studio/issues/138)) ([6e1e400](https://github.com/dgesteves/diogo-studio/commit/6e1e400e49e777c1ee5980cf459907c7bd18749a))
* **deps:** bump @ai-sdk/openai from 4.0.8 to 4.0.16 ([#156](https://github.com/dgesteves/diogo-studio/issues/156)) ([c0ce712](https://github.com/dgesteves/diogo-studio/commit/c0ce71253f088281542e5c8344c989027f377cdc))
* **deps:** bump @radix-ui/react-dialog from 1.1.18 to 1.1.19 ([#149](https://github.com/dgesteves/diogo-studio/issues/149)) ([c73930e](https://github.com/dgesteves/diogo-studio/commit/c73930e59933b7b8752b1cd14d79cfa0ea2e89f5))
* **deps:** bump @radix-ui/react-dialog from 1.1.19 to 1.1.20 ([#164](https://github.com/dgesteves/diogo-studio/issues/164)) ([049d5ba](https://github.com/dgesteves/diogo-studio/commit/049d5baaf8032d974e0f533bda2247d740b17392))
* **deps:** bump @radix-ui/react-visually-hidden from 1.2.7 to 1.2.8 ([#162](https://github.com/dgesteves/diogo-studio/issues/162)) ([7124657](https://github.com/dgesteves/diogo-studio/commit/7124657b96db4269f7d74cfeec44e4ae69384480))
* **deps:** bump @sentry/nextjs from 10.63.0 to 10.66.0 ([#154](https://github.com/dgesteves/diogo-studio/issues/154)) ([fadfb0c](https://github.com/dgesteves/diogo-studio/commit/fadfb0c2244640bb8a2b7ec91fa601c398f78c52))
* **deps:** bump @sentry/nextjs from 10.66.0 to 10.67.0 ([#163](https://github.com/dgesteves/diogo-studio/issues/163)) ([dc37520](https://github.com/dgesteves/diogo-studio/commit/dc375208c40883f548a319153ac4a878f773ed64))
* **deps:** bump ai from 7.0.15 to 7.0.31 ([#145](https://github.com/dgesteves/diogo-studio/issues/145)) ([b938797](https://github.com/dgesteves/diogo-studio/commit/b938797e6af4f68d51fb3434996087e493a372df))
* **deps:** bump ai from 7.0.15 to 7.0.31 ([#157](https://github.com/dgesteves/diogo-studio/issues/157)) ([2e6f5a5](https://github.com/dgesteves/diogo-studio/commit/2e6f5a5b85257f80aefedb92bbbe5c2b9a0e4d61))
* **deps:** bump ai from 7.0.31 to 7.0.32 ([#165](https://github.com/dgesteves/diogo-studio/issues/165)) ([6d32e73](https://github.com/dgesteves/diogo-studio/commit/6d32e73ea3fe123928e09aae8cb5b6c5280f1bda))
* **deps:** bump lucide-react from 1.23.0 to 1.25.0 ([#148](https://github.com/dgesteves/diogo-studio/issues/148)) ([c09a378](https://github.com/dgesteves/diogo-studio/commit/c09a378d3280a48b9459ce5a6379f8fd692edc43))
* **deps:** bump multiple dependencies including webpack, vite, and typescript-eslint ([9e67de0](https://github.com/dgesteves/diogo-studio/commit/9e67de03577696902c3c41b780f2d3f62606e7a1))

## [1.11.0](https://github.com/dgesteves/diogo-studio/compare/v1.10.0...v1.11.0) (2026-07-03)


### Features

* **agent:** index all route content for RAG retrieval ([0bf8e4c](https://github.com/dgesteves/diogo-studio/commit/0bf8e4c980035623bb94a7503b4c33210c7eb36e))
* **boot:** add work-in-progress notice to boot overlay ([f9a0810](https://github.com/dgesteves/diogo-studio/commit/f9a081035fc9e9aab69fa0647fcaf0833bcaa86b))
* rewrite all route content from real career record ([8a91b13](https://github.com/dgesteves/diogo-studio/commit/8a91b135e2fa3480fd7eb65779a4ce72ca09adfc))
* **scene:** add desk rug and redesign lounge area with updated materials and positioning ([80f424e](https://github.com/dgesteves/diogo-studio/commit/80f424e9f390e9add2bda29b82564fcac56d56c3))
* **world:** add interactive AI core orb with hover animations and command menu integration ([b8539f3](https://github.com/dgesteves/diogo-studio/commit/b8539f34f95d7bd9394dc7036c78cdfdb87ae8c7))


### Code Refactoring

* **boot:** redesign boot screen UI with magenta accents and refined styling ([69256cc](https://github.com/dgesteves/diogo-studio/commit/69256cc80876ef98287ac6d4f5d35f7354d4af22))
* **lounge:** add soundbar and table items with redesigned coffee table surface ([9f551fa](https://github.com/dgesteves/diogo-studio/commit/9f551fa04f5b68860edbd1ae75ed7ebe1ad698b2))
* **world:** redesign bookshelf with magenta accent books and cool LED strip lighting ([76b870c](https://github.com/dgesteves/diogo-studio/commit/76b870c18ec16de165c7db9ea6496028af56698f))


### Miscellaneous Chores

* **deps-dev:** bump knip from 6.20.0 to 6.22.0 ([#119](https://github.com/dgesteves/diogo-studio/issues/119)) ([f915463](https://github.com/dgesteves/diogo-studio/commit/f9154636024569f6fa2bef3df13c88854d316a8e))
* **deps-dev:** bump prettier from 3.8.4 to 3.9.1 in the linting group across 1 directory ([#115](https://github.com/dgesteves/diogo-studio/issues/115)) ([39b8def](https://github.com/dgesteves/diogo-studio/commit/39b8def871cbb89e7c12e3d6f5c38fbeedea2a4c))
* **deps:** bump @sentry/nextjs from 10.61.0 to 10.62.0 ([#117](https://github.com/dgesteves/diogo-studio/issues/117)) ([35b212e](https://github.com/dgesteves/diogo-studio/commit/35b212eb339cf46adeb87ca07d707f0eafbd53f6))
* **deps:** bump ai from 6.0.211 to 7.0.11 ([#118](https://github.com/dgesteves/diogo-studio/issues/118)) ([1dda328](https://github.com/dgesteves/diogo-studio/commit/1dda3288d25f3dec1578e5de3a932a4765400f71))
* **deps:** bump lenis from 1.3.24 to 1.3.25 ([#116](https://github.com/dgesteves/diogo-studio/issues/116)) ([e012b9b](https://github.com/dgesteves/diogo-studio/commit/e012b9b45d5bf625db771ac1e0e412928be24a67))
* **deps:** bump three and @types/three ([#120](https://github.com/dgesteves/diogo-studio/issues/120)) ([8c3c5f2](https://github.com/dgesteves/diogo-studio/commit/8c3c5f222aaac63e63f7b8b669412dcb162de532))

## [1.10.0](https://github.com/dgesteves/diogo-studio/compare/v1.9.0...v1.10.0) (2026-06-27)


### Features

* **bookshelf:** add procedural book generation with seeded randomization and shelf lighting ([dd33670](https://github.com/dgesteves/diogo-studio/commit/dd33670f3528df91c7c38e7d58c87238bafcb92c))
* **env:** add Vercel URL environment variables with fallback chain and normalization ([cbedbef](https://github.com/dgesteves/diogo-studio/commit/cbedbefc51aadc062944ddfb09b692b4e41364c7))
* **seo:** add node environment directive to structured-data tests ([c947e84](https://github.com/dgesteves/diogo-studio/commit/c947e849b3738d95d7b20f3bc2666799ca532c95))


### Code Refactoring

* **scene:** optimize rendering with instanced meshes and adaptive DPR ([4e95e86](https://github.com/dgesteves/diogo-studio/commit/4e95e86460397b78cd289b81cd6a2981f1391e01))

## [1.9.0](https://github.com/dgesteves/diogo-studio/compare/v1.8.0...v1.9.0) (2026-06-27)


### Features

* **deck:** add radar ping animation for active station and resume nav item ([d803931](https://github.com/dgesteves/diogo-studio/commit/d803931600b91245cd64345a0b55a196bd9e87a4))
* **studio:** add cityscape window with procedural textures and neon-lit buildings ([96700c1](https://github.com/dgesteves/diogo-studio/commit/96700c165881ebeb35c89b10bae3ce4cff4a1b83))


### Code Refactoring

* **lounge-lamp:** reduce bulb and point light intensity for softer ambient lighting ([4b2543f](https://github.com/dgesteves/diogo-studio/commit/4b2543f87c1bf63a7896f20e4d548f2cc7c860f0))
* **seo:** replace dynamic OG image generation with static world-poster image ([0936a4e](https://github.com/dgesteves/diogo-studio/commit/0936a4e50004260e4932d5319d4b6d73ba5c073b))
* **studio:** replace mock metrics/logs with live render stats and studio info ([41ed445](https://github.com/dgesteves/diogo-studio/commit/41ed445216e79192a11b79e7ac2b4fe437ffa596))


### Continuous Integration

* **deps:** bump actions/cache from 5 to 6 ([#113](https://github.com/dgesteves/diogo-studio/issues/113)) ([81be19f](https://github.com/dgesteves/diogo-studio/commit/81be19f71907ec83590349b20cf2de17fb8d0b86))


### Miscellaneous Chores

* **deps:** remove unused Radix UI components and increase Dependabot PR limits ([88f4b9d](https://github.com/dgesteves/diogo-studio/commit/88f4b9d27cd569bcb8aa1375fc7eb8064ad2d2e1))
* **deps:** remove vaul drawer dependency and refactor navigation to command deck ([96f0e2e](https://github.com/dgesteves/diogo-studio/commit/96f0e2e5310b203d113dacc80e657c6453142784))

## [1.8.0](https://github.com/dgesteves/diogo-studio/compare/v1.7.1...v1.8.0) (2026-06-26)


### Features

* **audio:** add ambient music and sound effects system with user toggle ([197b679](https://github.com/dgesteves/diogo-studio/commit/197b679f3ebc4108c6d517be99c3fca1beaf1184))
* **boot:** enhance boot sequence with retro-futuristic visual effects and splash screen ([cda1898](https://github.com/dgesteves/diogo-studio/commit/cda189830a4f2effca47b8ef973c48baac9a5896))
* **config:** add local network IP to allowed dev origins for mobile testing ([ef262a6](https://github.com/dgesteves/diogo-studio/commit/ef262a6e7acf79dd1236217d475ea5f856e9fd08))
* **world:** add boot sequence with loading overlay and audio opt-in ([8bf7a06](https://github.com/dgesteves/diogo-studio/commit/8bf7a06c8a05feb5250f13e9a1cf205d7df53c9f))
* **world:** add day/night theme system with dynamic lighting and post-processing ([6eaae00](https://github.com/dgesteves/diogo-studio/commit/6eaae00b169a1287dbba9ed67bc8a00f73a28a2d))
* **world:** add poster image to fallback view for faster perceived load ([02e4f03](https://github.com/dgesteves/diogo-studio/commit/02e4f039caaa2c1b09ea0e63643490fed99c403a))
* **world:** add responsive camera framing based on viewport aspect ratio ([ed613fd](https://github.com/dgesteves/diogo-studio/commit/ed613fd40bc504f064c0cff0430bd58c29f750e1))
* **world:** adjust panel positioning and add instructional text for mobile viewports ([c6cb1b0](https://github.com/dgesteves/diogo-studio/commit/c6cb1b033a87c9bc4afbde600c86a408c0a6ad72))
* **world:** redesign boot sequence with neon grid backdrop, segmented controls, and enhanced visual polish ([5d364ea](https://github.com/dgesteves/diogo-studio/commit/5d364ea66c0abccbc4aefe65bc47c8467e3808e5))


### Code Refactoring

* **inspector:** convert overlay store to external store pattern with sessionStorage persistence ([614a8b9](https://github.com/dgesteves/diogo-studio/commit/614a8b99b443d919986caa8f24ae1b73943e3e62))
* **studio:** remove unused fallback SVG illustration components ([e73a30a](https://github.com/dgesteves/diogo-studio/commit/e73a30aae859a819ab776672df8f1e830b44d4d1))


### Documentation

* add comprehensive immersive world vision, roadmap, and audio asset guide ([47eac10](https://github.com/dgesteves/diogo-studio/commit/47eac10d9ce6f4915a5c74ccf45e5e4a756f0970))
* **roadmap:** add Phase 9 (boot sequence) and Phase 10 (day/night theme) with session log updates ([40da4b2](https://github.com/dgesteves/diogo-studio/commit/40da4b2a6845c887bc06942b4a7edf63f643406c))


### Tests

* **e2e:** use keyboard press instead of click for hero CTA in command menu test ([de3f726](https://github.com/dgesteves/diogo-studio/commit/de3f72670e332bc260a97866a3588c670f89763c))


### Miscellaneous Chores

* **deps-dev:** bump @types/node from 25.9.3 to 26.0.0 in the types group across 1 directory ([#109](https://github.com/dgesteves/diogo-studio/issues/109)) ([3091e21](https://github.com/dgesteves/diogo-studio/commit/3091e219d1758f65dcd8b792a804153069002b09))
* **deps-dev:** bump lint-staged from 17.0.7 to 17.0.8 in the linting group ([#108](https://github.com/dgesteves/diogo-studio/issues/108)) ([40f1673](https://github.com/dgesteves/diogo-studio/commit/40f16737e570b16c8bf5b3371b2bf4c950bb44e5))
* **deps:** bump sharp from 0.35.1 to 0.35.2 ([#111](https://github.com/dgesteves/diogo-studio/issues/111)) ([eeea33a](https://github.com/dgesteves/diogo-studio/commit/eeea33abd2860a33f857e5279fc4bafc1e28e97b))

## [1.7.1](https://github.com/dgesteves/diogo-studio/compare/v1.7.0...v1.7.1) (2026-06-20)


### Continuous Integration

* add Conventional Commits PR title check ([#105](https://github.com/dgesteves/diogo-studio/issues/105)) ([f9aee72](https://github.com/dgesteves/diogo-studio/commit/f9aee725398b20391fb6833b7c696e7c3c80f848))

## [1.7.0](https://github.com/dgesteves/diogo-studio/compare/v1.6.0...v1.7.0) (2026-06-19)


### Features

* add lounge zone with sofa, coffee table, lamp, rug, and 3-channel TV system ([7a131b7](https://github.com/dgesteves/diogo-studio/commit/7a131b720cb985ee18b13e9448635e6ffdcd4863))


### Code Refactoring

* enhance lounge lamp with warmer bulb colors and brighter lighting ([c4008ce](https://github.com/dgesteves/diogo-studio/commit/c4008ceeed70f1709852cc19234cefaa1f9f275e))


### Continuous Integration

* **deps:** bump pnpm/action-setup from 6.0.8 to 6.0.9 ([#87](https://github.com/dgesteves/diogo-studio/issues/87)) ([eb46b56](https://github.com/dgesteves/diogo-studio/commit/eb46b56f14f014f2a797114ab0076e0b41d19ba8))


### Miscellaneous Chores

* **deps-dev:** bump knip from 6.16.1 to 6.17.1 ([#102](https://github.com/dgesteves/diogo-studio/issues/102)) ([5a3c815](https://github.com/dgesteves/diogo-studio/commit/5a3c815bc3224500d50e2140b6ce568f4f5b1d72))
* **deps-dev:** bump the testing group with 2 updates ([#89](https://github.com/dgesteves/diogo-studio/issues/89)) ([7281ce1](https://github.com/dgesteves/diogo-studio/commit/7281ce124f753c8aad9fcc976f8dc77bf9e56ea6))
* **deps:** bump @ai-sdk/openai from 3.0.69 to 3.0.72 ([#91](https://github.com/dgesteves/diogo-studio/issues/91)) ([2d2cef2](https://github.com/dgesteves/diogo-studio/commit/2d2cef223eefd58230e811c9d9f6ad2ec2dac269))
* **deps:** bump @radix-ui/react-dialog from 1.1.16 to 1.1.17 ([#99](https://github.com/dgesteves/diogo-studio/issues/99)) ([0087b91](https://github.com/dgesteves/diogo-studio/commit/0087b916242fa7cb924e5c571334e7f488b58061))
* **deps:** bump @radix-ui/react-slot from 1.2.5 to 1.3.0 ([#90](https://github.com/dgesteves/diogo-studio/issues/90)) ([353e7b1](https://github.com/dgesteves/diogo-studio/commit/353e7b1e21596743095e6b498f32b53961309dc0))
* **deps:** bump @radix-ui/react-tabs from 1.1.14 to 1.1.15 ([#96](https://github.com/dgesteves/diogo-studio/issues/96)) ([ee0657d](https://github.com/dgesteves/diogo-studio/commit/ee0657d916c9453962935a677f53b028babeb9ee))
* **deps:** bump @radix-ui/react-tooltip from 1.2.9 to 1.2.10 ([#94](https://github.com/dgesteves/diogo-studio/issues/94)) ([0fd2ec5](https://github.com/dgesteves/diogo-studio/commit/0fd2ec543c07da4b4212d0eb08a852e6baadfa2b))
* **deps:** bump @sentry/nextjs from 10.57.0 to 10.58.0 ([#97](https://github.com/dgesteves/diogo-studio/issues/97)) ([692d006](https://github.com/dgesteves/diogo-studio/commit/692d00664ad9f0b93feb500e90d2c8b104107b9d))
* **deps:** bump ai from 6.0.205 to 6.0.207 ([#101](https://github.com/dgesteves/diogo-studio/issues/101)) ([a138fc4](https://github.com/dgesteves/diogo-studio/commit/a138fc4431707ea1dc72aa9ba9ca4a53c60a9d6b))
* **deps:** bump dependencies across multiple packages ([25fec45](https://github.com/dgesteves/diogo-studio/commit/25fec45a6614108d9e46a8ee385bef9c45383c21))
* **deps:** bump dependencies and update commitlint config ([ac57055](https://github.com/dgesteves/diogo-studio/commit/ac57055f6adcc14a8e28aba2d8c510ed79d24f1c))
* **deps:** bump lucide-react from 1.18.0 to 1.20.0 ([#92](https://github.com/dgesteves/diogo-studio/issues/92)) ([139e4f5](https://github.com/dgesteves/diogo-studio/commit/139e4f5feaecdeafa5adf9c19208ba3d34c6de00))

## [1.6.0](https://github.com/dgesteves/diogo-studio/compare/v1.5.0...v1.6.0) (2026-06-17)


### Features

* add furniture hotspot system with radial glow and neon labels for 7 routes ([2189f2f](https://github.com/dgesteves/diogo-studio/commit/2189f2fa862d8d19409418a041f5515e824305af))


### Code Refactoring

* migrate about page to DestinationView with media slot support ([d435180](https://github.com/dgesteves/diogo-studio/commit/d435180d2091d8136d9413a12a87c5b756bf2ddd))
* remove standalone studio section and migrate to wall-screen system ([a11594b](https://github.com/dgesteves/diogo-studio/commit/a11594bdb5f1346b98641c51853cdc87d0937db7))


### Documentation

* remove immersive-world-plan.md after M1/M2 completion ([3ca51eb](https://github.com/dgesteves/diogo-studio/commit/3ca51eb36efc1bd39c825254144b4fb41e5e0b31))

## [1.5.0](https://github.com/dgesteves/diogo-studio/compare/v1.4.4...v1.5.0) (2026-06-15)


### Features

* add glowing wall-screens for resume, timeline, stack, principles, playground ([f920cd7](https://github.com/dgesteves/diogo-studio/commit/f920cd746daf7994d083b388a19379f820a2b8e8))
* add timeline and work pages with content, refactor home to immersive landing ([c210a1d](https://github.com/dgesteves/diogo-studio/commit/c210a1dfd8adcee56c1e7fbdb46b81b6583aff5c))


### Code Refactoring

* consolidate static data into constants directories ([b7e7de5](https://github.com/dgesteves/diogo-studio/commit/b7e7de5d72f5340592bc48e14976581b97e6d461))
* update hero section layout from centered to left-aligned card design ([0a452b0](https://github.com/dgesteves/diogo-studio/commit/0a452b024a930f02e3d4664ade7ee60c3aed0c03))


### Documentation

* add immersive world build plan and create 14 destination route pages ([956968f](https://github.com/dgesteves/diogo-studio/commit/956968f29dc8c410d651ad0a1ecd6e252af40851))
* lock immersive world plan decisions and mark M1 shipped, update M2 approach ([7238a2c](https://github.com/dgesteves/diogo-studio/commit/7238a2c54c220cb5180c7aa7711cb1121db116eb))
* update architecture to consolidate static data into constants directories ([f3c44f1](https://github.com/dgesteves/diogo-studio/commit/f3c44f12909386e6a9f566b7272ec42a7dd9fe0a))


### Tests

* move operating-altitudes section test from home to work page spec ([8a2c24e](https://github.com/dgesteves/diogo-studio/commit/8a2c24ec76563bd34821197739552690ad039d78))


### Miscellaneous Chores

* **deps-dev:** bump @types/node in the types group across 1 directory ([#75](https://github.com/dgesteves/diogo-studio/issues/75)) ([6cce369](https://github.com/dgesteves/diogo-studio/commit/6cce3692fbfbef71833a87cb6145359fedfbfe14))
* **deps-dev:** bump @types/three in the types group ([#66](https://github.com/dgesteves/diogo-studio/issues/66)) ([0ed1d0a](https://github.com/dgesteves/diogo-studio/commit/0ed1d0ab7826c09058b08335a52148fcb48cf114))
* **deps-dev:** bump prettier from 3.8.3 to 3.8.4 in the linting group ([#65](https://github.com/dgesteves/diogo-studio/issues/65)) ([1fa504e](https://github.com/dgesteves/diogo-studio/commit/1fa504ecb792fe98d4f63922fec328ae32021ba5))
* **deps-dev:** bump tsx from 4.22.3 to 4.22.4 ([#70](https://github.com/dgesteves/diogo-studio/issues/70)) ([292bd90](https://github.com/dgesteves/diogo-studio/commit/292bd90ffdcbd00acedc0c4059a2fb9bbf4ec659))
* **deps:** bump @ai-sdk/openai from 3.0.68 to 3.0.69 ([#69](https://github.com/dgesteves/diogo-studio/issues/69)) ([4396ed6](https://github.com/dgesteves/diogo-studio/commit/4396ed6b00ac563d3c4fc77dfd49c8e8e54516c7))
* **deps:** bump @radix-ui/react-tooltip from 1.2.8 to 1.2.9 ([#71](https://github.com/dgesteves/diogo-studio/issues/71)) ([67cf616](https://github.com/dgesteves/diogo-studio/commit/67cf61685a7602747457e4b265542272086446b0))
* **deps:** bump @sentry/nextjs from 10.56.0 to 10.57.0 ([#67](https://github.com/dgesteves/diogo-studio/issues/67)) ([926ccb6](https://github.com/dgesteves/diogo-studio/commit/926ccb641c1f69a56e75c6d133b352c48092b6fc))
* **deps:** bump ai from 6.0.197 to 6.0.199 ([#72](https://github.com/dgesteves/diogo-studio/issues/72)) ([4f8971e](https://github.com/dgesteves/diogo-studio/commit/4f8971e47954e8a096f0905be96f5308216c4dcb))
* **deps:** bump ai from 6.0.199 to 6.0.205 ([#76](https://github.com/dgesteves/diogo-studio/issues/76)) ([ba3dfba](https://github.com/dgesteves/diogo-studio/commit/ba3dfbac792c7abb9d9c6feed4895f847228424a))
* **deps:** bump lucide-react from 1.17.0 to 1.18.0 ([#80](https://github.com/dgesteves/diogo-studio/issues/80)) ([4bfe581](https://github.com/dgesteves/diogo-studio/commit/4bfe58182a2014bad03548a148caa935124d6047))
* **deps:** bump react-hook-form from 7.77.0 to 7.78.0 ([#68](https://github.com/dgesteves/diogo-studio/issues/68)) ([75219dc](https://github.com/dgesteves/diogo-studio/commit/75219dce006987a5844948289816694787d30a7a))
* **deps:** bump sharp from 0.34.5 to 0.35.1 ([#79](https://github.com/dgesteves/diogo-studio/issues/79)) ([d63a118](https://github.com/dgesteves/diogo-studio/commit/d63a118aed4807190c58a7e4573893e2f9c92951))
* **deps:** bump the next group with 3 updates ([#73](https://github.com/dgesteves/diogo-studio/issues/73)) ([1b05adf](https://github.com/dgesteves/diogo-studio/commit/1b05adfe3cf293b3ad9f2907411d36e106bc1be4))
* remove unused dependencies and simplify README ([a3e6443](https://github.com/dgesteves/diogo-studio/commit/a3e6443e87cde50693648a19d6fc3384041d4287))
* upgrade Node.js from 22 to 24 and bump pnpm to 11.7.0 ([3e46f18](https://github.com/dgesteves/diogo-studio/commit/3e46f1856f3f1ab5767156f689285c1196d2ea6c))

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
