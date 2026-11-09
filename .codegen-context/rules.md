# Codegen rules (slim extract of CLAUDE.md - the sections that govern the code)

### Step 1.5: Assets — Codex, fixed file names (since 26.10.2026)
The art is drawn by **Codex** (`scripts/gen-assets-codex.sh`), not FLUX. The approve script starts it
in the **background right after scaffold**, in parallel with codegen (`scripts/lib/codex-bg.sh`);
Step 0.5 of `pipeline-continue*.sh` only waits for it and falls back to a sync call if the
background job failed. Codex does not read the code, so the file names are a FIXED contract
(`scripts/lib/codex-asset-contract.sh`, the codegen prompt carries the full text):
`bg_game` (the only background), `logo`, `icon_home`, `icon_pause`, `sprite_1`..`sprite_5`,
`button_rect`, `button_round` (not for Kotlin), plus `icon_1024` (launcher icon).
- Reference ONLY these names; never invent another (`bg_menu`, `sprite_coin`, ...) — it will never exist.
- Codegen does NOT write `assets.json`; `codex-import-assets.sh` writes it from the Codex output.
- Loader / Menu / Game / GameOver all use `bg_game` and differ by gradient overlays (rule 14).
- `reel_grid.png` may appear for slots — never depend on it.

### Step 2: Code Generation
Read ONLY: your design doc.
Load the `frontend-design` skill for UI quality.

**Project structure:**
```
App.tsx                  ← state-machine (NOT gameplay!)
src/screens/             ← minimum 3: Loader, Menu, Game
src/components/          ← UI components
src/game/                ← logic
src/hooks/               ← hooks
src/constants/theme.ts   ← copy of the preset
src/constants/config.ts  ← parameters
src/assets/index.ts      ← re-export of AI assets via require
assets/                  ← Codex PNGs with the fixed contract names (Step 1.5)
```

