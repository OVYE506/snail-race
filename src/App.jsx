import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('menu') // 'menu', 'playing', 'gameOver'
  const [score, setScore] = useState(0)
  
  return (
    <div className="app">
      {gameState === 'menu' && (
        <MenuScreen onStart={() => startGame()} />
      )}
      {gameState === 'playing' && (
        <GameWorld 
          score={score} 
          onGameOver={(finalScore) => endGame(finalScore)}
          onScoreUpdate={setScore}
        />
      )}
      {gameState === 'gameOver' && (
        <GameOverScreen 
          score={score} 
          onRestart={() => restartGame()} 
        />
      )}
    </div>
  )

  function MenuScreen({ onStart }) {
    return (
      <div className="screen menu-screen">
        <h1>🐌 Snail Race 🐌</h1>
        <p>Watch the snail accelerate forward!</p>
        <button onClick={onStart}>Start Game</button>
        <div className="instructions">
          <h2>How to Play</h2>
          <ul>
            <li>Click and drag the snail to move left/right</li>
            <li>Just watch the snail accelerate forward</li>
            <li>Speed increases over time</li>
          </ul>
        </div>
      </div>
    )
  }

  function GameOverScreen({ score, onRestart }) {
    return (
      <div className="screen game-over-screen">
        <h1>Game Over!</h1>
        <p>Your score: {Math.floor(score)} meters</p>
        <button onClick={onRestart}>Play Again</button>
      </div>
    )
  }

  function GameWorld({ score, onGameOver, onScoreUpdate }) {
    const [snailPosition, setSnailPosition] = useState(150) // Center of 300px road (lane 1)
    const [speed, setSpeed] = useState(2) // Initial speed
    const [snailY, setSnailY] = useState(100) // Snail's Y position (moving forward - starting at bottom)
    const [gameOver, setGameOver] = useState(false)
    const [distance, setDistance] = useState(0) // Track distance traveled
    const [roadOffset, setRoadOffset] = useState(0) // For curvy road effect
    const gameWorldRef = useRef(null)
    const animationFrameRef = useRef(null)
    const lastTimeRef = useRef(null)
    
    // Increase speed over time
    useEffect(() => {
      const speedInterval = setInterval(() => {
        if (!gameOver) {
          // Increase speed gradually
          setSpeed(prev => prev + 0.1)
        }
      }, 1000) // Increase speed every second
      
      return () => clearInterval(speedInterval)
    }, [gameOver])
    
    // Curvy road effect - affects entire pathway
    useEffect(() => {
      const roadInterval = setInterval(() => {
        if (!gameOver) {
          // Create a gentle curve in the road
          setRoadOffset(prev => prev + (Math.random() - 0.5) * 2) // Small random movement
          
          // Keep road offset within bounds
          if (roadOffset > 20 || roadOffset < -20) {
            setRoadOffset(prev => prev * 0.9) // Gradually return to center
          }
        }
      }, 100) // Update frequently for smooth curves
      
      return () => clearInterval(roadInterval)
    }, [gameOver, roadOffset])
    
    // Game loop - just move the snail forward
    useEffect(() => {
      const updateGame = (timestamp) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp
        
        const deltaTime = timestamp - lastTimeRef.current
        lastTimeRef.current = timestamp
        
        if (!gameOver) {
          // Move the snail forward
          setSnailY(prev => {
            const newY = prev + speed * (deltaTime / 16)
            // When snail moves forward, the distance increases
            if (newY - prev > 0) {
              setDistance(dist => dist + (newY - prev) / 10) // Scale the distance
            }
            return newY
          })
          
          animationFrameRef.current = requestAnimationFrame(updateGame)
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(updateGame)
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }, [speed, snailY, gameOver])
    
    const handleSnailDrag = (e) => {
      if (gameWorldRef.current && !gameOver) {
        const rect = gameWorldRef.current.getBoundingClientRect()
        const roadLeft = rect.left + (rect.width - 300) / 2 // Road is 300px wide, centered
        const rawPosition = e.clientX - roadLeft
        
        // Calculate which lane the user clicked on (0, 1, or 2)
        const lane = Math.min(2, Math.max(0, Math.floor(rawPosition / 100)))
        
        // Keep snail within road bounds and snap to lane center
        if (rawPosition >= 0 && rawPosition <= 300) {
          const lanePositions = [50, 150, 250] // Center positions of each lane
          setSnailPosition(lanePositions[lane])
        }
      }
    }
    
    return (
      <div 
        className="game-world" 
        ref={gameWorldRef}
        onMouseMove={(e) => handleSnailDrag(e)}
        onTouchMove={(e) => {
          e.preventDefault()
          handleSnailDrag(e.touches[0])
        }}
      >
        <div className="road-container" style={{ transform: `translateX(${roadOffset}px)` }}>
          <Road />
          <Snail position={snailPosition} snailY={snailY} />
        </div>
      </div>
    )
  }

  function Road() {
    return (
      <div className="road">
        <div className="road-lines"></div>
        <div className="lane lane-1"></div>
        <div className="lane lane-2"></div>
        <div className="lane lane-3"></div>
      </div>
    )
  }

  function Snail({ position, snailY }) {
    // Calculate lane position (0, 1, 2) from pixel position
    const lane = Math.floor(position / 100)
    const lanePositions = [50, 150, 250] // Center positions of each lane
    
    return (
      <div 
        className="snail" 
        style={{ 
          left: `${lanePositions[lane]}px`, // Position in the center of the lane
          top: `${snailY}px` // Position based on snail's Y position (moving upward)
        }}
      >
        🐌
      </div>
    )
  }

  const endGame = (finalScore) => {
    setScore(finalScore)
    setGameState('gameOver')
  }

  const restartGame = () => {
    setGameState('menu')
    setScore(0)
  }

  const startGame = (newScore = 0) => {
    setGameState('playing')
    setScore(newScore)
  }

  const updateScore = (newScore) => {
    setScore(newScore)
  }
}

export default App