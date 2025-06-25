import React, { useState, useEffect } from "react";
import { Container, Table, Button, Form, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import { FaEdit } from "react-icons/fa";
import "./EditCourse.css";


const TableSkeleton = ({ rows = 10 }) => (
  <div className="table-responsive">
    <table className="edit-courses-table table">
      <thead className="courses-table-header">
        <tr>
          <th className="title-column">Title</th>
          <th className="category-column">Category</th>
          <th className="enrolled-column">Employees Enrolled</th>
          <th className="created-column">Created</th>
          <th className="actions-column">Actions</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, idx) => (
          <tr key={idx}>
            <td>
              <div className="skeleton skeleton-title" style={{ width: "70%" }} />
            </td>
            <td>
              <div className="skeleton skeleton-text" style={{ width: "60%" }} />
            </td>
            <td>
              <div className="skeleton skeleton-text" style={{ width: "40%" }} />
            </td>
            <td>
              <div className="skeleton skeleton-text" style={{ width: "50%" }} />
            </td>
            <td>
              <div className="skeleton skeleton-btn" style={{ width: 60, height: 28 }} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const EditCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get("/api/courses");
        setCourses(response.data.courses); // <-- updated here
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

      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <div className="table-responsive">
          <Table bordered className="edit-courses-table">
            <thead className="courses-table-header">
              <tr>
                <th className="title-column">Title</th>
                <th className="category-column">Category</th>
                <th className="enrolled-column">Employees Enrolled</th>
                <th className="created-column">Created</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-courses-message">
                    No courses found.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course, idx) => (
                  <tr key={course._id} className={idx % 2 === 0 ? "table-light" : ""}>
                    <td className="title-cell">
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
                          <div className="mobile-info">
                            <small>
                              {course.category} • {course.studentsEnrolled?.length || 0} enrolled
                              {course.createdAt && (
                                <> • {new Date(course.createdAt).toLocaleDateString()}</>
                              )}
                            </small>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="category-cell">{course.category}</td>
                    <td className="enrolled-cell">{course.studentsEnrolled?.length || 0}</td>
                    <td className="created-cell">
                      {course.createdAt
                        ? new Date(course.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="actions-cell">
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