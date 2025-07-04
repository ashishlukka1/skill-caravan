import React from "react";
import { Button } from "react-bootstrap";
import TopRightAlert from "../../utils/TopRightAlert";
import Loading from "../../utils/Loading";
import {
  Container,
  Form,
  Table,
  Alert,
  Card,
  InputGroup,
  Row,
  Col,
} from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import { useAdminDashboardHandlers } from "./AdminDashboard.handlers";

const AdminDashboard = () => {
  const {
    courses,
    courseSearch,
    setCourseSearch,
    showCourseResults,
    setShowCourseResults,
    selectedCourseId,
    selectedCourseTitle,
    enrollments,
    setEnrollments,
    employeeSearch,
    setEmployeeSearch,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    loading,
    setLoading,
    alert,
    setAlert,
    courseSearchRef,
    filteredCourses,
    filteredEnrollments,
    handleCourseSelect,
    handleCourseSearchChange,
  } = useAdminDashboardHandlers();

  return (
    <Container className="py-4 mt-5 min-vh-100">
      <TopRightAlert
        show={alert.show}
        variant={alert.variant === "success" ? "success" : "error"}
        message={alert.message}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      <Card className="mb-4 mt-3">
        <Card.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group
                ref={courseSearchRef}
                style={{ position: "relative" }}
              >
                <Form.Label>Search Course</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Type course title..."
                    value={courseSearch}
                    onChange={handleCourseSearchChange}
                    onFocus={() => setShowCourseResults(true)}
                  />
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                </InputGroup>
                {showCourseResults &&
                  courseSearch.trim() &&
                  filteredCourses.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        background: "#fff",
                        border: "1px solid #ddd",
                        borderTop: "none",
                        maxHeight: 220,
                        overflowY: "auto",
                        boxShadow: "0 4px 16px #0001",
                      }}
                    >
                      {filteredCourses.map((course) => (
                        <div
                          key={course._id}
                          style={{
                            padding: "10px 16px",
                            cursor: "pointer",
                            borderBottom: "1px solid #eee",
                            background:
                              selectedCourseId === course._id
                                ? "#f0f8ff"
                                : "#fff",
                          }}
                          onClick={() => handleCourseSelect(course)}
                        >
                          <div style={{ fontWeight: 500 }}>{course.title}</div>
                          <div style={{ fontSize: 13, color: "#888" }}>
                            {course.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      {selectedCourseId && (
        <Card className="mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Search Employee</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Type employee name or ID..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                    />
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Assignment Type</Form.Label>
                  <Form.Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="admin">Assigned by Admin</option>
                    <option value="self">Self-Enrolled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      {loading ? (
        <Loading message="Loading..." />
      ) : selectedCourseId && filteredEnrollments.length > 0 ? (
        <Table bordered responsive>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Email</th>
              <th>Status</th>
              <th>Progress (%)</th>
              <th>Assessments Taken</th>
              <th>Unit Progress</th>
              <th>Assignment Status</th>
              <th>Assignment Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnrollments.map((enr, idx) => (
              <tr key={enr.userId}>
                <td>{enr.name}</td>
                <td>{enr.employeeId}</td>
                <td>{enr.email}</td>
                <td>{enr.status}</td>
                <td>{enr.progress}</td>
                <td>{enr.assignmentsTaken}</td>
                <td>
                  {enr.unitsProgress && enr.unitsProgress.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {enr.unitsProgress.map((unit, i) => (
                        <li key={i}>
                          Unit {unit.unitIndex + 1}:{" "}
                          {unit.completed ? "Completed" : "Incomplete"}
                          {unit.assignment && (
                            <>
                              {" "}
                              | Assignment Attempts: {unit.assignment.attemptCount || 0}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted">No units</span>
                  )}
                </td>
                {/* Assignment Blocked */}
                <td>
                  {enr.unitsProgress && enr.unitsProgress.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {enr.unitsProgress.map((unit, i) =>
                        unit.assignment && unit.assignment.blocked ? (
                          <li key={i}>
                            <span className="text-danger">Blocked</span>
                            <Button
                              variant="warning"
                              size="sm"
                              className="ms-2"
                              onClick={async () => {
                                await axios.post(
                                  `/api/progress/${selectedCourseId}/unit/${unit.unitIndex}/reset-block/${enr.userId}`
                                );
                                setAlert({
                                  show: true,
                                  message: `Assessment unblocked for ${enr.name} (Unit ${unit.unitIndex + 1})`,
                                  variant: "success",
                                });
                                // Optionally, refresh enrollments:
                                axios
                                  .get(`/api/courses/${selectedCourseId}/enrollments`)
                                  .then((res) => setEnrollments(res.data.enrollments))
                                  .finally(() => setLoading(false));
                              }}
                            >
                              Unblock
                            </Button>
                          </li>
                        ) : null
                      )}
                    </ul>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                {/* END Assignment Blocked */}
                <td>
                  {enr.assignedByAdmin === true ? (
                    <span className="badge bg-info text-dark">Assigned by Admin</span>
                  ) : (
                    <span className="badge bg-success">Self-Enrolled</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : selectedCourseId ? (
        <Alert variant="info">No enrollments found for this course.</Alert>
      ) : null}
    </Container>
  );
};

export default AdminDashboard;