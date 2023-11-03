import Phaser from 'phaser'
import {scaledScreenWidth, scaledScreenHeight} from './globals';
import Pointer = Phaser.Input.Pointer;
import Image = Phaser.GameObjects.Image;
import Rectangle = Phaser.Geom.Rectangle;
import GameObject = Phaser.GameObjects.GameObject;

type Card = { image: Image }

type CardSpot = { card?: Card, image: Image }

type DraggingCard = { type: 'hand', index: number, card: Card, originalX: number, originalY: number }
    | { type: 'spot', spot: CardSpot, card: Card }

type HoveringCard = { type: 'hand', index: number, card: Card, originalX: number, originalY: number }
    | { type: 'spot', spot: CardSpot, card: Card }

const draggingScaleFactor = 1.2

const handCardScale = 0.5
const spotScale = 0.4
export default class MainScene extends Phaser.Scene {
    private spots: [CardSpot, CardSpot, CardSpot, CardSpot, CardSpot];
    private hand: Card[]
    private draggingCard?: DraggingCard;
    private hoveringCard?: HoveringCard;


    constructor() {
        super('mainScene')
        this.spots = (([{}, {}, {}, {}, {}]) as [CardSpot, CardSpot, CardSpot, CardSpot, CardSpot])
        this.hand = []
    }

    preload() {
        this.load.image('wood', 'textures/wood.webp')
        this.load.image('card-frame', 'textures/card-frame.png')
        this.load.image('spot', 'textures/spot.png')
        this.load.image('artwork_programmer1', 'textures/artwork/programmer1.webp')
        this.load.image('artwork_programmer2', 'textures/artwork/programmer2.webp')
        this.load.image('artwork_programmer3', 'textures/artwork/programmer3.webp')
    }

