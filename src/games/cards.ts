import { ChatColor } from 'net.md_5.bungee.api';
import { Material, SoundCategory } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { Item, Player } from 'org.bukkit.entity';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { Vector } from 'org.bukkit.util';
import { CustomItem } from '../common/items/CustomItem';
import * as yup from 'yup';
import { Action } from 'org.bukkit.event.block';
import { isRightClick } from '../common/helpers/click';

const ZERO_VECTOR = new Vector();
const PICKUP_DELAY = 12000; // TICKS -> 10 minutes
const MAX_CARDS_IN_DECK = 54; // 52 cards + 2 jokers
const SHUFFLE_COOLDOWN = 1250; // milliseconds

const CARD_FLIP_SOUND = 'custom.card';
const DECK_SHUFFLE_SOUND = 'custom.shuffle';

const CARDS = new Map<string, CustomItem<{}>>();
const SHUFFLE_COOLDOWNS = new Set<Player>();

/*
 *  Defining deck items
 */
const FULL_DECK = new CustomItem({
  id: 56,
  name: ChatColor.RESET + 'Korttipakka',
  type: Material.PRISMARINE_CRYSTALS,
  modelId: 56,
  data: {
    cards: yup.array<string>(),
  },
});
const HALF_DECK = new CustomItem({
  id: 57,
  name: ChatColor.RESET + 'Korttipakka',
  type: Material.PRISMARINE_CRYSTALS,
  modelId: 57,
  data: {
    cards: yup.array<string>(),
  },
});
const LOW_DECK = new CustomItem({
  id: 58,
  name: ChatColor.RESET + 'Korttipakka',
  type: Material.PRISMARINE_CRYSTALS,
  modelId: 58,
  data: {
    cards: yup.array<string>(),
  },
});

/*
 *  Defining special cards
 */
const HIDDEN_CARD = new CustomItem({
  id: 55,
  name: ChatColor.RESET + 'Pelikortti',
  type: Material.PRISMARINE_CRYSTALS,
  modelId: 55,
  data: {
    cardID: yup.string(),
  },
});

/**
 *    Generate Custom Items for Cards
 */
for (let modelID = 1; modelID <= MAX_CARDS_IN_DECK; modelID++) {
  const cardID = getCardID(modelID);
  CARDS.set(
    cardID,
    new CustomItem({
      id: modelID,
      name: ChatColor.RESET + `Pelikortti [${cardID}]`,
      type: Material.PRISMARINE_CRYSTALS,
      modelId: modelID,
    }),
  );
}

function getCardID(modelID: number): string {
  let country = '';
  let number = 0;
  let cardID = '';

  if (modelID <= 13) {
    // CLUBS
    country = ChatColor.DARK_GRAY + '♣' + ChatColor.RESET;
    number = modelID;
  } else if (modelID <= 26) {
    // DIAMONDS
    country = ChatColor.RED + '♦' + ChatColor.RESET;
    number = modelID - 13;
  } else if (modelID <= 39) {
    // HEARTS
    country = ChatColor.RED + '♥' + ChatColor.RESET;
    number = modelID - 2 * 13;
  } else if (modelID <= 52) {
    // SPADES
    country = ChatColor.DARK_GRAY + '♠' + ChatColor.RESET;
    number = modelID - 3 * 13;
  }

  cardID = `${country}${number}`;

  if (modelID === 53) {
    cardID = ChatColor.DARK_GRAY + '♠' + ChatColor.RESET + `O`;
  } else if (modelID === 54) {
    cardID = ChatColor.RED + '♥' + ChatColor.RESET + 'O';
  }

  switch (number) {
    case 11:
      cardID = `${country}J`;
      break;
    case 12:
      cardID = `${country}Q`;
      break;
    case 13:
      cardID = `${country}K`;
      break;
  }

  return cardID;
}

/**
 * Removes card from deck and puts it to players mainhand
 * @param deck deck to remove card from
 * @param player player to give item to
 */
function removeCard(deck: ItemStack, player: Player) {
  const d = getDeck(deck);

  if (!d) return;
  if (!d.cards) return;

  const oldCards = d.cards;
  const cardID = oldCards[oldCards.length - 1]; // ID of "top" card in deck
  const card = HIDDEN_CARD.create({ cardID: cardID });

  oldCards.pop();
  d.cards = oldCards;
  player.inventory.itemInMainHand = card;
  player.world.playSound(
    player.location,
    CARD_FLIP_SOUND,
    SoundCategory.PLAYERS,
    1,
    1,
  );

  player.inventory.itemInOffHand = getResizedDeck(deck);
}

