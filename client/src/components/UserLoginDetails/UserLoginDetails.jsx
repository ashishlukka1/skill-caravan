import { useState } from "react";
import axios from "../../utils/axios";
import "./UserLoginDetails.css";
import { Link, useNavigate } from "react-router-dom";

const initialState = {
  name: "",
  email: "",
  password: "",
  role: "Employee",
  employeeId: "",
  mobile: "",
  team: "",
  designation: ""
};

const Register = () => {
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.name || !form.email || !form.password || !form.role || !form.employeeId) {
      setMessage("Name, Email, Password, Role, and Employee ID are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return;
    }

    try {
      const response = await axios.post("/api/auth/register", form);
      setMessage("User registered successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
        err.message ||
        "Error registering user."
      );
    }
  };

  return (
    <div className="user-registration-flex">
      <div className="user-registration-logo-side">
        <img
          src="https://storage.googleapis.com/skcn-prod-mb-public-tenants/logo/0b250aa2-3030-4772-98e7-a0c5938a771c.png"
          alt="Logo"
          className="logo-img"
        />
      </div>
      <div className="user-registration-form-side">
        <form className="user-registration-form" onSubmit={handleSubmit}>
          <h4 className="text-center mb-4">Register User</h4>
          <div className="mb-3">
            <input
              className="form-control"
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
          <div className="mb-3 position-relative">
            <input
              className="form-control"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
            <span
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={0}
              role="button"
              aria-label="Toggle password visibility"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
          <div className="mb-3">
            <input
              className="form-control"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <select className="form-select" name="role" value={form.role} onChange={handleChange} required>
              <option value="Employee">Employee</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>
          <div className="mb-3">
            <input
              className="form-control"
              name="employeeId"
              placeholder="Employee ID"
              value={form.employeeId}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <input className="form-control" name="mobile" placeholder="Mobile" value={form.mobile} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <select className="form-select" name="team" value={form.team} onChange={handleChange}>
              <option value="">Select Team</option>
              <option value="Engineering-dev">Engineering Dev</option>
              <option value="Engineering-Support">Engineering Support</option>
              <option value="IT">IT</option>
              <option value="Administration">Administration</option>
              <option value="Accounts">Accounts</option>
              <option value="Management">Management</option>
              <option value="HR">HR</option>
            </select>
          </div>
          <div className="mb-3">
            <input className="form-control" name="designation" placeholder="Designation" value={form.designation} onChange={handleChange} />
          </div>
          <div className="mb-3 text-end register-prompt">
            <span className="register-prompt">
              Already Have an Account?{" "}
              <Link to="/login" className="register-link">
                Login  
              </Link>
            </span>
          </div>
          <button className="btn btn-primary w-100 register-button" type="submit">Register</button>
          {message && <div className="alert alert-info mt-3">{message}</div>}
        </form>
      </div>
    </div>
  );
};

export default Register;