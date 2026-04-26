import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Войти — MockBuddy",
};

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <SignIn />
    </div>
  );
}
