import connection from "../config/connectDB.js";
import nodemailer from "nodemailer";
import { checkUserExists, validatePassword } from "../validation/loginValidation.js";
import multer from "multer";
import bcrypt from "bcryptjs";

// Setup Nodemailer (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ojjivillamar4@gmail.com',
    pass: 'hzex bgcv ebku iqxd',
  }
});

transporter.verify((err) => {
  if (err) console.error("SMTP config error:", err);
  else console.log("Server ready to send email");
});

// Login (Latest working version using session.userId)
export const checkLoginCredentials = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { exists, user, message } = await checkUserExists(email);
    if (!exists) return res.status(404).json({ message });

    const { exists: validPassword, message: passwordMessage } = await validatePassword(password, user.account_password);
    if (!validPassword) return res.status(401).json({ message: passwordMessage });

    req.session.email = user.email;
    req.session.accountType = user.accountType;
    req.session.name = user.name;
    req.session.userId = user.id;

    return res.status(200).json({ message: "Login successful", accountType: user.accountType });
  } catch (error) {
    console.error("Error in checkLoginCredentials:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

// Logout
export const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Logout failed.");
    res.clearCookie("connect.sid");
    res.status(200).send("Logged out");
  });
};

// Get Personalized Account Info (Session-based)
export const personalizedAccount = (req, res) => {
  if (!req.session.email) {
    console.log("No session email!");
    return res.status(401).send("Not logged in");
  }

  const email = req.session.email;
  console.log("Fetching account info for:", email);

  const sql = `
    SELECT user_id AS id, first_name, last_name, email, account_type
    FROM user_information WHERE email = ?
    UNION
    SELECT admin_id AS id, first_name, last_name, admin_code AS email, 'admin' AS account_type
    FROM admin_information WHERE admin_code = ?
  `;

  connection.query(sql, [email, email], (err, userResults) => {
    if (err) {
      console.error("Error fetching user info:", err);
      return res.status(500).json({ message: "Internal server error", err });
    }

    if (userResults.length === 0) {
      console.warn("User not found in user or admin tables.");
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResults[0];
    const id = user.id;
    const accountType = user.account_type;

    if (accountType !== 'admin') {
      const vehicleQuery = `SELECT vehicle_plate, vehicle_type FROM vehicle WHERE user_id = ?`;
      connection.query(vehicleQuery, [id], (err, vehicles) => {
        if (err) return res.status(500).json({ message: "Vehicle fetch failed", err });

        const picQuery = "SELECT prof_pic FROM profile_pic WHERE email = ?";
        connection.query(picQuery, [email], (err, picResult) => {
          if (err) return res.status(500).json({ message: "Profile picture fetch failed", err });

          let profileImageBase64 = "/default-avatar.png";
          if (picResult.length > 0 && picResult[0].prof_pic) {
            profileImageBase64 = `data:image/jpeg;base64,${picResult[0].prof_pic.toString("base64")}`;
          }

          return res.status(200).json({
            ...user,
            vehicles,
            profile_image: profileImageBase64
          });
        });
      });
    } else {
      const picQuery = "SELECT prof_pic FROM profile_pic WHERE email = ?";
      connection.query(picQuery, [email], (err, picResult) => {
        if (err) return res.status(500).json({ message: "Profile picture fetch failed", err });

        let profileImageBase64 = "/default-avatar.png";
        if (picResult.length > 0 && picResult[0].prof_pic) {
          profileImageBase64 = `data:image/jpeg;base64,${picResult[0].prof_pic.toString("base64")}`;
        }

        return res.status(200).json({
          ...user,
          vehicles: [],
          profile_image: profileImageBase64
        });
      });
    }
  });
};

// update the profile
export const updateProfile = (req, res) => {
  const { email, first_name, last_name, vehicles } = req.body;
  const imageBuffer = req.file ? req.file.buffer : null;

  if (!email || !first_name || !last_name) {
    return res.status(400).json({ message: "Missing required fields: email, first_name, or last_name" });
  }

  // Step 1: Update name fields
  const updateUserSQL = `
    UPDATE user_information
    SET first_name = ?, last_name = ?
    WHERE email = ?
  `;

  connection.query(updateUserSQL, [first_name, last_name, email], (err) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ message: "User update failed", err });
    }

    // Helper to finalize update with optional image upload
    const finishUpdate = () => {
      if (!imageBuffer) {
        return res.status(200).json({ success: true, message: "Profile updated without image." });
      }

      const checkImageSQL = `SELECT * FROM profile_pic WHERE email = ?`;
      connection.query(checkImageSQL, [email], (err, results) => {
        if (err) {
          console.error("Error checking image record:", err);
          return res.status(500).json({ message: "Image check failed", err });
        }

        const imageQuery = results.length > 0
          ? `UPDATE profile_pic SET prof_pic = ? WHERE email = ?`
          : `INSERT INTO profile_pic (prof_pic, email) VALUES (?, ?)`;

        const imageParams = [imageBuffer, email];

        connection.query(imageQuery, imageParams, (err) => {
          if (err) {
            console.error("Error saving image:", err);
            return res.status(500).json({ message: "Image save failed", err });
          }

          return res.status(200).json({ success: true, message: "Profile updated with image." });
        });
      });
    };

    // Step 2: If no vehicles array provided
    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return finishUpdate();
    }

    // Step 3: Get user_id and role identifiers
    const getRoleSQL = `
      SELECT ui.user_id, si.student_id, wi.worker_id
      FROM user_information ui
      LEFT JOIN student_information si ON ui.user_id = si.user_id
      LEFT JOIN worker_information wi ON ui.user_id = wi.user_id
      WHERE ui.email = ?
    `;

    connection.query(getRoleSQL, [email], (err, results) => {
      if (err || results.length === 0) {
        console.error("Error determining user role:", err);
        return res.status(500).json({ message: "User role fetch failed", err });
      }

      const { user_id, student_id, worker_id } = results[0];

      // Step 4: Delete previous vehicles
      const deleteVehiclesSQL = `DELETE FROM vehicle WHERE user_id = ?`;
      connection.query(deleteVehiclesSQL, [user_id], (err) => {
        if (err) {
          console.error("Error deleting vehicles:", err);
          return res.status(500).json({ message: "Failed to delete old vehicles", err });
        }

        // Step 5: Insert new vehicles
        const vehicleValues = vehicles.map(v => [
          v.vehicle_plate,
          student_id || null,
          worker_id || null,
          v.vehicle_type,
          user_id
        ]);

        const insertVehicleSQL = `
          INSERT INTO vehicle (vehicle_plate, student_id, worker_id, vehicle_type, user_id)
          VALUES ?
        `;

        connection.query(insertVehicleSQL, [vehicleValues], (err) => {
          if (err) {
            console.error("Error inserting vehicles:", err.sqlMessage || err);
            return res.status(500).json({ message: "Vehicle insert failed", err });
          }

          finishUpdate();
        });
      });
    });
  });
};


