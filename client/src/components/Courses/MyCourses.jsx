import React, { useEffect, useState, useContext } from "react";
import axios from "../../utils/axios";
import { Row, Col, Spinner, Alert, Container, ProgressBar, Badge, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaClock, FaLayerGroup, FaUser, FaStar } from "react-icons/fa";
import "./MyCourses.css";

// --- Skeleton Loader for MyCourses Card ---
const MyCourseCardSkeleton = () => (
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

const EmptyState = ({ message }) => (
  <Col key="empty-state" xs={12}>
    <div className="text-center text-muted py-5">
      {message}
    </div>
  </Col>
);

const CourseCard = ({ enrollment }) => {
  const course = enrollment.course;
  const progress = enrollment.progress || 0;

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
      <span
        key={index}
        className={`star ${index < Math.round(rating || 0) ? 'filled' : ''}`}
      >
        ★
      </span>
    ));
  };

  // Don't render anything if course is missing
  if (!course) return null;

  return (
    <div className="modern-course-card">
      <div className="course-img-wrap">
        <img
          src={course.thumbnail || "https://via.placeholder.com/320x180?text=Course"}
          alt={course.title}
          className="course-img"
          loading="lazy"
        />
        {course.difficulty && (
          <Badge
            bg={getDifficultyColor(course.difficulty)}
            className="difficulty-badge"
          >
            {course.difficulty}
          </Badge>
        )}
      </div>
      <div className="course-card-body">
        <div className="course-title">
          <Link to={`/courses/${course._id}`}>{course.title}</Link>
        </div>
        <div className="course-stats">
          <div className="course-stat">
            <FaClock className="me-1" />
            <span>{course.duration ? Math.round(course.duration / 60) : 0}h</span>
          </div>
          <div className="course-stat">
            <FaLayerGroup className="me-1" />
            <span>{Array.isArray(course.units) ? course.units.length : 0} units</span>
          </div>
          <div className="course-stat">
            <FaUser className="me-1" />
            <span>{Array.isArray(course.studentsEnrolled) ? course.studentsEnrolled.length : 0}</span>
          </div>
        </div>
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
        <div className="course-footer">
          <div className="course-rating">
            {/* <div className="stars">
              {renderStars(course.averageRating)}
            </div>
            <span className="rating-text">
              {course.averageRating?.toFixed(1) || "0.0"}
            </span>
            <span className="rating-count">
              ({course.ratings?.length || 0})
            </span> */}
          </div>
          <div className="course-action">
            <Link
              to={`/courses/${course._id}`}
              className="btn btn-success action-btn"
            >
              {progress === 100 ? 'Review' : 'Resume'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("inprogress");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        // Only fetch summary fields for the card
        const res = await axios.get("/api/users/enrollments?fields=course.title,course.thumbnail,course.difficulty,course.duration,course.units,course.studentsEnrolled,course.averageRating,course.ratings,progress");
        // If your backend doesn't support ?fields=, just filter on frontend:
        // setEnrollments(res.data.map(e => ({
        //   ...e,
        //   course: e.course && {
        //     _id: e.course._id,
        //     title: e.course.title,
        //     thumbnail: e.course.thumbnail,
        //     difficulty: e.course.difficulty,
        //     duration: e.course.duration,
        //     units: e.course.units,
        //     studentsEnrolled: e.course.studentsEnrolled,
        //     averageRating: e.course.averageRating,
        //     ratings: e.course.ratings,
        //   }
        // })));
        setEnrollments(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch your courses.");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [user]);

  const getFilteredEnrollments = () => {
    return enrollments.filter((enr) => {
      // Filter out enrollments with missing course data
      if (!enr.course) return false;
      if (activeTab === "all") return true;
      if (activeTab === "completed") return (enr.progress || 0) === 100;
      if (activeTab === "inprogress") return (enr.progress || 0) < 100;
      return true;
    });
  };

  if (!user) {
    return (
      <div className="mycourses-page">
        <Container fluid className="mycourses-container">
          <Alert variant="info">Please login to view your courses.</Alert>
        </Container>
      </div>
    );
  }

  if (loading) {
    return (
  <div className="mycourses-page">
    <Container fluid className="mycourses-container">
      <Nav variant="pills" activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Nav.Item>
          <Nav.Link eventKey="inprogress">In Progress</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="completed">Completed</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="all">View All</Nav.Link>
        </Nav.Item>
      </Nav>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <Col key={idx} lg={3} md={4} sm={6} xs={12} className="mb-4">
                <MyCourseCardSkeleton />
              </Col>
            ))
          : filteredEnrollments.length === 0 ? (
              <EmptyState message={emptyStateMessage} />
            ) : (
              filteredEnrollments.map((enrollment) => (
                <Col
                  key={enrollment.course._id}
                  lg={3}
                  md={4}
                  sm={6}
                  xs={12}
                  className="mb-4"
                >
                  <CourseCard enrollment={enrollment} />
                </Col>
              ))
            )}
      </Row>
    </Container>
  </div>
);
  }

  const filteredEnrollments = getFilteredEnrollments();
  const emptyStateMessage = {
    completed: "No completed courses yet.",
    inprogress: "No courses in progress.",
    all: "You are not enrolled in any courses yet."
  }[activeTab];

  return (
    <div className="mycourses-page">
      <Container fluid className="mycourses-container">
        <Nav variant="pills" activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="inprogress">In Progress</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="completed">Completed</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="all">View All</Nav.Link>
          </Nav.Item>
        </Nav>

        {error && <Alert variant="danger">{error}</Alert>}

        <Row>
          {filteredEnrollments.length === 0 ? (
            <EmptyState message={emptyStateMessage} />
          ) : (
            filteredEnrollments.map((enrollment) => (
              <Col
                key={enrollment.course._id}
                lg={3}
                md={4}
                sm={6}
                xs={12}
                className="mb-4"
              >
                <CourseCard enrollment={enrollment} />
              </Col>
            ))
          )}
        </Row>
      </Container>
    </div>
  );
}

export default MyCourses;