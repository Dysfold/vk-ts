import { Bukkit, ChatColor } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { t } from '../common/localization/localization';
import { Collection } from 'java.util';

// TODO rename and translate these
const MESSAGES = [
  'Valtakaudessa voit myös käydä saunomassa! Saunakiuas rakentuu mukulakivilaatasta ja uunista, jossa on tulet. Kiukaalle pystyt heittämään vettä kauhalla tai vaikkapa vesipullolla.',
  'Kuinka monta hattua omistat? Valtakaudesta löytyy kymmenittäin hattuja, joista suurimman osan voit värjätä.',
  'Voit heittää melkein minkä tahansa esineen pitkälle hyppäämällä ylöspäin ja pudottamalla sen (Q)',
  'Haarniskajalustan asentoa voit muokata kun se on tyhjä ja halutessasi voit lisätä myös kädet klikkaamalla sitä kahdella tikulla!',
  'Haarniskajalustasta saat pikku pikku version puristamalla sen pistonilla!',
  'Voit hiipiä ovesta äänettömästi, jos avaat sen ollessasi kyykyssä.',
  'Kotkia saattaa esiintyy vesistöjen lähellä. Varo kuitenkin, sillä vahingoittunut kotka saattaa hyökätä kimppuun!',
  'Sirpillä ja viikatteella pystyt niittämään heinää ja viljaa kätevästi. Viikate niittää suuremmalta alueelta kuin sirppi.',
  'Paimensauvalla pystyt vetämään pelaajia ja eläimiä itseäsi kohti.',
  'Kaivokset kannattaa tukea hyvin käyttämällä tukkeja. Heikosti tuettu kaivos saattaa sortua päälle ja olla tappava!',
  'Suurimman osan esineistä voit nimetä vain kerran. Näin voit tunnistaa esimerkiksi varastetun miekan, kun olet kaivertanut omat nimikirjaimesi siihen.',
  'Voit käyttää esinekehyksiä lautasina laittamalla ne pöydälle. Lautasilta voit syödä tai juoda klikkaamalla sitä, ilman että otat esinettä käteesi.',
  'Pelikorteilla voit pelata lähes kaikkia korttipelejä. Pakka sisältää kaikki tavalliset 52 korttia ja näiden lisäksi 2 jokeria.',
  'Jalkapallo kimpoaa lähes kaikista kokonaisista kuutioista, mutta näiden lisäksi myös aidoista ja kaltereista. Kuulutko jo johonkin jalkapallojoukkueeseen?',
  'Pianoa voit soittaa myös kolmisointuja. Niin duuri- kuin mollikolmisoinnutkin onnistuvat!',
  'Arkkujen ja tynnyreiden lisäksi voit varastoida tavaraa lipastoihin ja kirjahyllyihin!',
].sort(() => Math.random() - 0.5);

// prettier-ignore
const PREFIX = ChatColor.YELLOW + '[' + ChatColor.GOLD + "Valtakausi" + ChatColor.YELLOW + "] " + ChatColor.GRAY;

// Broadcast messages in random order
const INTERVAL_MINUTES = 20;
const MESSAGES_LENGTH = MESSAGES.length;
let index = 0;
setInterval(() => {
  const randomMessage = MESSAGES[index];
  Bukkit.server.broadcastMessage(PREFIX + randomMessage);
  index++;
  index = index % MESSAGES_LENGTH;
}, INTERVAL_MINUTES * 60 * 1000);

/**
 * Broadcast the localized string to all players
 * @param translationKey Translation key in the server. Not respack translation key
 * @param args Formatting args for the strins
 */
export function announce(translationKey: string, ...args: string[]) {
  announceTo(Bukkit.onlinePlayers, translationKey, ...args);
}

/**
 * Broadcast the localized string to all players
 * @param players List of players who should receive the message
 * @param translationKey Translation key in the server. Not respack translation key
 * @param args Formatting args for the strins
 */
export function announceTo(
  players: Player[] | Collection<Player>,
  translationKey: string,
  ...args: string[]
) {
  for (const player of players) {
    const msg = t(player, translationKey, ...args);
    player.sendMessage(PREFIX + msg);
  }
}
