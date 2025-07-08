import React, { useState, useEffect } from "react";
import { Modal, Form, Spinner, Badge, Button } from "react-bootstrap";
import axios from "../../utils/axios";

const AssignmentModal = ({
  show,
  onHide,
  course,
  onAssignResult,
  loading,
}) => {
  const [assignmentType, setAssignmentType] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search users with debouncing
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setUserResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await axios.get(`/api/users/search?q=${query}`);
      setUserResults(response.data);
    } catch (err) {
      setUserResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && assignmentType === "user") {
        searchUsers(searchQuery);
      } else {
        setUserResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, assignmentType]);

  useEffect(() => {
    if (!show) {
      setAssignmentType("");
      setSelectedUsers([]);
      setSelectedTeam("");
      setSearchQuery("");
      setUserResults([]);
    }
  }, [show]);

  const handleAssignSubmit = async () => {
    if (  
      !assignmentType ||
      (assignmentType === "user" && selectedUsers.length === 0) ||
      (assignmentType === "team" && !selectedTeam)
    ) {
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`/api/courses/${course._id}/assign`, {
        type: assignmentType,
        users: assignmentType === "user" ? selectedUsers : [],
        team: assignmentType === "team" ? selectedTeam : null,
      });
      onHide();
      onAssignResult({ success: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Assignment failed";
      onAssignResult({ success: false, message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled =
    !assignmentType ||
    (assignmentType === "user" && selectedUsers.length === 0) ||
    (assignmentType === "team" && !selectedTeam) ||
    submitting;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title style={{ fontSize: "1.25rem", fontWeight: "600" }}>
          Assign Course
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 py-3">
        <div className="mb-3">
          <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
            Assign "{course?.title}" to users or teams
          </p>
        </div>
        <Form>
          <Form.Group className="mb-4">
            <Form.Label className="fw-medium mb-2">Assignment Type</Form.Label>
            <Form.Select
              value={assignmentType}
              onChange={(e) => {
                setAssignmentType(e.target.value);
                setSelectedUsers([]);
                setSelectedTeam("");
                setSearchQuery("");
                setUserResults([]);
              }}
              style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}
            >
              <option value="">Choose assignment type</option>
              <option value="user">Assign to Users</option>
              <option value="team">Assign to Team</option>
            </Form.Select>
          </Form.Group>
          {assignmentType === "user" && (
            <div className="user-assignment-section">
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium mb-2">Search Users</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name or employee ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}
                />
              </Form.Group>
              {searchLoading ? (
                <div className="text-center mb-3 py-3">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <span className="ms-2 text-muted">Searching...</span>
                </div>
              ) : (
                <div
                  className="user-results mb-3"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                >
                  {userResults.map((user) => (
                    <div
                      key={user._id}
                      className="user-result-item p-3 border-bottom"
                      style={{ backgroundColor: "#f8f9fa" }}
                    >
                      <Form.Check
                        type="checkbox"
                        id={`user-${user._id}`}
                        label={`${user.name} (${user.employeeId || "N/A"})`}
                        checked={selectedUsers.includes(user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user._id]);
                          } else {
                            setSelectedUsers(
                              selectedUsers.filter((id) => id !== user._id)
                            );
                          }
                        }}
                      />
                    </div>
                  ))}
                  {searchQuery && userResults.length === 0 && !searchLoading && (
                    <div className="text-muted text-center p-3">
                      No users found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
              {selectedUsers.length > 0 && (
                <div className="selected-users-count mb-3">
                  <Badge bg="primary" style={{ fontSize: "0.85rem" }}>
                    {selectedUsers.length} user
                    {selectedUsers.length !== 1 ? "s" : ""} selected
                  </Badge>
                </div>
              )}
            </div>
          )}
          {assignmentType === "team" && (
            <Form.Group className="mb-4">
              <Form.Label className="fw-medium mb-2">Select Team</Form.Label>
              <Form.Select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}
              >
                <option value="">Choose a team</option>
                <option value="Engineering-dev">Engineering Dev</option>
                <option value="Engineering-Support">Engineering Support</option>
                <option value="IT">IT</option>
                <option value="Administration">Administration</option>
                <option value="Accounts">Accounts</option>
                <option value="Management">Management</option>
                <option value="HR">HR</option>
              </Form.Select>
            </Form.Group>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button
          variant="light"
          onClick={onHide}
          disabled={submitting}
          style={{ borderRadius: "8px", paddingX: "20px" }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAssignSubmit}
          disabled={isSubmitDisabled}
          style={{ borderRadius: "8px", paddingX: "20px" }}
        >
          {submitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Assigning...
            </>
          ) : (
            "Assign Course"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AssignmentModal;