import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StatCard } from "../components/StatCard/StatCard";
import ActionButton from "../components/ActionButton/ActionButton";
import ConfirmationModal from "../components/ConfirmationModal/ConfirmationModal";
import { ApprovalTracker, TrackerData } from "../components/ApprovalTracker/ApprovalTracker";

describe("StatCard", () => {
    it("renders label and value", () => {
        render(<StatCard icon={<span>🔵</span>} label="Total Tasks" value="42" />);
        expect(screen.getByText("Total Tasks")).toBeTruthy();
        expect(screen.getByText("42")).toBeTruthy();
    });

    it("renders subtext when provided", () => {
        render(<StatCard icon={<span>🟢</span>} label="Completed" value="10" subtext="Finished tasks" />);
        expect(screen.getByText("Finished tasks")).toBeTruthy();
    });

    it("does not render subtext when not provided", () => {
        const { container } = render(<StatCard icon={<span>🔴</span>} label="Overdue" value="3" />);
        expect(container.querySelector(".stat-subtext")).toBeFalsy();
    });

    it("applies variant class", () => {
        const { container } = render(<StatCard icon={<span>🟡</span>} label="Active" value="5" variant="warning" />);
        expect(container.querySelector(".accent-warning")).toBeTruthy();
        expect(container.querySelector(".bg-warning")).toBeTruthy();
    });

    it("defaults to primary variant", () => {
        const { container } = render(<StatCard icon={<span>🔵</span>} label="Default" value="0" />);
        expect(container.querySelector(".accent-primary")).toBeTruthy();
    });

    it("renders with number value", () => {
        render(<StatCard icon={<span>🔵</span>} label="Count" value={99} />);
        expect(screen.getByText("99")).toBeTruthy();
    });

    it("accepts additional className", () => {
        const { container } = render(<StatCard icon={<span>🔵</span>} label="Test" value="1" className="extra-class" />);
        expect(container.querySelector(".extra-class")).toBeTruthy();
    });
});

