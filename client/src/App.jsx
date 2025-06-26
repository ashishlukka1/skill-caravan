import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Home from "./components/Home/Home";
import UserRegistrationForm from "./components/UserLoginDetails/UserLoginDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login/Login";
import Courses from "./components/Courses/Courses";
import CourseDetail from "./components/Courses/CourseDetail";
import MyCourses from "./components/Courses/MyCourses";
import Profile from "./components/Profile/Profile";
import AssignmentQuiz from "./components/Asssignments/Assignment";
import AddCourse from "./components/AddCourse/AddCourse";
import AdminRoute from "./components/AdminRoute";
import EditCourses from "./components/EditCourse/EditCourse";
import EditCourseById from "./components/EditCourseById/EditCourseById";
import MyCertificates from "./components/Certificates/MyCertificates";
import CertificateUploadPage from "./components/Certificates/AddCertificate";
import "./App.css";
import AdminUniversalCertificate from "./components/Certificates/AdminUniversalCertificate";
import ValidateCertificate from "./components/Certificates/ValidateCertificate";
import CheckerDashboard from "./components/CheckerDashboard/CheckerDashboard";
import CheckerRoute from "./components/CheckerRoute";
import ReviewCourse from "./components/CheckerDashboard/ReviewCourse";

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  return (
    <>
      {!isAuthPage && <Navbar />}
      <div className={!isAuthPage ? "page-with-navbar" : ""}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CheckerRoute>
                <Home />
                </CheckerRoute> 
              </ProtectedRoute>
            }
          />
          <Route path="/validate-certificate/:certId" element={<ValidateCertificate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<UserRegistrationForm />} />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id"
            element={
              <ProtectedRoute>
                <CourseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id/assignment/:unitIndex"
            element={
              <ProtectedRoute>
                <AssignmentQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-courses"
            element={
              <ProtectedRoute>
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-certificates"
            element={
              <ProtectedRoute>
                <MyCertificates />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route
            path="/add-course"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AddCourse />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-courses"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <EditCourses />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-courses/:id"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <EditCourseById />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-courses/:id/certificate-upload"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <CertificateUploadPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/universal-certificate"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminUniversalCertificate />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/checker-dashboard" element={<CheckerRoute><CheckerDashboard /></CheckerRoute>} />
          <Route
            path="/review-course/:id"
            element={
              <CheckerRoute>
                <ReviewCourse />
              </CheckerRoute>
            }
            />
        </Routes> 
      </div>
      {!isAuthPage && <Footer />}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
