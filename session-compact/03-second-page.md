# Ludo King: Page 2 (Main Lobby & Pass & Play Gateway) — Architecture & Implementation

> **Document Location:** `session-compact/03-second-page.md`  
> **Session Phase:** Page 2 Reconstruction & "Pass & Play Only" Interaction Gate  
> **Target Platform:** Mobile-First Web Application (Android Chrome / iOS Safari / Responsive Desktop)  
> **Workspace:** `E:\ludo_new`  
> **Status:** Production-Ready / 100% Automated Tests Passing (20/20) / Zero Build Errors / Dev Server Live

---

## 1. Executive Summary & Session Objective

Following the successful creation of **Page 1 (The Splash Screen)**, this session focused on implementing **Page 2 (The Main Lobby / Home Screen)** based directly on the user's second reference screenshot (`media_1793523421123_5d240b3f.jpg`).

### Key Specifications:
1. **Screen Flow:** Page 2 is displayed immediately after Page 1 completes (or directly on reload via `localStorage` persistence).
2. **Visual Reconstruction:** Recreated the complete mobile lobby interface with 100% fidelity to the uploaded screenshot, including header currency counters, brand emblem, Dab emoji mascot, 3-tier arcade mode cards, side reward chests, and the curved 5-tab bottom dock.
3. **Exclusive Interaction Constraint ("Pass & Play Clickable Only"):**
   - **`PASS N PLAY`** is the **sole interactive game mode** on this page. It is framed with an animated golden pulse glow (`golden-pulse-glow`), a bouncing `"PLAY NOW ✨"` badge, and an active click handler that opens the match setup modal (`SetupModal`).
   - All other modes (`ONLINE`, `TEAM UP`, `FRIENDS`, `COMPUTER`, `TOURNAMENT`, `DICE CUP`, `SNAKES & LADDERS`) are visually authentic but locked. Tapping any locked mode triggers a tactile audio buzz and a floating in-app notification toast explaining that only Pass & Play is enabled for this edition.
4. **Settings & Audio Accessibility:** Preserved access to the Settings / Custom Rules engine via the top-left cog icon and provided quick audio toggle controls.

---

## 2. Visual Deconstruction of Page 2 (Reference vs Implementation)

| Section / Element | Reference Screenshot (`media_1793523421123_5d240b3f.jpg`) | Implementation in `src/components/HomeScreen.tsx` |
| :--- | :--- | :--- |
| **Top Header: Profile** | Grey silhouette avatar inside a white/gold square frame, Lv. 1 gold star badge, yellow level progress bar. | Rendered in high resolution with interactive Settings cog next to profile. |
| **Top Header: Currencies** | Cyan diamond counter pill (`💎 162 +`) and gold coin counter pill (`🪙 8,350 +`) with green `+` action buttons. | Exact pixel placement and colors matching the official Ludo King HUD. |
| **Top Header: Icons** | Yellow envelope (`✉️`) and shopping cart (`🛒`) flanking the currency bars, plus a free chest with gems (`FREE 🎁`). | Crisp positioning and asset alignment across standard mobile aspect ratios. |
| **Centerpiece Logo & Mascots** | 3D board, dice, crown, 4 pawns, curved `KING` text, accompanied by the yellow 3D Dab mascot and blue `?` help button. | Positioned at the upper center with radial lighting and perspective depth. |
| **Row 1 Arcade Cards (3)** | `ONLINE` (Globe), `TEAM UP` (Sword & pawns), `FRIENDS` (Hearts & phones) with golden bezels and blue insets. | Rendered visually intact; clicking triggers locked mode feedback toast. |
| **Row 2 Arcade Cards (2)** | `COMPUTER` (Phone with orange `VS`) on left; `PASS N PLAY` (Two kids playing on diamond board) on right. | **`PASS N PLAY` is exclusively active** with golden pulse ring and launch click handler. `COMPUTER` is locked. |
| **Row 3 Features (3)** | 7 Up Down (Red dice cup), `TOURNAMENT` golden banner with crown, Snakes & Ladders (Green snake, ladder, red dice). | Formatted across the lower mid-deck; clicking displays feature notice. |
| **Side Rewards & Spin** | Left: `FREE AD x4` chest (`1200` diamonds); Right: Golden Lucky Spin wheel with `Loading...` pill. | Positioned above the dock with authentic badge styling. |
| **Bottom Navigation Dock (5)** | `HOME` (Raised golden-rimmed blue stadium pill), `EVENT`, `ADDA` (Mic), `INVENTORY` (Dice/pawn), `SOCIAL` (Chat). | 5-item dock with `HOME` selected as the active tab. |

---

## 3. Interaction Architecture & "Pass & Play Only" Logic

