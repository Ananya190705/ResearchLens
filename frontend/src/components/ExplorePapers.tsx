
import { useState } from "react";
import api from "../api";

interface AcademicPaper {
    id: string;
    doi: string | null;
    title: string;
    authors: string[];
    publicationYear: number | null;
    abstract: string;
    citations: number;
    isOpenAccess: boolean;
    pdfUrl: string | null;
    landingPage: string | null;
}

function ExplorePapers() {
    const [query, setQuery] = useState("");
    const [year, setYear] = useState("");
    const [papers, setPapers] = useState<AcademicPaper[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searched, setSearched] = useState(false);
    const [page, setPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    const searchPapers = async (nextPage = 1) => {
        if (!query.trim()) {
            setError("Please enter a research topic.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setSearched(true);

            const response = await api.get("/discovery/search", {
                params: {
                    query: query.trim(),
                    page: nextPage,
                    ...(year ? { year } : {})
                }
            });

            setPapers(response.data.papers || []);
            setTotalResults(response.data.totalResults || 0);
            setPage(nextPage);

        } catch (err: any) {
            console.error("Paper search error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to search academic papers."
            );
            setPapers([]);
        } finally {
            setLoading(false);
        }
    };

    const formatAuthors = (authors: string[]) => {
        if (!authors?.length) return "Author details unavailable";

        if (authors.length <= 3) {
            return authors.join(", ");
        }

        return `${authors.slice(0, 3).join(", ")} et al.`;
    };

    return (
        <section className="explore-section" id="explore">
            <div className="section-heading">
                <div>
                    <span className="eyebrow">ACADEMIC DISCOVERY</span>
                    <h2>Explore research beyond your library.</h2>
                    <p className="section-description">
                        Discover academic papers from research publications
                        around the world.
                    </p>
                </div>

                <span className="section-number">02 / EXPLORE</span>
            </div>

            {/* SEARCH FORM */}
            <div className="explore-search-card">
                <form
                    className="explore-search-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        searchPapers(1);
                    }}
                >
                    <div className="explore-search-input">
                        <span>⌕</span>
                        <input
                            type="text"
                            placeholder="Search topics, titles or keywords..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                    >
                        <option value="">All years</option>
                        {Array.from(
                            { length: 15 },
                            (_, i) => new Date().getFullYear() - i
                        ).map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading ? "Searching..." : "Search papers ↗"}
                    </button>
                </form>

                <p className="explore-hint">
                    Powered by OpenAlex · Millions of academic works
                </p>
            </div>

            {/* ERROR */}
            {error && (
                <p className="error-text explore-error">{error}</p>
            )}

            {/* LOADING */}
            {loading && (
                <div className="explore-empty">
                    <p>Searching academic publications...</p>
                </div>
            )}

            {/* RESULTS */}
            {!loading && searched && !error && (
                <div className="explore-results">
                    <div className="explore-results-heading">
                        <div>
                            <span className="eyebrow">SEARCH RESULTS</span>
                            <h3>Research discoveries</h3>
                            <p>
                                Showing {papers.length} results on this page
                            </p>
                        </div>

                        <span className="explore-total">
                            {totalResults.toLocaleString()} works found
                        </span>
                    </div>

                    {papers.length === 0 ? (
                        <div className="explore-empty">
                            <h3>No papers found.</h3>
                            <p>Try a different keyword or topic.</p>
                        </div>
                    ) : (
                        <div className="explore-paper-list">
                            {papers.map((paper) => (
                                <article
                                    className="explore-paper-card"
                                    key={paper.id}
                                >
                                    <div className="explore-paper-top">
                                        <span className="paper-index">
                                            ACADEMIC PUBLICATION
                                        </span>

                                        {paper.isOpenAccess && (
                                            <span className="open-access-label">
                                                Open Access
                                            </span>
                                        )}
                                    </div>

                                    <h3>{paper.title}</h3>

                                    <p className="explore-authors">
                                        {formatAuthors(paper.authors)}
                                    </p>

                                    <div className="explore-paper-meta">
                                        <span>
                                            {paper.publicationYear || "Year unavailable"}
                                        </span>
                                        <span>
                                            {paper.citations.toLocaleString()} citations
                                        </span>
                                    </div>

                                    <div className="explore-abstract">
                                        <strong>Abstract</strong>
                                        <p>
                                            {paper.abstract
                                                ? paper.abstract
                                                : "Abstract is not available for this publication."}
                                        </p>
                                    </div>

                                    <div className="explore-paper-actions">
                                        {paper.pdfUrl ? (
                                            <a
                                                href={paper.pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="primary-link"
                                            >
                                                View PDF ↗
                                            </a>
                                        ) : (
                                            <span className="pdf-unavailable">
                                                PDF unavailable
                                            </span>
                                        )}

                                        {paper.landingPage && (
                                            <a
                                                href={paper.landingPage}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="secondary-link"
                                            >
                                                Publication details ↗
                                            </a>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {/* PAGINATION */}
                    {papers.length > 0 && (
                        <div className="explore-pagination">
                            <button
                                className="outline-button"
                                disabled={page <= 1 || loading}
                                onClick={() => searchPapers(page - 1)}
                            >
                                ← Previous
                            </button>

                            <span>Page {page}</span>

                            <button
                                className="outline-button"
                                disabled={
                                    loading ||
                                    page * 10 >= totalResults
                                }
                                onClick={() => searchPapers(page + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!searched && (
                <div className="explore-empty">
                    <div className="empty-icon">⌕</div>
                    <h3>Your next research discovery awaits.</h3>
                    <p>
                        Search for a topic to discover related academic papers.
                    </p>
                </div>
            )}
        </section>
    );
}

export default ExplorePapers;
