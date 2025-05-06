import express from "express";
import cors from "cors";
import session from "express-session"; //

import initWebRoutes from "./routes/web.js";
import { parkVehicle } from "./controllers/parkingControllers.js";

const app = express();

// CORS configuration to allow requests from frontend (localhost:5173)
const corsOptions = {
  origin: "http://localhost:5173", // Frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, 
};

// Use CORS middleware
app.use(cors(corsOptions));


app.use(
  session({
    secret: "your-secret-key", 
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, 
      maxAge: 24 * 60 * 60 * 1000, 
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/api/session", (req, res) => {
  if (req.session && req.session.accountType) {
    return res.json({
      email: req.session.email,
      accountType: req.session.accountType,
      name: req.session.name,
      parkVehicle: req.session.vehicle
    });
  } else {
    return res.status(401).json({ message: "User not logged in" });
  }
});



initWebRoutes(app);

let port = process.env.PORT || 4040;
app.listen(port, () => {
  console.log(`App is running at port ${port}`);
});