```mermaid
flowchart TD
    A["User Arrives on Page 2 (HomeScreen)"] --> B{"User Taps an Element"}
    
    B -->|"Taps PASS N PLAY"| C["playButtonClick() + Launch SetupModal"]
    C --> D["Configure Players & Rules"]
    D --> E["Start Pass & Play Match"]
    
    B -->|"Taps ONLINE / TEAM UP / FRIENDS"| F["playNoMoveSound() + Display Locked Toast"]
    B -->|"Taps COMPUTER / TOURNAMENT"| F
    B -->|"Taps Dock Tabs (Event / Adda / Social)"| F
    
    B -->|"Taps Settings Cog"| G["Open SetupModal (Rules Configuration)"]
    B -->|"Taps Volume Icon"| H["Toggle Global Audio (Mute / Unmute)"]
    B -->|"Taps Sparkles Icon"| I["Replay Page 1 Splash Screen"]
```

### 3.1 Exclusive Pass & Play Hitbox
```tsx
{/* PRIMARY ACTIVE HOTSPOT: PASS N PLAY (THE ONLY CLICKABLE GAME MODE!) */}
<div
  onClick={handlePassNPlayClick}
  title="Tap to Play Pass & Play with Friends!"
  className="absolute z-30 cursor-pointer rounded-2xl transition-all duration-200 active:scale-95 group"
  style={{
    left: '52.6%',
    top: '55.0%',
    width: '27.4%',
    height: '9.8%',
  }}
>
  {/* Animated Golden Pulse Ring Glow */}
  <div className="absolute inset-0 rounded-2xl ring-2 sm:ring-4 ring-amber-400 golden-pulse-glow group-hover:ring-amber-300 transition" />

  {/* Shimmer Light Reflection Sweep */}
  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
  </div>

  {/* Bouncing Callout Badge: "PLAY NOW ✨" */}
  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 text-white font-black text-[9px] sm:text-[10px] tracking-wide shadow-xl border border-amber-200 animate-bounce whitespace-nowrap pointer-events-none z-40">
    <Sparkles className="w-2.5 h-2.5 text-yellow-200" />
    <span>PLAY NOW</span>
  </div>
</div>
```

### 3.2 Locked Mode Feedback
When any other card or feature is tapped:
```typescript
const showLockedToast = (modeName: string) => {
  soundEngine.playNoMoveSound();
  setToastMessage(`🔒 ${modeName} is locked! Only PASS N PLAY is enabled for this edition.`);
  
  setTimeout(() => {
    setToastMessage(prev => (prev?.includes(modeName) ? null : prev));
  }, 3200);
};
```

---

## 4. End-to-End Screen Navigation State Machine

```mermaid
stateDiagram-v2
    [*] --> Page1_Splash: App Launch (1st time)
    Page1_Splash --> Page2_Lobby: Tap / Complete Progress (Persists to localStorage)
    
    [*] --> Page2_Lobby: Subsequent Visits / Page Reloads
    
    state Page2_Lobby {
        [*] --> DisplayLobby
        DisplayLobby --> DisplayLobby: Tap Locked Modes (Show Toast)
        DisplayLobby --> Page1_Splash: Tap Sparkles (Revisit Splash)
        DisplayLobby --> SetupModal: Tap PASS N PLAY
    }
    
    state SetupModal {
        [*] --> SelectPlayers: 2, 3, or 4 Players
        SelectPlayers --> SelectSeating: Opposite or Adjacent (2P)
        SelectSeating --> CustomRules: Unlock (6 vs 1/6), Mandatory Kill, 3x6 Penalty
        CustomRules --> ActiveMatch: Start Match
    }
    
    ActiveMatch --> Page2_Lobby: Return to Lobby
```

---

## 5. Verification & Testing Record

### 5.1 Automated Unit & Integration Suite (`npm test`)
Executed 20 full automated tests across game rules, board coordinates, and turn progression:
- ✅ Base yard unlock with 6 (Standard)
- ✅ Base yard unlock with 1 or 6 (Fast Start)
- ✅ Global track 52-cell coordinate integrity check
- ✅ 4 quadrant start coordinates (`RED 0`, `GREEN 13`, `YELLOW 26`, `BLUE 39`)
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
  - `dist/assets/index-Cd7fz-M0.css`: `76.38 kB`
  - `dist/assets/index-DsEJPcgt.js`: `304.25 kB`
  - **Result: 0 errors, 0 warnings (built in 937ms)**

### 5.3 Live Server & Asset Verification
- **Dev Server Status:** Active background task serving on port 5174.
- **Root URL Response:** `http://localhost:5174/` $\to$ `HTTP 200 OK`.
- **Page 2 Asset:** `http://localhost:5174/page2_reference.jpg` $\to$ `HTTP 200 OK`.
- **Mobile Wi-Fi URL:** `http://192.168.1.7:5174/`.

