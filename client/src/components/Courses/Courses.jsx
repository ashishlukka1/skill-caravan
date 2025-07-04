import React, { useEffect, useState, useContext } from "react";
import axios from "../../utils/axios";
import {
  Row,
  Col,
  Alert,
  Container,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import CommonCourseCard from "./CommonCourseCard";
import Loading from "../../utils/Loading";
import TopRightAlert from "../../utils/TopRightAlert";
import AssignmentModal from "./AssignmentModal";
import "./Courses.css";

export default function Courses() {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignLoading] = useState(false);
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

  const handleAssign = (courseData) => {
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
        {loading ? (
          <Loading message="Loading courses..." />
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : courses.length === 0 ? (
          <div className="text-center text-muted py-5">No courses available.</div>
        ) : (
          <Row>
            {courses.map((course) => (
              <Col key={course._id} lg={3} md={4} sm={6} xs={12} className="mb-4">
                <CommonCourseCard
                  course={course}
                  progress={getEnrollment(course._id)?.progress}
                  enrolled={!!getEnrollment(course._id)}
                  certificateIssued={getEnrollment(course._id)?.certificate?.issued}
                  onEnroll={handleEnroll}
                  onResume={handleResume}
                  onAssign={handleAssign}
                  onEdit={handleEdit}
                  enrolling={enrolling[course._id]}
                  user={user}
                />
              </Col>
            ))}
          </Row>
        )}
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