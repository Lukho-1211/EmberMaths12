import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const push = vi.fn();
const credentialsSignIn = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, prefetch: vi.fn() }),
  useParams: () => ({ role: "student" }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/login/student",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  getSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  credentialsSignIn: (...args: unknown[]) => credentialsSignIn(...args),
  credentialsSignOut: vi.fn(),
  signupAccount: vi.fn(),
  fetchAuthSession: vi.fn().mockResolvedValue(null),
}));

const { default: RoleLoginPage } = await import("@/app/login/[role]/page");
const { StoreProvider } = await import("@/lib/store");

describe("RoleLoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    replace.mockClear();
    push.mockClear();
    credentialsSignIn.mockReset();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("shows an error for invalid credentials", async () => {
    credentialsSignIn.mockResolvedValue({
      ok: false,
      error: "Invalid email or password.",
    });

    const user = userEvent.setup();
    render(
      <StoreProvider>
        <RoleLoginPage />
      </StoreProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /student log in/i })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^email$/i), "nobody@ember12.za");
    await user.type(screen.getByLabelText(/^password$/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
    expect(push).not.toHaveBeenCalled();
  });
});
