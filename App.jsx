import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { MainPage } from "./pages/MainPage";
import { AdminPage } from "./pages/AdminPage";
import { UserPage } from "./pages/UserPage";
import { WorkerPage } from "./pages/WorkerPage";
import { ParkingZones } from "./components/ParkingZones";
import { ParkingPlace } from "./pages/ParkingPlace";
import { AdminAccounts } from "./pages/AdminAccounts";
import { AdminParking } from "./pages/AdminParking";
import { AdminHistory } from "./pages/AdminHistory";
import { AdminProfile } from "./pages/AdminProfile";
import { AdminParkingOverview } from "./pages/AdminParkingOverview";
import  UserProfile  from "./components/UserProfile";


import { LoginButton } from "./components/LoginButton";
import LoginPop from "./components/LoginPop";
import ForgotPassword from "./components/ForgotPassword";

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleLoginClick = () => {
    setIsLoginOpen(true);
  };

  return (
    <>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MainPage />} />
            <Route path="/userprofile" element={<UserProfile />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/adminAccounts" element={<AdminAccounts />} />
            <Route path="/adminParking" element={<AdminParking />} />
            <Route path="/adminParkingOverview" element={<AdminParkingOverview />} />
            <Route path="/adminProfile" element={<AdminProfile />} />
            <Route path="/adminHistory" element={<AdminHistory />} /> 
            <Route path="/user" element={<UserPage />} />
            <Route path="/worker" element={<WorkerPage />} />
            <Route path="/parkingZones" element={<ParkingZones />} />
            <Route path="/parkingZone/:zone" element={<ParkingPlace />} />
            <Route path= "/forgot-password"element = {<ForgotPassword/>}/>
          </Route>
        </Routes>

        {/* Display the login modal when the button is clicked */}
        <LoginButton onLoginClick={handleLoginClick} />

        {isLoginOpen && <LoginPop setIsLoginOpen={setIsLoginOpen} />}
      </Router>
    </>
  );
}

export default App;
