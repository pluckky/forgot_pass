import React, { useState } from "react";
import "../css/ForgotPassword.css";
import BackArrowIcon from "./BackArrowIcon";

const ForgotPassword = ({ goBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleCodeChange = (value, index) => {
    const updatedCode = [...code];
    updatedCode[index] = value;
    setCode(updatedCode);
  };

  const handleEmailSubmit = async () => {
    try {
      const response = await fetch("http://localhost:8080/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("A reset code was sent to your email.");
        setStep(2);
      } else {
        alert(data.message || "Failed to send reset email.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while sending reset email.");
    }
  };

  const handleVerifyCode = async () => {
    const enteredCode = code.join("");

    if (enteredCode.length !== 5) {
      alert("Please enter the full 5-digit code.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: enteredCode }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Code verified. You can now set a new password.");
        setStep(3);
      } else {
        alert(data.message || "Invalid or expired code.");
      }
    } catch (err) {
      console.error(err);
      alert("Error verifying code.");
    }
  };

  const handlePasswordSubmit = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp: code.join(""),
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Password successfully reset.");
        goBackToLogin();
      } else {
        alert(data.message || "Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while resetting password.");
    }
  };

  return (
    <div className="forgot-password-flow">
      {step === 1 && (
        <div className="step-box">
          <button onClick={goBackToLogin}>
            <BackArrowIcon />
          </button>
          <h2>Forgot Password</h2>
          <p>Please enter your email to reset</p>
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={handleEmailSubmit}>Send Reset Code</button>
        </div>
      )}

      {step === 2 && (
        <div className="step-box">
          <button onClick={() => setStep(1)}>
            <BackArrowIcon />
          </button>
          <h2>Check your email</h2>
          <p>
            Enter the 5-digit code sent to <strong>{email}</strong>
          </p>
          <div className="code-inputs">
            {code.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleCodeChange(e.target.value, i)}
              />
            ))}
          </div>
          <button onClick={handleVerifyCode}>Verify Code</button>
        </div>
      )}

      {step === 3 && (
        <div className="step-box">
          <button onClick={() => setStep(2)}>
            <BackArrowIcon />
          </button>
          <h2>Set a new password</h2>
          <p>Create a new password different from previous ones</p>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button onClick={handlePasswordSubmit}>Update Password</button>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
