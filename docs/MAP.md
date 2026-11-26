# 地図（shoot）

読むときは、この地図 → `grep -n 'ことば' src/js/*.js | cut -c1-200` → その前後だけ読む（Read の offset と limit）。直すのは Edit で変わる所だけ。
行の目安は 2026-11-22（#26 で src/ に分けたとき）。大きくずれたら直す。

## 直すのは src/（index.html は自動で作る）
- **index.html は手で直さない**（ビルドで作る出口。遊ぶ人・工房・App Store はこれを開く）。直すのは src/ → `node tools/build.mjs` で index.html を作りなおし、両方をコミット
- `node tools/build.mjs --check`：いまの index.html が src/ から作ったものと同じか（ずれていれば止まる）。`npm test` はこれと `node tools/bgm/check_songs.js`
- つなぎ方：src/shell.html の `/*@@style.css@@*/` の行に src/style.css、`/*@@js@@*/` の行に src/js/*.js を下の表の順にそのままつなぐ（中身は1文字も変えない）。順は tools/build.mjs の `JS`
- JS は全部で1つの `(()=>{ … })();` の中。data.js のはじめに `(()=>{`、title.js の終わりに `})();` がある（ファイル1つだけでは動かない。つないで1つ）
- tools/test/ のテストと check_songs.js は index.html を読む → src/ を直したら先にビルド

## ファイル
| ファイル | 役目 |
|---|---|
| src/shell.html | HTML のわく（head・タイトル・遊び方・格納庫・#comm・ショップ・研究所・図鑑・実績・出撃・#overlay） |
| src/style.css | CSS（27 タイトル・52 格納庫・86 はじめの案内・95 整備士の通信 .comm・155 ショップ・200 出撃・275 研究所や図鑑の入口とレベルアップ・せまい画面・作りこみの動き fx と reduced-motion） |
| src/js/（下の表） | ゲームのコード |
| index.html | 自動で作る（上）。絵と音はコードで作るので base64 の行はない |
| tools/build.mjs | src → index.html（Node の標準だけ・#26） |
| tools/test/*.py | テスト（Playwright）。harness14.py がテスト用のコピー（window.__T に中身を出す）を作る。記録は docs/TESTS.md。重さは perf34（全機体の終盤・描く命令の数）・見た目が変わっていないかは same34（前の index.html とドットをくらべる） |
| tools/art-ref/ | ドット絵の描き方の見本（README.md・ship_v2.py） |
| docs/design/ | 試作6の設計（parts・ships・upgrades・stages・unlocks） |
| tools/bgm/ | check_songs.js（曲のデータの点検：16こま・音の名前・和音・音域・長さ）・jukebox.py（音の一覧のページを作る：12曲を A・B で・効果音ぜんぶ。`python3 tools/bgm/jukebox.py 出力.html`） |
| tools/cover/・docs/kobo/cover.png | ゲーム工房の表紙（800x1200・ゲームのドット絵で描く）。`FONTS=<@fontsource/dotgothic16> python3 tools/cover/cover.py` で作りなおす。タイトルのロゴの形（src/js/title.js の LOGO）もここから |
| docs/kobo/gamecenter.json・achievements/・tools/badges/ | App Store の Game Center（11/26・#42）：ランキング shoot_best と実績15こ（アプリの【ios】が読む）。バッジは `python3 tools/badges/badges.py [一覧.png]` でゲームのドット絵から作る（場面は badges.js の SCENE） |
| docs/ART.md | 絵の作り方 |
| docs/shots/ | テストのスクショ（自動で作る・読まない） |
| RELEASES.md・.github/workflows/release.yml・tools/release/ | 工房に出す版（v1.0〜）。版を足して main にマージすると Actions がタグと Releases を作る（いも工場と同じ形） |

## src/js の中（つなぐ順・数字はそのファイルの行）
| ファイル | 中身 |
|---|---|
| data.js | はじめの `(()=>{` と道具（$・clamp・rand）・データ：25 MODS（装備69）・155 UNLOCK（ショップの品の解放）・188 EVO（進化）・道中の強化・293 LAB（研究所）・313 LAB_UNLOCK・343 STAGES・354 SHIPS（枠の場所 slots もここ） |
| art-ships.js | ドット絵の道具：49 paint（描く道具）・125 MECH（整備士の顔）・自機・炎・装備の絵 |
| art-enemies.js | 敵の絵（ステージ2〜5・大型）・岩・小さい絵・爆発・ヒットの光・星雲と惑星 |
| art-stage.js | ステージの背景・lazyPut（絵は使うときに作る）・向きのある敵・弾・進化の絵・試作6の絵・アイコン・メダル |
| save.js | 7 freshSave・27 ACH（実績）・56 loadSave（古いセーブの直し）・102 persist・104 resetSave（最初から：BGM と SE だけ残す）・解放の条件・setShip |
| sfx.js | 効果音 SFX（Web Audio。ac と comp を BGM と共有） |
| bgm.js | BGM_STYLE・BGM_SG・BGM_VOL・7〜323 SONGS（`/* SONGS:BEGIN */`〜`END`・読まずに check_songs で点検）・325 BGM（play・kick・duck・reset・setStyle・check・render） |
| hangar.js | 格納庫：44 drawEditor・68 snapAt・92 popAt・128 tutGuide・159 TALK（整備士のセリフ）・180 commShow・225 renderEquip・261 openSheet・270 fxRestart（countUp・rollNum・tilesIn も下に）・297 openList・324 openDir・339 openAim・364 openInfo・スワイプ |
| menus.js | 7 renderShop・77 renderLab・97 buyFx・図鑑・154 renderAch |
| sortie.js | 出撃：25 calcCS（共通の数字）・91 startRun・敵の出し方・しかけ・当たり・ダメージ・敵の動き・弾 |
| weapons.js | 攻撃の装備30種（近接・輪・投げた弾・追尾レーザー・砲台・衛星） |
| gear.js | 防御・補助の装備・進化・その絵・試作6の弾の絵 |
| special.js | 必殺技・支援・宝箱を受け取る・はじめに絵を描いておく |
| loop.js | 背景の星・12 update・描く道具 px2・80 PXG（描く回数をへらす包み・#34。ここだけで1つ）・161 draw・282 hud・289 frame |
| levelup.js | 65 openLevelUp・98 pickChoice・122 openChest・えらんだあとの動き・146 endRun（結果）・エンディング・出撃の操作 |
| shots.js | App Store のスクショの場面（11/24）。navigator.webdriver のときだけ、location.hash='shot=<名前>' で title・battle・levelup・boss・hangar・shop・lab を出す（shotSave＝見本のセーブ・shotRun＝出撃を決まったこま数進めて fxHold で止める）。ios-kobo の apps/shoot/app.json の台本から呼ぶ |
| gamecenter.js | Game Center（11/26）：GC_ACH（ACH のうち15こ・id は shoot_＋小文字）・gcAch・gcScore（rec.bestKills）・gcSync（開いたとき・load・app-gamecenter）。呼ぶ所は checkAch（save.js）・出撃の結果（levelup.js）・起動（title.js） |
| title.js | 4 titleBg（機体はボタンにかからない高さに）・35 pixWipe・48 showTitle・音の ON・OFF・遊び方・最初から（resetAsk の窓）・118 LOGO と drawLogo・起動（showTitle）・おわりの `})();` |

## 決まり
- セーブのキーと形は変えない（古いセーブは loadSave で直す）
- 動き（animation）の名前は fx ではじめる。copy16 は fx と案内の指だけ許す
- 整備士の通信（11/17）：セリフは TALK だけ。セリフの中だけ「！」と語りかけを使う（ほかの文は言いきり。copy16 は TALK と #comm を見ない）。wait（タップで次へ・ほかは暗くして押せない＝あいさつ・研究所のはじめて）・tip（案内の段）・note（解放のお知らせ・吹き出しをタップかしばらくで次へ・ヘッダーの下に出す）。セリフの行は「\n」で手で切る（1行12字まで＝幅320でも入る）。クラス名は cm ではじめる（.top・.ctop・.cbody はほかで使っている）。セーブの talk.lab＝研究所のひとこと済み。テストであいさつを進めるのは harness14 の talk_through
- 作りこみの動きの道具：openSheet のすぐ下に fxRestart（動きをはじめから）・countUp（数字のかぞえ上げ）・rollNum（お金の数を動かす）・tilesIn（タイルを左上から敷く）。closeSheet は写しを横へ出す。buyFx は buyLab のすぐ上。RM() が true（reduced-motion か window.__NOFX）なら動かさない
- テストは fx を止めて動く（harness14 の open_page が window.__NOFX=true にする）。動かして点検するのは copy16 の fx_check（open_page(..., fx=True)）
- 出撃の画面の絵（#34・11/17）：draw() の g は PXG（ctx の包み）。小さい四角（fillRect・px2・px3）がたくさん並ぶ所は g.dense(1)〜g.dense(0) で囲む（いまは近接の振り・輪・シールドと雷の印・いなずま・弾・追尾レーザーと狙撃の線）。
  囲みの中の小さい四角は書きとめて、出すときに「帯（32行）1つに80回より多い」ならまとめて手元で重ねて帯ごとに1回で、少なければそのまま描く。絵（drawImage）・大きい四角・回転の前と draw の終わりには自動で出すので、描く順番は変わらない。
  新しく点をたくさん描く飾りを足すときは dense で囲む。囲みの中でも、ふつうに g.fillStyle・g.globalAlpha・g.drawImage・g.save/translate/restore を使ってよい。色は '#rrggbb'・'#rgb'・'rgb()'・'rgba()'。
  ほかのキャンバス（タイトル・格納庫）には関係しない。重さは perf34、見た目は same34 で確かめる
- separate（敵どうしの押し合い）は near と同じ順でマスを見る形（敵ごとに関数を作らない）
- 音（#37）：曲を足す・直すのは src/js/bgm.js の SONGS だけ（和音1小節に1つ・メロディ1小節16こま・ベースと分散和音と打楽器は和音から）。場面の曲は BGM.play(名前)。BGM と効果音の ON・OFF はべつべつ（save.bgm・save.snd）。点検は tools/test/bgm37.py
- 自動で作るファイル：index.html（src/ から node tools/build.mjs で作る・手で直さない・読まない）・docs/shots/・tools/test/__pycache__（読まない・手で直さない）
