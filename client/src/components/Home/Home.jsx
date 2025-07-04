import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import { Container, Card, Spinner, Alert, Badge } from "react-bootstrap";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  FaGraduationCap,
  FaCheck,
  FaBookOpen,
  FaTasks,
  FaChevronRight,
  FaPlay,
  FaChevronLeft,
} from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import axios from "../../utils/axios";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "./Home.css";

const defaultThumbnail =
  "https://i.postimg.cc/43Fp6cy7/20250625-1214-Default-Course-Thumbnail-simple-compose-01jyjx8d67fv3r7mnmt1cwgt4v.png";

const bannerImages = [
  "https://u.cubeupload.com/ashishl/bannerforaco17506730.png",
  "https://i.postimg.cc/G2MfBXv7/Level-Up-Your-Career-4.png",
  "https://u.cubeupload.com/ashishl/LevelUpYourCareer3.png",
  "https://u.cubeupload.com/ashishl/LevelUpYourCareer1.png",
];

const statsCards = [
  {
    icon: <FaBookOpen />,
    type: "active",
    label: "Active Courses",
    key: "activeCourses",
    color: "#4f46e5",
  },
  {
    icon: <FaCheck />,
    type: "completed",
    label: "Completed",
    key: "completedCourses",
    color: "#10b981",
  },
  {
    icon: <FaGraduationCap />,
    type: "enrolled",
    label: "Total Enrolled",
    key: "totalEnrolled",
    color: "#f59e0b",
  },
  {
    icon: <FaTasks />,
    type: "assignments",
    label: "Assignments Done",
    key: "submittedAssignments",
    color: "#3b82f6",
  },
];

const CourseCard = ({ enrollment, course, onNavigate }) => {
  const { user } = useContext(AuthContext);
  const courseData = enrollment?.course || course;

  // Check if user is enrolled in this course
  const isEnrolled = !!enrollment;

  const buttonText = enrollment
    ? enrollment.status === "completed"
      ? "Review"
      : "Resume"
    : "Enroll";

  const buttonClass = `btn-horizontal-resume ${
    enrollment
      ? enrollment.status === "completed"
        ? "btn-primary" // blue for Review
        : "btn-success" // green for Resume
      : "btn-outline-primary"
  }`;

  const calculateLastUnit = (enrollment) => {
    if (!enrollment?.unitsProgress?.length) return "Start Course";
    const lastAccessedUnit = enrollment.unitsProgress
      .filter((u) => u?.completed)
      .sort(
        (a, b) =>
          new Date(b?.lastAccessed || 0) - new Date(a?.lastAccessed || 0)
      )[0];
    return lastAccessedUnit
      ? `Unit ${lastAccessedUnit.unitIndex + 1}`
      : "Start Course";
  };

  return (
    <Card className="horizontal-course-card">
      <div className="horizontal-course-image">
        <Card.Img
          variant="top"
          src={courseData?.thumbnail || defaultThumbnail}
          alt={courseData?.title || "Course"}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultThumbnail;
          }}
        />
        <div className="horizontal-course-overlay">
          <Badge className="horizontal-category-badge">
            {courseData?.category || "General"}
          </Badge>
        </div>
      </div>
      <Card.Body className="horizontal-course-body">
        <Card.Title className="horizontal-course-title">
          {courseData?.title || "Untitled Course"}
        </Card.Title>
        <div className="horizontal-course-footer">
          <button
            className={buttonClass}
            onClick={() => onNavigate(courseData?._id)}
            disabled={!courseData?._id}
          >
            <FaPlay className="play-icon" />
            {buttonText}
          </button>
        </div>
      </Card.Body>
    </Card>
  );
};

