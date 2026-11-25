import { useEffect, useState, type ReactNode } from "react";
import api from "../api";

interface PaperAnalysis {
  title?: string;
  research_objective?: string;
  problem_statement?: string;
  algorithms_and_models?: string[];
  methodology?: string;
  dataset?: string;
  performance_metrics?: string[];
  experimental_results?: string;
  limitations?: string[];
  future_scope?: string[];
  main_contributions?: string[];
}

interface Paper {
  _id: string;
  title: string;
  authors: string[];
  publicationYear?: number;
  algorithm?: string;
  totalPages: number;
  extractionStatus: string;
  analysisStatus: string;
  analysis?: PaperAnalysis | null;
  createdAt: string;
}

interface Comparison {
  overall_summary: string;
  similarities: any;
  differences: any;
  algorithm_comparison: any;
  dataset_comparison: any;
  performance_comparison: any;
  limitations_comparison: any;
  research_gaps: any;
}

interface ComparisonRecord {
  _id: string;
  paperIds: string[];
  paperTitles: string[];
  result: Comparison;
  createdAt: string;
  updatedAt?: string;
}

interface PaperListProps {
  refreshKey: number;
  view?: "library" | "compare";
}

function PaperList({ refreshKey, view = "library" }: PaperListProps) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [extractingId, setExtractingId] = useState("");
  const [analyzingId, setAnalyzingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [comparisonError, setComparisonError] = useState("");

  const [comparisonHistory, setComparisonHistory] = useState<
    ComparisonRecord[]
  >([]);

  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [expandedComparisons, setExpandedComparisons] = useState<string[]>([]);

  const [deletingComparisonId, setDeletingComparisonId] = useState("");

  // Fetch uploaded papers
  const fetchPapers = async () => {
    try {
      setError("");

      const response = await api.get("/papers");
      const data = response.data;

      setPapers(Array.isArray(data) ? data : (data.papers ?? []));
    } catch (error) {
      console.error("Fetch papers error:", error);
      setError("Unable to load your research library.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved comparison reports
  const fetchComparisonHistory = async () => {
    try {
      setHistoryError("");

      const response = await api.get("/papers/comparisons");
      const data = response.data;

      setComparisonHistory(
        Array.isArray(data) ? data : (data.comparisons ?? []),
      );
    } catch (error) {
      console.error("Fetch comparison history error:", error);

      setHistoryError("Unable to load comparison history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load papers whenever upload changes
  useEffect(() => {
    fetchPapers();
  }, [refreshKey]);

  // Load comparison history
  useEffect(() => {
    fetchComparisonHistory();
  }, []);

  // Expand or collapse a paper
  const toggleExpanded = (paperId: string) => {
    setExpandedIds((previous) =>
      previous.includes(paperId)
        ? previous.filter((id) => id !== paperId)
        : [...previous, paperId],
    );
  };

  // Extract PDF text
  const handleExtract = async (paperId: string) => {
    try {
      setExtractingId(paperId);

      await api.post(`/papers/${paperId}/extract`);

      await fetchPapers();
    } catch (error: any) {
      console.error("Extraction error:", error);

      alert(error.response?.data?.message || "PDF extraction failed.");
    } finally {
      setExtractingId("");
    }
  };

  // Analyze paper
  const handleAnalyze = async (paperId: string) => {
    try {
      setAnalyzingId(paperId);

      await api.post(`/papers/${paperId}/analyze`);

      await fetchPapers();

      setExpandedIds((previous) =>
        previous.includes(paperId) ? previous : [...previous, paperId],
      );
    } catch (error: any) {
      console.error("Analysis error:", error);

      alert(error.response?.data?.message || "Analysis failed.");
    } finally {
      setAnalyzingId("");
    }
  };

  // Delete paper
  const handleDelete = async (paperId: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(paperId);

      await api.delete(`/papers/${paperId}`);

      setPapers((previous) =>
        previous.filter((paper) => paper._id !== paperId),
      );

      setSelectedIds((previous) => previous.filter((id) => id !== paperId));

      setExpandedIds((previous) => previous.filter((id) => id !== paperId));
    } catch (error: any) {
      console.error("Delete error:", error);

      alert(error.response?.data?.message || "Unable to delete paper.");
    } finally {
      setDeletingId("");
    }
  };

  // Search uploaded papers
  const filteredPapers = papers.filter((paper) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    return (
      paper.title?.toLowerCase().includes(search) ||
      paper.authors?.some((author) => author.toLowerCase().includes(search)) ||
      paper.algorithm?.toLowerCase().includes(search) ||
      paper.analysis?.algorithms_and_models?.some((algorithm) =>
        algorithm.toLowerCase().includes(search),
      ) ||
      String(paper.publicationYear || "").includes(search)
    );
  });

  // Select papers for comparison
  const handleSelection = (paperId: string) => {
    setSelectedIds((previous) =>
      previous.includes(paperId)
        ? previous.filter((id) => id !== paperId)
        : [...previous, paperId],
    );
  };

  // Generate and save comparison
  const handleCompare = async () => {
    if (selectedIds.length < 2) return;

    try {
      setComparing(true);
      setComparisonError("");

      const response = await api.post("/papers/compare", {
        paperIds: selectedIds,
      });

      const savedComparison: ComparisonRecord = response.data.comparison;

      if (!savedComparison?._id) {
        throw new Error(
          "Comparison was generated, but the saved report ID was not returned.",
        );
      }

      setComparisonHistory((previous) => [
        savedComparison,
        ...previous.filter((item) => item._id !== savedComparison._id),
      ]);

      setExpandedComparisons((previous) => [
        savedComparison._id,
        ...previous.filter((id) => id !== savedComparison._id),
      ]);
    } catch (error: any) {
      console.error("Comparison error:", error);

      setComparisonError(
        error.response?.data?.message ||
          error.message ||
          "Comparison failed. Please try again.",
      );
    } finally {
      setComparing(false);
    }
  };
  // Show or hide an individual comparison report
  const toggleComparison = (comparisonId: string) => {
    setExpandedComparisons((previous) =>
      previous.includes(comparisonId)
        ? previous.filter((id) => id !== comparisonId)
        : [...previous, comparisonId],
    );
  };

  // Delete comparison report from MongoDB
  const handleDeleteComparison = async (comparisonId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this comparison report?",
    );

    if (!confirmed) return;

    try {
      setDeletingComparisonId(comparisonId);

      await api.delete(`/papers/comparisons/${comparisonId}`);

      setComparisonHistory((previous) =>
        previous.filter((item) => item._id !== comparisonId),
      );

      setExpandedComparisons((previous) =>
        previous.filter((id) => id !== comparisonId),
      );
    } catch (error: any) {
      console.error("Delete comparison error:", error);

      alert(
        error.response?.data?.message || "Unable to delete comparison report.",
      );
    } finally {
      setDeletingComparisonId("");
    }
  };

  // Render nested AI responses safely
  const renderValue = (value: any): ReactNode => {
    if (value === null || value === undefined || value === "") {
      return <span className="not-reported">Not reported</span>;
    }

    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    if (Array.isArray(value)) {
      return (
        <ul className="result-list">
          {value.map((item, index) => (
            <li key={index}>{renderValue(item)}</li>
          ))}
        </ul>
      );
    }

    if (typeof value === "object") {
      return (
        <div className="nested-results">
          {Object.entries(value).map(([key, item]) => (
            <div key={key} className="nested-result">
              <strong>{key.replaceAll("_", " ")}</strong>

              <div>{renderValue(item)}</div>
            </div>
          ))}
        </div>
      );
    }

    return String(value);
  };

  // Render paper-wise comparison in separate columns
  const renderPaperWiseComparison = (value: any): ReactNode => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return <span className="not-reported">Not reported</span>;
    }

    const entries = Array.isArray(value) ? value : [value];

    return (
      <div className="paper-wise-comparison">
        {entries.map((entry, index) => {
          if (
            entry === null ||
            typeof entry !== "object" ||
            Array.isArray(entry)
          ) {
            return (
              <div className="paper-wise-column" key={index}>
                <h4>Paper {index + 1}</h4>
                {renderValue(entry)}
              </div>
            );
          }

          const paperTitle = entry.Paper || entry.paper || `Paper ${index + 1}`;

          const details = Object.entries(entry).filter(
            ([key]) => key.toLowerCase() !== "paper",
          );

          return (
            <div className="paper-wise-column" key={index}>
              <h4>{String(paperTitle)}</h4>

              {details.length > 0 ? (
                details.map(([key, detail]) => (
                  <div className="paper-wise-detail" key={key}>
                    <strong>{key.replaceAll("_", " ")}</strong>

                    <div>{renderValue(detail)}</div>
                  </div>
                ))
              ) : (
                <span className="not-reported">No details available</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Display status labels
  const statusLabel = (status: string) => {
    if (status === "completed") return "Completed";
    if (status === "failed") return "Failed";

    return "Pending";
  };

  // Format dates
  const formatDate = (date: string) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleString();
  };

  // Statistics
  const analyzedCount = papers.filter(
    (paper) => paper.analysisStatus === "completed",
  ).length;

  // Loading state
  if (loading) {
    return <p className="loading-text">Loading your research library...</p>;
  }

  // Error state
  if (error) {
    return <p className="error-text">{error}</p>;
  }

  // Comparison view needs the papers and comparison history.
  // Library view displays only uploaded papers.
  return (
    <>
      {view === "library" && (
        <>
          {/* LIBRARY HEADING */}
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR COLLECTION</span>

              <h2>My Research Library</h2>

              <p className="section-description">
                Every paper, insight and discovery in one place.
              </p>
            </div>

            <span className="section-number">02 / LIBRARY</span>
          </div>

          {/* LIBRARY STATISTICS */}
          <div className="library-stats">
            <div>
              <span>Total papers</span>
              <strong>{papers.length}</strong>
            </div>

            <div>
              <span>Analyzed</span>
              <strong>{analyzedCount}</strong>
            </div>

            <div>
              <span>Awaiting analysis</span>
              <strong>{papers.length - analyzedCount}</strong>
            </div>
          </div>

          {papers.length === 0 ? (
            <div className="empty-library">
              <div className="empty-icon">▤</div>

              <h3>Your library is waiting.</h3>

              <p>Upload your first research paper to get started.</p>

              <a href="#upload" className="primary-link">
                Upload a paper ↗
              </a>
            </div>
          ) : (
            <>
              {/* SEARCH */}
              <div className="library-search">
                <span className="search-icon">⌕</span>

                <input
                  type="text"
                  placeholder="Search by title, author, algorithm or year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {searchTerm && (
                  <button
                    className="clear-search"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="search-count">
                Showing {filteredPapers.length} of {papers.length} papers
              </div>

              {/* PAPER CARDS */}
              <div className="paper-grid">
                {filteredPapers.length > 0 ? (
                  filteredPapers.map((paper, index) => (
                    <article className="paper-card" key={paper._id}>
                      <div className="paper-card-top">
                        <span className="paper-index">
                          PAPER {String(index + 1).padStart(2, "0")}
                        </span>

                        <span
                          className={`status-pill ${
                            paper.analysisStatus === "completed"
                              ? "completed"
                              : paper.analysisStatus === "failed"
                                ? "failed"
                                : "pending"
                          }`}
                        >
                          {statusLabel(paper.analysisStatus)}
                        </span>
                      </div>

                      <div className="document-symbol">PDF</div>

                      <h3>{paper.title}</h3>

                      <p className="paper-authors">
                        {paper.authors?.length
                          ? paper.authors.join(", ")
                          : "Author details not available"}
                      </p>

                      <div className="paper-meta">
                        <span>{paper.totalPages || "—"} pages</span>

                        <span>
                          {paper.publicationYear || "Year unavailable"}
                        </span>
                      </div>

                      <div className="paper-progress">
                        <div>
                          <span>Text extraction</span>
                          <strong>{statusLabel(paper.extractionStatus)}</strong>
                        </div>

                        <div>
                          <span>AI analysis</span>
                          <strong>{statusLabel(paper.analysisStatus)}</strong>
                        </div>
                      </div>

                      {/* PAPER ACTIONS */}
                      <div className="paper-actions">
                        <button
                          className="outline-button"
                          onClick={() => handleExtract(paper._id)}
                          disabled={
                            extractingId === paper._id ||
                            paper.extractionStatus === "completed"
                          }
                        >
                          {extractingId === paper._id
                            ? "Extracting..."
                            : paper.extractionStatus === "completed"
                              ? "Extracted ✓"
                              : "Extract text"}
                        </button>

                        <button
                          className="primary-button"
                          onClick={() => handleAnalyze(paper._id)}
                          disabled={
                            paper.extractionStatus !== "completed" ||
                            analyzingId === paper._id ||
                            paper.analysisStatus === "completed"
                          }
                        >
                          {analyzingId === paper._id
                            ? "Analyzing..."
                            : paper.analysisStatus === "completed"
                              ? "Analyzed ✓"
                              : "Analyze paper"}
                        </button>

                        <button
                          className="delete-button"
                          onClick={() => handleDelete(paper._id, paper.title)}
                          disabled={deletingId === paper._id}
                        >
                          {deletingId === paper._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>

                      {/* INSIGHTS TOGGLE */}
                      {paper.analysisStatus === "completed" && (
                        <button
                          className="text-button"
                          onClick={() => toggleExpanded(paper._id)}
                        >
                          {expandedIds.includes(paper._id)
                            ? "Close paper insights ↑"
                            : "Explore paper insights ↓"}
                        </button>
                      )}

                      {/* PAPER ANALYSIS */}
                      {expandedIds.includes(paper._id) && paper.analysis && (
                        <div className="analysis-panel">
                          <span className="eyebrow">AI-GENERATED INSIGHTS</span>

                          <h3>Paper overview</h3>

                          <div className="analysis-item">
                            <h4>Research objective</h4>
                            {renderValue(paper.analysis.research_objective)}
                          </div>

                          <div className="analysis-item">
                            <h4>Problem statement</h4>
                            {renderValue(paper.analysis.problem_statement)}
                          </div>

                          <div className="analysis-item">
                            <h4>Algorithms and models</h4>
                            {renderValue(paper.analysis.algorithms_and_models)}
                          </div>

                          <div className="analysis-item">
                            <h4>Methodology</h4>
                            {renderValue(paper.analysis.methodology)}
                          </div>

                          <div className="analysis-item">
                            <h4>Dataset</h4>
                            {renderValue(paper.analysis.dataset)}
                          </div>

                          <div className="analysis-item">
                            <h4>Performance metrics</h4>
                            {renderValue(paper.analysis.performance_metrics)}
                          </div>

                          <div className="analysis-item">
                            <h4>Experimental results</h4>
                            {renderValue(paper.analysis.experimental_results)}
                          </div>

                          <div className="analysis-item">
                            <h4>Limitations</h4>
                            {renderValue(paper.analysis.limitations)}
                          </div>

                          <div className="analysis-item">
                            <h4>Future scope</h4>
                            {renderValue(paper.analysis.future_scope)}
                          </div>

                          <div className="analysis-item">
                            <h4>Main contributions</h4>
                            {renderValue(paper.analysis.main_contributions)}
                          </div>
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <div className="empty-library">
                    <h3>No papers found.</h3>

                    <p>Try another title, author, algorithm or year.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
      {/* COMPARE VIEW */}
      {view === "compare" && (
        <section className="comparison-section" id="comparison">
          {/* COMPARISON HEADING */}
          <div className="comparison-heading">
            <div>
              <span className="eyebrow">CROSS-PAPER ANALYSIS</span>

              <h2>Find the connections.</h2>

              <p>
                Select analyzed papers to discover similarities, differences and
                potential research gaps.
              </p>
            </div>

            <div className="selection-count">
              <strong>{selectedIds.length}</strong>
              <span>selected</span>
            </div>
          </div>

          {/* PAPER SELECTION */}
          <div className="comparison-selection">
            <h3>Select papers to compare</h3>

            <p>Only papers with completed AI analysis can be compared.</p>

            {papers.filter((paper) => paper.analysisStatus === "completed")
              .length === 0 ? (
              <div className="empty-library">
                <h3>No analyzed papers available.</h3>

                <p>
                  Upload and analyze at least two research papers before
                  starting a comparison.
                </p>
              </div>
            ) : (
              <div className="paper-grid">
                {papers
                  .filter((paper) => paper.analysisStatus === "completed")
                  .map((paper) => (
                    <article className="paper-card" key={paper._id}>
                      <div className="paper-card-top">
                        <span className="paper-index">READY TO COMPARE</span>

                        <span className="status-pill completed">Analyzed</span>
                      </div>

                      <div className="document-symbol">PDF</div>

                      <h3>{paper.title}</h3>

                      <p className="paper-authors">
                        {paper.authors?.length
                          ? paper.authors.join(", ")
                          : "Author details not available"}
                      </p>

                      <div className="paper-meta">
                        <span>{paper.totalPages || "—"} pages</span>

                        <span>
                          {paper.publicationYear || "Year unavailable"}
                        </span>
                      </div>

                      <label className="compare-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(paper._id)}
                          onChange={() => handleSelection(paper._id)}
                        />
                        Select this paper
                      </label>
                    </article>
                  ))}
              </div>
            )}
          </div>

          {/* COMPARE BUTTON */}
          <button
            className="primary-button compare-button"
            onClick={handleCompare}
            disabled={selectedIds.length < 2 || comparing}
          >
            {comparing
              ? "Comparing your papers..."
              : "Compare selected papers ↗"}
          </button>

          {selectedIds.length < 2 && (
            <p className="loading-text">
              Select at least two analyzed papers to compare.
            </p>
          )}

          {comparing && (
            <p className="loading-text">
              AI is examining your selected papers. This may take a moment.
            </p>
          )}

          {comparisonError && <p className="error-text">{comparisonError}</p>}

          {/* COMPARISON HISTORY */}
          <div className="comparison-history">
            <div className="history-heading">
              <div>
                <span className="eyebrow">YOUR REPORTS</span>

                <h2>Comparison History</h2>

                <p>Access and manage your previous comparisons.</p>
              </div>

              <span className="history-count">
                {comparisonHistory.length} reports
              </span>
            </div>

            {historyLoading ? (
              <p className="loading-text">Loading comparison history...</p>
            ) : historyError ? (
              <div>
                <p className="error-text">{historyError}</p>

                <button
                  className="outline-button"
                  onClick={fetchComparisonHistory}
                >
                  Try again
                </button>
              </div>
            ) : comparisonHistory.length === 0 ? (
              <div className="empty-library">
                <h3>No comparisons yet.</h3>

                <p>
                  Select at least two analyzed papers to create your first
                  report.
                </p>
              </div>
            ) : (
              comparisonHistory.map((item, index) => (
                <article className="history-card" key={item._id}>
                  <div className="history-card-header">
                    <div>
                      <span className="paper-index">
                        COMPARISON {String(index + 1).padStart(2, "0")}
                      </span>

                      <h3>
                        {item.paperTitles?.join(" vs ") ||
                          "Research paper comparison"}
                      </h3>

                      <span className="history-date">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <div className="history-actions">
                      <button
                        className="text-button"
                        onClick={() => toggleComparison(item._id)}
                      >
                        {expandedComparisons.includes(item._id)
                          ? "Hide report ↑"
                          : "View report ↓"}
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDeleteComparison(item._id)}
                        disabled={deletingComparisonId === item._id}
                      >
                        {deletingComparisonId === item._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>

                  {/* INDIVIDUAL COMPARISON REPORT */}
                  {expandedComparisons.includes(item._id) && (
                    <div className="comparison-results">
                      <div className="results-title">
                        <span className="eyebrow">AI COMPARISON REPORT</span>

                        <h2>Your research, connected.</h2>
                      </div>

                      <div className="summary-card">
                        <h3>Overall summary</h3>

                        {renderValue(item.result?.overall_summary)}
                      </div>

                      <div className="comparison-grid">
                        {/* Similarities */}
                        <div className="comparison-result-card">
                          <h3>Similarities</h3>
                          {renderValue(item.result?.similarities)}
                        </div>

                        {/* Differences */}
                        <div className="comparison-result-card">
                          <h3>Differences</h3>
                          {renderValue(item.result?.differences)}
                        </div>

                        {/* Algorithm comparison */}
                        <div className="comparison-result-card comparison-result-card-wide">
                          <h3>Algorithm comparison</h3>
                          {renderPaperWiseComparison(
                            item.result?.algorithm_comparison,
                          )}
                        </div>

                        {/* Dataset comparison */}
                        <div className="comparison-result-card comparison-result-card-wide">
                          <h3>Dataset comparison</h3>
                          {renderPaperWiseComparison(
                            item.result?.dataset_comparison,
                          )}
                        </div>

                        {/* Performance comparison */}
                        <div className="comparison-result-card comparison-result-card-wide">
                          <h3>Performance comparison</h3>
                          {renderPaperWiseComparison(
                            item.result?.performance_comparison,
                          )}
                        </div>

                        {/* Limitations comparison */}
                        <div className="comparison-result-card comparison-result-card-wide">
                          <h3>Limitations comparison</h3>
                          {renderPaperWiseComparison(
                            item.result?.limitations_comparison,
                          )}
                        </div>
                      </div>

                      <div className="research-gaps-card">
                        <span className="eyebrow">FUTURE OPPORTUNITIES</span>

                        <h3>Potential research gaps</h3>

                        {renderValue(item.result?.research_gaps)}

                        <p className="disclaimer">
                          These are potential gaps inferred from the supplied
                          papers, not verified claims of novelty.
                        </p>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </>
  );
}

export default PaperList;
