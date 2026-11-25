
import axios from "axios";

export const searchAcademicPapers = async (req, res) => {
    try {
        const { query, page = 1, year } = req.query;

        if (!query || !query.trim()) {
            return res.status(400).json({
                message: "Please enter a search topic."
            });
        }

        const params = {
            search: query.trim(),
            page: Math.max(1, Number(page) || 1),
            per_page: 10,
            sort: "relevance_score:desc",
            select: [
                "id",
                "doi",
                "display_name",
                "publication_year",
                "authorships",
                "abstract_inverted_index",
                "open_access",
                "cited_by_count",
                "primary_location"
            ].join(",")
        };

        if (year) {
            params.filter =
                `from_publication_date:${year}-01-01,to_publication_date:${year}-12-31`;
        }

        const response = await axios.get(
            "https://api.openalex.org/works",
            {
                params,
                timeout: 20000,
                headers: {
                    Accept: "application/json"
                }
            }
        );

        const papers = (response.data.results || []).map((paper) => {
            const authors = (paper.authorships || [])
                .map((item) => item.author?.display_name)
                .filter(Boolean);

            return {
                id: paper.id,
                doi: paper.doi,
                title: paper.display_name || "Untitled paper",
                authors,
                publicationYear: paper.publication_year,
                abstract: reconstructAbstract(
                    paper.abstract_inverted_index
                ),
                citations: paper.cited_by_count || 0,
                isOpenAccess: paper.open_access?.is_oa || false,
                pdfUrl:
                    paper.open_access?.oa_url ||
                    paper.primary_location?.pdf_url ||
                    null,
                landingPage:
                    paper.primary_location?.landing_page_url ||
                    (paper.doi ? `https://doi.org/${paper.doi}` : null)
            };
        });

        return res.status(200).json({
            message: "Academic papers retrieved successfully",
            totalResults: response.data.meta?.count || 0,
            page: Number(page),
            papers
        });

    } catch (error) {
        console.error("OpenAlex API error:", {
            message: error.message,
            status: error.response?.status,
            details: error.response?.data
        });

        return res.status(500).json({
            message: "Unable to search academic papers.",
            error: error.response?.data?.message ||
                error.response?.data?.error ||
                error.message
        });
    }
};

// Convert OpenAlex inverted abstract into readable text.
function reconstructAbstract(invertedIndex) {
    if (!invertedIndex) return "";

    const words = [];

    for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const position of positions) {
            words[position] = word;
        }
    }

    return words.filter(Boolean).join(" ");
}