    create() {

        // This is the background
        this.add.tileSprite(scaledScreenWidth / 2, scaledScreenHeight / 2, scaledScreenWidth, scaledScreenHeight, 'wood');

        // The slots to place cards into
        for (let i = 0; i < 5; i++) {
            const image = this.add.image(200 + i * 400, 250, 'spot')
            image.scale = spotScale
            this.spots[i] = {image}
        }

        // Dynamic texture for cards

        const cardProgrammer1Texture = this.textures.addDynamicTexture('card:programmer1', 768, 1024)!
        cardProgrammer1Texture.isSpriteTexture = false
        cardProgrammer1Texture.stamp('card-frame', 'card-background', 768 / 2, 1024 / 2, {scaleY: -1})
        cardProgrammer1Texture.stamp('artwork_programmer1', 'card-foreground', 768 / 2 - 22, 1024 / 2 + 284, {
            scaleY: -0.438,
            scaleX: 0.438
        })

        const programmer1HandCard = this.add.image(2000, 1400, cardProgrammer1Texture)
        programmer1HandCard.preFX?.setPadding(22)
        programmer1HandCard.preFX?.addGlow(0x3F4FFF)
        programmer1HandCard.preFX?.disable()
        programmer1HandCard.setScale(handCardScale)
        programmer1HandCard.setInteractive({draggable: true})

        const cardProgrammer2Texture = this.textures.addDynamicTexture('card:programmer2', 768, 1024)!
        cardProgrammer2Texture.isSpriteTexture = false
        cardProgrammer2Texture.stamp('card-frame', 'card-background', 768 / 2, 1024 / 2, {scaleY: -1})
        cardProgrammer2Texture.stamp('artwork_programmer2', 'card-foreground', 768 / 2 - 22, 1024 / 2 + 284, {
            scaleY: -0.438,
            scaleX: 0.438
        })

        const programmer2HandCard = this.add.image(1600, 1400, cardProgrammer2Texture)
        programmer2HandCard.preFX?.setPadding(22)
        programmer2HandCard.preFX?.addGlow(0x3F4FFF)
        programmer2HandCard.preFX?.disable()
        programmer2HandCard.setScale(handCardScale)
        programmer2HandCard.setInteractive({draggable: true})

        const cardProgrammer3Texture = this.textures.addDynamicTexture('card:programmer3', 768, 1024)!
        cardProgrammer3Texture.isSpriteTexture = false
        cardProgrammer3Texture.stamp('card-frame', 'card-background', 768 / 2, 1024 / 2, {scaleY: -1})
        cardProgrammer3Texture.stamp('artwork_programmer3', 'card-foreground', 768 / 2 - 22, 1024 / 2 + 284, {
            scaleY: -0.438,
            scaleX: 0.438
        })

        const programmer3HandCard = this.add.image(1200, 1400, cardProgrammer3Texture)
        programmer3HandCard.preFX?.setPadding(22)
        programmer3HandCard.preFX?.addGlow(0x3F4FFF)
        programmer3HandCard.preFX?.disable()
        programmer3HandCard.setScale(handCardScale)
        programmer3HandCard.setInteractive({draggable: true})


        this.hand = [{image: programmer1HandCard}, {image: programmer2HandCard}, {image: programmer3HandCard}]

        this.rearrangeHand()

        this.input.on('pointerover', (_event: any, gameObjects: GameObject[]) => {
            let handCardIdx = -1;
            gameObjects.forEach(gameObject => {
                    const idx = this.hand.findIndex(c => c.image == gameObject)
                    if (idx != -1) handCardIdx = idx;
                }
            )
            if (handCardIdx != -1) {
                const handCard = this.hand[handCardIdx];
                this.hoveringCard = {
                    type: "hand",
                    card: handCard,
                    index: handCardIdx,
                    originalX: handCard.image.x,
                    originalY: handCard.image.y
                }
                this.hoveringCard.card.image.preFX?.enable()
                this.tweens.add({
                    targets: handCard.image,
                    y: handCard.image.y - 30,
                    ease: 'Cubic',
                    duration: 200
                })
            }
        })

        this.input.on('pointerout', (_event: any, gameObjects: GameObject[]) => {
            if (this.hoveringCard && this.hoveringCard.type == 'hand') {
                const hoveringCard = this.hoveringCard!
                if (gameObjects.find(gameObject => hoveringCard.card.image == gameObject)) {
                    this.unhoverCard(hoveringCard)
                }
            }
        })

        this.input.on('dragstart', (_pointer: Pointer, gameObject: Image) => {

            // For now, drag takes precedence over hover

            const handCardIdx = this.hand.findIndex(c => c.image == gameObject)
            if (handCardIdx != -1) {
                const handCard = this.hand[handCardIdx];
                // Add it to be dragging
                this.draggingCard = {
                    type: 'hand',
                    index: handCardIdx,
                    originalX: handCard.image.x,
                    originalY: this.hoveringCard?.type == "hand" ? this.hoveringCard?.originalY : handCard.image.y,
                    card: handCard
                };

                this.children.bringToTop(handCard.image);
                this.tweens.add({
                    targets: handCard.image,
                    scale: draggingScaleFactor * handCardScale,
                    ease: 'Cubic',
                    duration: 400
                })
            } else {
                console.log("not found")
            }
        }, this);


        this.input.on('drag', (_pointer: Pointer, gameObject: Image, dragX: number, dragY: number) => {
            if (this.draggingCard?.type == 'hand') {

                this.draggingCard.card.image.x = dragX;
                this.draggingCard.card.image.y = dragY;

                // Check if the dragged card overlaps any target spot
                const overlapRect = new Rectangle()
                this.spots.forEach((spot: CardSpot) => {
                    Rectangle.Intersection(gameObject.getBounds(), spot.image.getBounds(), overlapRect)
                    if (overlapRect.width >= 200.0) {
                        spot.image.setTintFill(0x2233ff)
                    } else {
                        spot.image.tintFill = false;
                    }
                })
            }

        });

        this.input.on('dragend', (pointer: Pointer, gameObject: Image) => {

            if (this.draggingCard?.type == "hand") {
                // Check if the dragged card overlaps any target spot
                const overlapRect = new Rectangle()
                let overlappedSpot: undefined | CardSpot
                this.spots.forEach(spot => {
                    if (spot.card) {
                        // There's already a card in this spot, can't place another one
                        return
                    }

                    console.log("not taken!")
                    Rectangle.Intersection(gameObject.getBounds(), spot.image.getBounds(), overlapRect)
                    // Need to check for a proper overlap so that it doesn't overlap with more than one
                    if (overlapRect.width >= 200.0) {
                        overlappedSpot = spot
                    }
                })
                if (overlappedSpot) {
                    // Put the card in the spot it was dropped on
                    overlappedSpot.card = this.draggingCard.card
                    // And remove it from the hand
                    this.hand.splice(this.draggingCard.index, 1);
                    this.tweens.add({
                        targets: gameObject,
                        scale: spotScale,
                        x: overlappedSpot.image.x,
                        y: overlappedSpot.image.y,
                        ease: 'Cubic',
                        duration: 100
                    })
                    this.rearrangeHand()
                    if (this.hoveringCard) {
                        if (Rectangle.Contains(overlappedSpot.image.getBounds(), pointer.x, pointer.y)) {
                            this.hoveringCard = {type: "spot", spot: overlappedSpot, card: this.hoveringCard.card}
                            this.unhoverCard(this.hoveringCard)
                        } else {
                            this.hoveringCard = undefined
                        }

                    }
                } else {
                    this.tweens.add({
                        targets: this.draggingCard.card.image,
                        scale: handCardScale,
                        x: this.draggingCard.originalX,
                        y: this.draggingCard.originalY,
                        ease: 'Cubic', duration: 250
                    })
                }
                this.draggingCard = undefined;
            }
        })
    }

    unhoverCard(hoveringCard: HoveringCard) {
        hoveringCard.card.image.preFX?.disable()
        if (hoveringCard.type == "hand") {
            this.tweens.add({
                targets: hoveringCard.card.image,
                y: hoveringCard.originalY,
                ease: 'Cubic',
                duration: 200,
            })
        }
        this.hoveringCard = undefined
    }

    rearrangeHand() {
        let isTweening = false
        this.hand.forEach(handCard => {
                if (this.tweens.isTweening(handCard.image)) isTweening = true
            }
        )
        if (!isTweening) {
            const padding = 40
            this.hand.forEach((handCard, i) => {
                    const cardWidth = handCard.image.width / devicePixelRatio
                    const totalWidth = cardWidth * this.hand.length + (this.hand.length - 1) * padding
                    const targetX = (scaledScreenWidth + cardWidth) / 2 + (i * (cardWidth + padding)) - totalWidth /2
                    this.tweens.add({
                        targets: handCard.image,
                        scale: handCardScale,
                        x: targetX,
                        ease: 'Cubic', duration: 250
                    })
                }
            )
        }
    }
}
