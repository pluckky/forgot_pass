import connection from "../config/connectDB.js";
import nodemailer from "nodemailer";
import { checkUserExists, validatePassword } from "../validation/loginValidation.js";

import bcrypt from "bcryptjs";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ojjivillamar4@gmail.com',
        pass: 'hzex bgcv ebku iqxd', 
    }
});

// verify config
transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP config error:", error);
    } else {
        console.log("Server ready to send email");
    }
});

// Login handler
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCheck = await checkUserExists(email);
        if (!userCheck.exists) return res.status(400).json({ message: userCheck.message });

        const user = userCheck.user;
        const passwordValid = await validatePassword(password, user.account_password);
        if (!passwordValid.exists) return res.status(400).json({ message: passwordValid.message });

        // Store session details
        req.session.email = user.email;
        req.session.name = user.name;
        req.session.accountType = user.accountType;

        res.status(200).json({
            accountType: user.accountType, // Send accountType to the frontend
        });
    } catch (error) {
        res.status(500).json({ message: "Login failed", error });
    }
};

// Check login credentials
export const checkLoginCredentials = async (req, res) => {
    console.log("Inside checkLoginCredentials handler");
    const { email, password } = req.body;
    try {
        const { exists, user, message } = await checkUserExists(email); // pass only email
        if (!exists) return res.status(404).json({ message });

        const { exists: validPassword, message: passwordMessage } = await validatePassword(password, user.account_password);
        if (!validPassword) return res.status(401).json({ message: passwordMessage });

        // Store session data
        req.session.email = user.email;
        req.session.accountType = user.accountType;
        req.session.name = user.name;

        return res.status(200).json({ message: "Login successful", accountType: user.accountType });
    } catch (error) {
        console.error("Error in checkLoginCredentials:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

// Logout handler
export const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send("Logout failed.");
        res.clearCookie("connect.sid");
        res.status(200).send("Logged out");
    });
};

// Personalized account handler
export const personalizedAccount = (req, res) => {
    if (!req.session.email) return res.status(401).send("Not logged in");

    const email = req.session.email;
    const sql = `
        SELECT first_name, last_name, student_id, 'student' AS account_type, school_email AS email
        FROM student_information WHERE school_email = ? 
        UNION 
        SELECT first_name, last_name, worker_id AS student_id, 'worker' AS account_type, email
        FROM worker_information WHERE email = ?
    `;
    connection.query(sql, [email, email], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ message: "Error retrieving user" });

        const user = results[0];
        const id = user.student_id;
        const vehicleQuery = user.account_type === "student"
            ? "SELECT vehicle_plate, vehicle_type FROM vehicle WHERE student_id = ?"
            : "SELECT vehicle_plate, vehicle_type FROM vehicle WHERE worker_id = ?";

        connection.query(vehicleQuery, [id], (vehErr, vehicles) => {
            if (vehErr) return res.status(500).json({ message: "Error fetching vehicles" });

            res.status(200).json({ ...user, vehicles });
        });
    });
};

// Forgot password handler
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    const conn = connection.promise(); // 

    // Generate a 5-digit OTP code
    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();

    try {
        // 
        await conn.query(
            'INSERT INTO password_reset (email, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE)) ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)',
            [email, otpCode]
        );
        
        console.log('OTP inserted successfully into the database');

        // Send OTP email
        await transporter.sendMail({
            from: 'ojjivillamar4@gmail.com',
            to: email,
            subject: "Your Password Reset Code",
            text: `Your password reset code is: ${otpCode}. It expires in 10 minutes.`,
        });

        try {
            console.log('Email sent successfully');
            return res.status(200).json({ message: "Reset code sent to email." });
        } catch (error) {
            console.error("Error sending email:", error);
            return res.status(500).json({ message: "Error sending email.", error });
        }

    } catch (error) {
        console.error("Error in forgotPassword:", error);
        return res.status(500).json({ message: "Server error.", error });
    }
};

export const resetPassword = async (req, res) => {
    const { otp, newPassword } = req.body;

    try {
        // Check if OTP exists and is not expired
        const [rows] = await connection.promise().query(
            'SELECT * FROM password_reset WHERE otp_code = ? AND expires_at > NOW()',
            [otp]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Find user associated with the email in the password_reset table
        const email = rows[0].email;

        //encrypted paswword
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in the user's table (assuming user_information table)
        await connection.promise().query(
            'UPDATE user_information SET account_password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        // Remove the OTP after successful password reset
        await connection.promise().query(
            'DELETE FROM password_reset WHERE otp_code = ?',
            [otp]
        );

        return res.status(200).json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        console.error('Error resetting password:', error);
        return res.status(500).json({ message: 'Error resetting password', error });
    }
};

export const verifyCode = async (req, res) => {
    const { email, code } = req.body;

    try {
        const [rows] = await connection.promise().query(
            'SELECT * FROM password_reset WHERE email = ? AND otp_code = ? AND expires_at > NOW()',
            [email, code]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired code' });
        }

        return res.status(200).json({ message: 'Code verified' });
    } catch (error) {
        console.error('Error verifying code:', error);
        return res.status(500).json({ message: 'Server error during verification', error });
    }
};
