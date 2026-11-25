
import { useRef, useState } from "react";
import api from "../api";

interface UploadPaperProps {
    onUploadSuccess: () => void;
}

function UploadPaper({ onUploadSuccess }: UploadPaperProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectFile = (selectedFile?: File) => {
        if (!selectedFile) return;

        if (
            selectedFile.type !== "application/pdf" &&
            !selectedFile.name.toLowerCase().endsWith(".pdf")
        ) {
            setMessage("Please select a PDF file.");
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setMessage("File size must be less than 10 MB.");
            return;
        }

        setFile(selectedFile);
        setMessage("");
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage("Please select a PDF first.");
            return;
        }

        const formData = new FormData();
        formData.append("paper", file);

        try {
            setUploading(true);
            setMessage("");

            await api.post("/papers/upload", formData);

            setMessage("Your research paper was uploaded successfully.");
            setFile(null);

            if (inputRef.current) {
                inputRef.current.value = "";
            }

            onUploadSuccess();
        } catch (error) {
            console.error("Upload error:", error);
            setMessage("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-card">
            <div
                className={`drop-zone ${dragging ? "dragging" : ""}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    selectFile(e.dataTransfer.files[0]);
                }}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        inputRef.current?.click();
                    }
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    hidden
                    onChange={(e) => selectFile(e.target.files?.[0])}
                />

                <div className="upload-icon">↑</div>

                <h3>
                    {file ? file.name : "Drop your research paper here"}
                </h3>

                <p>
                    {file
                        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · PDF`
                        : "or click to browse files from your device"}
                </p>

                <span className="file-requirement">
                    PDF FORMAT · MAXIMUM 10 MB
                </span>
            </div>

            <div className="upload-bottom">
                <p>We'll store your paper in your personal research library.</p>

                <button
                    className="primary-button"
                    onClick={handleUpload}
                    disabled={!file || uploading}
                >
                    {uploading ? "Uploading..." : "Upload paper ↗"}
                </button>
            </div>

            {message && (
                <p className={`upload-message ${
                    message.includes("successfully") ? "success" : "error"
                }`}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default UploadPaper;
