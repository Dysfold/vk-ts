import { Table } from 'craftjs-plugin';
import { clickEvent, style, text } from 'craftjs-plugin/chat';
import { getTable } from '../common/datas/database';
import { Action } from 'net.md_5.bungee.api.chat.ClickEvent';
import { errorMessage, successMessage } from '../chat/system';

const nationsDb: Table<string, string> = getTable('nations');
const nations: Map<string, Nation> = new Map();

export interface Nation {
  /**
   * Id of the nation. Currently the name in lower case.
   */
  id: string;

  /**
   * Nation name. In future, this might be mutable.
   */
  name: string;
}

export function nationById(id: string): Nation | undefined {
  return nations.get(id);
}

function addNation(name: string) {
  const nation: Nation = {
    id: name.toLowerCase(),
    name: name,
  };
  nations.set(nation.id, nation); // In memory
  nationsDb.set(nation.id, JSON.stringify(nation)); // Persistent
}

function removeNation(nation: Nation) {
  nations.delete(nation.id);
  nationsDb.delete(nation.id);
}

registerCommand(
  'valtio',
  (sender, alias, args) => {
    const action = args[0];
    const name = args[1];
    const confirm = args[2];
    if (!action) {
      return false;
    }
    if (action == 'luo') {
      if (!name) {
        return false;
      }
      if (nationById(name.toLowerCase())) {
        errorMessage(sender, `Valtio ${name} on jo olemassa!`);
        return;
      }
      if (confirm == 'kylläolenvarma') {
        addNation(name);
        successMessage(sender, `Luotu valtio ${name}.`);
      } else {
        sender.sendMessage(
          clickEvent(
            Action.SUGGEST_COMMAND,
            `/valtio luo ${name} kylläolenvarma`,
            style(
              'underlined',
              text(`Vahvistus: /valtio luo ${name} kylläolenvarma`),
            ),
          ),
        );
      }
    } else if (action == 'poista') {
      if (!name) {
        return false;
      }
      const nation = nationById(name.toLowerCase());
      if (!nation) {
        errorMessage(sender, `Valtiota ${name} ei ole olemassa!`);
        return;
      }
      if (confirm == 'kylläolenvarma') {
        removeNation(nation);
        successMessage(sender, `Poistettu valtio ${name}.`);
      } else {
        sender.sendMessage(
          clickEvent(
            Action.SUGGEST_COMMAND,
            `/valtio poista ${name} kylläolenvarma`,
            style(
              'underlined',
              text(`Vahvistus: /valtio poista ${name} kylläolenvarma`),
            ),
          ),
        );
      }
    } else if (action == 'lista') {
      sender.sendMessage('Lista valtioista:');
      for (const nation of nations.values()) {
        sender.sendMessage(`${nation.name} (${nation.id})`);
      }
    } else {
      return false;
    }
  },
  {
    usage:
      '/valtio <luo|poista> <nimi> - luo/poista valtioita\n/valtio lista - listaa valtiot',
    permission: 'vk.nation.admin',
    permissionMessage:
      'Sinulla ei ole oikeutta hallita valtioita. Ota tarvittaessa yhteys ylläpitoon.',
  },
);

// Load nations from database
for (const [id, json] of nationsDb) {
  nations.set(id, JSON.parse(json));
}
