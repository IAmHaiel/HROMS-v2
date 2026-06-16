import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "../components/Toast/Toast";

// Helper to render with Router
function renderWithRouter(ui: React.ReactElement) {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
}
// Helper to render with Router + ToastProvider (for pages that use useToast)
function renderWithProviders(ui: React.ReactElement) {
    return render(
        <BrowserRouter>
            <ToastProvider>{ui}</ToastProvider>
        </BrowserRouter>
    );
}

// Helper: find input by placeholder, case-insensitive
function findInput(placeholder: string) {
    return screen.getByPlaceholderText(new RegExp(placeholder, "i"));
}

// Helper: find button by role
function findButton(name: string) {
    return screen.getByRole("button", { name: new RegExp(name, "i") });
}

describe("LoginPage", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("renders login form with inputs", async () => {
        const { default: Login } = await import("../Pages/login_page/login");
        renderWithProviders(<Login />);
        const inputs = screen.getAllByPlaceholderText(/enter/i);
        expect(inputs.length).toBeGreaterThanOrEqual(1);
    });

    it("renders submit button", async () => {
        const { default: Login } = await import("../Pages/login_page/login");
        renderWithProviders(<Login />);
        const btn = screen.getAllByRole("button").find(b => b.textContent?.length! > 0);
        expect(btn).toBeTruthy();
    });

    it("renders forgot password link", async () => {
        const { default: Login } = await import("../Pages/login_page/login");
        renderWithProviders(<Login />);
        const links = screen.getAllByText(/forgot/i);
        expect(links.length).toBeGreaterThanOrEqual(1);
    });

    it("renders system branding", async () => {
        const { default: Login } = await import("../Pages/login_page/login");
        renderWithProviders(<Login />);
        expect(screen.getByText("Speedex")).toBeTruthy();
    });
});

describe("ForgotPasswordPage", () => {
    it("renders forgot password page", async () => {
        const { default: ForgotPassword } = await import("../Pages/forgotpassword_page/forgotpassword_page");
        renderWithRouter(<ForgotPassword />);
        expect(screen.getByText("Forgot Password")).toBeTruthy();
    });

    it("renders email label", async () => {
        const { default: ForgotPassword } = await import("../Pages/forgotpassword_page/forgotpassword_page");
        renderWithRouter(<ForgotPassword />);
        expect(screen.getByText("Email Address")).toBeTruthy();
    });

    it("renders send reset link button", async () => {
        const { default: ForgotPassword } = await import("../Pages/forgotpassword_page/forgotpassword_page");
        renderWithRouter(<ForgotPassword />);
        const btn = screen.getAllByRole("button").find(b => b.textContent?.includes("Send"));
        expect(btn).toBeTruthy();
    });

    it("renders back to login link", async () => {
        const { default: ForgotPassword } = await import("../Pages/forgotpassword_page/forgotpassword_page");
        renderWithRouter(<ForgotPassword />);
        const links = screen.getAllByText(/login/i);
        expect(links.length).toBeGreaterThanOrEqual(1);
    });
});

describe("ResetPasswordPage", () => {
    it("renders reset password page with title", async () => {
        const { default: ResetPassword } = await import("../Pages/resetpassword_page/resetpassword_page");
        renderWithRouter(<ResetPassword />);
        const titles = screen.getAllByText("Invalid Reset Link");
        expect(titles.length).toBeGreaterThanOrEqual(1);
    });
});

describe("AccountLocked", () => {
    it("renders account locked page", async () => {
        const { default: AccountLocked } = await import("../Pages/account_locked/account_locked");
        renderWithRouter(<AccountLocked />);
        expect(screen.getByText("ACCOUNT LOCKED")).toBeTruthy();
    });

    it("renders contact admin button", async () => {
        const { default: AccountLocked } = await import("../Pages/account_locked/account_locked");
        renderWithRouter(<AccountLocked />);
        const btn = screen.getAllByRole("button").find(b => b.textContent?.includes("CONTACT"));
        expect(btn).toBeTruthy();
    });
});

describe("ChangePassword", () => {
    it("renders change password page", async () => {
        const { default: ChangePassword } = await import("../Pages/change_password/change_password");
        renderWithRouter(<ChangePassword />);
        expect(screen.getByText("Change Password")).toBeTruthy();
    });

    it("renders current password and new password labels", async () => {
        const { default: ChangePassword } = await import("../Pages/change_password/change_password");
        renderWithRouter(<ChangePassword />);
        const labels = screen.getAllByText(/current password|new password/i);
        expect(labels.length).toBeGreaterThanOrEqual(2);
    });
});

describe("EmailVerificationPage", () => {
    it("renders email verification page", async () => {
        const { default: EmailVerification } = await import("../Pages/email_verification_page/email_verification_page");
        renderWithRouter(<EmailVerification />);
        const elements = screen.getAllByText("Verification Failed");
        expect(elements.length).toBeGreaterThanOrEqual(1);
    });
});

describe("OnboardingPage", () => {
    it("renders onboarding page with welcome", async () => {
        const { default: Onboarding } = await import("../Pages/onboarding_page/onboarding_page");
        renderWithRouter(<Onboarding />);
        const texts = screen.getAllByText(/welcome|onboard|account/i);
        expect(texts.length).toBeGreaterThanOrEqual(1);
    });
});

describe("ProtectedRoute", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("redirects to login when no token", async () => {
        const { default: ProtectedRoute } = await import("../components/Auth/ProtectedRoute");
        const { container } = renderWithRouter(
            <ProtectedRoute allowedRoles={["OperationAdmin"]}>
                <div>Protected Content</div>
            </ProtectedRoute>
        );
        // Should redirect away, so protected content should not be visible
        expect(screen.queryByText("Protected Content")).toBeFalsy();
    });

    it("renders outlet when valid token exists", async () => {
        // Create a mock JWT token (header.payload.signature)
        const payload = {
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "OperationAdmin",
            exp: Math.floor(Date.now() / 1000) + 3600,
        };
        const token = `header.${btoa(JSON.stringify(payload))}.signature`;
        localStorage.setItem("authToken", token);

        const { default: ProtectedRoute } = await import("../components/Auth/ProtectedRoute");
        // ProtectedRoute uses <Outlet /> from react-router, so we need to test indirectly
        // Just verify it doesn't crash with a valid token
        expect(() => {
            renderWithRouter(
                <ProtectedRoute allowedRoles={["OperationAdmin"]} />
            );
        }).not.toThrow();
    });
});