const HorizontalCourseSlider = ({ courses, title, tabData, onNavigate }) => {
  const [activeTab, setActiveTab] = useState("inProgress");
  const swiperRef = useRef(null);

  const filteredCourses = useMemo(() => {
    return courses.filter((e) =>
      activeTab === "completed"
        ? e.status === "completed"
        : e.status === "active"
    );
  }, [courses, activeTab]);

  return (
    <div className="horizontal-courses-section">
      <div className="horizontal-section-header">
        <h2>{title}</h2>
        <div className="horizontal-navigation">
          <button
            className="nav-arrow nav-prev"
            onClick={() => swiperRef.current?.swiper?.slidePrev()}
          >
            <FaChevronLeft />
          </button>
          <button
            className="nav-arrow nav-next"
            onClick={() => swiperRef.current?.swiper?.slideNext()}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {tabData && (
        <div className="horizontal-tabs-container">
          <div className="horizontal-tabs">
            <button
              className={`horizontal-tab-button ${
                activeTab === "inProgress" ? "active" : ""
              }`}
              onClick={() => setActiveTab("inProgress")}
            >
              In Progress
              <Badge className="horizontal-tab-badge">
                {tabData.activeCourses}
              </Badge>
            </button>
            <button
              className={`horizontal-tab-button ${
                activeTab === "completed" ? "active" : ""
              }`}
              onClick={() => setActiveTab("completed")}
            >
              Completed
              <Badge className="horizontal-tab-badge">
                {tabData.completedCourses}
              </Badge>
            </button>
          </div>
        </div>
      )}

      <div className="horizontal-courses-slider">
        <Swiper
          ref={swiperRef}
          spaceBetween={16}
          slidesPerView="auto"
          navigation={false}
          modules={[Navigation]}
          className="courses-swiper"
          breakpoints={{
            320: {
              slidesPerView: 1.2,
              spaceBetween: 12,
            },
            576: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 16,
            },
            992: {
              slidesPerView: 4,
              spaceBetween: 16,
            },
            1200: {
              slidesPerView: 4,
              spaceBetween: 16,
            },
          }}
        >
          {filteredCourses.length === 0 ? (
            <div className="empty-slider">
              <p>No courses found in this category.</p>
            </div>
          ) : (
            filteredCourses.map((item, index) => (
              <SwiperSlide key={item._id} className="course-slide">
                <CourseCard enrollment={item} onNavigate={onNavigate} />
              </SwiperSlide>
            ))
          )}
        </Swiper>
        {filteredCourses.length > 4 && (
          <div className="fade-overlay-right"></div>
        )}
      </div>
    </div>
  );
};

const Home = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const navigate = useNavigate();

 useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Trigger recurring logic
      await axios.post("/api/users/reassign-recurring");
      // 2. Fetch enrollments
      const enrollmentsResponse = await axios.get("/api/users/enrollments");
      setEnrollments(
        enrollmentsResponse.data?.filter((e) => e?.course) || []
      );
    } catch (err) {
      setError("Failed to load data. Please try again later.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (user?._id) {
    fetchData();
  }
}, [user?._id]);

  const stats = useMemo(
    () => ({
      activeCourses: enrollments.filter((e) => e.status === "active").length,
      completedCourses: enrollments.filter((e) => e.status === "completed")
        .length,
      totalEnrolled: enrollments.length,
      submittedAssignments: enrollments.reduce(
        (acc, curr) =>
          acc +
          (curr.unitsProgress?.filter(
            (u) => u?.assignment?.status === "submitted"
          )?.length || 0),
        0
      ),
    }),
    [enrollments]
  );

  const handleNavigate = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  if (!user) {
    return (
      <Container className="mt-5">
        <Alert variant="info">Please login to view your dashboard.</Alert>
      </Container>
    );
  }

  return (
    <div className="home-container min-vh-100">
      {/* Full-width Banner Section */}
      <div className="banner-section">
        <Swiper
          slidesPerView={1}
          spaceBetween={0}
          centeredSlides={true}
          loop={true}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            el: ".swiper-pagination",
          }}
          modules={[Autoplay, Pagination]}
          className="banner-slider"
        >
          {bannerImages.map((image, index) => (
            <SwiperSlide key={index}>
              <img src={image} alt={`Banner ${index + 1}`} />
            </SwiperSlide>
          ))}
          <div className="swiper-pagination"></div>
        </Swiper>
      </div>

      <Container className="dashboard-container">
        <div className="dashboard-content">
          {/* Stats Section */}
          <div className="stats-section">
            {statsCards.map(({ icon, type, label, key, color }) => (
              <Card key={key} className={`stat-card ${type}`}>
                <Card.Body>
                  <div className="stat-icon" style={{ color }}>
                    {icon}
                  </div>
                  <div className="stat-info">
                    <h3>{stats[key]}</h3>
                    <p>{label}</p>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="loading-state">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <>
              {/* My Learning Section */}
              <HorizontalCourseSlider
                courses={enrollments}
                title="My Learnings"
                tabData={stats}
                onNavigate={handleNavigate}
              />
            </>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Home;
