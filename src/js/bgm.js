/* ---------- BGM（Web Audio でコードで作る・音のファイルは使わない） ----------
   曲は SONGS（和音1小節に1つ・メロディは1小節16こま）。ベース・分散和音・パッド・打楽器は和音から作る。
   同じ曲を2つの音色で鳴らせる：BGM_STYLE 'chip'＝A ピコピコ・'synth'＝B シンセ */
const BGM_STYLE='chip';
const BGM_SG={chip:1,synth:1.7};/* 音色ごとの大きさ（シンセは平均が小さいので少し上げて chip とそろえる） */
const BGM_VOL=0.04;             /* BGM の大きさはここ1か所（効果音は SFX の VOLUME）。効果音より少し下に */
/* SONGS:BEGIN */
const SONGS={
  // タイトル「ぜんぶのせシップ」のテーマ（D・140）2小節の前奏のあと16小節でくり返す
  title:{bpm:140, loopFrom:2, chords:'G A D A Bm G Bm G A D G A F#m Bm Em F#m G A', bass:'oct', arp:'up', drums:'four', lead:`
D5 - - D5 - - D5 - G5 - - - - - - -
E5 - - E5 - - E5 - A5 - - - G5 - E5 -
F#5 - - D5 - - A5 - - - - - G5 - F#5 -
E5 - - C#5 - - A4 - - - B4 - C#5 - E5 -
F#5 - - D5 - - B5 - - - - - A5 - F#5 -
G5 - - - - - D5 - - - . . B4 - D5 -
F#5 - - D5 - - B4 - - - C#5 - D5 - F#5 -
G5 - - D5 - - B4 - D5 - - - E5 - F#5 -
A5 - - - G5 - F#5 - E5 - - - C#5 - E5 -
D5 - - - - - - - - - . A4 B4 - C#5 -
D5 - - - G5 - - - B5 - - - A5 - G5 -
A5 - - - - - E5 - - - - - C#5 - E5 -
A5 - - - - - F#5 - - - - - C#5 - F#5 -
F#5 - - - - - - - D5 - - - C#5 - D5 -
E5 - - B4 E5 - G5 - - - F#5 - E5 - D5 -
F#5 - - C#5 F#5 - A5 - - - G5 - F#5 - E5 -
G5 - - D5 G5 - B5 - - - A5 - G5 - F#5 -
A5 - - - - - - - C#5 D5 E5 F#5 G5 - E5 -`, counter:`
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
B4 - - - - - - - D5 - - - - - - -
C#5 - - - - - - - A4 - - - - - - -
C#5 - - - - - - - A4 - - - - - - -
B4 - - - - - - - F#4 - - - - - - -
G4 - - - - - - - B4 - - - - - - -
A4 - - - - - - - C#5 - - - - - - -
B4 - - - - - - - D5 - - - - - - -
C#5 - - - - - - - E5 - - - - - - -`},

  // 格納庫・ショップ・研究所：ゆったり工房のグルーヴ（G ミクソリディア風・110）
  hangar:{bpm:110, chords:'G F C G G F Am D C D Bm Em Am F C D', bass:'walk', arp:'updown', drums:'calm', pad:true, gain:0.9, lead:`
D5 . G4 . B4 - D5 - - - . . E5 - D5 -
C5 . F4 . A4 - C5 - - - . . D5 - C5 -
E5 - - - G5 - - - E5 - D5 - C5 - . .
D5 - - - - - . . B4 . A4 . G4 - - -
D5 . G4 . B4 - D5 - - - . . E5 - G5 -
F5 - - - . . C5 - A4 - - - C5 - D5 -
E5 - - - C5 - - - A4 - - - B4 - C5 -
D5 - - - - - . . A4 . F#4 . A4 - B4 -
C5 - - - - - E5 - G5 - - - - - . .
F#5 - - - - - A5 - - - F#5 - D5 - . .
D5 - - - - - F#5 - B4 - - - - - . .
G5 - - - F#5 - E5 - - - - - . . D5 -
C5 - - - E5 - A5 - - - G5 - E5 - . .
F5 - - - - - C5 - A4 - - - C5 - D5 -
E5 - - - G5 - E5 - C5 - - - D5 - E5 -
F#5 - - - - - . . A4 . B4 . C5 - C#5 -`},

  // ステージ1 星の海（Am・152）見本どおり
  st1:{bpm:152, shift:{chip:-12,synth:-12}, chords:'Am F G Em Am F G E F G Am Am F G E E', bass:'oct', arp:'up', drums:'drive', lead:`
E5 - - - A5 - - - G5 - E5 - D5 - E5 -
C5 - - - F5 - - - E5 - C5 - A4 - C5 -
D5 - - - G5 - - - F5 - D5 - B4 - D5 -
E5 - - - - - - - B4 - - - E5 - G5 -
A5 - - - G5 - E5 - C6 - - - B5 - A5 -
A5 - - - G5 - F5 - E5 - - - C5 - D5 -
D5 - E5 - F5 - G5 - B5 - - - A5 - G5 -
G#5 - - - - - - - E5 - F5 - G#5 - B5 -
C6 - - - A5 - - - F5 - - - A5 - C6 -
D6 - - - B5 - - - G5 - - - B5 - D6 -
E6 - - - - - - - D6 - C6 - B5 - C6 -
A5 - - - - - - - - - - - E5 - A5 -
C6 - - - B5 - A5 - G5 - A5 - - - F5 -
G5 - - - A5 - B5 - D6 - - - C6 - B5 -
B5 - - - - - - - G#5 - - - - - - -
E5 - F5 - G#5 - A5 - B5 - C6 - D6 - E6 -`},

  // ステージ2 小惑星帯：連打の動機でせき立てる（Em・160）
  st2:{bpm:160, chords:'Em C D Em Em C Am B C D B Em Am C B B', bass:'gallop', arp:'down', drums:'drive', lead:`
E5 E5 . B4 . E5 . G5 - - F#5 - E5 - B4 -
C5 C5 . G4 . C5 . E5 - - D5 - C5 - G4 -
D5 D5 . A4 . D5 . F#5 - - E5 - D5 - A4 -
E5 - - - B5 - - - G5 - - - E5 - . .
E5 E5 . B4 . E5 . G5 - - B5 - A5 - G5 -
E5 - - - C5 - E5 - G5 - - - E5 - C5 -
A4 - - C5 E5 - A5 - - - G5 - F#5 - E5 -
D#5 - - - F#5 - - - B5 - - - A5 - F#5 -
G5 - - - - - E5 - C5 - - - E5 - G5 -
A5 - - - - - F#5 - D5 - - - F#5 - A5 -
B5 - - - - - A5 - F#5 - - - D#5 - F#5 -
G5 - - - - - E5 - B4 - - - . . B4 B4
C5 C5 . A4 . C5 . E5 - - D5 - C5 - B4 -
C5 C5 . G4 . C5 . E5 - - G5 - E5 - C5 -
B4 B4 . F#4 . B4 . D#5 - - F#5 - D#5 - B4 -
F#5 - - - D#5 - - - B4 - C5 - C#5 - D#5 -`},

  // ステージ3 氷の星雲：長い音ときらめく装飾、Cの和音でひんやり（Bm・132）
  st3:{bpm:132, chords:'Bm G Em F# Bm G C F# G A D Bm Em G F# F#', bass:'eighth', arp:'wide', arpOct:12, drums:'half', pad:true, lead:`
B4 - - F#5 - - - - - - - - E5 - D5 -
B4 - - - - - - - . . G4 - B4 - D5 -
E5 - - B5 - - - - - - - - A5 - G5 -
F#5 - - - - - - - . . A#4 - C#5 - E5 -
D5 - - F#5 - - - - - - - - E5 - D5 -
B4 - - D5 - - G5 - - - - - A5 - F#5 -
G5 - - - - - E5 - - - - - C5 - E5 -
F#5 - - - - - - - C#5 - A#4 - C#5 - E5 -
D5 - - - G5 - - - B5 - - - A5 G5 F#5 G5
A5 - - - - - E5 - C#5 - - - E5 - A5 -
F#5 - - - - - D5 - A4 - - - D5 E5 F#5 A5
B5 - - - - - - - - - - - F#5 - - -
G5 - - - - - E5 - B4 - - - - - D5 -
G5 - - - - - D5 - B4 - - - D5 - E5 -
F#5 - - - E5 - - - C#5 - - - A#4 - - -
F#4 - - - - - - - A#4 - C#5 - E5 - A#4 -`, counter:`
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
B4 - - - - - - - - - - - - - - -
C#5 - - - - - - - - - - - - - - -
A4 - - - - - - - - - - - - - - -
D5 - - - - - - - - - - - - - - -
B4 - - - - - - - - - - - - - - -
D5 - - - - - - - - - - - - - - -
C#5 - - - - - - - - - - - - - - -
A#4 - - - - - - - - - - - - - - -`},

  // ステージ4 機械要塞：半音でうなる機械の行進（Cm・144）
  st4:{bpm:144, chords:'Cm Cm Ab G Cm Cm Db G Fm Fm Cm Cm Ab Bb G G', bass:'pulse', arp:'updown', drums:'march', lead:`
G4 . G4 G4 Ab4 . F#4 . G4 . . . C5 - D5 -
Eb5 - - - D5 . Db5 . C5 - - - . . G4 -
C5 . C5 C5 Db5 . B4 . C5 . . . Eb5 - Ab5 -
G5 - - - F5 - D5 - B4 - - - C5 - D5 -
G4 . G4 G4 Ab4 . F#4 . G4 . . . C5 - Eb5 -
G5 - - - F#5 . F5 . Eb5 - - - D5 - C5 -
Db5 - - Db5 F5 - - F5 Ab5 - - - G5 - F5 -
G5 - - - - - - - B4 . C5 . C#5 . D5 .
F5 - - F5 Ab5 - - - F5 - Eb5 - E5 - F5 -
C5 - - C5 Eb5 - - - C5 - Bb4 - B4 - C5 -
Eb5 - - - D5 - Eb5 - G5 - - - F5 - Eb5 -
C5 - - - - - - - . . G4 . Ab4 . Bb4 .
C5 - - C5 Eb5 - - Eb5 Ab5 - - - G5 - F5 -
D5 - - D5 F5 - - F5 Bb5 - - - Ab5 - F5 -
G5 - - - - - - - D5 - - - B4 - - -
D5 . D5 D5 B4 . B4 B4 G4 . G4 G4 Ab4 . F#4 .`},

  // ステージ5 深淵：重い半分テンポから16分で高まる、Gbとオーギュメントの影（Fm・126）
  st5:{bpm:126, chords:'Fm Db Gb C Fm Db Bbm C Db Eb Fm Fm Db Eb C C Bbm Gb Db C', bass:'half', arp:'down', drums:'half', pad:true, lead:`
C5 - - - - - - - - - . . Db5 - C5 -
Ab4 - - - - - - - F4 - - - . . Ab4 -
Bb4 - - - - - - - Db5 - - - Gb5 - F5 -
E5 - - - - - - - C5 - - - E5 - G5 -
F5 - - - - - - - - - . . Gb5 - F5 -
Db5 - - - - - - - Ab4 - - - Bb4 - C5 -
Db5 - - - - - F5 - - - - - Eb5 - Db5 -
C5 - - - - - - - G4 - - - E4 - G4 -
Ab4 Bb4 C5 - Db5 - F5 - Ab5 - - - F5 - Db5 -
Bb4 C5 D5 - Eb5 - G5 - Bb5 - - - G5 - Eb5 -
C5 Db5 Eb5 - F5 - Ab5 - C6 - - - Ab5 - F5 -
Ab5 - - - G5 - F5 - C5 - - - . . Eb5 -
F5 Eb5 Db5 - Ab4 - Db5 - F5 - - - Eb5 - Db5 -
Eb5 F5 G5 - Bb5 - G5 - Eb5 - - - G5 - Bb5 -
C6 - - - - - - - G5 - - - E5 - - -
G5 - Ab5 - G5 - F5 - E5 - - - Db5 - C5 -
Db5 - - - - - - - F5 - - - Bb5 - - -
- - - - - - - - Gb5 - - - Db5 - - -
F5 - - - - - Ab5 - - - F5 - Db5 - - -
E5 - - - - - - - G4 - G#4 - A4 - B4 -`, counter:`
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
F4 - - - - - - - - - - - - - - -
G4 - - - - - - - - - - - - - - -
Ab4 - - - - - - - - - - - - - - -
C5 - - - - - - - - - - - - - - -
Ab4 - - - - - - - - - - - - - - -
Bb4 - - - - - - - - - - - - - - -
G4 - - - - - - - - - - - - - - -
E4 - - - - - - - - - - - - - - -
F4 - - - - - - - - - - - - - - -
Gb4 - - - - - - - - - - - - - - -
F4 - - - - - - - - - - - - - - -
E4 - - - - - - - - - - - - - - -`},

  // 大型の敵：半音でゆれる警報の動機（F#m・172）
  boss:{bpm:172, chords:'F#m D E F#m F#m D G C# Bm C# F#m D Bm G C# C#', bass:'oct', arp:'up', drums:'boss', lead:`
F#5 G5 F#5 G5 F#5 - C#5 - F#5 G5 F#5 G5 F#5 - A5 -
F#5 G5 F#5 G5 F#5 - D5 - A5 - - - F#5 - E5 -
G#5 A5 G#5 A5 G#5 - E5 - B5 - - - G#5 - E5 -
F#5 - - - - - - - C#5 - E5 - F#5 - G#5 -
A5 G#5 A5 G#5 A5 - E5 - F#5 - - - C#5 - E5 -
F#5 E5 F#5 E5 F#5 - D5 - A4 - - - D5 - F#5 -
G5 - D5 - G5 - B5 - D5 - G5 - B5 - G5 -
G#5 - G#5 - F5 - G#5 - C#5 - - - F5 - G#5 -
F#5 - - F#5 - - F#5 - B5 - - - A5 - F#5 -
F5 - - F5 - - F5 - G#5 - - - F5 - C#5 -
C#5 - - C#5 - - F#5 - A5 - - - G#5 - F#5 -
A5 - - - F#5 - - - D5 - E5 - F#5 - A5 -
B5 - A5 - F#5 - D5 - F#5 - A5 - B5 - A5 -
B5 - G5 - D5 - G5 - B5 - - - G5 - D5 -
G#5 A5 G#5 A5 G#5 - F5 - G#5 A5 G#5 A5 G#5 - F5 -
C#5 D5 C#5 D5 C#5 - F5 - G#5 - - - F5 - G#5 -`},

  // 最終ボス「深淵の核」：タイトルの動機を短調で、Ebの和音で最後の山場（Dm・150）
  final:{bpm:150, chords:'Dm A Bb Gm Bb Gm A Dm Gm C F Bb Gm Eb Bb A Dm A Bb Gm Bb C Eb A', bass:'gallop', arp:'down', drums:'boss', pad:true, lead:`
F5 - - D5 - - A5 - - - - - G5 - F5 -
E5 - - C#5 - - A4 - - - Bb4 - C#5 - E5 -
F5 - - D5 - - Bb5 - - - - - A5 - F5 -
G5 - - - - - D5 - - - . . Bb4 - D5 -
F5 - - D5 - - Bb4 - - - C5 - D5 - F5 -
G5 - - D5 - - Bb4 - D5 - - - F5 - G5 -
A5 - - - G5 - F5 - E5 - - - C#5 - E5 -
D5 - - - - - - - - - . D5 E5 - F5 -
G5 - - - - - - - Bb5 - - - A5 - G5 -
E5 - - - - - - - G5 - - - F5 - E5 -
F5 - - - C5 - F5 - A5 - - - G5 - F5 -
D5 - - - - - - - F5 - G5 - A5 - Bb5 -
- - - - - - A5 - G5 - - - D5 - F5 -
G5 - - - - - - - Bb5 - - - G5 - Eb5 -
F5 - - - D5 - F5 - Bb5 - - - A5 - F5 -
E5 - - - - - - - C#5 D5 E5 F5 G5 F5 E5 -
F5 - - D5 - - A5 - - - - - G5 - F5 -
E5 - - C#5 - - A4 - - - Bb4 - C#5 - E5 -
F5 - - D5 - - Bb5 - - - - - A5 - Bb5 -
G5 - - - - - Bb5 - - - - - A5 - G5 -
F5 - - - - - - - Bb5 - - - - - - -
G5 - - - - - - - C6 - - - - - - -
Bb5 - - - - - - - G5 - - - Eb5 - - -
C#5 - - - E5 - - - A5 - - - G5 - E5 -`, counter:`
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
D5 - - - - - - - - - - - - - - -
C5 - - - - - - - - - - - - - - -
C5 - - - - - - - - - - - - - - -
Bb4 - - - - - - - - - - - - - - -
D5 - - - - - - - - - - - - - - -
Eb5 - - - - - - - - - - - - - - -
D5 - - - - - - - - - - - - - - -
C#5 - - - - - - - - - - - - - - -
A4 - - - - - - - - - - - - - - -
C#5 - - - - - - - - - - - - - - -
D5 - - - - - - - - - - - - - - -
D5 - - - - - - - - - - - - - - -
D5 - - - - - - - - - - - - - - -
E5 - - - - - - - - - - - - - - -
Eb5 - - - - - - - - - - - - - - -
C#5 - - - - - - - - - - - - - - -`},

  // クリア：ファンファーレ、最後はDを長くのばして格納庫へ（D・140）
  clear:{bpm:140, loop:false, then:'hangar', chords:'G A D', bass:'whole', arp:'off', drums:{k:'x...............', s:'x...............', h:'................'}, fill:false, pad:true, lead:`
D5 . D5 D5 G5 - - - B4 - - - D5 - G5 -
E5 . E5 E5 A5 - - - E5 - - - C#5 - - -
D5 - - - - - - - - - - - - - - -`, counter:`
B4 . B4 B4 D5 - - - G4 - - - B4 - D5 -
C#5 . C#5 C#5 E5 - - - C#5 - - - A4 - - -
F#4 - - - - - - - - - - - - - - -`},

  // 撃墜：おりていく短いフレーズ、Fm→Cで少しだけ前向きに（100）
  over:{bpm:100, loop:false, then:'hangar', chords:'Fm C', bass:'whole', arp:'off', drums:'none', fill:false, pad:true, gain:0.9, lead:`
C6 - - Ab5 - - F5 - - - - - Eb5 - D5 -
C5 - - - - - - - - - - - - - - -`, counter:`
Ab4 - - - - - - - - - - - - - - -
G4 - - - - - - - - - - - - - - -`},

  // おわり：タイトルの動機をゆっくり、なつかしく（C・96）
  ending:{bpm:96, chords:'C G Am F Am F G C F G Em Am Dm Em F G', bass:'half', arp:'wide', drums:'calm', pad:true, gain:0.9, lead:`
E5 - - C5 - - G5 - - - - - F5 - E5 -
D5 - - B4 - - G4 - - - - - . . . .
E5 - - C5 - - A5 - - - - - G5 - E5 -
F5 - - - - - - - C5 - - - - - . .
E5 - - C5 - - A4 - - - B4 - C5 - E5 -
F5 - - C5 - - A4 - C5 - - - D5 - E5 -
G5 - - - F5 - E5 - D5 - - - B4 - D5 -
C5 - - - - - - - - - . G4 A4 - B4 -
C5 - - - F5 - - - A5 - - - G5 - F5 -
G5 - - - - - D5 - - - - - B4 - D5 -
G5 - - - - - E5 - - - - - B4 - E5 -
- - - - - - - - C5 - - - B4 - C5 -
D5 - - A4 D5 - F5 - - - E5 - D5 - C5 -
E5 - - B4 E5 - G5 - - - F5 - E5 - D5 -
F5 - - C5 F5 - A5 - - - G5 - F5 - E5 -
G5 - - - - - - - D5 - - - F5 - - -`, counter:`
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
A4 - - - - - - - - - - - - - - -
B4 - - - - - - - - - - - - - - -
G4 - - - - - - - - - - - - - - -
A4 - - - - - - - - - - - - - - -
F4 - - - - - - - - - - - - - - -
G4 - - - - - - - - - - - - - - -
A4 - - - - - - - - - - - - - - -
B4 - - - - - - - - - - - - - - -`},
};
/* SONGS:END */
const bgmOn=()=>save.bgm!==undefined?save.bgm!==false:save.snd!==false;/* まだ決めていないセーブは、前の「音」と同じ */
const BGM=(()=>{
  const SEMI={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const nm=s=>{const m=/^([A-G])([#b]?)(-?\d)$/.exec(s);if(!m)throw new Error('note '+s);return 12*(+m[3]+1)+SEMI[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);};
  const mf=m=>440*Math.pow(2,(m-69)/12);
  const chord=s=>{const m=/^([A-G][#b]?)(m?)$/.exec(s);if(!m)throw new Error('chord '+s);return {r:nm(m[1]+'0')%12,t:[0,m[2]?3:4,7]};};
  /* 打楽器（1小節16こま。x 強い・o 弱い） */
  const DR={drive:{k:'x.......x.x.....',s:'....x.......x...',h:'x.o.x.o.x.o.x.o.'},four:{k:'x...x...x...x...',s:'....x.......x...',h:'..x...x...x...x.'},
    half:{k:'x.........x.....',s:'........x.......',h:'x.o.x.o.x.o.x.o.'},march:{k:'x.....x.x.......',s:'....x.......x.oo',h:'xoxoxoxoxoxoxoxo'},
    boss:{k:'x..x..x.x..x..x.',s:'....x.......x...',h:'xoxoxoxoxoxoxoxo'},calm:{k:'x.........x.....',s:'....o.......o...',h:'..o...o...o...o.'},none:{k:'',s:'',h:''}};
  const ARP={up:[0,1,2,3],updown:[0,1,2,3,2,1],down:[3,2,1,0],wide:[0,2,3,5,3,2],off:null};
  const BASS=['oct','eighth','pulse','gallop','whole','half','walk'];
  function line(str,bars,name){const tk=String(str).trim().split(/\s+/),map={};let c=null;
    if(tk.length!==bars*16)throw new Error(name+' '+tk.length+'/'+bars*16);
    tk.forEach((t,i)=>{if(t==='-'){if(c)c.len++;}else if(t==='.')c=null;else{c={m:nm(t),len:1};(map[i]=map[i]||[]).push(c);}});return map;}
  function prep(s){if(s.P)return s.P;const ch=s.chords.trim().split(/\s+/).map(chord),bars=ch.length;
    return s.P={ch,bars,steps:bars*16,lead:line(s.lead,bars,'lead'),counter:s.counter?line(s.counter,bars,'counter'):null,
      bass:s.bass&&!BASS.includes(s.bass)?line(s.bass,bars,'bass'):null,dr:typeof s.drums==='object'?s.drums:DR[s.drums||'drive'],
      arp:ARP[s.arp||'up']||null};}
  /* 音の土台（ac ごとに1つ。BGM.render のときは別の ac で作る） */
  function env(ac,dest,style){
    const pw=d=>{const n=40,re=new Float32Array(n),im=new Float32Array(n);for(let k=1;k<n;k++)re[k]=2/(k*Math.PI)*Math.sin(k*Math.PI*d);return ac.createPeriodicWave(re,im);};
    const E={ac,style,out:dest,W12:pw(0.125),W25:pw(0.25),W50:pw(0.5),rev:null};
    E.nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const nd=E.nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
    E.del=ac.createDelay(2);const fb=ac.createGain(),lp=ac.createBiquadFilter(),wet=ac.createGain();fb.gain.value=0.32;lp.type='lowpass';lp.frequency.value=2600;wet.gain.value=0.5;
    E.del.connect(lp);lp.connect(fb);fb.connect(E.del);lp.connect(wet);wet.connect(dest);
    if(style==='synth'){E.rev=ac.createConvolver();const len=(ac.sampleRate*2.2)|0,b=ac.createBuffer(2,len,ac.sampleRate);
      for(let c=0;c<2;c++){const x=b.getChannelData(c);for(let i=0;i<len;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);}
      E.rev.buffer=b;const rw=ac.createGain();rw.gain.value=0.5;E.rev.connect(rw);rw.connect(dest);}
    return E;}
  /* ---- 音の部品 ---- */
  function adsr(p,t,dur,pk,a,d,s,r){const t1=t+a,t2=Math.max(t1,Math.min(t+a+d,t+dur)),te=Math.max(t2,t+dur);
    p.setValueAtTime(0,t);p.linearRampToValueAtTime(pk,t1);p.linearRampToValueAtTime(pk*s,t2);p.setValueAtTime(pk*s,te);p.linearRampToValueAtTime(0,te+r);return te+r;}
  function osc(E,w,f,t){const o=E.ac.createOscillator();if(typeof w==='string')o.type=w;else o.setPeriodicWave(w);o.frequency.setValueAtTime(f,t);return o;}
  function vib(E,t,end,dep,dly){const l=E.ac.createOscillator(),g=E.ac.createGain();l.frequency.value=5.6;g.gain.setValueAtTime(0,t+dly*0.6);g.gain.linearRampToValueAtTime(dep,t+dly);l.connect(g);l.start(t);l.stop(end);return g;}
  function nz(E,t,dest,amp,type,f,dec){const s=E.ac.createBufferSource(),fl=E.ac.createBiquadFilter(),g=E.ac.createGain();s.buffer=E.nb;s.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=0.7;
    g.gain.setValueAtTime(amp,t);g.gain.exponentialRampToValueAtTime(0.0008,t+dec);s.connect(fl);fl.connect(g);g.connect(dest);s.start(t,Math.random()*0.4);s.stop(t+dec+0.02);}
  function kick(S,t,a){const E=S.E,o=osc(E,'sine',165,t),g=E.ac.createGain();o.frequency.exponentialRampToValueAtTime(44,t+0.12);
    g.gain.setValueAtTime(a,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.24);o.connect(g);g.connect(S.g);o.start(t);o.stop(t+0.26);nz(E,t,S.g,0.12*a,'highpass',3000,0.012);}
  function snare(S,t,a){const E=S.E;nz(E,t,S.g,a,'highpass',900,0.16);const o=osc(E,'triangle',220,t),g=E.ac.createGain();o.frequency.exponentialRampToValueAtTime(140,t+0.06);
    g.gain.setValueAtTime(a*0.6,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.08);o.connect(g);g.connect(S.g);o.start(t);o.stop(t+0.1);if(S.rv)nz(E,t,S.rv,a*0.6,'bandpass',1800,0.25);}
  function voice(S,t,m,dur,kind){/* kind：lead・counter・arp・bass・pad の1音 */
    const E=S.E,ac=E.ac,f=mf(m),g=ac.createGain(),chip=E.style==='chip';let end;
    if(chip){
      if(kind==='lead'){const o=osc(E,E.W25,f,t);end=adsr(g.gain,t,dur*0.9,0.14,0.004,0.12,0.72,0.04);if(dur>0.22)vib(E,t,end+0.05,16,0.22).connect(o.detune);o.connect(g);o.start(t);o.stop(end+0.05);g.connect(S.dl);}
      else if(kind==='counter'){const o=osc(E,E.W12,f,t);end=adsr(g.gain,t,dur*0.9,0.07,0.004,0.1,0.7,0.04);o.connect(g);o.start(t);o.stop(end+0.05);}
      else if(kind==='arp'){const o=osc(E,E.W12,f,t);end=adsr(g.gain,t,dur*0.6,0.045,0.002,0.03,0.5,0.02);o.connect(g);o.start(t);o.stop(end+0.03);}
      else if(kind==='bass'){const o=osc(E,'triangle',f,t);end=adsr(g.gain,t,dur,0.42,0.003,0.05,0.85,0.03);o.connect(g);o.start(t);o.stop(end+0.03);
        const o2=osc(E,E.W50,f,t),fl=ac.createBiquadFilter(),g2=ac.createGain();fl.type='lowpass';fl.frequency.value=900;adsr(g2.gain,t,dur,0.05,0.003,0.05,0.7,0.03);o2.connect(fl);fl.connect(g2);g2.connect(S.g);o2.start(t);o2.stop(end+0.03);}
      else{const o=osc(E,E.W50,f,t),fl=ac.createBiquadFilter();fl.type='lowpass';fl.frequency.value=1600;end=adsr(g.gain,t,dur,0.03,0.05,0.3,0.8,0.2);o.connect(fl);fl.connect(g);o.start(t);o.stop(end+0.05);}
    }else{
      if(kind==='lead'||kind==='counter'){const ld=kind==='lead',fl=ac.createBiquadFilter();fl.type='lowpass';fl.Q.value=1.2;
        fl.frequency.setValueAtTime(ld?1400:900,t);fl.frequency.linearRampToValueAtTime(ld?3200:1800,t+0.06);fl.frequency.linearRampToValueAtTime(ld?2200:1300,t+0.4);
        end=adsr(g.gain,t,dur*0.95,ld?0.1:0.06,0.015,0.25,0.7,0.18);const v=dur>0.3?vib(E,t,end+0.05,14,0.35):null;
        (ld?[['sawtooth',-7],['sawtooth',7],[E.W25,0]]:[['triangle',0],[E.W25,5]]).forEach(([w,dt])=>{const o=osc(E,w,f,t);o.detune.value=dt;if(v)v.connect(o.detune);o.connect(fl);o.start(t);o.stop(end+0.05);});
        fl.connect(g);g.connect(S.dl);if(S.rv)g.connect(S.rv);}
      else if(kind==='arp'){const o=osc(E,'square',f,t),fl=ac.createBiquadFilter();fl.type='lowpass';fl.Q.value=5;fl.frequency.setValueAtTime(3400,t);fl.frequency.exponentialRampToValueAtTime(420,t+0.17);
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.055,t+0.003);g.gain.exponentialRampToValueAtTime(0.0008,t+0.24);end=t+0.26;o.connect(fl);fl.connect(g);g.connect(S.dl);o.start(t);o.stop(end);}
      else if(kind==='bass'){const o=osc(E,'sawtooth',f,t),fl=ac.createBiquadFilter();fl.type='lowpass';fl.Q.value=3;fl.frequency.setValueAtTime(1100,t);fl.frequency.exponentialRampToValueAtTime(260,t+0.14);
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.3,t+0.004);g.gain.exponentialRampToValueAtTime(0.12,t+Math.max(0.01,dur*0.6));g.gain.linearRampToValueAtTime(0,t+dur);end=t+dur;o.connect(fl);fl.connect(g);o.start(t);o.stop(end+0.02);}
      else{const fl=ac.createBiquadFilter();fl.type='lowpass';fl.Q.value=0.7;fl.frequency.setValueAtTime(700,t);fl.frequency.linearRampToValueAtTime(1500,t+dur*0.6);fl.frequency.linearRampToValueAtTime(900,t+dur);
        end=adsr(g.gain,t,dur,0.012,0.4,0.6,0.85,0.6);[-10,10].forEach(dt=>{const o=osc(E,'sawtooth',f,t);o.detune.value=dt;o.connect(fl);o.start(t);o.stop(end+0.05);});fl.connect(g);if(S.rv)g.connect(S.rv);}
    }
    g.connect(S.g);}
  /* ---- 1こま分を鳴らす ---- */
  function step(S,i,t){
    const s=S.s,P=S.P,E=S.E,bar=(i/16)|0,st=i%16,c=P.ch[bar],sd=S.sd,chip=E.style==='chip',sh=(s.shift&&s.shift[E.style])||0;
    const L=P.lead[i];if(L)L.forEach(e=>voice(S,t,e.m+sh,e.len*sd,'lead'));
    const C=P.counter&&P.counter[i];if(C)C.forEach(e=>voice(S,t,e.m+sh,e.len*sd,'counter'));
    const root=36+c.r;
    if(P.bass){const B=P.bass[i];if(B)B.forEach(e=>voice(S,t,e.m,e.len*sd,'bass'));}
    else{const p=s.bass||(chip?'oct':'eighth'),r=chip&&root<40?root+12:root;let m=null,len=sd*1.6;
      if(p==='oct'){if(st%2===0){m=r+(st%4===2?12:0);len=sd*1.5;}}
      else if(p==='eighth'){if(st%2===0)m=r+(!chip&&st===14?12:0);}
      else if(p==='pulse'){if([0,3,6,8,11,14].includes(st))m=r;len=sd*1.4;}
      else if(p==='gallop'){if(st%4!==1)m=r;len=sd*0.9;}
      else if(p==='whole'){if(st===0){m=r;len=sd*15.5;}}
      else if(p==='half'){if(st%8===0){m=r;len=sd*7.5;}}
      else if(p==='walk'){if(st%4===0){m=r+[0,7,12,7][st/4];len=sd*3.6;}}
      if(m!=null)voice(S,t,m,len,'bass');}
    if(st===0&&(chip?s.pad===true:s.pad!==false))c.t.forEach(x=>{const m=48+c.r+x;voice(S,t,m<55?m+12:m,sd*16,'pad');});
    if(P.arp){const ts=[c.t[0],c.t[1],c.t[2],12,c.t[1]+12,c.t[2]+12],a=P.arp[st%P.arp.length],base=(chip?60+c.r+(c.r<5?12:0):60+c.r-(c.r>=7?12:0))+(s.arpOct||0);
      voice(S,t,base+ts[a],sd,'arp');}
    const d=P.dr,k=(d.k||'')[st],n=(d.s||'')[st],h=(d.h||'')[st];
    if(k==='x'||k==='o')kick(S,t,k==='x'?(chip?0.8:0.9):0.5);
    if(s.fill!==false&&d.s&&bar%4===3&&st>=12)snare(S,t,0.32+0.06*(st-12));
    else if(n==='x'||n==='o')snare(S,t,n==='x'?(chip?0.45:0.4):0.22);
    if(h==='x'||h==='o')nz(E,t,S.g,h==='x'?(chip?0.1:0.09):(chip?0.06:0.04),'highpass',7000,h==='x'&&!chip?0.06:0.025);}
  function inst(E,key,t0,bar){const s=SONGS[key],P=prep(s),ac=E.ac,g=ac.createGain(),dl=ac.createGain();
    g.gain.value=s.gain||1;g.connect(E.out);dl.gain.value=E.style==='synth'?0.4:0.16;dl.connect(E.del);
    let rv=null;if(E.rev){rv=ac.createGain();rv.gain.value=0.35;rv.connect(E.rev);}
    E.del.delayTime.setValueAtTime(60/s.bpm/4*3,t0);
    return {E,key,s,P,sd:60/s.bpm/4,g,dl,rv,step:bar*16,next:t0,done:false};}
  function sched(S,tEnd){const ac=S.E.ac;if(S.next<ac.currentTime-0.05)S.next=ac.currentTime+0.05;/* 重い・裏に回ったあと：遅れた分はとばす */
    while(!S.done&&S.next<tEnd){if(S.step>=S.P.steps){if(S.s.loop===false){S.done=true;S.end=S.next;break;}S.step=(S.s.loopFrom||0)*16;}
      step(S,S.step,S.next);S.next+=S.sd;S.step++;}}
  /* ---- 場面の曲をかえる ---- */
  let E=null,cur=null,want=null,tm=0,duckK=1,style=BGM_STYLE;const pos={};
  const on=()=>bgmOn()&&SFX.ac&&SFX.ac.state==='running';
  function ensure(){if(E)return true;const ac=SFX.ac;if(!ac||!SFX.comp)return false;const o=ac.createGain();o.gain.value=BGM_VOL*BGM_SG[style]*duckK;o.connect(SFX.comp);E=env(ac,o,style);return true;}
  function fade(S,sec){const t=S.E.ac.currentTime;if(S.s.loop!==false)pos[S.key]=((S.step/16)|0)%S.P.bars;S.done=true;
    for(const g of [S.g,S.dl,S.rv])if(g){const p=g.gain;if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);else{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);}p.linearRampToValueAtTime(0,t+sec);}
    setTimeout(()=>{for(const g of [S.g,S.dl,S.rv])if(g)try{g.disconnect();}catch(_){}},(sec+3)*1000);}
  function pump(){if(!cur||!E){clearInterval(tm);tm=0;return;}const ac=E.ac;if(ac.state!=='running')return;
    if(!cur.done)sched(cur,ac.currentTime+0.3);
    else if(cur.end!=null&&ac.currentTime>cur.end+0.8){const nx=cur.s.then||null,was=cur.key;cur=null;if(want===was)want=nx;kick();}/* ジングルのあとは then の曲へ */
    else if(cur.end==null)cur=null;}
  function kick(){
    if(!want){if(cur&&!cur.done)fade(cur,0.8);cur=null;return;}
    if(!on()){if(cur&&!cur.done){fade(cur,0.3);cur=null;}return;}
    if(!ensure())return;
    if(cur&&cur.key===want)return;
    const s=SONGS[want];if(!s)return;
    const t=E.ac.currentTime;if(cur&&!cur.done)fade(cur,0.6);
    let bar=s.loop!==false&&pos[want]!=null?pos[want]:0;
    try{cur=inst(E,want,t+0.08,bar);}catch(e){cur=null;return;}
    cur.g.gain.setValueAtTime(0,t);cur.g.gain.linearRampToValueAtTime(s.gain||1,t+0.15);
    if(!tm)tm=setInterval(pump,50);pump();}
  /* play(曲の名前)：その場面の曲にする（同じ曲ならそのまま）・play(null)：止める */
  function play(key){want=key||null;kick();}
  function duck(on){duckK=on?0.35:1;if(E)E.out.gain.setTargetAtTime(BGM_VOL*BGM_SG[style]*duckK,E.ac.currentTime,0.08);}
  /* 音色をかえる（音の一覧のページ用。ゲームは BGM_STYLE のまま） */
  function setStyle(v){if(v===style||!BGM_SG[v])return;style=v;if(cur&&!cur.done)fade(cur,0.2);cur=null;if(E){const o=E.out;setTimeout(()=>{try{o.disconnect();}catch(_){}},3500);}E=null;kick();}
  function reset(){for(const k in pos)delete pos[k];}
  /* 点検用：曲をすべて読めるか・ずっと鳴らさずに音の大きさを測る */
  function check(){const err=[];for(const k in SONGS){try{const s=SONGS[k];delete s.P;prep(s);if(s.then&&!SONGS[s.then])err.push(k+' then');if((s.loopFrom||0)>=prep(s).bars)err.push(k+' loopFrom');}catch(e){err.push(k+': '+e.message);}}return err;}
  async function render(key,secs,style){const sr=22050,oc=new OfflineAudioContext(2,Math.ceil(sr*secs),sr),o=oc.createGain(),sv=style||BGM_STYLE;o.gain.value=BGM_VOL*BGM_SG[sv];o.connect(oc.destination);
    const S=inst(env(oc,o,sv),key,0.02,0);sched(S,secs);const buf=await oc.startRendering();let pk=0,ss=0,n=0;
    for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<d.length;i++){const v=Math.abs(d[i]);if(v>pk)pk=v;ss+=d[i]*d[i];n++;}}
    return {peak:+pk.toFixed(4),rms:+Math.sqrt(ss/n).toFixed(5),loop:+(S.P.steps*S.sd).toFixed(1)};}
  return {play,kick,duck,reset,check,render,setStyle,get style(){return style},get ducked(){return duckK<1},get key(){return cur&&!cur.done?cur.key:null},get want(){return want}};
})();


