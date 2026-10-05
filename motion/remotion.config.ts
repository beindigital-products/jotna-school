import { Config } from "@remotion/cli/config";

// public/app-images et public/app-sounds sont des liens vers le dossier public de l'application.
Config.setPublicDir("./public");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setConcurrency(6);
