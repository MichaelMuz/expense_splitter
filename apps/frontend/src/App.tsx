import { useState } from 'react'
import './App.css'
import RegisterPage from './pages/RegisterPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import LoginSuccessPage from './pages/LoginSuccessPage'
import IndexPage from './pages/IndexPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/success" element={<LoginSuccessPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
