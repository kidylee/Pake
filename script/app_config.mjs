import pakeJson from '../src-tauri/pake.json' assert { type: 'json' };
import tauriJson from '../src-tauri/tauri.conf.json' assert { type: 'json' };
import windowsJson from '../src-tauri/tauri.windows.conf.json' assert { type: 'json' };
import macosJson from '../src-tauri/tauri.macos.conf.json' assert { type: 'json' };
import linuxJson from '../src-tauri/tauri.linux.conf.json' assert { type: 'json' };

import { writeFileSync, existsSync, copyFileSync } from 'fs';
import os from 'os';

const desktopEntry = `[Desktop Entry]
Encoding=UTF-8
Categories=Office
Exec=com-pake-${process.env.NAME}
Icon=com-pake-${process.env.NAME}
Name=com-pake-${process.env.NAME}
Name[zh_CN]=${process.env.CN_NAME}
StartupNotify=true
Terminal=false
Type=Application
`;

const variables = {
  url: process.env.URL,
  name: process.env.NAME,
  title: process.env.TITLE,
  cnName: process.env.CN_NAME,

  pakeConfigPath: 'src-tauri/pake.json',
  tauriConfigPath: 'src-tauri/tauri.conf.json',
  identifier: `com.pake.${process.env.NAME}`,

  linux: {
    configFilePath: 'src-tauri/tauri.linux.conf.json',
    iconPath: `src-tauri/png/${process.env.NAME}_512.png`,
    productName: `com-pake-${process.env.NAME}`,
    defaultIconPath: 'src-tauri/png/icon_512.png',
    icon: [`png/${process.env.NAME}_512.png`],
    desktopEntry,
    desktopEntryPath: `src-tauri/assets/com-pake-${process.env.NAME}.desktop`,
    desktopEntryConfig: {
      configKey: `/usr/share/applications/com-pake-${process.env.NAME}.desktop`,
      configValue: `assets/com-pake-${process.env.NAME}.desktop`,
    },
  },
  macos: {
    configFilePath: 'src-tauri/tauri.macos.conf.json',
    iconPath: `src-tauri/icons/${process.env.NAME}.icns`,
    defaultPath: 'src-tauri/icons/icon.icns',
    icon: [`icons/${process.env.NAME}.icns`],
  },
  windows: {
    configFilePath: 'src-tauri/tauri.windows.conf.json',
  },
};

validate();

updatePakeJson();

updateTauriJson();

let platformVariables;
let platformConfig;

switch (os.platform()) {
  case 'linux':
    platformVariables = variables.linux;
    platformConfig = linuxJson;
    updateDesktopEntry();
    break;
  case 'darwin':
    platformVariables = variables.macos;
    platformConfig = macosJson;
    break;
  case 'win32':
    platformConfig = windowsJson;
    platformVariables = variables.windows;
    break;
}


updateIconFile(platformVariables.iconPath, platformVariables.defaultIconPath);

updatePlatformConfig(platformConfig, platformVariables);

save();

function validate() {
  if ('URL' in process.env === false) {
    console.log('URL is not set');
    process.exit(1);
  }

  if ('NAME' in process.env === false) {
    console.log('NAME is not set');
    process.exit(1);
  }

  if ('TITLE' in process.env === false) {
    console.log('TITLE is not set');
    process.exit(1);
  }

  if ('CN_NAME' in process.env === false) {
    console.log('CN_NAME is not set');
    process.exit(1);
  }
}

function updatePakeJson() {
  pakeJson.windows[0].url = variables.url;
}

function updateTauriJson() {
  const url = new URL(variables.url);
  tauriJson.tauri.security.dangerousRemoteDomainIpcAccess[0].domain = url.hostname;
  tauriJson.package.productName = variables.title;

  writeFileSync('src-tauri/tauri.conf.json', JSON.stringify(tauriJson, null, 2));
}

function updateIconFile(iconPath, defaultIconPath) {
  if (!existsSync(iconPath)) {
    console.warn(`Icon for ${process.env.NAME} not found, will use default icon`);
    copyFileSync(defaultIconPath, iconPath);
  }
}

function updatePlatformConfig(platformConfig, platformVariables) {
  platformConfig.tauri.bundle['icon'] = platformVariables.icon;
  platformConfig.tauri.bundle['identifier'] = variables.identifier;
}

function save() {
  writeFileSync(variables.pakeConfigPath, JSON.stringify(pakeJson, null, 2));
  writeFileSync(variables.tauriConfigPath, JSON.stringify(tauriJson, null, 2));
  writeFileSync(platformVariables.configFilePath, JSON.stringify(platformConfig, null, 2));
}

function updateDesktopEntry() {
  linuxJson.tauri.bundle.deb.files = {};
  linuxJson.tauri.bundle.deb.files[variables.linux.desktopEntryConfig.configKey] =
  variables.linux.desktopEntryConfig.configValue;
  writeFileSync(variables.linux.desktopEntryPath, variables.linux.desktopEntry);
}
