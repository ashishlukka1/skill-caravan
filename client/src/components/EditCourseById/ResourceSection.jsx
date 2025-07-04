import React from "react";
import { Button, Badge } from "react-bootstrap";
import { FaPlus, FaTrash, FaFileAlt, FaFile, FaPlay } from "react-icons/fa";
import ResourceForm from "./ResourceForm";

const ResourceSection = ({
  unitIndex,
  lessonIndex,
  lesson,
  showResourceForm,
  setShowResourceForm,
  uploadingResource,
  handleResourceAdd,
  handleRemoveResource,
  handleResourceClick,
  readOnly, // <-- add this prop
}) => (
  <div className="resources-section">
    <div className="d-flex justify-content-between align-items-center mb-2">
      <h6>Resources</h6>
      {!readOnly &&
        (showResourceForm.unit !== unitIndex ||
          showResourceForm.lesson !== lessonIndex) ? (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() =>
            setShowResourceForm({ unit: unitIndex, lesson: lessonIndex })
          }
          disabled={uploadingResource}
        >
          <FaPlus className="me-1" /> Add Resource
        </Button>
      ) : null}
    </div>
    {(lesson.resources || []).length > 0 ? (
      <div className="resources-list">
        {lesson.resources.map((resource, resourceIndex) => (
          <div
            key={resourceIndex}
            className="resource-item d-flex align-items-center mb-2"
          >
            <Badge
              bg={
                resource.type === "video_url"
                  ? "primary"
                  : resource.type === "video_file"
                  ? "success"
                  : "secondary"
              }
            >
              {resource.type === "video_url"
                ? "Video URL"
                : resource.type === "video_file"
                ? "Video File"
                : "Document"}
            </Badge>
            <span className="resource-title ms-2">
              {resource.title || ""}
            </span>
            {!readOnly && (
              <Button
                variant="outline-danger"
                size="sm"
                className="btn-remove ms-2"
                onClick={() =>
                  handleRemoveResource(unitIndex, lessonIndex, resourceIndex)
                }
              >
                <FaTrash />
              </Button>
            )}
            <Button
              key={resourceIndex}
              variant="outline-secondary"
              size="sm"
              className="ms-2"
              onClick={() =>
                handleResourceClick(
                  resource,
                  unitIndex,
                  lessonIndex,
                  resourceIndex
                )
              }
            >
              {(resource.type === "video_url" ||
                resource.type === "video_file") && <FaPlay className="me-1" />}
              {(resource.type === "document" ||
                resource.type === "document_url") && (
                <FaFile className="me-1" />
              )}
              {resource.title}
            </Button>
          </div>
        ))}
      </div>
    ) : (
      <div className="resources-empty">
        <FaFileAlt className="mb-2" size={24} />
        <p className="mb-0">No resources added yet</p>
      </div>
    )}
    {!readOnly &&
      showResourceForm.unit === unitIndex &&
      showResourceForm.lesson === lessonIndex && (
        <ResourceForm
          unitIndex={unitIndex}
          lessonIndex={lessonIndex}
          onSubmit={handleResourceAdd}
          onCancel={() =>
            setShowResourceForm({
              unit: null,
              lesson: null,
            })
          }
        />
      )}
  </div>
);

export default ResourceSection;