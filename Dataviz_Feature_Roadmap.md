# Dataviz — Ambitious Feature Roadmap

**Repo:** `Aryan0906/Dataviz` · **Scope:** Full "go big" roadmap across AI/NLP, Collaboration, Analytical Power, and Polish/UX
**Context:** Built for a mix of portfolio showcase + real-product potential + continued learning. Every feature below is grounded in the actual codebase — several deliberately *resurrect* infrastructure that's already half-built and currently dead (Celery, `langchain_helpers.py`, `useRealtimeSubscription.js`, `UserHistory`, `CelebrationModal`), rather than starting from zero.

## How to read this document

Each feature has:
- **Pitch** — what the user experiences
- **Why** — the value it adds
- **Build plan** — concrete technical approach against the current stack (Django/DRF, Supabase, React, sklearn, langchain)
- **Effort** — S (1-3 days) / M (1-2 weeks) / L (2-4 weeks) / XL (month+)
- **Resurrects** — tag noting if this finishes existing dead code instead of adding new surface area

A suggested phase sequencing is at the very end.

---

# A. AI / NLP Intelligence

### A1. Real Chat-to-Chart (fix the fake one)
**Pitch:** Type "show average revenue by region as a pie chart" and get a real chart, not keyword-matching.
**Why:** This is the headline feature in the README ("NLP-Powered Chat") and it's currently `simulateNLPProcessing()` — local substring matching. It's the single highest-credibility fix available because the backend NLP stack (`nlp_helpers.py`, `langchain_helpers.py`) already exists and is just disconnected.
**Build plan:**
- Add a `POST /api/data/categorical-query` view that calls `nlp_helpers.py`-style parsing (spaCy NER for column/value mentions) and falls back to `langchain_helpers.recommend_chart_type()` / a new `nl_query_to_chart_config()` chain for anything keyword matching can't resolve.
- Replace `simulateNLPProcessing()` in `CategoricalChatNLP.jsx` with a real `dataAPI` call (mirror the pattern already used by `AIFeatures.jsx`'s `queryAI`).
- Cache parsed intents per session so repeated similar queries don't re-hit the LLM (cost control).
**Effort:** M · **Resurrects:** `nlp_helpers.py`, `langchain_helpers.py` (418 dead lines)

### A2. AI Data Storyteller
**Pitch:** Upload a CSV, get a 3-4 sentence plain-English narrative ("Sales grew steadily until March, then dropped 22% — likely tied to the 3 missing entries in the Region column") instead of just charts.
**Why:** Turns raw stats into something a non-technical reader (e.g. a professor, a client) can skim in 10 seconds. Strong portfolio/demo moment.
**Build plan:**
- Extend `ai_helpers.generate_metadata_summary()` (already builds a token-efficient summary) and feed it to a new prompt template asking for a narrative, not just cleaning suggestions.
- Surface in a new `<StorySummaryCard>` component pinned to the top of `SmartAnalytics.jsx` and `ManualPlotCategorical.jsx`.
- Persist the generated text on `Visualization.ai_summary` — that field already exists on the model and is currently underused.
**Effort:** M

### A3. AI Chart-Type Recommender (surface what already exists)
**Pitch:** When categorical data is uploaded, the app proactively suggests "This looks like a good fit for a stacked bar chart" instead of making the user pick.
**Why:** `langchain_helpers.py` already contains a `recommend_chart_type()` function that's never called from any view. This is close to a one-day win.
**Build plan:** Wire it into `upload_csv`'s response payload; render as a dismissible suggestion chip above the chart picker in `ManualPlotCategorical.jsx` and `CategoricalChatNLP.jsx`.
**Effort:** S · **Resurrects:** `recommend_chart_type()` in `langchain_helpers.py`

### A4. Outlier & Anomaly Explainer
**Pitch:** Instead of just flagging "3 outliers detected," the app explains *why* — "Row 14 (x=450) is 6x the typical range and may be a data-entry error" — and offers a one-click "exclude and refit."
**Why:** `data_cleaning.py` already does outlier detection numerically; this adds the missing "so what" layer, and ties directly into the regression engine via C7 below.
**Build plan:** New `explain_outliers()` helper combining z-score/IQR flags from `data_cleaning.py` with a short LLM explanation per flagged row; surface in `DataHealthModal.jsx` (already exists, currently only shows raw health stats).
**Effort:** M

### A5. Natural-Language Regression Constraints
**Pitch:** "Fit a line ignoring anything above x=100" or "force the model through the origin" typed as plain text, applied to the regression engine.
**Why:** Differentiates this from every other "auto chart" tool — most don't let you steer the model conversationally.
**Build plan:** Small intent-classification layer (regex + LLM fallback) that maps phrases to parameters already accepted by `regression_models.py` (`fit_intercept`, data filters) before calling `find_best_regression()`.
**Effort:** M

### A6. Confidence-Aware AI Insights
**Pitch:** AI commentary explicitly says when it's *not* confident — "R² is only 0.41, so this trend should be treated as weak" — instead of always sounding equally certain.
**Why:** Builds trust, and is an easy, honest differentiator once A2 exists. Ties model metrics that already exist (`r2`, `adjusted_r2`, `rmse`) into the prompt so the LLM's tone reflects actual fit quality.
**Effort:** S (once A2 ships)

### A7. Voice-to-Chart Input
**Pitch:** Hold a mic button in the chat interface and speak a query instead of typing.
**Why:** Cheap, demo-friendly "wow" feature for a portfolio video; trivial once A1 exists.
**Build plan:** Web Speech API (`SpeechRecognition`) in the browser piping transcribed text into the same input `handleChatSubmit` already uses.
**Effort:** S

---

# B. Collaboration & Sharing

### B1. Public Read-Only Share Links
**Pitch:** "Share" button on any saved analysis generates a URL like `/view/a8f3c1` that renders the chart + stats to anyone, no login required.
**Why:** The single most-requested feature for any analysis tool — letting people show results without forcing the viewer to sign up.
**Build plan:**
- Add `share_token` (UUID, nullable, unique) + `is_public` to `AnalysisResult` and `Visualization`.
- New unauthenticated view `GET /api/share/<token>` returning read-only data.
- New route `/view/:token` rendering a stripped-down, no-edit version of the existing chart components.
- Revoke via the same toggle.
**Effort:** M

### B2. Real-Time Collaborative Sessions
**Pitch:** Two people open the same analysis link; both see chart updates, cursor positions, and "X is typing a query" live.
**Why:** `useRealtimeSubscription.js` (116 lines) is already written and wired for Supabase Realtime — it's just never imported anywhere. This is genuinely "finish what you started," not new infrastructure.
**Build plan:**
- Wire the hook into `ManualPlotRegression.jsx`/`ManualPlotCategorical.jsx`, subscribing to a `room_id` channel keyed by `DraftAnalysis.id`.
- Broadcast chart-config and data-point changes; use Supabase Presence for the "who's online" avatars.
- Add basic conflict handling (last-write-wins is fine for v1, matches `DraftAnalysis`'s existing auto-save model).
**Effort:** L · **Resurrects:** `useRealtimeSubscription.js`

### B3. Point/Region Annotations & Comments
**Pitch:** Click a data point or drag-select a region on a chart, leave a comment pinned to it — like commenting on a Figma file.
**Why:** Makes saved analyses genuinely useful for async team review, not just personal scratch space.
**Build plan:** New `ChartAnnotation` model (`visualization_id`, `user_id`, `position` JSON, `text`, `created_at`). Plotly/Highcharts both support custom click handlers and shape overlays for anchoring pins.
**Effort:** L

### B4. Workspaces & Role-Based Sharing
**Pitch:** Create a "Team" workspace, invite collaborators by email, set them as viewer/editor, and share a folder of analyses instead of one link at a time.
**Why:** Turns this from a single-user tool into something a study group, lab, or small team would actually adopt — relevant given the kind of academic/technical circles this tool tends to circulate in.
**Build plan:** `Workspace` + `WorkspaceMembership` models; extend `AnalysisResult`/`Visualization` with an optional `workspace_id`; permission checks layered onto the existing `_require_auth` pattern (or, better, the DRF migration that's worth doing anyway — this is a great forcing function for it).
**Effort:** XL

### B5. Embeddable Chart Widget
**Pitch:** "Embed" button gives an `<iframe>` snippet to drop a live, interactive chart into a blog post, portfolio site, or Notion doc.
**Why:** Free distribution — every embed is a backlink/demo of the product.
**Build plan:** A minimal `/embed/:token` route rendering just the chart (no nav, no auth chrome) reusing B1's share-token plumbing with stricter CSP/X-Frame-Options carve-outs.
**Effort:** S (after B1)

### B6. Activity Feed from Existing History
**Pitch:** A "Recent Activity" panel showing "You created Analysis X," "Analysis Y was viewed 4 times this week."
**Why:** `UserHistory` (with `action_type` choices for create/update/delete/view/export) already captures exactly this data — it's currently write-only, nothing reads it back for the user.
**Build plan:** New `GET /api/history/feed` (paginated!) + a feed component on the dashboard surfacing `UserHistory` rows in human-readable form.
**Effort:** S · **Resurrects:** `UserHistory` model

### B7. Version History & Rollback
**Pitch:** See every prior state of an analysis and restore an older version, similar to Google Docs version history.
**Why:** Pairs naturally with B6 — `UserHistory.snapshot_data` already stores a full data snapshot per action; this mostly needs a UI plus confirming the existing `restore_from_history` endpoint is actually called from anywhere in the frontend (if not, that's another quick wire-up rather than new backend work).
**Effort:** M · **Resurrects:** `UserHistory.snapshot_data`

---

# C. Analytical Power

### C1. Multivariate Regression
**Pitch:** Fit `y = f(x1, x2, x3, ...)` instead of being limited to one independent variable.
**Why:** This is the biggest functional ceiling on the current product — `regression_models.py` and the `AnalysisResult.data_points` shape are both built around single x→y pairs. Real datasets are rarely one-variable.
**Build plan:**
- Extend `data_points` to accept a list of feature columns; update the regression selector to take an `X` matrix instead of a vector (sklearn already supports this natively — most of the model classes used, e.g. `LinearRegression`, `Ridge`, `RandomForestRegressor`, take multi-column `X` with no code change).
- Frontend: column picker for "target" vs. "feature(s)" instead of a fixed two-column table.
- Visualization gets harder past 2 features — pair with a coefficient/feature-importance bar chart instead of a 2D scatter+line.
**Effort:** L

### C2. Honest Model Validation (train/test + cross-validation)
**Pitch:** "Best model" selection actually reflects generalization, not just how well a flexible model memorized the training points.
**Why:** Flagged in the prior audit as a correctness issue — `cross_val_score` is already imported in `regression_models.py` and never called. Fixing this is foundational; every analytical feature built on top of "best model" inherits this bug otherwise.
**Build plan:** In the model-selection step, replace the raw-`adjusted_r2`-on-training-data ranking with k-fold CV score (k=5, or leave-one-out for very small datasets) for model *selection*, while still reporting full-data R²/RMSE for *display*. Penalize model complexity explicitly for tree-based models on small N.
**Effort:** M

### C3. Prediction Intervals, Not Just Point Estimates
**Pitch:** Hover a forecasted point and see "247 ± 18 (95% CI)" instead of a bare number.
**Why:** Point predictions without uncertainty are misleading for anything resembling real decision-making — a natural and credible upgrade once C2 lands.
**Build plan:** Bootstrap resampling (refit N times on resampled data, take the prediction spread) — works uniformly across every model type already supported, no per-model statistical formula needed.
**Effort:** M

### C4. Classification Mode
**Pitch:** Toggle from "predict a number" to "predict a category" — logistic regression, decision tree classifier, confusion matrix, ROC curve.
**Why:** Doubles the addressable use cases (pass/fail, churn yes/no, category prediction) using a sibling model-selector class and sklearn classifiers already one import away.
**Effort:** L

### C5. Time-Series Forecasting
**Pitch:** Upload a dataset with a date column, get trend/seasonality decomposition and an N-period forecast, not just a static regression line.
**Why:** A genuinely different analytical mode from everything else in the app — strong differentiator, and date-typed columns are already detected by the existing column-type inference (`data_validation.py`).
**Build plan:** `statsmodels` (lightweight, no new infra burden) for trend/seasonal decomposition; simple exponential smoothing or ARIMA for the forecast; new chart type with a shaded forecast-confidence band.
**Effort:** L

### C6. Statistical Hypothesis Testing Suite
**Pitch:** "Is the difference between Group A and Group B significant?" — t-test, ANOVA, chi-square — with a plain-English verdict, not just a p-value.
**Why:** Complements the categorical-analysis side of the app (currently purely descriptive) with genuine inferential statistics — exactly the kind of rigor that elevates this from a "pretty charts" tool to an actual analysis tool.
**Build plan:** `scipy.stats` (already a dependency!) wrapped in a new `stats_tests.py` util; a "Compare Groups" panel in `ManualPlotCategorical.jsx`.
**Effort:** M · **Resurrects:** unused depth of the existing `scipy` dependency

### C7. Robust Regression for Messy Real-World Data
**Pitch:** A "robust fit" toggle that down-weights outliers (RANSAC/Huber) instead of being dragged off course by a few bad points.
**Why:** Pairs with A4's outlier explanations — explain the outlier, then optionally fit around it automatically.
**Effort:** S (sklearn ships both `RANSACRegressor` and `HuberRegressor` directly)

### C8. Multi-Dataset Join & Compare
**Pitch:** Upload two CSVs, join them on a shared column, and analyze the merged result — or just overlay two saved analyses on one chart to compare trends.
**Why:** Real analysis work is rarely single-file; this removes a major real-world limitation.
**Effort:** L

### C9. Derived Columns / Formula Builder
**Pitch:** A spreadsheet-style `=col1 / col2 * 100` bar to create computed columns before visualizing, without leaving the app.
**Why:** Removes the "go back to Excel to compute a ratio" workflow break.
**Build plan:** Small safe-expression evaluator (e.g. `asteval`, or a hand-rolled AST-restricted parser — **explicitly not Python's `eval()`**, which is the exact dangerous pattern already sitting as a cautionary example elsewhere in this codebase) scoped to arithmetic on existing columns only.
**Effort:** M

---

# D. Polish & UX

### D1. Guided Sample Datasets & Templates
**Pitch:** First-run experience offers "Try it with: Student Grades, Sales Trends, Sensor Data" one-click sample datasets instead of a blank upload box.
**Why:** `OnboardingWizard.jsx` already exists and is routed at `/onboarding` — this gives it something concrete to *do* beyond a generic walkthrough, and removes the classic empty-state drop-off.
**Effort:** S · **Resurrects:** `OnboardingWizard.jsx`

### D2. One True Landing Page / Dashboard / Manual-Plot Flow
**Pitch:** A single, polished entry experience instead of 5 landing pages, 3 dashboards, and 2 manual-plot wrappers all live at once.
**Why:** Directly from the audit — this is presentation risk as much as it's tech debt. A reviewer (or recruiter) randomly landing on `/landing-classic` or `/dashboard-classic` sees an inferior, half-abandoned version of the product.
**Build plan:** Pick the strongest of each set (likely `ProfessionalLanding`, `ModernDashboard`, `ModernManualPlot` based on naming/recency), delete the rest, redirect old routes. If some "classic" UI patterns are worth keeping, fold them in as **settings**, not separate routes (e.g. a density/theme toggle, not a whole second dashboard).
**Effort:** M (mostly deletion + redirect work, low risk)

### D3. Command Palette (⌘K)
**Pitch:** `Cmd+K` opens a fuzzy search over every page, saved analysis, and action ("New regression," "Open last visualization").
**Why:** Cheap, high-polish, power-user-friendly addition; `cmdk` is **already an installed dependency** with no implementation using it yet.
**Effort:** S · **Resurrects:** unused `cmdk` package

### D4. Finish the Gamification Loop
**Pitch:** Hitting a milestone (first analysis saved, 10 analyses, a great R² fit) triggers a real celebration moment, not nothing.
**Why:** `CelebrationModal.jsx` is fully built (confetti and all) but **never imported anywhere** — `AchievementModal.jsx` and `ProgressTracker.jsx` are wired in, but the celebratory payoff component sits unused. This is the cheapest "finish it" win in the whole roadmap.
**Build plan:** Trigger `CelebrationModal` from the same events `AchievementModal`/`UserHistory` already track (first save, streaks, high-R² fits).
**Effort:** S · **Resurrects:** `CelebrationModal.jsx`

### D5. Export to Jupyter Notebook
**Pitch:** "Export as Notebook" alongside the existing "Export as Python script," producing a runnable `.ipynb` with the chart inline.
**Why:** Natural extension of `code_generator.py`, which already builds Matplotlib/Seaborn/Plotly code as text — wrapping that same generated code in `nbformat` cells is a short hop, and notebooks are the native format for the data-science audience this tool targets.
**Effort:** S

### D6. Undo/Redo for Data Cleaning
**Pitch:** Every cleaning operation (drop nulls, fix types, remove outliers) is a step you can undo, not a one-way destructive action.
**Why:** `data_cleaning.py` already structures operations as a list (`operations` param on `clean_data`) — this is close to an undo stack already, just needs the history kept client-side and a "step back" affordance in `DataHealthModal.jsx`.
**Effort:** S

### D7. Scheduled Email Reports
**Pitch:** "Email me a summary every Monday" for a saved analysis tracking a live dataset.
**Why:** This is *exactly* the kind of long-running, non-blocking job the dead Celery/Redis infrastructure (`tasks.py`, `celery.py`) was clearly intended for. Rather than ripping that infra out as pure dead weight, this gives it a real job: configure a periodic task schedule and have it render + email a digest.
**Effort:** M · **Resurrects:** Celery/Redis infrastructure (currently fully dead)

### D8. Mobile-First Chart Interactions
**Pitch:** Pinch-to-zoom, swipe between saved analyses, and a bottom-sheet chart-options panel on phones, instead of a desktop layout squeezed onto a small screen.
**Why:** A meaningful chunk of "show this to someone quickly" moments happen on a phone; current layout is desktop-first per the component structure.
**Effort:** M

### D9. Theme & Accessibility Audit
**Pitch:** Guarantee every chart, modal, and export genuinely respects dark/light theme and meets basic contrast/keyboard-nav standards — not just the chrome around the charts.
**Why:** `theme-provider.jsx`/`theme-toggle.jsx` exist and are wired into the main layout, but third-party chart libraries (Plotly, Highcharts, Desmos) each need their own explicit theme configs passed in — easy to miss per-chart-type, worth a deliberate pass.
**Effort:** S

---

# Suggested Phasing

| Phase | Focus | Key features |
|---|---|---|
| **0 — Foundation** | Fix what blocks everything else | C2 (honest model validation) before building anything on top of "best model" logic; resolve the auth/env issues from the codebase audit |
| **1 — Quick Wins (2-3 weeks)** | Cheap, visible polish | A3, A6, A7, B5, B6, D1, D3, D4, D5, D6, D9, C7 |
| **2 — Flagship Features (1-2 months)** | The features that change what the product *is* | A1, A2, C1, B1, D2 |
| **3 — Collaboration Layer** | Multi-user value | B2, B3, B7, C6 |
| **4 — Ambitious / Moonshot** | Bigger bets, bigger payoff | B4, C4, C5, C8, C9, D7, D8 |

Resurrecting dead code (`langchain_helpers.py`, `useRealtimeSubscription.js`, `UserHistory`, `CelebrationModal`, Celery) should generally be sequenced *before* writing new infrastructure that does the same job — in every one of those cases, most of the hard part is already done.
