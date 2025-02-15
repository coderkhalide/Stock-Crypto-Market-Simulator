import { useState } from 'react'
import './App.css'
import MarketSimulator from './MarketSimulator'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='flex flex-col items-center justify-center py-10'>
      <MarketSimulator />
    </div>
  )
}

export default App
