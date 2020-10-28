import { Location, Material, Particle } from 'org.bukkit';
import { BlockFace, Dispenser } from 'org.bukkit.block';
import { Directional } from 'org.bukkit.block.data';
import { Entity, EntityType, Player } from 'org.bukkit.entity';
import {
  Action,
  BlockBreakEvent,
  BlockDispenseEvent,
} from 'org.bukkit.event.block';
import { ProjectileHitEvent } from 'org.bukkit.event.entity';
import {
  PlayerInteractEvent,
  PlayerToggleSneakEvent,
} from 'org.bukkit.event.player';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { Vector } from 'org.bukkit.util';

const BALL_MATERIAL = Material.SNOWBALL;
const BALL_ITEM = new ItemStack(BALL_MATERIAL);

const players: { [player: string]: number } = {};
let flyingBalls: { entity: Entity; spin: Vector }[] = [];
let scores = [0, 0];
let startTime = 0;

let hitSeconds = 0;
let hits = 0;

export function startGame() {
  scores = [0, 0];
  startTime = Date.now();
}

function showTime() {
  const elapsed = (Date.now() - startTime) / 1000;
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed - minutes * 60).toString();
  const split = seconds.split('');
  if (split.length < 2) {
    const num = split.pop();
    split.push('0');
    split.push(num || '');
  }
  const players = server.getOnlinePlayers();
  for (const player of players) {
    (player as Player).sendActionBar(
      `${minutes}:${split.join('')} | ${scores[0]}-${scores[1]}`,
    );
  }

  return elapsed;
}

export function addScore(a: number, b: number) {
  if (startTime === 0) {
    return;
  }

  scores[0] += a;
  scores[1] += b;

  showTime();
}

setInterval(() => {
  if (startTime !== 0) {
    const elapsed = showTime();

    if (elapsed > 10 * 60) {
      let msg = 'Tasapeli';
      if (scores[0] > scores[1]) {
        msg = 'Pelaaja 1 voitti';
      } else if (scores[1] > scores[0]) {
        msg = 'Pelaaja 2 voitti';
      }
      const players = server.getOnlinePlayers();
      for (const player of players) {
        //player.sendActionBar(msg);
      }
      startTime = 0;
    }
  }
}, 1000);

const allowedBlocks = [
  Material.GRASS_BLOCK,
  Material.WHITE_WOOL,
  Material.WHITE_CONCRETE,
  Material.RED_CONCRETE,
  Material.BLUE_CONCRETE,
  Material.STONE,
  Material.COBBLESTONE,
  Material.GRAVEL,
  Material.ANDESITE,
  Material.GRANITE,
  Material.DIORITE,
  Material.EMERALD_BLOCK,
  Material.DIRT,
  Material.COBBLESTONE_SLAB,
  Material.STONE_BRICKS,
  Material.SNOW,
  Material.DARK_OAK_FENCE,
  Material.DARK_OAK_SLAB,
];

registerEvent(BlockDispenseEvent, (event) => {
  if (event.item.type !== BALL_MATERIAL || server.getPort() !== 25566) {
    return;
  }

  const block = event.getBlock().getState() as Dispenser;
  const data = event.getBlock().getBlockData() as Directional;
  const dir = data.getFacing().getDirection();
  //block.getInventory().addItem(new ItemStack(Material.SNOWBALL));

  const topbins = {
    horizontal: 0.3,
    vertical: 0.35,
    power: 0.8,
  };

  const routine = {
    horizontal: 0.25,
    vertical: 0.35,
    power: 0.8,
  };

  const shot = topbins;

  const velocity = event.getVelocity();
  const error = 0.05;
  const side = Math.random() - 0.5 < 0 ? -1 : 1;
  const vertical = shot.vertical;
  const newVelocity = dir.multiply(shot.power);
  newVelocity.setY(vertical);
  //const rand = side * (Math.random() + 1) * error;
  const rand = side * shot.horizontal;
  if (velocity.getZ() === 0) {
    newVelocity.setZ(rand);
  } else if (velocity.getX() === 0) {
    newVelocity.setX(rand);
  }
  event.setCancelled(true);
  const ball = event
    .getBlock()
    .getWorld()
    .spawnEntity(
      block
        .getLocation()!
        .add(0.5, 0.5, 0.5)
        .add(data.getFacing().getDirection()),
      EntityType.SNOWBALL,
    );
  ball.setVelocity(newVelocity);
  ball.setCustomName(Date.now().toString());
  flyingBalls.push({
    entity: ball,
    spin: new Vector(0.0, 2 * side, 0.0),
  });
  //event.setVelocity(velocity);
});