describe("ActionButton", () => {
    it("renders children text", () => {
        render(<ActionButton>New Task</ActionButton>);
        expect(screen.getByText("New Task")).toBeTruthy();
    });

    it("renders with icon", () => {
        const { container } = render(<ActionButton icon={<span>➕</span>}>Add</ActionButton>);
        expect(screen.getByText("Add")).toBeTruthy();
        expect(container.querySelector(".action-btn-icon")).toBeTruthy();
    });

    it("fires onClick when clicked", () => {
        const onClick = vi.fn();
        render(<ActionButton onClick={onClick}>Click Me</ActionButton>);
        fireEvent.click(screen.getByText("Click Me"));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("respects disabled prop", () => {
        const onClick = vi.fn();
        render(<ActionButton onClick={onClick} disabled>Disabled</ActionButton>);
        const btn = screen.getByText("Disabled").closest("button");
        expect(btn?.disabled).toBe(true);
    });

    it("applies className", () => {
        const { container } = render(<ActionButton className="custom-btn">Styled</ActionButton>);
        expect(container.querySelector(".custom-btn")).toBeTruthy();
    });

    it("renders without icon", () => {
        const { container } = render(<ActionButton>No Icon</ActionButton>);
        expect(container.querySelector(".action-btn-icon")).toBeFalsy();
    });
});

describe("ConfirmationModal", () => {
    it("renders when isOpen is true", () => {
        render(
            <ConfirmationModal
                isOpen={true}
                title="Delete Item"
                description="Are you sure?"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(screen.getByText("Delete Item")).toBeTruthy();
        expect(screen.getByText("Are you sure?")).toBeTruthy();
    });

    it("does not render when isOpen is false", () => {
        const { container } = render(
            <ConfirmationModal
                isOpen={false}
                title="Hidden"
                description="Should not appear"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(screen.queryByText("Hidden")).toBeFalsy();
    });

    it("calls onConfirm when confirm button clicked", () => {
        const onConfirm = vi.fn();
        render(
            <ConfirmationModal
                isOpen={true}
                title="Confirm Me"
                description="Proceed?"
                variant="info"
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        );
        // Find the confirm button by its role (it's a button inside cm-actions)
        const buttons = screen.getAllByRole("button");
        const confirmBtn = buttons.find(b => b.classList.contains("cm-btn-confirm"));
        expect(confirmBtn).toBeTruthy();
        fireEvent.click(confirmBtn!);
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when cancel button clicked", () => {
        const onCancel = vi.fn();
        render(
            <ConfirmationModal
                isOpen={true}
                title="Cancel Test"
                description="Cancel?"
                onConfirm={vi.fn()}
                onCancel={onCancel}
            />
        );
        fireEvent.click(screen.getByText("Cancel"));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("shows danger variant with Delete label", () => {
        render(
            <ConfirmationModal
                isOpen={true}
                title="Danger"
                description="Delete this?"
                variant="danger"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(screen.getByText("Delete")).toBeTruthy();
    });

    it("shows custom confirm label when provided", () => {
        render(
            <ConfirmationModal
                isOpen={true}
                title="Custom"
                description="Test"
                confirmLabel="Yes, Do It"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(screen.getByText("Yes, Do It")).toBeTruthy();
    });
});

describe("ApprovalTracker", () => {
    const pendingTracker: TrackerData = {
        approvalRequestId: "req-1",
        requestType: "Leave",
        statusTrackingText: "Pending Supervisor Approval",
        currentTierLevel: 1,
        totalTierCount: 2,
        currentTierLabel: "Supervisor",
        currentApproverName: "John Manager",
        status: "Pending",
        createdAt: new Date().toISOString(),
        decisions: [],
    };

    const approvedTracker: TrackerData = {
        approvalRequestId: "req-2",
        requestType: "Leave",
        statusTrackingText: "Approved",
        currentTierLevel: 2,
        totalTierCount: 2,
        status: "Approved",
        createdAt: new Date().toISOString(),
        decisions: [
            { tierLevel: 1, approverName: "John Manager", decision: "Approve", createdAt: new Date().toISOString() },
            { tierLevel: 2, approverName: "HR Admin", decision: "Approve", createdAt: new Date().toISOString() },
        ],
    };

    const rejectedTracker: TrackerData = {
        approvalRequestId: "req-3",
        requestType: "Leave",
        statusTrackingText: "Rejected by Supervisor",
        currentTierLevel: 1,
        totalTierCount: 2,
        status: "Rejected",
        createdAt: new Date().toISOString(),
        decisions: [
            { tierLevel: 1, approverName: "John Manager", decision: "Reject", remarks: "Not enough notice", createdAt: new Date().toISOString() },
        ],
    };

    it("renders status tracking text", () => {
        render(<ApprovalTracker tracker={pendingTracker} />);
        expect(screen.getByText("Pending Supervisor Approval")).toBeTruthy();
    });

    it("renders request type", () => {
        render(<ApprovalTracker tracker={pendingTracker} />);
        const elements = screen.getAllByText(/Leave/);
        expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it("renders status tracking text", () => {
        render(<ApprovalTracker tracker={pendingTracker} />);
        const elements = screen.getAllByText(/Pending/);
        expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it("renders approved badge for approved requests", () => {
        render(<ApprovalTracker tracker={approvedTracker} />);
        expect(screen.getByText("Fully Approved")).toBeTruthy();
    });

    it("renders decision approver names", () => {
        render(<ApprovalTracker tracker={approvedTracker} />);
        const elements = screen.getAllByText("John Manager");
        expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it("rejection tracker renders rejected status", () => {
        render(<ApprovalTracker tracker={rejectedTracker} />);
        const elements = screen.getAllByText("Rejected");
        expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it("renders in compact mode", () => {
        const { container } = render(<ApprovalTracker tracker={pendingTracker} compact />);
        expect(container.querySelector(".at-container")).toBeTruthy();
    });

    it("renders footer with request ID", () => {
        render(<ApprovalTracker tracker={pendingTracker} />);
        expect(screen.getByText(/req-1/)).toBeTruthy();
    });
});
