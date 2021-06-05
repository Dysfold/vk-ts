import { addTranslation } from '../../common/localization/localization';
import { ChatColor } from 'org.bukkit';

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

addTranslation('shops.bying', {
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
  fi_fi: `Veroton hinta: ${ChatColor.GOLD}%.2f${ChatColor.RESET} %s / kpl`,
  en_us: `Tax free price: ${ChatColor.GOLD}%.2f${ChatColor.RESET} %s / item`,
});

addTranslation('shops.items_left', {
  fi_fi: `Kaupassa on ${ChatColor.GOLD}%s${ChatColor.RESET} tuotetta jäljellä`,
  en_us: `The shop has ${ChatColor.GOLD}%s${ChatColor.RESET} items left`,
});

addTranslation('shops.space_left', {
  fi_fi: `Kaupassa on tilaa ainakin ${ChatColor.GOLD}%s${ChatColor.RESET} stackille`,
  en_us: `The shop has space for atleast ${ChatColor.GOLD}%s${ChatColor.RESET} stacks`,
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
