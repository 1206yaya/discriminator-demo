import React, { useState, useEffect } from 'react'
import { 
  ExampleApi, 
  UserApi, 
  Configuration, 
  User, 
  ProfileField, 
  TextProfileField, 
  NumberProfileField, 
  GenderProfileField,
  TextProfileFieldFieldTypeEnum,
  NumberProfileFieldFieldTypeEnum,
  GenderProfileFieldFieldTypeEnum,
  GenderProfileFieldValueEnum,
  CreateUserRequest
} from './adapters/gen'

// 基本はfieldTypeをそのまま参照して分岐する型ガード関数
const isTextProfileField = (field: ProfileField): field is TextProfileField => {
  return field.fieldType === TextProfileFieldFieldTypeEnum.Text
}

const isNumberProfileField = (field: ProfileField): field is NumberProfileField => {
  return field.fieldType === NumberProfileFieldFieldTypeEnum.Number
}

const isGenderProfileField = (field: ProfileField): field is GenderProfileField => {
  return field.fieldType === GenderProfileFieldFieldTypeEnum.Gender
}

// ProfileFieldの構造を検証する関数
const isValidProfileField = (field: ProfileField): boolean => {
  // 基本的な構造チェック
  if (!field || typeof field !== 'object' || !field.fieldType || !field.name) {
    return false
  }
  
  // fieldTypeの値で分岐
  switch (field.fieldType) {
    case TextProfileFieldFieldTypeEnum.Text:
      return typeof field.value === 'string'
    case NumberProfileFieldFieldTypeEnum.Number:
      return typeof field.value === 'number' && !isNaN(field.value)
    case GenderProfileFieldFieldTypeEnum.Gender:
      return field.value === GenderProfileFieldValueEnum.Male || 
             field.value === GenderProfileFieldValueEnum.Female
    default:
      return false
  }
}

const userApi = new UserApi(new Configuration({
  basePath: 'http://localhost:3000/api'
}))

const exampleApi = new ExampleApi(new Configuration({
  basePath: 'http://localhost:3000/api'
}))

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '',
    profileFields: [] as ProfileField[]
  })
  const [hello, setHello] = useState<string>('')
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')
  const [newFieldGender, setNewFieldGender] = useState<GenderProfileFieldValueEnum>(GenderProfileFieldValueEnum.Male)
  const [newFieldType, setNewFieldType] = useState<TextProfileFieldFieldTypeEnum | NumberProfileFieldFieldTypeEnum | GenderProfileFieldFieldTypeEnum>(TextProfileFieldFieldTypeEnum.Text)

// プロフィールフィールドコンポーネントのプロパティ
interface ProfileFieldProps {
  field: ProfileField
  index: number
}

// プロフィールフィールド表示コンポーネント
const ProfileFieldDisplay: React.FC<ProfileFieldProps> = ({ field, index }) => {
  return (
    <div className="profile-field-container">
      <h4>プロフィール項目</h4>
      <p>フィールドタイプ: {field.fieldType}</p>
      
      {/* 基本はfieldTypeをそのまま参照して分岐 */}
      {isTextProfileField(field) && (
        <TextProfileFieldContent field={field} index={index} />
      )}
      
      {isNumberProfileField(field) && (
        <NumberProfileFieldContent field={field} index={index} />
      )}
      
      {isGenderProfileField(field) && (
        <GenderProfileFieldContent field={field} index={index} />
      )}

      {/* 構造の妥当性チェック */}
      {!isValidProfileField(field) && (
        <div style={{ color: 'red', fontSize: '12px' }}>
          注意: このフィールドのデータが不正です
        </div>
      )}
    </div>
  )
}

  // Helper function to render profile fields using discriminator
  const renderProfileField = (field: ProfileField, index: number) => {
    return <ProfileFieldDisplay field={field} index={index} />
  }

const TextProfileFieldContent: React.FC<{
  field: TextProfileField
  index: number
}> = ({ field, index }) => {
  return (
    <div key={index} style={{ marginBottom: '5px', padding: '5px', backgroundColor: '#f0f8ff', borderRadius: '3px' }}>
      <strong>{field.name}:</strong> {field.value} <em>(テキスト)</em>
    </div>
  )
}

const NumberProfileFieldContent: React.FC<{
  field: NumberProfileField
  index: number
}> = ({ field, index }) => {
  return (
    <div key={index} style={{ marginBottom: '5px', padding: '5px', backgroundColor: '#fff8f0', borderRadius: '3px' }}>
      <strong>{field.name}:</strong> {field.value} <em>(数値)</em>
    </div>
  )
}