function hit(loc: Location) {
  loc.world.spawnParticle(Particle.CRIT, loc.getX(), loc.getY(), loc.getZ(), 5);
}

function bounce(loc: Location) {
  //loc.getWorld().playSound(loc, 'block.wool.step', 1, 1);
}

registerEvent(ProjectileHitEvent, (event) => {
  if (event.getEntityType() === EntityType.SNOWBALL) {
    let hitLoc = event.getEntity().getLocation();
    if (event.getEntity().getVelocity().lengthSquared() > 0.05) {
      bounce(hitLoc);
    }

    const orgVelocity = event.getEntity().getVelocity();
    const name = event.getEntity().getCustomName();
    const num = parseInt(name || '');
    event.getEntity().remove();

    if (!isNaN(num)) {
      const elapsed = Date.now() - num;
      if (elapsed > 1000 * 60) {
        hitLoc.getWorld()!.dropItem(hitLoc, BALL_ITEM);
        return;
      }
    } else {
      return;
    }

    const entity = event.getHitEntity();
    console.log(entity);
    if (entity && entity.getType() === EntityType.PLAYER) {
      const seconds = Math.floor(Date.now() / 1000);
      if (seconds !== hitSeconds) {
        hits = 0;
        hitSeconds = seconds;
      }
      if (hits > 10) {
        hitLoc.getWorld()!.dropItem(hitLoc, BALL_ITEM);
        console.log('Hits overflow');
        return;
      }
      hits++;
      const player = (entity as unknown) as Player;
      /*if (player.isSneaking()) {
        player.sendActionBar('Saat kopin pallosta');
        player.getInventory().addItem(BALL_ITEM);
        return;
      }*/
      const rand = new Vector(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
      );
      const velocity = player.getLocation().getDirection().normalize();
      const newBall = player
        .getWorld()
        .spawnEntity(hitLoc, EntityType.SNOWBALL);
      newBall.setCustomName(name || '');
      hit(hitLoc);
      let bounciness = player.isOnGround() ? 0.25 : 0.7;
      if (player.isSneaking()) {
        bounciness = 0.1;
        players[player.getName()] = Date.now() - 2000;
      }
      const angle = velocity.angle(orgVelocity);
      if (angle < 1) {
        newBall.setVelocity(rand);
      } else {
        newBall.setVelocity(velocity.multiply(bounciness));
      }
      return;
    } else {
      const bounce = true;
      if (bounce) {
        const newBall = hitLoc
          .getWorld()!
          .spawnEntity(hitLoc, EntityType.SNOWBALL);
        /*if (velocity.lengthSquared() < 0.1) {
          hitLoc.getWorld().dropItem(hitLoc, new ItemStack(Material.SNOWBALL));
          newBall.remove();
          return;
        }*/
        const type = event.getHitBlock()?.getType();
        if (!type) {
          newBall.remove();
          hitLoc.getWorld()!.dropItem(hitLoc, BALL_ITEM);
          return;
        }
        const face = event.getHitBlockFace();
        let bounceVector = new Vector(0.8, -1.0, 0.8);
        let bounciness = 0.7;
        if (face === BlockFace.SOUTH || face === BlockFace.NORTH) {
          bounceVector = new Vector(0.8, 0.8, -1.0);
        } else if (face === BlockFace.EAST || face === BlockFace.WEST) {
          bounceVector = new Vector(-1.0, 0.8, 0.8);
        }

        if (type === Material.IRON_BARS) {
          bounciness = 0.2;
        }

        const velocity = new Vector(
          orgVelocity.getX() * bounceVector.getX(),
          orgVelocity.getY() * bounceVector.getY(),
          orgVelocity.getZ() * bounceVector.getZ(),
        ).multiply(bounciness);
        if (allowedBlocks.indexOf(type) === -1) {
          hitLoc.getWorld()!.dropItem(hitLoc, BALL_ITEM);
          newBall.remove();
        }
        newBall.setCustomName(name || '');
        newBall.setVelocity(velocity);
      } else {
        const item = hitLoc
          .getWorld()!
          .dropItem(hitLoc, new ItemStack(Material.SNOWBALL));
      }
      //item.setVelocity(velocity);
    }
  }
});

