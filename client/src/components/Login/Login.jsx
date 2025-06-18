import { useState, useContext } from "react";
import axios from "../../utils/axios";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post("/api/auth/login", form);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        navigate("/");
      }
    } catch (err) {
      if (err.response) {
        switch (err.response.status) {
          case 401:
            setMessage("Invalid email or password.");
            break;
          case 404:
            setMessage("User not found. Redirecting to registration...");
            setTimeout(() => navigate("/register"), 1500);
            break;
          default:
            setMessage(err.response.data.message || "Login failed.");
        }
      } else {
        setMessage("Cannot connect to server. Please try again.");
      }
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post("/api/users/forgot-password", { email: resetEmail });
      setMessage(res.data.message || "Reset link sent to your email.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send reset link.");
    }
  };

  return (
    <div className="user-registration-outer">
      <div className="user-registration-image">
        <img
          src="https://i.postimg.cc/pLqc3f8f/7b6a4d2a-60e6-4bf0-9f2b-29d9a45fc992.jpg"
          alt="Registration Visual"
          className="img-cover"
        />
      </div>
      <div className="form-side">
        <form className="user-registration-form" onSubmit={forgot ? handleForgot : handleLogin}>
          <div className="text-center mb-3">
            <img
              src="https://storage.googleapis.com/skcn-prod-mb-public-tenants/logo/0b250aa2-3030-4772-98e7-a0c5938a771c.png"
              alt="Logo"
              style={{ height: "78px", marginBottom: "8px" }}
            />
          </div>
          {forgot ? (
            <>
              <h4 className="text-center mb-2">Forgot Password</h4>
              <p className="text-center mb-4" style={{ color: "#888" }}>
                Enter your registered email to reset password
              </p>
              <div className="mb-3">
                <input
                  className="form-control"
                  name="resetEmail"
                  type="email"
                  placeholder="Email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary w-100 p-3" type="submit">
                Send Link
              </button>
              <div className="text-center mt-3">
                Have an account?{" "}
                <span className="login-link" onClick={() => setForgot(false)}>
                  Sign In
                </span>
              </div>
            </>
          ) : (
            <>
              <h4 className="text-center mb-2">Welcome Back</h4>
              <p className="text-center mb-4" style={{ color: "#888" }}>
                Sign in to continue
              </p>
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
              <div className="mb-3 text-end">
                <span className="forgot-link" onClick={() => setForgot(true)}>
                  Forgot Password?
                </span>
              </div>
              <button className="btn btn-primary w-100 p-3" type="submit">
                Continue
              </button>
            </>
          )}
          {message && <div className="alert alert-info mt-3">{message}</div>}
        </form>
      </div>
    </div>
  );
};

export default Login;