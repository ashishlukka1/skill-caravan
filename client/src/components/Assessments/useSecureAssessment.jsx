import { useState, useEffect, useRef } from "react";
import axios from "../../utils/axios";
import { useParams } from "react-router-dom";

const MAX_VIOLATIONS = 3;

export function useSecureAssessment({ submitted = false } = {}) {
  const { id: courseId, unitIndex } = useParams();
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const violationRef = useRef(0);

   useEffect(() => {
    if (submitted) {
      // Optionally reset state or remove listeners if needed
      setAssessmentStarted(false);
      setShowViolationModal(false);
      setBlocked(false);
      setViolationCount(0);
    }
  }, [submitted]);

  useEffect(() => {
        if (submitted) return; 
    if (!assessmentStarted || blocked) return;
    async function fetchBlockStatus() {
      try {
        const res = await axios.get(`/api/progress/${courseId}/unit/${unitIndex}/block-status`);
        setViolationCount(res.data.violationCount || 0);
        violationRef.current = res.data.violationCount || 0;
        setBlocked(res.data.blocked || false);
      } catch {}
    }
    fetchBlockStatus();
   }, [assessmentStarted, blocked, courseId, unitIndex, submitted]);

     const disableSecureMode = () => {
    setAssessmentStarted(false);
    setShowViolationModal(false);
    setBlocked(false);
    setViolationCount(0);
  };


  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
  };

  useEffect(() => {
    if (!assessmentStarted || blocked) return;

    const handleViolation = async () => {
      try {
        const res = await axios.post(`/api/progress/${courseId}/unit/${unitIndex}/violation`);
        violationRef.current = res.data.violationCount;
        setViolationCount(res.data.violationCount);
        setBlocked(res.data.blocked);
        setShowViolationModal(true);
      } catch {}
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) handleViolation();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") handleViolation();
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [assessmentStarted, blocked, courseId, unitIndex]);

  const attemptsLeft = Math.max(0, MAX_VIOLATIONS - violationCount);

  return {
    MAX_VIOLATIONS,
    assessmentStarted,
    setAssessmentStarted,
    violationCount,
    blocked,
    showViolationModal,
    setShowViolationModal,
    enterFullScreen,
    disableSecureMode,
    attemptsLeft,
  };
}