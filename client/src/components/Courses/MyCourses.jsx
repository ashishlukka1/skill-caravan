import React, { useEffect, useState, useContext } from "react";
import axios from "../../utils/axios";
import { Row, Col, Alert, Container, Nav } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import CommonCourseCard from "./CommonCourseCard";
import Loading from "../../utils/Loading";
import "./Courses.css";

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
        const res = await axios.get("/api/users/enrollments");
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

  const filteredEnrollments = getFilteredEnrollments();
  const emptyStateMessage = {
    completed: "No completed courses yet.",
    inprogress: "No courses in progress.",
    all: "You are not enrolled in any courses yet.",
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
        {loading ? (
          <Loading message="Loading your courses..." />
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : filteredEnrollments.length === 0 ? (
          <div className="text-center text-muted py-5">{emptyStateMessage}</div>
        ) : (
          <Row>
            {filteredEnrollments.map((enrollment) => (
              <Col
                key={enrollment.course._id}
                lg={3}
                md={4}
                sm={6}
                xs={12}
                className="mb-4"
              >
                <CommonCourseCard
                  course={enrollment.course}
                  progress={enrollment.progress}
                  enrolled={true}
                  certificateIssued={enrollment.certificate?.issued}
                  user={user}
                  showActions={false}
                />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
}

export default MyCourses;