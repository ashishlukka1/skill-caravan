import axios from "../../../utils/axios";

export const fetchCourseAndProgress = async (
  id,
  user,
  setCourse,
  setProgress,
  setIsEnrolled,
  setError,
  setLoading
) => {
  setLoading(true);
  setError("");
  try {
    const courseRes = await axios.get(`/api/courses/${id}`);
    setCourse(courseRes.data);

    if (user) {
      const isUserEnrolled = courseRes.data.studentsEnrolled.includes(user._id);
      setIsEnrolled(isUserEnrolled);

      if (isUserEnrolled) {
        try {
          const progressRes = await axios.get(`/api/progress/${id}`);
          setProgress(progressRes.data);
        } catch (progressErr) {
          setError("Error fetching progress");
        }
      }
    } else {
      setIsEnrolled(false);
    }
  } catch (err) {
    setError("Failed to load course details");
  } finally {
    setLoading(false);
  }
};

export const handleEnroll = async (
  id,
  user,
  navigate,
  setEnrolling,
  setProgress,
  setIsEnrolled,
  setCourse,
  setAlertType,
  setAlertMsg,
  setShowAlert
) => {
  if (!user) {
    navigate("/login");
    return;
  }
  setEnrolling(true);
  try {
    const enrollRes = await axios.post(`/api/courses/${id}/enroll`);
    if (enrollRes.data.enrollment) {
      setProgress(enrollRes.data.enrollment);
      setIsEnrolled(true);
      const courseRes = await axios.get(`/api/courses/${id}`);
      setCourse(courseRes.data);
      setAlertType("success");
      setAlertMsg("Successfully enrolled in course!");
      setShowAlert(true);
    }
  } catch (err) {
    const errorMessage =
      err.response?.data?.message || "Failed to enroll in course";
    setAlertType("error");
    setAlertMsg(errorMessage);
    setShowAlert(true);
  } finally {
    setEnrolling(false);
  }
};

export const handleLessonComplete = async (
  id,
  unitIdx,
  lessonIdx,
  isEnrolled,
  setMarkingLesson,
  setProgress,
  setAlertType,
  setAlertMsg,
  setShowAlert
) => {
  if (!isEnrolled) return;
  setMarkingLesson((prev) => ({
    ...prev,
    [`${unitIdx}-${lessonIdx}`]: true,
  }));
  try {
    await axios.post(
      `/api/progress/${id}/unit/${unitIdx}/lesson/${lessonIdx}`,
      { completed: true }
    );
    const progressRes = await axios.get(`/api/progress/${id}`);
    setProgress(progressRes.data);
    setAlertType("success");
    setAlertMsg("Lesson marked as complete!");
    setShowAlert(true);
  } catch (err) {
    setAlertType("error");
    setAlertMsg("Failed to update lesson progress");
    setShowAlert(true);
  } finally {
    setMarkingLesson((prev) => ({
      ...prev,
      [`${unitIdx}-${lessonIdx}`]: false,
    }));
  }
};

export const handleAssignmentStart = async (
  id,
  course,
  unitIdx,
  isEnrolled,
  setAlertType,
  setAlertMsg,
  setShowAlert,
  setProgress
) => {
  if (!isEnrolled) return;
  try {
    const unit = course.units[unitIdx];
    const assignmentSets = unit.assignment?.assignmentSets;
    if (!assignmentSets?.length) {
      setAlertType("error");
      setAlertMsg("No assignment sets available");
      setShowAlert(true);
      return;
    }
    const randomSetNumber =
      assignmentSets.length === 1
        ? assignmentSets[0].setNumber
        : assignmentSets[Math.floor(Math.random() * assignmentSets.length)]
            .setNumber;

    const response = await axios.post(
      `/api/progress/${id}/unit/${unitIdx}/assign-set`,
      { setNumber: randomSetNumber }
    );
    setProgress(response.data);
    setAlertType("success");
    setAlertMsg("Assignment started!");
    setShowAlert(true);
  } catch (err) {
    setAlertType("error");
    setAlertMsg("Failed to assign assignment set");
    setShowAlert(true);
  }
};
