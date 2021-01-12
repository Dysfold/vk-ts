import { ChatColor } from 'net.md_5.bungee.api';
import { Material, Sound, SoundCategory } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
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
const MAX_CARDS_IN_DECK = 52;

const CARD_FLIP_SOUND = 'custom.card';
const DECK_SHUFFLE_SOUND = 'custom.shuffle';

const CARDS = new Map<string, CustomItem<{}>>();

/*
 *  DEFINING DECK ITEMS
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

  // TODO - ADD JOKERS
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
  const card = CARDS.get(cardID);

  if (!card) return;

  oldCards.pop();
  d.cards = oldCards;
  player.inventory.itemInMainHand = card.create();
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

  const cardID = getCardID(card.itemMeta.customModelData);
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

function shuffleDeck(deck: ItemStack, secondDeck: ItemStack, player: Player) {
  const d = getDeck(deck);
  if (!d) return;
  if (!d.cards) return;

  const s = getDeck(secondDeck);
  if (!s) return;
  if (!s.cards) return;

  if (d.cards.length + s.cards.length > MAX_CARDS_IN_DECK) return;

  const shuffledCards: string[] = [];
  const maxIndex =
    s.cards.length < d.cards.length ? s.cards.length : d.cards.length;

  for (let i = 0; i < maxIndex; i++) {
    shuffledCards.push(s.cards[i], d.cards[i]);
  }

  d.cards.splice(0, maxIndex);
  shuffledCards.push(...d.cards);

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

  if (d.cards.length >= 35) {
    return FULL_DECK.create({ cards: d.cards });
  } else if (d.cards.length >= 18) {
    return HALF_DECK.create({ cards: d.cards });
  } else if (d.cards.length > 1) {
    return LOW_DECK.create({ cards: d.cards });
  } else {
    const cardID = d.cards[0];
    if (!cardID) return deck;
    const card = CARDS.get(d.cards[0]);
    if (card) return card.create();
  }
  return deck;
}

/**
 * Called ONCE on ANY click in PlayerInteractEvent
 * @param player Player who clicked
 * @param isRightClick True if player rightclicked with either hand
 */
function CustomClick(
  player: Player,
  isRightClick: boolean,
  blockFace: BlockFace,
) {
  const mainHandItem = player.inventory.itemInMainHand;
  const offHandItem = player.inventory.itemInOffHand;

  // place/pick card to/from ground
  if (blockFace === BlockFace.UP && isRightClick) {
    if (isCard(mainHandItem)) {
      // Place card on block
      const raytrace = player.rayTraceBlocks(2);
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
      const raytrace = player.rayTraceBlocks(2);
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

  if (!isDeck(offHandItem)) return;

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
 * GIVE PLAYER ALL CARDS
 */
registerCommand('cards', (sender) => {
  if (!(sender instanceof Player)) return;
  const player = sender as Player;
  for (const entry of CARDS) {
    player.world.dropItem(player.location, entry[1].create());
  }
});

/**
 * GIVE PLAYER A DECK FULL OF CARDS
 */
registerCommand('deck', (sender) => {
  if (!(sender instanceof Player)) return;
  const player = sender as Player;
  player.world.dropItem(
    player.location,
    FULL_DECK.create({ cards: Array.from(CARDS.keys()) }),
  );
});

registerEvent(PlayerInteractEvent, (event) => {
  const item = event.item;
  if (event.hand === EquipmentSlot.HAND) {
    CustomClick(event.player, isRightClick(event.action), event.blockFace);
  } else {
    if (event.action === Action.RIGHT_CLICK_BLOCK) return;
    if (event.player.inventory.itemInMainHand.type !== Material.AIR) return;
    CustomClick(event.player, isRightClick(event.action), event.blockFace);
  }
});
