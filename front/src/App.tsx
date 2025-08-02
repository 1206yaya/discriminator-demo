import { useState, useEffect } from 'react'
import { ExampleApi, UserApi, Configuration, User } from './adapters/gen'

const userApi = new UserApi(new Configuration({
  basePath: 'http://localhost:3000'
}))

const exampleApi = new ExampleApi(new Configuration({
  basePath: 'http://localhost:3000'
}))

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({ name: '', email: '' })
  const [hello, setHello] = useState<string>('')

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await userApi.getUsers()
      setUsers(response.data)
    } catch (err) {
      setError('ユーザーの取得に失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHello = async () => {
    try {
      const response = await exampleApi.getHello()
      setHello(response.data.message)
    } catch (err) {
      console.error('Hello API error:', err)
    }
  }

  const createUser = async () => {
    if (!newUser.name || !newUser.email) {
      setError('名前とメールアドレスを入力してください')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await userApi.createUser(newUser)
      setNewUser({ name: '', email: '' })
      await fetchUsers() // ユーザーリストを更新
    } catch (err) {
      setError('ユーザーの作成に失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await userApi.deleteUser(id)
      await fetchUsers() // ユーザーリストを更新
    } catch (err) {
      setError('ユーザーの削除に失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHello()
    fetchUsers()
  }, [])

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>OpenAPI Golang TypeScript Demo</h1>
      
      {hello && (
        <div style={{ backgroundColor: '#e7f3ff', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
          <strong>{hello}</strong>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: '#ffe7e7', padding: '10px', borderRadius: '5px', marginBottom: '20px', color: 'red' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h2>新しいユーザーを作成</h2>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="名前"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <input
            type="email"
            placeholder="メールアドレス"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <button 
            onClick={createUser} 
            disabled={loading}
            style={{ padding: '5px 10px' }}
          >
            作成
          </button>
        </div>
      </div>

      <div>
        <h2>ユーザー一覧</h2>
        <button 
          onClick={fetchUsers} 
          disabled={loading}
          style={{ marginBottom: '10px', padding: '5px 10px' }}
        >
          {loading ? '読み込み中...' : '更新'}
        </button>
        
        {users.length === 0 ? (
          <p>ユーザーがいません</p>
        ) : (
          <div>
            {users.map((user) => (
              <div 
                key={user.id} 
                style={{ 
                  border: '1px solid #ddd', 
                  padding: '10px', 
                  marginBottom: '10px', 
                  borderRadius: '5px' 
                }}
              >
                <h3>{user.name}</h3>
                <p>Email: {user.email}</p>
                <p>ID: {user.id}</p>
                {user.createdAt && (
                  <p>作成日: {new Date(user.createdAt).toLocaleString()}</p>
                )}
                <button 
                  onClick={() => deleteUser(user.id)}
                  disabled={loading}
                  style={{ 
                    backgroundColor: '#ff4444', 
                    color: 'white', 
                    border: 'none', 
                    padding: '5px 10px', 
                    borderRadius: '3px' 
                  }}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
