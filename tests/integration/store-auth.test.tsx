import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_PASSWORD } from "@/lib/mock/seed";

const credentialsSignIn = vi.fn();
const credentialsSignOut = vi.fn();
const signupAccount = vi.fn();
const fetchAuthSession = vi.fn();

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  getSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  credentialsSignIn: (...args: unknown[]) => credentialsSignIn(...args),
  credentialsSignOut: (...args: unknown[]) => credentialsSignOut(...args),
  signupAccount: (...args: unknown[]) => signupAccount(...args),
  fetchAuthSession: (...args: unknown[]) => fetchAuthSession(...args),
}));

const { StoreProvider, useStore } = await import("@/lib/store");

function StoreProbe() {
  const { ready, user, login, signup } = useStore();

  if (!ready) return <p>loading</p>;

  return (
    <div>
      <p data-testid="user">{user ? `${user.role}:${user.email}` : "none"}</p>
      <button
        type="button"
        onClick={async () => {
          const result = await login("student@ember12.za", DEMO_PASSWORD, "student");
          document.body.dataset.lastLogin = JSON.stringify(result);
        }}
      >
        login-student
      </button>
      <button
        type="button"
        onClick={async () => {
          const result = await login("student@ember12.za", "wrong", "student");
          document.body.dataset.lastLogin = JSON.stringify(result);
        }}
      >
        login-wrong
      </button>
      <button
        type="button"
        onClick={async () => {
          const result = await login("student@ember12.za", DEMO_PASSWORD, "teacher");
          document.body.dataset.lastLogin = JSON.stringify(result);
        }}
      >
        login-role-mismatch
      </button>
      <button
        type="button"
        onClick={async () => {
          const result = await signup({
            name: "Dup",
            email: "student@ember12.za",
            password: DEMO_PASSWORD,
            role: "student",
            province: "Gauteng",
            municipality: "City of Johannesburg",
          });
          document.body.dataset.lastSignup = JSON.stringify(result);
        }}
      >
        signup-dup
      </button>
    </div>
  );
}

describe("StoreProvider auth", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.body.dataset.lastLogin;
    delete document.body.dataset.lastSignup;
    credentialsSignIn.mockReset();
    credentialsSignOut.mockReset();
    signupAccount.mockReset();
    fetchAuthSession.mockReset();
    fetchAuthSession.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("logs in the demo student", async () => {
    credentialsSignIn.mockResolvedValue({
      ok: true,
      user: {
        id: "student-1",
        name: "Lerato Molefe",
        email: "student@ember12.za",
        role: "student",
        province: "Gauteng",
        municipality: "City of Johannesburg",
      },
    });

    const user = userEvent.setup();
    render(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("none"));
    await user.click(screen.getByRole("button", { name: "login-student" }));

    await waitFor(() => {
      expect(document.body.dataset.lastLogin).toContain('"ok":true');
      expect(screen.getByTestId("user")).toHaveTextContent("student:student@ember12.za");
    });
  });

  it("rejects wrong password", async () => {
    credentialsSignIn.mockResolvedValue({
      ok: false,
      error: "Invalid email or password.",
    });

    const user = userEvent.setup();
    render(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("none"));
    await user.click(screen.getByRole("button", { name: "login-wrong" }));

    await waitFor(() => {
      expect(document.body.dataset.lastLogin).toContain("Invalid email or password");
      expect(screen.getByTestId("user")).toHaveTextContent("none");
    });
  });

  it("rejects student credentials on teacher portal", async () => {
    credentialsSignIn.mockResolvedValue({
      ok: true,
      user: {
        id: "student-1",
        name: "Lerato Molefe",
        email: "student@ember12.za",
        role: "student",
      },
    });
    credentialsSignOut.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("none"));
    await user.click(screen.getByRole("button", { name: "login-role-mismatch" }));

    await waitFor(() => {
      expect(document.body.dataset.lastLogin).toContain("not a teacher account");
      expect(credentialsSignOut).toHaveBeenCalled();
    });
  });

  it("rejects duplicate signup email", async () => {
    signupAccount.mockResolvedValue({
      ok: false,
      error: "An account with this email already exists.",
    });

    const user = userEvent.setup();
    render(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("none"));
    await user.click(screen.getByRole("button", { name: "signup-dup" }));

    await waitFor(() => {
      expect(document.body.dataset.lastSignup).toContain("already exists");
    });
  });
});
