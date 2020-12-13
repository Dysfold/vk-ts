registerCommand('seen', (sender, label, args) => {
  if (args.length !== 1) {
    sender.sendMessage('/seen <pelaaja>');
    return;
  }
  let name = args[0];
  const player = server.getOfflinePlayer(name);

  name = player.name || name;

  if (player.isOnline()) {
    sender.sendMessage(`§aPelaaja ${name} on paikalla`);
    return;
  }
  if (player.isBanned()) {
    name = name + ' [bannattu]';
  }

  if (!player.hasPlayedBefore()) {
    sender.sendMessage(`§cPelaaja ${name} ei ole pelannut täällä`);
    return;
  }

  const currentTime = new Date();
  const difference = currentTime.getTime() - player.lastPlayed;

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  if (!days && !hours) {
    if (minutes) {
      // If player has been offline 1 - 59 minutes
      sender.sendMessage(
        `§aPelaaja ${name} nähny viimeeksi ${minutes}min sitten`,
      );
    } else {
      // If player has been offline less than 1 minute
      sender.sendMessage(`§aPelaaja ${name} nähny alle minuutti sitten`);
    }
  }
  // If player has been offline more tha 1 hour
  else {
    sender.sendMessage(
      `§aPelaaja ${name} nähny viimeeksi ${days}pv ${hours}t ${minutes}min sitten`,
    );
  }
});
