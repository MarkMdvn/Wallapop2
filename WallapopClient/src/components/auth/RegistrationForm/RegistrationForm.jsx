import React, { useState } from "react";
import { registerUser } from "../../../api/authService";
import "./RegistrationForm.css";

function RegistrationForm({ changeForm }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [registrationError, setRegistrationError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!agreeToTerms) {
      alert("You must agree to the terms and conditions to register.");
      return;
    }

    const registrationData = {
      name,
      email,
      password,
      agreeToTerms,
    };

    try {
      const response = await registerUser(registrationData);
      console.log("Registration successful", response);
      alert("Registration successful. You can now log in!");
      changeForm();
    } catch (error) {
      console.error("Registration failed:", error.message);
      setRegistrationError(error.message || "Failed to register.");
    }
  };

  return (
    <div className="registration-form-container">
      <form onSubmit={handleSubmit} className="registration-form">
        <h2>Join Wallapop</h2>
        {registrationError && (
          <p className="error-message">{registrationError}</p>
        )}
        <div className="registration-input-container">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="input-field"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="input-field"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-field"
            required
          />
        </div>
        <div className="registration-checkboxes">
          <label>
            <input
              id="terms-checkbox"
              type="checkbox"
              checked={agreeToTerms}
              onChange={() => setAgreeToTerms(!agreeToTerms)}
            />
            <span className="checkbox-span-terms" id="checkbox-span">
              I have read and agree to the{" "}
              <a href="https://about.wallapop.com/condiciones-de-uso/">
                Terms of Use
              </a>{" "}
              and{" "}
              <a href="https://about.wallapop.com/politica-privacidad/">
                Privacy Policy
              </a>{" "}
              of Wallapop.
            </span>
          </label>
        </div>
        <button type="submit" className="registration-button">
          Create Account
        </button>
      </form>
      <button onClick={() => changeForm()} className="switch-to-login">
        Have an account? Log in
      </button>
    </div>
  );
}

export default RegistrationForm;
