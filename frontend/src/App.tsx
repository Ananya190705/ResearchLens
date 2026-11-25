import { useState } from "react";
import UploadPaper from "./components/UploadPaper";
import ExplorePapers from "./components/ExplorePapers";
import PaperList from "./components/PaperList";
import "./index.css";

type Tab = "Dashboard" | "Upload" | "Explore" | "Library" | "Compare";

function App() {
    const [activeTab, setActiveTab] = useState<Tab>("Dashboard");
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUploadSuccess = () => {
        setRefreshKey((previous) => previous + 1);
    };

    const tabs: Tab[] = ["Dashboard", "Upload", "Explore", "Library", "Compare"];

    return (
        <div className="app dashboard-app">
            <header className="dashboard-navbar">
                <a
                    href="#home"
                    className="logo"
                    onClick={(event) => {
                        event.preventDefault();
                        setActiveTab("Dashboard");
                    }}
                >
                    ResearchLens<span>.</span>
                </a>

                <nav className="dashboard-nav">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            className={`nav-tab ${activeTab === tab ? "active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>

                <span className="nav-tag">AI RESEARCH ASSISTANT</span>
            </header>

            <main className="dashboard-main">
                {activeTab === "Dashboard" && (
                    <section className="dashboard-home">
                        <p className="dashboard-eyebrow">YOUR AI RESEARCH WORKSPACE</p>
                        <h1>Research smarter.<br /><span>Discover more.</span></h1>
                        <p className="dashboard-description">
                            Upload research papers, explore academic publications,
                            analyze findings and compare research with AI.
                        </p>

                        <div className="dashboard-cards">
                            <button onClick={() => setActiveTab("Upload")}>
                                <span className="dashboard-card-icon">↑</span>
                                <h3>Upload Papers</h3>
                                <p>Upload PDFs and analyze them using AI.</p>
                            </button>
                            <button onClick={() => setActiveTab("Library")}>
                                <span className="dashboard-card-icon">▤</span>
                                <h3>My Library</h3>
                                <p>Access your uploaded and analyzed papers.</p>
                            </button>
                            <button onClick={() => setActiveTab("Compare")}>
                                <span className="dashboard-card-icon">⇄</span>
                                <h3>Compare Papers</h3>
                                <p>Compare methods, algorithms and findings.</p>
                            </button>
                        </div>
                    </section>
                )}

                {activeTab === "Upload" && (
                    <section className="workspace-section">
                        <h1>Upload Research Paper</h1>
                        <p>Upload a PDF to extract and analyze its content.</p>
                        <UploadPaper onUploadSuccess={handleUploadSuccess} />
                    </section>
                )}

                {activeTab === "Explore" && (
                    <section className="workspace-section">
                        <ExplorePapers />
                    </section>
                )}

                {activeTab === "Library" && (
                    <section className="workspace-section">
                        <PaperList refreshKey={refreshKey} view="library" />
                    </section>
                )}

                {activeTab === "Compare" && (
                    <section className="workspace-section">
                        <PaperList refreshKey={refreshKey} view="compare" />
                    </section>
                )}
            </main>

            <footer className="footer">
                <p>ResearchLens. | AI-Powered Research Paper Analysis</p>
            </footer>
        </div>
    );
}

export default App;
