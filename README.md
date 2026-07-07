# QA Tracker

Order review tracker for monitoring AI order-taking systems across multiple restaurants and branches.
Link: https://hamadalsoqaih.github.io/monitoring-report/
## Features

- **Restaurant → Branch → Notes hierarchy** with tab-based navigation
- **Auto-computed counters**: branch order count = sum of default note counters; restaurant count = sum of branches; total = sum of restaurants
- **4 default notes per branch**: Customer normal order (OK), Customer manual order (OK), Casher normal order (ISSUE), Casher manual order (ISSUE) — start at 0, can't be deleted
- **Custom notes**: add your own notes per branch with independent counters
- **3 severity levels**: OK (green), ISSUE (amber), CRIT (red) — tap to cycle
- **Order number tagging**: attach order numbers to any note with optional timestamps (HH:MM AM/PM picker)
- **Export report**: full-screen text report grouped by severity (critical → normal → OK), notes with count 0 excluded
- **Triple-confirm safety**: delete restaurant, delete branch, reset branch, and reset all require 3 taps — auto-cancels after 2.5s
- **Reset branch**: clears notes and counters back to defaults without deleting the branch
- **Auto-growing text inputs**: all text fields expand as you type
- **Wrapping branch/restaurant tabs**: grid layout, no overflow
- **Data persistence**: localStorage saves state across sessions
- **PWA-ready**: add to iPhone home screen via Safari for app-like experience
- **Dark theme**: designed for long review sessions
- **Touch-optimized**: no tap delay, large hit targets, mobile-first layout
