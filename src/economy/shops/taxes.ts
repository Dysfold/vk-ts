import { UUID } from 'java.util';
import { Bukkit, OfflinePlayer } from 'org.bukkit';
import { Block, Chest, Sign } from 'org.bukkit.block';
import { WallSign } from 'org.bukkit.block.data.type';
import { Action, SignChangeEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import * as yup from 'yup';
import { dataType } from '../../common/datas/holder';
import { dataView } from '../../common/datas/view';
import { YUP_LOCATION } from '../../common/helpers/locations';
import { Currency, getShopCurrency, YUP_CURRENCY } from '../currency';
import { giveMoney } from '../money';
import { getBlockBehind } from './make-shop';

export function getTaxes(taxRate: number, price: number) {
  return (taxRate / (100 + taxRate)) * price;
}

const TAX_CHEST_DATA = {
  taxCollector: yup.string().notRequired(),
};

const TAX_COLLECTOR_DATA = {
  /**
   * Location of the tax chest
   */
  chestLocation: YUP_LOCATION,

  /**
   * Array containing untransferred taxes for each currency
   */
  untransferred: yup
    .array(
      yup.object({
        currency: YUP_CURRENCY.required(),
        amount: yup.number().default(0),
      }),
    )
    .default([]),
};

const TaxChestData = dataType('tax-chest-data', TAX_CHEST_DATA);
const TaxCollectorData = dataType('tax-chest-data', TAX_COLLECTOR_DATA);

export function sendTaxes(
  collector: OfflinePlayer,
  amount: number,
  currency: Currency,
) {
  const view = dataView(TaxCollectorData, collector);
  if (!view.chestLocation) {
    return false;
  }

  const arr = view.untransferred;
  const transmission = arr.find(
    (i) =>
      i.currency.model == currency.model &&
      i.currency.unitPlural == currency.unitPlural &&
      i.currency.subunitPlural == currency.subunitPlural,
  );
  if (transmission) {
    transmission.amount += amount;
  } else {
    arr.push({
      currency: {
        model: currency.model,
        unitPlural: currency.unitPlural,
        subunitPlural: currency.subunitPlural,
      },
      amount: amount,
    });
  }
  view.untransferred = arr;
}

/**
 * Create a new tax chest
 */
registerEvent(SignChangeEvent, async (event) => {
  const sign = event.block;
  if (!canBecomeTaxChest(sign, event.lines)) return;

  // Get the chest where the taxes will be stored
  const chest = getBlockBehind(sign)?.state;
  if (!(chest instanceof Chest)) return;

  // Use the chest data to store the
  const chestDataView = dataView(TaxChestData, chest);
  chestDataView.taxCollector = event.player.uniqueId.toString();
  chest.update();

  // Store the location of the tax chest to the player's data
  const playerDataView = dataView(TaxCollectorData, event.player);
  playerDataView.chestLocation.worldId = chest.location.world.uID.toString();
  playerDataView.chestLocation.x = chest.location.x;
  playerDataView.chestLocation.y = chest.location.y;
  playerDataView.chestLocation.z = chest.location.z;

  event.player.sendMessage(
    'Veroarkku luotu! ' + playerDataView.chestLocation.x,
  );
});

/**
 * List of accepted words for tax chest
 */
const taxWords = new Set([
  'tax',
  'taxes',
  'taxchest',
  'tax chest',
  'vero',
  'veroarkku',
  'verot',
]);

/**
 * Check if the sign and the block (chest) behind it can become a tax chest
 * @param sign Sign in front of the tax chest
 * @param lines Lines of the sign (From SignChangeEvent)
 * @returns Boolean (Can the chest become a tax chest or not)
 */
function canBecomeTaxChest(sign: Block, lines: string[]) {
  if (!sign) return false;
  if (!(sign.state instanceof Sign)) return false;

  // Check if every line is empty, exept the first (0th) line
  for (let i = 1; i <= 3; i++) {
    if (lines[i]) return false;
  }

  // Check if the first line is "tax", "veroarkku", "tax chest" etc
  if (!taxWords.has(lines[0].toLowerCase())) return false;

  if (!(sign.blockData instanceof WallSign)) return false;
  const attachedTo = getBlockBehind(sign);
  if (!attachedTo) return false;
  if (!(attachedTo.state instanceof Chest)) return false;
  return true;
}

/**
 * Add untransferred taxes to the tax chest
 */
registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (!(event.clickedBlock?.state instanceof Chest)) return;
  const chest = event.clickedBlock.state;
  const taxChestView = dataView(TaxChestData, chest);
  if (!taxChestView.taxCollector) return;

  const collector = Bukkit.getOfflinePlayer(
    UUID.fromString(taxChestView.taxCollector),
  );
  const collectorView = dataView(TaxCollectorData, collector);

  if (collectorView.untransferred) {
    for (const tax of collectorView.untransferred) {
      const currency = getShopCurrency(tax.currency);
      if (!currency) return;
      giveMoney(chest.inventory, tax.amount, currency);
      event.player.sendMessage(
        'Uusia veroja: ' + tax.amount + ' ' + currency.unitPlural,
      );
    }

    collectorView.untransferred = [];
  }
  event.player.sendMessage('Kerääjä: ' + collector.name);
});
