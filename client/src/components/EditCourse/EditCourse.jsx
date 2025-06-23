import React, { useState, useEffect } from "react";
import { Container, Table, Button, Form, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import { FaEdit, FaUsers, FaBookOpen } from "react-icons/fa";
import "./EditCourse.css";

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
        setCourses(response.data);
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
    <Container className="py-4 edit-courses min-vh-100 mt-5">

      <Form.Group className="mb-3 mt-3">
        <Form.Control
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <div className="table-responsive">
          <Table
            bordered
            className="edit-courses-table align-middle"
            style={{ minWidth: 700 }}
          >
            <thead className="table-primary sticky-top" style={{ zIndex: 1 }}>
              <tr>
                <th style={{ width: "30%" }}>
                  <FaBookOpen className="me-2" />
                  Title
                </th>
                <th style={{ width: "15%" }}>Category</th>
                <th style={{ width: "15%" }}>
                  {/* <FaUsers className="me-2" /> */}
                  Employees Enrolled
                </th>
                <th style={{ width: "15%" }}>Created</th>
                {/* <th style={{ width: "15%" }}>Instructor</th> */}
                <th style={{ width: "15%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No courses found.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course, idx) => (
                  <tr key={course._id} className={idx % 2 === 0 ? "table-light" : ""}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {course.thumbnail && (
                          <img
                            src={course.thumbnail}
                            alt="thumb"
                            style={{
                              width: 36,
                              height: 36,
                              objectFit: "cover",
                              borderRadius: 6,
                              border: "1px solid #eee",
                            }}
                          />
                        )}
                        <span>{course.title}</span>
                      </div>
                    </td>
                    <td>{course.category}</td>
                    <td>{course.studentsEnrolled?.length || 0}</td>
                    <td>
                      {course.createdAt
                        ? new Date(course.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    
                    <td>
                      <Button
                        variant="outline-primary action-btn"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/edit-courses/${course._id}`)}
                        title="Edit Course"
                      >
                        Edit
                      </Button>
                      {/* Add more actions here if needed */}
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