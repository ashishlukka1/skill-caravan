import React, { useEffect, useState, useContext } from "react";
import axios from "../../utils/axios";
import {
  Modal,
  Form,
  Row,
  Col,
  Spinner,
  Alert,
  Container,
  ProgressBar,
  Button,
  Badge,
  Toast,
  ToastContainer,
  Placeholder,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  FaClock,
  FaLayerGroup,
  FaUser,
  FaCertificate,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";
import "./Courses.css";

// --- Skeleton Loader for Course Card ---
const CourseCardSkeleton = () => (
  <div className="modern-course-card">
    <div className="course-img-wrap">
      <div className="skeleton skeleton-img" />
    </div>
    <div className="course-card-body">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-desc" />
      <div className="course-stats" style={{ marginBottom: 8 }}>
        <div className="skeleton skeleton-stat" />
        <div className="skeleton skeleton-stat" />
        <div className="skeleton skeleton-stat" />
      </div>
      <div className="skeleton skeleton-btn" />
    </div>
  </div>
);

// --- Top-Right Alert Component ---
const TopRightAlert = ({ show, variant, message, onClose }) => {
  const iconMap = {
    success: <FaCheckCircle className="me-2" />,
    error: <FaTimesCircle className="me-2" />,
    info: <FaInfoCircle className="me-2" />,
  };
  const backgroundMap = {
    success: "#4CAF50",
    error: "#F44336",
    info: "#2196F3",
  };
  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
      <Toast
        show={show}
        onClose={onClose}
        delay={4000}
        autohide
        style={{
          backgroundColor: backgroundMap[variant],
          border: "none",
          borderRadius: "12px",
          minWidth: "300px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <Toast.Body className="d-flex align-items-center justify-content-between text-white p-3">
          <div className="d-flex align-items-center">
            {iconMap[variant]}
            <span style={{ fontSize: "14px", fontWeight: "500" }}>{message}</span>
          </div>
          <FaTimes
            className="ms-3"
            style={{ cursor: "pointer", fontSize: "12px" }}
            onClick={onClose}
          />
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

// --- Course Card ---
const CourseCard = ({
  course,
  user,
  enrollment,
  onEnroll,
  onResume,
  onAssign,
  onEdit,
  enrolling,
}) => {
  const enrolled = !!enrollment;
  const progress = enrolled ? enrollment.progress || 0 : 0;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "success";
      case "intermediate":
        return "warning";
      case "advanced":
        return "danger";
      default:
        return "secondary";
    }
  };

  return (
    <div className="modern-course-card">
      <div className="course-img-wrap">
        <img
          src={course.thumbnail || "https://i.postimg.cc/43Fp6cy7/20250625-1214-Default-Course-Thumbnail-simple-compose-01jyjx8d67fv3r7mnmt1cwgt4v.png"}
          alt={course.title}
          className="course-img"
          loading="lazy"
        />
        {course.difficulty && (
          <Badge bg={getDifficultyColor(course.difficulty)} className="difficulty-badge">
            {course.difficulty}
          </Badge>
        )}
        {enrollment?.certificate?.issued && (
          <div className="certificate-badge">
            <FaCertificate className="me-1" />
            Certificate Issued
          </div>
        )}
      </div>
      <div className="course-card-body">
        <div className="course-title">
          <Link to={`/courses/${course._id}`}>{course.title}</Link>
        </div>
        {!enrolled && (
          <div className="course-desc">{truncateDescription(course.description)}</div>
        )}
        <div className="course-stats">
          <div className="course-stat">
            <FaClock className="me-1" />
            <span>{formatDuration(course.duration)}</span>
          </div>
          <div className="course-stat">
            <FaLayerGroup className="me-1" />
            <span>{course.units?.length || 0} units</span>
          </div>
          <div className="course-stat">
            <FaUser className="me-1" />
            <span>{course.studentsEnrolled?.length || 0}</span>
          </div>
        </div>
        {enrolled && (
          <div className="course-progress-section">
            <div className="progress-info">
              <span className="progress-text">Progress</span>
              <span className="progress-percent">{progress}%</span>
            </div>
            <ProgressBar
              now={progress}
              variant={progress === 100 ? "success" : "primary"}
              className="custom-progress"
            />
          </div>
        )}
        <div className="course-footer">
          <div className="course-rating">
            {/* You can add stars here if you want */}
          </div>
          <div className="course-action">
            {user?.role === "admin" ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  className="action-btn me-2"
                  onClick={() => onAssign(course)}
                >
                  Assign
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="btn-outline-primary action-btn"
                  onClick={() => onEdit(course._id)}
                >
                  Edit
                </Button>
              </>
            ) : user ? (
              enrolled ? (
                <Button
                  variant="success"
                  size="sm"
                  className="action-btn"
                  onClick={() => onResume(course._id)}
                >
                  {progress === 100 ? "Review" : "Continue"}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="action-btn"
                  disabled={enrolling}
                  onClick={() => onEnroll(course._id)}
                >
                  {enrolling ? "Enrolling..." : "Enroll"}
                </Button>
              )
            ) : (
              <Button
                variant="outline-primary"
                size="sm"
                className="action-btn"
                as={Link}
                to="/login"
              >
                Login to Enroll
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatDuration = (minutes) => {
  if (!minutes) return "0h";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;
};

const AssignmentModal = ({
  show,
  onHide,
  course,
  onAssignResult,
  loading,
}) => {
  const [assignmentType, setAssignmentType] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search users with debouncing
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setUserResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axios.get(`/api/users/search?q=${query}`);
      setUserResults(response.data);
    } catch (err) {
      setUserResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && assignmentType === "user") {
        searchUsers(searchQuery);
      } else {
        setUserResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, assignmentType]);

  // Reset state when modal closes
  useEffect(() => {
    if (!show) {
      setAssignmentType("");
      setSelectedUsers([]);
      setSelectedTeam("");
      setSearchQuery("");
      setUserResults([]);
    }
  }, [show]);

  const handleAssignSubmit = async () => {
    if (
      !assignmentType ||
      (assignmentType === "user" && selectedUsers.length === 0) ||
      (assignmentType === "team" && !selectedTeam)
    ) {
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/courses/${course._id}/assign`, {
        type: assignmentType,
        users: assignmentType === "user" ? selectedUsers : [],
        team: assignmentType === "team" ? selectedTeam : null,
      });

      onHide();
      onAssignResult({ success: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Assignment failed";
      onAssignResult({ success: false, message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled =
    !assignmentType ||
    (assignmentType === "user" && selectedUsers.length === 0) ||
    (assignmentType === "team" && !selectedTeam) ||
    submitting;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title style={{ fontSize: "1.25rem", fontWeight: "600" }}>
          Assign Course
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 py-3">
        <div className="mb-3">
          <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
            Assign "{course?.title}" to users or teams
          </p>
        </div>

        <Form>
          <Form.Group className="mb-4">
            <Form.Label className="fw-medium mb-2">Assignment Type</Form.Label>
            <Form.Select
              value={assignmentType}
              onChange={(e) => {
                setAssignmentType(e.target.value);
                setSelectedUsers([]);
                setSelectedTeam("");
                setSearchQuery("");
                setUserResults([]);
              }}
              style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}
            >
              <option value="">Choose assignment type</option>
              <option value="user">Assign to Users</option>
              <option value="team">Assign to Team</option>
            </Form.Select>
          </Form.Group>

          {assignmentType === "user" && (
            <div className="user-assignment-section">
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium mb-2">Search Users</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name or employee ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}
                />
              </Form.Group>

              {searchLoading ? (
                <div className="text-center mb-3 py-3">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <span className="ms-2 text-muted">Searching...</span>
                </div>
              ) : (
                <div
                  className="user-results mb-3"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                >
                  {userResults.map((user) => (
                    <div
                      key={user._id}
                      className="user-result-item p-3 border-bottom"
                      style={{ backgroundColor: "#f8f9fa" }}
                    >
                      <Form.Check
                        type="checkbox"
                        id={`user-${user._id}`}
                        label={`${user.name} (${user.employeeId || "N/A"})`}
                        checked={selectedUsers.includes(user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user._id]);
                          } else {
                            setSelectedUsers(
                              selectedUsers.filter((id) => id !== user._id)
                            );
                          }
                        }}
                      />
                    </div>
                  ))}
                  {searchQuery && userResults.length === 0 && !searchLoading && (
                    <div className="text-muted text-center p-3">
                      No users found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}

              {selectedUsers.length > 0 && (
                <div className="selected-users-count mb-3">
                  <Badge bg="primary" style={{ fontSize: "0.85rem" }}>
                    {selectedUsers.length} user
                    {selectedUsers.length !== 1 ? "s" : ""} selected
                  </Badge>
                </div>
              )}
            </div>
          )}

          {assignmentType === "team" && (
            <Form.Group className="mb-4">
              <Form.Label className="fw-medium mb-2">Select Team</Form.Label>
              <Form.Select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}
              >
                <option value="">Choose a team</option>
                <option value="Engineering-dev">Engineering Dev</option>
                <option value="Engineering-Support">Engineering Support</option>
                <option value="IT">IT</option>
                <option value="Administration">Administration</option>
                <option value="Accounts">Accounts</option>
                <option value="Management">Management</option>
                <option value="HR">HR</option>
              </Form.Select>
            </Form.Group>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button
          variant="light"
          onClick={onHide}
          disabled={submitting}
          style={{ borderRadius: "8px", paddingX: "20px" }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAssignSubmit}
          disabled={isSubmitDisabled}
          style={{ borderRadius: "8px", paddingX: "20px" }}
        >
          {submitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Assigning...
            </>
          ) : (
            "Assign Course"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default function Courses() {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState({});
  const [userEnrollments, setUserEnrollments] = useState([]);

  // Alert states
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showEnrollAlert, setShowEnrollAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Assignment error alert
  const [showAssignErrorAlert, setShowAssignErrorAlert] = useState(false);
  const [assignErrorMsg, setAssignErrorMsg] = useState("");

  const handleAssignResult = (result) => {
    if (result.success) {
      setAlertMessage("Course assigned successfully!");
      setShowSuccessAlert(true);
    } else {
      setAssignErrorMsg(result.message);
      setShowAssignErrorAlert(true);
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        // Only fetch summary fields for display, limit to 20
        const res = await axios.get("/api/courses?limit=20");
        setCourses(res.data.courses);
      } catch (err) {
        setError("Failed to fetch courses.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) {
        setUserEnrollments([]);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setUserEnrollments([]);
          return;
        }
        const res = await axios.get("/api/users/enrollments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserEnrollments(res.data);
      } catch (err) {
        setUserEnrollments([]);
      }
    };
    fetchEnrollments();
  }, [user]);

  const getEnrollment = (courseId) =>
    userEnrollments.find(
      (enr) => enr.course && (enr.course._id === courseId || enr.course === courseId)
    );

  const handleEnroll = async (courseId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setEnrolling((prev) => ({ ...prev, [courseId]: true }));
    try {
      const response = await axios.post(`/api/courses/${courseId}/enroll`);
      if (response.data.enrollment) {
        setUserEnrollments((prev) => [...prev, response.data.enrollment]);
        setCourses((prevCourses) =>
          prevCourses.map((course) =>
            course._id === courseId
              ? {
                  ...course,
                  studentsEnrolled: [...(course.studentsEnrolled || []), user._id],
                }
              : course
          )
        );
        setAlertMessage("Successfully enrolled in course!");
        setShowEnrollAlert(true);
        navigate(`/courses/${courseId}`);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to enroll in course";
      setAlertMessage(errorMessage);
      setShowErrorAlert(true);
    } finally {
      setEnrolling((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleAssign = async (courseData) => {
    if (!courseData) return;
    setSelectedCourse(courseData);
    setShowAssignModal(true);
  };

  const handleEdit = (courseId) => {
    navigate(`/edit-courses/${courseId}`);
  };

  const handleResume = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleCloseModal = () => {
    setShowAssignModal(false);
    setSelectedCourse(null);
  };

  return (
    <div className="courses-page min-vh-100">
      <Container fluid className="courses-container">
        <Row>
          {loading
            ? Array.from({ length: 8 }).map((_, idx) => (
                <Col key={idx} lg={3} md={4} sm={6} xs={12} className="mb-4">
                  <CourseCardSkeleton />
                </Col>
              ))
            : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : courses.length === 0 ? (
                <div className="text-center text-muted py-5">No courses available.</div>
              ) : (
                courses.map((course) => (
                  <Col key={course._id} lg={3} md={4} sm={6} xs={12} className="mb-4">
                    <CourseCard
                      course={course}
                      user={user}
                      enrollment={getEnrollment(course._id)}
                      onEnroll={handleEnroll}
                      onResume={handleResume}
                      onAssign={handleAssign}
                      onEdit={handleEdit}
                      enrolling={enrolling[course._id]}
                    />
                  </Col>
                ))
              )}
        </Row>
      </Container>

      <AssignmentModal
        show={showAssignModal}
        onHide={handleCloseModal}
        course={selectedCourse}
        onAssignResult={handleAssignResult}
        loading={assignLoading}
      />

      {/* Top-Right Alert Components */}
      <TopRightAlert
        show={showSuccessAlert}
        variant="success"
        message={alertMessage}
        onClose={() => setShowSuccessAlert(false)}
      />
      <TopRightAlert
        show={showEnrollAlert}
        variant="success"
        message={alertMessage}
        onClose={() => setShowEnrollAlert(false)}
      />
      <TopRightAlert
        show={showErrorAlert}
        variant="error"
        message={alertMessage}
        onClose={() => setShowErrorAlert(false)}
      />
      <TopRightAlert
        show={showAssignErrorAlert}
        variant="error"
        message={assignErrorMsg}
        onClose={() => setShowAssignErrorAlert(false)}
      />
    </div>
  );
}

// Utility function
const truncateDescription = (text, maxLength = 80) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};