registerEvent(PlayerInteractEvent, (event) => {
  if (
    event.item &&
    event.item.getType() === Material.SNOWBALL &&
    event.item.type !== BALL_MATERIAL
  ) {
    event.setCancelled(true);
  }

  if (event.getAction() !== Action.LEFT_CLICK_AIR) {
    if (
      event.getAction() === Action.RIGHT_CLICK_BLOCK &&
      event.getHand() === EquipmentSlot.HAND &&
      (!event.getItem() || event.getItem()!.getType() === Material.AIR)
    ) {
      const nearby = event.getPlayer().getNearbyEntities(2, 2, 2);
      for (const entity of nearby) {
        if (!entity || entity.getType() !== EntityType.SNOWBALL) {
          continue;
        }
        entity.remove();
        event.getPlayer().getInventory().addItem(BALL_ITEM);
        break;
      }
    } else if (
      event.getAction() === Action.RIGHT_CLICK_AIR ||
      event.getAction() === Action.RIGHT_CLICK_BLOCK
    ) {
      if (event.item && event.item.type === BALL_MATERIAL) {
        event.setCancelled(true);
        event.getItem()!.setAmount(event.getItem()!.getAmount() - 1);
        const player = event.getPlayer();
        const dir = player.getLocation().getDirection();
        const ball = player
          .getWorld()
          .spawnEntity(
            player.getLocation().add(0, 1.3, 0),
            EntityType.SNOWBALL,
          );
        ball.setVelocity(dir.multiply(0.7));
        ball.setCustomName(Date.now().toString());
      } else if (
        event.getItem() !== null &&
        event.getItem()!.getType() === Material.SNOWBALL
      ) {
        event.setCancelled(true);
      }
    }
    return;
  }

  const item = (event
    .getPlayer()
    .getInventory() as PlayerInventory).getItemInMainHand();

  if (item === null) {
    return;
  }

  if (item.getType() === Material.STICK || item.getType() === Material.BONE) {
    const nearby = event.getPlayer().getNearbyEntities(2, 2, 2);
    for (const entity of nearby) {
      if (!entity || entity.getType() !== EntityType.SNOWBALL) {
        continue;
      }
      const distance = event
        .getPlayer()
        .getLocation()
        .distance(entity.getLocation());
      const dir = event.getPlayer().getLocation().getDirection();
      const speed = item.getType() === Material.BONE ? 0.8 : 1;
      entity.setVelocity(
        dir
          .add(event.getPlayer().getVelocity())
          .add(new Vector(0.0, 0.1, 0.0))
          .multiply((1.5 * speed) / distance),
      );
      //server.broadcastMessage(distance);
      break;
    }
    players[event.getPlayer().getName()] = Date.now();
  } else if (event.item?.type === BALL_MATERIAL) {
    item.setAmount(item.getAmount() - 1);
    const loc = event.getPlayer().getLocation();
    const ballPos = loc.add(
      loc.getDirection().getX(),
      1,
      loc.getDirection().getZ(),
    );
    const ball = loc.getWorld()!.spawnEntity(ballPos, EntityType.SNOWBALL);
    ball.setVelocity(new Vector(0.0, 0.0, 0.0));
    ball.setCustomName(Date.now().toString());
  }
});

