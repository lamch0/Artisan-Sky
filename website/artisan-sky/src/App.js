//import logo from './logo.svg';
import React from 'react';
import './App.css';

import { BrowserRouter as Router, Routes, Route, Link }
  from 'react-router-dom';

import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import ManageAccount from './pages/manage/account';
import ManageAdmin from './pages/manage/admin';

function App() {
  return (
    <body>
      <Router>
        <div class="row">
          <nav class="col-sm-4 d-flex flex-column flex-shrink-0 p-3 text-white bg-dark">
            <a>
              <Link to="/home" class="nav"> Home </Link>
            </a>
            <br />
            <a>
              <Link to="/login" class="nav"> Login </Link>
            </a>
            <br />
            <a>
              <Link to="/register" class="nav"> Register </Link>
            </a>
            <br />
            <a>
              <Link to="/manage/account" class="nav"> Manage Account </Link>
            </a>
            <br />
            <a>
              <Link to="/manage/admin" class="nav"> Manage Admin </Link>
            </a>
          </nav>

          <Routes>
            <Route path = '/home' element = {<Home />} />
            <Route path = '/login' element = {<Login />} />
            <Route path = '/register' element = {<Register />} />
            <Route path = '/manage/account' element = {<ManageAccount />} />
            <Route path = '/manage/admin' element = {<ManageAdmin />} />
          </Routes>
        </div>
      </Router>
    </body>
  );
}

export default App;
