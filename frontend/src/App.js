import React, { useState, useEffect } from 'react';
import './App.css';
import { io } from 'socket.io-client';
import Square from './Square/Square';
import Swal from 'sweetalert2';


const renderFrom = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]

const App = () => {

  const [gameState, setGameState] = useState(renderFrom);
  const [currentPlayer, setCurrentPlayer] = useState('circle');
  const [finishedState, setFinishedState] = useState(false);
  const [finishedArrayState, setFinishedArrayState] = useState([]);
  const [playOnline, setPlayOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [opponentName, setOpponentName] = useState(null);
  const [playingAs, setPlayingAs] = useState(null);


  const checkWinner = () => {
    for (let row = 0; row < gameState.length; row++) {
      if (gameState[row][0] === gameState[row][1] && gameState[row][0] === gameState[row][2]) {
        setFinishedArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2])
        return gameState[row][0];
      }
    }
    for (let col = 0; col < gameState[0].length; col++) {
      if (gameState[1][col] === gameState[0][col] && gameState[1][col] === gameState[2][col]) {
        setFinishedArrayState([col, 3 + col, 6 + col])
        return gameState[0][col];
      }
    }

    if (gameState[0][0] === gameState[1][1] && gameState[0][0] === gameState[2][2]) {
      setFinishedArrayState([0, 4, 8])
      return gameState[0][0];
    }

    if (gameState[2][0] === gameState[1][1] && gameState[1][1] === gameState[0][2]) {
      setFinishedArrayState([2, 4, 6])
      return gameState[1][1];
    }

    const isDrawMatch = gameState.flat().every(e => {
      if (e === 'circle' || e === 'cross') {
        return true;
      }
    })

    if (isDrawMatch) return 'draw'

    return null;
  }

  const onClickPlay = async () => {
    const result = await takePlayerName()
    console.log(result);
    if (!result.isConfirmed)
      return;

    const userName = result?.value;
    setPlayerName(userName)
    const newSocket = io("http://localhost:4000", {
      autoConnect: true
    });

    newSocket?.emit('request_to_play', {
      playerName: userName
    })

    setSocket(newSocket);
  }

  const takePlayerName = async () => {
    return await Swal.fire({
      title: "Enter your Name",
      input: "text",
      inputLabel: "Your Name",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      }
    });
  }

  socket?.on('connect', () => {
    setPlayOnline(true);
  })
  socket?.on('playerMoveFromServer', (data) => {
    const id = data.state.id;
    setGameState(prevState => {
      let newState = [...prevState]
      const rowIndex = Math.floor(id / 3)
      const colIndex = id % 3
      newState[rowIndex][colIndex] = data.state.sign;
      return newState;
    })
    setCurrentPlayer(data.state.sign === "cross" ? "circle" : "cross");
  })
  socket?.on('OpponentNotFound', () => {
    setOpponentName(false)
  })
  socket?.on('OpponentFound', (data) => {
    setOpponentName(data.playerName)
    setPlayingAs(data.playingAs)
  })

  useEffect(() => {
    const winner = checkWinner();
    if (winner) {
      setFinishedState(winner);
    } else {

    }
  }, [gameState])

  if (!playOnline) {
    return <div onClick={onClickPlay} className='main-div'>
      <button className='play-online'>Play Online</button>
    </div>
  }

  if (playOnline && !opponentName) {
    return <div className='waiting'><p>Waiting for Opponent . . . </p></div>
  }

  return (
    <div className='main-div'>
      <div className='move-detection'>
        <div className={`left ${currentPlayer === playingAs ? "current-move-" + currentPlayer : ""}`}> {playerName}</div>
        <div className={`right ${currentPlayer !== playingAs ? "current-move-" + currentPlayer : ""}`}>{opponentName} </div>
      </div>
      <div>
        <h1 className='game-heading water-bg'>Tic Tac Toe</h1>
        <div className='square-wrapper'>
          {
            gameState.map((arr, rindex) =>
              arr.map((e, cindex) => {
                return <Square
                  socket={socket}
                  playingAs= {playingAs}
                  gameState={gameState}
                  finishedArrayState={finishedArrayState}
                  setFinishedState={setFinishedState}
                  finishedState={finishedState}
                  key={rindex * 3 + cindex}
                  id={rindex * 3 + cindex}
                  setGameState={setGameState}
                  currentPlayer={currentPlayer}
                  setCurrentPlayer={setCurrentPlayer}
                  currentElement ={e}
                />
              })
            )
          }
        </div>
      </div>
      {finishedState && finishedState !== 'draw' && <h3 className='finished-state'>{finishedState} won the game</h3>}
      {finishedState && finishedState === 'draw' && <h3 className='finished-state'>Its a Draw</h3>}
      {!finishedState && opponentName && <h2>You are playing against {opponentName}</h2>}
    </div>
  )
}

export default App