import { Brand } from "@/components/landing/brand";
import { GuestOnly } from "@/components/guest-only";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-lime-50 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Brand size="lg" priority className="mx-auto origin-center" />
          <p className="mt-2 text-sm text-gray-500">
            Apprends en t&apos;amusant
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
          <GuestOnly>{children}</GuestOnly>
        </div>
      </div>
    </div>
  );
}
