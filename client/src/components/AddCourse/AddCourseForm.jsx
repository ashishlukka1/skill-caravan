import { Form, Card, Row, Col } from "react-bootstrap";

const AddCourseForm = ({
  course,
  handleBasicInfoChange,
  handleCourseThumbnailChange,
  setCourse,
}) => (
  <Card className="mb-4 shadow-sm">
    <Card.Body>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              name="title"
              value={course.title}
              onChange={handleBasicInfoChange}
              required
              placeholder="Course Title"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Select
              name="category"
              value={course.category}
              onChange={handleBasicInfoChange}
            >
              <option>Web Development</option>
              <option>Data Science</option>
              <option>AI/ML</option>
              <option>Cloud</option>
              <option>Cybersecurity</option>
              <option>Finance</option>
              <option>HR</option>
              <option>Marketing</option>
              <option>DevOps</option>
              <option>Design</option>
              <option>Other</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Difficulty</Form.Label>
            <Form.Select
              name="difficulty"
              value={course.difficulty}
              onChange={handleBasicInfoChange}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Tags (comma separated)</Form.Label>
            <Form.Control
              name="tags"
              value={course.tags.join(",")}
              onChange={(e) =>
                setCourse((prev) => ({
                  ...prev,
                  tags: e.target.value.split(",").map((t) => t.trim()),
                }))
              }
              placeholder="e.g. javascript, react, backend"
            />
          </Form.Group>
        </Col>
      </Row>
      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          name="description"
          value={course.description}
          onChange={handleBasicInfoChange}
          required
          rows={3}
          placeholder="Course Description"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Course Thumbnail</Form.Label>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={(e) => handleCourseThumbnailChange(e.target.files[0])}
        />
        {course.thumbnail && (
          <div className="mt-2">
            <img
              src={course.thumbnail}
              alt="Course Thumbnail"
              style={{ maxWidth: "200px", maxHeight: "120px" }}
            />
          </div>
        )}
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Assign to all new Employees by default"
          checked={course.isDefault}
          onChange={(e) =>
            setCourse((prev) => ({
              ...prev,
              isDefault: e.target.checked,
            }))
          }
        />
      </Form.Group>
    </Card.Body>
  </Card>
);

export default AddCourseForm;