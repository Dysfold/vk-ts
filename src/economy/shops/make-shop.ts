import { color, text } from 'craftjs-plugin/chat';
import { TextComponent, TranslatableComponent } from 'net.md_5.bungee.api.chat';
import { Bukkit, ChatColor, OfflinePlayer } from 'org.bukkit';
import { Block, Sign } from 'org.bukkit.block';
import { Chest, WallSign } from 'org.bukkit.block.data.type';
import { Player } from 'org.bukkit.entity';
import { Action, SignChangeEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { ChatMessage, GLOBAL_PIPELINE } from '../../chat/pipeline';
import { dataView } from '../../common/datas/view';
import { getItemName, getCustomTranslation } from '../../common/helpers/items';
import { coinModelIdToCurrencyId, getCoinData } from '../money-mold';
import { ShopData } from './ShopData';
import { Currency } from '../currency';
import { distanceBetween } from '../../common/helpers/locations';
import { errorMessage } from '../../chat/system';
export type ShopType = 'SELLING' | 'BUYING';

interface ShopInfo {
  type?: ShopType;
  item?: ItemStack;
  price?: number;
  currency?: Currency;
  tax?: number;
  taxCollector?: OfflinePlayer;
}

export interface ValidShopInfo {
  type: ShopType;
  item: ItemStack;
  price: number;
  currency: Currency;
  tax: number;
  taxCollector?: OfflinePlayer;
}

type Step =
  | 'START'
  | 'SET_ITEM'
  | 'SET_PRICE'
  | 'SET_CURRENCY'
  | 'SET_TAXES'
  | 'SET_TAX_COLLECTOR';

interface ShopMakingSession {
  sign: Block;
  step: Step;
  shopInfo: ShopInfo;
  updated: Date;
}

const sessions = new Map<Player, ShopMakingSession>();

/**
 * Stop shop making sessions if the player has been idle or moved far away from the shop
 */
const SHOP_MAKING_TIMEOUT_MS = 1000 * 8;
const MAX_DISTANCE = 5;
setInterval(() => {
  sessions.forEach((session, player) => {
    const t0 = session.updated.getTime();
    const t1 = new Date().getTime();
    if (t1 - t0 > SHOP_MAKING_TIMEOUT_MS) {
      stopMakingShop(player);
      return;
    }
    const locA = player.location;
    const locB = session.sign.location;
    if (distanceBetween(locA, locB) > MAX_DISTANCE) {
      stopMakingShop(player);
      return;
    }
  });
}, 2000);

const TASK_ORDER: { step: Step; prompt: string }[] = [
  { step: 'START', prompt: '' },
  {
    step: 'SET_ITEM',
    prompt: 'Klikkaa kylttiä haluamallasi tuotteella.',
  },
  { step: 'SET_CURRENCY', prompt: 'Klikkaa kylttiä haluamallasi valuutalla.' },
  {
    step: 'SET_PRICE',
    prompt: 'Kirjoita chattiin tuotteen hinta. Esim: "4.5"',
  },
  { step: 'SET_TAXES', prompt: 'Kirjoita chattiin veroprosentti. Esim: "10"' },
  {
    step: 'SET_TAX_COLLECTOR',
    prompt: 'Kirjoita chattiin veronkerääjän nimi. Esim: "Steve"',
  },
];

function startNextTask(player: Player) {
  const session = sessions.get(player);
  if (!session) return false;
  const currentTask = TASK_ORDER.find((task) => task.step === session.step);
  if (!currentTask) return false;
  const taskIndex = TASK_ORDER.indexOf(currentTask);
  if (taskIndex == -1) return false;

  if (taskIndex == TASK_ORDER.length - 1) {
    saveShop(player);
    sessions.delete(player);
    return true;
  }

  const nextTask = TASK_ORDER[taskIndex + 1];
  session.step = nextTask.step;

  // Special check if the tax is 0 -> no need to select tax collector
  if (nextTask.step == 'SET_TAX_COLLECTOR') {
    if (session.shopInfo.tax == 0) {
      session.updated = new Date();
      startNextTask(player);
      return true;
    }
  }

  player.sendMessage(
    color('#FFAA00', text('------------------------------------------')),
  );
  player.sendMessage(color('#FFFF55', text(nextTask.prompt)));
  player.sendMessage(
    color('#FFAA00', text('------------------------------------------')),
  );
  return true;
}

function stopMakingShop(player: Player) {
  if (sessions.has(player)) {
    errorMessage(player, 'Kaupan perustaminen peruutettu.');
  }
  sessions.delete(player);
}

/**
 * Start making a new shop
 */
registerEvent(SignChangeEvent, async (event) => {
  const sign = event.block;
  if (!canBecomeShop(sign)) return;
  const player = event.player;
  if (sessions.has(player)) return;
  await wait(1, 'ticks');

  // Get the shop type from the sign
  const shopType = getShopType(sign);
  if (!shopType) return;

  // Start new shop making session
  sessions.set(player, {
    sign: sign,
    step: 'START',
    shopInfo: { type: shopType },
    updated: new Date(),
  });
  startNextTask(player);
});

function saveShop(player: Player) {
  const session = sessions.get(player);
  if (!session) return;

  // Use the sign as dataholder. Check if it still exists
  const signDataHolder = session.sign.state;
  if (!(signDataHolder instanceof Sign)) return;

  // Store the session shopInfo data
  const shop = session.shopInfo;
  if (!isShopInfoValid(shop)) return;
  const view = dataView(ShopData, signDataHolder);
  const name = shop.item.itemMeta.displayName;
  const modelId = shop.item.itemMeta.hasCustomModelData()
    ? shop.item.itemMeta.customModelData
    : undefined;

  view.type = shop.type;
  view.item.material = shop.item.type.toString();
  view.item.modelId = modelId;
  view.item.name = name.startsWith('vk.') ? undefined : name;
  view.item.material = shop.item.type.toString();
  view.item.translationKey = getCustomTranslation(shop.item)?.translate;
  view.price = shop.price;
  view.currency.model = shop.currency.model;
  view.currency.unitPlural = shop.currency.unitPlural;
  view.currency.subunitPlural = shop.currency.subunitPlural;
  view.tax = shop.tax;
  view.taxCollector = shop.taxCollector?.uniqueId.toString();
  signDataHolder.update();

  updateShopSign(session);
  player.sendMessage(ChatColor.GREEN + 'Kauppa luotu!');
}

/**
 * Check that all required fields are filled
 */
function isShopInfoValid(shopInfo: ShopInfo): shopInfo is ValidShopInfo {
  if (!('type' in shopInfo)) return false;
  if (!('item' in shopInfo)) return false;
  if (!('price' in shopInfo)) return false;
  if (!('currency' in shopInfo)) return false;
  if (!('tax' in shopInfo)) return false;
  return true;
}

function getShopItemName(item: ItemStack) {
  const component = getItemName(item);
  if (component instanceof TextComponent) {
    return ChatColor.ITALIC + '"' + component.toPlainText() + '"';
  }
  return component;
}

// THIS IS HACK
function updateSignTextTranslation(
  text: TranslatableComponent,
  sign: Block,
  type: ShopType,
) {
  const shopTypeTranslation = type === 'SELLING' ? 'vk.selling' : 'vk.buying';
  const shopTypeColor = type === 'SELLING' ? 'green' : 'blue';
  const world =
    sign.world.name === 'world'
      ? 'minecraft:overworld'
      : 'minecraft:' + sign.world.name;
  const cmd = `execute in ${world} run data merge block ${sign.x} ${sign.y} ${sign.z} {Text1:'{"translate":"${shopTypeTranslation}","color":"${shopTypeColor}"}',Text2:'{"translate":"${text.translate}"}'}`;
  const console = Bukkit.server.consoleSender;
  Bukkit.dispatchCommand(console, cmd);
}

function updateShopSign(session: ShopMakingSession) {
  const signBlock = session.sign;
  const shop = session.shopInfo as ValidShopInfo;
  const sign = signBlock.state as Sign;

  const name = getItemName(shop.item);
  const unit = shop.price === 1 ? shop.currency.unit : shop.currency.unitPlural;

  sign.setLine(0, shopTypeToString(shop.type));
  // TODO: remove .toPlainText() when chat components are accepted
  sign.setLine(1, getShopItemName(shop.item).toString());
  sign.setLine(2, shop.price + ' ' + unit);
  sign.update();

  // HACK. Remove this later
  if (name instanceof TranslatableComponent) {
    updateSignTextTranslation(name, signBlock, shop.type as ShopType);
  }
}

/**
 * Click the shop with an item to set values
 */
registerEvent(PlayerInteractEvent, async (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (event.hand !== EquipmentSlot.HAND) return;
  const player = event.player;
  const session = sessions.get(player);
  if (!session) return;
  if (!event.clickedBlock) return;
  await wait(1, 'ticks');

  if (!isSameShop(event.clickedBlock, session.sign)) {
    event.player.sendMessage('Kaupan luominen peruttiin');
    sessions.delete(player);
    return;
  }
  const step = session.step;

  if (step == 'SET_ITEM') {
    session.shopInfo.item = player.inventory.itemInMainHand;
    const name = getItemName(session.shopInfo.item);
    player.sendMessage('Asetit esineen ');
    player.sendMessage(name);
    startNextTask(player);
    return;
  }

  if (step == 'SET_CURRENCY') {
    const item = player.inventory.itemInMainHand;
    const data = getCoinData(item);

    if (!data?.unit || !data.subUnit) {
      player.sendMessage('Viallinen valuutta!');
      return;
    }
    const currencyModel = coinModelIdToCurrencyId(
      item.itemMeta.customModelData,
    );
    if (currencyModel === undefined) {
      player.sendMessage('Viallinen valuutta');
      log.error('Viallinen valuutta');
      return;
    }

    const currency: Currency = {
      model: currencyModel,
      unit: data.unit.slice(0, -1),
      unitPlural: data.unit,
      subunit: data.subUnit.slice(0, -1),
      subunitPlural: data.subUnit,
    };
    session.shopInfo.currency = currency;
    player.sendMessage('Asetit valuutan ' + currency.unit);
    startNextTask(player);

    return;
  }
});

function canBecomeShop(block: Block): block is Block {
  if (!block) return false;
  if (!(block.state instanceof Sign)) return false;
  const sign = block.state as Sign;

  // Check if every line is empty, exept the first (0th) line
  for (let i = 1; i <= 3; i++) {
    if (sign.getLine(i)) return false;
  }

  if (!(sign.blockData instanceof WallSign)) return false;
  const attachedTo = getBlockBehind(block);
  if (!attachedTo) return false;
  if (!isValidChest(attachedTo)) return false;
  return true;
}

export function getBlockBehind(sign: Block) {
  if (!(sign.blockData instanceof WallSign)) return undefined;
  return sign.getRelative(sign.blockData.facing.oppositeFace);
}

const SHOP_TYPES = new Map<string, ShopType>([
  ['myydään', 'SELLING'],
  ['myy', 'SELLING'],
  ['ostetaan', 'BUYING'],
  ['osta', 'BUYING'],
]);

function shopTypeToString(type: ShopType) {
  return type == 'SELLING'
    ? ChatColor.GREEN + 'Myydään'
    : ChatColor.BLUE + 'Ostetaan';
}

function getShopType(block: Block) {
  const signData = block.state as Sign;
  const firstLine = signData.getLine(0);

  return SHOP_TYPES.get(firstLine.toLowerCase());
}

function isValidChest(block: Block) {
  if (!(block.blockData instanceof Chest)) return false;
  // TODO: Check lock
  return true;
}

function isSameShop(A: Block, B: Block) {
  if (A.type !== B.type) return false;
  if (A.location.distanceSquared(B.location)) return false;
  return true;
}

const CHAT_STEPS = new Set<Step>([
  'SET_PRICE',
  'SET_TAXES',
  'SET_TAX_COLLECTOR',
]);

function detectShopSetup(msg: ChatMessage) {
  const session = sessions.get(msg.sender);
  if (session && CHAT_STEPS.has(session.step)) {
    msg.discard = true;

    const step = session.step;
    switch (step) {
      case 'SET_PRICE': {
        const price = Number.parseFloat(msg.content);
        if (!price) {
          msg.sender.sendMessage('Virheellinen hinta');
        }
        msg.sender.sendMessage('Asetit hinnanksi ' + price);
        session.shopInfo.price = price;
        startNextTask(msg.sender);

        return;
      }
      case 'SET_TAXES': {
        const tax = Number.parseFloat(msg.content);
        if (isNaN(tax)) {
          msg.sender.sendMessage('Virheellinen veroprosentti');
        }
        msg.sender.sendMessage('Asetit veroprosentiksi ' + tax);
        session.shopInfo.tax = tax;
        startNextTask(msg.sender);
        return;
      }
      case 'SET_TAX_COLLECTOR': {
        const taxCollector = Bukkit.server.getOfflinePlayer(msg.content);
        if (!taxCollector) {
          msg.sender.sendMessage('Pelaajaa ei löydy');
        }
        msg.sender.sendMessage('Asetit veronkerääjäksi ' + taxCollector.name);
        session.shopInfo.taxCollector = taxCollector;
        startNextTask(msg.sender);
        return;
      }
    }
  }
}

GLOBAL_PIPELINE.addHandler('detectShopSetup', -1, detectShopSetup);
