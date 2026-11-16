# 地図（shoot）

読むときは、この地図 → `grep -n 'ことば' index.html | cut -c1-200` → その前後だけ読む（Read の offset と limit）。直すのは Edit で変わる所だけ。
行の目安は 2026-11-16 夕方（全部で約4,500行・約395KB）。大きくずれたら直す。

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
| 1〜360 | CSS（27 タイトル・52 格納庫・140 ショップ・186 出撃・261 研究所や図鑑の入口とレベルアップ・360 せまい画面・その下に作りこみの動き fx と reduced-motion） |
| 360〜510 | HTML（タイトル・遊び方・格納庫・ショップ・研究所・図鑑・実績・出撃・#overlay） |
| 511〜 | データ：524 MODS（装備69）・654 UNLOCK（ショップの品の解放）・687 EVO（進化）・737 道中の強化・792 LAB（研究所）・812 LAB_UNLOCK（研究所の解放）・842 STAGES・853 SHIPS（枠の場所 slots もここ） |
| 926〜1586 | ドット絵：926 描く道具・1045 絵（機体・装備・敵・アイコン） |
| 1587〜1797 | ステージの背景 |
| 1798〜1918 | セーブ：1804 freshSave・1824 ACH（実績）・1853 loadSave（古いセーブの直し）・1898 persist |
| 1919〜2090 | 効果音 SFX（Web Audio。名前と鳴らし方の表） |
| 2091〜2388 | 格納庫：2134 drawEditor（機体と装備を描く）・2158 snapAt（装備がはまる動き）・その下に popAt（外す動き）・2218 tutGuide（はじめの案内）・2239 renderEquip・2275 openSheet（板・作りこみの道具）・2311 openList・2338 openDir（向きの板）・2353 openAim・2375 openInfo（くわしく） |
| 2389〜2567 | ショップ（2395 renderShop）・研究所（2465 renderLab）・図鑑・実績 |
| 2568〜3958 | 出撃：2592 calcCS（共通の数字）・2658 startRun・敵の動き・3071 攻撃の装備・3315 防御と補助と進化・3681 必殺技・3846 支援 |
| 3959〜4153 | 3959 update・4025 draw・4146 frame（fxHold の間は止める） |
| 4154〜4401 | レベルアップ：4218 openLevelUp・4251 pickChoice・4263 ghostCards（えらんだあとの動き）・4275 openChest・4299 endRun（結果の画面） |
| 4402〜 | タイトル・遊び方：4432 pixWipe（画面の切りかえ）・4445 showTitle・4449 toHangarFromTitle |

## 決まり
- セーブのキーと形は変えない（古いセーブは loadSave で直す）
- 動き（animation）の名前は fx ではじめる。copy16 は fx と案内の指だけ許す
- 作りこみの動きの道具：openSheet のすぐ下に fxRestart（動きをはじめから）・countUp（数字のかぞえ上げ）・rollNum（お金の数を動かす）・tilesIn（タイルを左上から敷く）。closeSheet は写しを横へ出す。buyFx は buyLab のすぐ上。RM() が true（reduced-motion か window.__NOFX）なら動かさない
- テストは fx を止めて動く（harness14 の open_page が window.__NOFX=true にする）。動かして点検するのは copy16 の fx_check（open_page(..., fx=True)）
- 自動で作るファイル：docs/shots/・tools/test/__pycache__（読まない・手で直さない）
