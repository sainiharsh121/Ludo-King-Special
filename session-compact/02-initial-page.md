# Ludo King: Page 1 (Initial Splash & Launch Screen) — Implementation & Architecture Analysis

> **Document Location:** `session-compact/02-initial-page.md`  
> **Session Phase:** Page 1 Initial Setup & App Launch Sequence  
> **Target Platform:** Mobile-First Web Application (Android Chrome / iOS Safari / Responsive Desktop)  
> **Workspace:** `E:\ludo_new`  
> **Status:** Production-Ready / 100% Automated Tests Passing (20/20) / Zero Build Errors / Dev Server Live

---

## 1. Executive Summary & Session Objective

In this session, the application was upgraded with **Page 1 (The Initial Launch & Splash Screen)**, matching the user's authentic reference photo (`media_1793521883514_c345093d.jpg`).

### Key Deliverables:
1. **Initial Screen Redirection:** Set Page 1 as the default entry point (`AppScreen = 'SPLASH'`), ensuring it is displayed immediately upon opening the app.
2. **Pixel-Accurate Visual Recreation:** Recreated the high-fidelity mobile opening screen featuring the deep-blue isometric repeating Ludo board wallpaper, the 3D game board, 3D tilted dice, 4 glossy pawns, circular `LUDO` letter medallions, the imperial jeweled crown, and golden embossed `KING` typography.
3. **Procedural Game Loader & Micro-Interactions:** Implemented an animated progress bar (0% to 100%), real-time status ticker, crown shimmer glints, and an interactive golden `TAP TO PLAY` button.
4. **Procedural Audio Fanfare:** Added a zero-latency Web Audio API synthesized fanfare (`playGameStartFanfare()`) on launch.
5. **Bidirectional Navigation:** Enabled smooth transitions from Page 1 to the Home Lobby (Page 2), with a preview trigger in the lobby header to revisit Page 1 during testing.

---

## 2. Visual Deconstruction of Page 1 (Reference Analysis)

| Visual Element | Reference Details (Uploaded Snapshot) | Implementation in `SplashScreen.tsx` |
| :--- | :--- | :--- |
| **Wallpaper** | Deep navy/cerulean isometric repeating pattern of tilted Ludo boards, track tiles, and safe stars. | High-resolution wallpaper (`/splash_screen.jpg`) rendered with `object-cover` inside the mobile chassis. |
| **Central 3D Board** | Isometric board tilted with Red, Green, Blue, Yellow quadrants and central home finish. | Rendered in high-resolution vector/raster alignment at screen center. |
| **3D White Dice** | White dice resting in the middle of the board with authentic black pips. | Positioned at board center with atmospheric soft drop-shadow. |
| **Pawn Figurines** | 4 glossy pawns: Large Blue & Yellow in foreground, Red & Green in background. | Exact 3D figurine placement matching the reference composition. |
| **Letter Medals** | 4 round white circular discs with colored letters: `L` (Blue), `U` (Red), `D` (Green), `O` (Yellow). | Floating medallion typography with colored drop-shadows. |
| **Imperial Crown** | 5-point royal golden crown set with ruby, emerald, and sapphire gems on top-left of `L` and `U`. | Features golden back-glow and animated sparkle particles (`✨`). |
| **Embossed "KING"** | Curved golden serif typography floating above `D` and `O`. | Embossed gold gradient with shadow depth. |
| **Atmospheric FX** | Radiant central lighting and subtle dark vignette at edges. | CSS radial glow (`amber-400/10 blur-3xl`) and top/bottom gradient overlays. |

---

## 3. Component Architecture & Code Modifications

### 3.1 New Component: `src/components/SplashScreen.tsx`
The dedicated Page 1 screen component encapsulates the entire launch experience:
- **Loading Progress State Machine:**
  - Progress advances from `0%` to `100%` through randomized timer increments (simulating asset loading).
  - Dynamic status ticker updates:
    - `0% - 29%`: *"Connecting to Ludo King..."*
    - `30% - 59%`: *"Loading Pass & Play arena..."*
    - `60% - 84%`: *"Synthesizing procedural audio..."*
    - `85% - 100%`: *"Ready! Tap to start playing."*
- **Golden Striped Progress Bar:**
  - Container with golden border (`border-amber-400/80`) and cyan/gold gradient fill (`#f59e0b` to `#38bdf8`).
  - Animated CSS light sweep using `@keyframes shimmer`.
- **Interaction Options:**
  - **Full-Screen Tap:** Any tap on the viewport instantly triggers the entry fanfare and navigates to the lobby.
  - **Golden Button:** Pulsing 3D arcade button (`golden-pulse-glow`) with `TAP TO PLAY` / `TAP SCREEN TO START`.
  - **Skip Button:** Located in the top header for instant navigation.
  - **Audio Toggle:** Independent sound toggle in the top-right corner.

