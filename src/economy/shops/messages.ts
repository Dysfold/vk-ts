import { color, text } from 'craftjs-plugin/chat';
import { addTranslation } from '../../common/localization/localization';

export const SHOP_YELLOW = '#FFFF99';
export const SHOP_GOLD = '#FFAA00';
export const SHOP_GREEN = '#55FF55';
export const shopYellow = (msg: string) => color(SHOP_YELLOW, text(msg));
export const shopGold = (msg: string) => color(SHOP_GOLD, text(msg));
export const shopGreen = (msg: string) => color(SHOP_GREEN, text(msg));

addTranslation('shops.you_bought', {
  fi_fi: 'Ostit %s kpl hintaan %s %s',
  en_us: 'You bought %s items with %s %s',
});

addTranslation('shops.title', {
  fi_fi: '----------Kauppa-arkku----------',
  en_us: '-----------Shop-chest-----------',
});

addTranslation('shops.footer', {
  fi_fi: '--------------------------------',
  en_us: '--------------------------------',
});

addTranslation('shops.selling', {
  fi_fi: 'Myydään',
  en_us: 'Selling',
});

addTranslation('shops.buying', {
  fi_fi: 'Ostetaan',
  en_us: 'Buying',
});

addTranslation('shops.price', {
  fi_fi: 'Hinta',
  en_us: 'Price',
});

addTranslation('shops.unit_per_item', {
  fi_fi: '%s / kpl',
  en_us: '%s / item',
});

addTranslation('shops.tax_tooltip', {
  fi_fi: 'Verottaja: %s \nVeron arvo: %s',
  en_us: 'Tax collector: %s \nTax amount: %s',
});

addTranslation('shops.unknown', {
  fi_fi: 'Tuntematon',
  en_us: 'Unknown',
});

addTranslation('shops.VAT', {
  fi_fi: 'Arvonlisävero',
  en_us: 'Value-added tax',
});

addTranslation('shops.tax_free_price', {
  fi_fi: `Veroton hinta`,
  en_us: `Tax free price`,
});

addTranslation('shops.items_left', {
  fi_fi: `Kaupassa on %s tuotetta jäljellä`,
  en_us: `The shop has %s items left`,
});

addTranslation('shops.space_left', {
  fi_fi: `Kaupassa on tilaa ainakin %s stackille`,
  en_us: `The shop has space for atleast %s stacks`,
});

addTranslation('shops.space_low', {
  fi_fi: 'Kaupan tila on lopussa',
  en_us: 'The shop is running out of space',
});

addTranslation('shops.how_many_to_buy', {
  fi_fi: 'Montako tuotetta haluat ostaa?',
  en_us: 'How many you want to buy?',
});

addTranslation('shops.how_many_to_sell', {
  fi_fi: 'Montako tuotetta haluat myydä?',
  en_us: 'How many you want to sell?',
});

addTranslation('shops.transaction_cancelled', {
  fi_fi: 'Kaupankäynti keskeytetty',
  en_us: 'Transaction cancelled',
});

addTranslation('shops.invalid_amount', {
  fi_fi: 'Viallinen kappalemäärä',
  en_us: 'Invalid amount',
});

addTranslation('shops.not_enought_space', {
  fi_fi: 'Kaupassa ei ole tarpeeksi tilaa',
  en_us: "The shop doesn't have enough space",
});

addTranslation('shops.not_enought_items', {
  fi_fi: 'Kaupassa ei ole tarpeeksi tuotteita',
  en_us: "The shop doesn't have enough items",
});

addTranslation('shops.not_enought_money', {
  fi_fi: 'Kaupassa ei ole tarpeeksi rahaa',
  en_us: "The shop doesn't have enough money",
});

addTranslation('shops.you_no_enought_money', {
  fi_fi: 'Sinulle ei ole tarpeeksi rahaa',
  en_us: 'You dont have enough money',
});

addTranslation('shops.you_sold', {
  fi_fi: 'Myit %s kpl hintaan %.2f %s',
  en_us: 'You sold %s items for %.2f %s',
});

/**
 * Taxes
 */

addTranslation('shops.old_tax_chest', {
  fi_fi: 'Tämä veroarkku ei ole enää käytössä!',
  en_us: 'This tax chest is no longer in use!',
});

addTranslation('shops.tax_chest_title', {
  fi_fi: '-----------Veroarkku-----------',
  en_us: '-----------Tax-chest-----------',
});

addTranslation('shops.tax_chest_footer', {
  fi_fi: '-------------------------------',
  en_us: '-------------------------------',
});

addTranslation('shops.tax_collector', {
  fi_fi: 'Veronkerääjä',
  en_us: 'Tax collector',
});

addTranslation('shops.new_taxes', {
  fi_fi: 'Uusia veroja',
  en_us: 'New taxes',
});

addTranslation('shops.tax_chest_created', {
  fi_fi: 'Veroarkku luotu!',
  en_us: 'Tax chest created!',
});

/**
 * Shop making session
 */

addTranslation('shops.set_item', {
  fi_fi: 'Klikkaa kylttiä haluamallasi tuotteella.',
  en_us: 'Click the sign with the item you want to sell or buy.',
});

addTranslation('shops.set_currency', {
  fi_fi: 'Klikkaa kylttiä haluamallasi valuutalla.',
  en_us: 'Click the sign with the currency you want to use.',
});

addTranslation('shops.set_price', {
  fi_fi:
    'Kirjoita chattiin tuotteesta maksettava (verollinen) hinta. Esim "4.5"',
  en_us: 'Type the the price (including tax) in the chat. E.g "4.5',
});

addTranslation('shops.set_taxes', {
  fi_fi: 'Kirjoita chattiin veroprosentti',
  en_us: 'Type the the tax rate in the chat',
});

addTranslation('shops.set_tax_collector', {
  fi_fi: 'Kirjoita chattiin veronkerääjä',
  en_us: 'Type the the name of the tax collector in the chat',
});

addTranslation('shops.shop_created', {
  fi_fi: 'Kauppa luotu!',
  en_us: 'Shop created!',
});

addTranslation('shops.shop_making_cancelled', {
  fi_fi: 'Kaupan perustaminen peruutettu!',
  en_us: 'Shop creation cancelled!',
});

addTranslation('shops.invalid_currency', {
  fi_fi: 'Viallinen valuutta!',
  en_us: 'Invalid currency!',
});

addTranslation('shops.currency_set_success', {
  fi_fi: 'Asetit valuutan %s',
  en_us: 'You set the currency %s',
});

addTranslation('shops.item_set_success', {
  fi_fi: 'Asetit esineen',
  en_us: 'You set the item',
});

addTranslation('shops.invalid_price', {
  fi_fi: 'Viallinen hinta!',
  en_us: 'Invalid price!',
});

addTranslation('shops.price_set_success', {
  fi_fi: 'Asetit hinnaksi %.2f',
  en_us: 'You set the price to %.2f',
});

addTranslation('shops.tax_rate_set_success', {
  fi_fi: 'Asetit veroprosentiksi %.2f',
  en_us: 'You set the tax rate to %.2f',
});

addTranslation('shops.invalid_tax_rate', {
  fi_fi: 'Viallinen veroprosentti!',
  en_us: 'Invalid tax rate!',
});

addTranslation('shops.invalid_tax_collector', {
  fi_fi: 'Tämä henkilö ei ole veronkerääjä!',
  en_us: 'This player is not a tax collector!',
});

addTranslation('shops.tax_collector_set_success', {
  fi_fi: 'Asetit veronkerääjäksi %s',
  en_us: 'You set the tax collector to %s',
});
