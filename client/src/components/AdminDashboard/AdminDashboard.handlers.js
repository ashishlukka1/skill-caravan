import { useEffect, useState, useRef } from "react";
import axios from "../../utils/axios";

export const useAdminDashboardHandlers = () => {
  const [courses, setCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState(
    localStorage.getItem("admin_courseSearch") || ""
  );
  const [showCourseResults, setShowCourseResults] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(
    localStorage.getItem("admin_selectedCourseId") || ""
  );
  const [selectedCourseTitle, setSelectedCourseTitle] = useState(
    localStorage.getItem("admin_selectedCourseTitle") || ""
  );
  const [enrollments, setEnrollments] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState(
    localStorage.getItem("admin_employeeSearch") || ""
  );
  const [filterType, setFilterType] = useState(
    localStorage.getItem("admin_filterType") || "all"
  );
  const [filterStatus, setFilterStatus] = useState(
    localStorage.getItem("admin_filterStatus") || "all"
  );
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    variant: "danger",
  });

  const courseSearchRef = useRef(null);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem("admin_courseSearch", courseSearch);
  }, [courseSearch]);
  useEffect(() => {
    localStorage.setItem("admin_selectedCourseId", selectedCourseId);
  }, [selectedCourseId]);
  useEffect(() => {
    localStorage.setItem("admin_selectedCourseTitle", selectedCourseTitle);
  }, [selectedCourseTitle]);
  useEffect(() => {
    localStorage.setItem("admin_employeeSearch", employeeSearch);
  }, [employeeSearch]);
  useEffect(() => {
    localStorage.setItem("admin_filterType", filterType);
  }, [filterType]);
  useEffect(() => {
    localStorage.setItem("admin_filterStatus", filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/courses?status=approved")
      .then((res) => setCourses(res.data.courses))
      .catch(() =>
        setAlert({
          show: true,
          message: "Failed to fetch courses",
          variant: "danger",
        })
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setEnrollments([]);
      return;
    }
    setLoading(true);
    axios
      .get(`/api/courses/${selectedCourseId}/enrollments`)
      .then((res) => setEnrollments(res.data.enrollments))
      .catch(() =>
        setAlert({
          show: true,
          message: "Failed to fetch enrollments",
          variant: "danger",
        })
      )
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredEnrollments = enrollments.filter(
    (enr) =>
      (enr.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        (enr.employeeId &&
          enr.employeeId
            .toLowerCase()
            .includes(employeeSearch.toLowerCase()))) &&
      (filterType === "all" ||
        (filterType === "admin" && enr.assignedByAdmin) ||
        (filterType === "self" && !enr.assignedByAdmin)) &&
      (filterStatus === "all" || (enr.status && enr.status === filterStatus))
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        courseSearchRef.current &&
        !courseSearchRef.current.contains(event.target)
      ) {
        setShowCourseResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCourseSelect = (course) => {
    setSelectedCourseId(course._id);
    setSelectedCourseTitle(course.title);
    setCourseSearch(course.title);
    setShowCourseResults(false);
  };

  const handleCourseSearchChange = (e) => {
    setCourseSearch(e.target.value);
    setShowCourseResults(true);
    setSelectedCourseId(""); // Reset selection if typing
    setSelectedCourseTitle("");
  };

  return {
    courses,
    courseSearch,
    setCourseSearch,
    showCourseResults,
    setShowCourseResults,
    selectedCourseId,
    setSelectedCourseId,
    selectedCourseTitle,
    setSelectedCourseTitle,
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
  };
};