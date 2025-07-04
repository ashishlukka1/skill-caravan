import { Modal } from "react-bootstrap";
import { FaFile } from "react-icons/fa";

const ResourceModal = ({ resource, show, onHide }) => {
  if (!resource) return null;
  const isVideo =
    resource.type === "video_file" || resource.type === "video_url";
  const isYouTubeUrl = (url) =>
    url.includes("youtube.com") || url.includes("youtu.be");
  const getYouTubeEmbedUrl = (url) => {
    if (url.includes("youtube.com")) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (url.includes("youtu.be")) {
      const videoId = url.split("/").pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      dialogClassName="resource-video-modal"
      backdrop={isVideo ? "static" : true}
      keyboard={!isVideo ? true : false}
      style={{ maxWidth: "98vw" }}
    >
      <Modal.Header closeButton>
        <Modal.Title>{resource.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body
        style={{
          padding: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 0,
          background: "#0001",
        }}
      >
        {resource.type === "video_url" && (
          <div style={{ width: "100%", maxWidth: "900px", aspectRatio: "16/9", margin: "auto" }}>
            <iframe
              src={
                isYouTubeUrl(resource.url)
                  ? getYouTubeEmbedUrl(resource.url)
                  : resource.url
              }
              title={resource.title}
              allowFullScreen
              style={{
                border: 0,
                width: "100%",
                height: "100%",
                minHeight: 320,
                background: "#000",
              }}
            ></iframe>
          </div>
        )}
        {resource.type === "video_file" && resource.url && (
          <div style={{ width: "100%", maxWidth: "900px", aspectRatio: "16/9", margin: "auto", display: "flex", justifyContent: "center" }}>
            <video
              style={{
                width: "100%",
                height: "100%",
                maxHeight: "70vh",
                borderRadius: 8,
                background: "#000",
              }}
              controls
            >
              <source
                src={resource.url}
                type={resource.fileDetails?.contentType || "video/mp4"}
              />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        {resource.type === "document" &&
          resource.url &&
          !resource.url.startsWith("data:application/pdf") && (
            <a
              href={resource.url}
              download={resource.fileDetails?.originalName || resource.title}
              className="btn btn-primary m-4"
            >
              <FaFile className="me-2" />
              Download Document
            </a>
          )}
        {resource.type === "document_url" && (
          <div className="text-center w-100 my-4">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <FaFile className="me-2" />
              Open Document
            </a>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ResourceModal;