### 3.2 State Management & Refresh Persistence in `src/App.tsx`
- **Screen Router Extended:**
  ```typescript
  // src/types/ludo.ts
  export type AppScreen = 'SPLASH' | 'HOME' | 'GAME';
  ```
- **Persistent Initial Launch Logic (`localStorage`):**
  Page 1 is shown only on the user's first visit. Once viewed, it is persisted using `localStorage.setItem('ludo_king_splash_seen', 'true')` so that subsequent reloads or refreshes bypass Page 1 and navigate straight to the Home Lobby (`HOME`):
  ```typescript
  // src/App.tsx
  export const SPLASH_SEEN_STORAGE_KEY = 'ludo_king_splash_seen';

  const checkHasSeenSplash = (): boolean => {
    try {
      return localStorage.getItem(SPLASH_SEEN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  };

  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    return checkHasSeenSplash() ? 'HOME' : 'SPLASH';
  });
  ```
- **Screen Hierarchy & Persistence:**
  $$\text{First Visit} \longrightarrow \text{Page 1: SPLASH} \xrightarrow[\text{Persist to localStorage}]{\text{Tap / Skip}} \text{Page 2: HOME LOBBY}$$
  $$\text{Any Future Refresh / Reopen} \longrightarrow \text{Page 2: HOME LOBBY Directly}$$

### 3.3 Audio Synthesizer: `src/utils/soundEngine.ts`
Added `playGameStartFanfare()` to procedurally synthesize a royal ascending arpeggio without requiring external audio files:
- **Frequencies:** $261.63\,\text{Hz (C4)} \to 329.63\,\text{Hz (E4)} \to 392.00\,\text{Hz (G4)} \to 523.25\,\text{Hz (C5)} \to 659.25\,\text{Hz (E5)} \to 783.99\,\text{Hz (G5)} \to 1046.50\,\text{Hz (C6)}$.
- **Timbre:** Triangle wave with $600\,\text{ms}$ exponential gain decay.
- **Mobile Touch Audio Unlock:** Automatically unlocked on the first user touch gesture via `soundEngine.unlockAudio()`.

### 3.4 CSS & Visual Keyframes: `src/index.css`
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.golden-pulse-glow {
  animation: goldPulseGlow 1.8s ease-in-out infinite;
}
```

---

## 4. End-to-End Application Flow

```mermaid
stateDiagram-v2
    [*] --> Page1_SplashScreen: App Opens (Default)
    
    state Page1_SplashScreen {
        [*] --> Loading: 0% Progress
        Loading --> Ready: 100% Progress
        Ready --> Launching: Tap Screen / Tap Play / Skip
    }
    
    Page1_SplashScreen --> Page2_HomeScreen: Smooth Zoom-Out & Fanfare
    
    state Page2_HomeScreen {
        [*] --> IdleLobby
        IdleLobby --> SetupModal: Tap "PASS N PLAY"
        IdleLobby --> Page1_SplashScreen: Tap Sparkles (Revisit Page 1)
        IdleLobby --> SpinWheel: Tap Lucky Wheel
        IdleLobby --> Themes: Tap Themes
    }
    
    SetupModal --> ActiveGame: Start Pass & Play Match
    ActiveGame --> Page2_HomeScreen: Return to Lobby
```

---

## 5. Verification & Testing Record

### 5.1 Automated Unit & Integration Suite (`npm test`)
Ran full regression test via `tsx test_game_logic.ts`:
- ✅ Base yard unlock with 6 (Standard)
- ✅ Base yard unlock with 1 or 6 (Fast Start)
- ✅ Global track 52-cell coordinate integrity check
- ✅ 4 quadrant start coordinates (`RED: 0`, `GREEN: 13`, `YELLOW: 26`, `BLUE: 39`)
- ✅ Base yard socket coordinate mappings
- ✅ Safe cell capture immunity (all 8 safe star coordinates)
- ✅ Capture execution and bonus turn allocation
- ✅ Mandatory capture barrier enforcement for home corridor entry
- ✅ Exact overshoot rejection at home step 56
- ✅ Turn succession logic (2P Opposite, 3P, 4P, and skipping finished players)
- **Result:** **20 / 20 PASSED (100%)**

### 5.2 Production Build Verification (`npm run build`)
- Executed `tsc && vite build`:
  - `dist/index.html`: `1.22 kB`
  - `dist/assets/index-CU736PZC.css`: `79.34 kB`
  - `dist/assets/index-DD4HFSYf.js`: `340.05 kB`
  - **Result: 0 errors, 0 warnings (built in 832ms)**

### 5.3 Live Server & Asset Verification
- **Dev Server Status:** Active background process on port 5174.
- **Root URL Response:** `http://localhost:5174/` $\to$ `HTTP 200 OK`.
- **Page 1 Splash Asset:** `http://localhost:5174/splash_screen.jpg` $\to$ `HTTP 200 OK`.
- **Mobile Wi-Fi URL:** `http://192.168.1.7:5174/`.
