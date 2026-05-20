import * as migration_20260520_134305_init from './20260520_134305_init';

export const migrations = [
  {
    up: migration_20260520_134305_init.up,
    down: migration_20260520_134305_init.down,
    name: '20260520_134305_init'
  },
];
