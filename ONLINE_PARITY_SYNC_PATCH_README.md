# Element 6 online parity/sync patch

This patch changes only the online networking/camera layer; the offline sports and fight gameplay files remain the source of truth.

## Fight modes
- Ranked and unranked online fights now force a deterministic random built-in stage per match, derived from the unique match id. Both clients therefore get the exact same stage without player-side randomness.
- Ranked/unranked rollback fights use the same smooth distance-based dynamic camera behavior as the offline 1v1 camera: zoom follows player separation and camera position smoothly follows their midpoint.
- Host rollback checkpoints are now sent every 100ms with a checksum. A guest that falls materially behind or receives a mismatching checkpoint automatically replaces its rollback state and resumes instead of allowing desync to accumulate.

## Online sports
- Existing offline Soccer, Volleyball, Dodgeball, and Banger components remain the gameplay/rendering source of truth.
- Host state is sent at ~30Hz instead of ~20Hz.
- If a client stops receiving state for ~180ms it automatically requests a recovery snapshot.
- Resync snapshots are acknowledged immediately and have a timeout so one missing client cannot leave a match permanently paused.
- The 2-player, 4-player, and 6-player online sports paths continue using the same state export/restore mechanism already present in the sport components.

## Important
This is a networking/recovery patch, not a claim that internet conditions can be made mathematically incapable of packet loss. The goal is to make ordinary packet loss, jitter, late packets, and recoverable state divergence self-healing without ending or visibly breaking the match.
