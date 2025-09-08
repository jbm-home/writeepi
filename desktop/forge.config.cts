import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDMG } from '@electron-forge/maker-dmg';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: 'dist/desktop/src/favicon'
  },
  makers: [
    new MakerSquirrel({
      setupIcon: 'dist/desktop/src/favicon.ico',
      loadingGif: 'dist/desktop/src/installing.gif',
    }, ['win32']),
    new MakerZIP({}, ['darwin','linux','win32']),
    new MakerDeb({}, ['linux']),
    new MakerDMG({
      icon: 'dist/desktop/src/favicon.icns'
    }),
  ]
};
export default config;
