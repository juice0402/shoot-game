# ぜんぶのせシップ（記号 shoot・シューティング × サバイバー）

- 企画メモ：claude.ai プロジェクト「ネット副業」の claude/shoot-game-idea.md（引き継ぎは claude/shoot-handoff.md）
- 地図：docs/MAP.md（読むときは地図 → grep → その前後だけ。claude/code-rules.md の A）
- index.html 1つで動く（遊ぶ人が開く出口。場所・形・セーブのキーは変えない）
- 直すのは src/（直す前に docs/MAP.md）。直したら `node tools/build.mjs` で index.html を作り、両方をコミット。**index.html は手で直さない**（`node tools/build.mjs --check`・`npm test` でずれを見る）
- 公開：あそびトークのゲーム工房（v1.0 から）→ 最後は App Store（【ios】）
- 版を出す：RELEASES.md のいちばん上に版を足す PR →「マージして」→ Actions（release.yml）がタグを作る → 司令塔が工房に取りこむ
- テスト：tools/test/（記録は docs/TESTS.md）。お金・全部解放は harness14 の __T.dbgGold・__T.dbgUnl（ゲームの中の試作用ボタンは v1.0 の前に消した）
- しょーくんへの返事はスマホで読みやすく。コードは聞かれたときだけ見せる
