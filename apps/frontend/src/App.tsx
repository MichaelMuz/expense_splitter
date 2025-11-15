import './App.css'
import RegisterPage from './pages/RegisterPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import LoginSuccessPage from './pages/LoginSuccessPage'
import IndexPage from './pages/IndexPage'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import CreateGroupPage from './pages/CreateGroupPage'
import ViewGroupPage from './pages/ViewGroupPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/success" element={<LoginSuccessPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create_group" element={<CreateGroupPage />} />
        <Route path="/view_group/:id" element={<ViewGroupPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
