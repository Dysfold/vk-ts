import { World } from 'org.bukkit';
import { ChatChannel } from './channel';
import { ChatMessage } from './pipeline';

/**
 * World-specific access configuration.
 *
 * By default, all channels that inherit the world policy are allowed.
 * If names of channels are set, then those channels (and no others) are
 * usable. When names are specified, channels with 'deny-implied' policy are
 * also available. An empty set can be used to disallow all chat channels.
 *
 * Channels that deny all usage are never available. Likewise, channels that
 * explicitly allow all usage are ALWAYS available, no matter the world policy.
 */
type WorldPolicy = 'allow' | Set<string>;

/**
 * World-specific policies.
 */
const worldPolicies: Map<string, WorldPolicy> = new Map();

/**
 * Channel-specific access configuration.
 *
 * By default, channels inherit settings from the current world. Worlds
 * that allow all channels have them available; worlds that do not, don't.
 *
 * Denying implied access prevents channels from being used in worlds that do
 * not specifically allow them. General 'allow' is not enough, but name of the
 * channel is.
 *
 * Explicitly allowing a channel makes it usable in ALL worlds; be careful
 * with this one. Denying a channel makes it unusable everywhere, which makes
 * it (currently) a bit useless.
 */
type ChannelPolicy = 'inherit' | 'deny-implied' | 'allow' | 'deny';

/**
 * Channel-specific policies.
 */
const channelPolicies: Map<string, ChannelPolicy> = new Map();

/**
 * Chat namespaces for worlds. Messages in same channel cannot be heard across
 * different namespaces.
 */
const namespaces: Map<string, string> = new Map();

/**
 * Sets the chat policy for a world.
 * @param world World.
 * @param policy Chat policy.
 */
export function setWorldChatPolicy(
  world: World,
  policy: 'allow' | ChatChannel[],
) {
  if (policy == 'allow') {
    worldPolicies.set(world.name, 'allow');
  } else {
    const set: Set<string> = new Set();
    policy.map((ch) => ch.id).forEach((id) => set.add(id));
    worldPolicies.set(world.name, set);
  }
}

/**
 * Sets the chat policy for a channel.
 * @param channel Chat channel.
 * @param policy Chat policy.
 */
export function setChannelChatPolicy(
  channel: ChatChannel,
  policy: ChannelPolicy,
) {
  channelPolicies.set(channel.id, policy);
}

export function setChatNamespace(world: World, namespace: string) {
  namespaces.set(world.name, namespace);
}

/**
 * Checks if a chat channel is allowed in the given world.
 * @param channel Chat channel.
 * @param world World.
 */
export function isChannelAllowed(channel: ChatChannel, world: World) {
  const worldPolicy = worldPolicies.get(world.name) ?? 'allow';
  const channelPolicy = channelPolicies.get(channel.id) ?? 'inherit';

  let allow = false;
  if (worldPolicy == 'allow') {
    // If channel inherits policy from world, it is allowed
    allow = channelPolicy == 'inherit';
  } else if (worldPolicy.has(channel.id)) {
    // Since channel is explicitly allowed in world, deny-implied is ok too
    allow = channelPolicy == 'inherit' || channelPolicy == 'deny-implied';
  }

  // Override everything with channel allow/deny
  if (channelPolicy == 'allow') {
    allow = true;
  } else if (channelPolicy == 'deny') {
    allow = false;
  }
  return allow;
}

/**
 * Checks if a chat message can be heard (somewhere) in the given world.
 * @param msg Chat message.
 * @param world Destination world.
 */
export function isHeardInWorld(msg: ChatMessage, world: World) {
  // Check that world namespaces match
  if (namespaces.get(world.name) != namespaces.get(msg.sender.world.name)) {
    return false; // Channel might be heard, but not from that world
  }
  return isChannelAllowed(msg.channel, world);
}
