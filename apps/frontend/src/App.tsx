import { useState } from 'react'
import './App.css'

function App() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [response, setResponse] = useState('')

  async function handleLogin() {
    console.log('Submitted', { name, email })

    try {
      const result = await fetch('https://api.restful-api.dev/objects')
      const data = await result.json()

      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse("Error")
    }
  }

  return (
    <>
      <div>
        <h2> Login </h2>
        <label> Name: </label>
        <input type="text" value={name} onChange={n => setName(n.target.value)} />
        <br></br>
        <label> Email: </label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <br></br>
        <button onClick={handleLogin}> Submit </button>
      </div>
      <h2> {response} </h2>
    </>
  )
}

export default App
