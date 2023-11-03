import Phaser from 'phaser'

import MainScene from './MainScene'
import {scaledScreenHeight, scaledScreenWidth} from "./globals";

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: 'app',
	scale: {
		width: scaledScreenWidth,
		height: scaledScreenHeight,
		mode: Phaser.Scale.FIT,
	},
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 200 },
		},
	},
	scene: [MainScene],
}

export default new Phaser.Game(config)