registerEvent(PlayerToggleSneakEvent, (event) => {
  if (event.isSneaking()) {
    players[event.getPlayer().getName()] = Date.now();
    return;
  }
  const nearby = event.getPlayer().getNearbyEntities(2, 2, 2);
  for (const entity of nearby) {
    let elapsed = Date.now() - players[event.getPlayer().getName()];
    if (elapsed > 2000) {
      return;
    }
    if (elapsed > 1000) {
      elapsed = 1000;
    } else if (elapsed < 120) {
      elapsed = 120;
    }
    let power = 120 / elapsed;
    if (
      !entity ||
      entity.getType() !== EntityType.SNOWBALL ||
      entity.getVelocity().lengthSquared() > 0.08
    ) {
      continue;
    }
    const distance = entity
      .getLocation()
      .distanceSquared(event.getPlayer().getLocation().add(0, 1.5, 0));
    if (entity.getVelocity().lengthSquared() > 0.1) {
      if (distance > 2) {
        if (power > 0.8) {
          power = 0.8;
        }
      } else {
        return;
      }
    }
    entity.setCustomName(Date.now().toString());
    const a = event.getPlayer().getLocation();
    let pitch = 90 - a.getPitch();
    if (pitch < 30) {
      pitch = 30;
    }
    if (pitch > 150) {
      pitch = 150;
    }
    const horDir = a.getDirection();
    horDir.setY(0);
    const b = entity.getLocation();
    const delta = b.add(a.multiply(-1)).toVector();
    const n = (delta.clone() as Vector).getCrossProduct(new Vector(0, 1, 0));
    const nAngle = (n.angle(horDir) / (2 * Math.PI)) * 360;
    let angle = (horDir.angle(delta) / (2 * Math.PI)) * 360;
    if (angle > 30) {
      angle = 30;
    } else if (angle < -30) {
      angle = -30;
    }
    angle = nAngle > 90 ? angle : -angle;
    const topSpinDir = (delta.clone() as Vector)
      .normalize()
      .getCrossProduct(new Vector(0, -1, 0));
    const sideSpinDir = new Vector(0, -1, 0);
    const dir = delta.normalize().multiply(power);
    dir.setY(0.2 + (pitch / 37.5) * 0.1);
    entity.setVelocity(dir);
    const sideSpin = (2 * angle ** 3) / 27000;
    flyingBalls.push({
      entity,
      spin: topSpinDir.multiply(0).add(sideSpinDir.multiply(sideSpin)),
    });
    hit(event.getPlayer().getLocation());
    break;
  }
});

registerEvent(PlayerToggleSneakEvent, (event) => {
  if (!event.player.isSprinting()) {
    return;
  }
  const nearby = event.getPlayer().getNearbyEntities(2, 2, 2);
  for (const entity of nearby) {
    if (
      !entity ||
      entity.getType() !== EntityType.SNOWBALL ||
      entity.getVelocity().lengthSquared() > 0.1
    ) {
      continue;
    }
    entity.setCustomName(Date.now().toString());
    const targetBlock = event.getPlayer().getTargetBlock(null as any, 100);
    const raycast = event.getPlayer().rayTraceBlocks(100);
    let distance = 100;
    if (raycast !== null) {
      distance = raycast
        .getHitPosition()
        .distance(event.getPlayer().getLocation().toVector());
    }
    const a = event.getPlayer().getLocation();
    const pitch = 90 - a.getPitch();
    const b = entity.getLocation();
    const delta = b.add(a.multiply(-1)).toVector();
    const dir = delta.normalize();
    dir.setY(0.15);
    //let power = 0.06 + distance / 12;
    let angle = (pitch / 180) * Math.PI;
    if (angle >= Math.PI / 2) {
      angle = Math.PI / 2 - 0.01;
    }
    let power =
      0.06 + (Math.tan(angle) * event.getPlayer().getEyeHeight()) / 12;
    if (power > 1) {
      power = 1;
    }
    //event.getPlayer().sendMessage(`${pitch} ${power} ${distance}`);
    hit(event.getPlayer().getLocation());
    const velocity = entity.getVelocity();
    velocity.add(dir.multiply(power));
    entity.setVelocity(velocity);
    break;
  }
});

registerEvent(BlockBreakEvent, (event) => {
  if (event.getBlock().getType() === Material.SNOW) {
    const player = event.getPlayer();
    const item = (player.getInventory() as PlayerInventory).getItemInMainHand();
    if (item.getType() === Material.STONE_SHOVEL) {
      const loc = event.getBlock().getLocation();
      if (Math.random() < 0.33) {
        loc.getWorld()!.dropItemNaturally(loc, new ItemStack(Material.SNOW));
      }
    }
    event.setCancelled(true);
    event.getBlock().setType(Material.AIR);
  }
});

setTimeout(() => {
  let newBalls = [];
  for (const ball of flyingBalls) {
    if (!ball.entity || ball.entity.isDead()) {
      continue;
    }
    const velocity = ball.entity.getVelocity();
    const spin = ball.spin;
    const magnus = (velocity.clone() as Vector)
      .getCrossProduct(spin)
      .multiply(0.01);
    velocity.add(magnus);
    ball.entity.setVelocity(velocity);
    newBalls.push(ball);
  }
  flyingBalls = newBalls;
}, 1000 / 20);