const GenderProfileFieldContent: React.FC<{
  field: GenderProfileField
  index: number
}> = ({ field, index }) => {
  const genderText = field.value === GenderProfileFieldValueEnum.Male ? '男性' : '女性'
  return (
    <div key={index} style={{ marginBottom: '5px', padding: '5px', backgroundColor: '#f8f0ff', borderRadius: '3px' }}>
      <strong>{field.name}:</strong> {genderText} <em>(性別)</em>
    </div>
  )
}

  const addProfileField = () => {
    if (!newFieldName) {
      setError('フィールド名を入力してください')
      return
    }

    if (newFieldType !== GenderProfileFieldFieldTypeEnum.Gender && !newFieldValue) {
      setError('値を入力してください')
      return
    }

    let newField: ProfileField
    
    // 基本的なfieldTypeでの分岐パターン
    if (newFieldType === TextProfileFieldFieldTypeEnum.Text) {
      newField = {
        fieldType: TextProfileFieldFieldTypeEnum.Text,
        name: newFieldName,
        value: newFieldValue
      } as TextProfileField
    } else if (newFieldType === NumberProfileFieldFieldTypeEnum.Number) {
      const numValue = parseFloat(newFieldValue)
      if (isNaN(numValue)) {
        setError('数値フィールドには有効な数値を入力してください')
        return
      }
      newField = {
        fieldType: NumberProfileFieldFieldTypeEnum.Number,
        name: newFieldName,
        value: numValue
      } as NumberProfileField
    } else { // gender
      newField = {
        fieldType: GenderProfileFieldFieldTypeEnum.Gender,
        name: newFieldName,
        value: newFieldGender
      } as GenderProfileField
    }

    // 作成したフィールドの検証
    if (isValidProfileField(newField)) {
      setNewUser({
        ...newUser,
        profileFields: [...newUser.profileFields, newField]
      })
      setNewFieldName('')
      setNewFieldValue('')
      setNewFieldGender(GenderProfileFieldValueEnum.Male)
      setError(null)
    } else {
      setError('作成されたフィールドが無効です')
    }
  }

  const removeProfileField = (index: number) => {
    const updatedFields = newUser.profileFields.filter((_, i) => i !== index)
    setNewUser({ ...newUser, profileFields: updatedFields })
  }

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching users...')
      const response = await userApi.getUsers()
      console.log('Users fetched successfully:', response.data)
      setUsers(response.data)
    } catch (err: any) {
      console.error('Fetch users error:', err)
      console.error('Error response:', err.response?.data)
      setError(`ユーザーの取得に失敗しました: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchHello = async () => {
    try {
      console.log('Fetching hello message...')
      const response = await exampleApi.getHello()
      console.log('Hello fetched successfully:', response.data)
      setHello(response.data.message)
    } catch (err: any) {
      console.error('Hello API error:', err)
      console.error('Error response:', err.response?.data)
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
      const userData: CreateUserRequest = {
        name: newUser.name,
        email: newUser.email,
        profileFields: newUser.profileFields.length > 0 ? newUser.profileFields : undefined
      }
      console.log('Creating user with data:', JSON.stringify(userData, null, 2))
      const response = await userApi.createUser(userData)
      console.log('User created successfully:', response.data)
      setNewUser({ name: '', email: '', profileFields: [] })
      await fetchUsers() // ユーザーリストを更新
    } catch (err: any) {
      console.error('User creation error:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      setError(`ユーザーの作成に失敗しました: ${err.response?.data?.message || err.message}`)
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
        </div>

        {/* Profile Fields Section */}
        <div style={{ marginBottom: '15px' }}>
          <h3>プロフィール項目</h3>
          <div style={{ display: 'flex', marginBottom: '10px', alignItems: 'center' }}>
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value as TextProfileFieldFieldTypeEnum | NumberProfileFieldFieldTypeEnum | GenderProfileFieldFieldTypeEnum)}
              style={{ marginRight: '10px', padding: '5px' }}
            >
              <option value={TextProfileFieldFieldTypeEnum.Text}>テキスト</option>
              <option value={NumberProfileFieldFieldTypeEnum.Number}>数値</option>
              <option value={GenderProfileFieldFieldTypeEnum.Gender}>性別</option>
            </select>
            <input
              type="text"
              placeholder="フィールド名"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              style={{ marginRight: '10px', padding: '5px' }}
            />
            {newFieldType === GenderProfileFieldFieldTypeEnum.Gender ? (
              <select
                value={newFieldGender}
                onChange={(e) => setNewFieldGender(e.target.value as GenderProfileFieldValueEnum)}
                style={{ marginRight: '10px', padding: '5px' }}
              >
                <option value={GenderProfileFieldValueEnum.Male}>男性</option>
                <option value={GenderProfileFieldValueEnum.Female}>女性</option>
              </select>
            ) : (
              <input
                type={newFieldType === NumberProfileFieldFieldTypeEnum.Number ? 'number' : 'text'}
                placeholder="値"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                style={{ marginRight: '10px', padding: '5px' }}
              />
            )}
            <button
              onClick={addProfileField}
              style={{ padding: '5px 10px' }}
            >
              追加
            </button>
          </div>

          {/* Display current profile fields */}
          {newUser.profileFields.length > 0 && (
            <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
              <h4>現在のプロフィール項目:</h4>
              {newUser.profileFields.map((field, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', padding: '5px', backgroundColor: '#f8f8f8', borderRadius: '3px' }}>
                  <span>{renderProfileField(field, index)}</span>
                  <button
                    onClick={() => removeProfileField(index)}
                    style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={createUser} 
          disabled={loading}
          style={{ padding: '5px 10px' }}
        >
          ユーザーを作成
        </button>
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
                {user.profileFields && user.profileFields.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <hr style={{ border: '1px solid #ddd' }} />
                    {user.profileFields.map((field, index) => renderProfileField(field, index))}
                  </div>
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
