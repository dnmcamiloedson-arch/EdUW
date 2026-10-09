import { Config } from "@remotion/cli/config";

// assets/ hace de carpeta public (fuentes, texturas, audio)
Config.setPublicDir("assets");
Config.setVideoImageFormat("png");
Config.setBrowserExecutable("/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell");
