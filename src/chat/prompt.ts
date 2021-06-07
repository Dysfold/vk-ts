import { UUID } from 'java.util';
import { CommandSender, ConsoleCommandSender } from 'org.bukkit.command';
import { Player } from 'org.bukkit.entity';

/**
 * Pending prompts.
 */
const pendingPrompts: Map<
  CommandSender | Player,
  Map<string, (action: string) => void>
> = new Map();

/**
 * A prompt that can be shown to command sender.
 *
 * This class does not handle the chat UI (except the workaround for console).
 * Code using this should, in general, send commands from command() in click
 * events, then call waitAnswer() to get which one the player clicked. In all
 * cases, user code should also handle the special 'timeout' answer and
 * arbitrary strings typed manually by players.
 */
export class Prompt {
  /**
   * Target command sender.
   */
  private target: CommandSender | Player;

  /**
   * If we should try to automatically 'support' console that can't click
   * links in chat.
   */
  private consoleSupport: boolean;

  /**
   * Randomly generated id.
   */
  private randomId: string;

  /**
   * Creates a new prompt but does not show it yet. If target is console, some
   * messages may be sent immediately.
   * @param target Target player or console.
   * @param consoleSupport Enabled by default. If set, prompt system tries to
   * make the prompts console-compatible by sending additional messages. This
   * is not perfect, so commands that are commonly used from console might want
   * to do their own thing and disable this.
   */
  constructor(target: CommandSender | Player, consoleSupport = true) {
    this.target = target;
    this.consoleSupport = consoleSupport;
    this.randomId = UUID.randomUUID().toString(); // No need for secure randomness

    // If console and console support is toggled on, send initial message
    if (consoleSupport && this.target instanceof ConsoleCommandSender) {
      target.sendMessage(
        `[Prompt] Chat prompt for console created; randomId=${this.randomId}`,
      );
    }
  }

  /**
   * Gets a command that the player this prompt was created for can use to
   * complete waitAnswer() promise.
   * @param answer Action string for waitAnswer() promise completion.
   * @returns A command, probably for click events.
   */
  command(answer: string): string {
    const command = `/answerprompt ${this.randomId} ${answer}`;
    // Console can't click links in chat, so we'll help a bit
    // (commands that are commonly used from console may want to do more than this)
    if (this.consoleSupport && this.target instanceof ConsoleCommandSender) {
      this.target.sendMessage(`[Prompt] ${answer} => ${command}`);
    }
    return command;
  }

  /**
   * Waits for player to answer the prompt.
   * @param timeout Timeout in seconds. If player takes longer than this, the
   * promise returned by this will complete with 'timeout'.
   * @returns A promise of the answer. Note that the answer can be ANY string;
   * even if the UI does not expose it, players can and will type it manually!
   */
  waitAnswer(timeout: number): Promise<string> {
    // Prepare a promise and extract resolve callback from it
    let callback: null | ((answer: string) => void) = null;
    const promise: Promise<string> = new Promise(
      (resolve) => (callback = resolve),
    );

    // Add callback to pending prompts
    let prompts = pendingPrompts.get(this.target);
    if (!prompts) {
      prompts = new Map();
      pendingPrompts.set(this.target, prompts);
    }
    if (!callback) {
      throw new Error('prompt promise creation failed, callback null');
    }
    prompts.set(this.randomId, callback);

    // Schedule a function to send a 'timeout' answer
    wait(timeout, 'seconds').then(() => {
      const prompts = pendingPrompts.get(this.target);
      if (prompts) {
        const callback = prompts.get(this.randomId);
        if (callback) {
          callback('timeout');
        }
        prompts.delete(this.randomId); // Remove from pending promises
        if (prompts.size == 0) {
          pendingPrompts.delete(this.target); // Remove unnecessary Map
        }
      }
    });

    return promise;
  }
}

// Prompts are handled internally by one command
registerCommand(
  'answerprompt',
  (sender, _alias, args) => {
    const prompts = pendingPrompts.get(sender);
    if (!prompts) {
      return; // No promps, player clicked twice or it has expired
    }
    const randomId = args[0];
    const callback = prompts.get(randomId);
    if (!callback) {
      return; // That particular prompt does not exist
    }
    const answer = args[1];
    if (!answer) {
      return; // No answer, player probably (mis)typed by hand
    }
    callback(answer); // Complete the promise from waitAnswer()
  },
  {
    accessChecker: () => true,
    description: 'Internal command for prompt system.',
  },
);
