import { Block, Sign } from 'org.bukkit.block';
import { Chest, WallSign } from 'org.bukkit.block.data.type';
import { Player, Minecart } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { ChatMessage, GLOBAL_PIPELINE } from '../../chat/pipeline';
import { coinModelIdToCurrencyId, Currency, getCoinData } from '../money-mold';
import { OfflinePlayer, Bukkit, ChatColor, Material } from 'org.bukkit';
import { color, text } from 'craftjs-plugin/chat';
import { dataView } from '../../common/datas/view';
import { ShopData } from './ShopData';
import { getItemName } from '../../common/helpers/items';
import { TextComponent, TranslatableComponent } from 'net.md_5.bungee.api.chat';
import { SuppressWarnings } from 'java.lang';
type ShopType = 'SELLING' | 'BUYING';

interface ShopInfo {
  type?: ShopType;
  item?: ItemStack;
  price?: number;
  currency?: Currency;
  tax?: number;
  taxCollector?: OfflinePlayer;
}

interface ValidShopInfo {
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
}

const sessions = new Map<Player, ShopMakingSession>();

const TASK_ORDER: { step: Step; prompt: string }[] = [
  { step: 'START', prompt: '' },
  { step: 'SET_ITEM', prompt: 'Klikkaa kylttiä myytävällä esineellä.' },
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
    player.sendMessage('Kauppa luotu');
    saveShop(player);
    sessions.delete(player);
    return true;
  }

  const nextTask = TASK_ORDER[taskIndex + 1];
  session.step = nextTask.step;

  // Special check if the tax is 0 -> no need to select tax collector
  if (nextTask.step == 'SET_TAX_COLLECTOR') {
    if (session.shopInfo.tax == 0) {
      startNextTask(player);
      return true;
    }
  }

  player.sendMessage(color('#FFAA00', text('------------------------------')));
  player.sendMessage(color('#FFFF55', text(nextTask.prompt)));
  player.sendMessage(color('#FFAA00', text('------------------------------')));
  return true;
}

/**
 * Start making a new shop
 */
registerEvent(PlayerInteractEvent, async (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (event.hand !== EquipmentSlot.HAND) return;
  const sign = event.clickedBlock;
  if (!sign) return;
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
  const modelId = shop.item.itemMeta.hasCustomModelData()
    ? shop.item.itemMeta.customModelData
    : undefined;

  view.type = shop.type;
  view.item.material = shop.item.type.toString();
  view.item.modelId = modelId;
  view.item.name = shop.item.itemMeta.displayName;
  view.item.material = shop.item.type.toString();
  view.price = shop.price;
  view.currency.model = shop.currency.model;
  view.currency.unitPlural = shop.currency.unitPlural;
  view.currency.subunitPlural = shop.currency.subunitPlural;
  view.tax = shop.tax;
  view.taxCollector = shop.taxCollector?.uniqueId.toString();

  updateShopSign(session);
  player.sendMessage('Kauppa luotu!!');
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
  return component.translate;
}

// THIS IS HACK
function updateSignTextTranslation(text: TranslatableComponent, sign: Block) {
  const world =
    Bukkit.server.worlds.length > 3
      ? 'minecraft:' + sign.world.name
      : 'minecraft:overworld';
  const cmd = `execute in ${world} run data merge block ${sign.x} ${sign.y} ${sign.z} {Text2:'{"translate":"${text.translate}"}'}`;
  const console = Bukkit.server.consoleSender;
  Bukkit.dispatchCommand(console, cmd);
}

function updateShopSign(session: ShopMakingSession) {
  const signBlock = session.sign;
  const shop = session.shopInfo as ValidShopInfo;
  const sign = signBlock.state as Sign;

  const name = getItemName(shop.item);

  sign.setLine(0, shopTypeToString(shop.type));
  // TODO: remove .toPlainText() when chat components are accepted
  sign.setLine(1, getShopItemName(shop.item));
  sign.setLine(2, shop.price + ' ' + shop.currency.unitPlural);
  sign.update();

  // HACK
  if (name instanceof TranslatableComponent) {
    updateSignTextTranslation(name, signBlock);
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

    if (!data) {
      player.sendMessage('Viallinen valuutta');
      return;
    }
    const currencyModel = coinModelIdToCurrencyId(
      item.itemMeta.customModelData,
    );
    if (!currencyModel) {
      player.sendMessage('Viallinen valuutta');
      log.error('Viallinen valuutta');
      return;
    }

    // player.sendMessage('Syötä chattiin esineen hinta');
    // session.step = 'SET_PRICE';
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
  const attachedTo = block.getRelative(sign.blockData.facing.oppositeFace);
  if (!isValidChest(attachedTo)) return false;
  return true;
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
        msg.sender.sendMessage('Asetit veronkerääjäksi ' + taxCollector);
        session.shopInfo.taxCollector = taxCollector;
        startNextTask(msg.sender);
        return;
      }
    }
  }
}

GLOBAL_PIPELINE.addHandler('detectShopSetup', -1, detectShopSetup);
