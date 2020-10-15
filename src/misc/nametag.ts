import { PlayerJoinEvent } from 'org.bukkit.event.player';
import { NameTagVisibility } from 'org.bukkit.scoreboard';

const TEAM_NAME = 'nametag';

const board = server.scoreboardManager.mainScoreboard;

let team = board.getTeam(TEAM_NAME);

function initTeam() {
  // Create new team, which hides nametag from the player
  console.log(`Creating a new team: ${TEAM_NAME}`);
  team = board.registerNewTeam(TEAM_NAME);
  team.setNameTagVisibility(NameTagVisibility.NEVER);
}

registerEvent(PlayerJoinEvent, (event) => {
  if (!team || !board.getTeam(TEAM_NAME)) {
    initTeam();
  }

  team?.addPlayer(event.player);
});
