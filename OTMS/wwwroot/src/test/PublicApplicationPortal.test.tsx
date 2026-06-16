import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";

vi.mock("axios");

const mockedAxios = vi.mocked(axios);

function mockConfig(googleClientId: string = "") {
    mockedAxios.get.mockImplementation((url: string) => {
        if (url === "/api/public/apply/config") {
            return Promise.resolve({ data: { googleClientId } });
        }
        if (url === "/api/public/apply/active-positions") {
            return Promise.resolve({
                data: {
                    isSuccess: true,
                    data: [
                        { jobPositionId: "pos-1", title: "Frontend Developer" },
                        { jobPositionId: "pos-2", title: "Backend Developer" },
                    ],
                },
            });
        }
        return Promise.reject(new Error("not found"));
    });
}

describe("PublicApplicationPortal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockConfig();
    });

    it("renders the landing stage with company name", async () => {
        const { default: PublicApplicationPortal } = await import(
            "../Pages/public_application_portal/public_application_portal"
        );
        render(<PublicApplicationPortal />);

        await waitFor(() => {
            expect(screen.getByText("Speedex Courier")).toBeTruthy();
        });
    });

    it("shows the careers branding and 'We're Hiring' badge", async () => {
        const { default: PublicApplicationPortal } = await import(
            "../Pages/public_application_portal/public_application_portal"
        );
        render(<PublicApplicationPortal />);

        await waitFor(() => {
            expect(screen.getByText("Careers")).toBeTruthy();
        });
        expect(screen.getByText("We're Hiring")).toBeTruthy();
    });

    it("renders the Apply Now heading and Continue with Google button", async () => {
        const { default: PublicApplicationPortal } = await import(
            "../Pages/public_application_portal/public_application_portal"
        );
        render(<PublicApplicationPortal />);

        await waitFor(() => {
            expect(screen.getByText("Apply Now")).toBeTruthy();
        });
        expect(screen.getByText("Continue with Google")).toBeTruthy();
    });

    it("shows Google OAuth badge", async () => {
        const { default: PublicApplicationPortal } = await import(
            "../Pages/public_application_portal/public_application_portal"
        );
        render(<PublicApplicationPortal />);

        await waitFor(() => {
            expect(screen.getByText("Secured with Google OAuth")).toBeTruthy();
        });
    });
});
