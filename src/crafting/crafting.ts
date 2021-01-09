import { Bukkit } from 'org.bukkit';

Bukkit.server.resetRecipes();

require('./recipes/shapeless');
require('./recipes/furnace');
require('./recipes/shaped');
