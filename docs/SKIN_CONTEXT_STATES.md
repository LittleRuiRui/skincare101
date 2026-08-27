# Skin context states

Skin context states are temporary modifiers layered on top of a user's base skin profile. They must never overwrite base skin type.

Supported states:
- acid / exfoliation use
- retinoid use
- sensitivity or barrier flare
- post-procedure recovery
- breakout period
- environmental change
- pregnancy / breastfeeding context

Stored under `profile_answers` so existing profile schemas remain backward compatible:
- `special_states`: comma-separated keys
- `acid_frequency`: occasional / regular / high
- `retinoid_stage`: starting / stable / increased
- `environment_direction`: cold_dry / hot_humid / aircon / other

Recommendation behavior:
- active-load states add barrier/hydration/soothing preference and reduce stacking of strong exfoliants/retinoids
- sensitive flare and post-procedure recovery use stronger conservative rules
- breakout context raises acne suitability weight
- cold/dry and air-conditioned environments raise hydration/barrier weight
- hot/humid context raises oil-control/hydration weight
- pregnancy/breastfeeding uses conservative filtering for retinoids

Profile names are suggested from the most relevant temporary state plus local creation timestamp, but remain editable by the user.
