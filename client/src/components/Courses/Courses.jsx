import React, { useEffect, useState, useContext } from "react";
import axios from "../../utils/axios";
import { Modal, Form, Row, Col, Spinner, Alert, Container, ProgressBar, Button, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaClock, FaLayerGroup, FaUser, FaStar } from "react-icons/fa";
import "./Courses.css";

const CourseCard = ({ course, user, enrollment, onEnroll, onResume, onAssign, onEdit, enrolling }) => {
  const enrolled = !!enrollment;
  const progress = enrolled ? enrollment.progress || 0 : 0;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'secondary';
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} className={`star ${index < Math.round(rating || 0) ? 'filled' : ''}`}>★</span>
    ));
  };

  return (
    <div className="modern-course-card">
      <div className="course-img-wrap">
        <img
          src={course.thumbnail || "https://via.placeholder.com/320x180?text=Course"}
          alt={course.title}
          className="course-img"
        />
        {course.difficulty && (
          <Badge bg={getDifficultyColor(course.difficulty)} className="difficulty-badge">
            {course.difficulty}
          </Badge>
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
            {progress === 100 && enrollment.certificate?.issued && (
              <div className="certificate-info mt-2">
                <Badge bg="success">Certificate Issued</Badge>
              </div>
            )}
          </div>
        )}

        <div className="course-footer">
          {/* Update to handle new rating schema */}
          <div className="course-rating">
            <div className="stars">
              {renderStars(course.averageRating)}
            </div>
            <span className="rating-text">
              {course.averageRating?.toFixed(1) || "0.0"}
            </span>
          </div>
          
          <div className="course-action">
            {user?.role === 'admin' ? (
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
                  className="action-btn"
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
                  {progress === 100 ? 'Review' : 'Continue'}
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
  if (!minutes) return '0h';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? 
    `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : 
    `${mins}m`;
};

// Assignment Modal component
const AssignmentModal = ({ show, onHide, course, onAssign, loading }) => {
  const [assignmentType, setAssignmentType] = useState('none');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

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
      console.error('Error searching users:', err);
      setUserResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && assignmentType === 'user') {
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
      setAssignmentType('none');
      setSelectedUsers([]);
      setSelectedTeam('');
      setSearchQuery('');
      setUserResults([]);
    }
  }, [show]);

  const handleAssignSubmit = async () => {
    if (assignmentType === 'none') {
      alert('Please select assignment type');
      return;
    }

    if (assignmentType === 'user' && selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    if (assignmentType === 'team' && !selectedTeam) {
      alert('Please select a team');
      return;
    }

    try {
      await axios.post(`/api/courses/${course._id}/assign`, {
        type: assignmentType,
        users: assignmentType === 'user' ? selectedUsers : [],
        team: assignmentType === 'team' ? selectedTeam : null
      });

      onHide();
      alert('Course assigned successfully!');
    } catch (err) {
      console.error('Assignment error:', err);
      alert(err.response?.data?.message || 'Error assigning course');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Assign Course: {course?.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Assignment Type</Form.Label>
            <Form.Select
              value={assignmentType}
              onChange={(e) => {
                setAssignmentType(e.target.value);
                setSelectedUsers([]);
                setSelectedTeam('');
                setSearchQuery('');
                setUserResults([]);
              }}
            >
              <option value="none">Select type</option>
              <option value="user">Assign to a specific User</option>
              <option value="team">Assign to Team</option>
            </Form.Select>
          </Form.Group>

          {assignmentType === 'user' && (
            <div className="user-assignment-section">
              <Form.Group className="mb-3">
                <Form.Label>Search Users</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name or employee ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Form.Group>

              {searchLoading ? (
                <div className="text-center mb-3">
                  <Spinner animation="border" size="sm" />
                  <span className="ms-2">Searching...</span>
                </div>
              ) : (
                <div className="user-results mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {userResults.map(user => (
                    <div 
                      key={user._id} 
                      className="user-result-item p-2 border-bottom"
                    >
                      <Form.Check
                        type="checkbox"
                        id={`user-${user._id}`}
                        label={`${user.name} (${user.employeeId || 'N/A'})`}
                        checked={selectedUsers.includes(user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user._id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user._id));
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
                  <Badge bg="primary">Selected users: {selectedUsers.length}</Badge>
                </div>
              )}
            </div>
          )}

          {assignmentType === 'team' && (
            <Form.Group className="mb-3">
              <Form.Label>Select Team</Form.Label>
              <Form.Select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">Select a team</option>
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
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleAssignSubmit}
          disabled={
            loading ||
            assignmentType === 'none' ||
            (assignmentType === 'user' && selectedUsers.length === 0) ||
            (assignmentType === 'team' && !selectedTeam)
          }
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Assigning...
            </>
          ) : (
            'Assign Course'
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
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        // Update to handle published flag
        const res = await axios.get("/api/courses");
        // Sort courses by creation date (newest first)
        const sortedCourses = res.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setCourses(sortedCourses);
      } catch (err) {
        console.error("Fetch courses error:", err);
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
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserEnrollments(res.data);
      } catch (err) {
        console.error("Fetch enrollments error:", err);
        setUserEnrollments([]);
      }
    };
    fetchEnrollments();
  }, [user]);

  const getEnrollment = (courseId) =>
    userEnrollments.find((enr) =>
      enr.course && (enr.course._id === courseId || enr.course === courseId)
    );

const handleEnroll = async (courseId) => {
  if (!user) {
    navigate("/login");
    return;
  }

  setEnrolling(prev => ({ ...prev, [courseId]: true }));
  
  try {
    const response = await axios.post(`/api/courses/${courseId}/enroll`);
    
    if (response.data.enrollment) {
      // Update local state
      setUserEnrollments(prev => [...prev, response.data.enrollment]);

      // Update courses state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course._id === courseId 
            ? { 
                ...course, 
                studentsEnrolled: [...(course.studentsEnrolled || []), user._id]
              }
            : course
        )
      );

      // Show success message
      alert("Successfully enrolled in course!");

      // Navigate to course detail
      navigate(`/courses/${courseId}`);
    }
  } catch (err) {
    console.error("Enrollment error:", err);
    const errorMessage = err.response?.data?.message || "Failed to enroll in course";
    alert(errorMessage);
  } finally {
    setEnrolling(prev => ({ ...prev, [courseId]: false }));
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
    <div className="courses-page">
      <Container fluid className="courses-container">
        <Row>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
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
        onAssign={handleAssign}
        loading={assignLoading}
      />
    </div>
  );
}

// Utility function
const truncateDescription = (text, maxLength = 80) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};