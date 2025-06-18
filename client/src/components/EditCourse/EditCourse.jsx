import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import './EditCourse.css'; 

const EditCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/courses');
        setCourses(response.data);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="py-4 edit-courses">
      <h2 className="mb-4">Edit Courses</h2>
      
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>

      <Table responsive className='table-striped'>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Students</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCourses.map(course => (
            <tr key={course._id}>
              <td>{course.title}</td>
              <td>{course.category}</td>
              <td>{course.studentsEnrolled?.length || 0}</td>
              <td>{new Date(course.createdAt).toLocaleDateString()}</td>
              <td>
                <Button
                variant="outline-primary"
                size="sm"
                className="action-btn"
                onClick={() => navigate(`/edit-courses/${course._id}`)}  // Make sure this matches the route path
                >
                Edit
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default EditCourses;