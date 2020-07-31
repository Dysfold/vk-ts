# Handling Block Data

Often it is necessary to save custom data to arbitrary blocks in the game world.
The `CustomBlock` -utility class was created in an effort to make this relatively easy by
providing easy interfaces for common use cases, while also staying flexible enough for
easy implementation of complex behaviour.

## Example

Implementing custom block data begins with extending the `CustomBlock` -class from `src/common/blocks`. '

```ts
import { CustomBlock } from './common/blocks';

class Cauldron extends CustomBlock {
  temperature: number = 0;

  check() {
    return this.block.type === Material.CAULDRON;
  }
}
```

Here we define a single custom property, `temperature`, for our custom block data. We also have to implement a `check()` method that defines what
blocks are valid instances of our custom block. Here we simply define that
all cauldrons can contain this custom data.

The `Blocks` -singleton is the main way of dealing with this custom block data.

```ts
registerEvent(PlayerInteractEvent, (e) => {
  const data = Blocks.get(e.clickedBlock, Cauldron);
  if (!data) {
    return;
  }
  e.player.sendMessage(`Temperature: ${data.temperature}`);
})
```

The `Blocks.get` gets the data of a certain block as an instance of the provided class. If the block is not considered valid by the provided class (i.e. the classes `check()` -method returns false), the method returns `undefined`. This allows for relatively easy handling of events for our block. However, we can write this even more briefly using `@Event` -decorator.

```ts
class Cauldron extends CustomBlock {
  temperature: number = 0;

  @Event(PlayerInteractEvent, e => e.clickedBlock)
  onClick(event: PlayerInteractEvent) {
    event.player.sendMessage(`Temperature: ${this.temperature}`);
  }  

  check() {
    return this.block.type === Material.CAULDRON;
  }
}
```

We supply the decorator the type of event we want to handle, and also a function that will define the property of the event that we want to check for being an instance of our custom block. In this example, the onClick-method will only be called if the player clicks on a cauldron, we just don't need to check it manually.

It often becomes necessary to run scheduled activities on instances of our custom block. The `Blocks.forEach` -method can be used for looping through all known instances of a certain type of block. By default, the method loops through all blocks in regions (a 32x32 square of chunks) that are currently loaded.

```ts
setInterval(() => {
  Blocks.forEach(Cauldron, (block) => {
    block.temperature += 0.1;
  });
}, 1000);
```

Here we loop through all known instances of our `Cauldron` -block on currently loaded regions, and increase their temperature by 0.1. This approach of using `setInterval` and `Blocks.forEach` works, and can be used if the situation requires it, but the recommended way of doing this is by using the `@Tick` -helper decorator in the class definition.

```ts
class Cauldron extends CustomBlock {
  temperature: number = 0;

  @Event(PlayerInteractEvent, e => e.clickedBlock)
  onClick(event: PlayerInteractEvent) {
    event.player.sendMessage(`Temperature: ${this.temperature}`);
  }  

  @Tick(20)
  tick(delta: number) {
    this.temperature += 0.1 * delta;
  }

  check() {
    return this.block.type === Material.CAULDRON;
  }
}
```

Here we define a method to be run (approximately) every 20 ticks (1 second, same as in the previous example), and increase the temperature of all the blocks by `0.1 * delta`. The `delta`-parameter is the time elapsed since the last call in seconds. So here we are essentially increasing the temperature by 0.1 every second. The `delta` is passed because it may not be guaranteed that this method is called at exact intervals, and code should not rely on that.