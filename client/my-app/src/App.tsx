import React, { useContext, useEffect, useState } from 'react';
import './App.css';
import LoginForm from './components/LoginForm';
import { Context } from './index';
import { observer } from 'mobx-react-lite';
import UserService from './services/UserServices';
import { IUser } from './models/IUser';

function App() {
  const {store} = useContext(Context);
  const [users, setUsers] = useState<IUser[]>([]);
  useEffect(()=>{
    if(localStorage.getItem('token')){
      store.checkAuth()
    }
  }, [])

  async function getUsers() {
    try {
      const response = await UserService.fetchUsers();
      setUsers(response.data);
    } catch (e) {
      console.log(e)
    }
  }

  if(!store.isAuth) {
    return (
      <div>
        <LoginForm/>
        <button onClick={getUsers}>Получить пользователей</button>
      </div>
    )
  }

  if(store.isLoading) {
    return (
      <div>Загрузка...</div>
    )
  }

  return (
    <div className="App">
      <h1>{store.isAuth ? `Пользователь авторизован ${store.user.email}` : 'Авторизуйтесь'}</h1>
      <h2>{store.user.isActivated ? `Вы успешно подтвердили почту` : `Пожалуйста, подтвердите почту`}</h2>
      <button onClick={() => store.logout()}>Выйти</button>
      <div>
        <button onClick={getUsers}>Получить пользователей</button>
      </div>
      {users.map(user =>
        <div key={user.email}>{user.email}</div>
        )}
    </div>
  );
}

export default observer(App);
