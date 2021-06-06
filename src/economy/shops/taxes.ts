import { color, text } from 'craftjs-plugin/chat';
import { UUID } from 'java.util';
import { round } from 'lodash';
import { ChatColor } from 'net.md_5.bungee.api';
import { Bukkit, OfflinePlayer } from 'org.bukkit';
import { Block, Chest, Sign } from 'org.bukkit.block';
import { WallSign } from 'org.bukkit.block.data.type';
import { Action, SignChangeEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import * as yup from 'yup';
import { errorMessage } from '../../chat/system';
import { dataType } from '../../common/datas/holder';
import { dataView } from '../../common/datas/view';
import {
  distanceBetween,
  yupLocToLoc,
  YUP_LOCATION,
} from '../../common/helpers/locations';
import { Currency, getCurrencyNames } from '../currency';
import { giveMoney } from '../money';
import { getBlockBehind } from './helpers';

/**
 * Calculate the amount of the tax and round it to 2 decimals points.
 * @param taxRate Tax rate as a percentage from 0 to 100
 * @param price Price including tax
 * @returns Amount of the tax
 */
export function getTaxes(taxRate: number, price: number) {
  const taxes = (taxRate / (100 + taxRate)) * price;
  return round(taxes, 2);
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
        currency: yup.number().required(),
        amount: yup.number().default(0),
      }),
    )
    .default([]),
};

const TaxChestData = dataType('tax-chest-data', TAX_CHEST_DATA);
const TaxCollectorData = dataType('tax-chest-data', TAX_COLLECTOR_DATA);

/**
 * Add money to untransferred taxes (store in database). These taxes will be added to
 * the tax chest when it is opened.
 * @param collector Tax collector as offline player
 * @param amount Amount of money to be sent
 * @param currency Currency of the tax
 */
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
  const transmission = arr.find((i) => i.currency == currency);
  if (transmission) {
    transmission.amount += amount;
  } else {
    arr.push({
      currency: currency,
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

  event.player.sendMessage('Veroarkku luotu!');
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

  // Check if lines are either "tax", "veroarkku", "tax chest" etc or empty
  for (const line of lines) {
    if (line && !taxWords.has(line.toLowerCase())) return false;
  }
  if (lines.every((line) => !line)) return false;

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
  const player = event.player;

  const collector = Bukkit.getOfflinePlayer(
    UUID.fromString(taxChestView.taxCollector),
  );
  const collectorView = dataView(TaxCollectorData, collector);

  const yupLoc = collectorView.chestLocation;
  const location = yupLocToLoc(yupLoc);
  if (!location) return;

  if (distanceBetween(location, chest.location) > 0.1) {
    errorMessage(player, 'Tämä veroarkku ei ole enää käytössä!');
    return;
  }

  player.sendMessage(
    color('#FFAA00', text('-----------------Veroarkku-----------------')),
  );
  player.sendMessage(
    color('#FFFF99', text('Veronkerääjä: ' + ChatColor.GOLD + collector.name)),
  );

  if (collectorView.untransferred.length) {
    player.sendMessage(color('#FFFF99', text('Uusia veroja:')));
    for (const tax of collectorView.untransferred) {
      const currency = tax.currency as Currency;
      const currencyName = getCurrencyNames(currency)?.plainText;
      const unit =
        tax.amount == 1 ? currencyName?.unit : currencyName?.unitPlural;

      giveMoney(chest.inventory, tax.amount, currency);
      player.sendMessage(
        color(
          '#FFFF99',
          text(
            '+ ' +
              ChatColor.GOLD +
              round(tax.amount, 2) +
              ' ' +
              ChatColor.RESET +
              unit,
          ),
        ),
      );
    }

    collectorView.untransferred = [];
  }

  player.sendMessage(
    color('#FFAA00', text('-------------------------------------------')),
  );
});

/**
 * Check if the player is a tax collector or not
 * @param player Player to be checked
 * @returns The tax collector as OfflinePlayer or undefined
 */
export function getTaxCollector(player: string | OfflinePlayer) {
  const offlinePlayer =
    player instanceof OfflinePlayer ? player : Bukkit.getOfflinePlayer(player);
  const view = dataView(TaxCollectorData, offlinePlayer);
  if (view.chestLocation?.worldId) {
    return offlinePlayer;
  }
  return undefined;
}
