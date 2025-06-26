import React, { useState, useEffect } from "react";
import { Container, Table, Button, Form, Spinner, Alert, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import { FaEdit } from "react-icons/fa";
import "./EditCourse.css";

const TableSkeleton = ({ rows = 10 }) => (
  <div className="table-responsive">
    <table className="edit-courses-table table">
      <thead className="courses-table-header">
        <tr>
          <th>Title</th>
          <th>Category</th>
          <th>Created On</th>
          <th>Approval Status</th>
          <th>Feedback</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, idx) => (
          <tr key={idx}>
            <td><div className="skeleton skeleton-title" style={{ width: "70%" }} /></td>
            <td><div className="skeleton skeleton-text" style={{ width: "60%" }} /></td>
            <td><div className="skeleton skeleton-text" style={{ width: "50%" }} /></td>
            <td><div className="skeleton skeleton-text" style={{ width: "40%" }} /></td>
            <td><div className="skeleton skeleton-text" style={{ width: "60%" }} /></td>
            <td><div className="skeleton skeleton-btn" style={{ width: 60, height: 28 }} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const statusColor = (status) =>
  status === "approved"
    ? "#4CAF50"
    : status === "pending"
    ? "#FFA500"
    : "#F44336";

const EditCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get("/api/courses");
        setCourses(response.data.courses);
      } catch (err) {
        setError("Error fetching courses.");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCoursesByTab = () => {
    if (activeTab === "all") return filteredCourses;
    return filteredCourses.filter((c) => c.approvalStatus === activeTab);
  };

  return (
    <Container className="edit-courses-container">
      <Form.Group className="search-group">
        <Form.Control
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>

      <Nav variant="pills" activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Nav.Item>
          <Nav.Link eventKey="all">All</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="approved">Approved</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="pending">Pending</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="rejected">Rejected</Nav.Link>
        </Nav.Item>
      </Nav>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <div className="table-responsive">
          <Table bordered className="edit-courses-table">
            <thead className="courses-table-header">
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Created On</th>
                <th>Approval Status</th>
                <th>Feedback</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getCoursesByTab().length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-courses-message">
                    No courses found.
                  </td>
                </tr>
              ) : (
                getCoursesByTab().map((course, idx) => (
                  <tr key={course._id} className={idx % 2 === 0 ? "table-light" : ""}>
                    <td>
                      <div className="title-content">
                        {course.thumbnail && (
                          <img
                            src={course.thumbnail}
                            alt="thumb"
                            className="course-thumbnail"
                          />
                        )}
                        <div className="title-info">
                          <div className="course-title">{course.title}</div>
                        </div>
                      </div>
                    </td>
                    <td>{course.category}</td>
                    <td>
                      {course.createdAt
                        ? new Date(course.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <span style={{ color: statusColor(course.approvalStatus), fontWeight: 600 }}>
                        {course.approvalStatus.charAt(0).toUpperCase() + course.approvalStatus.slice(1)}
                      </span>
                    </td>
                    <td>
                      {course.approvalStatus === "rejected" && course.checkerFeedback
                        ? <span className="text-danger">{course.checkerFeedback}</span>
                        : course.approvalStatus === "approved"
                        ? <span className="text-success">Validated</span>
                        : ""}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="edit-button"
                        onClick={() => navigate(`/edit-courses/${course._id}`)}
                        title="Edit Course"
                      >
                        <span className="edit-text">Edit</span>
                        <FaEdit className="edit-icon" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
};

export default EditCourses;