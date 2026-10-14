# Roadmap

Planned FFHL features in provisional priority order. Existing production data describes contributions credited to a fantasy team while a player was activated. Benched/minors NHL production is absent, including when combining records across fantasy teams. Per-game figures describe credited games, not complete NHL performance. Features requiring additional imports are identified below.

## Application features

### 1. Draft realized return

Measure which entry-draft selections contributed to FFHL teams, when they first contributed, how much they delivered, and whether the drafting team or another team received the production. Compare rounds and pick ranges using equally mature post-draft windows, with the underlying selections available for inspection.

Separate unlinked selections, immature draft classes, and linked players without recorded contribution. This measures realized FFHL return, not NHL prospect success or a predictive draft-pick price.

### 2. Searchable league transaction history

Extend the history used by career profiles into a league-wide browser for complete trades, claims, drops, and draft-pick movements by player, team, season, or trade partner. Connect events to profiles so managers can inspect previous acquisition costs.

Assemble trade source blocks into complete deals and preserve unresolved asset names. Later credited production provides context, not an automatic trade-winner verdict or proof of current ownership.

### 3. Explain team category changes

Extend the existing category dashboard's ranks, comparisons, contributors, and previous-season changes with the contributions of returning, newly recorded, and no-longer-recorded players. Show whether counting-total changes accompany changes in credited games or production per credited game, with skater and goalie exposure kept separate.

Use regular seasons for cross-team comparison; playoff opportunity and small samples differ. Describe recorded contributions without inferring acquisition dates, missed bench production, roster quality, or future matchup outcomes. Missing seasons must not appear as poor performance; goalie rates require valid aggregation inputs.

### 4. Franchise history

Bring season results, playoff finishes, category profiles, leading contributors, draft return, and notable transactions into one team view. Link to the underlying career, draft, transaction, and leaderboard records so managers can follow how a franchise changed across seasons.

Use franchise identity consistently across historical team names. Manager-tenure comparisons would require a separate, reliable manager history.

### 5. Current roster context in the archive

Connect a timestamped roster import to historical profiles to distinguish current roster members, former contributors, and rostered players without recorded FFHL contribution. Include minors and reserve players so the archive can connect draft and transaction history even before a credited appearance.

Requires a reliable roster import and identity links. Historical production and the latest transaction alone cannot establish current ownership. Keep roster management in Fantrax; missing contributions do not establish player quality or free-agent availability.

### 6. Historical matchup context

Archive weekly FFHL category values and results to explore close contests, recurring rivals, category win rates, and same-week comparisons against other opponents. Keep hypothetical all-opponent results separate from official standings.

Requires additional weekly matchup imports and applicable scoring, tie, and goalie-eligibility rules. Season aggregates and the existing finals archive cannot reconstruct regular-season weekly results. Validate source season and coverage before presenting schedule strength or other derived comparisons.

### 7. League contribution explorer

Search recorded player contributions across all teams, filter by season, F/D/G and credited games, and compare category totals and rates across teams. Keep a saved shortlist of players worth investigating.

Use a shared comparison pool and make sample sizes prominent. Little or no recorded production means insufficient evidence; the explorer cannot establish complete NHL ability, free-agent availability, or hidden production from benched players.

### 8. Historical trade-package comparison

Build both sides of a multi-player package and compare the mix of categories those players delivered over selected seasons. Show credited games, positions, team splits, and historical rates alongside totals.

Keep this an extension of player comparisons. Do not present equal-games extrapolation as an expected roster gain, assign unsupported values to prospects, or reduce the result to a predictive fair-trade score.
