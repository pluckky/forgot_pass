import express from "express";
import * as signupControllers from "../controllers/signupControllers.js";
import * as parkingControllers from "../controllers/parkingControllers.js";
import * as otherAdminControllers from "../controllers/otherAdminControllers.js";
import * as loginControllers from "../controllers/loginControllers.js";

let router = express.Router();

let initWebRoutes = (app) => {
    console.log("Initializing Web Routes...");
    // API Calls
    
    // Sign Up
    router.post("/signup", signupControllers.signupPost);

    // Login
    router.post("/login", loginControllers.checkLoginCredentials);

    // User-specific Route (Personalized account details)
    router.get("/user", loginControllers.personalizedAccount);

    // Logout
    router.post("/logout", loginControllers.logout);

    // Forgot Password Routes
    router.post("/forgot-password", loginControllers.forgotPassword);
    router.post("/verify-code", loginControllers.verifyCode);

    router.post("/reset-password", loginControllers.resetPassword);

    // Parking User Routes
    router.get("/parkingZones", parkingControllers.parkingZones); // Get all parking zones
    router.get("/parkingZone/:zone", parkingControllers.parkingZone); // Get parking zone data

    // Parking Admin Routes
    router.get("/parkingOverviewAdmin/:selectedZone", parkingControllers.parkingOverviewAdmin); // Admin view of a parking zone
    router.post("/adminViewZone/parkVehicle", parkingControllers.parkVehicle); // Park vehicle
    router.delete("/adminViewZone/vacatingParkingSpace/:vehiclePlate", parkingControllers.vacatingParkingSpace); // Vacate parking space

    // Account Admin Routes
    router.get("/accountRecord", otherAdminControllers.accountRecord); // Get account records
    router.get("/adminHistory", otherAdminControllers.adminParkingHistory); // Get admin parking history

    // Catch-all for undefined routes
    router.use((req, res, next) => {
        res.status(404).json({ message: "Route not found" });
    });

    return app.use("/", router);
};

export default initWebRoutes;