/**
 * Removes card from players mainhand and puts it "top" of deck
 * @param deck Deck to insert card in
 * @param card Card to be placed top deck
 * @param player
 */
function insertCard(deck: ItemStack, card: ItemStack, player: Player) {
  const d = getDeck(deck);

  if (!d) return;
  if (!d.cards) return;
  if (d.cards.length === MAX_CARDS_IN_DECK) return;

  let cardID = '';
  const hiddenCard = HIDDEN_CARD.get(card);
  if (hiddenCard) {
    cardID = hiddenCard.cardID;
  } else {
    cardID = getCardID(card.itemMeta.customModelData);
  }
  d.cards = [...d.cards, cardID];
  card.amount--;
  player.world.playSound(
    player.location,
    CARD_FLIP_SOUND,
    SoundCategory.PLAYERS,
    1,
    1,
  );

  player.inventory.itemInOffHand = getResizedDeck(deck);
}

function splitDeck(deck: ItemStack, player: Player) {
  const d = getDeck(deck);
  if (!d) return;
  if (!d.cards) return;

  const cards = d.cards;

  const half = Math.ceil(cards.length / 2);
  const firstHalfCards = cards.splice(0, half);
  const secondHalfCards = cards.splice(-half);

  d.cards = firstHalfCards;
  const newDeck = FULL_DECK.create({ cards: secondHalfCards });
  player.inventory.itemInMainHand = newDeck;

  player.inventory.itemInOffHand = getResizedDeck(deck);
  player.inventory.itemInMainHand = getResizedDeck(newDeck);

  player.world.playSound(
    player.location,
    CARD_FLIP_SOUND,
    SoundCategory.PLAYERS,
    1,
    1,
  );
}

function combineDeck(deck: ItemStack, secondDeck: ItemStack, player: Player) {
  const d = getDeck(deck);
  if (!d) return;
  if (!d.cards) return;

  const s = getDeck(secondDeck);
  if (!s) return;
  if (!s.cards) return;

  if (d.cards.length + s.cards.length > MAX_CARDS_IN_DECK) return;

  d.cards = [...d.cards, ...s.cards];
  secondDeck.amount--;
  player.inventory.itemInOffHand = getResizedDeck(deck);

  player.world.playSound(
    player.location,
    CARD_FLIP_SOUND,
    SoundCategory.PLAYERS,
    1,
    1,
  );
}

async function shuffleDeck(
  deck: ItemStack,
  secondDeck: ItemStack,
  player: Player,
) {
  SHUFFLE_COOLDOWNS.add(player);
  const d = getDeck(deck);
  if (!d) return;
  if (!d.cards) return;

  const s = getDeck(secondDeck);
  if (!s) return;
  if (!s.cards) return;

  if (d.cards.length + s.cards.length > MAX_CARDS_IN_DECK) return;

  const shuffledCards: string[] = [];

  const mainDeckSmaller = s.cards.length > d.cards.length;
  let maxIndex = 0;
  mainDeckSmaller ? (maxIndex = d.cards.length) : (maxIndex = s.cards.length);

  for (let i = 0; i < maxIndex; i++) {
    shuffledCards.push(s.cards[i], d.cards[i]);
  }

  if (mainDeckSmaller) {
    s.cards.splice(0, maxIndex);
    shuffledCards.push(...s.cards);
  } else {
    d.cards.splice(0, maxIndex);
    shuffledCards.push(...d.cards);
  }

  d.cards = shuffledCards;
  secondDeck.amount--;
  player.inventory.itemInOffHand = getResizedDeck(deck);

  player.world.playSound(
    player.location,
    DECK_SHUFFLE_SOUND,
    SoundCategory.PLAYERS,
    1,
    1,
  );

  await wait(SHUFFLE_COOLDOWN, 'millis');
  SHUFFLE_COOLDOWNS.delete(player);
}

function getDeck(item: ItemStack) {
  const d = FULL_DECK.get(item) || HALF_DECK.get(item) || LOW_DECK.get(item);
  return d;
}

function isDeck(item: ItemStack): boolean {
  return FULL_DECK.check(item) || HALF_DECK.check(item) || LOW_DECK.check(item);
}

function isCard(item: ItemStack): boolean {
  return item.type === Material.PRISMARINE_CRYSTALS && !isDeck(item);
}

function getResizedDeck(deck: ItemStack): ItemStack {
  const d = getDeck(deck);
  if (!d) return deck;
  if (!d.cards) return deck;

  //console.log(d.cards);

  let resizedDeck;

  if (d.cards.length >= 35) {
    resizedDeck = FULL_DECK.create({ cards: d.cards });
  } else if (d.cards.length >= 18) {
    resizedDeck = HALF_DECK.create({ cards: d.cards });
  } else if (d.cards.length > 1) {
    resizedDeck = LOW_DECK.create({ cards: d.cards });
  } else {
    const cardID = d.cards[0];
    if (!cardID) return deck;
    return HIDDEN_CARD.create({ cardID: cardID });
  }

  resizedDeck.lore = [ChatColor.DARK_GRAY + `${d.cards.length} korttia`];
  return resizedDeck;
}

