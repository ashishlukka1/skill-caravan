import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import {
  Container,
  Button,
  Spinner,
  Alert,
  Form,
  Table,
  Badge,
} from "react-bootstrap";
import ResourceModal from "../../utils/ResourceModal";
import UnitAccordion from "../AddCourse/UnitAccordion";
import ResourceSection from "../EditCourseById/ResourceSection";

const displayValue = (val) => {
  if (val === undefined || val === null || val === "")
    return <span className="text-muted">N/A</span>;
  if (Array.isArray(val))
    return val.length ? val.join(", ") : <span className="text-muted">[]</span>;
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return val.toString();
};

const ReviewCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    variant: "success",
    message: "",
  });
  const [resourceModal, setResourceModal] = useState({
    show: false,
    resource: null,
  });

  const [showResourceModal, setShowResourceModal] = useState(false);
const [selectedResource, setSelectedResource] = useState(null);

// Use the same logic as EditCourseById for resource click
const handleResourceClick = (resource) => {
  if (
    resource.type === "document" &&
    resource.url &&
    resource.url.startsWith("data:application/pdf")
  ) {
    // Convert base64 data URL to Blob for better browser compatibility
    const base64 = resource.url.split(",")[1];
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
    // Optionally revoke after some time
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    return;
  }
   if (
    resource.type === "document" &&
    resource.url &&
    !resource.url.startsWith("data:application/pdf")
  ) {
    const link = document.createElement("a");
    link.href = resource.url;
    link.download =
      resource.fileDetails?.originalName || resource.title || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
  // Video or other resource: open modal
  setSelectedResource(resource);
  setShowResourceModal(true);
};


  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/courses/${id}`);
        setCourse(res.data);
      } catch (err) {
        setAlert({
          show: true,
          variant: "danger",
          message: "Failed to fetch course.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await axios.post(`/api/checker/${id}/approve`, { feedback });
      setAlert({
        show: true,
        variant: "success",
        message: "Course approved and published!",
      });
      setTimeout(() => navigate("/checker-dashboard"), 1200);
    } catch (err) {
      setAlert({
        show: true,
        variant: "danger",
        message: "Failed to approve course.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await axios.post(`/api/checker/${id}/reject`, { feedback });
      setAlert({ show: true, variant: "warning", message: "Course rejected." });
      setTimeout(() => navigate("/checker-dashboard"), 1200);
    } catch (err) {
      setAlert({
        show: true,
        variant: "danger",
        message: "Failed to reject course.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Render resources using ResourceSection in read-only mode
 const renderLessonResources = (unitIndex, lessonIndex, lesson) => (
  <ResourceSection
    unitIndex={unitIndex}
    lessonIndex={lessonIndex}
    lesson={lesson}
    showResourceForm={{ unit: null, lesson: null }}
    setShowResourceForm={() => {}}
    uploadingResource={false}
    handleResourceAdd={() => {}}
    handleRemoveResource={() => {}}
    handleResourceClick={handleResourceClick}
    readOnly
  />
);

  return (
    <Container className="py-5 mt-4">
      <h2 className="mb-4 mt-3">Review Course</h2>
      {alert.show && (
        <Alert
          variant={alert.variant}
          onClose={() => setAlert({ ...alert, show: false })}
          dismissible
        >
          {alert.message}
        </Alert>
      )}
      {loading ? (
        <div className="text-center py-5 min-vh-100">
          <Spinner animation="border" />
        </div>
      ) : course ? (
        <>
          {/* Course Details Table */}
          <Table bordered>
            <tbody>
              <tr>
                <th>Title</th>
                <td>{displayValue(course.title)}</td>
              </tr>
              <tr>
                <th>Description</th>
                <td>{displayValue(course.description)}</td>
              </tr>
              <tr>
                <th>Category</th>
                <td>{displayValue(course.category)}</td>
              </tr>
              <tr>
                <th>Difficulty</th>
                <td>{displayValue(course.difficulty)}</td>
              </tr>
              <tr>
                <th>Instructor</th>
                <td>
                  {course.instructor?.name ||
                    course.instructor?.email ||
                    displayValue(course.instructor)}
                </td>
              </tr>
              <tr>
                <th>Tags</th>
                <td>{displayValue(course.tags)}</td>
              </tr>
              <tr>
                <th>Created At</th>
                <td>
                  {course.createdAt ? (
                    new Date(course.createdAt).toLocaleString()
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
              </tr>
              <tr>
                <th>Status</th>
                <td>
                  <Badge
                    bg={
                      course.approvalStatus === "approved"
                        ? "success"
                        : course.approvalStatus === "pending"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {course.approvalStatus}
                  </Badge>
                </td>
              </tr>
              <tr>
                <th>Published</th>
                <td>
                  {course.published ? (
                    <Badge bg="success">Yes</Badge>
                  ) : (
                    <Badge bg="secondary">No</Badge>
                  )}
                </td>
              </tr>
            </tbody>
          </Table>

          {/* Thumbnail and Certificate */}
          <div className="d-flex flex-wrap gap-4 mb-4">
            <div>
              <h6>Thumbnail</h6>
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt="thumbnail"
                  style={{
                    maxWidth: 180,
                    borderRadius: 8,
                    border: "1px solid #ccc",
                  }}
                />
              ) : (
                <span className="text-muted">N/A</span>
              )}
            </div>
            <div>
              <h6>Certificate Template</h6>
              {course.certificate && course.certificate.templateUrl ? (
                <img
                  src={course.certificate.templateUrl}
                  alt="certificate"
                  style={{
                    maxWidth: 220,
                    borderRadius: 8,
                    border: "1px solid #ccc",
                  }}
                />
              ) : (
                <span className="text-muted">N/A</span>
              )}
            </div>
          </div>

          {/* Units/Lessons/Assignments with resource injection */}
          <h5 className="mb-3">Units</h5>
          {Array.isArray(course.units) && course.units.length > 0 ? (
            <UnitAccordion
              units={course.units}
              // All handlers are no-ops for read-only
              handleAddUnit={() => {}}
              handleRemoveUnit={() => {}}
              handleUnitChange={() => {}}
              handleAddLesson={() => {}}
              handleRemoveLesson={() => {}}
              handleLessonChange={() => {}}
              handleAddAssignmentSet={() => {}}
              handleRemoveAssignmentSet={() => {}}
              handleAssignmentSetChange={() => {}}
              handleAddQuestion={() => {}}
              handleRemoveQuestion={() => {}}
              handleQuestionChange={() => {}}
              renderLessonExtra={renderLessonResources}
              readOnly
            />
          ) : (
            <p className="text-muted">No units found.</p>
          )}

          {/* Feedback and Actions */}
          <Form.Group className="mt-4">
            <Form.Label>Feedback (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add feedback for the Admin (optional)"
            />
          </Form.Group>
          <div className="mt-4">
            <Button
              variant="success"
              disabled={actionLoading}
              className="me-2"
              onClick={handleApprove}
            >
              {actionLoading ? <Spinner size="sm" /> : "Approve & Publish"}
            </Button>
            <Button
              variant="danger"
              disabled={actionLoading}
              onClick={handleReject}
            >
              {actionLoading ? <Spinner size="sm" /> : "Reject"}
            </Button>
          </div>
           <ResourceModal
            resource={selectedResource}
            show={showResourceModal}
            onHide={() => {
              setShowResourceModal(false);
              setSelectedResource(null);
            }}
          />
        </>
      ) : (
        <Alert variant="danger">Course not found.</Alert>
      )}
    </Container>
  );
};

export default ReviewCourse;