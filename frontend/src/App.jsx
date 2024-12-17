import { useState } from 'react'
import axios from 'axios'

function App() {
  const [id, setId] = useState('')
  const [response, setResponse] = useState(null)

  const fetchGroupInfo = async () => {
    try {
      // Send POST request to localhost:3000/groups
      const result = await axios.post('http://localhost:3000/groups', 
        { idKey: id },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
      
      // Set the response state
      setResponse(result.data)
    } catch (error) {
      console.error('Error fetching group info:', error)
      setResponse({ error: 'Failed to fetch group info' })
    }
  }

  return (
    <div>
      <input 
        type="text"
        placeholder="Enter ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <button onClick={fetchGroupInfo}>Fetch Group Info</button>
      {response && (
        <pre>{JSON.stringify(response, null, 2)}</pre>
      )}
    </div>
  )
}

export default App