/**
 * Called ONCE on ANY click in PlayerInteractEvent
 * @param player Player who clicked
 * @param isRightClick True if player rightclicked with either hand
 */
function ClickedOnce(
  player: Player,
  isRightClick: boolean,
  blockFace: BlockFace,
) {
  if (SHUFFLE_COOLDOWNS.has(player)) return;
  const mainHandItem = player.inventory.itemInMainHand;
  const offHandItem = player.inventory.itemInOffHand;

  // place/pick card to/from ground
  if (blockFace === BlockFace.UP && isRightClick) {
    if (isCard(mainHandItem)) {
      // Place card on block
      const raytrace = player.rayTraceBlocks(2.5);
      if (!raytrace) return;
      if (!raytrace.hitBlock) return;

      const card = player.world.dropItem(
        raytrace.hitPosition.toLocation(player.world),
        mainHandItem,
      );

      mainHandItem.amount--;
      card.velocity = ZERO_VECTOR;
      card.pickupDelay = PICKUP_DELAY;
    } else if (mainHandItem.type === Material.AIR) {
      // Pickyp card from block
      const raytrace = player.rayTraceBlocks(2.5);
      if (!raytrace) return;
      const hitLoc = raytrace.hitPosition.toLocation(player.world);
      const entities = hitLoc.getNearbyEntities(0.001, 0.001, 0.001);
      for (const entity of entities) {
        if (entity instanceof Item) {
          const item = entity.itemStack;
          if (isCard(item)) {
            player.inventory.itemInMainHand = item;
            entity.remove();
            return;
          }
        }
      }
    }
    return;
  }

  // TOGGLE HIDDEN CARD
  if (!isDeck(offHandItem)) {
    if (isRightClick) {
      if (HIDDEN_CARD.check(mainHandItem)) {
        // SET TO CARD
        const hiddenCard = HIDDEN_CARD.get(mainHandItem);
        if (!hiddenCard) return;
        if (!hiddenCard.cardID) return;

        const card = CARDS.get(hiddenCard.cardID);
        if (!card) return;

        player.inventory.itemInMainHand = card.create();
      } else if (isCard(mainHandItem)) {
        // SET TO HIDDEN
        const cardID = getCardID(mainHandItem.itemMeta.customModelData);
        const hiddenCard = HIDDEN_CARD.create({ cardID: cardID });
        player.inventory.itemInMainHand = hiddenCard;
      }
    }
    return;
  }

  if (isRightClick) {
    // REMOVE CARD
    if (mainHandItem.type !== Material.AIR) return;
    removeCard(offHandItem, player);
    return;
  }

  if (isDeck(mainHandItem)) {
    if (player.isSneaking()) {
      // SNEAKING LEFT CLICK
      shuffleDeck(offHandItem, mainHandItem, player);
    } else {
      // LEFT CLICK (deck in hand)
      combineDeck(offHandItem, mainHandItem, player);
    }
  } else if (isCard(mainHandItem)) {
    insertCard(offHandItem, mainHandItem, player);
  } else if (mainHandItem.type === Material.AIR) {
    splitDeck(offHandItem, player);
  }
}

/**
 * GIVE PLAYER A DECK FULL OF CARDS
 */
registerCommand('deck', (sender) => {
  if (!(sender instanceof Player)) return;
  const player = sender as Player;
  if (!player.isOp()) return;
  const cards = Array.from(CARDS.keys());
  const deck = FULL_DECK.create({ cards: cards });
  deck.lore = [ChatColor.DARK_GRAY + `${cards.length} korttia`];
  player.world.dropItem(player.location, deck);
});

const CARD = new CustomItem({
  id: 55,
  name: ChatColor.RESET + 'Pelikortti',
  type: Material.PRISMARINE_CRYSTALS,
  modelId: 55,
});

registerEvent(PlayerInteractEvent, async (event) => {
  if (event.hand === EquipmentSlot.HAND) {
    await wait(1, 'millis');
    ClickedOnce(event.player, isRightClick(event.action), event.blockFace);
  } else {
    if (event.action === Action.RIGHT_CLICK_BLOCK) return;
    if (event.player.inventory.itemInMainHand.type !== Material.AIR) return;
    ClickedOnce(event.player, isRightClick(event.action), event.blockFace);
  }
});
