# 地図（shoot）

読むときは、この地図 → `grep -n 'ことば' index.html | cut -c1-200` → その前後だけ読む（Read の offset と limit）。直すのは Edit で変わる所だけ。
行の目安は 2026-11-16（全部で約4,400行・約385KB）。大きくずれたら直す。

## ファイル
| ファイル | 役目 |
|---|---|
| index.html | ゲームのすべて（CSS・HTML・JS が1つ）。遊ぶ人が開く出口。絵と音はコードで作るので base64 の行はない |
| tools/test/*.py | テスト（Playwright）。harness14.py がテスト用のコピー（window.__T に中身を出す）を作る。記録は docs/TESTS.md |
| tools/art-ref/ | ドット絵の描き方の見本（README.md・ship_v2.py） |
| docs/design/ | 試作6の設計（parts・ships・upgrades・stages・unlocks） |
| docs/ART.md | 絵の作り方 |
| docs/shots/ | テストのスクショ（自動で作る・読まない） |

## index.html の中
| 行 | 節 |
|---|---|
| 1〜330 | CSS（27 タイトル・52 格納庫・140 ショップ・186 出撃・261 研究所や図鑑の入口とレベルアップ・328 せまい画面・その下に作りこみの動き fx と reduced-motion） |
| 330〜478 | HTML（タイトル・遊び方・格納庫・ショップ・研究所・図鑑・実績・出撃・#overlay） |
| 479〜 | データ：492 MODS（装備69）・622 UNLOCK（ショップの品の解放）・655 EVO（進化）・705 道中の強化・760 LAB（研究所）・780 LAB_UNLOCK（研究所の解放）・810 STAGES・821 SHIPS |
| 894〜1554 | ドット絵：894 描く道具・1013 絵（機体・装備・敵・アイコン） |
| 1555〜1763 | ステージの背景 |
| 1764〜1884 | セーブ：1770 freshSave・1790 ACH（実績）・1819 loadSave（古いセーブの直し）・1864 persist |
| 1885〜2054 | 効果音 SFX（Web Audio。名前と鳴らし方の表） |
| 2055〜2304 | 格納庫：2096 drawEditor（機体と装備を描く）・2119 snapAt（装備がはまる動き）・2163 tutGuide（はじめの案内）・2184 renderEquip・2228 openList・2254 openDir（向きの板）・2269 openAim・2291 openInfo（くわしく） |
| 2305〜2480 | ショップ（2311 renderShop）・研究所（2381 renderLab）・図鑑・実績 |
| 2481〜3871 | 出撃：2505 calcCS（共通の数字）・2571 startRun・敵の動き・2984 攻撃の装備・3228 防御と補助と進化・3594 必殺技・3759 支援 |
| 3872〜4066 | 3872 update・3938 draw・4059 frame（fxHold の間は止める） |
| 4067〜4308 | レベルアップ：4131 openLevelUp・4164 pickChoice・4176 ghostCards（えらんだあとの動き）・4188 openChest・4212 endRun（結果の画面） |
| 4309〜 | タイトル・遊び方：4339 pixWipe（画面の切りかえ）・4352 showTitle・4356 toHangarFromTitle |

## 決まり
- セーブのキーと形は変えない（古いセーブは loadSave で直す）
- 動き（animation）の名前は fx ではじめる。copy16 は fx と案内の指だけ許す
- 作りこみの動きの道具：openSheet のすぐ下に fxRestart（動きをはじめから）・tilesIn（タイルを左上から敷く）。RM() が true（reduced-motion か window.__NOFX）なら動かさない
- テストは fx を止めて動く（harness14 の open_page が window.__NOFX=true にする）。動かして点検するのは copy16 の fx_check（open_page(..., fx=True)）
- 自動で作るファイル：docs/shots/・tools/test/__pycache__（読まない・手で直さない）
