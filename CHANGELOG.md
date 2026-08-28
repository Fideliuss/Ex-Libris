# Changelog

Historique figé : généré automatiquement par release-please jusqu'à la
version 1.3.0, cet outil a été retiré ensuite. Pas de mise à jour
automatique au-delà de cette entrée.

## [1.3.0](https://github.com/Fideliuss/Ex-Libris/compare/ExLibris-v1.2.0...ExLibris-v1.3.0) (2026-08-24)


### Features

* add a "Continuer avec Google" sign-in button ([#60](https://github.com/Fideliuss/Ex-Libris/issues/60)) ([3e134ca](https://github.com/Fideliuss/Ex-Libris/commit/3e134ca4db1d0ce1397aa18994310e263ef9f28c))
* label the add-book button on desktop, keep it compact on mobile ([#61](https://github.com/Fideliuss/Ex-Libris/issues/61)) ([4948066](https://github.com/Fideliuss/Ex-Libris/commit/4948066a917f552084f39a2792da8fd8a991109b))


### Bug Fixes

* keep the account badge anchored top-right on mobile ([#57](https://github.com/Fideliuss/Ex-Libris/issues/57)) ([105d82d](https://github.com/Fideliuss/Ex-Libris/commit/105d82d629aa24e82f6683b3a5f21e67f0cc32ef))

## [1.2.0](https://github.com/Fideliuss/Ex-Libris/compare/ExLibris-v1.1.1...ExLibris-v1.2.0) (2026-08-22)


### Features

* add a bookmark tab badge for the reading status ([#33](https://github.com/Fideliuss/Ex-Libris/issues/33)) ([24056ef](https://github.com/Fideliuss/Ex-Libris/commit/24056ef991d82ff3bedcea9554a9ac047db26979))
* add a Collection field, distinct from tags, with a migration tool ([#28](https://github.com/Fideliuss/Ex-Libris/issues/28)) ([4af5b59](https://github.com/Fideliuss/Ex-Libris/commit/4af5b598e1ed9ff1e2498c34bd6868a6276675b0))
* add a cover-wall mosaic to Stats ([#47](https://github.com/Fideliuss/Ex-Libris/issues/47)) ([def4e51](https://github.com/Fideliuss/Ex-Libris/commit/def4e513f238880336df785b14f9ae56f5d169de))
* add a filter by universe for comics ([#36](https://github.com/Fideliuss/Ex-Libris/issues/36)) ([6c8c3c1](https://github.com/Fideliuss/Ex-Libris/commit/6c8c3c1587a262dd46fd1ab9283c789a337f202b))
* add a GitHub-style reading heatmap to Stats ([#46](https://github.com/Fideliuss/Ex-Libris/issues/46)) ([bd7aaee](https://github.com/Fideliuss/Ex-Libris/commit/bd7aaeeb78c97f2337b071e47c17068c9b53d1a5))
* add a Par collection breakdown to the stats page ([#31](https://github.com/Fideliuss/Ex-Libris/issues/31)) ([16a32ff](https://github.com/Fideliuss/Ex-Libris/commit/16a32ff302766a105947a1788977d46302202e2b))
* add a period filter, reading-pace metrics, and ratings distribution to Stats ([#45](https://github.com/Fideliuss/Ex-Libris/issues/45)) ([e2839e1](https://github.com/Fideliuss/Ex-Libris/commit/e2839e1d06bdc013185f155d8397b9386b8f7247))
* add a type breakdown donut chart to Stats ([#48](https://github.com/Fideliuss/Ex-Libris/issues/48)) ([b840ce1](https://github.com/Fideliuss/Ex-Libris/commit/b840ce136ef92b26b12f6d5698638307cb5eca9a))
* add BNF catalog as a third ISBN lookup fallback ([#35](https://github.com/Fideliuss/Ex-Libris/issues/35)) ([4e2bbda](https://github.com/Fideliuss/Ex-Libris/commit/4e2bbda731c9967b649c28edaa3a9257e5150399))
* add translator and illustrator fields, distinct from author ([#25](https://github.com/Fideliuss/Ex-Libris/issues/25)) ([2508cc7](https://github.com/Fideliuss/Ex-Libris/commit/2508cc7a5a87bf0ba75d91cf73f2f1e5b1bd950c))
* color-coded status signal (wishlist=blue ribbon, reading=yellow, read=green stamp) ([#27](https://github.com/Fideliuss/Ex-Libris/issues/27)) ([29350e5](https://github.com/Fideliuss/Ex-Libris/commit/29350e5aab79facfd42d32930fba76a748890d5e))
* differentiate books/BD/comics/manga, with a universe field for comics ([#24](https://github.com/Fideliuss/Ex-Libris/issues/24)) ([d52923f](https://github.com/Fideliuss/Ex-Libris/commit/d52923f529b7d4acf23e6476f5499496b8e36052))
* multi-select tag filtering and bulk tag removal ([#29](https://github.com/Fideliuss/Ex-Libris/issues/29)) ([f79d092](https://github.com/Fideliuss/Ex-Libris/commit/f79d092a6fc26ad8d5516b397b5579db419a7bc5))
* redesign the Stats overview tab around a reading objective ([#50](https://github.com/Fideliuss/Ex-Libris/issues/50)) ([569e060](https://github.com/Fideliuss/Ex-Libris/commit/569e06006842d53e3ca228d5124ee5876210a72f))
* replace plain 'Chargement...' text with a floating-logo loading screen ([#42](https://github.com/Fideliuss/Ex-Libris/issues/42)) ([4e6f08d](https://github.com/Fideliuss/Ex-Libris/commit/4e6f08deae783a08b0b20f53b2cd08c9546d1bc3))
* reveal a selection circle on card hover as a shortcut into bulk-select ([#38](https://github.com/Fideliuss/Ex-Libris/issues/38)) ([f19ff58](https://github.com/Fideliuss/Ex-Libris/commit/f19ff58ea819283df8f1a93a5b275892c5c464a4))
* show translator/illustrator and date-added on the book detail page ([#44](https://github.com/Fideliuss/Ex-Libris/issues/44)) ([22b73d7](https://github.com/Fideliuss/Ex-Libris/commit/22b73d78f3425a61e80a9dc871334f62010e9725))
* slide-in panel transition when opening a book detail ([#41](https://github.com/Fideliuss/Ex-Libris/issues/41)) ([34df28a](https://github.com/Fideliuss/Ex-Libris/commit/34df28ac9876408e749fbbc6526b20813673d383))
* sort by volume number when a series filter is active ([#26](https://github.com/Fideliuss/Ex-Libris/issues/26)) ([ecad3bb](https://github.com/Fideliuss/Ex-Libris/commit/ecad3bbde05bba0147d8d2192903ee02dbef8501))
* split Stats into 3 tabs and redesign the library-composition panels ([#49](https://github.com/Fideliuss/Ex-Libris/issues/49)) ([ca5c200](https://github.com/Fideliuss/Ex-Libris/commit/ca5c2004e42cf74d87e5db490706f2c9fa0cd171))


### Bug Fixes

* header caused horizontal scroll on mobile ([#43](https://github.com/Fideliuss/Ex-Libris/issues/43)) ([2cd8c62](https://github.com/Fideliuss/Ex-Libris/commit/2cd8c629c99605414aceafceed59fb2e2b1cfc68))
* move quick status-change to the book detail page ([#37](https://github.com/Fideliuss/Ex-Libris/issues/37)) ([27143bb](https://github.com/Fideliuss/Ex-Libris/commit/27143bb74def677cd8d7350513edbfd855abdda1))
* navigating away and back to the collection lost all filters ([#34](https://github.com/Fideliuss/Ex-Libris/issues/34)) ([c0b8bd5](https://github.com/Fideliuss/Ex-Libris/commit/c0b8bd5b3594f830bc64cf420aa75bec0c264b65))
* reset ErrorBoundary on route change and show friendlier error messages ([#23](https://github.com/Fideliuss/Ex-Libris/issues/23)) ([f2374a5](https://github.com/Fideliuss/Ex-Libris/commit/f2374a5b2ef48c4bec05992d5916560fd90072ef))
* saving an edit then clicking Retour landed back on the edit form ([#40](https://github.com/Fideliuss/Ex-Libris/issues/40)) ([d5b5777](https://github.com/Fideliuss/Ex-Libris/commit/d5b5777df10263b7771b149cd5c3d0dc82c2fc4b))
* stop cropping book covers whose aspect ratio doesn't match the 2:3 box ([#39](https://github.com/Fideliuss/Ex-Libris/issues/39)) ([6057a4b](https://github.com/Fideliuss/Ex-Libris/commit/6057a4b51a2dbc8e1e851e80c58aa8d4e38b4d27))
* use pill multi-select for bulk tag removal ([#30](https://github.com/Fideliuss/Ex-Libris/issues/30)) ([e4117be](https://github.com/Fideliuss/Ex-Libris/commit/e4117be0dd38e18a7098d75d19a9c0402031a6b4))
* wishlist ribbon showed a chopped-off end on narrower cards ([#32](https://github.com/Fideliuss/Ex-Libris/issues/32)) ([e56c199](https://github.com/Fideliuss/Ex-Libris/commit/e56c19948d4f923d03ee9b29816b7494c4dc2024))

## [1.1.1](https://github.com/Fideliuss/Ex-Libris/compare/ExLibris-v1.1.0...ExLibris-v1.1.1) (2026-08-20)


### Bug Fixes

* look up the actual release-please PR head SHA instead of the workflow_run's own commit ([#16](https://github.com/Fideliuss/Ex-Libris/issues/16)) ([1c0d494](https://github.com/Fideliuss/Ex-Libris/commit/1c0d4948cc489ebe239d98046f285000977c3707))

## [1.1.0](https://github.com/Fideliuss/Ex-Libris/compare/ExLibris-v1.0.0...ExLibris-v1.1.0) (2026-08-20)


### Features

* run build check on release-please PRs via workflow_run ([54073fe](https://github.com/Fideliuss/Ex-Libris/commit/54073fe260a830873f19751a1a76e2c15775e44b))
* run the build check on release-please PRs via workflow_run ([#13](https://github.com/Fideliuss/Ex-Libris/issues/13)) ([1cf1bdb](https://github.com/Fideliuss/Ex-Libris/commit/1cf1bdb3e93aa87d8cabb283898531ef65424608))

## 1.0.0 (2026-08-20)


### Features

* add bulk selection for batch delete, status change, and tag add ([#6](https://github.com/Fideliuss/Ex-Libris/issues/6)) ([643eebc](https://github.com/Fideliuss/Ex-Libris/commit/643eebcd71d734f2095447c377db7d3abac71e75))
* add household sharing between Brayan and Bradley ([#4](https://github.com/Fideliuss/Ex-Libris/issues/4)) ([5e56d3a](https://github.com/Fideliuss/Ex-Libris/commit/5e56d3a5c7e896b7b087426ccb5e9fce70b19620))
* add PWA support with installable manifest and app shell caching ([#3](https://github.com/Fideliuss/Ex-Libris/issues/3)) ([e327669](https://github.com/Fideliuss/Ex-Libris/commit/e3276697521a9d472fa9d57c70b52ee5e399cc26))
* add sort options to the collection view ([#5](https://github.com/Fideliuss/Ex-Libris/issues/5)) ([5928d44](https://github.com/Fideliuss/Ex-Libris/commit/5928d441c2d9eac4ca46af52ba497f422597cd30))


### Bug Fixes

* pin release-please target-branch to main ([3caf423](https://github.com/Fideliuss/Ex-Libris/commit/3caf423355b56558dd676e03f44a4616f0f25ce8))
* pin release-please target-branch to main ([#9](https://github.com/Fideliuss/Ex-Libris/issues/9)) ([20029fe](https://github.com/Fideliuss/Ex-Libris/commit/20029feaaa2e9d099e8950c2bb3dd910f32ec8e1))
* surface the actual Supabase sign-in error instead of a generic message ([#7](https://github.com/Fideliuss/Ex-Libris/issues/7)) ([0ce3b73](https://github.com/Fideliuss/Ex-Libris/commit/0ce3b73a2f68899e698cbd9fd390970a3582c675))
