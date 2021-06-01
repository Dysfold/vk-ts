import { addTranslation as add } from './localization';

add('test', {
  fi_fi: 'Testi sanat: %s ja %s',
  en_us: 'Test words: %s and %s',
});

add('respack_updated', {
  fi_fi:
    'Resurssipaketti on päivittynyt! Ota uusi resurssipaketti käyttöön liittymällä peliin uudelleen tai komennolla /resurssipaketti',
  en_us:
    'Resource pack has been updated! Apply the new resource pack by relogging or with the command "/resourcepack"',
});

log.info('Languages added succesfully');