// Forgot Password (Send OTP via Email)
export const forgotPassword = (req, res) => {
  const { email } = req.body;
  const otpCode = Math.floor(10000 + Math.random() * 90000).toString();

  const sql = `
    INSERT INTO password_reset (email, otp_code, expires_at)
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
  `;

  connection.query(sql, [email, otpCode], (err) => {
    if (err) {
      console.error("Error saving OTP:", err);
      return res.status(500).json({ message: "Server error.", err });
    }

    transporter.sendMail({
      from: 'ojjivillamar4@gmail.com',
      to: email,
      subject: "Your Password Reset Code",
      text: `Your password reset code is: ${otpCode}. It expires in 10 minutes.`,
    }, (err) => {
      if (err) {
        console.error("Email send error:", err);
        return res.status(500).json({ message: "Failed to send email", err });
      }

      return res.status(200).json({ message: "Reset code sent to email." });
    });
  });
};

// Verify OTP Code
export const verifyCode = (req, res) => {
  const { email, code } = req.body;

  const sql = 'SELECT * FROM password_reset WHERE email = ? AND otp_code = ? AND expires_at > NOW()';
  connection.query(sql, [email, code], (err, rows) => {
    if (err) {
      console.error('Error verifying code:', err);
      return res.status(500).json({ message: 'Server error during verification', err });
    }

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    return res.status(200).json({ message: 'Code verified' });
  });
};

// Reset Password using OTP
export const resetPassword = (req, res) => {
  const { otp, newPassword } = req.body;

  const fetchSQL = 'SELECT * FROM password_reset WHERE otp_code = ? AND expires_at > NOW()';
  connection.query(fetchSQL, [otp], async (err, rows) => {
    if (err) return res.status(500).json({ message: "Fetch failed", err });

    if (rows.length === 0) return res.status(400).json({ message: "Invalid or expired OTP" });

    const email = rows[0].email;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateSQL = 'UPDATE user_information SET account_password = ? WHERE email = ?';
    connection.query(updateSQL, [hashedPassword, email], (err) => {
      if (err) return res.status(500).json({ message: "Password update failed", err });

      connection.query('DELETE FROM password_reset WHERE otp_code = ?', [otp], (err) => {
        if (err) return res.status(500).json({ message: "Cleanup failed", err });

        return res.status(200).json({ success: true, message: 'Password reset successfully' });
      });
    });
  });
};

// Multer setup (Memory storage)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Upload Profile Picture (using session email)
export const uploadFile = async (req, res) => {
  const email = req.session.email;
  const file = req.file;

  if (!file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const sql = `
      INSERT INTO profile_pic (email, prof_pic) VALUES (?, ?)
      ON DUPLICATE KEY UPDATE prof_pic = ?
    `;
    const values = [email, file.buffer, file.buffer];
    await connection.promise().query(sql, values);

    res.status(200).json({ message: "Profile picture uploaded and saved successfully" });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "File upload failed", error });
  }
};

// Get Profile Picture (using session email)
export const getProfilePic = (req, res) => {
  if (!req.session.email) {
    return res.status(401).json({ message: "Unauthorized. No session email." });
  }

  const sql = "SELECT prof_pic FROM profile_pic WHERE email = ?";
  connection.query(sql, [req.session.email], (err, results) => {
    if (err) {
      console.error("Error fetching profile pic:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0 || !results[0].prof_pic) {
      return res.status(404).json({ message: "Profile picture not found." });
    }

    res.setHeader("Content-Type", "image/jpeg");
    res.send(results[0].prof_pic);
  });
};
