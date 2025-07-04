import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../utils/axios";
import { fileToBase64 } from "../../utils/fileBase64";

export const useEditCourseById = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [course, setCourse] = useState(null);
  const [showResourceForm, setShowResourceForm] = useState({ unit: null, lesson: null });
  const [uploadingResource, setUploadingResource] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Fetch course
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axios.get(`/api/courses/${id}`);
        const courseData = response.data;
        setCourse({
          ...courseData,
          tags: courseData.tags || [],
          units: (courseData.units || []).map((unit) => ({
            ...unit,
            lessons: (unit.lessons || []).map((lesson) => ({
              ...lesson,
              resources: lesson.resources || [],
            })),
            assignment: unit.assignment || { assignmentSets: [] },
          })),
        });
      } catch (err) {
        setError("Error loading course");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  // Handlers
  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setCourse((prev) => ({
      ...prev,
      [name]: name === "tags" ? value.split(",").map((t) => t.trim()) : value,
    }));
  };

  const handleCourseThumbnailChange = async (file) => {
    if (!file) return;
    const base64 = await fileToBase64(file);
    setCourse((prev) => ({
      ...prev,
      thumbnail: base64,
    }));
  };

  const handleAddUnit = () => {
    setCourse((prev) => ({
      ...prev,
      units: [
        ...prev.units,
        { title: "", lessons: [], assignment: { assignmentSets: [] } },
      ],
    }));
  };

  const handleRemoveUnit = (index) => {
    setCourse((prev) => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== index),
    }));
  };

  const handleUnitChange = (unitIndex, field, value) => {
    setCourse((prev) => ({
      ...prev,
      units: prev.units.map((unit, idx) =>
        idx === unitIndex ? { ...unit, [field]: value } : unit
      ),
    }));
  };

  const handleAddLesson = (unitIndex) => {
    setCourse((prev) => ({
      ...prev,
      units: prev.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              lessons: [
                ...unit.lessons,
                { title: "", content: "", videoUrl: "", duration: 0, resources: [] },
              ],
            }
          : unit
      ),
    }));
  };

  const handleRemoveLesson = (unitIndex, lessonIndex) => {
    setCourse((prev) => ({
      ...prev,
      units: prev.units.map((unit, idx) =>
        idx === unitIndex
          ? { ...unit, lessons: unit.lessons.filter((_, i) => i !== lessonIndex) }
          : unit
      ),
    }));
  };

  const handleLessonChange = (unitIndex, lessonIndex, field, value) => {
    setCourse((prev) => ({
      ...prev,
      units: prev.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              lessons: unit.lessons.map((lesson, lidx) =>
                lidx === lessonIndex ? { ...lesson, [field]: value } : lesson
              ),
            }
          : unit
      ),
    }));
  };

  const handleAddAssignmentSet = (unitIndex) => {
    setCourse((prev) => ({
      ...prev,
      units: prev.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: [
                  ...unit.assignment.assignmentSets,
                  {
                    setNumber: unit.assignment.assignmentSets.length + 1,
                    title: "",
                    description: "",
                    difficulty: "easy",
                    questions: [],
                  },
                ],
              },
            }
          : unit
      ),
    }));
  };

  const handleRemoveAssignmentSet = (unitIndex, setIndex) => {
    setCourse((prev) => ({
      ...prev,
      units: prev.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.filter(
                  (_, i) => i !== setIndex
                ),
              },
            }
          : unit
      ),
    }));
  };

  const handleAssignmentSetChange = (unitIndex, setIndex, field, value) => {
    setCourse((prev) => ({
      ...prev,
      units: prev.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.map(
                  (set, sidx) =>
                    sidx === setIndex ? { ...set, [field]: value } : set
                ),
              },
            }
          : unit
      ),
    }));
  };

  const handleAddQuestion = (unitIndex, setIndex = null) => {
    setCourse((prev) => ({
      ...prev,
      units: prev.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.map(
                  (set, sidx) =>
                    sidx === setIndex
                      ? {
                          ...set,
                          questions: [
                            ...set.questions,
                            {
                              questionText: "",
                              options: ["", "", "", ""],
                              correctAnswer: "0",
                              marks: 1,
                            },
                          ],
                        }
                      : set
                ),
              },
            }
          : unit
      ),
    }));
  };

  const handleRemoveQuestion = (unitIndex, questionIndex, setIndex = null) => {
    setCourse((prev) => ({
      ...prev,
      units: prev.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.map(
                  (set, sidx) =>
                    sidx === setIndex
                      ? {
                          ...set,
                          questions: set.questions.filter(
                            (_, qidx) => qidx !== questionIndex
                          ),
                        }
                      : set
                ),
              },
            }
          : unit
      ),
    }));
  };

  const handleQuestionChange = (
    unitIndex,
    questionIndex,
    field,
    value,
    setIndex = null
  ) => {
    setCourse((prev) => ({
      ...prev,
      units: prev.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.map(
                  (set, sidx) =>
                    sidx === setIndex
                      ? {
                          ...set,
                          questions: set.questions.map((q, qidx) =>
                            qidx === questionIndex
                              ? { ...q, [field]: value }
                              : q
                          ),
                        }
                      : set
                ),
              },
            }
          : unit
      ),
    }));
  };

  const handleResourceAdd = async (unitIndex, lessonIndex, formData) => {
    try {
      setUploadingResource(true);
      const response = await axios.post(
        `/api/courses/${id}/units/${unitIndex}/lessons/${lessonIndex}/resources`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setCourse((prev) => {
        const updated = { ...prev };
        updated.units = updated.units.map((unit, uidx) =>
          uidx === unitIndex
            ? {
                ...unit,
                lessons: unit.lessons.map((lesson, lidx) =>
                  lidx === lessonIndex
                    ? {
                        ...lesson,
                        resources: [
                          ...(lesson.resources || []),
                          response.data.resource,
                        ],
                      }
                    : lesson
                ),
              }
            : unit
        );
        return updated;
      });
      return response.data;
    } catch (err) {
      alert("Failed to upload resource");
      throw err;
    } finally {
      setUploadingResource(false);
    }
  };

  const handleRemoveResource = (unitIndex, lessonIndex, resourceIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, uidx) =>
        uidx === unitIndex
          ? {
              ...unit,
              lessons: unit.lessons.map((lesson, lidx) =>
                lidx === lessonIndex
                  ? {
                      ...lesson,
                      resources: lesson.resources.filter(
                        (_, ridx) => ridx !== resourceIndex
                      ),
                    }
                  : lesson
              ),
            }
          : unit
      );
      return updated;
    });
  };

  const handleResourceClick = (resource, unitIdx, lessonIdx, resourceIdx) => {
    const isPdf =
      resource.type === "document" &&
      resource.url &&
      resource.url.startsWith("data:application/pdf");
    if (isPdf) {
      const base64 = resource.url.split(",")[1];
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, "_blank");
      if (win) {
        win.onload = () => {
          win.document.title = resource.title || "Document";
        };
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } else if (resource.type === "document" && resource.url) {
      const link = document.createElement("a");
      link.href = resource.url;
      link.download =
        resource.fileDetails?.originalName || resource.title || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (
      resource.type === "video_url" ||
      resource.type === "video_file"
    ) {
      setSelectedResource({ ...resource, unitIdx, lessonIdx, resourceIdx });
      setShowResourceModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setAlertMessage("");
    try {
      const totalDuration = (course.units || []).reduce((total, unit) => {
        return (
          total +
          (unit.lessons || []).reduce(
            (sum, lesson) => sum + (parseInt(lesson.duration) || 0),
            0
          )
        );
      }, 0);

      const updateData = {
        ...course,
        duration: totalDuration,
        units: (course.units || []).map((unit) => ({
          ...unit,
          lessons: (unit.lessons || []).map((lesson) => ({
            ...lesson,
            duration: parseInt(lesson.duration) || 0,
          })),
          assignment: {
            assignmentSets: (unit.assignment?.assignmentSets || []).map(
              (set, idx) => ({
                setNumber: idx + 1,
                title: set.title,
                description: set.description,
                difficulty: set.difficulty,
                questions: (set.questions || []).map((q) => ({
                  questionText: q.questionText,
                  options: (q.options || []).filter((opt) => opt.trim()),
                  correctAnswer: q.correctAnswer,
                  marks: parseInt(q.marks) || 1,
                })),
              })
            ),
          },
        })),
      };

      setLoading(true);
      setAlertMessage("Saving changes...");
      setShowSuccessAlert(true);

      await axios.put(`/api/courses/${id}`, updateData);

      setSuccess("Course updated successfully!");
      setAlertMessage("Course updated successfully!");
      setShowSuccessAlert(true);
      setTimeout(() => {
        navigate("/edit-courses");
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Error updating course";
      setError(msg);
      setAlertMessage(msg);
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    success,
    course,
    setCourse,
    showResourceForm,
    setShowResourceForm,
    uploadingResource,
    selectedResource,
    setSelectedResource,
    showResourceModal,
    setShowResourceModal,
    showSuccessAlert,
    setShowSuccessAlert,
    showErrorAlert,
    setShowErrorAlert,
    alertMessage,
    setAlertMessage,
    handleBasicInfoChange,
    handleCourseThumbnailChange,
    handleAddUnit,
    handleRemoveUnit,
    handleUnitChange,
    handleAddLesson,
    handleRemoveLesson,
    handleLessonChange,
    handleAddAssignmentSet,
    handleRemoveAssignmentSet,
    handleAssignmentSetChange,
    handleAddQuestion,
    handleRemoveQuestion,
    handleQuestionChange,
    handleResourceAdd,
    handleRemoveResource,
    handleResourceClick,
    handleSubmit,
  };
};