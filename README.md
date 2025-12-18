# Snail Race - Base Mini App

A fun racing game where you control a snail dodging obstacles on a curvy road floating in space!

## Game Features

- Control a snail moving automatically forward on a 3-lane road
- Avoid sharp objects (💀) that end the game
- Dodge salt particles (❄️) that slow you down
- Road curves left and right as you progress
- Speed increases every 10 meters
- Don't fall off the edges of the road!

## Controls

- **Mouse/Touch**: Click and drag the snail to move left/right
- **Keyboard**: Use Left/Right arrow keys to move

## Technical Implementation

This mini app is built with:
- React + Vite
- @farcaster/miniapp-sdk
- Lexend Google Font

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

## Base Mini App Requirements

This app follows the Base mini app specifications:
- Includes `farcaster.json` manifest in `/public/.well-known/`
- Has proper embed metadata in `index.html`
- Uses the Mini App SDK for initialization
- Responsive design for mobile devices

## Game Mechanics

1. The snail moves automatically forward and accelerates every 10 meters
2. Obstacles spawn randomly in lanes
3. At least one lane is always free for passage
4. Sharp objects (💀) cause game over on contact
5. Salt particles (❄️) slow the snail temporarily
6. Moving off the road edges causes game over

## Customization

You can customize the game by modifying:
- Colors in `src/App.css`
- Game parameters in `src/App.jsx` (speed, spawn rates, etc.)
- Visual assets by replacing image URLs in the manifest