**Allowed npm deps:** `react-native-linear-gradient`, **`react-native-svg`: `"15.8.0"` (EXACT version, NO caret — `^15.8.0` lets in 15.15+ which breaks the Yoga StyleLength API in RN 0.76, recorded incident FarmNotesKeeper-2537)**, `react-native-reanimated`. The Animated API is preferred. **`react-native-gesture-handler` is FORBIDDEN** (see rule #8 below). `build-apk.sh` has `pin_native_deps()` which automatically downgrades RNSVG if it catches ≥15.15 — DO NOT remove this guard, it saves 3 wasted heal-cycles.

**Icon libraries (pick ONE per project — see rule #21 for the preset mapping):**
- `"lucide-react-native": "^0.460.0"` — outline 24px stroke, minimalism
- `"phosphor-react-native": "3.0.6"` — 6 weights including **duotone** (2-color, unique look)
- `"react-native-heroicons": "4.0.0"` — Tailwind icons, outline/**solid**
- `"@tabler/icons-react-native": "3.44.0"` — geometric stroke, alternative to lucide

All 4 are SVG-based, peer-dep `react-native-svg@15.8.0` (already installed), no new native deps. Pin with an **exact version** (no caret, except lucide 0.460+ whose patch releases are safe) — otherwise a caret-trap like with RNSVG.

## CODE RULES

1. **Minimum 3 screens:** Loader (2-3s, brand), Menu (Play, balance), Game
2. **State-machine** in App.tsx: `useState<'loader'|'menu'|'game'>`, conditional render. NOT @react-navigation
3. **NO ScrollView** as the wrapper. Flex: Header(72px+paddingTop:44) → GameArea(flex:1) → Controls(~200px)
4. **Board/grid geometry — IMPORTANT:** account for the parent's padding+border. Correct:
   ```ts
   const BOARD_FRAME = PAD + BORDER; // e.g. 6 + 2 = 8
   const TILE = Math.floor((BOARD_MAX_W - 2*BOARD_FRAME) / COLS);
   const BOARD_W = TILE*COLS + 2*BOARD_FRAME;
   ```
   Otherwise the tiles stick out. In RN the parent's `width` does NOT include padding for the children's content area.
5. **Board max:** `Math.min(SCREEN_W - 32, 380)` (not 400 — leave a margin for padding+border). Buttons ≥48px.
6. **Header with paddingTop:44** under the status bar (otherwise overlap)
7. **AI sprites arrive with a transparent background** — Codex is asked for transparent PNGs for everything except `bg_game`. In RN place it as a regular `<Image source={require('../assets/sprite_x.png')} />` over any background. **DO NOT wrap in `<View overflow:hidden borderRadius:X>` + Image 130-150%** — that is an old hack for masking a white background, now it ruins the composition (a «bubble»/«circle» is visible around the object). Icons and BGs keep their background (by design — for them the background is part of the design).
8. **Animations:** useRef for data in callbacks, NOT useState. useNativeDriver: true (except w/h).
   **Press-feedback (scale on tap):** `<Pressable onPressIn onPressOut>` outside + `<Animated.View style={{transform:[{scale}]}}>` INSIDE the Pressable. NOT the other way round — an Animated.View with native-driver scale wrapping a Pressable eats onPress on Android release (see anti-pattern #3 in pipeline-continue.sh).
   **FORBIDDEN:** `react-native-gesture-handler` / `GestureDetector` / `Gesture.Tap()` / `<GestureHandlerRootView>`. On Windows + RN 0.76 this dependency breaks the release build (Kotlin compile fail on `getPointerEvents()` + ninja `mkdir No such file or directory` on the autolinked codegen path because of path length). If it seems you need GestureDetector — DO NOT add it, use Pressable+onPressIn/Out.
9. **getMainComponentName** in MainActivity MUST == app.json name
10. **Assets are real PNGs** — `codex-import-assets.sh` re-saves every Codex image as PNG via PIL (a JPEG with a .png name fails AAPT)
11. **CTA replay/retry MUST contain `AGAIN` (uppercase, short).** The "play once more" button is written as `DROP AGAIN` / `SPIN AGAIN` / `PLAY AGAIN` — NOT just `DROP`/`SPIN`. Reason: `test-ui.sh` looks for the tap through the list `SPIN AGAIN → PLAY AGAIN → AGAIN → SPIN → DROP → ...`. With the word AGAIN it hits on iterations 1-3 (~3-9s), without it — fallthrough to iterations 5-8 × 13s/attempt = up to 100s per round (on RN release builds the a11y tree is often empty, every `tap_text` runs into a timeout). Without AGAIN the UI test does not fit its budget → fewer screenshots → `NO_VALID_SCREENSHOTS`.

11b. **Visual preset MUST be one of the 10 from `design-system/presets-index.md`** (RETRO_NEON, CANDY_SWEET, CASINO_GOLD, CYBERPUNK, DARK_PREMIUM, TROPICAL, SPACE_COSMOS, WARM_EARTHY, NORDIC_MINIMAL, OCEAN_FRESH). It is **FORBIDDEN** to invent your own `name` in theme.ts/theme.dart (like `'farm-cozy'`, `'farmhouse'`, `'ocean-vibes'`). If no preset fits perfectly — pick the closest and override **only the accent colors** (1-2), but **keep the `name` field as in the preset**. **Choose the preset strictly by the meaning of the brief**: football / sports → DARK_PREMIUM or WARM_EARTHY (not CANDY_SWEET!); slot / casino → CASINO_GOLD or RETRO_NEON; kids / candy → CANDY_SWEET; sci-fi / space → SPACE_COSMOS or CYBERPUNK; medi / utility → NORDIC_MINIMAL. No rotation, no "avoid the ones used in the last 5 apps" — the criterion is semantic only.

11a. **Primary CTA on MenuScreen MUST contain `PLAY` or `START` (uppercase).** The button that leads from Menu to the main screen (game/session/planning/whatever-main) MUST contain one of these two words as a whole word. For games it is natural — `PLAY`, `PLAY NOW`, `START GAME`. **For utility apps** do not write `ADD MEAL` / `BEGIN FOCUS` / `OPEN LIST` / `CREATE PLAN` — write `START PLANNING` / `START FOCUS` / `START SESSION` / `START LIST` / `PLAY NOW` (even if the app is not a game, "Play" as a verb fits). Reason: `test-ui.sh:498` has a hardcoded dictionary `for btn in "PLAY" "Play" "START" "Start" "PLAY NOW"`. Without these words test-ui does not find the CTA, does not get past Menu, there is no game/main screenshot, the gate fires `NO_VALID_SCREENSHOTS`, and the pipeline spends **3 ui-heal cycles × ~7 min** on exactly one fix — renaming the button text. Recorded incident: MealPlanner-2540 (3 heal passes to rename `ADD MEAL → START PLANNING`), FarmFocusTimer-2534 (same thing). If you build a utility app — write `START …` in the primary CTA right away, it saves 20 minutes of pipeline.
12. **The screen state-machine MUST include game-over/result.** Minimum `type Screen = 'loader'|'menu'|'game'|'gameover'`. After the round ends `GameScreen` calls the passed `onGameOver()`, App switches state → a separate `<GameOverScreen onPlayAgain onMenu score>`. Without this test-ui captures identical frames of the same `game` screen, does not collect enough unique screenshots, and the pipeline returns `NO_VALID_SCREENSHOTS`. The "play again" CTA on game-over must contain `AGAIN` (rule 11).

13. **`LOADER_DURATION_MS` = 8000ms** (EXACTLY, not less) in `src/constants/config.ts`. On a real device the user will see an 8s splash — that is OK (most branded mobile games work like that). On the emulator test-ui via the MCP agent has 4-6s of startup overhead; shorter than 8s → Loader auto-transitions to Menu before the agent takes the first screenshot, and the pHash gate catches a «Loader=Menu» fail. Verified many times on ANDROID-2481: 4500/6000/6500ms all raced; 8000ms — stable. **Do not use 5000/6000/7000 — only 8000.**

14. **Loader ≠ Menu visually.** `LoaderScreen` MUST have a background/palette different from `MenuScreen` (different gradient, darker or with overlay 0.85+, NO chips and no PLAY button). Otherwise local-screenshot-gate catches `pHash=0` and the pipeline returns `NO_VALID_SCREENSHOTS`. Standard pattern: dark gradient + brand-card sign + animated brand title + thin progress bar + LOADING…

15. **Special characters in `<Text>` are FORBIDDEN.** DO NOT use `›`, `‹`, `▸`, `▶`, `▾`, `▴`, `→`, `←`, `⇒`, `⟶`, `⟵` — on Android the Roboto fallback gives `:` or `tofu`. Replacements: ASCII (`>`/`<`/`PLAY`/`GO`), inline SVG via `react-native-svg`, or NO icon at all. Star `★`, check `✓`, cross `✗`, bullet `·`, heart `♥` — OK, they render.

16. **Emoji icons as category/item markers** — do not use them on sets of ≥3. On Android API 34 high-codepoint emoji (🐔 🥕 🌿 🧩 ✨) often render as the same fallback character. Use ASCII letters (`[A]` `[F]` `[N]`), inline SVG, or AI-generated PNG sprites from `assets/`.

17. **Decoration must not overlap the letters of headings.** If you want a wooden sign / sparkle / decoration around "NO LUCK!" / "GAME OVER" / "WIN!" — position it OUTSIDE the text's bounding box. A stick/stripe through the letter "L" → reads as "NOIUCK!" or a typo.

18. **A sprite inside a card must not stick out.** If `<Image source={chickenSprite} />` sits in a `<View borderRadius:12>` — the sprite coordinates MUST be `right: ≥8, bottom: ≥8` (positive offset), not `right: -6, bottom: -8`. Otherwise the sprite pokes out past the rounded edge and looks like a bug.

19. **Z-index/layout: the subtitle is NEVER under the CTA.** If there is a hint "HOW TO PLAY · ONE TAP QUIZ" — render it ABOVE the PLAY button (`marginBottom: 8` from subtitle to button), not BELOW. A button with absolute positioning or a big shadow will cover the subtitle, half of the text disappears.

19a. **Never `flex:1` inside a `flex:1` parent without an explicit height.** That is circular flex resolution — RN collapses the child to 0/30px height, the content gets clipped. Concretely: if the thing looks like `<View statSlot flex:1><Card flex:1>...</Card></View>` (where statSlot is already flex:1 in a `flexDirection:row`) — remove `flex:1` from Card, set `width:'100%'`. Card gets its intrinsic content height instead of collapsing. Symptom of the bug: the icon is visible, the text is not, the card is two-three times shorter than expected.

20. **Icons in buttons — STRICT alignment rules (THEY DO NOT DRIFT):**
    - Button container: `<View style={{flexDirection:'row', alignItems:'center', justifyContent:'center', gap: 10}}>`
    - Icon: `<Image style={{width: 24, height: 24, resizeMode:'contain'}} />` a fixed square size is MANDATORY
    - Text: `<Text style={{lineHeight: 24}}>...</Text>` lineHeight = icon size → visual baseline align
    - NO `position:'absolute'` for icons inside buttons
    - NO differing icon heights on different buttons of the same class — Primary/Secondary/CTA: always the same icon-size (24x24 or 28x28)
    - If the icon is decorative (an ornament) — DO NOT add it, keep text only. A clean button without an icon is better than a crooked one with asymmetric decoration.

21. **Stat-cards and UI icons — pick ONE of the 4 SVG icon libraries per project** (do not mix within one project — visual coherence is lost). Previously there was only `lucide-react-native` → all apps looked the same. Mapping preset → recommended library (codegen may deviate if the style brief requires it):
    - **RETRO_NEON / CYBERPUNK** → `react-native-heroicons` **solid** (bold filled, dramatic) — `import { BoltIcon } from 'react-native-heroicons/solid'`
    - **CANDY_SWEET** → `phosphor-react-native` **fill** (rounded filled, playful) — `import { Heart } from 'phosphor-react-native'; <Heart weight="fill" />`
    - **CASINO_GOLD** → `phosphor-react-native` **bold** (heavy lines, premium) — `<Coins weight="bold" />`
    - **DARK_PREMIUM** → `lucide-react-native` (current default, thin minimal) — `<Settings size={22} strokeWidth={1.5} />`
    - **TROPICAL** → `react-native-heroicons` **outline** (clean Tailwind) — `import { SunIcon } from 'react-native-heroicons/outline'`
    - **SPACE_COSMOS** → `@tabler/icons-react-native` (geometric, cosmic feel) — `<IconStar size={22} />`
    - **WARM_EARTHY** → `phosphor-react-native` **duotone** (2-color warm, lifestyle) — `<Notebook weight="duotone" color="#7FA46B" duotoneColor="#D97B4D" />`
    - **NORDIC_MINIMAL** → `lucide-react-native` **strokeWidth=1.5** (ultra-clean Scandinavian)
    - **OCEAN_FRESH** → `react-native-heroicons` outline (cool clean lines)
    - **fallback** (no preset specified) → `lucide-react-native`

    `lucide-react-native` — a vector icon library from the Lucide design team.

    `lucide-react-native` — a vector icon library from the Lucide design team. Every icon is SVG, fixed canvas, perfectly centered, baseline-aligned. Installed with `npm install lucide-react-native react-native-svg`. This is a **ready-made solution** to the "different size/position" problem of icons in a row.

    **Correct pattern:**
    ```tsx
    import { CheckCircle, Target, Trophy } from 'lucide-react-native';

    <StatCard Icon={CheckCircle} value="3/5" label="correct" valueColor="#7FA46B" />
    <StatCard Icon={Target}      value="60%" label="accuracy" valueColor="#D9B36C" />
    <StatCard Icon={Trophy}      value="14"  label="best"     valueColor="#D97B4D" />
    ```

    Inside `StatCard`:
    ```tsx
    <View style={[styles.iconWrap, { backgroundColor: valueColor + '1A' }]}>
      <Icon size={22} color={valueColor} strokeWidth={2.5} />  // exactly 22×22, guaranteed
    </View>
    <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
    ```

    AI-generated PNG sprites in a `<View borderRadius>` tile = **guaranteed failure**:
    - Every FLUX PNG has its own aspect ratio of the object inside (basket — square, wheat — vertical thin, trophy — square but of a different density)
    - `resizeMode:'contain'` respects the object's aspect → wheat renders thin, trophy thick, basket square — visually DIFFERENT sizes
    - `resizeMode:'cover'` cuts off parts
    - `resizeMode:'stretch'` distorts
    - `iconWrap` 44×44 circle around a small PNG → the trophy looks like it sticks up/down because the object's bbox in the source PNG is offset

    **Correct stat-card pattern:**
    ```tsx
    <View style={[styles.card, { borderColor: valueColor + '55' }]}>
      <View style={[styles.accentDot, { backgroundColor: valueColor }]} />  // 8x8 circle as accent
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>     // 22pt bold colored number
      <Text style={styles.label}>{label}</Text>                              // 10pt uppercase caption
    </View>
    ```
    Even — because there are no raster elements with unpredictable geometry. Color carries the semantics (green=correct, gold=accuracy, orange=best). The text is readable, the number is BIG — that is the whole point of a stat card.

    **If you really want an icon in a stat-card** — only inline SVG (`react-native-svg`) or a font glyph (`★ ✓ ✗ ·`). NOT AI sprites, NOT emoji.

    **Cross-screen consistency:** stat-cards on ALL screens use the same `<StatCard>` component with the same styles. No different designs on Menu and GameOver.

    **Minimum 2 visible pills in a row:** if in `<View statsRow>` after the conditional `{value > 0 && ...}` only ≤1 visible pill remains — DO NOT render the whole row (`{a > 0 && b > 0 ? <Row>...</Row> : null}`). A lone pill looks orphaned.

    **If value = 0** → DO NOT render the component, do not leave an empty pill.

22. **Use skills during codegen** (the Step 2 codegen prompt loads them):
    - `react-native-skills` — official RN best practices (animations, lists, gestures)
    - `vercel-react-best-practices` — performance patterns
    - `vercel-composition-patterns` — component composition, compound components
    - **`ui-ux-pro-max`** — CSV catalog: 67 UI styles, 161 palettes, 99 UX guidelines, react-native stack guidelines. Read:
      - `~/.claude/skills/ui-ux-pro-max/src/ui-ux-pro-max/data/stacks/react-native.csv` — Do/Don't for RN
      - `~/.claude/skills/ui-ux-pro-max/src/ui-ux-pro-max/data/ux-guidelines.csv` — general UX rules
      - `~/.claude/skills/ui-ux-pro-max/src/ui-ux-pro-max/data/styles.csv` — style catalog with CSS keywords
      - `~/.claude/skills/ui-ux-pro-max/src/ui-ux-pro-max/data/colors.csv` — palettes by product type
      - `~/.claude/skills/ui-ux-pro-max/src/ui-ux-pro-max/data/typography.csv` — font pairs

23. **Diversity through 3 independent layers (fighting «all apps look the same»).** Previously only the color varied (10 presets) over one hardcoded skeleton → apps differed only by palette. Now the choice in Step 0 goes along THREE orthogonal axes:
    - **Preset** = color (`presets-index.md`). Semantic-first, **rotation forbidden** (#11b).
    - **Style** = shape: surfaces, shadows, radii, decor (`styles-index.md`, 12 mobile styles). Semantic-first, but **do not repeat the style of the previous app** if the brief allows 2+ options.
    - **MenuLayout + GameLayout** = skeleton/block arrangement (`layout-archetypes.md`, 4 Menu × 3 Game = 12 combinations). **Do not repeat the pair of the previous app.**

    `preset × style × layout` = hundreds of visually distinguishable combinations instead of a 10-color clone.

    **BOUNDARY (cautious mode — gates and geometry are NOT touched):** style and layout vary ONLY the composition and the look of surfaces. They MUST stay within the invariants: `paddingTop:44` (#6), no ScrollView wrapper (#3), overflow ≤ 2px by the BOARD_FRAME formula (#4-5, Step 6.6), CTA dictionary `PLAY/START` + `AGAIN` (#11, #11a), Loader≠Menu (#14), game-over screen (#12), special characters/emoji (#15-16), buttons ≥48px. If the chosen layout risks overflow/QA-fail — simplify to M1/G1, diversity is not more important than a working build. Record the chosen Style/MenuLayout/GameLayout in the design doc — codegen and visual-QA rely on them.

## DESIGN RULES

**FORBIDDEN:** flat single-color background | flat buttons without gradient+shadow | identical look on all screens | gray/white RN default | >25% empty space | a single fontWeight

**MANDATORY on every screen:**
- Background: ImageBackground with an AI BG OR LinearGradient + decor
- Surfaces: glassmorphism (rgba(255,255,255,0.05) + border rgba(255,255,255,0.08)) OR solid+shadow
- Buttons: Primary h56-64, gradient, colored shadow, scale spring. Secondary h44-48, rgba+border
- Header: rgba(0,0,0,0.3) + borderBottom + **paddingTop:44**
- Typography: hero(40+) → title(24+) → body(15+) → caption(11-12), min 4 levels
- Colors: min 4 distinguishable + 3 text shades
- Depth: min 3 layers (bg → surface → element)

**REFERENCE:** Stake.com/Duelbits level.

## PROHIBITIONS
- DO NOT ask for confirmation — act immediately
- DO NOT show a "simplified version"
- DO NOT skip steps
- DO NOT use Expo, Flutter, Kotlin-only
- **DO NOT read all screenshots in a row — only the critical ones (see Step 8)**
- **DO NOT regenerate AI assets if they passed validation** (trust `visual-validate.sh`)

