import React, { useEffect, useState } from "react";
import axios from "../../utils/axios";
import {
  Button,
  Spinner,
  Alert,
  Container,
  Nav,
  Row,
  Col,
  Badge,
  Card,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaUser, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from "react-icons/fa";
import "./../Courses/Courses.css";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const statCards = [
  {
    key: "pending",
    label: "Pending",
    icon: <FaHourglassHalf />,
    color: "#f59e0b",
  },
  {
    key: "approved",
    label: "Approved",
    icon: <FaCheckCircle />,
    color: "#10b981",
  },
  {
    key: "rejected",
    label: "Rejected",
    icon: <FaTimesCircle />,
    color: "#ef4444",
  },
];

const CheckerDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [alert, setAlert] = useState({ show: false, variant: "success", message: "" });

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, []);

  const displayValue = (val) => {
    if (val === undefined || val === null || val === "") return <span className="text-muted">N/A</span>;
    if (Array.isArray(val)) return val.length ? val.join(", ") : <span className="text-muted">[]</span>;
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    return val.toString();
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const [pending, approved, rejected] = await Promise.all([
        axios.get("/api/checker/pending-approval"),
        axios.get("/api/courses?status=approved"),
        axios.get("/api/courses?status=rejected"),
      ]);
      setCourses([
        ...pending.data.map(c => ({ ...c, approvalStatus: "pending" })),
        ...approved.data.courses.map(c => ({ ...c, approvalStatus: "approved" })),
        ...rejected.data.courses.map(c => ({ ...c, approvalStatus: "rejected" })),
      ]);
    } catch (err) {
      setAlert({ show: true, variant: "danger", message: "Failed to fetch courses." });
    } finally {
      setLoading(false);
    }
  };

  const getCoursesByTab = () => courses.filter(c => c.approvalStatus === activeTab);

  // Stat counts
  const stats = {
    pending: courses.filter(c => c.approvalStatus === "pending").length,
    approved: courses.filter(c => c.approvalStatus === "approved").length,
    rejected: courses.filter(c => c.approvalStatus === "rejected").length,
  };

  const handleView = (course) => {
    navigate(`/review-course/${course._id}`);
  };

  return (
    <Container className="py-5 min-vh-100 mt-5">
      {/* Stat Cards */}
      <Row className="mb-4">
        {statCards.map(card => (
          <Col key={card.key} md={4} sm={12} className="mb-3">
            <Card className="stat-card text-center">
              <Card.Body>
                <div className="mb-2" style={{ color: card.color, fontSize: 32 }}>
                  {card.icon}
                </div>
                <h3 style={{ color: card.color }} className="pt-1">{stats[card.key]}</h3>
                <div style={{ fontWeight: 500 }}>{card.label}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      {/* Tabs */}
      <Nav variant="pills" activeKey={activeTab} onSelect={setActiveTab} className="mb-4 justify-content-left">
        {TABS.map(tab => (
          <Nav.Item key={tab.key}>
            <Nav.Link eventKey={tab.key}>{tab.label}</Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ ...alert, show: false })} dismissible>
          {alert.message}
        </Alert>
      )}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Row>
          {getCoursesByTab().length === 0 ? (
            <div className="text-center text-muted py-5">No courses found.</div>
          ) : (
            getCoursesByTab().map(course => (
              <Col key={course._id} lg={3} md={6} sm={12} className="mb-4">
                <div className="modern-course-card d-flex flex-column h-100">
                  <div className="course-img-wrap" style={{ height: 160 }}>
                    <img
                      src={course.thumbnail || "https://i.postimg.cc/43Fp6cy7/20250625-1214-Default-Course-Thumbnail-simple-compose-01jyjx8d67fv3r7mnmt1cwgt4v.png"}
                      alt={course.title}
                      className="course-img"
                      style={{ objectFit: "cover", height: "100%" }}
                    />
                  </div>
                  <div className="course-card-body d-flex flex-column flex-grow-1">
                    <div className="course-title" style={{ fontSize: "1.1rem" }}>
                      {course.title}
                    </div>
                    <div className="course-desc" style={{ fontSize: "0.95rem" }}>
                      {course.description?.length > 90
                        ? course.description.slice(0, 90) + "..."
                        : course.description}
                    </div>
                    <div className="mt-2 mb-1 text-muted" style={{ fontSize: "0.92rem" }}>
                      <FaUser className="me-3" />
                      {course.instructor?.name || course.instructor?.email || displayValue(course.instructor)}
                    </div>
                    <div className="d-flex justify-content-end align-items-end mt-auto">
                      <Button
                        variant="info"
                        size="sm"
                        className="action-btn"
                        onClick={() => handleView(course)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))
          )}
        </Row>
      )}
    </Container>
  );
};

export default CheckerDashboard;