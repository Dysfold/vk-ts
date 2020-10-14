import { PlayerJoinEvent } from 'org.bukkit.event.player';
import { NameTagVisibility } from 'org.bukkit.scoreboard';

const TEAMNAME = 'nametag';

const sm = server.getScoreboardManager();

const scoreboard = sm.getMainScoreboard();
let team = scoreboard.getTeam(TEAMNAME);

const initTeam = () => {
  // Create new team, which hides nametag from the player
  team = scoreboard.registerNewTeam(TEAMNAME);
  team.setNameTagVisibility(NameTagVisibility.NEVER);
};

if (!team) {
  initTeam();
}

registerEvent(PlayerJoinEvent, (event) => {
  const player = event.getPlayer();

  try {
    team?.addPlayer(player);
  } catch (error) {
    // Called if the "nametag" group was deleted
    // and if this script was not reloaded
    console.log(`Creating a new team: ${TEAMNAME}`);
    initTeam();
    team?.addPlayer(player);
  }
});
