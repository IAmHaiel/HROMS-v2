import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
    ALL_STATUSES,
    STATUS_TRANSITIONS,
    getPageNumbers,
    fmtDate,
    fmtDateTime,
    StatusBadge,
    type RecruitmentStatus,
} from "../Pages/SystemAdmin_Dashboard/RecruitmentTab/RecruitmentTab";

// ─── Constants ───────────────────────────────────────────────────────────────

describe("ALL_STATUSES", () => {
    it("contains exactly four statuses", () => {
        expect(ALL_STATUSES).toEqual([
            "Pending Review",
            "Interview Scheduled",
            "Job Offered",
            "Rejected",
        ]);
    });
});

describe("STATUS_TRANSITIONS", () => {
    it("Pending Review allows Interview Scheduled and Rejected", () => {
        expect(STATUS_TRANSITIONS["Pending Review"]).toEqual([
            "Interview Scheduled",
            "Rejected",
        ]);
    });

    it("Interview Scheduled allows Job Offered and Rejected", () => {
        expect(STATUS_TRANSITIONS["Interview Scheduled"]).toEqual([
            "Job Offered",
            "Rejected",
        ]);
    });

    it("Job Offered allows only Rejected", () => {
        expect(STATUS_TRANSITIONS["Job Offered"]).toEqual(["Rejected"]);
    });

    it("Rejected allows no transitions", () => {
        expect(STATUS_TRANSITIONS["Rejected"]).toEqual([]);
    });

    it("every status has a defined transition entry", () => {
        for (const s of ALL_STATUSES) {
            expect(STATUS_TRANSITIONS[s]).toBeDefined();
            expect(Array.isArray(STATUS_TRANSITIONS[s])).toBe(true);
        }
    });

    it("Rejected appears in every other status's transitions", () => {
        for (const s of ALL_STATUSES) {
            if (s !== "Rejected") {
                expect(STATUS_TRANSITIONS[s]).toContain("Rejected");
            }
        }
    });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

describe("getPageNumbers", () => {
    it("returns [1] when total is 1", () => {
        expect(getPageNumbers(1, 1)).toEqual([1]);
    });

    it("returns [1,2,3] when total is 3 and current is 2", () => {
        expect(getPageNumbers(3, 2)).toEqual([1, 2, 3]);
    });

    it("returns [1,2,3,4,5] when total is 5 and current is 3", () => {
        expect(getPageNumbers(5, 3)).toEqual([1, 2, 3, 4, 5]);
    });

    it("shows ellipsis for many pages near the start", () => {
        const result = getPageNumbers(10, 1);
        expect(result[0]).toBe(1);
        expect(result[result.length - 1]).toBe(10);
        expect(result).toContain("...");
    });

    it("shows ellipsis for many pages near the end", () => {
        const result = getPageNumbers(10, 10);
        expect(result[0]).toBe(1);
        expect(result[result.length - 1]).toBe(10);
        expect(result).toContain("...");
    });
});

describe("fmtDate", () => {
    it("formats ISO date to short date string", () => {
        const result = fmtDate("2025-06-01T08:30:00Z");
        expect(result).toBe("Jun 1, 2025");
    });

    it("handles different dates", () => {
        expect(fmtDate("2024-12-25T00:00:00Z")).toBe("Dec 25, 2024");
        expect(fmtDate("2025-01-01T00:00:00Z")).toBe("Jan 1, 2025");
    });
});

describe("fmtDateTime", () => {
    it("formats date and time together", () => {
        const result = fmtDateTime("2025-06-20", "10:00");
        expect(result).toContain("Jun 20, 2025");
        expect(result).toContain("10:00");
    });

    it("includes day of week and AM/PM", () => {
        const result = fmtDateTime("2025-06-20", "14:30");
        expect(result).toContain("Fri");
        expect(result).toContain("PM");
    });
});

// ─── Components ─────────────────────────────────────────────────────────────

describe("StatusBadge", () => {
    it("renders Pending Review badge", () => {
        const { container } = render(<StatusBadge status={"Pending Review"} />);
        expect(container.textContent).toContain("Pending Review");
    });

    it("renders Interview Scheduled badge", () => {
        const { container } = render(<StatusBadge status={"Interview Scheduled"} />);
        expect(container.textContent).toContain("Interview Scheduled");
    });

    it("renders Job Offered badge", () => {
        const { container } = render(<StatusBadge status={"Job Offered"} />);
        expect(container.textContent).toContain("Job Offered");
    });

    it("renders Rejected badge", () => {
        const { container } = render(<StatusBadge status={"Rejected"} />);
        expect(container.textContent).toContain("Rejected");
    });
});
