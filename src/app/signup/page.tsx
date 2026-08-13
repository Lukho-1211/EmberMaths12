import Link from "next/link";
import { ROLES, roleLabel } from "@/lib/roles";

export default function SignupHubPage() {
  return (
    <div className="ember-wash flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 font-display text-3xl text-ember-navy">
        EmberMaths<span className="text-ember-gold">12</span>
      </Link>
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-ember-white p-8 shadow-sm">
        <h1 className="font-display text-3xl text-ember-navy">Sign up</h1>
        <p className="mt-2 text-sm text-muted">Choose your portal to create an account.</p>
        <ul className="mt-8 space-y-3">
          {ROLES.map((role) => (
            <li key={role}>
              <Link
                href={`/signup/${role}`}
                className="flex w-full cursor-pointer items-center justify-between rounded-md border border-border px-4 py-3 text-sm font-semibold text-ember-navy transition duration-200 hover:border-ember-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
              >
                <span>{roleLabel(role)}</span>
                <span className="text-muted">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-ember-navy underline decoration-ember-gold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
