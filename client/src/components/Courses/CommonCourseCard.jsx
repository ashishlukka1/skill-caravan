import React from "react";
import { Link } from "react-router-dom";
import { Badge, Button, ProgressBar } from "react-bootstrap";
import {
  FaClock,
  FaLayerGroup,
  FaUser,
  FaCertificate,
  FaCheckCircle,
} from "react-icons/fa";

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

const CommonCourseCard = ({
  course,
  progress,
  enrolled,
  certificateIssued,
  onEnroll,
  onResume,
  onAssign,
  onEdit,
  enrolling,
  user,
  showActions = true,
}) => (
  <div className="modern-course-card">
    <div className="course-img-wrap">
      <img
        src={
          course.thumbnail ||
          "https://i.postimg.cc/43Fp6cy7/20250625-1214-Default-Course-Thumbnail-simple-compose-01jyjx8d67fv3r7mnmt1cwgt4v.png"
        }
        alt={course.title}
        className="course-img"
        loading="lazy"
      />
      {course.difficulty && (
        <Badge bg={getDifficultyColor(course.difficulty)} className="difficulty-badge">
          {course.difficulty}
        </Badge>
      )}
      {certificateIssued && (
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
      {course.description && (
        <div className="course-desc">
          {course.description.length > 80
            ? course.description.substring(0, 80) + "..."
            : course.description}
        </div>
      )}
      <div className="course-stats">
        <div className="course-stat">
          <FaClock className="me-1" />
          <span>
            {course.duration
              ? Math.floor(course.duration / 60) > 0
                ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}m`
                : `${course.duration}m`
              : "0h"}
          </span>
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
      {typeof progress === "number" && (
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
      {showActions && (
        <div className="course-footer d-flex align-items-center justify-content-between">
          <div className="course-status-badge">
            {user?.role === "admin" && course.approvalStatus && (
              <span
                style={{
                  color:
                    course.approvalStatus === "approved"
                      ? "#4CAF50"
                      : course.approvalStatus === "pending"
                      ? "#FFA500"
                      : "#F44336",
                  fontWeight: 600,
                  fontSize: "0.98em",
                  marginRight: 8,
                }}
              >
                {course.approvalStatus.charAt(0).toUpperCase() +
                  course.approvalStatus.slice(1)}
              </span>
            )}
          </div>
          <div className="course-action">
            {user?.role === "admin" ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  className="action-btn me-2"
                  onClick={() => onAssign && onAssign(course)}
                  disabled={course.approvalStatus !== "approved"}
                  title={
                    course.approvalStatus !== "approved"
                      ? "Course must be validated before assignment"
                      : "Assign"
                  }
                >
                  Assign
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="btn-outline-primary action-btn"
                  onClick={() => onEdit && onEdit(course._id)}
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
                  onClick={() => onResume && onResume(course._id)}
                >
                  {progress === 100 ? "Review" : "Continue"}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="action-btn"
                  disabled={enrolling}
                  onClick={() => onEnroll && onEnroll(course._id)}
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
      )}
    </div>
  </div>
);

export default CommonCourseCard;