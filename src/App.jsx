import "./App.css";
import Header from "./componenti/Header.jsx";
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Security from "./pages/security/security";
import AddArticles from "./pages/add-articles/add-articles";
import Login from "./pages/auth/login";
import Signup from "./pages/signup/signup2";
import Dashboard from "./pages/dashboard/dashboard";
import Home from "./pages/home/Home.jsx";
import { TermsOfService } from "./pages/policy/terms-of-service.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/security" element={<Security />} />
        <Route path="/add-articles" element={<AddArticles />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
      </Routes>
    </Router>
  );
}

export default App;
