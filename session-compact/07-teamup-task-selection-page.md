# Ludo King: Page 5C (Team Up Penalty Task Selection Page) — Architecture & Implementation

> **Document Location:** `session-compact/06-teamup-task-selection-page.md`  
> **Session Phase:** Team Up Post-Setup Task Selection Interactive Page (Loss Punishment Tasks)  
> **Target Platform:** Mobile-First Web Application (Android Chrome / iOS Safari / Responsive Desktop)  
> **Workspace:** `E:\ludo_new`  
> **Status:** Production-Ready / 100% Automated Tests Passing (103/103) / Zero Build Errors / Dev Server Live at `http://localhost:5173/`

---

## 1. Executive Summary & Flow

### 1.1 Team Up Navigation Flow
- In **Page 5B (`PassNPlayTeamUpSetupScreen`)**, users configure Team A & Team B player names, 4 unique custom token colors, and friendly kill settings.
- Clicking the **`Play`** button on Page 5B transitions cleanly to **Page 5C (`TeamUpTaskSelectionScreen`)**, preserving pending players and rule configuration.
- On Page 5C, users select any 1 punishment task for the losing team.
- Clicking **`Play Match`** on Page 5C launches the game arena with the selected punishment task.
- Clicking the bottom-left curved golden back button navigates back to Page 5B without losing configured team data.

### 1.2 "Bss Task Select Krne Ke Alawa Or Kuch Nhi Aana Chaiye Page Pr"
Per the user's explicit requirement, Page 5C is completely dedicated and free of extraneous clutter, ads, or secondary settings:
1. **Header Ribbon Banner:** 
   - Grand golden arched banner: `"SELECT PENALTY TASK"` / `"Losing team will have to do this task!" (हारने वाली टीम को यह टास्क करना होगा)`.
   - Subtle sound toggle button in the top right.
2. **Central Dedicated Task Selection Box:**
   - Features exactly the 3 requested tasks:
     1. **`Dance on Bhojpuri song`** (with `💃` dancer emoji & `"Haarne par poori team Bhojpuri gaane par dhamakedar dance karegi!"`)
     2. **`salute marna hai ladle`** (with `🫡` salute emoji & `"Haarne wale sabhi ladlo ko jeetne walo ke samne salute marna hoga!"`)
     3. **`Dhumka marna hai`** (with `🕺` groove emoji & `"Haarne wali team ko sabke samne mast zabardast dhumka lagana padega!"`)
3. **Interactive Selection & Feedback:**
   - Native accessible radio `<input type="radio" />` with custom styled `<label>` cards conforming to Modern Web Guidance (`card` pattern).
   - Dynamic amber border glow (`border-amber-400`), golden checkmark badge (`Check`), and coin audio chime (`soundEngine.playCoinSound()`) on selection.
   - Persistence to `localStorage` (`ludo_teamup_selected_task`, `ludo_teamup_selected_task_title`).
4. **Bottom Controls:**
   - Golden circular back button (`RotateCcw` rotated -90°).
   - High-contrast arcade `Play Match` button with golden border and hover/active states.

---

## 2. Automated Test Verification (103/103 Passing)

```
--- TEST SUITE: Page 5C Team Up Penalty Task Selection Page ---
✅ PASS: TEAM_UP_TASKS is an array
✅ PASS: There are exactly 3 tasks for selection
✅ PASS: Task 1 exists
✅ PASS: Task 1 title is exactly "Dance on Bhojpuri song"
✅ PASS: Task 1 taskNumber is 1
✅ PASS: Task 1 has dance emoji 💃
✅ PASS: Task 2 exists
✅ PASS: Task 2 title is exactly "salute marna hai ladle"
✅ PASS: Task 2 taskNumber is 2
✅ PASS: Task 2 has salute emoji 🫡
✅ PASS: Task 3 exists
✅ PASS: Task 3 title is exactly "Dhumka marna hai"
✅ PASS: Task 3 taskNumber is 3
✅ PASS: Task 3 has dhumka dance emoji 🕺
✅ PASS: Default selected task is Task 1
✅ PASS: Successfully switched to Task 2 (salute marna hai ladle)
✅ PASS: Successfully switched to Task 3 (Dhumka marna hai)
✅ PASS: Task selection persisted in localStorage is task-3
✅ PASS: Clicking Play on Team Up setup transitions to TEAM_UP_TASK_SELECTION screen
✅ PASS: Pending players and rules are saved for the match
✅ PASS: All 4 Team Up players are preserved
✅ PASS: Chosen task passed to match is Dhumka marna hai
✅ PASS: Clicking Play on Task Selection launches GAME arena
✅ PASS: URL hash #task-selection opens TEAM_UP_TASK_SELECTION directly

🎉 ALL 103 UNIT & INTEGRATION TESTS PASSED CLEANLY!
```

