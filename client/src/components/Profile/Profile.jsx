import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "../../utils/axios";
import { Container, Row, Col, Button, Alert, Spinner } from "react-bootstrap";
import "./Profile.css";

const teamOptions = [
  "Engineering-dev", "Engineering-Support", "IT",
  "Administration", "Accounts", "Management", "HR"
];

function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found. Please log in again.");
          return;
        }
        const res = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
        } else if (err.response?.status === 403) {
          setError("Access denied.");
        } else {
          setError("Failed to load profile. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setSaving(false);
        return;
      }
      const res = await axios.patch("/api/users/profile", profile, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSuccess("Profile updated successfully!");
      setUser(res.data.user);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else if (err.response?.status === 400) {
        // Show backend validation errors if any
        if (err.response.data.errors) {
          setError(err.response.data.errors.join(" "));
        } else {
          setError(err.response.data.message || "Invalid data provided.");
        }
      } else if (err.response?.status === 403) {
        setError("Access denied.");
      } else {
        setError(err.response?.data?.message || "Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (success) setSuccess("");
    if (error) setError("");
  };

  if (loading) {
    return (
      <Container className="profile-container min-vh-100">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading profile...</p>
        </div>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="profile-container">
        <div className="text-center py-5">
          <Alert variant="danger">
            Unable to load profile data. Please refresh the page or try again later.
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <Container className="profile-container mt-5 pt-3 min-vh-100">
      <Row className="justify-content-center">
        <Col md={10} lg={9}>
          <div className="profile-card p-4">
            <h3 className="mb-4">Profile Settings</h3>
            {success && <Alert variant="success">{success}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}
            <Row className="gy-3 align-items-center">
              <Col md={6}>
                <div className="profile-label">Name: <span className="text-danger">*</span></div>
                <input
                  className="profile-value-input"
                  type="text"
                  value={profile.name || ""}
                  onChange={e => handleChange("name", e.target.value)}
                  placeholder="Enter your full name"
                />
              </Col>
              <Col md={6}>
                <div className="profile-label">Email:</div>
                <div className="profile-value profile-value-disabled">
                  {profile.email || "Not provided"}
                </div>
              </Col>
              <Col md={6}>
                <div className="profile-label">Employee ID: <span className="text-danger">*</span></div>
                <input
                  className="profile-value-input"
                  type="text"
                  value={profile.employeeId || ""}
                  onChange={e => handleChange("employeeId", e.target.value)}
                  placeholder="Enter employee ID"
                />
              </Col>
              <Col md={6}>
                <div className="profile-label">Mobile: <span className="text-danger">*</span></div>
                <input
  className="profile-value-input"
  type="tel"
  value={profile.mobile || ""}
  onChange={e => {
    // Only allow digits
    if (e.target.value === "" || /^\d+$/.test(e.target.value)) {
      handleChange("mobile", e.target.value);
    }
  }}
  placeholder="Enter mobile number"
/>
              </Col>
              <Col md={6}>
                <div className="profile-label">Team:</div>
                <select
                  className="profile-value-input"
                  value={profile.team || ""}
                  onChange={e => handleChange("team", e.target.value)}
                >
                  <option value="">Select team</option>
                  {teamOptions.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </Col>
              <Col md={6}>
                <div className="profile-label">Designation:</div>
                <input
                  className="profile-value-input"
                  type="text"
                  value={profile.designation || ""}
                  onChange={e => handleChange("designation", e.target.value)}
                  placeholder="Enter your designation"
                />
              </Col>
            </Row>
            <div className="d-flex justify-content-end mt-4">
              <Button
                variant="primary update-button"
                onClick={handleUpdate}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Profile;