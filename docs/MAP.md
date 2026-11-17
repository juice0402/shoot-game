# 地図（shoot）

読むときは、この地図 → `grep -n 'ことば' index.html | cut -c1-200` → その前後だけ読む（Read の offset と limit）。直すのは Edit で変わる所だけ。
行の目安は 2026-11-17（#34 のあと・全部で約4,760行・約420KB）。大きくずれたら直す。

## ファイル
| ファイル | 役目 |
|---|---|
| index.html | ゲームのすべて（CSS・HTML・JS が1つ）。遊ぶ人が開く出口。絵と音はコードで作るので base64 の行はない |
| tools/test/*.py | テスト（Playwright）。harness14.py がテスト用のコピー（window.__T に中身を出す）を作る。記録は docs/TESTS.md。重さは perf34（全機体の終盤・描く命令の数）・見た目が変わっていないかは same34（前の index.html とドットをくらべる） |
| tools/art-ref/ | ドット絵の描き方の見本（README.md・ship_v2.py） |
| docs/design/ | 試作6の設計（parts・ships・upgrades・stages・unlocks） |
| tools/cover/・docs/kobo/cover.png | ゲーム工房の表紙（800x1200・ゲームのドット絵で描く）。`FONTS=<@fontsource/dotgothic16> python3 tools/cover/cover.py` で作りなおす。タイトルのロゴの形（index.html の LOGO）もここから |
| docs/ART.md | 絵の作り方 |
| docs/shots/ | テストのスクショ（自動で作る・読まない） |

## index.html の中
| 行 | 節 |
|---|---|
| 1〜375 | CSS（27 タイトル・52 格納庫・86 はじめの案内・95 整備士の通信 .comm・155 ショップ・200 出撃・275 研究所や図鑑の入口とレベルアップ・375 せまい画面・その下に作りこみの動き fx と reduced-motion） |
| 375〜530 | HTML（タイトル・遊び方・格納庫・461 #comm（通信）・ショップ・研究所・図鑑・実績・出撃・#overlay） |
| 531〜 | データ：545 MODS（装備69）・675 UNLOCK（ショップの品の解放）・708 EVO（進化）・758 道中の強化・813 LAB（研究所）・833 LAB_UNLOCK（研究所の解放）・863 STAGES・874 SHIPS（枠の場所 slots もここ） |
| 945〜1650 | ドット絵：995 paint（描く道具）・1068 MECH（整備士の顔・口2コマ）・その下に絵（機体・装備・敵・アイコン） |
| 1650〜1870 | ステージの背景 |
| 1870〜1990 | セーブ：1878 freshSave・1898 ACH（実績）・1927 loadSave（古いセーブの直し）・1973 persist |
| 1995〜2175 | 効果音 SFX（Web Audio。名前と鳴らし方の表。comm・talk は通信。ac と comp を BGM と共有） |
| 2175〜 | BGM（#37）：BGM_STYLE・BGM_VOL・SONGS（`/* SONGS:BEGIN */`〜`END`・曲のデータ）・bgmOn・BGM（play・kick・duck・reset・check・render）。場面ごとの play は showTitle・toHangarFromTitle・startRun・addBig・killed・winStart・endRun・結果の toHangar |
| 2166〜2550 | 格納庫：2212 drawEditor（機体と装備を描く）・2236 snapAt（装備がはまる動き）・その下に popAt（外す動き）・2296 tutGuide（はじめの案内）・2326 TALK（整備士のセリフ）と通信（commShow・commTip・talkUnl）・2392 renderEquip・2428 openSheet（板・作りこみの道具）・2464 openList・2491 openDir（向きの板）・2506 openAim・2531 openInfo（くわしく） |
| 2551〜2745 | ショップ（2551 renderShop）・研究所（2621 renderLab）・図鑑・実績 |
| 2746〜4116 | 出撃：2749 calcCS（共通の数字）・2815 startRun・敵の動き・攻撃の装備・防御と補助と進化・必殺技・支援 |
| 4128〜4410 | 4128 update・4196 PXG（描く回数をへらす包み・#34）・4277 draw・4398 hud・4405 frame（fxHold の間は止める） |
| 4411〜4690 | レベルアップ：4477 openLevelUp・その下に pickChoice・ghostCards（えらんだあとの動き）・openChest・4558 endRun（結果の画面） |
| 4692〜 | タイトル・遊び方（いちばん下に LOGO と drawLogo＝タイトルのロゴ「ぜんぶのせシップ」）：4692 pixWipe（画面の切りかえ）・4705 showTitle・その下に toHangarFromTitle |

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
- 自動で作るファイル：docs/shots/・tools/test/__pycache__（読まない・手で直さない）
