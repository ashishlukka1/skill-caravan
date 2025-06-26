import { useState, useContext } from "react";
import axios from "../../utils/axios";
import "../UserLoginDetails/UserLoginDetails.css";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
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
  sessionStorage.setItem("user", JSON.stringify(res.data.user));
  if (res.data.user.role === "checker") {
    navigate("/checker-dashboard");
  } else {
    navigate("/");
  }
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
        <form className="user-registration-form" onSubmit={handleLogin}>
          <h4 className="text-center mb-2">Welcome Back</h4>
          <p
            className="text-center mb-4 register-prompt"
            style={{ color: "#888", marginBottom: "1.5rem" }}
          >
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
            <span className="register-prompt">
              No account?{" "}
              <Link to="/register" className="register-link">
                Register
              </Link>
            </span>
          </div>
          <button className="btn btn-primary w-100 login-button" type="submit">
            Login
          </button>
          {message && <div className="alert alert-info mt-3">{message}</div>}
        </form>
      </div>
    </div>
  );
};

export default Login;
